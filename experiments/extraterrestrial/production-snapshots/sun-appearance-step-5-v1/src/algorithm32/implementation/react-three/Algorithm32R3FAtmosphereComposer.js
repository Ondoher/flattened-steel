import React, {useRef} from 'react';
import {useFrame, useThree} from '@react-three/fiber';

import {Algorithm32AtmosphereComposer} from './Algorithm32AtmosphereComposer.js';
import {Algorithm32R3FValues} from './Algorithm32R3FValues.js';

/**
 * Call this function to provide React Three Fiber renderer state to the class-based Algorithm32 wrapper.
 *
 * @param {object} props - Supplies Algorithm32 wrapper props.
 * @returns {React.ReactNode} - The class wrapper bound to R3F context.
 */
export function Algorithm32R3FAtmosphereComposer(props) {
	const composerRef = useRef(null);
	const {camera, gl: renderer, scene, size} = useThree();

	useFrame(
		/**
		 * Called by the surrounding operation to handle one callback invocation.
		 * @param frameState - The frame state value accepted by the operation.
		 * @param delta - The delta value accepted by the operation.
		 */ (frameState, delta) => {
			const rendered = composerRef.current?.renderAlgorithm32Frame(frameState, delta);
			const frameRenderer = frameState.gl ?? renderer;

			if (!rendered) {
				const fallbackScene = composerRef.current?.getFallbackScene?.() ?? frameState.scene ?? scene;
				const fallbackCamera = frameState.camera ?? camera;

				frameRenderer.render(fallbackScene, fallbackCamera);
			}
		},
		Algorithm32R3FValues.renderPriority(props.renderPriority),
	);

	return React.createElement(Algorithm32AtmosphereComposer, {
		...props,
		ref: composerRef,
		camera,
		renderer,
		size,
	});
}
