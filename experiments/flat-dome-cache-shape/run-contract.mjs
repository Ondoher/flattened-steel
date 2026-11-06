import assert from 'node:assert/strict';
import {cases, directions, medium} from './physical.mjs';
import {topology} from './topology.mjs';
import {apex, clearance, diskRadius} from './geometry.mjs';
import {createRun, identity} from './io.mjs';

const run = createRun('m1-contract', [
	identity('tmp/experiments/flat-dome-cache-shape/runs/00001-m1-boundary/manifest.json'),
	identity('src/algorithm32/profiles/native-15/consts.js'),
	identity('src/algorithm32/implementation/canonical-atmosphere/consts.js'),
	identity('references/downloads/libradtran-2.0.1/libRadtran-2.0.1/src_py/geometry_options.py'),
	identity('references/downloads/libradtran-2.0.1/libRadtran-2.0.1/src_py/spectral_options.py'),
	identity('references/downloads/cie-1931-2deg/CIE_xyz_1931_2deg.csv'),
]);
try {
	const angular = directions();
	assert.equal(angular.length, 98);
	assert.ok(Math.abs(angular.reduce((sum, d) => sum + d.weight, 0) - 4 * Math.PI) < 1e-10);
	assert.ok(angular.every((d, i) => angular[d.mirror].mirror === i));
	const forecast = [];
	let maximumCoordinateError = 0;
	for (const sourceFraction of [0.375, 0.5, 0.625]) {
		for (const count of [2, 4, 8, 16, 32, 64]) {
			const layout = topology(count, sourceFraction * diskRadius);
			for (const node of layout.nodes) {
				const error = Math.abs(clearance(node.point) - node.distance);
				maximumCoordinateError = Math.max(maximumCoordinateError, error);
				assert.ok(error < 1e-6 && node.point.every(Number.isFinite));
			}
			forecast.push({count, sourceFraction, nodes: layout.nodes.length, boundarySupport: layout.boundarySupportNodes,
				oneRgba32FieldBytes: layout.nodes.length * angular.length * 4 * 16,
				fourRetainedFieldsBytes: layout.nodes.length * angular.length * 4 * 16 * 4,
				meaning: 'Forecast only; four spectral RGBA groups preserve 15 Native channels. Actual GPU allocation and time require M2.'});
		}
	}
	const benchmark = cases();
	assert.equal(benchmark.length, 567);
	assert.ok(benchmark.every((item) => Math.abs(clearance(item.origin) - item.distance) < 1e-6));
	run.write('benchmark.json', {medium, cases: benchmark, pilot: cases(true), units: {position: 'meters', wavelength: 'nanometers', extinction: 'm^-1', sourceIrradiance: 'W m^-2 nm^-1', radiance: 'W m^-2 sr^-1 nm^-1'}, sourceMeaning: 'Finite point source, fixed height 4828032m; direct solar disk excluded.', spectralMeaning: 'Native15 labeled bins, center-evaluated optical coefficients held within each bin for this isolated baseline.'});
	run.write('angular-grid.json', angular);
	run.write('forecast.json', {forecast, maximumCoordinateError, apex, diskRadius});
	run.write('comparison-contract.json', {
		cache: {storedQuantity: 'In-scattering source function per extinction for orders 2,3,4 and cumulative higher orders; analytic direct/J1 contribution computed separately.', interpolation: 'Curvilinear altitude, normalized reachable source-distance beta, row-clearance gamma; nominal global quadratic nodes plus counted valid-row endpoints.', paths: 24, incomingDirections: 98, outgoingDirections: 98, wavelengthChannels: 15, floatFormat: 'RGBA32F', independentVariable: 'Quadratic dome-distance slice count only.'},
		probe: {parent: 'experiments/sky-accuracy-dials/horizon-reference/gpu.mjs', adaptation: 'Independent cap boundary in shader; truncate pure-order reporting at fourth interaction; direct J1 convergence separately checked.', uncertainty: 'Independent batch means, marginal 95% intervals; increase sampling when uncertainty masks count differences.'},
		libRadtran: {installed: 'uvspec 2.0.1-MYSTIC', exactFiniteCapFiniteSource: 'Not established by installed solar-source/geometry option contracts.', guide: 'Actual locally matched collimated-source atmosphere controls using same spectral coefficients and phase; label cap/source geometry mismatch and all-orders versus J4.', tierUse: 'Only physically/order-compatible observables; incompatible guide radiance is not an interpolation-error authority.'},
		color: {cie: 'references/downloads/cie-1931-2deg/CIE_xyz_1931_2deg.csv', integration: 'CIE weights integrated across the declared Native15 bin extents; common physical spectral values.', exposure: 0.06, display: 'Linear XYZ to linear sRGB, fixed common exposure, sRGB OETF; negative/out-of-gamut channels flagged, no per-cell adjustment.', supplementalExposure: 0.48},
		metrics: {spectral: 'Integrated absolute error / max(integrated reference radiance, reference-only dark floor).', darkFloor: '1e-6 times reference-only p95 integrated radiance, with absolute error retained.', tiers: [0.005, 0.01, 0.02, 0.05], tierAuthority: 'Applicable independent probe at matching order; compatible libRadtran controls qualify shared physics, not the unsupported cap geometry.'},
		controls: {boundary: '190 accepted analytic/coordinate checks in parent run; no scattering claim.', development: 'Common 567-case matrix, frozen independently of cache nodes.', heldOut: 'Additional off-panel heights/clearances and azimuths generated and frozen before M3 output inspection.', floorDiagnostics: 'Refine path quadrature and base angular/spatial controls separately before interpreting count plateaus.'},
	});
	run.finish('accepted', {message: 'Initial physical matrix, formula, valid-domain geometry, angular reflection, forecast, and comparison roles are pinned. No scattering result yet.', cases: benchmark.length, maximumCoordinateError, forecast});
	console.log(JSON.stringify({run: run.root, cases: benchmark.length, maximumCoordinateError, forecast}));
} catch (error) {
	run.write('failure.json', {error: String(error), stack: error.stack});
	run.finish('failed', {message: String(error)});
	throw error;
}
