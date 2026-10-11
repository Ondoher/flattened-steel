import * as THREE from 'three';
import {ViewPresentationFilterRegistry, humanMesopicRodWeight} from '../../src/algorithm32/implementation/presentation-filter/ViewPresentationFilterRegistry.js';
import {BrunetonColorDisplayModel} from '../../src/algorithm32/implementation/bruneton-color/BrunetonColorDisplayModel.js';
import {SpectralPacket, SPECTRAL_QUANTITIES, SPECTRAL_UNITS} from '../../src/algorithm32/spectral-values/index.js';
import {readCelestialShader} from './celestial-proof.js';

/** Select the globe application's exact ordered human-vision stellar filters.
 * @param {readonly number[]} weights - Authenticated production Native15 scotopic weights.
 * @returns {ViewPresentationFilterRegistry} - Shared equation owner, without additional stellar gain.
 */
export function createCelestialHumanVision(weights) {
	return new ViewPresentationFilterRegistry([
		{id:'human-mesopic-luminance-v1', stage:'source-linear', target:'stellar', enabled:true, parameters:{maximumRodContribution:0.5}},
		{id:'human-low-light-chroma-v1', stage:'source-linear', target:'stellar', enabled:true, parameters:{maximumChromaRetention:0.65}},
	], {scotopicLuminanceWeights:weights});
}

/** Check the actual assembled stellar presentation, CPU/GPU equations and receiver compatibility.
 * @param {LocalSunShellPublishedFrame} frame - Borrowed live frame, restored before return.
 * @param {THREE.WebGLRenderer} renderer - Borrowed renderer.
 * @param {ViewPresentationFilterRegistry} registry - Same owner supplied to color and facade.
 * @param {LocalSunCelestialStarProof} stars - Measured occupied-pixel spectrum from this view.
 * @returns {Promise<LocalSunCelestialHumanVisionProof>} - Focused integration evidence; synthetic adaptation cases do not alter the capture.
 */
export async function proveCelestialHumanVision(frame, renderer, registry, stars) {
	if (!frame.celestial || !stars.consumerPixel || !Number.isFinite(stars.consumerMagnitude)) throw new Error('Occupied stellar presentation probe required.');
	const pass = /** @type {import('../../src/algorithm32/rendering-runtime/three/ShaderRuntimePass.js').ShaderRuntimePass} */(frame.viewPass);
	const material = /** @type {THREE.RawShaderMaterial} */(pass.material),
		prefix = material.fragmentShader.slice(0, material.fragmentShader.lastIndexOf('void main()')),
		hook = registry.createStellarSourceLinearShaderHook();
	if (!prefix.includes(hook.source) || !material.fragmentShader.includes('vec3 filteredStellarLinearSrgb = applyStellarSourceLinearPresentationFilters('))
		throw new Error('Actual color assembly is missing the selected stellar hook.');
	const stellar = /** @type {import('../../src/algorithm32/rendering-runtime/three/StellarScreenPaletteGenerationPass.js').StellarScreenPaletteGenerationPass} */(frame.celestial.generation._stellar),
		getCompatibility = stellar._getPresentationCompatibility;
	if (!getCompatibility) throw new Error('Missing live stellar presentation compatibility.');
	const compatibility = getCompatibility(),
		adaptation = frame.receiver.stellarAdaptationLuminance.value;
	if (compatibility.receiverLightIdentity !== frame.receiver.identity || compatibility.adaptationLuminanceCdM2 !== adaptation ||
		compatibility.filterRegistryIdentity !== registry.identity || compatibility.scotopicWeightsIdentity !== hook.scotopicWeightsIdentity ||
		material.uniforms.uStellarAdaptationLuminanceCdM2.value !== adaptation ||
		!stellar.publicationState.active?.compatibility.presentationIdentity)
		throw new Error('Stellar display and publication do not share the measured receiver state.');
	const basis = frame.owners.profile.spectral.basis,
		packet = /** @type {SpectralRadiancePacket} */(new SpectralPacket({basis, quantity:SPECTRAL_QUANTITIES.RADIANCE_DENSITY, units:SPECTRAL_UNITS.RADIANCE_DENSITY,
			semantics:basis.semantics, values:stars.consumerSpectrum, provenanceIdentity:'actual-flat-stellar-consumer-probe'})),
		physicalRgb = new BrunetonColorDisplayModel().radianceToLinearSrgb(packet);
	const [x,y] = stars.consumerPixel;
	// Resolve the ray from the real raster, rather than assuming a fixed viewport.
	const size = renderer.getDrawingBufferSize(new THREE.Vector2());
	const sample = await readCelestialShader(renderer,
		`${prefix}void main(){ShaderState state=createInitialShaderState(vec2(${(x+0.5)/size.x},${(y+0.5)/size.y}));
 state.sceneHitMask=0.0;state.ray=reconstructViewRay(state.textureCoordinates);
 state.bounds=resolveAtmospherePath(state.ray,0.0,false);evaluatePathRadiance(state);
 StellarPresentationSample presentation;SpectralValue light=evaluateScreenPaletteCelestialRadiance(state,presentation);
 float native15[15];for(int c=0;c<15;c++)native15[c]=presentation.radiance.channels[c];
 vec3 rgb=spectralRadianceToLinearSrgb(presentation.radiance);
 vec3 filtered=applyStellarSourceLinearPresentationFilters(rgb,native15,presentation.visualMagnitude,uStellarAdaptationLuminanceCdM2);
 outColor=int(gl_FragCoord.x)==0?vec4(rgb,presentation.visualMagnitude):vec4(filtered,uStellarAdaptationLuminanceCdM2);}`,
		material.uniforms,2,1);
	const magnitude = stars.consumerMagnitude, filteredRgb = registry.applySourceLinear(physicalRgb,
		{target:'stellar', transportedNative15:stars.consumerSpectrum, visualMagnitude:magnitude, adaptationLuminanceCdM2:adaptation});
	let maxRelative = 0;
	/** Require float GPU agreement with the shared CPU equation.
	 * @param {ArrayLike<number>} actual - Three measured RGB channels.
	 * @param {ArrayLike<number>} expected - CPU channels.
	 * @returns {void} - Throws when the declared tolerance is exceeded.
	 */
	function compare(actual, expected) {
		for(let c=0;c<3;c++) {
			const error = Math.abs(actual[c]-expected[c])/Math.max(Math.abs(expected[c]),1e-10);
			maxRelative = Math.max(maxRelative,error);
			if(error>3e-5) throw new Error('Human-vision CPU/GPU response disagrees.');
		}
	}
	compare(sample,physicalRgb);compare(sample.slice(4,7),filteredRgb);
	if(Math.abs(sample[3]-magnitude)>1e-5 || Math.abs(sample[7]-adaptation)>1e-6*Math.max(1,adaptation)) throw new Error('GPU presentation metadata mismatch.');
	const cases = [];
	for(const luminance of [0,0.005,0.05,0.5,5,50]) {
		const actual = await readCelestialShader(renderer,
			`${prefix}void main(){float n[15]=float[15](${stars.consumerSpectrum.map(v=>v.toExponential(16)).join(',')});
 vec3 rgb=applyStellarSourceLinearPresentationFilters(vec3(${physicalRgb.join(',')}),n,${magnitude},${luminance.toFixed(3)});outColor=vec4(rgb,1.0);}`,
			material.uniforms,1,1);
		const expected = registry.applySourceLinear(physicalRgb,{target:'stellar',transportedNative15:stars.consumerSpectrum,visualMagnitude:magnitude,adaptationLuminanceCdM2:luminance});
		compare(actual,expected);
		cases.push({adaptationLuminanceCdM2:luminance,rodWeight:humanMesopicRodWeight(luminance),cpuRgb:Array.from(expected),gpuRgb:Array.from(actual.slice(0,3))});
	}
	// Exercise a changed presentation tuple at the executor boundary only. The
	// real facade bindings remain untouched and are restored for image capture.
	const table=stellar._sourceTable,textures=stellar._sourceTextures,originalId=stellar.publicationState.active.id;
	let compatibilityReplacement=false;
	try {
		stellar._getPresentationCompatibility=()=>({...getCompatibility(),receiverLightIdentity:'proof:changed-receiver',adaptationLuminanceCdM2:adaptation+1});
		frame.celestial.generation.render(renderer);
		compatibilityReplacement=stellar.publicationState.active?.id!==originalId && stellar._sourceTable===table && stellar._sourceTextures===textures;
		if(!compatibilityReplacement) throw new Error('Changed stellar presentation did not replace output while retaining static inputs.');
	} finally {
		stellar._getPresentationCompatibility=getCompatibility;
		frame.celestial.render();
	}
	return {passed:true,compatibility,physicalRgb:Array.from(physicalRgb),filteredRgb:Array.from(filteredRgb),gpuPhysicalRgb:Array.from(sample.slice(0,3)),
		gpuFilteredRgb:Array.from(sample.slice(4,7)),visualMagnitude:magnitude,rodWeight:humanMesopicRodWeight(adaptation),maxRelative,cases,compatibilityReplacement,
		scope:'shared globe filters and authenticated scotopic weights; actual occupied pixel and measured receiver; six synthetic adaptation cases; static-input reuse on changed presentation; no added gain'};
}
