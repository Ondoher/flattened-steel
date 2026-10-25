/** New below-limb pixel rays and subpixel paired controls; old sky trace is reused. */
export const limbGrid=[
 ...Array.from({length:24},(_,i)=>{const row=1152+i,v=(2304-row-.5)/2304;return{id:'g'+String(i).padStart(2,'0'),deltaDegrees:Math.atan((2*v-1)*Math.tan(25*Math.PI/180))*180/Math.PI,uv:[2048.5/4096,v],imagePixel:{x:2048,y:row,width:4096,height:2304}};}),
 {id:'sky-pixel',deltaDegrees:Math.atan(Math.tan(25*Math.PI/180)/2304)*180/Math.PI,uv:[2048.5/4096,(2304-1151-.5)/2304],imagePixel:{x:2048,y:1151,width:4096,height:2304}},
 ...[-2,-1,-.005,-.0025,-.001,-.0005,-.00025,.00025,.0005,.001].map((deltaDegrees,i)=>({id:'e'+i,deltaDegrees,uv:[.5,.5+Math.tan(deltaDegrees*Math.PI/180)/(2*Math.tan(25*Math.PI/180))],imagePixel:null})),
].sort((a,b)=>a.deltaDegrees-b.deltaDegrees);
