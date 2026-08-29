import {CanonicalAtmosphere} from '../../production-snapshots/sun-appearance-step-5-v1/src/algorithm32/implementation/canonical-atmosphere/CanonicalAtmosphere.js';
import {DistantSunLightSource} from '../../production-snapshots/sun-appearance-step-5-v1/src/algorithm32/implementation/distant-sun/DistantSunLightSource.js';
import {SphericalEarthGeometry} from '../../production-snapshots/sun-appearance-step-5-v1/src/algorithm32/implementation/spherical-earth/SphericalEarthGeometry.js';
import {UniformLambertianGroundBoundary} from '../../production-snapshots/sun-appearance-step-5-v1/src/algorithm32/implementation/uniform-lambertian-ground/UniformLambertianGroundBoundary.js';
import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER,
	SphericalNativePositionDomain} from '../../production-snapshots/sun-appearance-step-5-v1/src/algorithm32/sampling-domains/index.js';
import {SpectralBasis,SpectralPacket,SPECTRAL_BASIS_SCHEMA_REVISION,SPECTRAL_QUANTITIES,SPECTRAL_SAMPLE_SEMANTICS,
	SPECTRAL_UNITS} from '../../production-snapshots/sun-appearance-step-5-v1/src/algorithm32/spectral-values/index.js';
import {CanonicalValueHash} from '../../production-snapshots/sun-appearance-step-5-v1/src/algorithm32/value-identity/CanonicalValueHash.js';
import {B1_DIRECT40_TO_NATIVE15_INDICES,B1_DIRECT40_WAVELENGTHS_NANOMETERS,B1_SUN_STATES,
	createB1Direct40Channels,createB1Native15Channels} from '../point-local-scene-cache/b1PointLocalInputs.js';

const POSITION_DOMAIN=new SphericalNativePositionDomain({id:'b1-bruneton-spherical-48-position-boundary-0m-v1',count:48,
	boundaryAltitude:{value:0,units:'meters'}});
function packet(basis,quantity,values,id){return new SpectralPacket({basis,quantity,units:quantity===SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY
	?SPECTRAL_UNITS.IRRADIANCE_DENSITY:quantity===SPECTRAL_QUANTITIES.REFLECTANCE?SPECTRAL_UNITS.DIMENSIONLESS:SPECTRAL_UNITS.INVERSE_LENGTH,
	values,provenanceIdentity:id});}
function sunDirection(zenithDegrees,azimuthDegrees){const z=zenithDegrees*Math.PI/180,a=azimuthDegrees*Math.PI/180;
	return [Math.sin(z)*Math.cos(a),Math.sin(z)*Math.sin(a),Math.cos(z)];}

export function createPreviousModelB1Profile({time,fittedAzimuthDegrees,maximumScatteringOrder=4,spectralMode}){
	if(!['direct40','native15-equivalent'].includes(spectralMode))throw new RangeError(`Unsupported spectral mode: ${spectralMode}.`);
	const state=B1_SUN_STATES.find(item=>item.time===time);if(!state||state.fittedAzimuthDegrees!==fittedAzimuthDegrees)throw new Error('B1 Sun state drifted.');
	const basis=new SpectralBasis({id:`b1-previous-${spectralMode}-40-slot-v1`,schemaRevision:SPECTRAL_BASIS_SCHEMA_REVISION,
		semantics:SPECTRAL_SAMPLE_SEMANTICS.POINT_SAMPLED_SPECTRAL_DENSITY,
		channels:B1_DIRECT40_WAVELENGTHS_NANOMETERS.map((center,index)=>({id:`lambda-${index}`,center:{value:center,units:'nanometers'},width:{value:11.75,units:'nanometers'}}))});
	const nativeChannels=createB1Native15Channels();const physical=spectralMode==='direct40'?createB1Direct40Channels()
		:B1_DIRECT40_TO_NATIVE15_INDICES.map(index=>nativeChannels[index]);
	const source=packet(basis,SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,physical.map(v=>v.sourceIrradianceDensityWattsPerSquareMeterPerNanometer),`b1-${spectralMode}:source`);
	const rayleigh=packet(basis,SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,physical.map(v=>v.rayleighScatteringPerMeter),`b1-${spectralMode}:rayleigh`);
	const mie=packet(basis,SPECTRAL_QUANTITIES.EXTINCTION_COEFFICIENT,physical.map(v=>v.mieExtinctionPerMeter),`b1-${spectralMode}:mie`);
	const albedo=packet(basis,SPECTRAL_QUANTITIES.REFLECTANCE,physical.map(v=>v.groundAlbedo),`b1-${spectralMode}:grass`);
	const numerical={viewPath:{intervalCount:40,sampleDistribution:null},sourcePathTransmittance:{intervalCount:20},cacheConstruction:{transportIntervalCount:40,maximumScatteringOrder}};
	const directionToLight=sunDirection(state.zenithDegrees,fittedAzimuthDegrees);const domains={positions:POSITION_DOMAIN,
		incomingDirections:REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER,outgoingDirections:CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER};
	const models={lightSource:new DistantSunLightSource({angularRadius:{value:.004675,units:'radians'},sourceIrradiance:source}),
		atmosphere:new CanonicalAtmosphere({constants:{bottomRadius:{value:6360000,units:'meters'},topRadius:{value:6420000,units:'meters'},
			rayleighScaleHeight:{value:8000,units:'meters'},mieScaleHeight:{value:1200,units:'meters'},rayleighCoefficientScale:5.8e-6,
			mieAngstromAlpha:.8,mieAngstromBeta:.04,mieSingleScatteringAlbedo:.8,miePhaseFunctionG:.7,ozoneAbsorptionEnabled:false},
			spectralBasis:basis,seaLevelRayleighScattering:rayleigh,seaLevelMieExtinction:mie}),
		geometry:new SphericalEarthGeometry({bottomRadius:{value:6360000,units:'meters'},topRadius:{value:6420000,units:'meters'},observerHeight:{value:0,units:'meters'},
			observerUpDirection:[0,0,1],cacheAltitudeBinCount:48,cacheBoundaryAltitude:POSITION_DOMAIN.boundaryAltitude,sourceTransmittanceIntervalCount:20}),
		groundBoundary:new UniformLambertianGroundBoundary({id:`b1-${spectralMode}-grass-v1`,albedo}),celestialSources:null,
		sourcePlacement:{kind:'explicit-geometry-placement',observation:{instant:`2013-05-27T${String(Number(time.slice(0,2))+4).padStart(2,'0')}:${time.slice(3)}:00.000Z`,
			location:{latitude:{value:42.44337,units:'degrees'},longitude:{value:-76.48163,units:'degrees'}}},placement:{kind:'distant-direction',directionToLight}}};
	const native15Control={spectralMode,nativeChannels,direct40ToNative15Indices:B1_DIRECT40_TO_NATIVE15_INDICES,
		executionShape:spectralMode==='native15-equivalent'?'40 independent slots populated by 15 duplicated physical channels':'canonical Direct40'};
	return {kind:'algorithm32-execution-profile',id:`b1-previous-${time.replace(':','')}-${spectralMode}-v1`,schemaRevision:'algorithm32-execution-profile-v1',revision:1,
		contentHash:CanonicalValueHash.sha256Value({time,fittedAzimuthDegrees,maximumScatteringOrder,spectralMode,basis:basis.contentHash,source:source.contentHash,
			rayleigh:rayleigh.contentHash,mie:mie.contentHash,albedo:albedo.contentHash}),provenanceIdentity:`b1-previous-${spectralMode}-contained-v1`,
		spectral:{basis,sourceIrradianceDensity:source},models,numerical,domains,native15Control};}
