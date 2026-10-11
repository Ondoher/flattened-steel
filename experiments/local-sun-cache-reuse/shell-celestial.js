import {CelestialScreenPaletteConsumerShaderContribution} from '../../src/algorithm32/celestial-source-support/CelestialScreenPaletteConsumerShaderContribution.js';
import {StellarScreenPaletteGenerationStages} from '../../src/algorithm32/implementation/star-field/StellarScreenPaletteGenerationStages.js';
import {StellarScreenPaletteGenerationPolicy} from '../../src/algorithm32/implementation/star-field/StellarScreenPaletteGenerationPolicy.js';
import {StellarScreenPaletteGenerationPass} from '../../src/algorithm32/rendering-runtime/three/StellarScreenPaletteGenerationPass.js';
import {CanonicalValueHash} from '../../src/algorithm32/value-identity/CanonicalValueHash.js';
import {createFlatStarGeometry} from './flat-star-geometry.js';
import SceneMath from '../../src/algorithm32/math/SceneMath.js';
import * as THREE from 'three';

/** Attach contained celestial operations to this facade's collaborators only.
 * @param {LocalSunRotationOwners} owners - Frame with finite-Sun roster.
 * @param {LocalSunCelestialSelection} selection - Optional stars/flat geometry.
 * @returns {void} - Normal handle owns installed generation resources.
 */
export function installShellCelestial(owners, selection) {
	// The tile executor consumes scene-axis metres. The flat placement owner
	// returns physical z-up metres; translate and change basis exactly once.
	const resolve = owners.geometry.resolveCelestialPlacements.bind(owners.geometry);
	owners.geometry.resolveCelestialPlacements = (request) =>
		resolve(request).map((placement) => {
			if (placement.kind !== 'finite-local-sun') throw new Error('Expected finite flat Sun placement.');
			const p = placement.center.coordinates,
				o = owners.geometry.configuration.observerPosition.coordinates;
			return {
				...placement,
				center: {...placement.center, coordinates: [p[0] - o[0], p[2] - o[2], -(p[1] - o[1])]},
			};
		});
	const builder = /** @type {LocalSunCelestialBuildCoordinator} */ (
		owners.facade._shaderBuilder
	);
	const preparer = builder._assemblyPreparer,
		collect = preparer._collectContributions.bind(preparer);
	preparer._collectContributions = (request, context) => {
		const contributions = Array.from(collect(request, context)),
			index = contributions.findIndex((c) => c.id === 'celestial-screen-palette-consumer');
		if (index < 0) throw new Error('Expected finite-Sun consumer.');
		const consumer = new CelestialScreenPaletteConsumerShaderContribution({
			includeStars: selection.stars != null,
			filteredStars: selection.presentationFilterRegistry?.enabled === true,
			surfaceRadiance: owners.source.celestialSourceDefinition.surfaceRadiance,
		}).createShaderContribution();
		// Geometry resolves the atmospheric boundary; view transport already
		// accumulates its transmission. Consume that result once, as the globe does.
		contributions[index] = consumer;
		return contributions;
	};
	if (!selection.stars) return;
	if (!selection.starPolicy) throw new Error('Explicit star placement required.');
	const observer = Array.from(owners.geometry.configuration.observerPosition.coordinates);
	const geometry = createFlatStarGeometry(selection.starPolicy, observer),
		table = selection.stars.createStellarGenerationSourceTable();
	/** @type {LocalSunFlatStarGenerationSource} */ const source = {
		createStellarGenerationSourceTable: () => table,
		createStellarGenerationStages: ({observation}) =>
			new StellarScreenPaletteGenerationStages({
				source: table,
				geometry: geometry.createStellarGenerationShaderContribution({observation}),
			}).createStages(),
		createStellarGenerationIdentity: ({observation, view, presentation}) => {
			const policy = StellarScreenPaletteGenerationPolicy.createBase(table.layout),
				geometryIdentity = geometry.createStellarGenerationShaderContribution({observation}).identity;
			const compatibility = {
				sourceIdentity: table.identity,
				observationIdentity: CanonicalValueHash.sha256Value({observation, geometryIdentity}),
				viewIdentity: view.identity,
				...(presentation === undefined ? {} : {presentationIdentity: flatPresentationIdentity(presentation)}),
			};
			return {
				generationIdentity: CanonicalValueHash.sha256Value({
					schema: 'experiment-flat-stellar-screen-palette-v1',
					compatibility,
					policy: policy.identity,
				}),
				compatibility,
				policyIdentity: policy.identity,
			};
		},
	};
	// Bridge the spherical-only declaration of the generic executor explicitly.
	// Actual stage and identity factories use flat geometry, never a false roster.
	const Pass = /** @type {LocalSunFlatStarPassConstructor} */ (
		/** @type {unknown} */ (StellarScreenPaletteGenerationPass)
	);
	builder._runtimeInstaller._createStellarGenerationPass = (request) => {
		const camera = /** @type {THREE.PerspectiveCamera} */ (request.setup.camera),
			scale = request.setup.sceneScale;
		if (!scale) throw new Error('Explicit flat stellar scene scale required.');
		/** Refresh presentation parallax from the actual camera position.
		 *
		 * @returns {void} - Mutable owned vector updates the geometry snapshot.
		 */
		function updateObserver() {
			camera.updateMatrixWorld();
			const p = camera.getWorldPosition(new THREE.Vector3());
			const model = owners.geometry.mapObserverLocalScenePointToModelPosition(
				SceneMath.positionInSceneUnits([p.x, p.y, p.z]),
				{sceneScale: scale},
			);
			observer.splice(0, 3, ...model.coordinates);
		}
		updateObserver();
		const pass = new Pass({
			THREE: /** @type {typeof THREE} */ (request.setup.THREE),
			source,
			geometry,
			observation: owners.profile.models.sourcePlacement.observation,
			camera: /** @type {ShaderRuntimeCelestialViewCamera} */ (request.setup.camera),
			viewportSize: request.setup.viewportSize,
			logger: request.setup.logger,
			...(selection.presentationFilterRegistry?.enabled ? {getPresentationCompatibility: () => {
				const registry = selection.presentationFilterRegistry;
				const receiverLightIdentity = request.bindingValues['presentation.stellar.receiverLightIdentity'],
					adaptationLuminanceCdM2 = request.bindingValues['presentation.stellar.adaptationLuminanceCdM2'];
				if (typeof receiverLightIdentity !== 'string' || typeof adaptationLuminanceCdM2 !== 'number')
					throw new Error('Missing facade-owned stellar adaptation bindings.');
				return {
					colorIdentity: request.config.config.color.id,
					filterRegistryIdentity: registry.identity,
					scotopicWeightsIdentity: registry.createStellarSourceLinearShaderHook().scotopicWeightsIdentity,
					receiverLightIdentity,
					adaptationLuminanceCdM2,
				};
			}} : {}),
		});
		const render = pass.render.bind(pass);
		pass.render = (renderer) => {
			updateObserver();
			for (const uniforms of [pass._pointUniforms, pass._paletteUniforms])
				uniforms.uFlatStarObserverMeters.value = Array.from(observer);
			render(renderer);
		};
		// The runtime installer owns a concrete executor contract; the adapter
		// above checks only the explicit flat configuration and operations it uses.
		return /** @type {StellarScreenPaletteGenerationPass} */ (
			/** @type {unknown} */ (pass)
		);
	};
}

/** Validate and identify the same presentation facts required by the spherical executor.
 * @param {StellarPresentationCompatibility} presentation - Live facade-owned receiver and selected display facts.
 * @returns {string} - Exact compatibility identity; incomplete bindings cannot publish.
 */
function flatPresentationIdentity(presentation) {
	for (const value of [presentation.colorIdentity, presentation.filterRegistryIdentity, presentation.receiverLightIdentity])
		if (typeof value !== 'string' || !value.length) throw new Error('Incomplete flat stellar presentation identity.');
	if ((presentation.scotopicWeightsIdentity !== null && (typeof presentation.scotopicWeightsIdentity !== 'string' || !presentation.scotopicWeightsIdentity.length)) ||
		!Number.isFinite(presentation.adaptationLuminanceCdM2) || presentation.adaptationLuminanceCdM2 < 0)
		throw new Error('Incomplete flat stellar presentation weights or adaptation.');
	return CanonicalValueHash.sha256Value({schema:'stellar-screen-palette-presentation-compatibility-v1', ...presentation});
}
