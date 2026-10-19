import {read} from '../geometry-incoming/common.mjs';
export const base='tmp/experiments/sky-accuracy-dials/runs/';
export const registrationRoot=base+'00566-h97-phase-cells';
export const registration=()=>read(registrationRoot+'/registration.json.gz');
export const witnesses=[{target:'node-89',channel:8,k:.5},{target:'reserved-out-1',channel:5,k:.5}].flatMap(t=>['paper','toronto'].map(profile=>({...t,profile})));
