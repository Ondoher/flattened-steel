import {WebGLRenderTarget} from 'three';
import {createSceneComposer} from '../../common/scene-composer.js';

describe('Scene composer physical pixel sizing', () => {
	it('keeps initial and resized targets and shader passes equal to the renderer drawing buffer at every DPI', () => {
		for (const ratio of [1, 1.25, 1.5, 2]) {
			const renderer = {getPixelRatio: () => ratio};
			const target = new WebGLRenderTarget(800 * ratio, 600 * ratio);
			const composer = createSceneComposer(renderer, target);
			const pass = {setSize: jasmine.createSpy('pass size')};
			try {
				composer.addPass(pass);
				expect(pass.setSize).toHaveBeenCalledWith(800 * ratio, 600 * ratio);
				composer.setSize(400 * ratio, 500 * ratio);
				expect(composer.readBuffer.width).toBe(400 * ratio);
				expect(composer.readBuffer.height).toBe(500 * ratio);
				expect(composer.writeBuffer.width).toBe(400 * ratio);
				expect(composer.writeBuffer.height).toBe(500 * ratio);
				expect(pass.setSize.calls.mostRecent().args).toEqual([400 * ratio, 500 * ratio]);
			} finally {
				composer.dispose();
			}
		}
	});
});
