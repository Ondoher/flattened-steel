/** A 4096x2304 central-column trace plus finer limb and wider-sky controls.
 * Positive angles are above the geometric limb, not above the local horizontal.
 */
export const verticalTraceGrid=[
 ...Array.from({length:87},(_,index)=>{const row=1151-index,v=(2304-row-.5)/2304;return{id:'p'+String(index).padStart(3,'0'),deltaDegrees:Math.atan((2*v-1)*Math.tan(25*Math.PI/180))*180/Math.PI,uv:[2048.5/4096,v],imagePixel:{x:2048,y:row,width:4096,height:2304}};}),
 ...[.0025,.005,.6,1.2,2.5,3,4,5].map((deltaDegrees,index)=>({id:'a'+index,deltaDegrees,uv:[.5,.5+Math.tan(deltaDegrees*Math.PI/180)/(2*Math.tan(25*Math.PI/180))],imagePixel:null})),
].sort((a,b)=>a.deltaDegrees-b.deltaDegrees);
