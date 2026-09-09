/** Normalize data-path measurements so dense and atlas implementations use one comparison record. */
export function frameRecord(path, selectionDegrees, residencyPlan, measurements) {
	if (path !== 'dense' && path !== 'atlas') throw new TypeError('Frame path must be dense or atlas.');
	if (!Number.isInteger(selectionDegrees)) throw new TypeError('Selection degrees must be an integer.');
	return Object.freeze({
		path,
		selectionDegrees,
		requiredBlocks: residencyPlan.required.length,
		reusedBlocks: residencyPlan.reused.length,
		decodedBlocks: measurements.decodedBlocks,
		uploadedBlocks: measurements.uploadedBlocks,
		evictedBlocks: residencyPlan.evicted.length,
		cpuDecodeMilliseconds: measurements.cpuDecodeMilliseconds,
		gpuUploadMilliseconds: measurements.gpuUploadMilliseconds,
		frameBoundarySwitchMilliseconds: measurements.frameBoundarySwitchMilliseconds,
		selectionElapsedMilliseconds: measurements.selectionElapsedMilliseconds,
	});
}
