import { CAM16_DIM_SURROUND, forwardCam16, inverseCam16Qmh } from './Cam16Reference.js';

const XYZ_TO_REC709=[
	[3.2409699419045226,-1.537383177570094,-0.4986107602930034],
	[-0.9692436362808796,1.8759675015077202,0.04155505740717559],
	[0.05563007969699366,-0.20397695888897652,1.0569715142428786],
];
const REC709_TO_XYZ=[
	[0.4123907992659595,0.35758433938387796,0.1804807884018343],
	[0.21263900587151036,0.7151686787677559,0.07219231536073371],
	[0.01933081871559185,0.11919477979462599,0.9505321522496606],
];
function requireCondition(value,message){if(!value)throw new Error(message);}
function multiply(matrix,vector){return matrix.map((row)=>row.reduce((sum,coefficient,index)=>sum+coefficient*vector[index],0));}
function encode(value){return value<=0.0031308?12.92*value:1.055*value**(1/2.4)-0.055;}
function hueDifference(left,right){const difference=Math.abs(left-right)%360;return Math.min(difference,360-difference);}

export class Stage2bNormalDisplayTransform{
	constructor({q0,qMaster,outputViewingCondition,bisectionIterations=56}){requireCondition([q0,qMaster].every((value)=>Number.isFinite(value)&&value>0)&&qMaster>q0,'Stage 2B display transform requires ordered positive Q anchors.');requireCondition(Number.isInteger(bisectionIterations)&&bisectionIterations>=32,'Stage 2B display transform requires bounded bisection.');this.q0=q0;this.qMaster=qMaster;this.output=outputViewingCondition;this.iterations=bisectionIterations;this.whiteXyz=outputViewingCondition.whiteChromaticityXyzRelative;this.surround=CAM16_DIM_SURROUND;}
	masteringCoordinate(Q){return Math.max(0,Math.min(1,Math.log1p(Math.max(0,Q)/this.q0)/Math.log1p(this.qMaster/this.q0)));}
	inverse(Q,M,h){return inverseCam16Qmh({Q,M,h,whiteXyz:this.whiteXyz,adaptingLuminanceCdPerSquareMeter:this.output.adaptingLuminanceCdPerSquareMeter,backgroundRelativeY:this.output.backgroundRelativeY,surround:this.surround,discountIlluminant:this.output.discountIlluminant});}
	linearRgb(xyz){return multiply(XYZ_TO_REC709,xyz).map((value)=>value/this.output.referenceWhiteLuminanceCdPerSquareMeter);}
	inGamut(rgb,tolerance=1e-12){return rgb.every((value)=>Number.isFinite(value)&&value>=-tolerance&&value<=1+tolerance);}
	evaluateScale(desiredQ,desiredM,h,scale){const output=this.inverse(desiredQ*scale,desiredM*scale,h);const linearRgb=this.linearRgb(output.xyz);return{scale,Q:desiredQ*scale,M:desiredM*scale,h,xyz:output.xyz,linearRgb};}
	transformAppearance({Q,M,h}){requireCondition([Q,M,h].every(Number.isFinite)&&Q>=0&&M>=0,'Stage 2B display transform requires finite nonnegative Q and M.');const t=this.masteringCoordinate(Q);const desiredQ=t*this.q0;const desiredM=Q>0?desiredQ*M/Q:0;let mapped=this.evaluateScale(desiredQ,desiredM,h,1);let boundaryLimited=false;if(!this.inGamut(mapped.linearRgb)){boundaryLimited=true;let lower=0;let upper=1;for(let iteration=0;iteration<this.iterations;iteration+=1){const middle=(lower+upper)/2;const candidate=this.evaluateScale(desiredQ,desiredM,h,middle);if(this.inGamut(candidate.linearRgb,0))lower=middle;else upper=middle;}mapped=this.evaluateScale(desiredQ,desiredM,h,lower);}const boundedLinearRgb=mapped.linearRgb.map((value)=>Math.max(0,Math.min(1,value)));const encodedSrgb=boundedLinearRgb.map(encode);const roundTrip=forwardCam16({xyz:mapped.xyz,whiteXyz:this.whiteXyz,adaptingLuminanceCdPerSquareMeter:this.output.adaptingLuminanceCdPerSquareMeter,backgroundRelativeY:this.output.backgroundRelativeY,surround:this.surround,discountIlluminant:this.output.discountIlluminant});return{input:{Q,M,h},masteringCoordinate:t,desired:{Q:desiredQ,M:desiredM,h},boundaryLimited,boundaryScale:mapped.scale,output:{Q:mapped.Q,M:mapped.M,h,xyz:mapped.xyz,linearRgb:boundedLinearRgb,encodedSrgb},roundTrip:{Q:roundTrip.Q,M:roundTrip.M,h:roundTrip.h,hueErrorDegrees:M>1e-12?hueDifference(roundTrip.h,h):0}};}
	describe(){return{id:'stage2b-normal-q-log-joint-qm-boundary-v1',brightness:'condition-varying CIECAM16 Q',mastering:{q0:this.q0,qMaster:this.qMaster,equation:'log1p(Q/Q0)/log1p(Qmaster/Q0)',targetQ:'t * Q0'},colorfulness:'preserve source M/Q and hue',gamut:'bounded bisection scaling output Q and M jointly at fixed hue',display:this.output};}
}

export function rec709LinearToAbsoluteXyz(rgb,peakNits=100){return multiply(REC709_TO_XYZ,rgb).map((value)=>value*peakNits);}
