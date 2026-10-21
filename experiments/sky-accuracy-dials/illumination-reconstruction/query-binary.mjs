import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {randomUUID} from 'node:crypto';

/** Transfer only owned numerical packets over a nonce-scoped loopback endpoint.
 * It serves no repository files and accepts no commands or writes. There is one
 * in-flight immutable packet; callers await its dispatch before replacing it.
 * @returns {Promise<any>} */
export async function openBinaryProjection(){
 const token=randomUUID(),state={input:null,url:'',peakBytes:0,totalBytes:0};
 const server=createServer((request,response)=>{
  response.setHeader('Cache-Control','no-store');
  if(request.method==='GET'&&request.url==='/'){response.setHeader('Content-Type','text/html');response.end('<!doctype html><title>Owned projection bridge</title>');return;}
  if(request.method==='GET'&&request.url==='/'+token&&state.input){response.setHeader('Content-Type','application/octet-stream');response.end(state.input);return;}
  response.statusCode=404;response.end();
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve(undefined)));const address=server.address();assert.ok(address&&typeof address==='object');state.url='http://127.0.0.1:'+address.port+'/'+token;
 return {state,origin:'http://127.0.0.1:'+address.port,async close(){state.input=null;server.closeAllConnections();await new Promise(resolve=>server.close(()=>resolve(undefined)));}};
}

/** Same resident functions and exact Float32 inputs as the ordinary dispatch.
 * @param {any} request @returns {Promise<any>} */
export async function binaryProjectionResident(request){
 const response=await fetch(request.url,{cache:'no-store'});if(!response.ok)throw Error('Owned projection input unavailable');const buffer=await response.arrayBuffer();if(buffer.byteLength!==request.total*4)throw Error('Projection binary length mismatch');const values=new Float32Array(buffer),s=globalThis.__queryProjectionDispatch;if(!s)throw Error('Projection context must be initialized');
 s.query({count:request.count,height:request.height,ampHeight:request.ampHeight,data:values.subarray(0,request.dataCount),amplitude:values.subarray(request.dataCount,request.dataCount+request.amplitudeCount),retainLightOnly:true});
 return s.fourier({count:request.count,quadrature:values.subarray(request.dataCount+request.amplitudeCount)});
}

/** @param {any} page @param {any} bridge @param {any} query
 * @param {number[]} quadrature @returns {Promise<number[]>} */
export async function binaryProjectionDispatch(page,bridge,query,quadrature){
 assert.equal(quadrature.length,query.count*4);const dataCount=query.data.length,amplitudeCount=query.amplitude.length,total=dataCount+amplitudeCount+quadrature.length,values=new Float32Array(total);values.set(query.data);values.set(query.amplitude,dataCount);values.set(quadrature,dataCount+amplitudeCount);
 bridge.state.input=Buffer.from(values.buffer);bridge.state.peakBytes=Math.max(bridge.state.peakBytes,values.byteLength);bridge.state.totalBytes+=values.byteLength;
 return page.evaluate(binaryProjectionResident,{url:bridge.state.url,count:query.count,height:query.height,ampHeight:query.ampHeight,dataCount,amplitudeCount,total});
}
