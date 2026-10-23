import {gainAt} from './display.mjs';

function lowLightWeight(lux, candidate) {
	const t = Math.max(0, Math.min(1, (lux - candidate.taperStartLux) / (candidate.taperEndLux - candidate.taperStartLux)));
	return 1 - t * t * (3 - 2 * t);
}

/** Candidate pre-tone response; metering and encoding branches remain explicitly separate. */
export function response(candidate, lux, distribution, curve) {
	let effectiveLux = lux;
	if (candidate.kind === 'curve-lift') effectiveLux += candidate.liftLux * -Math.expm1(-lux / candidate.activationLux) * lowLightWeight(lux, candidate);
	if (candidate.kind === 'view-meter') {
		const proxy = Math.PI * (candidate.statistic === 'rms' ? distribution.rms : distribution.p90);
		effectiveLux += Math.max(0, proxy - lux) * lowLightWeight(lux, candidate);
	}
	return {gain: gainAt(effectiveLux, curve), effectiveLux, shoulder: candidate.kind === 'highlight-shoulder'};
}

/** Stable inversion used only to request a chosen gain through the unmodified production shader. */
export function luxForGain(gain, curve) {
	if (Math.abs(gain - gainAt(0, curve)) < 1e-7) return 0;
	let lower = -18, upper = 18;
	for (let i = 0; i < 100; i++) {const middle = (lower + upper) / 2; if (gainAt(Math.exp(middle), curve) > gain) lower = middle; else upper = middle;}
	return Math.exp((lower + upper) / 2);
}
