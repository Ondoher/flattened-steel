import {medium} from './physical.mjs';
import {color, errors} from './color.mjs';

/**
 * Returns a nearest-rank quantile with equal weight for every physical case.
 *
 * @param {number[]} values - Finite observations.
 * @param {number} q - Quantile in zero through one.
 * @returns {number} - Observed quantile.
 */
export function quantile(values, q) {
	const ordered = [...values].sort((a, b) => a - b);
	return ordered[Math.max(0, Math.ceil(q * ordered.length) - 1)] ?? 0;
}

/**
 * Integrates a Native15 spectrum with the pinned wavelength-bin widths.
 *
 * @param {number[]} values - Spectral radiance or absolute differences.
 * @returns {number} - W m^-2 sr^-1.
 */
export function integrated(values) {
	return values.reduce((sum, value, c) => sum + value * medium.widths[c], 0);
}

/**
 * Groups independent channel results without reading candidate values.
 *
 * @param {DomeReferenceRow[]} rows - Finalized independent-reference channel observations.
 * @returns {Map<string, DomeReferenceRow[]>} - Physical-ray channels in spectral order.
 */
export function referenceMap(rows) {
	const result = new Map();
	for (const row of rows) {
		if (!result.has(row.id)) {
			result.set(row.id, []);
		}
		result.get(row.id)[row.channel] = row;
	}
	return result;
}

/**
 * Freezes dark floors solely from independent development spectra.
 *
 * @param {Map<string, DomeReferenceRow[]>} reference - Grouped independent observations.
 * @param {DomeCase[]} selected - Frozen development cases.
 * @returns {number[]} - One floor per pure order followed by cumulative J1-J4.
 */
export function darkFloors(reference, selected) {
	return Array.from(
		{length: 5},
		(_, order) =>
			1e-6 *
			quantile(
				selected.map((item) =>
					integrated(reference.get(item.id).map((row) => (order < 4 ? row.pureOrders[order] : row.total))),
				),
				0.95,
			),
	);
}

/**
 * Measures errors and sampling resolution without scoring unmatched native guides.
 *
 * @param {DomeCachedRay} cached - Finalized candidate ray output.
 * @param {DomeReferenceRow[]} reference - Matching channel-wise probe observations.
 * @param {number[]} floors - Reference-only frozen dark floors.
 * @returns {DomeComparison} - Pure/cumulative errors, physical spectra, and uncertainty.
 */
export function compare(cached, reference, floors) {
	const spectra = [
		cached.orders[0].map((_, c) => cached.orders.reduce((sum, order) => sum + order[c], 0)),
		reference.map((row) => row.total),
	];
	const perOrder = Array.from({length: 5}, (_, order) => {
		const a = order < 4 ? cached.orders[order] : spectra[0];
		const b = order < 4 ? reference.map((row) => row.pureOrders[order]) : spectra[1];
		const denominator = integrated(b.map(Math.abs));
		const absolute = integrated(a.map((v, c) => Math.abs(v - b[c])));
		const batchSpectra = Array.from({length: 8}, (_, batch) =>
			reference.map((row) =>
				order < 4 ? row.orderBatches[batch][order] : row.orderBatches[batch].reduce((sum, v) => sum + v, 0),
			),
		);
		const batchTotals = batchSpectra.map(integrated);
		const mean = batchTotals.reduce((sum, v) => sum + v, 0) / 8;
		const half95 = 2.365 * Math.sqrt(batchTotals.reduce((sum, v) => sum + (v - mean) ** 2, 0) / 56);
		const channelBounds = b.map(
			(mean, channel) =>
				2.365 * Math.sqrt(batchSpectra.reduce((sum, batch) => sum + (batch[channel] - mean) ** 2, 0) / 56),
		);
		return {
			absolute,
			relative: absolute / Math.max(denominator, floors[order]),
			dark: denominator < floors[order],
			referenceIntegrated: denominator,
			integratedHalf95: half95,
			conservativeBandHalf95: integrated(channelBounds),
			relativeHalf95: half95 / Math.max(denominator, floors[order]),
		};
	});
	return {
		id: cached.id,
		spectra,
		perOrder,
		...errors(spectra[0], spectra[1]),
		colors: spectra.map((spectrum) => color(spectrum)),
	};
}

/**
 * Summarizes a count or declared physical stratum without treating vacuum as a tier pass.
 *
 * @param {DomeComparison[]} rows - Physical comparisons.
 * @returns {DomeAccuracySummary} - Equal-case radiometric/color summaries and worst identities.
 */
export function summarize(rows) {
	const nonDark = rows.filter((row) => !row.perOrder[4].dark);
	const stats = (values) => ({
		median: quantile(values, 0.5),
		p95: quantile(values, 0.95),
		maximum: Math.max(0, ...values),
	});
	const worst = [...nonDark].sort((a, b) => b.perOrder[4].relative - a.perOrder[4].relative)[0];
	return {
		cases: rows.length,
		nonDark: nonDark.length,
		dark: rows.length - nonDark.length,
		spectral: stats(nonDark.map((r) => r.perOrder[4].relative)),
		absolute: stats(rows.map((r) => r.perOrder[4].absolute)),
		luminance: stats(nonDark.map((r) => r.luminanceRelative)),
		deltaE76: stats(rows.map((r) => r.deltaE76)),
		uncertainty: stats(nonDark.map((r) => r.perOrder[4].relativeHalf95)),
		conservativeBandUncertainty: stats(
			nonDark.map((r) => r.perOrder[4].conservativeBandHalf95 / r.perOrder[4].referenceIntegrated),
		),
		pureOrders: [0, 1, 2, 3].map((order) =>
			stats(rows.filter((r) => !r.perOrder[order].dark).map((r) => r.perOrder[order].relative)),
		),
		worst: worst
			? {id: worst.id, relative: worst.perOrder[4].relative, uncertainty: worst.perOrder[4].relativeHalf95}
			: null,
	};
}
