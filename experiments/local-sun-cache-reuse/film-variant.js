import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {repositoryRoot, checkPath, hash} from './run-boundary.js';
import {correctSunCoverage} from './sun-coverage/correction.js';

/** Replace exactly one authenticated source anchor.
 * @param {string} source - Read-only production source text.
 * @param {string} anchor - Recognized original text.
 * @param {string} replacement - Contained bundle derivative.
 * @returns {string} - Derived text, or an error when the source contract changed.
 */
function replaceOnce(source, anchor, replacement) {
	if (source.split(anchor).length !== 2) throw new Error('Film Sun coverage source anchor changed.');
	return source.replace(anchor, replacement);
}

/** Carry the qualified disjoint-circle coverage correction into this film bundle.
 * Production source, color selection, physical radius and source power remain read-only.
 * @returns {Promise<LocalSunFilmBundleVariant>} - Narrow transform and complete derivation identities.
 */
export async function createFilmVariant() {
	const names = [
		'src/algorithm32/rendering-runtime/three/SunDiskTileGenerationPass.js',
		'src/algorithm32/celestial-source-support/CelestialScreenPaletteConsumerShaderContribution.js',
	];
	const originals = [];
	for (const name of names) {
		const file = path.join(repositoryRoot, name);
		await checkPath(repositoryRoot, file);
		originals.push(await readFile(file, 'utf8'));
	}
	const corrected = correctSunCoverage({radius: 0, center: [0, 0], samples: 16, resolution: 96, vertex: '', fragment: originals[0], consumer: originals[1]});
	let producer = replaceOnce(corrected.fragment,
		"const COVERAGE_POLICY_ID = 'analytic-circular-disk-pixel-overlap-field-s16-v1';",
		"const COVERAGE_POLICY_ID = 'experiment-disjoint-zero-overlap-field-s16-v1';");
	producer = replaceOnce(producer,
		"'runtime.celestial.sunScreenCenterPixels': [...this._desiredProjection.centerPixels],",
		"'runtime.celestial.sunScreenCenterPixels': [...this._desiredProjection.centerPixels],\n\t\t\t'runtime.celestial.sunRadiusPixels': this._desiredProjection.radiusPixels,");
	producer = replaceOnce(producer,
		"'runtime.celestial.sunScreenCenterPixels': [-1000000, -1000000],",
		"'runtime.celestial.sunScreenCenterPixels': [-1000000, -1000000],\n\t\t\t'runtime.celestial.sunRadiusPixels': 0,");
	const consumer = replaceOnce(corrected.consumer, '\t\t\tuniforms: [',
		"\t\t\tuniforms: [\n\t\t\t\tShaderContributions.createShaderUniformDeclaration('uSunRadiusPixels', 'float', 'runtime.celestial.sunRadiusPixels', 0),");
	const derived = [producer, consumer];
	const modules = new Map(names.map((name, index) => [path.join(repositoryRoot, name), index]));
	return {
		plugin: {
			name: 'contained-p6-disjoint-sun-coverage',
			transform(source, id) {
				const index = modules.get(id);
				if (index === undefined) return null;
				if (source !== originals[index]) throw new Error('Film shader input changed during bundling.');
				return {code: derived[index], map: null};
			},
		},
		derivations: names.map((name, index) => ({path: name, inputSha256: hash(originals[index]), outputSha256: hash(derived[index]),
			operation: index === 0 ? 'Qualified contained disjoint-circle guard; bind actual projected radius; identify corrected coverage policy.' : 'Qualified contained zero-overlap consumer guard and projected-radius binding.'})),
	};
}
