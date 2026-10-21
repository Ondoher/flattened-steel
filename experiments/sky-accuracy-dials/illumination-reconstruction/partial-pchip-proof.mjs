import assert from 'node:assert/strict';
import {createRun,identity,storage} from '../io/files.mjs';
import {gauss} from '../interior-illumination/physics.mjs';
import {base,read,verifyRun} from './common.mjs';
import {ownedPartialField} from './partial-field.mjs';
import {radialTau} from './segment-transport.mjs';
import {normalizedPartialField,densityPartialExact} from './partial-density.mjs';
import {altitudePchip,altitudePchipValue} from './altitude-pchip.mjs';

const native=['00725-h136-source-row','00738-h138-source-row','00740-h138-source-row','00743-h138-source-row'],extra=['00746-h138-source-row','00750-h138-source-row','00755-h138-source-row'],fields=[{id:'native',field:ownedPartialField(native.map(x=>base+x),[0,1875,3125,4375])},{id:'refined',field:ownedPartialField([...native,...extra].map(x=>base+x),[0,937.5,1875,2500,3125,3750,4375])}],reference=base+'00766-h138-paired-xref',ref=read(reference+'/summary.json');assert.equal(ref.closureCompatible,true);
const run=createRun('h138-pchip',{
 parents:[verifyRun(reference),verifyRun(base+'00757-h138-increment'),verifyRun(base+'00760-h138-density-gpu'),...fields.flatMap(x=>x.field.parents)],operation:'Test the earned altitude-curvature lead with fixed nonuniform shape-preserving Hermite interpolation of the same species-density-normalized owned source data. Compare native and fully midpoint-refined support, preserving every source value, physical parameter and independent physical reference. First verify affine/constant manufactures, exact nodal restoration, positivity/no-overshoot and knot-split transport convergence. This is a bounded one-wavelength derivative, not an adopted global policy.',
 parameters:{variants:['density-normalized-linear','density-normalized-PCHIP'],sourceSupport:fields.map(x=>({id:x.id,heights:x.field.altitudes})),reference:identity(reference+'/summary.json'),quadrature:[64,128],shapeSamplesPerCell:201,scaleHeights:[8000,1200],observer:'Zenith view, radial0-4375m, Sun elevation0.5degree',channel:8,costIsGate:false},
});

/** @param {any} field @param {any[]} models @param {number} n
 * @returns {number[]} */
function transport(field,models,n){const out=[0,0],q=gauss(n);for(let i=1;i<field.altitudes.length;i++){const a=field.altitudes[i-1],span=field.altitudes[i]-a;for(let j=0;j<n;j++){const h=a+span*q.nodes[j],w=span*q.weights[j]*Math.exp(-radialTau(field.physical,h));for(let s=0;s<2;s++)out[s]+=w*Math.exp(-h/[8000,1200][s])*altitudePchipValue(models[s],h);}}return out;}

/** Common-reference absolute-error change; inspect endpoints and both break
 * values where either absolute error changes slope. @param {number} value
 * @param {number} control @param {number} lo @param {number} hi
 * @returns {any} */
function errorChange(value,control,lo,hi){const knots=[lo,hi,...[value,control].filter(x=>x>=lo&&x<=hi)],d=knots.map(r=>(Math.abs(value-r)-Math.abs(control-r))/r);return {lower:Math.min(...d),upper:Math.max(...d),improvedAcrossReportedRange:Math.max(...d)<0};}

try{
 const results=[];for(const {id,field}of fields){run.progress('altitude-curvature',id);const manufacture=[];for(const slope of [0,.0001]){const values=field.altitudes.map(h=>1+slope*h),m=altitudePchip(field.altitudes,values);let maximum=0;for(let j=0;j<=100;j++){const h=4375*j/100;maximum=Math.max(maximum,Math.abs(altitudePchipValue(m,h)-(1+slope*h)));}assert.ok(maximum<=1e-12);manufacture.push({slope,maximum});}
  const normalized=normalizedPartialField(field),models=['rayleigh','mie'].map(key=>altitudePchip(field.altitudes,normalized.rows.map(row=>row[key][field.upIndex]))),nodeChecks=field.altitudes.map((h,i)=>models.map((m,s)=>{const actual=altitudePchipValue(m,h)*Math.exp(-h/[8000,1200][s]),expected=field.rows[i][['rayleigh','mie'][s]][field.upIndex],relative=Math.abs(actual-expected)/expected;assert.ok(relative<=1e-7);return {h,s,relative};})).flat();
  for(const m of models)for(let i=1;i<field.altitudes.length;i++)for(let j=0;j<=200;j++){const h=field.altitudes[i-1]+(field.altitudes[i]-field.altitudes[i-1])*j/200,value=altitudePchipValue(m,h),lo=Math.min(m.values[i-1],m.values[i]),hi=Math.max(m.values[i-1],m.values[i]);assert.ok(value>0&&value>=lo-1e-12*hi&&value<=hi+1e-12*hi);}
  const a=transport(field,models,64),b=transport(field,models,128),bias=b.map((x,s)=>2*Math.abs(x-a[s]));assert.ok(bias.every((x,s)=>x<=1e-8*b[s]));const linear=densityPartialExact(normalized,128),values=[...b,b[0]+b[1]],controls=[...linear,linear[0]+linear[1]],comparison=values.map((value,s)=>{const interval=ref.components[s].reference;return {component:ref.components[s].component,value,linearControl:controls[s],reference:{lower:interval.lower,upper:interval.upper},relativeErrorRange:[value/interval.upper-1,value/interval.lower-1],insideReportedInterval:value>=interval.lower&&value<=interval.upper,errorChange:errorChange(value,controls[s],interval.lower,interval.upper)};});results.push({id,sourceAltitudes:field.altitudes,manufacture,nodeChecks,shapePreserved:true,gaussBias:bias,comparison});}
 run.write('summary.json',{results,reference:identity(reference+'/summary.json'),scope:'Same-source altitude-interpolation derivative in one-wavelength partial L2. Physical reference has statistical and empirical sensitivities; component improvements do not establish a full cache, later-order, ground, horizon scene or B1 result. Hardware cubic interpolation is a separate obligation.'});run.finish('accepted',{fields:results.length,manufacturesAndShape:true});console.log(JSON.stringify({run:run.path,results:results.map(({nodeChecks,...x})=>x),storage:storage()}));
}catch(error){run.finish('failed',{failure:String(error)});throw error;}verifyRun(run.path);
