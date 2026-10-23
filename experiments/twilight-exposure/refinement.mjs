import {readFileSync} from 'node:fs';
import {checked} from './io.mjs';

/** Register one mechanism-led refinement and fresh intermediate-height checks; no parameter search. */
export function refinement(parent) {
	const prior = JSON.parse(readFileSync(checked(parent + '/results.json'), 'utf8'));
	const half = prior.registry.candidates.find(c => c.id === 'curve-half');
	const candidate = {...half, id: 'altitude-half', kind: 'altitude-curve-lift', heightStartMeters: 10000, heightEndMeters: 40000, gpuReferenceId: 'curve-half'};
	const reuse = prior.sources.map(s => ({source: s.source, id: s.sourceId, as: s.id}));
	const cases = [30, 40, 50, 60, 80].map(minutes => ({id: `sj25000-p${minutes}`, location: 0, mode: 'spherical-distant', height: 25000, time: 'sunset', minutes, heading: prior.registry.heading, layers: [0, 1], verifyCandidates: minutes === 50}));
	cases.push({id: 'sj25000-noon', location: 0, mode: 'spherical-distant', height: 25000, time: 'noon', minutes: 0, heading: prior.registry.heading, layers: [0, 1], verifyCandidates: false});
	cases.push({id: 'sj25000-night', location: 0, mode: 'spherical-distant', height: 25000, time: 'sunset', minutes: 180, heading: prior.registry.heading, layers: [0, 1], verifyCandidates: false});
	return {...prior.registry, cases, reuse, candidates: [candidate], refinementParent: parent, experimentHeightMeters: 25000,
		rationale: 'Both global curves excessively darken 5 m/2 km/10 km dusk; keep their established response and Flat exactly native. Smoothly introduce the gentler pilot correction from the highest protected ordinary preset (10 km) to the problem preset (40 km). The untouched 25 km cases test the interior before selecting a replacement. This is empirical display conditioning, not new atmospheric physics.'};
}
