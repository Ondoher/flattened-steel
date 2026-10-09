import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {nativeViewRadiance} from './native-grid-reference.js';
import {nativeReceiverQuadrature} from './native-receiver-quadrature.js';
import {nativeReceiverKnotQuadrature} from './native-receiver-knot-quadrature.js';
import {nativeReceiverHorizonTail} from './native-receiver-tail.js';
import {nativeReceiverSunAzimuth} from './native-receiver-sun-azimuth.js';
import {receiverPrimaryControl} from './native-receiver-primary-control.js';
import {openNativeParent} from './native-parent-reader.js';
import {residual} from './native-spectral-comparison.js';
import {repositoryRoot, checkPath, hash} from './run-boundary.js';
import {requireHeavyExecution} from './heavy-execution-admission.js';

/** Evaluate complete views and receiver irradiance from authenticated independent grids.
 * @returns {Promise<void>} - Sealed raw measurements; all refinement budgets remain required.
 */
async function main() {
	await requireHeavyExecution();
	const run = await ExperimentRun.create('p3-native-view');
	try {
		const [nativeName, candidateName] = process.argv.slice(2),
			order = Number(process.argv.find((value) => value.startsWith('--gauss='))?.slice(8) ?? 16),
			receiverPolar = Number(process.argv.find((value) => value.startsWith('--receiver-polar='))?.slice(17) ?? 0),
			receiverAzimuth = Number(
				process.argv.find((value) => value.startsWith('--receiver-azimuth='))?.slice(19) ?? 0,
			);
		const receiverKnotsRun = process.argv
			.find((value) => value.startsWith('--receiver-knots='))
			?.slice('--receiver-knots='.length);
		const horizonTail = process.argv.includes('--receiver-horizon-tail');
		const phaseAzimuth = process.argv.includes('--receiver-phase-azimuth');
		const primaryControl = process.argv.includes('--receiver-primary-control');
		if (primaryControl && (!receiverKnotsRun || !horizonTail || !receiverPolar || !receiverAzimuth))
			throw new Error('Primary control requires explicit bounded positive receiver products.');
		const sunAzimuth = process.argv.includes('--receiver-sun-azimuth') || phaseAzimuth;
		if (sunAzimuth && !horizonTail)
			throw new Error('Sun-aligned Gaussian azimuth requires the explicitly bounded polar rule.');
		if (horizonTail && !receiverKnotsRun)
			throw new Error('A bounded receiver horizon tail requires explicit independent polar support.');
		if (
			['--receiver-trapezoid', '--receiver-sinh', '--receiver-square'].filter((flag) =>
				process.argv.includes(flag),
			).length +
				Number(Boolean(receiverKnotsRun)) >
			1
		)
			throw new Error('One independent receiver polar rule required.');
		const receiverRule = receiverKnotsRun
			? 'native-knots-gauss'
			: process.argv.includes('--receiver-trapezoid')
				? 'trapezoid-sinh5'
				: process.argv.includes('--receiver-sinh')
					? 'gauss-sinh5'
					: process.argv.includes('--receiver-square')
						? 'gauss-square'
						: 'gauss';
		// Snapshot the executable closure before any lengthy parent authentication,
		// decoding or computation. Later edits cannot be relabeled as this run's code.
		const implementation = [];
		for (const relative of [
			'evaluate-native-views.js',
			'heavy-execution-admission.js',
			'native-grid-reference.js',
			'native-receiver-quadrature.js',
			'native-receiver-knot-quadrature.js',
			'native-receiver-tail.js',
			'native-receiver-sun-azimuth.js',
			'native-receiver-primary-control.js',
			'native-parent-reader.js',
			'primary-oracle.js',
			'continuous-reference.js',
			'native-spectral-comparison.js',
			'ExperimentRun.js',
			'parent-evidence.js',
			'run-boundary.js',
			'../../src/algorithm32/implementation/canonical-atmosphere/consts.js',
			'../../src/algorithm32/profiles/native-15/consts.js',
		]) {
			const file = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse', relative);
			await checkPath(repositoryRoot, file);
			const bytes = await readFile(file);
			implementation.push({path: path.relative(repositoryRoot, file).replaceAll('\\', '/'), sha256: hash(bytes)});
			await run.write('source-' + relative.replaceAll('/', '-'), bytes);
		}
		const receiverSupportParent = receiverKnotsRun ? await readParent(receiverKnotsRun, 'input.json') : null;
		const receiverSupport = receiverSupportParent
			? JSON.parse(new TextDecoder().decode(receiverSupportParent.bytes)).mu
			: null;
		let product = receiverSupport
			? nativeReceiverKnotQuadrature(receiverPolar, receiverAzimuth, receiverSupport, horizonTail)
			: receiverPolar || receiverAzimuth
				? nativeReceiverQuadrature(
						receiverPolar,
						receiverAzimuth,
						/** @type {LocalSunNativeReceiverRule} */ (receiverRule),
					)
				: null;
		if (receiverRule !== 'gauss' && !product)
			throw new Error('A transformed receiver rule requires explicit polar and azimuth product counts.');
		const receiverCount =
			product?.length ?? Number(process.argv.find((value) => value.startsWith('--receiver='))?.slice(11) ?? 128);
		if (
			!nativeName ||
			!candidateName ||
			![4, 8, 16, 32].includes(order) ||
			![128, 256, 512, 1024].includes(receiverCount)
		)
			throw new Error('Native export, captured candidate and bounded independent refinements required.');
		const reader = await openNativeParent(nativeName),
			nativeParent = reader.metadata,
			inputParent = await reader.read('input.json'),
			nativeProvenance = await reader.read('inputs.json');
		const candidateParent = await readParent(candidateName, 'result.json'),
			recipeParent = await readParent(candidateName, 'recipe.json'),
			gateParent = await readParent(candidateName, 'gates.json');
		const native = JSON.parse(new TextDecoder().decode(nativeParent.bytes)),
			input = JSON.parse(new TextDecoder().decode(inputParent.bytes));
		/** @type {LocalSunShellCaptureRequest} */ const recipe = JSON.parse(
			new TextDecoder().decode(recipeParent.bytes),
		);
		/** @type {LocalSunNativeViewCapture} */ const capture = JSON.parse(
			new TextDecoder().decode(candidateParent.bytes),
		);
		const candidate = capture.results.find((item) => item.candidate),
			metadata = native.fields;
		const receiverAzimuthOrigin = Math.atan2(
			recipe.state.geometry.sourcePosition.coordinates[1] - recipe.state.geometry.observerPosition.coordinates[1],
			recipe.state.geometry.sourcePosition.coordinates[0] - recipe.state.geometry.observerPosition.coordinates[0],
		);
		const sourceDelta = recipe.state.geometry.sourcePosition.coordinates.map(
			(value, index) => value - recipe.state.geometry.observerPosition.coordinates[index],
		);
		const receiverSourceCosine = sourceDelta[2] / Math.hypot(...sourceDelta);
		if (sunAzimuth)
			product = nativeReceiverSunAzimuth(
				product,
				receiverAzimuth,
				receiverAzimuthOrigin,
				phaseAzimuth ? receiverSourceCosine : undefined,
			);
		if (
			!candidate ||
			candidate.cpuRays.length !== 96 ||
			candidate.gpuRays.length !== 96 ||
			metadata?.schema !== 'binary64-native-source-function-grid-v1' ||
			metadata.encoding !== 'IEEE754-binary64-little-endian' ||
			metadata.normalization !== 'physical scattering density divided by local extinction' ||
			metadata.channels !== 15 ||
			metadata.orders.join(',') !== 'J2,J3,J4'
		)
			throw new Error('Complete independent grids and frozen 96-ray capture required.');
		if (
			input.height !== recipe.state.geometry.sourcePosition.coordinates[2] ||
			input.top !== recipe.layout.top ||
			input.radius !== recipe.layout.maximumRho ||
			input.referenceDistance !== recipe.state.source.referenceDistance.value ||
			input.sourceScale !== recipe.state.source.referenceSpectralIncidentScale ||
			JSON.stringify(input.irradiance) !== JSON.stringify(recipe.state.source.sourceIrradiance.values)
		)
			throw new Error('Native/candidate physical compatibility failed.');
		const expected =
			metadata.altitudes.length * metadata.radial.length * metadata.polar.length * metadata.azimuthCount;
		if (
			JSON.stringify(metadata.shape) !==
				JSON.stringify([
					metadata.altitudes.length,
					metadata.radial.length,
					metadata.polar.length,
					metadata.azimuthCount,
				]) ||
			!Number.isSafeInteger(expected) ||
			expected <= 0
		)
			throw new Error('Invalid independent tensor shape.');
		const parents = [
			nativeParent,
			inputParent,
			nativeProvenance,
			candidateParent,
			recipeParent,
			gateParent,
			...(receiverSupportParent ? [receiverSupportParent] : []),
		];
		/** @type {Float64Array[][]} */ const fields = [];
		for (const name of metadata.orders) {
			const spectral = [];
			for (let c = 0; c < 15; c++) {
				const parent = await reader.read(`fields/${name}-c${c}.bin`);
				parents.push(parent);
				if (parent.bytes.byteLength !== expected * 8)
					throw new Error('Independent binary64 field length mismatch.');
				const littleEndian = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;
				const shared = littleEndian && parent.bytes.byteOffset % 8 === 0;
				const view = new DataView(parent.bytes.buffer, parent.bytes.byteOffset, parent.bytes.byteLength),
					values = shared ? new Float64Array(parent.bytes.buffer, parent.bytes.byteOffset, expected) : new Float64Array(expected);
				for (let i = 0; i < expected; i++) {
					const value = shared ? values[i] : view.getFloat64(i * 8, true);
					if (!Number.isFinite(value) || value < -1e-12)
						throw new Error('Nonfinite/negative independent source function.');
					if (!shared) values[i] = value;
				}
				spectral.push(values);
				// Retain authenticated identities without keeping duplicate serialized bytes.
				parents[parents.length - 1] = {...parent, bytes: new Uint8Array()};
			}
			fields.push(spectral);
			await run.progress('reference', `Loaded all fifteen ${name} source functions.`);
		}
		/** @type {LocalSunNativeFieldGrid} */ const grid = {
			top: input.top,
			radius: input.radius,
			altitudes: metadata.altitudes,
			radial: metadata.radial,
			polar: metadata.polar,
			azimuthCount: metadata.azimuthCount,
			betaR: input.betaR,
			betaM: input.betaM,
			rayleighHeight: input.rayleighHeight,
			mieHeight: input.mieHeight,
			fields,
		};
		const receiverHorizonCutoff = horizonTail ? receiverSupport.find((value) => value > 0) : 0;
		const receiverHorizonTailBounds = horizonTail
			? nativeReceiverHorizonTail(grid, recipe.state, receiverHorizonCutoff)
			: null;
		await run.write(
			'inputs.json',
			JSON.stringify(
				{
					schema: 'native-complete-view-input-v1',
					parents: parents.map(({bytes, ...identity}) => identity),
					implementation,
					parameters: {
						order,
						receiverCount,
						primaryControl,
						receiverRule: receiverSupport
							? horizonTail
								? 'product-native-knots-tail-gauss-v1'
								: 'product-native-knots-gauss-v1'
							: product
								? receiverRule === 'gauss'
									? 'product-gauss-v1'
									: receiverRule === 'gauss-sinh5'
										? 'product-gauss-sinh5-v1'
										: receiverRule === 'gauss-square'
											? 'product-gauss-square-v1'
											: 'product-positive-trapezoid-sinh5-v1'
								: 'cosine-hammersley-v1',
						receiverPolar,
						receiverAzimuth,
						...(sunAzimuth
							? {
									receiverAzimuthRule: phaseAzimuth
										? 'sun-phase-tan-half-gauss-constant-mass-v1'
										: 'sun-aligned-half-gauss-v1',
									receiverAzimuthOrigin,
									...(phaseAzimuth ? {receiverSourceCosine} : {}),
								}
							: {}),
						...(horizonTail
							? {receiverHorizonCutoff, receiverHorizonTailPolicy: 'positive-source-envelope-v1'}
							: {}),
						...(receiverSupportParent
							? {
									receiverSupportIdentity: {
										run: receiverSupportParent.run,
										artifactSha256: receiverSupportParent.artifactSha256,
									},
								}
							: {}),
						nativeSourceSha256: JSON.parse(new TextDecoder().decode(nativeProvenance.bytes)).sourceSha256,
					},
					tools: {node: process.version},
					command: process.argv.slice(1),
					operation:
						'Decode authenticated independent IEEE754 binary64 source-function grids. Integrate continuous J1 plus independent J2/J3/J4 with positive tensor reconstruction and piecewise Gaussian distance quadrature clipped to the actual observer dome/slab/cylinder. Evaluate every captured physical direction and independently refined cosine-weighted receiver directions; candidate spectra are comparison outputs only.',
				},
				null,
				'\t',
			),
		);
		const started = performance.now(),
			views = [];
		for (let i = 0; i < candidate.cpuRays.length; i++) {
			const ray = candidate.cpuRays[i],
				direction = ray.segment.ray.direction,
				result = nativeViewRadiance(grid, recipe.state, direction, order);
			views.push({
				...result,
				endpointDifferenceMeters: Math.abs(result.path.length - ray.segment.endDistance.value),
				rawPhysical: residual(candidate.gpuRays[i].radiance, result.total, 1e-9, 0.1),
			});
			if (i % 8 === 7) {
				await run.progress('views', `${i + 1}/96 complete physical views.`);
				await new Promise((resolve) => setTimeout(resolve, 0));
			}
		}
		const receiver = [],
			irradiance = new Array(15).fill(0);
		for (let i = 0; i < receiverCount; i++) {
			let bits = i,
				inverse = 0,
				place = 0.5;
			while (bits) {
				inverse += (bits & 1) * place;
				bits >>= 1;
				place *= 0.5;
			}
			const radius = Math.sqrt((i + 0.5) / receiverCount),
				phi = 2 * Math.PI * inverse;
			const direction = product?.[i].direction ?? [
					radius * Math.cos(phi),
					-radius * Math.sin(phi),
					Math.sqrt(1 - radius * radius),
				],
				weight = product?.[i].weight ?? Math.PI / receiverCount;
			const result = nativeViewRadiance(grid, recipe.state, direction, order);
			receiver.push({...result, weight});
			for (let c = 0; c < 15; c++) irradiance[c] += weight * result.total[c];
			if (i % 8 === 7) {
				await run.progress('receiver', `${i + 1}/${receiverCount} independent receiver directions.`);
				await new Promise((resolve) => setTimeout(resolve, 0));
			}
		}
		const observed = candidate.receiver.diffuseHorizontal.values;
		const receiverControl = primaryControl ? receiverPrimaryControl(receiver, receiverAzimuth, recipe.state) : null;
		if (receiverControl) for (let c = 0; c < 15; c++) irradiance[c] += receiverControl.correction[c];
		if (observed.length !== 15 || observed.some((value) => !Number.isFinite(value)))
			throw new Error('Complete measured receiver spectral inventory required.');
		await run.write(
			'result.json',
			JSON.stringify(
				{
					schema: 'native-complete-view-v1',
					views,
					receiver,
					irradiance,
					...(receiverHorizonTailBounds ? {receiverHorizonTailBounds} : {}),
					...(receiverControl ? {receiverPrimaryControl: receiverControl} : {}),
					rawReceiverPhysical: residual(observed, irradiance, 1e-9, 0.1),
					elapsedMilliseconds: performance.now() - started,
					qualified: false,
					claim: 'Raw independent finite-grid view and receiver measurements only. Native spatial/angular/construction-path, new view-path and receiver-direction convergence, propagated tails and roundoff must be combined before physical acceptance.',
				},
				null,
				'\t',
			),
		);
		await run.finish('accepted');
		console.log(
			JSON.stringify({
				run: run.name,
				views: views.length,
				rawViewFailures: views.reduce((sum, v) => sum + v.rawPhysical.failures, 0),
				endpointMaximumMeters: Math.max(...views.map((v) => v.endpointDifferenceMeters)),
				rawReceiver: residual(observed, irradiance, 1e-9, 0.1),
				qualified: false,
			}),
		);
	} catch (error) {
		await run.finish('failed', error instanceof Error ? error.stack : String(error));
		throw error;
	}
}
await main();
