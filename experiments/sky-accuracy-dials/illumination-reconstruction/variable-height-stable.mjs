import assert from 'node:assert/strict';
import {variableHeightShader} from './variable-height-l1.mjs';

/** Preserve the direct-light quadrature, using cancellation-resistant log1p
 * and expm1 on short ground branches. Degree-six Taylor expressions below1/16
 * have remainders below Float32 precision. Above the threshold, retain the
 * original elementary operations. No optical/geometry input is adjusted.
 * @returns {string} */
export function stableVariableHeightShader(){
 let source=variableHeightShader();const replace=(a,b)=>{assert.equal(source.split(a).length,2);source=source.replace(a,b);};
 replace('void main(){',`float stableLog1p(float x){if(abs(x)<0.0625)return x*(1.0+x*(-0.5+x*(1.0/3.0+x*(-0.25+x*(0.2-x/6.0)))));return log(1.0+x);}
float stableExpm1(float x){if(abs(x)<0.0625)return x*(1.0+x*(0.5+x*(1.0/6.0+x*(1.0/24.0+x*(1.0/120.0+x/720.0)))));return exp(x)-1.0;}
void main(){`);
 replace('log(1.0+a/1000.0)','stableLog1p(a/1000.0)');replace('log(1.0+b/1000.0)','stableLog1p(b/1000.0)');replace('1000.0*(exp(lo+span*X(nv,j))-1.0)','1000.0*stableExpm1(lo+span*X(nv,j))');return source;
}
