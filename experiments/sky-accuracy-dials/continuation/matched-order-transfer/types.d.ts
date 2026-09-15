/** A finite interval including arithmetic padding. */
type SkyOrderTransferInterval = Readonly<{low: number; high: number}>;
/** Cumulative radiance and admitted fixed-field numerical allowance, in spectral W. */
type SkyOrderTransferValue = Readonly<{value: number; allowance: number | null}>;
/** Exact selected parent values; the target's fifth/sixth values are absent. */
type SkyOrderTransferInput = Readonly<{
	probeId: string;
	channel: number;
	/** Original matched H cumulative N1 through N6. */ h: readonly SkyOrderTransferValue[];
	/** Original P55 cumulative N1 through N4 only. */ p: readonly SkyOrderTransferValue[];
}>;
/** Input uncertainty of a prospective spectral response, excluding model error. */
type SkyOrderTransferForecastValue = Readonly<{
	value: number;
	allowance: number;
	interval: SkyOrderTransferInterval;
}>;
/** One frozen response model's separate fifth/sixth-order and total-tail predictions. */
type SkyOrderTransferForecast = Readonly<{
	model: 'damped-log-ratio' | 'last-log-step';
	/** Prospective P55/H effective increment ratios at actual orders five/six. */ ratios: readonly number[];
	/** P55 minus H effective increments at actual orders five/six. */ responses: readonly SkyOrderTransferForecastValue[];
	/** Sum of the two prospective responses, preserving sign cancellation. */ tail: SkyOrderTransferForecastValue;
}>;
/** Input admission and both registered prospective models for one selected group. */
type SkyOrderTransferPrediction = Readonly<{
	probeId: string;
	channel: number;
	admitted: boolean;
	reason: string | null;
	/** Central lower-order diagnostics; absent when inputs are unresolved. */ diagnostics: Readonly<{
		ratios: readonly number[];
		d3: number;
		d4: number;
		beta: number;
		betaInterval: SkyOrderTransferInterval;
	}> | null;
	forecasts: readonly SkyOrderTransferForecast[];
}>;
