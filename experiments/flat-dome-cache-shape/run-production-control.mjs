import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRun, identity, repository} from './io.mjs';

const owner = 'src/algorithm32/implementation/local-sun/cache/LocalSunCompactProfileSelection.js';
const parents = [
	owner,
	'src/algorithm32/implementation/local-sun/cache/LocalSunCompactConstructionProfile.js',
	'src/algorithm32/implementation/local-sun/cache/LocalSunFieldPacking.js',
	'src/algorithm32/sampling-domains/direction/cubed-sphere/consts.js',
	'src/algorithm32/implementation/local-sun/cache/fixtures/local-sun-compact-p0-controls.json',
];
const run = createRun('m3-prod-control', parents.map(identity));
try {
	const {LocalSunCompactProfileSelection} = await import(pathToFileURL(path.join(repository, owner)).href);
	const profile = new LocalSunCompactProfileSelection().create({
		observation: {
			instant: '2024-12-14T17:27:41.487Z',
			location: {latitude: {value: 0, units: 'degrees'}, longitude: {value: 0, units: 'degrees'}},
		},
		observerPosition: {coordinates: [0, 0, 5], units: 'meters'},
		viewRayLimit: {value: 1926774, units: 'meters'},
		maximumScatteringOrder: 4,
	});
	const domains = profile.domains;
	const result = {
		profileId: profile.id,
		contentHash: profile.contentHash,
		nodes: domains.positions.count,
		incomingDirections: domains.incomingDirections.directionCount,
		outgoingDirections: domains.outgoingDirections.directionCount,
		wavelengths: profile.spectral.basis.channelCount,
		nominalSingleFloatFieldBytes: domains.scatteringDensityPacking.scalarCount * 4,
		domains,
		resources: profile.estimateResources({
			retainedScatteringFields: 1,
			otherOwnedGpuBytes: {value: 0, units: 'bytes'},
		}),
		scope: 'Read-only source-derived production layout control, no cache build or application update. Production slab/source-frame reduction differs physically. Experimental96 incoming/98 outgoing directions differ from production; memory/build results cannot be transplanted directly. Nominal scalar payload is not a measured complete deployed allocation.',
	};
	run.write('results.json', result);
	run.finish('accepted', {
		message:
			'Existing production layout/resource metadata recorded read-only; different geometry/directional resolutions explicitly prevent an equal-accuracy memory claim.',
	});
	console.log(
		JSON.stringify({
			run: run.root,
			nodes: result.nodes,
			incoming: result.incomingDirections,
			outgoing: result.outgoingDirections,
			nominalFieldBytes: result.nominalSingleFloatFieldBytes,
		}),
	);
} catch (error) {
	run.write('failure.json', {error: String(error), stack: error.stack});
	run.finish('failed', {message: String(error)});
	throw error;
}
