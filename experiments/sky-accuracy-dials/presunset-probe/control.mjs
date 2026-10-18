import assert from 'node:assert/strict';
import {readRepository,verifyRun,identity} from '../io/files.mjs';
import {LocationTimeController} from '../../../src/flat32/LocationTimeController.js';
import {createDistantSunSceneState} from '../../../src/flat32/DistantSunSceneState.js';
import {ATMOSPHERE_OBSERVER_HEIGHT,ATMOSPHERE_OBSERVER_UP_DIRECTION} from '../../../src/flat32/consts.js';

export const oldGpu='tmp/experiments/sky-accuracy-dials/runs/00429-h64-dusk-gpu';
export const oldMain='tmp/experiments/sky-accuracy-dials/runs/00430-h64-dusk-main';
export const oldFine='tmp/experiments/sky-accuracy-dials/runs/00431-h64-dusk-fine';

/** Freeze the newly selected instant through the same source-placement owner.
 * @param {boolean} [preOnly] Restrict new cache/external builds to the added time.
 * @returns {any} Immutable parents and original H64 physics with registered new rays.
 */
export function inputs(preOnly=false){
 const parents=[oldGpu,oldMain,oldFine].map(verifyRun),control=JSON.parse(readRepository(oldGpu+'/control.json').toString());
 const times=new LocationTimeController();let selected=times.start();selected=times.nextLocation(times.nextLocation(selected));selected=times.selectGlobeTime(selected,2);selected=times.adjustGlobeMinuteOffset(selected,-10);
 const placement=createDistantSunSceneState({observation:selected.observation,observerHeight:ATMOSPHERE_OBSERVER_HEIGHT,observerUpDirection:ATMOSPHERE_OBSERVER_UP_DIRECTION});
 assert.equal(selected.observation.instant,'2024-06-21T03:16:03.503Z');assert.ok(Math.abs(placement.solarZenithDegrees-88.2237421377953)<1e-10);
 const sunset={...control.scenes[0],instant:'2024-06-21T03:26:03.503Z'},pre={id:'pre10',instant:selected.observation.instant,zenith:placement.solarZenithDegrees,displayLux:sunset.displayLux};
 control.schema='h65-presunset-independent-v1';control.scenes=preOnly?[pre]:[pre,sunset];control.displayPolicy='One fixed H64 sunset P2 context for both times and every method.';
 for(const p of ['src/flat32/LocationTimeController.js','src/flat32/DistantSunSceneState.js','src/algorithm32/implementation/spherical-earth/SphericalEarthGeometry.js'])parents.push(identity(p));
 return {control,parents};
}
