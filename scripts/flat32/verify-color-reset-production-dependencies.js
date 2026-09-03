import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, realpath, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

function argument(name) {
	const index = process.argv.indexOf(name);
	if (index < 0 || index + 1 >= process.argv.length) throw new Error(`${name} is required.`);
	return process.argv[index + 1];
}

function sha256(bytes) {
	return createHash('sha256').update(bytes).digest('hex');
}

async function collectFiles(target, repositoryRoot) {
	const facts = await lstat(target);
	if (facts.isSymbolicLink()) throw new Error(`Dependency inventory rejects links: ${target}`);
	if (facts.isFile()) return [target];
	const files = [];
	for (const entry of await (await import('node:fs/promises')).readdir(target, {withFileTypes: true})) {
		const child = path.join(target, entry.name);
		if (entry.isSymbolicLink()) throw new Error(`Dependency inventory rejects links: ${child}`);
		if (entry.isDirectory()) files.push(...await collectFiles(child, repositoryRoot));
		else if (entry.isFile()) files.push(child);
	}
	return files.filter((file) => file.startsWith(`${repositoryRoot}${path.sep}`));
}

const repositoryRoot = await realpath(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..'));
const evidenceRoot = await realpath(path.join(repositoryRoot, 'tmp', 'extraterrestrial'));
const outputDirectory = path.resolve(argument('--output'));
if (!outputDirectory.startsWith(`${evidenceRoot}${path.sep}`)) {
	throw new Error('Color Reset dependency evidence must remain under tmp/extraterrestrial.');
}
try {
	await stat(outputDirectory);
	throw new Error('Color Reset dependency output already exists; evidence is immutable.');
} catch (error) {
	if (error.code !== 'ENOENT') throw error;
}
await mkdir(outputDirectory, {recursive: true});
if ((await realpath(outputDirectory)) !== outputDirectory || (await lstat(outputDirectory)).isSymbolicLink()) {
	throw new Error('Color Reset dependency output must resolve exactly and must not be a link.');
}

const sourceTargets = [
	path.join(repositoryRoot, 'src', 'algorithm32'),
	path.join(repositoryRoot, 'src', 'flat32'),
	path.join(repositoryRoot, 'server', 'flat32', 'DistantSunSceneCachePackageService.js'),
	path.join(repositoryRoot, 'server', 'flat32', 'StellarCatalogPackageService.js'),
	path.join(repositoryRoot, 'server', 'flat32', 'HumanVisionFilterPackageService.js'),
	path.join(repositoryRoot, 'server', 'flat32-router.js'),
];
const files = (await Promise.all(sourceTargets.map((target) => collectFiles(target, repositoryRoot))))
	.flat()
	.sort();
const forbiddenPatterns = [/scripts[\\/]extraterrestrial/iu, /tmp[\\/]extraterrestrial/iu, /poly-gc-react/iu];
const forbiddenReferences = [];
const externalImports = new Set();
const inventory = [];
for (const file of files) {
	const bytes = await readFile(file);
	const relativePath = path.relative(repositoryRoot, file).replaceAll('\\', '/');
	const text = /\.(?:[cm]?js|json|d\.ts)$/u.test(file) ? bytes.toString('utf8') : '';
	for (const pattern of forbiddenPatterns) {
		if (pattern.test(text)) forbiddenReferences.push({path: relativePath, pattern: String(pattern)});
	}
	for (const match of text.matchAll(/(?:from\s+|import\s*\(|require\s*\()\s*['"]([^'".][^'"]*)['"]/gu)) {
		externalImports.add(match[1]);
	}
	inventory.push({path: relativePath, byteLength: bytes.length, sha256: sha256(bytes)});
}

const report = {
	schemaId: 'flat32-color-reset-production-dependency-inventory-v1',
	accepted: forbiddenReferences.length === 0,
	claim: 'Static production-source inventory contains no contained-experiment, generated-evidence, or external comparison-repository runtime reference.',
	forbiddenReferences,
	externalImports: [...externalImports].sort(),
	files: inventory,
	derivation: {
		implementation: 'scripts/flat32/verify-color-reset-production-dependencies.js',
		operation: 'Recursively hash production source owners and scan textual runtime dependency syntax and path references.',
		targets: sourceTargets.map((target) => path.relative(repositoryRoot, target).replaceAll('\\', '/')),
	},
};
await writeFile(path.join(outputDirectory, 'dependency-inventory.json'), `${JSON.stringify(report, null, 2)}\n`, {
	flag: 'wx',
});
process.stdout.write(`${JSON.stringify({accepted: report.accepted, fileCount: files.length, externalImports: report.externalImports}, null, 2)}\n`);
if (!report.accepted) throw new Error('Production dependency inventory found a forbidden runtime reference.');
