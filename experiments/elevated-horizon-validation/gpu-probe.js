/** Inspect the installed production pass in an owned browser, replacing only diagnostic output/endpoints. */
export function gpuProbe(views) {
	const a = globalThis['proofApplication'],
		r = a._modeController._activeRuntime,
		renderer = a._sceneRuntime.renderer;
	const pass = r._composer.passes.find((p) =>
		p._material?.fragmentShader?.includes('ShaderState state = createInitialShaderState'),
	);
	const original = pass._material,
		fragment = original.fragmentShader,
		uniforms = original.uniforms;
	const savedTarget = renderer.getRenderTarget(),
		savedIntervals = uniforms.uTransportPathIntervalCount.value;
	const target = r._composer.readBuffer.clone();
	target.texture.type = 1015;
	target.texture.internalFormat = 'RGBA32F';
	target.texture.colorSpace = '';
	target.depthBuffer = false;
	target.stencilBuffer = false;
	const snapshots = [];
	const draw = (fragmentShader, width, height) => {
		const material = new original.constructor({
			glslVersion: original.glslVersion,
			vertexShader: original.vertexShader,
			fragmentShader,
			uniforms,
			depthTest: false,
			depthWrite: false,
		});
		try {
			pass._mesh.material = material;
			target.setSize(width, height);
			renderer.setRenderTarget(target);
			renderer.clear();
			renderer.render(pass._scene, pass._camera);
			const data = new Float32Array(width * height * 4);
			renderer.readRenderTargetPixels(target, 0, 0, width, height, data);
			const error = renderer.getContext().getError();
			if (error !== 0) throw new Error('GPU probe error ' + error);
			return Array.from(data);
		} finally {
			material.dispose();
			pass._mesh.material = original;
		}
	};
	try {
		const mainIndex = fragment.lastIndexOf('void main()');
		const prefix = fragment.slice(0, mainIndex);
		const literals = (values) => values.map((x) => Number(x).toExponential(16)).join(',');
		const controlled =
			prefix +
			`void main(){
		const float elevations[${views.length}]=float[${views.length}](${literals(views.map((v) => v.elevation))});
		const float endpoints[${views.length}]=float[${views.length}](${literals(views.map((v) => v.length))});
		const bool ground[${views.length}]=bool[${views.length}](${views.map((v) => (v.ground ? 'true' : 'false')).join(',')});
		int row=int(gl_FragCoord.y);int channel=int(gl_FragCoord.x);float angle=radians(elevations[row]);
		ShaderState state=createInitialShaderState(vec2(.5));
		state.ray=ViewRay(uCameraWorldPositionMeters,vec3(0.0,cos(angle),sin(angle)));
		state.bounds=resolveAtmospherePath(state.ray,endpoints[row],ground[row]);
		evaluatePathRadiance(state);
		outColor=vec4(state.pathRadiance.channels[channel],state.transmittance.channels[channel],state.bounds.endDistanceMeters,ground[row]?1.0:0.0);
	}`;
		for (const intervals of [30, 120]) {
			uniforms.uTransportPathIntervalCount.value = intervals;
			snapshots.push({intervals, data: draw(controlled, 15, views.length)});
		}
		uniforms.uTransportPathIntervalCount.value = savedIntervals;
		const height = a._sceneRuntime.canvas.height,
			columnX = 0.2;
		const replaced = fragment.replace(
			'createInitialShaderState(screenTextureCoordinates)',
			`createInitialShaderState(vec2(${columnX},(gl_FragCoord.y+.5-.5)/${height}.0))`,
		);
		const ending = replaced.lastIndexOf('}');
		const output = (expression) => replaced.slice(0, ending) + '\noutColor=' + expression + ';\n}';
		const column = {
			x: columnX,
			height,
			transport: draw(
				output(
					'vec4(state.pathRadiance.channels[int(gl_FragCoord.x)],state.transmittance.channels[int(gl_FragCoord.x)],state.bounds.endDistanceMeters,state.sceneHitMask)',
				),
				15,
				height,
			),
			sceneInput: draw(output('vec4(state.sceneDisplayRgb,state.sceneDepth)'), 1, height),
			final: draw(replaced, 1, height),
			pathRgb: draw(output('vec4(spectralRadianceToLinearSrgb(state.pathRadiance),1.0)'), 1, height),
			groundRgb: draw(
				output(
					'vec4(displayRgbToLinearSrgb(rendererLinearSrgbToDisplayRgb(state.sceneDisplayRgb))*(shouldApplySceneTransmittance(state)?spectralTransmittanceToRgbBands(state.transmittance):vec3(1.0)),1.0)',
				),
				1,
				height,
			),
		};
		return {
			views,
			snapshots,
			controlledShader: controlled,
			column,
			camera: {
				inverseProjection: Array.from(uniforms.uInverseProjectionMatrix.value.elements),
				inverseView: Array.from(uniforms.uInverseViewMatrix.value.elements),
				origin: uniforms.uCameraWorldPositionMeters.value.toArray(),
				sceneDepthMax: uniforms.uSceneDepthMaxMeters.value,
				fov: a._sceneRuntime.camera.fov,
			},
			basis: ['RIGHT', 'UP', 'FORWARD'].map((axis) => {
				const match = fragment.match(
					new RegExp('const vec3 GEOMETRY_OBSERVER_' + axis + '_DIRECTION = vec3\\(([^)]+)\\)'),
				);
				return match[1].split(',').map(Number);
			}),
			lux: uniforms.uColorResetTotalHorizontalIlluminanceLux.value,
		};
	} finally {
		uniforms.uTransportPathIntervalCount.value = savedIntervals;
		pass._mesh.material = original;
		renderer.setRenderTarget(savedTarget);
		target.dispose();
	}
}
