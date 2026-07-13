import { createAces2GpuCanvas, createAces2Rec709100NitGpuTransform } from './lib/aces2-rec709-100nit-gpu.js';

export async function runStage2NormalComparison(input) {
	if (!Array.isArray(input?.rows) || input.rows.length < 1) throw new TypeError('Stage 2 Normal comparison requires RGB rows.');
	const width = input.rows.length; const { gl } = createAces2GpuCanvas(width, 1); const transform = createAces2Rec709100NitGpuTransform(gl);
	try {
		const packed = new Float32Array(width * 4); input.rows.forEach((row, index) => { if (!Array.isArray(row.linearSrgb) || row.linearSrgb.length !== 3 || !row.linearSrgb.every(Number.isFinite)) throw new TypeError(`Stage 2 Normal row ${index} is invalid.`); packed.set([...row.linearSrgb, 1], index * 4); });
		const output = transform.transformFloat(packed, width, 1, true); const rows = input.rows.map((row, index) => ({ ...row, encodedSrgb: Array.from(output.slice(index * 4, index * 4 + 3)) }));
		return { schemaId: 'spectral-color-stage2-normal-aces2-result-v1', transformId: transform.id, profile: transform.parameters.profile, rows };
	} finally { transform.dispose(); }
}
