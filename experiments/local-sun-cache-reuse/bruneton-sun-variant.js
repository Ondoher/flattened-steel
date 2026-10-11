import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {repositoryRoot, checkPath, hash} from './run-boundary.js';
import {correctSunCoverage} from './sun-coverage/correction.js';

/** Replace one recognized source anchor, rejecting ambiguous input.
 * @param {string} source - Read-only module text.
 * @param {string} anchor - Exact expected original text.
 * @param {string} replacement - Contained bundle-only adaptation.
 * @returns {string} - Derived module text.
 */
function replaceOnce(source, anchor, replacement) {
	if (source.split(anchor).length !== 2) throw new Error('Unrecognized Bruneton comparison source anchor.');
	return source.replace(anchor, replacement);
}

/** Derive one explicitly selected control still without writing shared source.
 * @param {LocalSunFlat180CelestialPresentation} [presentation] - Explicit display/star and camera selection.
 * @param {LocalSunCelestialStillStateId} [stateId] - Frozen control; Flat0 is supported only for the Sun-facing scene preset.
 * @returns {Promise<LocalSunFlat180CelestialBundleVariant>} - Rollup transform and complete derivation identities.
 */
export async function createFlat180CelestialVariant(presentation = 'bruneton', stateId = 'flat-180') {
	if (!['bruneton', 'p2-combined', 'p2-combined-away', 'p2-combined-away-up', 'p2-human-away-up', 'p2-human-toward-up', 'p2-human-scene'].includes(presentation)) throw new Error('Unknown Flat180 presentation.');
	if (!['flat-0', 'flat-180'].includes(stateId) || (stateId === 'flat-0' && presentation !== 'p2-human-scene')) throw new Error('Unsupported control/presentation pairing.');
	const toward = presentation === 'p2-human-toward-up',
		combined = presentation !== 'bruneton', upward = toward || presentation === 'p2-combined-away-up' || presentation === 'p2-human-away-up',
		oriented = upward || presentation === 'p2-combined-away';
	const names = [
		'src/algorithm32/rendering-runtime/three/SunDiskTileGenerationPass.js',
		'src/algorithm32/celestial-source-support/CelestialScreenPaletteConsumerShaderContribution.js',
		'experiments/local-sun-cache-reuse/rotation-model.js',
		'experiments/local-sun-cache-reuse/celestial-browser.js',
	];
	const originals = [];
	for (const name of names) {
		const file = path.join(repositoryRoot, name);
		await checkPath(repositoryRoot, file);
		originals.push(await readFile(file, 'utf8'));
	}
	const corrected = correctSunCoverage({
		radius: 0, center: [0, 0], samples: 16, resolution: 96, vertex: '',
		fragment: originals[0], consumer: originals[1],
	});
	let producer = replaceOnce(corrected.fragment,
		"const COVERAGE_POLICY_ID = 'analytic-circular-disk-pixel-overlap-field-s16-v1';",
		"const COVERAGE_POLICY_ID = 'experiment-disjoint-zero-overlap-field-s16-v1';");
	producer = replaceOnce(producer,
		"'runtime.celestial.sunScreenCenterPixels': [...this._desiredProjection.centerPixels],",
		"'runtime.celestial.sunScreenCenterPixels': [...this._desiredProjection.centerPixels],\n\t\t\t'runtime.celestial.sunRadiusPixels': this._desiredProjection.radiusPixels,");
	producer = replaceOnce(producer,
		"'runtime.celestial.sunScreenCenterPixels': [-1000000, -1000000],",
		"'runtime.celestial.sunScreenCenterPixels': [-1000000, -1000000],\n\t\t\t'runtime.celestial.sunRadiusPixels': 0,");
	const consumer = replaceOnce(corrected.consumer,
		"\t\t\tuniforms: [",
		"\t\t\tuniforms: [\n\t\t\t\tShaderContributions.createShaderUniformDeclaration('uSunRadiusPixels', 'float', 'runtime.celestial.sunRadiusPixels', 0),");
	let model = originals[2];
	if (presentation === 'bruneton') {
		model = replaceOnce(model,
		"import {createFlat32ColorDisplayModel} from '../../src/flat32/Flat32ColorDisplayModel.js';",
		"import {BrunetonColorDisplayModel} from '../../src/algorithm32/implementation/bruneton-color/BrunetonColorDisplayModel.js';");
		model = replaceOnce(model, 'color: createFlat32ColorDisplayModel({}, presentationFilterRegistry)', 'color: new BrunetonColorDisplayModel({presentationFilterRegistry})');
	}
	let browser = replaceOnce(originals[3],
		"for (const id of ['flat-0', 'flat-90', 'flat-180'])", `for (const id of ['${stateId}'])`);
	browser = replaceOnce(browser, "if (id === 'flat-0') sceneOcclusion", `if (id === '${stateId}') sceneOcclusion`);
	if (stateId === 'flat-0') browser = replaceOnce(browser, "if (id === 'flat-180') {", "if (id === 'flat-0') {");
	if (combined) {
		browser = replaceOnce(browser, 'const yaw = await preview(frame, canvas);', 'const yaw = [];');
		browser = replaceOnce(browser,
			"scope: 'two-second camera pan, fixed physical state and atmospheric cache',",
			"scope: 'still-only comparison; preview intentionally not generated',");
	}
	if (oriented) {
		browser = replaceOnce(browser, "import * as THREE from 'three';",
			"import * as THREE from 'three';\nimport {orientCaptureCamera} from './celestial-camera-turn.js';");
		browser = replaceOnce(browser, 'const starProof = stars ? await proveFlatStars(frame, renderer, stars, starPolicy) : null;',
			`const cameraTurn = orientCaptureCamera(frame, ${upward ? '65' : 'undefined'}, ${toward ? '0' : '180'});
			const starProof = stars ? await proveFlatStars(frame, renderer, stars, starPolicy, ${!upward}) : null;
			frame.celestial.render();
			gl.readPixels(0, 0, input.viewportSize.width, input.viewportSize.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
			litPixels = 0;
			for (let p = 0; p < pixels.length; p += 4) if (pixels[p] || pixels[p + 1] || pixels[p + 2]) litPixels++;
			if (!litPixels) throw new Error('Turned view is entirely black.');`);
		browser = replaceOnce(browser, '\t\t\t\tstarProof,', '\t\t\t\tstarProof,\n\t\t\t\tcameraYaw: cameraTurn.proof,');
		browser = replaceOnce(browser, '\t\t\t\t\tconst yaw = [];',
			'\t\t\t\t\tframe.celestial.camera.quaternion.copy(cameraTurn.restoreQuaternion);\n\t\t\t\t\tframe.celestial.camera.updateMatrixWorld();\n\t\t\t\t\tframe.celestial.render();\n\t\t\t\t\tconst yaw = [];');
	}
	const derived = [producer, consumer, model, browser];
	const modules = new Map(names.map((name, index) => [path.join(repositoryRoot, name), index]));
	return {
		plugin: {
			name: 'contained-' + stateId + '-' + presentation,
			transform(source, id) {
				const index = modules.get(id);
				if (index === undefined) return null;
				if (source !== originals[index]) throw new Error('Comparison input changed during bundling.');
				return {code: derived[index], map: null};
			},
		},
		derivations: names.map((name, index) => ({
			path: name, inputSha256: hash(originals[index]), outputSha256: hash(derived[index]),
			operation: [
				'Existing contained disjoint-circle guard; bind exact projected radius; distinct coverage policy identity.',
				'Existing contained consumer guard; declare projected-radius binding.',
				presentation === 'bruneton' ? 'Select unmodified BrunetonColorDisplayModel instead of the Flat32 p2 display factory.' : 'Retain the original current Flat32 p2 display factory without any color adaptation.',
				'Capture only frozen ' + stateId + ' and prove scene occlusion there.' + (combined ? ' Skip motion encoding while retaining star, lifecycle and cancellation proofs at the selected control.' : '') + (oriented ? ' After Sun-facing transport/occlusion checks, select ' + (toward ? 'the original Sun azimuth (180 degrees back from the prior away view)' : 'camera yaw 180 degrees') + ' at fixed position' + (upward ? ' and elevation 65 degrees; require occupied stellar pixels' : ' and unchanged pitch') + '; verify actual camera orientation and stellar field. Restore before lifecycle checks.' : ''),
			][index],
		})),
	};
}
