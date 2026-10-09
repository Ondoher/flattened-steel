import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {repositoryRoot, checkPath, hash} from './run-boundary.js';

/** Verify one independent complete-view refinement axis, retaining unresolved cells.
 * @returns {Promise<void>} - Sealed axis evidence; combined physical admission remains separate.
 */
async function main() {
	const run = await ExperimentRun.create('p3-view-converge');
	try {
		const dimension = process.argv[2],
			names = process.argv.slice(3);
		if (
			![
				'view-path',
				'receiver',
				'receiver-polar',
				'receiver-azimuth',
				'spatial',
				'angular',
				'construction-path',
			].includes(dimension) ||
			names.length !== 3
		)
			throw new Error('One named refinement axis and three complete-view runs required.');
		const parents = [],
			levels = [],
			implementations = [],
			parameters = [],
			nativeInputs = [],
			nativeNames = [],
			candidateIdentities = [];
		for (const name of names) {
			const result = await readParent(name, 'result.json'),
				provenance = await readParent(name, 'inputs.json');
			parents.push(result, provenance);
			/** @type {LocalSunNativeViewMeasurement} */ const level = JSON.parse(
				new TextDecoder().decode(result.bytes),
			);
			const input = JSON.parse(new TextDecoder().decode(provenance.bytes));
			if (
				level.schema !== 'native-complete-view-v1' ||
				input.schema !== 'native-complete-view-input-v1' ||
				!Array.isArray(input.implementation) ||
				!Array.isArray(input.parents) ||
				level.views.length !== 96 ||
				level.irradiance.length !== 15 ||
				level.receiver.length !== input.parameters.receiverCount
			)
				throw new Error('Complete immutable independent view inventory required.');
			levels.push(level);
			implementations.push(input.implementation);
			parameters.push(input.parameters);
			const native = input.parents.find((parent) => parent.artifact === 'input.json'),
				candidateRun = input.parents.find((parent) => parent.artifact === 'recipe.json')?.run,
				candidate = input.parents.filter(
					(parent) =>
						parent.run === candidateRun && (parent.artifact === 'recipe.json' ||
						parent.artifact === 'gates.json' ||
						(parent.artifact === 'result.json' && parent.run !== native?.run)),
				);
			if (!native || candidate.length !== 3)
				throw new Error('Complete native and candidate comparison provenance required.');
			nativeNames.push(native.run);
			candidateIdentities.push(candidate);
			const nativeInput = await readParent(native.run, 'input.json'),
				nativeProvenance = await readParent(native.run, 'inputs.json');
			parents.push(nativeInput, nativeProvenance);
			const source = JSON.parse(new TextDecoder().decode(nativeProvenance.bytes)).sourceSha256;
			if (source !== input.parameters.nativeSourceSha256 || !/^[0-9a-f]{64}$/u.test(source))
				throw new Error('Independent native source identity differs from the consumed export.');
			nativeInputs.push(JSON.parse(new TextDecoder().decode(nativeInput.bytes)));
		}
		if (
			implementations.some((value) => JSON.stringify(value) !== JSON.stringify(implementations[0])) ||
			candidateIdentities.some((value) => JSON.stringify(value) !== JSON.stringify(candidateIdentities[0]))
		)
			throw new Error('Complete-view code or captured physical ingress changed across refinement levels.');
		const parameterOmit =
			dimension === 'view-path'
				? ['order']
				: dimension === 'receiver'
					? ['receiverCount']
					: dimension === 'receiver-polar'
						? ['receiverCount', 'receiverPolar']
						: dimension === 'receiver-azimuth'
							? ['receiverCount', 'receiverAzimuth']
							: [];
		const normalizedParameters = parameters.map((value) =>
			Object.fromEntries(Object.entries(value).filter(([key]) => !parameterOmit.includes(key))),
		);
		if (normalizedParameters.some((value) => JSON.stringify(value) !== JSON.stringify(normalizedParameters[0])))
			throw new Error('More than one complete-view numerical axis changed.');
		const omitted =
			dimension === 'spatial'
				? ['radial', 'altitudes']
				: dimension === 'angular'
					? ['mu', 'muWeights', 'phi', 'outgoingMu']
					: dimension === 'construction-path'
						? ['intervals']
						: [];
		const normalizedInputs = nativeInputs.map((value) =>
			Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'threads' && !omitted.includes(key))),
		);
		if (normalizedInputs.some((value) => JSON.stringify(value) !== JSON.stringify(normalizedInputs[0])))
			throw new Error('More than one native construction axis changed.');
		for (let i = 1; i < 3; i++) {
			const a = parameters[i - 1],
				b = parameters[i],
				x = nativeInputs[i - 1],
				y = nativeInputs[i];
			if (
				(dimension === 'view-path' && b.order !== a.order * 2) ||
				(dimension.startsWith('receiver') && b.receiverCount !== a.receiverCount * 2) ||
				(dimension === 'receiver-polar' && b.receiverPolar !== a.receiverPolar * 2) ||
				(dimension === 'receiver-azimuth' && b.receiverAzimuth !== a.receiverAzimuth * 2) ||
				(dimension === 'construction-path' && y.intervals !== x.intervals * 2) ||
				(dimension === 'angular' && (y.mu.length !== x.mu.length * 2 || y.phi !== x.phi * 2)) ||
				(dimension === 'spatial' &&
					(y.radial.length !== (x.radial.length - 1) * 2 + 1 ||
						y.altitudes.length !== (x.altitudes.length - 1) * 2 + 1))
			)
				throw new Error('Reference levels are not successive independent bisections.');
			if (dimension === 'angular' && (x.outgoingMu || y.outgoingMu) &&
				(!x.outgoingMu || !y.outgoingMu || y.outgoingMu.length !== (x.outgoingMu.length - 1) * 2 + 1 ||
					x.outgoingMu.some((value, index) => y.outgoingMu[index * 2] !== value)))
				throw new Error('Outgoing support is not an exact nested bisection.');
			if (
				(dimension === 'receiver' && a.receiverRule?.startsWith('product-')) ||
				(dimension.startsWith('receiver-') &&
					(![
						'product-gauss-v1',
						'product-gauss-sinh5-v1',
						'product-gauss-square-v1',
						'product-native-knots-gauss-v1',
						'product-native-knots-tail-gauss-v1',
						'product-positive-trapezoid-sinh5-v1',
					].includes(a.receiverRule) ||
						a.receiverCount !== a.receiverPolar * a.receiverAzimuth ||
						b.receiverCount !== b.receiverPolar * b.receiverAzimuth))
			)
				throw new Error('Receiver refinement does not identify one independently changing product axis.');
		}
		if (parameterOmit.length && nativeNames.some((value) => value !== nativeNames[0]))
			throw new Error('Consumer-only refinement must consume the exact same native export.');
		const implementation = [];
		for (const relative of [
			'prove-native-view-convergence.js',
			'ExperimentRun.js',
			'parent-evidence.js',
			'run-boundary.js',
		]) {
			const target = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse', relative);
			await checkPath(repositoryRoot, target);
			const bytes = await readFile(target);
			implementation.push({
				path: path.relative(repositoryRoot, target).replaceAll('\\', '/'),
				sha256: hash(bytes),
			});
			await run.write('source-' + relative, bytes);
		}
		await run.write(
			'inputs.json',
			JSON.stringify(
				{
					schema: 'native-view-convergence-input-v1',
					parents: parents.map(({bytes, ...identity}) => identity),
					implementation,
					parameters: {
						dimension,
						absolute: 1e-9,
						relative: 0.1,
						maximumBudgetFraction: 0.1,
						tinyDifferenceAbsolute: 1e-15,
					},
					operation:
						'Authenticate identical complete-view implementations, physical ingress and native source; allow exactly one successive bisection axis. Per order and spectral channel, retain twice the final change and require reduction by at least two unless the last change is below 1e-15. Receiver direction refinement compares independently integrated irradiance, not unmatched direction samples.',
					command: process.argv.slice(1),
					tools: {node: process.version},
				},
				null,
				'\t',
			),
		);
		/** @type {LocalSunNativeViewConvergencePacket[]} */ const packets = [];
		const horizonTail = levels[2].receiverHorizonTailBounds;
		if (
			horizonTail &&
			(horizonTail.length !== 4 ||
				horizonTail.some(
					(values) => values.length !== 15 || values.some((value) => !Number.isFinite(value) || value < 0),
				))
		)
			throw new Error('Complete positive receiver horizon-tail bounds required.');
		const record = (
			/** @type {string} */ quantity,
			/** @type {number[][]} */ values,
			/** @type {number|null} */ ray,
		) => {
			if (values.some((value) => value.length !== 15 || value.some((v) => !Number.isFinite(v) || v < -1e-12)))
				throw new Error('Incomplete or nonphysical native view spectral packet.');
			const delta1 = values[1].map((v, c) => Math.abs(v - values[0][c])),
				delta2 = values[2].map((v, c) => Math.abs(v - values[1][c]));
			const additionalTail =
				horizonTail && quantity.startsWith('receiver-')
					? quantity === 'receiver-total'
						? horizonTail[0].map((_, c) => horizonTail.reduce((sum, order) => sum + order[c], 0))
						: [...horizonTail[Number(quantity.slice('receiver-L'.length)) - 1]]
					: new Array(15).fill(0);
			if (levels[2].receiverPrimaryControl && ['receiver-L1', 'receiver-total'].includes(quantity))
				for (let c = 0; c < 15; c++) additionalTail[c] += levels[2].receiverPrimaryControl.errorBounds[c];
			const uncertainty = delta2.map((v) => 2 * v),
				budgetFraction = uncertainty.map(
					(v, c) => (v + additionalTail[c]) / (1e-9 + 0.1 * Math.abs(values[2][c])),
				);
			const converged = uncertainty.map(
				(_, c) => budgetFraction[c] <= 0.1 && (delta2[c] < 1e-15 || delta2[c] <= delta1[c] / 2),
			);
			packets.push({
				quantity,
				ray,
				reference: values[2],
				delta1,
				delta2,
				uncertainty,
				additionalTail,
				budgetFraction,
				converged,
			});
		};
		for (let ray = 0; ray < 96; ray++) {
			const directions = levels.map((level) => level.views[ray].path.direction),
				endpoints = levels.map((level) => level.views[ray].path.length);
			if (
				directions.some((value) => JSON.stringify(value) !== JSON.stringify(directions[0])) ||
				endpoints.some((value) => value !== endpoints[0]) ||
				levels.some((level) => level.views[ray].endpointDifferenceMeters > 0.01)
			)
				throw new Error('Complete physical view ingress or endpoints changed across refinement levels.');
			for (let n = 0; n < 4; n++)
				record(
					'view-L' + (n + 1),
					levels.map((level) => level.views[ray].orders[n]),
					ray,
				);
			record(
				'view-total',
				levels.map((level) => level.views[ray].total),
				ray,
			);
		}
		for (let n = 0; n < 4; n++)
			record(
				'receiver-L' + (n + 1),
				levels.map((level) =>
					Array.from({length: 15}, (_, c) =>
						level.receiver.reduce(
							(sum, sample) =>
								sum + (sample.weight ?? Math.PI / level.receiver.length) * sample.orders[n][c],
							0,
						) + (n === 0 ? level.receiverPrimaryControl?.correction[c] ?? 0 : 0),
					),
				),
				null,
			);
		record(
			'receiver-total',
			levels.map((level) => level.irradiance),
			null,
		);
		const quantities = [...new Set(packets.map((packet) => packet.quantity))],
			measurements = quantities.map((quantity) => {
				const selected = packets.filter((packet) => packet.quantity === quantity),
					unresolvedChannels = selected.reduce(
						(sum, packet) => sum + packet.converged.filter((value) => !value).length,
						0,
					);
				return {
					quantity,
					unresolvedChannels,
					maximumBudgetFraction: Math.max(...selected.flatMap((packet) => packet.budgetFraction)),
					qualified: unresolvedChannels === 0,
				};
			});
		const qualified = measurements.every((value) => value.qualified);
		await run.write(
			'result.json',
			JSON.stringify(
				{
					schema: 'native-view-convergence-v1',
					dimension,
					packets,
					measurements,
					qualified,
					claim: 'One independent refinement axis only. Combine all native spatial/angular/construction-path and consumer view-path/receiver-direction uncertainties, positive optical tails and roundoff before physical candidate acceptance.',
				},
				null,
				'\t',
			),
		);
		await run.finish('accepted');
		console.log(JSON.stringify({run: run.name, dimension, measurements, qualified}));
	} catch (error) {
		await run.finish('failed', error instanceof Error ? error.stack : String(error));
		throw error;
	}
}
await main();
