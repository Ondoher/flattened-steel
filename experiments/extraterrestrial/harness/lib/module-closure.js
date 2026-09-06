import { builtinModules, createRequire } from 'node:module';
import {
	lstat,
	readFile,
	realpath,
} from 'node:fs/promises';
import path from 'node:path';

import {
	EXPERIMENT_NODE_MODULES_ROOT,
	EXPERIMENT_PACKAGE_PATH,
	EXPERIMENT_ROOT,
	assertLexicallyContained,
	isPathContained,
	pathComparisonKey,
} from './roots.js';

export const MODULE_CLOSURE_SCHEMA_ID =
	'algorithm32-extraterrestrial-static-module-closure-v1';

const BUILTIN_MODULE_NAMES = new Set([
	...builtinModules,
	...builtinModules.map((name) => `node:${name}`),
]);

function compareStrings(left, right) {
	if (left < right) {
		return -1;
	}
	if (left > right) {
		return 1;
	}
	return 0;
}

function portableRelative(root, value) {
	return path.relative(root, value).split(path.sep).join('/');
}

function normalizeCandidateRelativePath(value) {
	const normalized = path.posix.normalize(value.replaceAll('\\', '/'));
	if (
		normalized === '.'
		|| normalized === '..'
		|| normalized.startsWith('../')
		|| path.posix.isAbsolute(normalized)
		|| /^[a-zA-Z]:/.test(normalized)
	) {
		throw new Error(`Candidate module path escapes its root: ${value}`);
	}
	return normalized;
}

/**
 * Identify copied production verification code which must remain inert.
 *
 * @param {string} relativePath - Supplies a slash-normalized copied path.
 * @returns {boolean} True when the path cannot enter a runnable closure.
 */
export function isExcludedCandidateRunnablePath(relativePath) {
	const normalized = normalizeCandidateRelativePath(relativePath);
	const segments = normalized.split('/');
	const baseName = segments.at(-1);
	return segments.includes('_tests')
		|| segments.includes('tests')
		|| /\.(?:spec|test|browser)\.[cm]?[jt]sx?$/i.test(baseName)
		|| /\.star-parity\.[cm]?[jt]sx?$/i.test(baseName);
}

/**
 * Return the explicit, sorted list of copied verification files.
 *
 * @param {{files: Array<{path: string}>}} inventory - Supplies source files.
 * @returns {string[]} The inert copied paths.
 */
export function listExcludedCopiedFiles(inventory) {
	return inventory.files
		.map((entry) => entry.path)
		.filter(isExcludedCandidateRunnablePath)
		.sort(compareStrings);
}

function tokenizeJavaScript(source, sourceLabel) {
	const tokens = [];
	let index = 0;
	let braceDepth = 0;

	function isIdentifierStart(character) {
		return /[A-Za-z_$]/.test(character);
	}
	function isIdentifierPart(character) {
		return /[A-Za-z0-9_$]/.test(character);
	}
	function canStartRegularExpression() {
		const previous = tokens.at(-1);
		if (!previous) {
			return true;
		}
		if (
			previous.type === 'identifier'
			&& [
				'await',
				'case',
				'delete',
				'do',
				'else',
				'in',
				'instanceof',
				'new',
				'of',
				'return',
				'throw',
				'typeof',
				'void',
				'yield',
			].includes(previous.value)
		) {
			return true;
		}
		return previous.type === 'punctuation'
			&& '([{:;,=!?&|+-*%^~<>'.includes(previous.value);
	}

	while (index < source.length) {
		const character = source[index];
		const next = source[index + 1];
		if (/\s/.test(character)) {
			index += 1;
			continue;
		}
		if (character === '/' && next === '/') {
			index += 2;
			while (index < source.length && !/[\r\n]/.test(source[index])) {
				index += 1;
			}
			continue;
		}
		if (character === '/' && next === '*') {
			const commentStart = index;
			index += 2;
			while (
				index < source.length
				&& !(source[index] === '*' && source[index + 1] === '/')
			) {
				index += 1;
			}
			if (index >= source.length) {
				throw new Error(
					`Unterminated block comment in ${sourceLabel} at ${commentStart}.`,
				);
			}
			index += 2;
			continue;
		}
		if (character === '/' && canStartRegularExpression()) {
			const expressionStart = index;
			let inCharacterClass = false;
			let closed = false;
			index += 1;
			while (index < source.length) {
				if (source[index] === '\\') {
					index += 2;
					continue;
				}
				if (source[index] === '[') {
					inCharacterClass = true;
					index += 1;
					continue;
				}
				if (source[index] === ']' && inCharacterClass) {
					inCharacterClass = false;
					index += 1;
					continue;
				}
				if (source[index] === '/' && !inCharacterClass) {
					index += 1;
					while (/[A-Za-z]/.test(source[index] ?? '')) {
						index += 1;
					}
					closed = true;
					break;
				}
				if (/[\r\n]/.test(source[index])) {
					throw new Error(
						`Unterminated regular expression in ${sourceLabel} at `
						+ `${expressionStart}.`,
					);
				}
				index += 1;
			}
			if (!closed) {
				throw new Error(
					`Unterminated regular expression in ${sourceLabel} at `
					+ `${expressionStart}.`,
				);
			}
			tokens.push({
				type: 'regular-expression',
				value: '',
				index: expressionStart,
				braceDepth,
			});
			continue;
		}
		if (character === '"' || character === '\'') {
			const quote = character;
			const stringStart = index;
			index += 1;
			let value = '';
			let escaped = false;
			while (index < source.length && source[index] !== quote) {
				if (/[\r\n]/.test(source[index])) {
					throw new Error(
						`Unterminated string in ${sourceLabel} at ${stringStart}.`,
					);
				}
				if (source[index] === '\\') {
					escaped = true;
					value += source.slice(index, index + 2);
					index += 2;
					continue;
				}
				value += source[index];
				index += 1;
			}
			if (index >= source.length) {
				throw new Error(
					`Unterminated string in ${sourceLabel} at ${stringStart}.`,
				);
			}
			index += 1;
			tokens.push({
				type: 'string',
				value,
				index: stringStart,
				braceDepth,
				escaped,
			});
			continue;
		}
		if (character === '`') {
			const templateStart = index;
			index += 1;
			while (index < source.length) {
				if (source[index] === '\\') {
					index += 2;
					continue;
				}
				if (source[index] === '`') {
					index += 1;
					break;
				}
				index += 1;
			}
			if (index > source.length || source[index - 1] !== '`') {
				throw new Error(
					`Unterminated template literal in ${sourceLabel} at `
					+ `${templateStart}.`,
				);
			}
			tokens.push({
				type: 'template',
				value: '',
				index: templateStart,
				braceDepth,
			});
			continue;
		}
		if (isIdentifierStart(character)) {
			const tokenStart = index;
			index += 1;
			while (
				index < source.length
				&& isIdentifierPart(source[index])
			) {
				index += 1;
			}
			tokens.push({
				type: 'identifier',
				value: source.slice(tokenStart, index),
				index: tokenStart,
				braceDepth,
			});
			continue;
		}

		tokens.push({
			type: 'punctuation',
			value: character,
			index,
			braceDepth,
		});
		if (character === '{') {
			braceDepth += 1;
		} else if (character === '}') {
			braceDepth = Math.max(0, braceDepth - 1);
		}
		index += 1;
	}
	return tokens;
}

/**
 * Extract static ESM imports and re-exports while rejecting runtime-loaded
 * module forms. JSDoc import types are ignored because comments are tokenized
 * out before inspection.
 *
 * @param {string} source - Supplies JavaScript source text.
 * @param {string} [sourceLabel='<source>'] - Supplies a diagnostic label.
 * @returns {Array<{form: 'import' | 're-export', specifier: string}>} References.
 */
export function extractStaticModuleReferences(
	source,
	sourceLabel = '<source>',
) {
	const tokens = tokenizeJavaScript(source, sourceLabel);
	const references = [];
	for (let tokenIndex = 0; tokenIndex < tokens.length; tokenIndex += 1) {
		const token = tokens[tokenIndex];
		if (token.type !== 'identifier') {
			continue;
		}
		const next = tokens[tokenIndex + 1];
		if (
			(token.value === 'import' || token.value === 'require')
			&& next?.value === '('
		) {
			throw new Error(
				`${token.value}() is prohibited in ${sourceLabel} at `
				+ `character ${token.index}.`,
			);
		}
		if (token.braceDepth !== 0) {
			continue;
		}
		if (token.value === 'import') {
			if (next?.value === '.') {
				continue;
			}
			if (next?.type === 'string') {
				if (next.escaped) {
					throw new Error(
						`Escaped module specifiers are unsupported in `
						+ `${sourceLabel}.`,
					);
				}
				references.push({
					form: 'import',
					specifier: next.value,
				});
				continue;
			}
			for (
				let searchIndex = tokenIndex + 1;
				searchIndex < tokens.length;
				searchIndex += 1
			) {
				const candidate = tokens[searchIndex];
				if (candidate.value === ';') {
					break;
				}
				if (
					candidate.type === 'identifier'
					&& candidate.value === 'from'
				) {
					const specifier = tokens[searchIndex + 1];
					if (specifier?.type !== 'string') {
						throw new Error(
							`Import from clause lacks a literal specifier in `
							+ `${sourceLabel}.`,
						);
					}
					if (specifier.escaped) {
						throw new Error(
							`Escaped module specifiers are unsupported in `
							+ `${sourceLabel}.`,
						);
					}
					references.push({
						form: 'import',
						specifier: specifier.value,
					});
					break;
				}
			}
			continue;
		}
		if (
			token.value === 'export'
			&& (next?.value === '{' || next?.value === '*')
		) {
			for (
				let searchIndex = tokenIndex + 1;
				searchIndex < tokens.length;
				searchIndex += 1
			) {
				const candidate = tokens[searchIndex];
				if (candidate.value === ';') {
					break;
				}
				if (
					candidate.type === 'identifier'
					&& candidate.value === 'from'
				) {
					const specifier = tokens[searchIndex + 1];
					if (specifier?.type !== 'string') {
						throw new Error(
							`Re-export from clause lacks a literal specifier in `
							+ `${sourceLabel}.`,
						);
					}
					if (specifier.escaped) {
						throw new Error(
							`Escaped module specifiers are unsupported in `
							+ `${sourceLabel}.`,
						);
					}
					references.push({
						form: 're-export',
						specifier: specifier.value,
					});
					break;
				}
			}
		}
	}
	return references;
}

function packageNameFromSpecifier(specifier) {
	const segments = specifier.split('/');
	if (specifier.startsWith('@')) {
		if (segments.length < 2 || !segments[1]) {
			throw new Error(`Invalid scoped package specifier: ${specifier}`);
		}
		return `${segments[0]}/${segments[1]}`;
	}
	return segments[0];
}

async function assertPlainFile(filePath, label) {
	const stats = await lstat(filePath);
	if (stats.isSymbolicLink() || !stats.isFile()) {
		throw new Error(`${label} is not a plain regular file: ${filePath}`);
	}
	const resolved = await realpath(filePath);
	if (pathComparisonKey(resolved) !== pathComparisonKey(filePath)) {
		throw new Error(
			`${label} resolves through a link or reparse point: `
			+ `${filePath} -> ${resolved}`,
		);
	}
	return resolved;
}

async function loadDependencyBoundary(packageJsonPath) {
	const packageText = await readFile(packageJsonPath, 'utf8');
	const packageData = JSON.parse(packageText);
	const dependencies = packageData.dependencies ?? {};
	if (
		dependencies === null
		|| typeof dependencies !== 'object'
		|| Array.isArray(dependencies)
	) {
		throw new Error('Experiment package dependencies must be an object.');
	}
	for (const [name, version] of Object.entries(dependencies)) {
		if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
			throw new Error(
				`Experiment dependency ${name} is not pinned exactly: ${version}`,
			);
		}
	}
	return Object.freeze({ ...dependencies });
}

/**
 * Recursively inspect all internal static imports reachable from entryFiles.
 * Bare packages are validated but their installed package internals are not
 * folded into the candidate-owned closure.
 *
 * @param {{
 *   candidateRoot: string,
 *   entryFiles: string[],
 *   packageJsonPath?: string,
 *   nodeModulesRoot?: string,
 *   allowedNodeBuiltins?: string[],
 * }} configuration - Supplies closure inputs.
 * @returns {Promise<object>} The sorted closure description.
 */
export async function buildStaticModuleClosure(configuration) {
	const candidateRoot = path.resolve(configuration.candidateRoot);
	const packageJsonPath = path.resolve(
		configuration.packageJsonPath ?? EXPERIMENT_PACKAGE_PATH,
	);
	const nodeModulesRoot = path.resolve(
		configuration.nodeModulesRoot ?? EXPERIMENT_NODE_MODULES_ROOT,
	);
	const dependencies = await loadDependencyBoundary(packageJsonPath);
	const allowedNodeBuiltins = new Set(
		configuration.allowedNodeBuiltins ?? [],
	);
	for (const specifier of allowedNodeBuiltins) {
		if (!BUILTIN_MODULE_NAMES.has(specifier)) {
			throw new Error(
				`Allowed Node built-in is not a canonical built-in: ${specifier}.`,
			);
		}
	}
	const localRequire = createRequire(packageJsonPath);
	const candidateRootRealPath = await realpath(candidateRoot);
	if (
		pathComparisonKey(candidateRootRealPath)
		!== pathComparisonKey(candidateRoot)
	) {
		throw new Error('Candidate root is a link, junction, or reparse path.');
	}
	const nodeModulesRealPath = await realpath(nodeModulesRoot);
	if (
		pathComparisonKey(nodeModulesRealPath)
		!== pathComparisonKey(nodeModulesRoot)
	) {
		throw new Error('Experiment node_modules root is a reparse path.');
	}

	const pending = [];
	for (const entryFile of configuration.entryFiles) {
		const absoluteEntry = path.isAbsolute(entryFile)
			? path.resolve(entryFile)
			: path.resolve(candidateRoot, entryFile);
		assertLexicallyContained(candidateRoot, absoluteEntry, 'Closure entry');
		const entryRelativePath = portableRelative(candidateRoot, absoluteEntry);
		if (isExcludedCandidateRunnablePath(entryRelativePath)) {
			throw new Error(
				`Copied test/browser module cannot be a closure entry: `
				+ `${entryRelativePath}`,
			);
		}
		pending.push(absoluteEntry);
	}

	const visited = new Set();
	const files = [];
	const edges = [];
	const bareResolutions = new Map();
	const nodeBuiltins = new Set();
	while (pending.length > 0) {
		const modulePath = pending.pop();
		const moduleKey = pathComparisonKey(modulePath);
		if (visited.has(moduleKey)) {
			continue;
		}
		visited.add(moduleKey);
		await assertPlainFile(modulePath, 'Candidate module');
		const moduleRelativePath = portableRelative(candidateRoot, modulePath);
		if (isExcludedCandidateRunnablePath(moduleRelativePath)) {
			throw new Error(
				`Runnable closure reached copied verification code: `
				+ `${moduleRelativePath}`,
			);
		}
		files.push(moduleRelativePath);
		if (!/\.[cm]?[jt]sx?$/i.test(modulePath)) {
			continue;
		}

		const source = await readFile(modulePath, 'utf8');
		const references = extractStaticModuleReferences(
			source,
			moduleRelativePath,
		);
		for (const reference of references) {
			const specifier = reference.specifier;
			if (
				specifier.includes('\\')
				|| specifier.includes('?')
				|| specifier.includes('#')
			) {
				throw new Error(
					`Non-canonical module specifier in ${moduleRelativePath}: `
					+ `${specifier}`,
				);
			}
			if (
				specifier.startsWith('/')
				|| specifier.startsWith('file:')
				|| /^[a-zA-Z]:/.test(specifier)
			) {
				throw new Error(
					`Absolute or file-URL import in ${moduleRelativePath}: `
					+ `${specifier}`,
				);
			}

			if (specifier.startsWith('.')) {
				const target = path.resolve(path.dirname(modulePath), specifier);
				assertLexicallyContained(
					candidateRoot,
					target,
					`Relative import from ${moduleRelativePath}`,
				);
				const targetRelativePath = portableRelative(candidateRoot, target);
				if (isExcludedCandidateRunnablePath(targetRelativePath)) {
					throw new Error(
						`Runnable module ${moduleRelativePath} imports excluded `
						+ `verification code ${targetRelativePath}.`,
					);
				}
				await assertPlainFile(target, 'Relative import target');
				edges.push({
					from: moduleRelativePath,
					form: reference.form,
					specifier,
					to: targetRelativePath,
				});
				pending.push(target);
				continue;
			}

			if (BUILTIN_MODULE_NAMES.has(specifier)) {
				if (!allowedNodeBuiltins.has(specifier)) {
					throw new Error(
						`Candidate runtime module ${moduleRelativePath} imports `
						+ `undeclared Node built-in ${specifier}.`,
					);
				}
				edges.push({
					from: moduleRelativePath,
					form: reference.form,
					specifier,
					to: null,
				});
				nodeBuiltins.add(specifier);
				continue;
			}
			const packageName = packageNameFromSpecifier(specifier);
			const declaredVersion = dependencies[packageName];
			if (!declaredVersion) {
				throw new Error(
					`Bare import ${specifier} in ${moduleRelativePath} is not `
					+ 'declared by the experiment package.',
				);
			}
			const packageRoot = path.join(nodeModulesRoot, ...packageName.split('/'));
			const packageRootRealPath = await realpath(packageRoot);
			if (
				pathComparisonKey(packageRootRealPath)
				!== pathComparisonKey(packageRoot)
			) {
				throw new Error(
					`Installed dependency ${packageName} is a link, junction, `
					+ 'or reparse path.',
				);
			}
			let resolved;
			try {
				resolved = localRequire.resolve(specifier);
			} catch (error) {
				throw new Error(
					`Cannot resolve experiment-local bare import ${specifier}: `
					+ `${error.message}`,
				);
			}
			const resolvedRealPath = await realpath(resolved);
			if (!isPathContained(nodeModulesRealPath, resolvedRealPath)) {
				throw new Error(
					`Bare import ${specifier} resolved outside experiment-local `
					+ `node_modules: ${resolvedRealPath}`,
				);
			}
			edges.push({
				from: moduleRelativePath,
				form: reference.form,
				specifier,
				to: null,
			});
			bareResolutions.set(specifier, {
				specifier,
				packageName,
				declaredVersion,
				resolvedPath: portableRelative(EXPERIMENT_ROOT, resolvedRealPath),
			});
		}
	}

	files.sort(compareStrings);
	edges.sort((left, right) => compareStrings(
		`${left.from}\0${left.form}\0${left.specifier}`,
		`${right.from}\0${right.form}\0${right.specifier}`,
	));
	const entries = configuration.entryFiles
		.map((entryFile) => {
			const absoluteEntry = path.isAbsolute(entryFile)
				? path.resolve(entryFile)
				: path.resolve(candidateRoot, entryFile);
			return portableRelative(candidateRoot, absoluteEntry);
		})
		.sort(compareStrings);
	return Object.freeze({
		schemaId: MODULE_CLOSURE_SCHEMA_ID,
		entries,
		files,
		edges,
		nodeBuiltins: [...nodeBuiltins].sort(compareStrings),
		bareResolutions: [...bareResolutions.values()]
			.sort((left, right) => compareStrings(left.specifier, right.specifier)),
	});
}
