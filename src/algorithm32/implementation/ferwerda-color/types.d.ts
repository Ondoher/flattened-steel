type FerwerdaAdaptationKind = 'receiver-local-brightness-proxy' | 'qualified-starlight-reference';

type FerwerdaAdaptationInput = {
	readonly kind: FerwerdaAdaptationKind;
	readonly luminance: UnitValue<'cd m^-2'>;
	readonly provenanceId: string;
};

type FerwerdaColorDisplayModelConfiguration = {
	readonly adaptation: FerwerdaAdaptationInput;
};

type FerwerdaSteadyStateParameters = {
	readonly worldAdaptationLuminance: number;
	readonly displayMaximumLuminance: number;
	readonly displayAdaptationLuminance: number;
	readonly displayPhotopicThreshold: number;
	readonly worldPhotopicThreshold: number;
	readonly worldScotopicThreshold: number;
	readonly coneScale: number;
	readonly rodScale: number;
	readonly rodBlend: number;
	readonly units: 'cd m^-2';
};
