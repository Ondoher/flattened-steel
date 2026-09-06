import {CameraColorModel} from './CameraColorModel.js';

const MODES = new Set(['normal', 'disk-visible', 'manual']);

function requireCondition(value, message) {
	if (!value) throw new Error(message);
}

function finiteFraction(value, label) {
	requireCondition(Number.isFinite(value) && value >= 0 && value <= 1, `${label} must be within [0,1].`);
}

function luminance(rgb) {
	return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function opticalExposureFactor(profile) {
	return profile.capture.shutterSeconds
		/ profile.capture.apertureFNumber ** 2
		* profile.capture.filterTransmission;
}

function stableRank(left, right) {
	if (left.meanEncodedLuminance !== right.meanEncodedLuminance) return right.meanEncodedLuminance - left.meanEncodedLuminance;
	if (left.displayHighClippedFraction !== right.displayHighClippedFraction) return left.displayHighClippedFraction - right.displayHighClippedFraction;
	if (left.rawClippedFraction !== right.rawClippedFraction) return left.rawClippedFraction - right.rawClippedFraction;
	return left.profileId.localeCompare(right.profileId, 'en');
}

export class CameraExposureEvaluator {
	evaluate({profile, pixelCount, spectrumAt, samplePixels = {}}) {
		requireCondition(Number.isInteger(pixelCount) && pixelCount > 0, 'Exposure evaluation requires a positive integer pixel count.');
		requireCondition(typeof spectrumAt === 'function', 'Exposure evaluation requires a spectrum accessor.');
		const model = new CameraColorModel(profile);
		const summary = {
			profileId: model.profile.profileId,
			pixelCount,
			opticalExposureFactor: opticalExposureFactor(model.profile),
			postWellGain: model.profile.capture.postWellGain,
			rawClippedPixelCount: 0,
			adcClippedPixelCount: 0,
			displayHighClippedPixelCount: 0,
			exactBlackPixelCount: 0,
			exactWhitePixelCount: 0,
			nonFinitePixelCount: 0,
			meanEncodedLuminance: 0,
			meanEncodedChroma: 0,
			samples: {},
		};
		const sampleByPixel = new Map(Object.entries(samplePixels).map(([id, pixel]) => [pixel, id]));
		for (let pixel = 0; pixel < pixelCount; pixel += 1) {
			const trace = model.traceRadiance(spectrumAt(pixel));
			if (trace.rawClipChannelCount > 0) summary.rawClippedPixelCount += 1;
			if (trace.adcClipped.some(Boolean)) summary.adcClippedPixelCount += 1;
			if (trace.preDevelopmentLinearRec709D65.some((value) => value > 1)) summary.displayHighClippedPixelCount += 1;
			if (trace.encodedSrgb.every((value) => value === 0)) summary.exactBlackPixelCount += 1;
			if (trace.encodedSrgb.every((value) => value === 1)) summary.exactWhitePixelCount += 1;
			if (![...trace.photoelectrons, ...trace.preDevelopmentLinearRec709D65, ...trace.encodedSrgb].every(Number.isFinite)) summary.nonFinitePixelCount += 1;
			summary.meanEncodedLuminance += luminance(trace.encodedSrgb);
			summary.meanEncodedChroma += Math.max(...trace.encodedSrgb) - Math.min(...trace.encodedSrgb);
			const sampleId = sampleByPixel.get(pixel);
			if (sampleId) summary.samples[sampleId] = {
				pixelIndex: pixel,
				fullWellFraction: trace.fullWellFraction,
				rawClipped: trace.rawClipped,
				adcClipped: trace.adcClipped,
				preDevelopmentLinearRec709D65: trace.preDevelopmentLinearRec709D65,
				encodedSrgb: trace.encodedSrgb,
			};
		}
		summary.rawClippedFraction = summary.rawClippedPixelCount / pixelCount;
		summary.adcClippedFraction = summary.adcClippedPixelCount / pixelCount;
		summary.displayHighClippedFraction = summary.displayHighClippedPixelCount / pixelCount;
		summary.exactBlackFraction = summary.exactBlackPixelCount / pixelCount;
		summary.exactWhiteFraction = summary.exactWhitePixelCount / pixelCount;
		summary.meanEncodedLuminance /= pixelCount;
		summary.meanEncodedChroma /= pixelCount;
		return Object.freeze(summary);
	}

	select({mode, evaluations, policy, manualProfileId = null}) {
		requireCondition(MODES.has(mode), `Unsupported exposure-selection mode: ${mode}`);
		requireCondition(Array.isArray(evaluations) && evaluations.length > 0, 'Exposure selection requires candidate evaluations.');
		const unique = new Set(evaluations.map(({profileId}) => profileId));
		requireCondition(unique.size === evaluations.length, 'Exposure candidate profile IDs must be unique.');
		if (mode === 'manual') {
			const selected = evaluations.find(({profileId}) => profileId === manualProfileId);
			requireCondition(selected, 'Manual exposure profile was not evaluated.');
			return Object.freeze({mode, selected, qualified: [selected], rejected: [], rationale: 'Manual mode honors the explicitly selected complete profile; no optimization is performed.'});
		}
		finiteFraction(policy.maximumRawClippedFraction, 'Raw clipping budget');
		finiteFraction(policy.maximumAdcClippedFraction, 'ADC clipping budget');
		finiteFraction(policy.maximumDisplayHighClippedFraction, 'Display-high clipping budget');
		finiteFraction(policy.maximumExactWhiteFraction, 'Exact-white budget');
		const qualified = [];
		const rejected = [];
		for (const evaluation of evaluations) {
			const reasons = [];
			if (evaluation.nonFinitePixelCount !== 0) reasons.push('non-finite-intermediate');
			if (evaluation.rawClippedFraction > policy.maximumRawClippedFraction) reasons.push('raw-clipping-budget');
			if (evaluation.adcClippedFraction > policy.maximumAdcClippedFraction) reasons.push('adc-clipping-budget');
			if (evaluation.displayHighClippedFraction > policy.maximumDisplayHighClippedFraction) reasons.push('display-high-clipping-budget');
			if (evaluation.exactWhiteFraction > policy.maximumExactWhiteFraction) reasons.push('exact-white-budget');
			if (policy.previousOpticalExposureFactor != null && policy.maximumExposureChangeEv != null) {
				const changeEv = Math.abs(Math.log2(evaluation.opticalExposureFactor / policy.previousOpticalExposureFactor));
				if (changeEv > policy.maximumExposureChangeEv) reasons.push('exposure-continuity-budget');
			}
			if (mode === 'disk-visible') {
				const disk = evaluation.samples[policy.diskSampleId];
				if (!disk || disk.rawClipped.some(Boolean)) reasons.push('disk-raw-clipped');
			}
			if (reasons.length === 0) qualified.push(evaluation); else rejected.push({profileId: evaluation.profileId, reasons});
		}
		qualified.sort(stableRank);
		return Object.freeze({
			mode,
			selected: qualified[0] ?? null,
			qualified,
			rejected,
			rationale: qualified.length === 0
				? 'No candidate satisfies the declared application constraints.'
				: 'Select the brightest encoded field among candidates satisfying all clipping, visibility, and optional continuity constraints; break ties by less display/raw clipping and stable profile ID.',
		});
	}
}
