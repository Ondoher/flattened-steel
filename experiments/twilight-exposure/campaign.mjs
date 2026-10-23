import {readFileSync} from 'node:fs';
import {checked} from './io.mjs';

export const baselinePath = 'tmp/experiments/twilight-exposure/runs/00002-baseline';
export const calibrationPath = 'tmp/experiments/twilight-exposure/runs/00004-calibrate';
export const screenPath = 'tmp/experiments/twilight-exposure/runs/00005-curve-screen';

/** Frozen M3 registry, resolved before any held-out candidate image is scored. */
export function campaign(resumePath = null) {
	const baseline = JSON.parse(readFileSync(checked(baselinePath + '/results.json'), 'utf8'));
	const screen = JSON.parse(readFileSync(checked(screenPath + '/results.json'), 'utf8'));
	const first = baseline.cases[0], d = first.camera.direction, length = Math.hypot(d[0], d[2]);
	const heading = [d[0] / length, 0, d[2] / length];
	const candidates = screen.candidates.filter(c => ['curve-half', 'curve-match'].includes(c.id));
	/** @type {TwilightCase[]} */
	const cases = [];
	for (const height of [5, 2000, 10000, 40000]) {
		for (const minutes of [0, 10, 20, 30, 40, 50, 60]) cases.push({id: `sj${height}-p${minutes}`, location: 0, mode: 'spherical-distant', height, time: 'sunset', minutes, heading, layers: [0], verifyCandidates: height === 40000 && minutes === 50});
		for (const time of ['noon', 'night']) cases.push({id: `sj${height}-${time}`, location: 0, mode: 'spherical-distant', height, time: time === 'night' ? 'sunset' : 'noon', minutes: time === 'night' ? 180 : 0, heading, layers: time === 'night' ? [0, 1] : [0]});
	}
	for (const height of [5, 40000]) {
		for (const view of ['away', 'zenith']) cases.push({id: `sj${height}-p50-${view}`, location: 0, mode: 'spherical-distant', height, time: 'sunset', minutes: 50, view, heading, layers: [0, 1]});
		for (const minutes of [0, 50]) cases.push({id: `sj${height}-p${minutes}-close`, location: 0, mode: 'spherical-distant', height, time: 'sunset', minutes, view: 'sun', fov: 5, resetHeading: true, layers: [0]});
		for (const time of ['noon', 'sunset', 'p50']) cases.push({id: `ug${height}-${time}`, location: 1, mode: 'spherical-distant', height, time: time === 'noon' ? 'noon' : 'sunset', minutes: time === 'p50' ? 50 : 0, resetHeading: true, layers: [0], verifyCandidates: height === 5 && time === 'p50'});
		for (const location of [0, 1]) for (const time of ['flat0', 'flat180']) cases.push({id: `${location === 0 ? 'sj' : 'ug'}${height}-${time}`, location, mode: 'flat-local', height, time, resetHeading: true, layers: [0], verifyCandidates: height === 40000 && location === 0 && time === 'flat180'});
	}
	// Reuse exact M1 geometry/pose controls. p50 is deliberately repeated for direct GPU validation.
	const reuse = baseline.cases.filter(c => c.id !== 'sj40-p50').map(c => ({source: baselinePath, id: c.id, as: c.id.replace('sj40-', 'sj40000-').replace('-day', '-noon')}));
	const reusedIds = new Set(reuse.map(c => c.as));
	if (resumePath) {
		const partial = JSON.parse(readFileSync(checked(resumePath + '/failure.json'), 'utf8'));
		for (const c of partial.cases) {
			if (!c.parity.replayQualified) throw Error('Cannot reuse unqualified partial capture');
			reuse.push({source: resumePath, id: c.id, as: c.id}); reusedIds.add(c.id);
		}
		for (const minutes of [70, 80, 100, 120]) cases.push({id: `sj40000-p${minutes}`, location: 0, mode: 'spherical-distant', height: 40000, time: 'sunset', minutes, heading, layers: [0, 1]});
		cases.push({id: 'sj5-p80', location: 0, mode: 'spherical-distant', height: 5, time: 'sunset', minutes: 80, heading, layers: [0, 1]});
	}
	return {cases: cases.filter(c => !reusedIds.has(c.id)), reuse, candidates, frozenLux: first.meterLux, heading, calibrationPath, screenPath, baselinePath,
		viewPolicy: 'San Jose timeline retains M1 +30 local azimuth and -6-degree pitch; held-out endpoints reset local Sun azimuth independently. Sun close-ups aim at the true Sun including occlusion.',
		regressionPolicy: 'Daylight and genuine night keep M1 guards. Primary clipping/structure guards remain fixed. Other dusk/view cases report every change against native and fixed gain, flag lower-median loss over 50%, inspect images, and never treat clipping reduction alone as success.'};
}
