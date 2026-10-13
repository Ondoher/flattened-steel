import DistanceMath from '../../math/DistanceMath.js';
import SceneMath from '../../math/SceneMath.js';

/** Adapter-owned runtime binding-value creation and mutation methods. */
export const Algorithm32Bindings = {
	/**
	 * Call this method to create fresh mutable binding values for the common Algorithm32 camera uniforms.
	 *
	 * @param {Algorithm32BindingsThreeNamespace} THREE - The Three constructor surface.
	 * @param {Distance | null} [sceneDepthMax] - The optional geometry-owned scene-depth cap.
	 * @returns {Algorithm32BindingValues} - The mutable shader binding values.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	create(THREE, sceneDepthMax = null) {
		const bindings = {
			'geometry.inverseProjectionMatrix': new THREE.Matrix4(),
			'geometry.inverseViewMatrix': new THREE.Matrix4(),
			'geometry.cameraWorldPosition': new THREE.Vector3(),
			'geometry.cameraGroundRelativePosition': new THREE.Vector3(),
			'geometry.sceneTermination': DistanceMath.inMeters(0),
		};

		if (sceneDepthMax !== null) {
			const sceneDepthMaxMeters = DistanceMath.toMeters(sceneDepthMax);

			if (!Number.isFinite(sceneDepthMaxMeters) || sceneDepthMaxMeters <= 0) {
				throw new RangeError('sceneDepthMax must be a finite distance greater than zero.');
			}

			bindings['geometry.sceneDepthMax'] = DistanceMath.inMeters(sceneDepthMaxMeters);
		}

		return bindings;
	},

	/**
	 * Call this method to update common Algorithm32 camera bindings from one live Three frame.
	 *
	 * Geometry owns scene-to-model and ground-relative position mapping.
	 *
	 * @param {Algorithm32BindingsUpdateRequest} request - The live camera and configuration state.
	 * @returns {void} - No value.
	 */
	update({bindingValues, camera, props}) {
		camera.updateProjectionMatrix();
		camera.updateMatrixWorld();

		const inverseProjectionMatrix = /** @type {Algorithm32BindingsMatrix4} */ (
			bindingValues['geometry.inverseProjectionMatrix']
		);
		const inverseViewMatrix = /** @type {Algorithm32BindingsMatrix4} */ (
			bindingValues['geometry.inverseViewMatrix']
		);
		const cameraWorldPosition = /** @type {Algorithm32BindingsVector3} */ (
			bindingValues['geometry.cameraWorldPosition']
		);
		const cameraGroundRelativePosition = /** @type {Algorithm32BindingsVector3} */ (
			bindingValues['geometry.cameraGroundRelativePosition']
		);
		const cameraScenePosition = camera.getWorldPosition(camera.position.clone());
		const geometry = 'profile' in props.config ? props.config.profile.models.geometry : props.config.geometry;
		const modelPosition = geometry.mapObserverLocalScenePointToModelPosition(
			SceneMath.positionInSceneUnits([cameraScenePosition.x, cameraScenePosition.y, cameraScenePosition.z]),
			{sceneScale: props.sceneScale},
		);
		const modelPositionMeters = DistanceMath.toMetersPosition(modelPosition);
		const groundRelativePosition = geometry.resolveGroundRelativePosition?.(modelPosition);
		const groundRelativePositionMeters =
			groundRelativePosition === undefined ? null : DistanceMath.toMetersPosition(groundRelativePosition);

		inverseProjectionMatrix.copy(camera.projectionMatrixInverse);
		inverseViewMatrix.copy(camera.matrixWorld);
		cameraWorldPosition.set(...modelPositionMeters);
		if (groundRelativePositionMeters !== null) {
			cameraGroundRelativePosition.set(...groundRelativePositionMeters);
		}
	},
};
