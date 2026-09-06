import {createSanJoseNauticalPocBuildRequest} from '../index.js';
import {executeZp3GpuRecurrence} from './Zp3GpuRecurrence.js';

/** Execute the exact ZP3 one-wavelength recurrence in a real WebGL2 context. */
export async function runZp3GpuRecurrenceBrowser() {
	const reportProgress = async (stage) => {
		if (typeof globalThis.zp3Progress === 'function') {
			await globalThis.zp3Progress(stage);
		}
	};
	await reportProgress('browser-entered');
	const canvas = document.createElement('canvas');
	canvas.width = 1;
	canvas.height = 1;
	const gl = canvas.getContext('webgl2', {
		alpha: false,
		antialias: false,
		depth: false,
		stencil: false,
		preserveDrawingBuffer: false,
		powerPreference: 'high-performance',
	});
	if (!gl) throw new Error('WebGL2 is unavailable.');
	const debug = gl.getExtension('WEBGL_debug_renderer_info');
	const buildRequest = createSanJoseNauticalPocBuildRequest();
	const recurrence = await executeZp3GpuRecurrence({
		gl,
		buildRequest,
		wavelengthIndex: 7,
		reportProgress,
	});
	await reportProgress('recurrence-complete');
	return {
		...recurrence,
		gpu: {
			api: gl.getParameter(gl.VERSION),
			shadingLanguage: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
			vendor: debug
				? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL)
				: gl.getParameter(gl.VENDOR),
			renderer: debug
				? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
				: gl.getParameter(gl.RENDERER),
		},
	};
}

