import * as THREE from 'three';

import {DesertReflectance} from './DesertReflectance.js';

/**
 * Contained distant-Sun lighting derived from src/flat32/LocalSunSceneLighting.js.
 * The signed spectral projection, neutral Lambertian evaluation, Figure 1
 * renderer bridge, and upper-hemisphere fill retain their production equations.
 * This clone replaces six isolated source contributions with one full-strength
 * Sun and one shared local shadow map. The production parent remains unchanged.
 */
export class DesertSceneLighting {
	/**
	 * Creates the scene-owned Algorithm32 lighting and shared shadow resources.
	 *
	 * @param {DesertSceneLightingConfiguration} configuration - Renderer dependencies and shadow coverage.
	 * @throws {RangeError} Invalid shadow coverage or focus.
	 */
	constructor(configuration) {
		const three = /** @type {typeof THREE} */ (configuration.three);
		this._parent = /** @type {THREE.Object3D} */ (configuration.parent);
		this._shadowExtentMeters = configuration.shadowExtentMeters ?? 450;
		this._groundBounceStrength = configuration.groundBounceStrength ?? 0.45;
		this._neutralReflectance = configuration.neutralReflectance;
		const focus = configuration.shadowFocusMeters ?? [0, 12, 0];
		if (!Number.isFinite(this._shadowExtentMeters) || this._shadowExtentMeters <= 0) {
			throw new RangeError('Desert shadow extent must be positive meters.');
		}
		if (focus.length !== 3 || focus.some((value) => !Number.isFinite(value))) {
			throw new RangeError('Desert shadow focus requires three finite meter coordinates.');
		}
		if (
			!Number.isFinite(this._groundBounceStrength) ||
			this._groundBounceStrength < 0 ||
			this._groundBounceStrength > 1
		) {
			throw new RangeError('Desert ground-bounce strength must be in [0, 1].');
		}
		if (
			typeof configuration.neutralLambertianClass !== 'function' ||
			!Number.isFinite(this._neutralReflectance) ||
			this._neutralReflectance <= 0 ||
			this._neutralReflectance > 1
		) {
			throw new TypeError(
				'Desert lighting requires the renderer-owned Lambertian class and neutral reflectance.',
			);
		}
		this._focus = new three.Vector3(focus[0] / 1000, focus[1] / 1000, focus[2] / 1000);
		this._sourceDistance = Math.max(1, this._shadowExtentMeters / 500);
		this._response = new configuration.neutralLambertianClass();
		this._disposed = false;
		/** Source-light group with spectral provenance. */
		this.group = new three.Group();
		this.group.name = 'desert-observatory-algorithm32-lighting';
		this.group.userData.cloneParent = 'src/flat32/LocalSunSceneLighting.js';
		this.group.userData.lightingPolicy = 'neutral-lambertian-figure1-renderer-bridge-upper-hemisphere-v3';
		this.group.userData.shadowMapUpdatePolicy = 'dynamic-from-algorithm32-distant-sun';
		/** Measured upper-hemisphere sky illumination, without an invented night floor. */
		this.environmentLight = new three.HemisphereLight(0xffffff, 0x000000, 0);
		this.environmentLight.name = 'desert-algorithm32-sky-irradiance';
		this.environmentLight.position.set(0, 1, 0);
		/** Separate, restrained unoccluded sand reflection; the sky hemisphere remains exact. */
		this.groundBounceLight = new three.HemisphereLight(0x000000, 0x000000, 0);
		this.groundBounceLight.name = 'desert-local-spectral-sand-reflection';
		this.groundBounceLight.position.set(0, 1, 0);
		this.groundBounceLight.userData.lightingRole = 'approximate-lower-hemisphere-sand-reflection';
		this.groundBounceLight.userData.approximation = 'uniform-unoccluded-lambertian-ground-with-strength-factor';
		/** Full direct-normal Sun contribution with a shared local shadow map. */
		this.directionalLight = new three.DirectionalLight(0xffffff, 0);
		this.directionalLight.name = 'desert-algorithm32-sun-shadow';
		this._target = new three.Object3D();
		this._target.name = 'desert-algorithm32-sun-target';
		this._target.position.copy(this._focus);
		this.directionalLight.target = this._target;
		this.directionalLight.position.copy(this._focus).add(new three.Vector3(0, this._sourceDistance, 0));
		this._configureShadow();
		for (const light of [this.environmentLight, this.directionalLight, this.groundBounceLight]) {
			light.userData.algorithm32SourceLight = true;
			light.userData.sourceKey = 'desert-observatory-distant-sun';
		}
		this.environmentLight.userData.lightingRole = 'upper-hemisphere-diffuse-fill';
		this.directionalLight.userData.lightingRole = 'source-directional-light';
		this.directionalLight.userData.shadowPolicy = 'one-shared-algorithm32-source-shadow-map';
		this.group.add(this.environmentLight, this.directionalLight, this.groundBounceLight, this._target);
		this._parent.add(this.group);
	}

	/**
	 * Called by construction to allocate policy for one shared orthographic map.
	 *
	 * @returns {void} - Updated directional shadow configuration.
	 */
	_configureShadow() {
		const shadow = this.directionalLight.shadow;
		const halfExtent = this._shadowExtentMeters / 2000;
		this.directionalLight.castShadow = true;
		shadow.mapSize.set(4096, 4096);
		shadow.intensity = 1;
		shadow.bias = -0.000015;
		shadow.normalBias = 0.00006;
		shadow.radius = 2.2;
		shadow.camera.left = -halfExtent;
		shadow.camera.right = halfExtent;
		shadow.camera.bottom = -halfExtent;
		shadow.camera.top = halfExtent;
		shadow.camera.near = 0.001;
		shadow.camera.far = this._sourceDistance * 2 + halfExtent;
		shadow.camera.layers.set(0);
		shadow.camera.updateProjectionMatrix();
	}

	/**
	 * Called by the spectral bridge to preserve signed RGB in Three color and intensity.
	 *
	 * @param {THREE.Light} light - Renderer-owned light.
	 * @param {readonly number[]} linearRgb - Finite linear-sRGB light vector.
	 * @returns {void} - Updated light color and intensity.
	 */
	_applyLinearRgb(light, linearRgb) {
		if (!Array.isArray(linearRgb) || linearRgb.length !== 3 || linearRgb.some((value) => !Number.isFinite(value))) {
			throw new TypeError('Desert receiver scene-light RGB must contain three finite values.');
		}
		const peak = Math.max(...linearRgb.map(Math.abs));
		if (peak === 0) {
			light.color.setRGB(0, 0, 0);
			light.intensity = 0;
			return;
		}
		light.color.r = linearRgb[0] / peak;
		light.color.g = linearRgb[1] / peak;
		light.color.b = linearRgb[2] / peak;
		light.intensity = peak;
	}

	/**
	 * Called by receiver updates to retain the production physical-to-renderer bridge.
	 *
	 * @param {ObservatoryColorProjection} color - Selected Algorithm32 spectral color owner.
	 * @param {SpectralRadiancePacket} outgoingRadiance - Neutral Lambertian outgoing spectrum.
	 * @returns {number[]} - Incident renderer-linear RGB.
	 */
	_projectIncidentLinearRgb(color, outgoingRadiance) {
		if (typeof color?.radianceToLinearSrgb !== 'function') {
			throw new TypeError('Desert scene lighting requires the selected Algorithm32 Color projection.');
		}
		const outgoing = color.radianceToLinearSrgb(outgoingRadiance);
		const incident = outgoing.map((value) => (value * Math.PI) / this._neutralReflectance);
		const toneMapK = color.displayConstants?.paperFigure1ToneMapK;
		if (!Number.isFinite(toneMapK) || toneMapK <= 0) return incident;
		return incident.map((value) => {
			const display = 1 - Math.exp(-Math.max(value, 0) * toneMapK);
			return display <= 0.04045 ? display / 12.92 : ((display + 0.055) / 1.055) ** 2.4;
		});
	}

	/**
	 * Call this method to update shadows and illumination from the current Algorithm32 spectra.
	 * The renderer owner must request a shadow-map refresh before rendering this state.
	 *
	 * @param {UnitVector3} directionToSource - Model east/north/up Sun direction.
	 * @param {ReceiverEnvironmentLightMeasurement} receiverLight - Current direct-normal and diffuse-horizontal spectra.
	 * @param {ObservatoryColorProjection} color - Current spectral projection and display bridge.
	 * @returns {void} - Updated lights with exact receiver and spectral provenance.
	 * @throws {Error} Disposed owner or incomplete spectral input.
	 */
	updateFromDistantSun(directionToSource, receiverLight, color) {
		if (this._disposed) throw new Error('Desert scene lighting has been disposed.');
		if (!receiverLight?.directNormal || !receiverLight?.diffuseHorizontal) {
			throw new TypeError('Desert scene lighting requires complete Algorithm32 receiver spectra.');
		}
		const response = this._response.evaluate({
			identity: `${receiverLight.identity}:desert-neutral-scene-lighting`,
			directNormal: receiverLight.directNormal,
			diffuseIrradiance: receiverLight.diffuseHorizontal,
			surfaceNormal: directionToSource,
			directionToSource,
		});
		this._applyLinearRgb(this.directionalLight, this._projectIncidentLinearRgb(color, response.directRadiance));
		this._applyLinearRgb(this.environmentLight, this._projectIncidentLinearRgb(color, response.diffuseRadiance));
		this.environmentLight.groundColor.setRGB(0, 0, 0);
		if (this._groundBounceStrength > 0) {
			const reflectedIrradiance = /** @type {SpectralIrradiancePacket} */ (
				DesertReflectance.reflectedIrradiance(receiverLight)
			);
			const reflectedResponse = this._response.evaluate({
				identity: `${receiverLight.identity}:desert-local-sand-reflection`,
				directNormal: receiverLight.directNormal,
				diffuseIrradiance: reflectedIrradiance,
				surfaceNormal: directionToSource,
				directionToSource,
			});
			this._applyLinearRgb(
				this.groundBounceLight,
				this._projectIncidentLinearRgb(color, reflectedResponse.diffuseRadiance),
			);
			this.groundBounceLight.groundColor.copy(this.groundBounceLight.color);
			this.groundBounceLight.color.setRGB(0, 0, 0);
			this.groundBounceLight.intensity *= this._groundBounceStrength;
			this.groundBounceLight.userData.spectralPacketIdentity = reflectedIrradiance.contentHash;
		}
		const direction = [directionToSource[0], directionToSource[2], -directionToSource[1]];
		this.directionalLight.position.set(
			this._focus.x + direction[0] * this._sourceDistance,
			this._focus.y + direction[1] * this._sourceDistance,
			this._focus.z + direction[2] * this._sourceDistance,
		);
		this.directionalLight.userData.directionToSource = direction;
		this.directionalLight.shadow.needsUpdate = true;
		this.directionalLight.userData.spectralPacketIdentity = receiverLight.directNormal.contentHash;
		this.environmentLight.userData.spectralPacketIdentity = receiverLight.diffuseHorizontal.contentHash;
		for (const light of [this.directionalLight, this.environmentLight, this.groundBounceLight]) {
			light.userData.receiverLightIdentity = receiverLight.identity;
		}
		this.group.userData.receiverLightIdentity = receiverLight.identity;
	}

	/**
	 * Call this method to report allocated shadow resources and lighting provenance.
	 *
	 * @returns {DesertSceneLightingDescription} - Current resource and lighting facts.
	 */
	describe() {
		const shadowMap = this.directionalLight.shadow.map;
		return {
			sourceLightCount: 3,
			ambientLightCount: 2,
			directionalLightCount: 1,
			targetCount: 1,
			ambientIntensity: this.environmentLight.intensity + this.groundBounceLight.intensity,
			skyAmbientIntensity: this.environmentLight.intensity,
			groundBounceIntensity: this.groundBounceLight.intensity,
			groundBounceStrength: this._groundBounceStrength,
			directionalIntensity: this.directionalLight.intensity,
			shadowMapsInstalled: shadowMap?.width === 4096 && shadowMap?.height === 4096,
			shadowMapCount: shadowMap === null ? 0 : 1,
			shadowMapWidth: shadowMap?.width ?? 0,
			shadowMapHeight: shadowMap?.height ?? 0,
			shadowLayerCount: 1,
			shadowExtentMeters: this._shadowExtentMeters,
			receiverLightIdentity: this.group.userData.receiverLightIdentity ?? null,
			lightingPolicy: this.group.userData.lightingPolicy,
		};
	}

	/**
	 * Call this method to release the owned lights, shadow map, and scene attachment.
	 *
	 * @returns {void} - Detached and disposed resources.
	 */
	dispose() {
		if (this._disposed) return;
		this._disposed = true;
		this._parent.remove(this.group);
		this.directionalLight.dispose();
		this.environmentLight.dispose();
		this.groundBounceLight.dispose();
		this.group.clear();
	}
}
