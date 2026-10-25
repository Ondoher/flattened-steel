import {createDistantSunSceneCacheCommonShaderSource} from '../../scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js';

/** Generate actual compiler GLSL using the recorded construction contract. */
export function actualCompilerSource(request){
 const spec=request.transportSpec,ch=spec.domains.spectrum.channels[6];
 return createDistantSunSceneCacheCommonShaderSource({wavelengthNanometers:ch.centerNanometers,sourceIrradiance:ch.sourceIrradianceDensityWattsPerSquareMeterPerNanometer,ozoneCrossSection:0,rayleighScattering:ch.rayleighScatteringPerMeter,mieExtinction:ch.mieExtinctionPerMeter,mieSingleScatteringAlbedo:ch.mieSingleScatteringAlbedo,miePhaseTable:ch.miePhaseTable,bottomRadiusMeters:spec.planet.bottomRadiusMeters,topRadiusMeters:spec.planet.topRadiusMeters,rayleighScaleHeightMeters:spec.atmosphere.rayleighScaleHeightMeters,mieScaleHeightMeters:spec.atmosphere.mieScaleHeightMeters,rayleighCoefficientScalePerMeter:spec.atmosphere.rayleighCoefficientScalePerMeter,mieAngstromAlpha:spec.atmosphere.mieAngstromAlpha,mieAngstromBeta:spec.atmosphere.mieAngstromBeta,miePhaseFunctionG:spec.atmosphere.miePhaseFunctionG,sourcePathTransmittanceIntervalCount:spec.numerical.sourcePathTransmittanceIntervalCount,incomingDirectionCount:spec.domains.incoming.directionCount,transportIntervalCount:spec.numerical.transportIntervalCount,outgoingFaceWidth:spec.domains.outgoing.faceWidth,positionAltitudesMeters:spec.domains.position.nodes.map(n=>n.altitudeMeters),solarZenithDegrees:spec.domains.solarZenith.nodes.map(n=>n.solarZenithDegrees),coordinateContract:spec.shaderProfile.coordinateContract,sourceDirection:spec.source.directionToLight,numericalPolicy:spec.numerical.geometryPolicy,scatteringAccuracy:spec.numerical.scatteringAccuracy});
}

/** Extract an unchanged GLSL function definition by balanced braces. */
export function glslFunction(source,name){
 const match=new RegExp('\\b[A-Za-z_]\\w*\\s+'+name+'\\s*\\([^)]*\\)\\s*\\{','u').exec(source);if(!match)throw Error('Missing actual GLSL function '+name);
 let at=match.index+match[0].length,depth=1;for(;at<source.length&&depth;at++){if(source[at]==='{')depth++;else if(source[at]==='}')depth--;}
 if(depth)throw Error('Unbalanced GLSL function '+name);return source.slice(match.index,at);
}

/** Preserve emitted geometry arithmetic; rename tokens only for runtime isolation. */
export function isolatedCompilerGeometry(request){
 const common=actualCompilerSource(request),names=['radialProjection','altitudeAtPoint','sphereRoots','firstPositiveRoot','rayBlockedByGround','topBoundaryDistance','groundBoundaryHit','atmosphereBranchLength'],start=common.indexOf('vec3 radialAnchorPoint ='),end=common.indexOf('float radialProjection(',start);
 if(start<0||end<start)throw Error('Expected anchored compiler geometry');
 const spec=request.transportSpec,raw=`const float BOTTOM_RADIUS=${spec.planet.bottomRadiusMeters.toExponential(16)};\nconst float TOP_RADIUS=${spec.planet.topRadiusMeters.toExponential(16)};\nconst float ATMOSPHERE_HEIGHT=${(spec.planet.topRadiusMeters-spec.planet.bottomRadiusMeters).toExponential(16)};\nconst vec3 SOURCE_DIRECTION=vec3(0,0,1);\n`+common.slice(start,end)+names.map(n=>glslFunction(common,n)).join('\n');
 const symbols=[...names,'BOTTOM_RADIUS','TOP_RADIUS','ATMOSPHERE_HEIGHT','SOURCE_DIRECTION','radialAnchorPoint','radialAnchorHeight','radialAnchorCosine','radialAnchorZenithDegrees','radialAnchorDirection','radialAnchorDirectionCosine'];
 const isolated=raw.replace(new RegExp('\\b('+symbols.join('|')+')\\b','gu'),s=>'analytic_'+s);
 return{raw,isolated,names,operation:'Exact generated geometry bodies and anchor declarations; arithmetic unchanged, listed identifiers prefixed analytic_.'};
}
