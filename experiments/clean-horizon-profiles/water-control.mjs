import {readFileSync} from 'node:fs';
import {checked, identity} from './io.mjs';

/** Describe the owner-supplied paired maps and the illustrative physical tile scale. */
export function greenSeaControl() {
	return {
		id: 'green-sea-static-v1',
		color: {...identity('references/textures/GreenSea_S.jpg'), url: '/water/GreenSea_S.jpg'},
		normal: {...identity('references/textures/GreenSea_N.jpg'), url: '/water/GreenSea_N.jpg'},
		tileWidthMeters: 100,
		normalStrength: 0.6,
		license: 'CC-BY-3.0',
		author: 'Keith333',
		source: 'https://opengameart.org/content/water-batch-of-15-seamless-textures-with-normalmaps',
		scope: 'Static photographic color and generated normal maps on the existing matte ground. No displacement, animation, reflective-water model or changed atmospheric field.',
	};
}

/** Preserve original input bytes in this run and serve only the declared map pair.
 * @param {any} run - Current exclusive output owner.
 * @param {ReturnType<typeof greenSeaControl>|undefined} water - Optional material selection.
 * @param {Map<string, Buffer>} routes - Current local capture-server routes.
 */
export function retainWaterInputs(run, water, routes) {
	if (!water) return;
	for (const asset of [water.color, water.normal]) {
		const bytes = readFileSync(checked(asset.path));
		run.write(asset.url.slice(1), bytes);
		routes.set(asset.url, bytes);
	}
}
