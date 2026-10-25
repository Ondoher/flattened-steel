/** Native 4K camera pixels; integrate image area before applying display mapping. */
export const rasterSpec={width:4,height:96,x0:2046,y0:1080,frameWidth:4096,frameHeight:2304,edgeRows:[1148,1149,1150,1151,1152,1153,1154,1155]};
const g2=[-.5773502691896257,.5773502691896257],w2=[1,1],g4=[-.8611363115940526,-.3399810435848563,.3399810435848563,.8611363115940526],w4=[.34785484513745385,.6521451548625461,.6521451548625461,.34785484513745385];
export const rasterGrid=[];
for(let y=rasterSpec.y0;y<rasterSpec.y0+rasterSpec.height;y++){
 for(let x=rasterSpec.x0;x<rasterSpec.x0+rasterSpec.width;x++)rasterGrid.push({id:`c-${x}-${y}`,kind:'center',x,y,weight:1,uv:[(x+.5)/4096,1-(y+.5)/2304],imagePixel:{x,y,width:4096,height:2304}});
 for(const x of [2048,2049])for(const order of rasterSpec.edgeRows.includes(y)?[2,4]:[2]){const g=order===2?g2:g4,w=order===2?w2:w4;for(let j=0;j<order;j++)for(let i=0;i<order;i++)rasterGrid.push({id:`q${order}-${x}-${y}-${i}-${j}`,kind:'quadrature',order,x,y,weight:w[i]*w[j]/4,uv:[(x+.5+g[i]/2)/4096,1-(y+.5+g[j]/2)/2304],imagePixel:null});}
}
