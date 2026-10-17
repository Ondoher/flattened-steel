/** Physical point query in the cache's canonical source-aligned sphere frame. */
type AttributionPoint={id:string;point:number[];direction:number[];altitude:number;kind:'off-grid'|'node';row?:number;outgoingIndex?:number};
/** Cache row associated with the selected horizon samples. */
type AttributionNode={row:number;position:number;zenith:number;altitude:number;point:number[];tangentIndex:number};
/** Additional contained observation controls; no deployed contract changes. */
type AttributionControl=HorizonProductionControl&{diagnostic?:{points:AttributionPoint[];nodes:AttributionNode[]}};
/** Compact readings while each previous-order field remains live. */
type AttributionFieldDiagnostic={fieldId:string;channel:number;points:(AttributionPoint&{reconstructed:number;continuousDirect:number;actualHeight:number;actualZenith:number})[];transport:{intervals:number;rows:{row:number;values:number[]}[]}[];traces:{row:number;directionIndex:number;intervals?:number;terms:number[][]}[]};
