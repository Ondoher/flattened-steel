import {make as structured,frame,horizon} from './rules.mjs';
import {make as fibonacci} from '../geometry-incoming/rules.mjs';
/** Registered structured rules and complete Fibonacci controls at any declared warp. @param {any} config @param {any} target @param {number} radius @param {number} [placement] @returns {any} */
export function make(config,target,radius,placement=0){if(config.kind!=='sun')return structured(config,target,radius,placement);const g=fibonacci({...config,placement:'midpoint'},target,radius,placement===1?.2718281828459045:0);return {...g,id:config.id,config,frame:frame(g.axis),horizon:horizon(target.altitude,radius),placement};}
