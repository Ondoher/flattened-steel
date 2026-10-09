/** Capture complete application pixels as PNG on the page or its owned canvas worker.
 * @param {LocalSunShellApplicationCanvas} canvas - Exact renderer-owned presentation canvas.
 * @returns {Promise<string>} - Lossless PNG data URL; no HTML viewer or presentation smoothing.
 */
export async function shellApplicationImage(canvas) {
	if('toDataURL' in canvas)return canvas.toDataURL('image/png');
	const blob=await canvas.convertToBlob({type:'image/png'}),bytes=new Uint8Array(await blob.arrayBuffer());
	let binary='';
	for(let offset=0;offset<bytes.length;offset+=8192)binary+=String.fromCharCode(...bytes.subarray(offset,offset+8192));
	return 'data:image/png;base64,'+btoa(binary);
}
