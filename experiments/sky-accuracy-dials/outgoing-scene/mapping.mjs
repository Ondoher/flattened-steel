import assert from 'node:assert/strict';
import {adapt} from '../outgoing-focus/control.mjs';

/** Builder-owned mapping identity used by both contained compiler and scene facade. */
export const mapping={schema:'h62-receiver-w27-sun-warp-v1',k:.35,solarFirstDegrees:.5,solarSpacingDegrees:1,slots:4374};

/** Normalize the production scatter rule without altering physical material.
 * @param {string} source @returns {string}
 */
export function normalized(source){
 let s=source.replaceAll('\r\n','\n'),a=s.indexOf('function scatterFragment('),b=s.indexOf('function transportFragment(',a);
 assert.ok(a>=0&&b>a);let part=s.slice(a,b);
 const needle="'sum += incomingRadiance * scattering * incomingRecord.w;'";
 assert.equal(part.split(needle).length,2);
 part=part.replace(needle,"'sum += incomingRadiance * scattering * incomingRecord.w; mieSum += incomingRadiance * medium.mieScattering * miePhase(outgoing,incoming) * incomingRecord.w; mieMass += miePhase(outgoing,incoming) * incomingRecord.w;'");
 assert.equal(part.split('float sum = 0.0;').length,2);assert.equal(part.split('outputValue = sum;').length,2);
 part=part.replace('float sum = 0.0;','float sum = 0.0; float mieSum=0.0; float mieMass=0.0;').replace('outputValue = sum;','outputValue = sum - mieSum + mieSum/max(mieMass,1e-12);');
 return s.slice(0,a)+part+s.slice(b);
}

/** Apply the qualified H61 construction/recurrence map, without its observation hook.
 * @param {string} source @param {number} k @returns {string}
 */
export function compiler(source,k){
 return adapt(source,k).replace("if(fieldId.startsWith('J'))await globalThis['__h61Observe']({gl,fieldId,resource,common});\n\t\t",'');
}

/** Substitute a cache-owned mapping scalar and retain physical local direction.
 * @param {string} source @returns {string}
 */
export function facade(source){
 let s=source.replaceAll('\r\n','\n');
 const value="'cache.sharedSceneOrdinal': this._frame.snapshot.sceneOrdinal ?? 0,";
 assert.equal(s.split(value).length,2);s=s.replace(value,value+"\n 'cache.h62WarpK': this._frame.h62Mapping?.k ?? 1,");
 const uniforms='uniforms: [';assert.equal(s.split(uniforms).length,2);
 s=s.replace(uniforms,uniforms+"\n ShaderContributions.createShaderUniformDeclaration('uH62WarpK','float','cache.h62WarpK',1),");
 const before='vec3 directionCoordinate = distantSceneDirectionCoordinate(distantSceneLocalOutgoingDirection(';
 assert.equal(s.split(before).length,2);s=s.replace(before,'vec3 h62LocalDirection = distantSceneLocalOutgoingDirection(');
 const after='physicalOutgoingDirection\n\t));';assert.equal(s.split(after).length,2);
 s=s.replace(after,'physicalOutgoingDirection\n\t);\n vec3 directionCoordinate = distantSceneDirectionCoordinate(h62LocalDirection);');
 return s;
}

/** Emit shared row-specific inverse mapping; a forward declaration respects GLSL source order. */
export const inverseGlsl=`
vec3 distantSceneDirectionCoordinate(vec3 direction);
vec3 h62Coordinate(vec3 d,int row){
 if(uH62WarpK==1.0)return distantSceneDirectionCoordinate(d);
 float theta=(float(row)+0.5)*0.017453292519943295;
 vec3 sun=vec3(sin(theta),0.0,cos(theta));float k=1.0/uH62WarpK,c=dot(d,sun);
 vec3 mapped=normalize((2.0*k*d+(1.0-k*k+(k-1.0)*(k-1.0)*c)*sun)/(1.0+k*k+(1.0-k*k)*c));
 return distantSceneDirectionCoordinate(mapped);
}
`;

/** Modify the existing cubic helper, preserving texture operations and interpolation.
 * @param {string} source @returns {string}
 */
export function lookup(source){
 let s=source.replaceAll('\r\n','\n');
 const marker='vec4 distantCubicPacket(';assert.equal(s.split(marker).length,2);
 s=s.replace(marker,inverseGlsl+marker);
 s=s.replace('vec3 directionCoordinate, float zenithCoordinate','vec3 directionCoordinates[4], float zenithCoordinate');
 for(let i=0;i<4;i++)s=s.replace(`distantCubicPacket(addresses[${i}], directionCoordinate, plane)`,`distantCubicPacket(addresses[${i}], directionCoordinates[${i}], plane)`);
 const body='bool supported = true;\n\tvec4 density0';assert.equal(s.split(body).length,2);
 s=s.replace(body,`vec3 h62Coordinates[4];\n int h62Lower=min(int(floor(zenithCoordinate)),178);\n for(int tap=0;tap<4;tap++)h62Coordinates[tap]=h62Coordinate(h62LocalDirection,clamp(h62Lower+tap-1,0,179));\n bool supported = true;\n\tvec4 density0`);
 s=s.replace('altitudeStencil.indices[altitudeTap], directionCoordinate, zenithCoordinate','altitudeStencil.indices[altitudeTap], h62Coordinates, zenithCoordinate');
 return s;
}
