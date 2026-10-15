import {compileRawOrders} from './raw-driver.js';
import {prepareFixedFieldReference, evaluateFixedDensityReference} from '../continuation/reference/fixed-field.mjs';
import {createPointStencilBuilder, viewPathIntervals, sampleDensity, integrateDensity} from '../numerics/view.js';

/** Run only raw recurrence and its final-view contrast. Consistently corrected recurrence is a missing cell.
 * @param {HypothesisSphericalInput} input @param {(message:string)=>Promise<void>} progress
 * @param {(value:HypothesisSphericalResult)=>Promise<void>} retain
 * @param {SkySixCommonModule} commonModule @returns {Promise<void>}
 */
export async function runSpherical(input, progress, retain, commonModule) {
	const guard = () => {
		if (Date.now() >= input.deadline) throw new Error('Spherical stage deadline reached.');
	};
	const reference = prepareFixedFieldReference(input.request, input.probes, guard);
	const builder = createPointStencilBuilder(input.request);
	const ordinary = input.probes.map((probe, sceneIndex) => ({
		probe,
		ray: {
			origin: probe.ray.origin,
			worldDirection: probe.ray.direction,
			sceneIndex,
			sceneId: probe.id,
			time: probe.time,
			gridX: probe.gridX,
			gridY: probe.gridY,
			length: probe.ray.length,
			samples: viewPathIntervals(input.request.transportSpec, probe.ray, 'quadratic', 30).map((interval) => {
				const d = (interval.start + interval.end) / 2;
				const point = /** @type {SkyVector3} */ ([
					probe.ray.origin[0] + d * probe.ray.direction[0],
					probe.ray.origin[1] + d * probe.ray.direction[1],
					probe.ray.origin[2] + d * probe.ray.direction[2],
				]);
				return builder.sample(point, probe.ray.direction, interval.end - interval.start);
			}),
		},
	}));
	const coordinates = [...reference.coordinates],
		indexes = new Map(coordinates.map((p, i) => [p.x + ':' + p.y, i]));
	const normalIndexes = builder.coordinates.map((p) => {
		const key = p.x + ':' + p.y;
		let id = indexes.get(key);
		if (id === undefined) {
			id = coordinates.length;
			indexes.set(key, id);
			coordinates.push(p);
		}
		return id;
	});
	const canvas = document.createElement('canvas'),
		gl = canvas.getContext('webgl2', {antialias: false, powerPreference: 'high-performance'});
	if (!gl) throw new Error('WebGL2 unavailable.');
	const debug = gl.getExtension('WEBGL_debug_renderer_info');
	const renderer = String(gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
	if (/swiftshader|llvmpipe|software/i.test(renderer)) throw new Error('Hardware GPU required: ' + renderer);
	try {
		for (const channel of input.channels) {
			guard();
			await progress('Compile raw ' + input.kind + ' channel ' + channel + '.');
			/** @type {Float32Array[]} */ const pure = [];
			const report = await compileRawOrders({
				gl,
				buildRequest: input.request,
				wavelengthIndex: channel,
				maximumOrder: input.maximumOrder,
				commonModule,
				compileSceneCaches: false,
				fieldProbeCoordinates: Object.fromEntries(
					Array.from({length: input.maximumOrder}, (_, i) => ['J' + (i + 1), coordinates]),
				),
				reportProgress: async (stage) => {
					guard();
					await progress('Channel ' + channel + ' ' + stage);
				},
				onFieldProbes: async (packet) => {
					guard();
					if (packet.fieldId.startsWith('J')) {
						if (packet.fieldId !== 'J' + (pure.length + 1))
							throw new Error('Pure-order callback prefix changed.');
						pure.push(Float32Array.from(packet.values, (v) => v.value));
					}
				},
			});
			// Preserve queried fields before reader evaluation, so repair never discards completed GPU work.
			const encoded = pure.map((field) => {
				const bytes = new Uint8Array(field.buffer);
				let text = '';
				for (let i = 0; i < bytes.length; i += 4096)
					text += String.fromCharCode(...bytes.subarray(i, i + 4096));
				return btoa(text);
			});
			await retain({
				renderer,
				rows: [],
				reports: [report],
				sparse: {channel, coordinates, encoded, scalarFormat: 'float32-le-v1'},
			});
			const local = pure.map((field) => field.slice(0, reference.coordinates.length));
			const higher = [new Float32Array(reference.coordinates.length)],
				cumulative = [];
			for (let n = 0; n < pure.length; n++) {
				const c = new Float32Array(coordinates.length);
				for (let i = 0; i < c.length; i++) c[i] = n === 0 ? pure[n][i] : cumulative[n - 1][i] + pure[n][i];
				cumulative.push(c);
				if (n > 0) {
					const h = new Float32Array(reference.coordinates.length);
					for (let i = 0; i < h.length; i++) h[i] = higher[n - 1][i] + local[n][i];
					higher.push(h);
				}
			}
			const evaluate = (slots) =>
				evaluateFixedDensityReference(
					input.request,
					reference,
					channel,
					'grouped',
					(sample, slot) =>
						input.kind === 'H'
							? sampleDensity(local[0], sample, 'monotone-cubic') +
								sampleDensity(higher[slots[slot - 1] - 1], sample, 'monotone-cubic')
							: sampleDensity(cumulative[slots[slot - 1] - 1], sample, 'monotone-cubic'),
					guard,
				);
			const first = evaluate([1, 2, 3, 4]);
			const tail = input.maximumOrder === 6 ? evaluate([3, 4, 5, 6]) : null;
			// The N4/N6 readings share exactly the same generated N1-N4 fields.
			if (tail)
				for (const row of tail.rows.filter((row) => row.order <= 2)) {
					const prefix = first.rows.find((p) => p.probeId === row.probeId && p.order === row.order + 2);
					if (!prefix || prefix.referenceW !== row.referenceW)
						throw new Error('Repeated N3/N4 view prefix changed.');
				}
			const pureRead = evaluateFixedDensityReference(
				input.request,
				reference,
				channel,
				'grouped',
				(sample, slot) => sampleDensity(local[slot - 1], sample, 'monotone-cubic'),
				guard,
			);
			const pureTail =
				input.maximumOrder === 6
					? evaluateFixedDensityReference(
							input.request,
							reference,
							channel,
							'grouped',
							(sample, slot) => sampleDensity(local[slot + 1], sample, 'monotone-cubic'),
							guard,
						)
					: null;
			/** @type {HypothesisSphericalRow[]} */ const rows = [];
			for (const entry of ordinary)
				for (let order = 1; order <= input.maximumOrder; order++) {
					const ref = (order <= 4 ? first.rows : tail.rows).find(
						(row) => row.probeId === entry.probe.id && row.order === (order <= 4 ? order : order - 2),
					);
					const normal = Float32Array.from(normalIndexes, (i) => cumulative[order - 1][i]);
					const rawW =
						input.kind === 'H'
							? ref.referenceW
							: integrateDensity(input.request.transportSpec, channel, entry.ray, (sample) =>
									sampleDensity(normal, sample, 'monotone-cubic'),
								);
					rows.push({
						probeId: entry.probe.id,
						channel,
						order,
						rawW,
						refinedW: ref.referenceW,
						refinedAllowanceW: ref.allowanceW ?? 0,
						refinedResolved: ref.resolved,
						pureW: [
							...pureRead.rows.filter((p) => p.probeId === entry.probe.id).map((p) => p.referenceW),
							...(pureTail?.rows
								.filter((p) => p.probeId === entry.probe.id && p.order > 2)
								.map((p) => p.referenceW) ?? []),
						],
					});
				}
			await retain({renderer, rows, reports: [report]});
		}
	} finally {
		gl.getExtension('WEBGL_lose_context')?.loseContext();
	}
}
