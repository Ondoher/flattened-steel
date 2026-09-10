/** Guarded derivation of the read-only compiler, preserving every shader byte. */
export default class CompilerDerivation {
	/** Call this method to derive lifecycle changes with exact source anchors.
	 * A changed parent anchor rejects rather than guessing at a new compiler shape.
	 * @param {string} source - Authenticated original compiler.
	 * @returns {string} - Derived executable module stored only in a new run.
	 */
	derive(source) {
		const edits = [
			[
				'function createProgram(gl, fragmentSource, label) {',
				'function allocateProgram(gl, fragmentSource, label) {',
			],
			[
				'function createTexture(gl, {width, height, internalFormat = gl.R32F, format = gl.RED, type = gl.FLOAT, data = null}) {',
				'function allocateTexture(gl, {width, height, internalFormat = gl.R32F, format = gl.RED, type = gl.FLOAT, data = null}) {',
			],
			[
				'\t\t\tgl.finish();\n\t\t\trequireNoGlError(gl, `${id} solar-zenith ${zenith}`);',
				'\t\t\tif (zenith === domains.solarZenith.count - 1) gl.finish();\n\t\t\trequireNoGlError(gl, `${id} solar-zenith ${zenith}`);',
			],
			[
				'\t\tfor (const program of Object.values(programs)) if (program) gl.deleteProgram(program);',
				'\t\t// Programs remain owned by the retained session.',
			],
		];
		let result = source.replaceAll('\r\n', '\n');
		for (const [before, after] of edits) {
			if (result.split(before).length !== 2) throw new Error('Compiler derivation anchor changed: ' + before);
			result = result.replace(before, after);
		}
		result = result.replaceAll('gl.deleteTexture(', 'session.release(');
		return (
			`import RetainedGpuSession from './RetainedGpuSession.js';
let session = null;
export function openSession(gl, maximumBytes) { if (session) throw new Error('Session already open.'); session = new RetainedGpuSession(gl, maximumBytes); return session; }
export function closeSession() { if (session) session.close(); session = null; }
function createProgram(gl, source, label) { return session.program(source, () => allocateProgram(gl, source, label)); }
function createTexture(gl, spec) { return session.texture(spec, () => allocateTexture(gl, spec)); }
` + result
		);
	}
}
