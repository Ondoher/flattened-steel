import {StableValueHash} from '../../value-identity/StableValueHash.js';
import {CacheBuildModules} from './CacheBuildModules.js';
import {CACHE_WAVELENGTH_LAYER_BINDING_NAME} from './consts.js';

/** Owner order constant. */
const OWNER_ORDER = ['lightSource', 'atmosphere', 'geometry', 'ground', 'transport', 'cache'];
/** Cache output name constant. */
const CACHE_OUTPUT_NAME = 'a32CacheOutput';
/** Glsl preprocessor prefix constant. */
const GLSL_PREPROCESSOR_PREFIX = '#';

/** Renderer-neutral assembler of owner modules into cache-pass shaders.
 *
 * @implements {CacheAssembler}
 */
export class CachePassAssembler {
	/**
	 * Called by module comparison to resolve one owner's deterministic tie-break position. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {CacheBuildOwner} owner - The owner whose position is required.
	 * @returns {number} - The owner's deterministic position.
	 */
	_ownerIndex(owner) {
		const index = OWNER_ORDER.indexOf(owner);
		return index < 0 ? OWNER_ORDER.length : index;
	}

	/**
	 * Called by module ordering to compare independent modules without using arrival order.
	 *
	 * @param {CacheBuildModule} left - The left module in the comparison.
	 * @param {CacheBuildModule} right - The right module in the comparison.
	 * @returns {number} - The deterministic comparison result.
	 */
	_compareModules(left, right) {
		return (
			this._ownerIndex(left.owner) - this._ownerIndex(right.owner) ||
			left.id.localeCompare(right.id) ||
			left.contentHash.localeCompare(right.contentHash)
		);
	}

	/**
	 * Called by assembly to resolve trusted module dependencies into deterministic source order.
	 *
	 * @param {readonly CacheBuildModule[]} modules - The owner modules to order.
	 * @returns {CacheBuildModule[]} - The dependency-ordered modules.
	 */
	_orderModules(modules) {
		const providers = new Map();
		for (const module of modules) {
			for (const symbol of module.provides) {
				providers.set(symbol, module);
			}
		}

		/** @type {CacheBuildModule[]} */ const ordered = [];
		const visited = new Set();
		const visiting = new Set();
		const roots = [...modules].sort((left, right) => this._compareModules(left, right));
		for (const root of roots) {
			/** @type {CacheModuleTraversalEntry[]} */ const stack = [{module: root, complete: false}];
			while (stack.length > 0) {
				const entry = stack.pop();
				if (entry.complete) {
					visiting.delete(entry.module);
					visited.add(entry.module);
					ordered.push(entry.module);
					continue;
				}
				if (visited.has(entry.module) || visiting.has(entry.module)) continue;
				visiting.add(entry.module);
				stack.push({module: entry.module, complete: true});
				const dependencies = entry.module.requires
					.map((symbol) => providers.get(symbol))
					.filter(Boolean)
					.sort((left, right) => this._compareModules(left, right));
				for (let index = dependencies.length - 1; index >= 0; index--)
					stack.push({module: dependencies[index], complete: false});
			}
		}
		return ordered;
	}

	/**
	 * Called by source assembly to collect source blocks with their deterministic module positions.
	 *
	 * @param {readonly CacheBuildModule[]} modules - The ordered modules whose blocks are required.
	 * @returns {CacheShaderBlockEntry[]} - The source blocks paired with module positions.
	 */
	_collectBlocks(modules) {
		return modules.flatMap((module, moduleIndex) =>
			module.blocks.map((block) => ({
				block,
				moduleIndex,
			})),
		);
	}

	/**
	 * Called by source assembly to select one phase's source in explicit block order.
	 *
	 * @param {readonly CacheShaderBlockEntry[]} blocks - The positioned source blocks to select.
	 * @param {CacheShaderPhase} phase - The shader phase to select.
	 * @returns {string} - The ordered source for the phase.
	 */
	_phaseSource(blocks, phase) {
		return blocks
			.filter((entry) => entry.block.phase === phase)
			.sort(
				(left, right) =>
					left.moduleIndex - right.moduleIndex ||
					left.block.order - right.block.order ||
					left.block.id.localeCompare(right.block.id),
			)
			.map((entry) => entry.block.source)
			.join('\n\n');
	}

	/**
	 * Called by source assembly to emit one stable preprocessor literal. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {number | boolean} value - The compile-time binding value to emit.
	 * @returns {string} - The stable GLSL literal.
	 */
	_defineLiteral(value) {
		return typeof value === 'boolean' ? (value ? 'true' : 'false') : Object.is(value, -0) ? '-0' : String(value);
	}

	/**
	 * Called by source assembly to place a GLSL array suffix after a binding name. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {CacheBinding} binding - The runtime binding to declare.
	 * @returns {string} - The GLSL uniform declaration.
	 */
	_uniformDeclaration(binding) {
		const match = /^(.*?)(\[[1-9][0-9]*\])$/.exec(binding.spec.shaderType);
		if (match) {
			return `uniform ${match[1]} ${binding.spec.name}${match[2]};`;
		}
		return `uniform ${binding.spec.shaderType} ${binding.spec.name};`;
	}

	/**
	 * Called by assembly to collect trusted bindings in deterministic declaration order.
	 *
	 * @param {readonly CacheBuildModule[]} modules - The ordered modules whose bindings are required.
	 * @returns {CacheBinding[]} - The deterministically ordered bindings.
	 */
	_collectBindings(modules) {
		return modules
			.flatMap((module) => module.bindings)
			.sort(
				(left, right) =>
					left.spec.name.localeCompare(right.spec.name) || left.spec.id.localeCompare(right.spec.id),
			);
	}

	/**
	 * Called by source assembly to indent a main-phase block without changing its internal content.
	 *
	 * @param {string} source - The main-phase source block to indent.
	 * @returns {string} - The indented source block.
	 */
	_indentMainSource(source) {
		return source
			.split('\n')
			.map((line) => `\t${line}`)
			.join('\n');
	}

	/**
	 * Called by assembly to compose one deterministic construction fragment shader body.
	 *
	 * @param {CachePass} pass - The logical cache pass to assemble.
	 * @param {readonly CacheBuildModule[]} modules - The dependency-ordered owner modules.
	 * @param {readonly CacheBinding[]} bindings - The declaration-ordered module bindings.
	 * @returns {string} - The complete construction fragment shader source.
	 */
	_assembleSource(pass, modules, bindings) {
		const inputDeclarations = pass.inputs
			.map((id) => `uniform highp sampler2DArray ${CacheBuildModules.fieldInputBindingName(id)};`)
			.sort()
			.join('\n');
		const defineSource = bindings
			.filter((binding) => binding.spec.kind === 'define')
			.map(
				(binding) =>
					`${GLSL_PREPROCESSOR_PREFIX}define ${binding.spec.name} ${this._defineLiteral(
						/** @type {CacheDefineBinding} */ (binding).value,
					)}`,
			)
			.join('\n');
		const uniformSource = bindings
			.filter((binding) => binding.spec.kind !== 'define')
			.map((binding) => this._uniformDeclaration(binding))
			.join('\n');
		const blocks = this._collectBlocks(modules);
		const declarations = this._phaseSource(blocks, 'declare');
		const functions = this._phaseSource(blocks, 'function');
		const main = this._phaseSource(blocks, 'main');
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
			`void main() {\n${main ? this._indentMainSource(main) : ''}\n}`,
		];
		return `${sections.filter(Boolean).join('\n\n')}\n`;
	}

	/**
	 * Call this method to assemble one accepted logical pass and executor-resolved output field.
	 *
	 * @param {CachePass} pass - Supplies the logical pass and owner modules.
	 * @param {CacheFieldSpec} output - Supplies the resolved output field.
	 * @returns {CacheShader} - Return deterministic complete shader source.
	 */
	assemble(pass, output) {
		const modules = this._orderModules([...pass.modules]);
		const bindings = this._collectBindings(modules);
		const source = this._assembleSource(pass, modules, bindings);
		const sourceHash = StableValueHash.stableHash(source);
		const shaderIdentifier = `cache-shader:${StableValueHash.stableHash({
			pass: {
				id: pass.id,
				kind: pass.kind,
				order: pass.order,
				inputs: pass.inputs,
				output: pass.output,
			},
			output: {
				id: output.id,
				storage: output.storage,
			},
			modules: modules.map((module) => ({
				id: module.id,
				contentHash: module.contentHash,
			})),
			sourceHash,
		})}`;

		return {
			id: shaderIdentifier,
			source,
			sourceHash,
			bindings,
			output,
		};
	}
}
