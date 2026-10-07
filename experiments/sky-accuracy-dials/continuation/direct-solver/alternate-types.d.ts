/** Fixed retained-data selection and five-channel comparison inputs. */
type SkyAlternateRay = Readonly<{
	/** Stable time, selection role and grid selector. */ id: string;
	/** Original observation time. */ time: string;
	/** Prospective selection stratum. */ role: string;
	/** Canonical grid column. */ x: number;
	/** Canonical grid row. */ y: number;
	/** Viewing elevation in degrees. */ elevation: number;
	/** Sun separation in degrees. */ separation: number;
	/** Signed selection objective in spectral radiance squared. */ rank: number;
	/** Eligible rays in this stratum before ranking. */ candidates: number;
	/** Source-aligned origin in kilometres. */ origin: readonly number[];
	/** Source-aligned unit direction. */ direction: readonly number[];
	/** Unchanged Kider measurements in selected-channel order. */ measured: readonly number[];
	/** Retained spectra, comparison only; never shader inputs. */ models: Readonly<Record<string, readonly number[]>>;
}>;
