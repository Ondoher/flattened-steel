import {createPass, floatTarget, dataTexture, checkDraw} from './three-pass.mjs';
import {DomeCacheResource} from './DomeCacheResource.mjs';

/**
 * Builds the authenticated deterministic dome field on the scene's Three context.
 */
export class DomeCacheBuilder {
	/**
	 * Uses an existing renderer, never a hidden raw-WebGL context.
	 *
	 * @param {DomeThreeRenderer} renderer - Shared scene renderer.
	 */
	constructor(renderer) {
		this.renderer = renderer;
	}

	/**
	 * Builds pure orders, validates cumulative retention, and returns the live field.
	 *
	 * @param {DomeSceneRequest} request - Frozen physical/build inputs.
	 * @returns {Promise<DomeCacheResource>} - Completed resource for the scene.
	 */
	async build(request) {
		const renderer = this.renderer;
		const layout = request.layout;
		const width = 98 * 4,
			height = layout.nodes.length;
		const maximum = renderer.getContext().getParameter(renderer.getContext().MAX_TEXTURE_SIZE);
		if (height > maximum || width > maximum) {
			throw new Error('Cache exceeds actual device texture dimensions.');
		}
		const positions = dataTexture(
			layout.nodes.flatMap((node) => [...node.point, node.distance]),
			1,
			height,
		);
		const rows = dataTexture(
			layout.rows.flatMap((row) => [row.offset, row.count, row.lower, row.upper]),
			layout.betaCount,
			layout.altitudes.length,
		);
		const fields = [floatTarget(width, height), floatTarget(width, height), floatTarget(width, height)];
		const cumulative = floatTarget(width, height);
		/** @type {DomeThreeUniforms} */
		const uniforms = {
			uPositions: {value: positions},
			uRows: {value: rows},
			uPrevious: {value: positions},
			uSunRadius: {value: layout.sourceRadius},
			uOrder: {value: 2},
		};
		const build = createPass(request.shaders.build, uniforms, width, height);
		const sum = createPass(
			'#version 300 es\nprecision highp float;uniform sampler2D a,b,c;out vec4 result;void main(){ivec2 p=ivec2(gl_FragCoord.xy);result=texelFetch(a,p,0)+texelFetch(b,p,0)+texelFetch(c,p,0);}',
			{a: {value: fields[0].texture}, b: {value: fields[1].texture}, c: {value: fields[2].texture}},
			width,
			height,
		);
		let success = false;
		try {
			const compileStart = performance.now();
			await build.prepare(renderer);
			await sum.prepare(renderer);
			const compilationMilliseconds = performance.now() - compileStart;
			const start = performance.now();
			const diagnostics = [];
			const snapshots = [];
			const orderMilliseconds = [];
			for (let order = 2; order <= 4; order++) {
				uniforms.uOrder.value = order;
				uniforms.uPrevious.value = order === 2 ? positions : fields[order - 3].texture;
				const target = fields[order - 2];
				target.scissorTest = true;
				const orderStart = performance.now();
				for (let first = 0; first < height; first += 8) {
					target.scissor.set(0, first, width, Math.min(8, height - first));
					build.render(renderer, target);
					checkDraw(renderer, build);
					if (first % 256 === 0) {
						await window.domeProgress('cache', `Three N12 order${order}: ${first}/${height} nodes.`);
						await new Promise((resolve) => setTimeout(resolve, 0));
					}
				}
				orderMilliseconds.push(performance.now() - orderStart);
				target.scissorTest = false;
				const values = new Float32Array(width * height * 4);
				renderer.readRenderTargetPixels(target, 0, 0, width, height, values);
				let maximumValue = 0;
				for (const value of values) {
					if (!Number.isFinite(value) || value < 0) {
						throw new Error(`Invalid Three cache field order${order}.`);
					}
					maximumValue = Math.max(maximumValue, value);
				}
				diagnostics.push({order, maximum: maximumValue, nonfinite: 0, negative: 0});
				snapshots.push(values);
			}
			sum.render(renderer, cumulative);
			checkDraw(renderer, sum);
			const values = new Float32Array(width * height * 4);
			renderer.readRenderTargetPixels(cumulative, 0, 0, width, height, values);
			let maximumCumulativeRelativeError = 0;
			for (let i = 0; i < values.length; i++) {
				const expected = snapshots[0][i] + snapshots[1][i] + snapshots[2][i];
				maximumCumulativeRelativeError = Math.max(
					maximumCumulativeRelativeError,
					Math.abs(values[i] - expected) / Math.max(1e-20, expected),
				);
			}
			if (maximumCumulativeRelativeError > 1e-4) {
				throw new Error('Three cumulative field differs from its pure orders.');
			}
			const fieldConstructionAndInspectionMilliseconds = performance.now() - start;
			const queryStarted = performance.now();
			if (request.stage === 'cache') {
				const queries = dataTexture(
					request.queries.flatMap((item) => [...item.origin, item.entry, ...item.direction, item.end]),
					2,
					request.queries.length,
				);
				const queryUniforms = {
					uPositions: {value: positions},
					uRows: {value: rows},
					uSecond: {value: fields[0].texture},
					uThird: {value: fields[1].texture},
					uFourth: {value: fields[2].texture},
					uQueries: {value: queries},
					uSunRadius: {value: layout.sourceRadius},
				};
				const query = createPass(request.shaders.view, queryUniforms, 4, request.queries.length);
				const output = floatTarget(4, request.queries.length, 4);
				try {
					await query.prepare(renderer);
					query.render(renderer, output);
					checkDraw(renderer, query);
					const samples = [];
					for (let order = 0; order < 4; order++) {
						const array = new Float32Array(request.queries.length * 16);
						renderer.readRenderTargetPixels(output, 0, 0, 4, request.queries.length, array, 0, order);
						samples.push(array);
					}
					await window.domeArtifact(
						'three-query.json',
						request.queries.map((item, i) => ({
							id: item.id,
							orders: samples.map((array) => Array.from(array.slice(i * 16, i * 16 + 15))),
						})),
					);
				} finally {
					query.dispose();
					output.dispose();
					queries.dispose();
				}
			}
			const comparisonQueryMilliseconds = performance.now() - queryStarted;
			const metadata = {
				width,
				height,
				nodes: height,
				compilationMilliseconds,
				constructionInspectionAndComparisonMilliseconds: performance.now() - start,
				fieldConstructionAndInspectionMilliseconds,
				comparisonQueryMilliseconds,
				orderMilliseconds,
				diagnostics,
				maximumCumulativeRelativeError,
				retainedTextureBytes: width * height * 16 + height * 16 + layout.rows.length * 16,
				peakCacheTextureBytes: 4 * width * height * 16 + height * 16 + layout.rows.length * 16,
				generation: 1,
			};
			await window.domeArtifact('cache-build.json', metadata);
			success = true;
			return new DomeCacheResource(cumulative, positions, rows, layout, metadata);
		} finally {
			build.dispose();
			sum.dispose();
			fields.forEach((field) => field.dispose());
			if (!success) {
				cumulative.dispose();
				positions.dispose();
				rows.dispose();
			}
		}
	}
}
