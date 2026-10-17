/** Retained H46 external comparison and production spectra. */
type HorizonTorontoExternalRow = {
 elevation:number;
 externalN1:{spectrum:number[];luminanceHalfWidth95:number;bandHalfWidths95:number[]};
 externalFull:{meanSpectrum:number[];luminanceHalfWidth95:number};
 productionN1:{spectrum:number[]};
 productionFull:{spectrum:number[]};
};
/** One independent spectral estimator, including per-batch values and sampling uncertainty. */
type HorizonTorontoProbeMetric = {
 id:string;spectrum:number[];color:HorizonColorReading;bandHalfWidths95:number[];
 luminanceHalfWidth95:number;samples:number[][];
};
/** Three retained order estimators and a paired source/view optical-quadrature control. */
type HorizonTorontoProbeRow = {
 elevation:number;metrics:HorizonTorontoProbeMetric[];control:HorizonTorontoProbeMetric[];
 integrationControl:{id:string;Y64Minus128:number;pairedHalfWidth95:number}[];
};
