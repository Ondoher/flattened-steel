import {FlatScatteringCacheGeometry} from '../../src/algorithm32/implementation/flat-earth/FlatScatteringCacheGeometry.js';
import {FlatEarthGeometry} from '../../src/algorithm32/implementation/flat-earth/FlatEarthGeometry.js';
import {FlatGeometryCacheModuleProvider} from '../../src/algorithm32/implementation/flat-earth/FlatGeometryCacheModuleProvider.js';
import {FlatGeometryShaderContributor} from '../../src/algorithm32/implementation/flat-earth/FlatGeometryShaderContributor.js';
import {FlatGeometrySceneAdapter} from '../../src/algorithm32/implementation/flat-earth/three/FlatGeometrySceneAdapter.js';
import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER} from '../../src/algorithm32/sampling-domains/index.js';
import {shellStencil, shellStencilGlsl} from './shell-layout.js';
import {registerShellAxis} from './shell-axis.js';
import {shellReconstructionGlsl,shellReconstructionData,shellExcessData} from './shell-reconstruction.js';
import {CacheBuildModules} from '../../src/algorithm32/shader-assembly/cache-pass/CacheBuildModules.js';

/** Replace one known spatial function without changing surrounding physical equations.
 * @param {string} text - Owned collaborator's generated shader block.
 * @param {string} start - Exact function signature prefix.
 * @param {string} end - Exact next function signature prefix.
 * @param {string} replacement - New executable function block.
 * @returns {string} - Adapted source; missing collaborators fail explicitly.
 */
function replaceBlock(text, start, end, replacement) {
	const first = text.indexOf(start), last = text.indexOf(end, first + start.length);
	if(first < 0 || last < 0) throw new Error('Shell shader collaborator changed.');
	return text.slice(0, first) + replacement + '\n\n' + text.slice(last);
}

/** Install a compact shell mesh on one newly owned experiment geometry.
 * Production code, instances, and historical P2 controls remain untouched.
 * @param {FlatEarthGeometry} geometry - Configured fresh experimental geometry.
 * @param {LocalSunShellLayout} layout - Validated executable mesh.
 * @returns {void} - Replaces only this instance's spatial collaborators.
 */
export function installShellGeometry(geometry, layout) {
	registerShellAxis(geometry,layout);
	const original = geometry.configuration;
	if(original.sourcePosition.coordinates[2] !== layout.height || original.topAltitude.value !== layout.top)
		throw new Error('Shell layout/model mismatch.');
	const configuration = {...original, cacheRadialMaximum: {value:layout.maximumRho,units:/** @type {const} */('meters')}};
	const fallback = configuration.cacheRadialFallbackDirection;
	const subpoint = configuration.sourceSubpoint.coordinates;
	/** @type {FlatLocalCachePositionDomain} */
	const domain = {
		id: `shell-position-${layout.nodes.length}-v1`,
		nodes: layout.nodes.map(node => ({index:node.index,
			coordinate:{value:node.z,units:/** @type {const} */('meters')},
			role: node.z===0 ? 'ground-boundary-node' : node.z===layout.top ? 'top-boundary-node' : 'interior-node',
			metadata:{
				position:{coordinates:/** @type {UnitVector3} */([subpoint[0]+fallback[0]*node.rho,subpoint[1]+fallback[1]*node.rho,node.z]),units:/** @type {const} */('meters')},
				z:{value:node.z,units:/** @type {const} */('meters')},rho:{value:node.rho,units:/** @type {const} */('meters')},
				zIndex:node.rowIndex,rhoIndex:node.index-layout.rows[node.rowIndex].indices[0],shellId:node.band,
			}})),
		zNodes:layout.rows.map(r=>({value:r.z,units:/** @type {const} */('meters')})),
		rhoNodes:configuration.cacheRadialNodes,
		zCount:layout.rows.length,rhoCount:Math.max(...layout.rows.map(r=>r.indices.length)),count:layout.nodes.length,
	};
	geometry._configuration = configuration;
	const cacheGeometry = new FlatScatteringCacheGeometry(configuration,geometry,CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER);
	geometry._scatteringCacheGeometry=cacheGeometry;
	geometry._cacheModuleProvider=new FlatGeometryCacheModuleProvider(configuration);
	geometry._shaderContributor=new FlatGeometryShaderContributor(configuration);
	geometry._sceneAdapter=new FlatGeometrySceneAdapter(configuration);
	cacheGeometry.createLocalSunCachePositionDomain = () => domain;
	cacheGeometry.resolveScatteringCachePositionStencil = request => shellStencil(layout,
		request.atmosphereCoordinate.rho?.value ?? geometry.resolveAtmosphereCoordinate(request.position).rho.value,
		request.atmosphereCoordinate.altitude.value);
	const glsl=shellStencilGlsl(layout)+'\n'+shellReconstructionGlsl(layout);
	const contribution=geometry.createShaderContribution.bind(geometry);
	geometry.createShaderContribution=()=>{
		const original=contribution();
		let replacements=0;
		const functions=original.functions.map(block=>{
			if(!block.code.includes('CachePositionStencil resolveScatteringCachePositionStencil(')) return block;
			replacements++;
			const code=replaceBlock(block.code,'CachePositionStencil resolveScatteringCachePositionStencil(',
				'vec3 scatteringCacheLocalDirection(',glsl+'\nCachePositionStencil resolveScatteringCachePositionStencil(AtmosphereCoordinate coordinate) { return shellStencil(coordinate.rhoMeters,coordinate.altitudeMeters); }');
			return {...block,code:code.replaceAll('/ denominator;','/ max(denominator,1.0e-30);').replaceAll('radial = normalize(radial);','radial = radial / max(length(radial),1.0e-30);')+`\nCacheDirectionStencil shellAxisDirectionStencil(vec3 direction) {
	vec3 projected=GEOMETRY_CACHE_RADIAL_FALLBACK*length(direction.xy)+vec3(0.0,0.0,direction.z);
	return resolveScatteringCacheDirectionStencil(GEOMETRY_SOURCE_SUBPOINT_METERS,projected);
}`};
		});
		if(replacements!==1) throw new Error('Runtime shell stencil owner missing.');
		return {...original,id:original.id+'-shell-layout-v1',functions};
	};
	const provider=geometry._cacheModuleProvider;
	const factorData=layout.reconstruction ? shellReconstructionData(layout) : null;
	const excessData=factorData ? shellExcessData(layout) : null;
	const build=provider.createCacheModule.bind(provider);
	provider.createCacheModule=context=>{
		const original=build(context);
		let replacements=0;
		const blocks=original.blocks.map(block=>{
			if(block.source.includes('float cacheRadialBoundaryDistance(')) {
				return {...block,source:replaceBlock(block.source,'float cacheRadialBoundaryDistance(',
					'void cacheSelectNearestBoundary(',`float cacheRadialBoundaryDistance(vec3 p, vec3 direction) {
	vec2 o=(p.xy-uCacheGeometrySourceSubpoint.xy)/uCacheGeometryRadialMaximum;
	float a=dot(direction.xy,direction.xy);
	if(a<=1.0e-18) return -1.0;
	float rho=length(p.xy-uCacheGeometrySourceSubpoint.xy);
	float b=dot(o,direction.xy);
	float inside=((uCacheGeometryRadialMaximum-rho)/uCacheGeometryRadialMaximum)*(1.0+rho/uCacheGeometryRadialMaximum);
	float root=sqrt(max(0.0,b*b+a*inside));
	float t=b>=0.0 ? (inside==0.0 ? 0.0 : inside/(root+b)) : (-b+root)/a;
	if(t< -1.0e-7) return -1.0;
	return max(0.0,t)*uCacheGeometryRadialMaximum;
}`)};
			}
			if(!block.source.includes('CachePositionStencil cacheConstructionPositionStencil(')) return block;
			replacements++;
			let source=replaceBlock(block.source,'CachePositionStencil cacheConstructionPositionStencil(',
				'vec3 cacheConstructionLocalDirection(',glsl+'\nfloat shellTransportRhoOverride = -1.0;\nCachePositionStencil cacheConstructionPositionStencil(vec3 p) { return shellStencil(shellTransportRhoOverride >= 0.0 ? shellTransportRhoOverride : cacheRho(p),cacheAltitude(p)); }');
			source=source.replace('bool endsOnGround;\n};','bool endsOnGround;\n\tbool endsOnCylinder;\n};')
				.replace('bool endsOnGround = false;','bool endsOnGround = false;\n\tbool endsOnCylinder = false;')
				.replace('selectedDistanceMeters = radialDistanceMeters;\n\t\tendsOnGround = false;',
					'selectedDistanceMeters = radialDistanceMeters;\n\t\tendsOnGround = false;\n\t\tendsOnCylinder = true;')
				.replace('max(0.0, selectedDistanceMeters),\n\t\tendsOnGround',
					'max(0.0, selectedDistanceMeters),\n\t\tendsOnGround,\n\t\tendsOnCylinder');
			if(!source.includes('bool endsOnCylinder;'))throw new Error('Construction boundary marker missing.');
			return {...block,source:source.replaceAll('/ denominator;','/ max(denominator,1.0e-30);').replaceAll('radial = normalize(radial);','radial = radial / max(length(radial),1.0e-30);')};
		});
		if(context.kind==='transport' && replacements!==1) throw new Error('Build shell stencil owner missing.');
		return CacheBuildModules.createBuildModule({...original,id:original.id+'-shell-layout-v2',blocks,bindings:context.kind==='transport' && factorData ? [...original.bindings,
			{spec:{id:'shell-node-factors',name:'uShellNodeFactors',kind:'data',shaderType:'sampler2D',frequency:'build'},value:factorData},
			{spec:{id:'shell-radius-excess',name:'uShellExcessNodes',kind:'data',shaderType:'sampler2D',frequency:'build'},value:excessData}] : original.bindings});
	};
}
