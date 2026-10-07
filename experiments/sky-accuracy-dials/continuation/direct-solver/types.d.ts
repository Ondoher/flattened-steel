/** Direct quadrature controls; no radiance or attenuation fields are stored. */
type SkyDirectProfile = Readonly<{
	/** Recorded configuration identity. */ name: string;
	/** Outermost viewing quadrature size. */ view: number;
	/** Every nested path quadrature size. */ path: number;
	/** Optical-depth quadrature size for both Sun and view segments. */ transmission: number;
	/** Gauss-Legendre cosine nodes over the sphere. */ mu: number;
	/** Uniform midpoint azimuth nodes. */ phi: number;
	/** Maximum atmospheric-scattering/ground-reflection interaction count. */ orders: number;
}>;
/** Original physical inputs expressed in kilometres for GPU conditioning. */
type SkyDirectMedium = Readonly<{
	/** Ground radius, km. */ bottom: number;
	/** Atmosphere radius, km. */ top: number;
	/** Rayleigh scale height, km. */ rayleighHeight: number;
	/** Aerosol scale height, km. */ mieHeight: number;
	/** Aerosol scattering/extinction ratio. */ albedo: number;
	/** Cornette-Shanks asymmetry. */ g: number;
	/** Sea-level Rayleigh coefficients, km^-1. */ rayleigh: readonly number[];
	/** Sea-level aerosol extinction, km^-1. */ mie: readonly number[];
	/** Direct spectral irradiance. */ sun: readonly number[];
	/** Spectral Lambertian albedo. */ ground: readonly number[];
}>;
/** One selected physical ray and its unchanged measurements. */
type SkyDirectRay = Readonly<{
	/** Exact retained probe. */ id: string;
	/** Original local capture label. */ time: string;
	/** Source-aligned origin, km. */ origin: readonly number[];
	/** Unit viewing direction. */ direction: readonly number[];
	/** Original four-channel measurement values. */ measured: readonly number[];
	/** Prior corrected-first/frozen-higher diagnostic totals, comparison only. */ previous: readonly number[];
}>;
/** Small authored quadrature rule, never a physical-field cache. */
type SkyDirectRule = Readonly<{
	/** Nodes on [0,1]. */ nodes: readonly number[];
	/** Weights summing to one. */ weights: readonly number[];
}>;
/** Hardware result for one ray and pure interaction order. */
type SkyDirectGpuResult = Readonly<{
	/** Four spectral integrals in W m^-2 sr^-1 nm^-1. */ values: readonly number[];
	/** Hardware identity. */ renderer: string;
	/** Including compile, execution and readback. */ milliseconds: number;
	/** Computed independent outer integrand contributions. */ contributions: number;
}>;
/** Frozen authority for one new direct-solver GPU evidence job. */
type SkyDirectGpuAuthorization = Readonly<{
	/** Original accepted endpoint. */ through: DialFileIdentity;
	/** New fixed execution plan. */ plan: DialFileIdentity;
	/** Previously charged attempts at this package's frozen boundary. */ priorAttempts: number;
	/** Exactly one additional attempt, without retries. */ additionalAttempts: number;
	/** Absolute execution stop. */ deadline: string;
}>;
