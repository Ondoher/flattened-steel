import { stableHash } from '../../shader/stableHash.js';
import {
	CACHE_WAVELENGTH_LAYER_BINDING_NAME,
	cacheFieldInputBindingName,
} from './cacheBuildContracts.js';

const OWNER_ORDER = [
	'lightSource',
	'atmosphere',
	'geometry',
	'ground',
	'transport',
	'cache',
];
const CACHE_OUTPUT_NAME = 'a32CacheOutput';
const GLSL_PREPROCESSOR_PREFIX = '#';

/** Return one owner's deterministic tie-break position. */
function ownerIndex(owner) {
	const index = OWNER_ORDER.indexOf(owner);
	return index < 0 ? OWNER_ORDER.length : index;
}

/** Compare independent modules without using contribution arrival order. */
function compareModules(left, right) {
	return ownerIndex(left.owner) - ownerIndex(right.owner)
		|| left.id.localeCompare(right.id)
		|| left.contentHash.localeCompare(right.contentHash);
}

/** Resolve trusted module dependencies into deterministic source order. */
function orderModules(modules) {
	const providers = new Map();
	for (const module of modules) {
		for (const symbol of module.provides) {
			providers.set(symbol, module);
		}
	}

	const ordered = [];
	const visited = new Set();
	const visiting = new Set();
	const visit = (module) => {
		if (visited.has(module) || visiting.has(module)) {
			return;
		}
		visiting.add(module);
		module.requires
			.map((symbol) => providers.get(symbol))
			.filter(Boolean)
			.sort(compareModules)
			.forEach(visit);
		visiting.delete(module);
		visited.add(module);
		ordered.push(module);
	};

	[...modules].sort(compareModules).forEach(visit);
	return ordered;
}

/** Collect trusted source blocks with their deterministic module position. */
function collectBlocks(modules) {
	return modules.flatMap((module, moduleIndex) =>
		module.blocks.map((block) => ({ block, moduleIndex })));
}

/** Return one phase's source in explicit block order. */
function phaseSource(blocks, phase) {
	return blocks
		.filter((entry) => entry.block.phase === phase)
		.sort((left, right) => left.moduleIndex - right.moduleIndex
			|| left.block.order - right.block.order
			|| left.block.id.localeCompare(right.block.id))
		.map((entry) => entry.block.source)
		.join('\n\n');
}

/** Emit one stable preprocessor literal. */
function defineLiteral(value) {
	return typeof value === 'boolean'
		? value ? 'true' : 'false'
		: Object.is(value, -0) ? '-0' : String(value);
}

/** Place a GLSL array suffix after the binding name. */
function uniformDeclaration(binding) {
	const match = /^(.*?)(\[[1-9][0-9]*\])$/.exec(binding.spec.shaderType);
	if (match) {
		return `uniform ${match[1]} ${binding.spec.name}${match[2]};`;
	}
	return `uniform ${binding.spec.shaderType} ${binding.spec.name};`;
}

/** Collect trusted bindings in deterministic declaration order. */
function collectBindings(modules) {
	return modules.flatMap((module) => module.bindings)
		.sort((left, right) => left.spec.name.localeCompare(right.spec.name)
			|| left.spec.id.localeCompare(right.spec.id));
}

/** Indent a main-phase source block without changing its internal content. */
function indentMainSource(source) {
	return source.split('\n').map((line) => `\t${line}`).join('\n');
}

/** Assemble one deterministic construction fragment shader body. */
function assembleSource(pass, modules, bindings) {
	const inputDeclarations = pass.inputs
		.map((id) => `uniform highp sampler2DArray ${cacheFieldInputBindingName(id)};`)
		.sort()
		.join('\n');
	const defineSource = bindings
		.filter((binding) => binding.spec.kind === 'define')
		.map((binding) => `${GLSL_PREPROCESSOR_PREFIX}define ${binding.spec.name} ${defineLiteral(binding.value)}`)
		.join('\n');
	const uniformSource = bindings
		.filter((binding) => binding.spec.kind !== 'define')
		.map(uniformDeclaration)
		.join('\n');
	const blocks = collectBlocks(modules);
	const declarations = phaseSource(blocks, 'declare');
	const functions = phaseSource(blocks, 'function');
	const main = phaseSource(blocks, 'main');
	const sections = [
		'precision highp float;',
		'precision highp int;',
		'precision highp sampler2D;',
		'precision highp sampler2DArray;',
		`layout(location = 0) out float ${CACHE_OUTPUT_NAME};`,
		`uniform int ${CACHE_WAVELENGTH_LAYER_BINDING_NAME};`,
		defineSource,
		inputDeclarations,
		uniformSource,
		declarations,
		functions,
		`void main() {\n${main ? indentMainSource(main) : ''}\n}`,
	];
	return `${sections.filter(Boolean).join('\n\n')}\n`;
}

/** Assemble renderer-neutral owner modules into one cache-pass shader. */
export class CachePassAssembler {
	/**
	 * Assemble one accepted logical pass and executor-resolved output field.
	 *
	 * @param {CachePass} pass - Supplies the logical pass and owner modules.
	 * @param {CacheFieldSpec} output - Supplies the resolved output field.
	 * @returns {CacheShader} Return deterministic complete shader source.
	 */
	assemble(pass, output) {
		const modules = orderModules([...pass.modules]);
		const bindings = collectBindings(modules);
		const source = assembleSource(pass, modules, bindings);
		const sourceHash = stableHash(source);
		const id = `cache-shader:${stableHash({
			pass: {
				id: pass.id,
				kind: pass.kind,
				order: pass.order,
				inputs: pass.inputs,
				output: pass.output,
			},
			output: output.descriptor.contentHash,
			modules: modules.map((module) => ({
				id: module.id,
				contentHash: module.contentHash,
			})),
			sourceHash,
		})}`;

		return {
			id,
			source,
			sourceHash,
			bindings,
			output,
		};
	}
}

export default CachePassAssembler;
