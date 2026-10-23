import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PNG} from 'pngjs';
import {checked} from './io.mjs';
import {encodeChannel} from './display.mjs';

/** Read closed, top-origin Float32 RGBA without modifying its signed values. */
export function readLayer(directory, id, layer = 0) {
	const bytes = readFileSync(checked(`${directory}/${id}-layer${layer}.f32`));
	assert.equal(bytes.byteOffset % 4, 0);
	return new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
}

/** Register geometric masks independently of candidate appearance: limb bit1, lower-scene bit2, Sun guard bit4. */
export function makeMask(facts, guards) {
	const {width, height, camera} = facts, result = Buffer.alloc(width * height);
	const [qx, qy, qz, qw] = camera.quaternion;
	const vertical = Math.tan(camera.fov * Math.PI / 360), horizontal = vertical * camera.aspect;
	const radius = facts.medium.bottomRadius.value;
	const horizon = facts.state.modeKind === 'spherical-distant' ? -Math.acos(radius / (radius + facts.state.observerHeight.value)) : 0;
	const band = guards.bandHalfWidthDegrees * Math.PI / 180, sunGuard = Math.cos(guards.sunGuardDegrees * Math.PI / 180);
	for (let row = 0; row < height; row++) for (let col = 0; col < width; col++) {
		let x = (2 * (col + 0.5) / width - 1) * horizontal, y = (1 - 2 * (row + 0.5) / height) * vertical, z = -1;
		const length = Math.hypot(x, y, z); x /= length; y /= length; z /= length;
		const tx = 2 * (qy * z - qz * y), ty = 2 * (qz * x - qx * z), tz = 2 * (qx * y - qy * x);
		const sx = x + qw * tx + qy * tz - qz * ty, sy = y + qw * ty + qz * tx - qx * tz, sz = z + qw * tz + qx * ty - qy * tx;
		const elevation = Math.asin(Math.max(-1, Math.min(1, sy))), sun = sx * facts.sunScene[0] + sy * facts.sunScene[1] + sz * facts.sunScene[2] >= sunGuard;
		result[row * width + col] = sun ? 4 : ((Math.abs(elevation - horizon) <= band ? 1 : 0) | (elevation < horizon - 4 * Math.PI / 180 && elevation > horizon - 24 * Math.PI / 180 ? 2 : 0) | (elevation > horizon + 4 * Math.PI / 180 ? 8 : 0));
	}
	return result;
}

/** Encode actual pixel colors, retaining negative HDR channels until the declared display boundary. */
export function render(hdr, width, height, gain, k, shoulder = false) {
	const image = new PNG({width, height});
	for (let offset = 0; offset < hdr.length; offset += 4) {
		if (!shoulder) for (let c = 0; c < 3; c++) image.data[offset + c] = encodeChannel(hdr[offset + c], gain, k);
		else {
			const r = Math.max(0, hdr[offset]) * gain * k, g = Math.max(0, hdr[offset + 1]) * gain * k, b = Math.max(0, hdr[offset + 2]) * gain * k;
			const luminance = .2126 * r + .7152 * g + .0722 * b;
			const scale = luminance < 1e-10 ? 1 : -Math.expm1(-luminance) / luminance;
			const t = Math.max(0, Math.min(1, (Math.max(r, g, b) - 1) / 3)), weight = t * t * (3 - 2 * t);
			for (const [c, value] of [r, g, b].entries()) image.data[offset + c] = Math.round(255 * Math.max(0, Math.min(1, (1 - weight) * -Math.expm1(-value) + weight * value * scale)));
		}
		image.data[offset + 3] = 255;
	}
	return image;
}

function quantile(array, fraction) {return array.length ? array[Math.min(array.length - 1, Math.floor((array.length - 1) * fraction))] : 0;}

/** Summarize displayed clipping, color, contrast and lower-scene brightness using the registered masks. */
export function summarize(image, mask) {
	let bandCount = 0, bandWhite = 0, white = 0, bandChroma = 0, skySumY = 0, skyVisiblePixels = 0;
	const band = [], lower = [];
	for (let pixel = 0; pixel < mask.length; pixel++) {
		const i = pixel * 4, r = image.data[i], g = image.data[i + 1], b = image.data[i + 2];
		const nearWhite = r >= 250 && g >= 250 && b >= 250;
		if (nearWhite) white++;
		const y = (.2126 * r + .7152 * g + .0722 * b) / 255;
		if (mask[pixel] & 1) {bandCount++; if (nearWhite) bandWhite++; bandChroma += (Math.max(r, g, b) - Math.min(r, g, b)) / 255; if (pixel % 4 === 0) band.push(y);}
		if ((mask[pixel] & 2) && pixel % 4 === 0) lower.push(y);
		if (mask[pixel] & 8) {skySumY += y; if (Math.max(r, g, b) >= 2) skyVisiblePixels++;}
	}
	band.sort((a, b) => a - b); lower.sort((a, b) => a - b);
	return {wholeWhiteFraction: white / mask.length, bandCount, bandWhiteFraction: bandCount ? bandWhite / bandCount : null, bandMeanChroma: bandCount ? bandChroma / bandCount : null, bandContrast: quantile(band, .9) - quantile(band, .1), lowerMedian: quantile(lower, .5), skySumY, skyVisiblePixels};
}

/** Visible-field brightness proxies, excluding the registered solar footprint guard. */
export function rawDistribution(hdr, mask) {
	const values = []; let negative = 0;
	for (let i = 0; i < hdr.length; i += 4) {
		for (let c = 0; c < 3; c++) if (hdr[i + c] < 0) negative++;
		if ((i / 4) % 4 === 0 && !(mask[i / 4] & 4)) values.push(Math.max(0, .2126 * hdr[i] + .7152 * hdr[i + 1] + .0722 * hdr[i + 2]));
	}
	values.sort((a, b) => a - b);
	return {p50: quantile(values, .5), p90: quantile(values, .9), p99: quantile(values, .99), rms: Math.sqrt(values.reduce((sum, x) => sum + x * x, 0) / Math.max(values.length, 1)), maximum: values.at(-1), negativeChannels: negative};
}
