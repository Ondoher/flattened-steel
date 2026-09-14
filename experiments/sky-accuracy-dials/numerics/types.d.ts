/** A physical or normalized three-dimensional vector in component order. */
type SkyVector3 = readonly [number, number, number];

/** Selected solar reconstruction operator on fixed Z180 knots.
 * - **"monotone-cubic"** - Production harmonic-slope Hermite reconstruction.
 * - **"linear"** - Linear reconstruction between adjacent solar knots.
 */
type SkySolarInterpolation = 'monotone-cubic' | 'linear';

/** Placement of final-view quadrature intervals.
 * - **"quadratic"** - Retained production near-observer quadratic distance partition.
 * - **"altitude-segmented"** - Split at physical cache altitude crossings, then subdivide each segment uniformly in distance.
 */
type SkyViewRule = 'quadratic' | 'altitude-segmented';

/** How pure scattering orders are reconstructed into final radiance.
 * - **"cumulative"** - Interpolate the Float32 cumulative field before integration.
 * - **"grouped"** - Interpolate first order and the higher-order sum separately.
 * - **"analytic-n1"** - Continuous first order plus the interpolated higher-order sum.
 * - **"frozen-increment-analytic-n1"** - Replace first-order radiance while preserving cumulative increments.
 */
type SkyRepresentation = 'cumulative' | 'grouped' | 'analytic-n1' | 'frozen-increment-analytic-n1';

/** Incoming quadrature family.
 * - **"production-f68"** - Retain the authenticated production vectors and weights exactly.
 * - **"gauss-legendre-product"** - Positive Gauss-Legendre cosine by uniform-azimuth quadrature.
 */
type SkyIncomingKind = 'production-f68' | 'gauss-legendre-product';

/** Placement of a fixed-count uniform incoming azimuth rule.
 * - **"midpoint"** - Historical mirrored half-step pairs; omission preserves this rule and identity.
 * - **"endpoint-aware"** - Azimuth zero and pi once each with exact zero y, followed by mirrored interior pairs.
 */
type SkyAzimuthPlacement = 'midpoint' | 'endpoint-aware';

/** One incoming-quadrature selection; counts apply only to the product rule. */
type SkyIncomingControl = Readonly<{
	/** Named family; no phase renormalization is performed. */ kind: SkyIncomingKind;
	/** Even cosine-node count, from 4, 8, 16 or 32. */ muCount?: number;
	/** Azimuth-node count divisible by four, from 8, 16, 32 or 64. */ azimuthCount?: number;
	/** Product-rule placement; omitted or explicit midpoint retains historical controls. F68 rejects this option. */ azimuthPlacement?: SkyAzimuthPlacement;
}>;

/** Optional independently selected numerical controls. */
type SkyControlInput = Readonly<{
	/** Retained-node altitude count: 48, 51, 55 or 63. */ altitudeCount?: number;
	/** Cubed-sphere face width: 27, 39 or 51. */ outgoingWidth?: number;
	/** Incoming family and its explicit resolution. */ incoming?: SkyIncomingControl;
	/** Source-path trapezoid interval count: 20, 40, 80 or 160. */ sourceIntervals?: number;
	/** Recurrence-path interval count: 40, 80, 160 or 320. */ transportIntervals?: number;
	/** Final-view interval placement; omission retains quadratic. */ viewRule?: SkyViewRule;
	/** Quadratic total counts 30/60/120, or altitude-segment substeps 1/2/4/8/16. */ viewIntervals?: readonly number[];
	/** Unique final-view solar operators; recurrence remains unchanged. */ solarInterpolations?: readonly SkySolarInterpolation[];
	/** Unique representations in retained output order. */ representations?: readonly SkyRepresentation[];
}>;

/** Validated complete numerical controls in deterministic output order. */
type SkyControls = Readonly<{
	/** Selected altitude count. */ altitudeCount: number;
	/** Selected cubed-sphere face width. */ outgoingWidth: number;
	/** Selected incoming quadrature. */ incoming: SkyIncomingControl;
	/** Source-path interval count. */ sourceIntervals: number;
	/** Recurrence-path interval count. */ transportIntervals: number;
	/** Final-view interval placement. */ viewRule: SkyViewRule;
	/** Ordered total counts or substeps per altitude segment, according to viewRule. */ viewIntervals: readonly number[];
	/** Ordered final-view solar operators. */ solarInterpolations: readonly SkySolarInterpolation[];
	/** Ordered output representations. */ representations: readonly SkyRepresentation[];
}>;

/** One direct spectral channel, preserving production units. */
type SkySpectralChannel = Readonly<{
	/** Wavelength center in nanometres. */ centerNanometers: number;
	/** Irradiance per nanometre normal to the collimated beam. */ sourceIrradianceDensityWattsPerSquareMeterPerNanometer: number;
	/** Rayleigh scattering coefficient per metre at zero altitude. */ rayleighScatteringPerMeter: number;
	/** Mie extinction coefficient per metre at zero altitude. */ mieExtinctionPerMeter: number;
	/** Lambertian ground albedo. */ groundAlbedo: number;
}>;

/** Explicit physical altitude construction node. */
type SkyAltitudeNode = Readonly<{
	/** Zero-based construction index. */ index: number;
	/** Height above the spherical ground in metres. */ altitudeMeters: number;
}>;

/** Explicit physical solar-angle construction node. */
type SkySolarNode = Readonly<{
	/** Optional retained construction index. */ index?: number;
	/** Source zenith angle in degrees. */ solarZenithDegrees: number;
}>;

/** GPU incoming-direction vectors and solid-angle weights. */
type SkyIncomingDomain = Readonly<{
	/** Provenance identity. */ id: string;
	/** Number of directions. */ directionCount: number;
	/** Receiver-local unit vectors. */ unitVectors: readonly SkyVector3[];
	/** Positive solid-angle weights in steradians. */ integrationWeightsSteradians: readonly number[];
}>;

/** GPU cubed-sphere outgoing reconstruction domain. */
type SkyOutgoingDomain = Readonly<{
	/** Provenance identity. */ id: string;
	/** Number of nodes on each face edge. */ faceWidth: number;
	/** Six faces times face width squared. */ directionCount: number;
	/** Logical vectors in retained face/V/U order. */ unitVectors: readonly SkyVector3[];
	/** Exact positive-axis probe coordinates required by the compiler. */ positiveFaceCenterIndices: Readonly<{
		/** Center on positive X face. */ positiveX: number;
		/** Center on positive Y face. */ positiveY: number;
		/** Center on positive Z face. */ positiveZ: number;
	}>;
}>;

/** Fixed physical model and explicit recurrence construction parameters. */
type SkyTransportSpec = Readonly<{
	/** Spherical geometry radii in metres. */ planet: Readonly<{
		/** Ground radius. */ bottomRadiusMeters: number;
		/** Atmospheric outer radius. */ topRadiusMeters: number;
	}>;
	/** Physical atmospheric coefficients; preserved by numerical interventions. */ atmosphere: Readonly<{
		/** Molecular scale height in metres. */ rayleighScaleHeightMeters: number;
		/** Aerosol scale height in metres. */ mieScaleHeightMeters: number;
		/** Mie scattering to extinction ratio. */ mieSingleScatteringAlbedo: number;
		/** Cornette-Shanks phase parameter. */ miePhaseFunctionG: number;
		/** Ozone state; this lane retains the matched disabled control. */ ozone: Readonly<{
			/** Whether ozone absorption is active. */ absorptionEnabled: boolean;
		}>;
	}>;
	/** Explicit construction domains. */ domains: Readonly<{
		/** Altitude nodes. */ position: Readonly<{
			/** Domain identity. */ id: string;
			/** Number of nodes. */ count: number;
			/** Monotonically increasing metre coordinates. */ nodes: readonly SkyAltitudeNode[];
		}>;
		/** Fixed Z180 solar nodes. */ solarZenith: Readonly<{
			/** Domain identity. */ id: string;
			/** Number of nodes. */ count: number;
			/** Half-degree-centered, one-degree-spaced nodes. */ nodes: readonly SkySolarNode[];
		}>;
		/** Incoming angular integration owner. */ incoming: SkyIncomingDomain;
		/** Outgoing reconstruction owner. */ outgoing: SkyOutgoingDomain;
		/** Complete Direct40 spectrum. */ spectrum: Readonly<{
			/** Spectrum identity. */ id: string;
			/** Direct spectral values in wavelength order. */ channels: readonly SkySpectralChannel[];
		}>;
	}>;
	/** Compiler coordinate convention. */ shaderProfile?: Readonly<{
		/** Must remain scene-cache-receiver-local-v1. */ coordinateContract?: string;
	}>;
	/** Explicit numerical choices consumed by the production compiler. */ numerical: Readonly<{
		/** Source optical-depth quadrature count. */ sourcePathTransmittanceIntervalCount: number;
		/** Recurrence transport quadrature count. */ transportIntervalCount: number;
		/** Actual implemented pure-order count; fixed to four. */ maximumScatteringOrder: number;
		/** Declared parent solar interpolation owner. */ solarInterpolation?: string;
		/** Retained anchored geometry control. */ geometryPolicy?: Readonly<{
			/** Geometry identity. */ id: string;
			/** Must remain anchored-radial. */ positionMethod?: string;
		}>;
	}>;
}>;

/** Serialized compiler request; additional authenticated parent fields survive cloning. */
type SkyBuildRequest = Readonly<{
	/** Distinct compiler request identity. */ id: string;
	/** Physical and numerical construction input. */ transportSpec: SkyTransportSpec;
}>;

/** Layout-only hardware preflight; memory estimate excludes driver overhead. */
type SkyFieldLayout = Readonly<{
	/** Logical outgoing field width. */ widthJ: number;
	/** Incoming field width. */ widthL: number;
	/** Altitude times solar node count. */ height: number;
	/** One J plus two L Float32 fields. */ estimatedPeakFieldBytes: number;
}>;

/** Derived compiler request and validated independent knobs. */
type SkyDerivedProfile = Readonly<{
	/** Compiler request with physical fields preserved. */ buildRequest: SkyBuildRequest;
	/** Canonical complete control record. */ controls: SkyControls;
	/** Hardware dimension and recurrence-memory estimate. */ layout: SkyFieldLayout;
}>;

/** One registered measurement condition in caller-specified order. */
type SkyScene = Readonly<{
	/** Unique scene identity. */ id: string;
	/** Capture time HH:MM. */ time: string;
	/** Physical Sun zenith in degrees. */ zenithDegrees: number;
	/** Fitted Sun azimuth in degrees. */ fittedAzimuthDegrees: number;
}>;

/** Shared sparse field coordinate in full GPU texture addressing. */
type SkyFieldCoordinate = Readonly<{
	/** Canonical logical outgoing direction, the GPU column. */ x: number;
	/** Solar index times altitude count plus altitude index. */ y: number;
	/** Physical altitude-node index. */ altitudeIndex: number;
	/** Physical solar-node index. */ solarIndex: number;
	/** Same canonical outgoing logical index as x. */ directionIndex: number;
	/** Deterministic diagnostic label. */ label: string;
}>;

/** Compact factorized support for one physical quadrature query. */
type SkyViewSample = Readonly<{
	/** World query point in metres. */ point: SkyVector3;
	/** Positive quadrature weight in metres; ordinary midpoint views use interval length. */ step: number;
	/** Nonnegative physical query altitude in metres. */ altitude: number;
	/** One or two physical altitude interpolation weights. */ altitudeWeights: readonly number[];
	/** One to four normalized outgoing interpolation weights. */ directionWeights: readonly number[];
	/** Solar interpolation fraction between its two interior knots. */ solarFraction: number;
	/** Whether the solar interval touches the lower physical endpoint. */ firstSolarInterval: boolean;
	/** Whether the solar interval touches the upper physical endpoint. */ lastSolarInterval: boolean;
	/** Sparse field indexes ordered altitude then four solar knots then direction. */ indices: readonly number[];
}>;

/** Append-only local support shared by ordinary views and independent reference rules. */
type SkyPointStencilBuilder = Readonly<{
	/** Ordered field taps accumulated by sample calls. */ coordinates: readonly SkyFieldCoordinate[];
	/** Preserve the production reconstruction arithmetic at an arbitrary physical query. */ sample: (
		point: SkyVector3,
		direction: SkyVector3,
		weight: number,
	) => SkyViewSample;
}>;

/** One registered sky direction and its ordered quadrature midpoints. */
type SkyViewRay = Readonly<{
	/** Caller scene ordinal. */ sceneIndex: number;
	/** Exact scene identity. */ sceneId: string;
	/** Registered capture time. */ time: string;
	/** Measurement grid X. */ gridX: number;
	/** Measurement grid Y. */ gridY: number;
	/** Surface observer in canonical source-aligned world. */ origin: SkyVector3;
	/** Unit view direction towards sampled sky. */ worldDirection: SkyVector3;
	/** Distance to the outer atmosphere in metres. */ length: number;
	/** Ordered midpoints of the selected physical-distance partition. */ samples: readonly SkyViewSample[];
}>;

/** One view-count/solar-operator variant evaluated from the same fields. */
type SkyViewVariant = Readonly<{
	/** Stable variant identity. */ id: string;
	/** Interval placement rule. */ viewRule: SkyViewRule;
	/** Total quadratic count or substeps per altitude segment. */ intervalCount: number;
	/** Smallest actual midpoint count among this variant's rays. */ minimumSampleCount: number;
	/** Largest actual midpoint count among this variant's rays. */ maximumSampleCount: number;
	/** Solar interpolation rule. */ solarInterpolation: SkySolarInterpolation;
	/** Scene-major, X-major, Y-major rays. */ rays: readonly SkyViewRay[];
}>;

/** One contiguous physical-distance interval along a prepared view ray. */
type SkyPathInterval = Readonly<{
	/** Distance from the observer to the interval start in metres. */ start: number;
	/** Distance from the observer to the interval end in metres. */ end: number;
}>;

/** Browser-safe sparse query plan; rebuild from its compact input recipe. */
type SkyViewPlan = Readonly<{
	/** Schema identity. */ schemaId: string;
	/** Union of all retained field taps. */ coordinates: readonly SkyFieldCoordinate[];
	/** Ordered quadrature/operator views. */ views: readonly SkyViewVariant[];
	/** Ordered final-radiance representations. */ representations: readonly SkyRepresentation[];
	/** Rays per view; equal to scene count times 81. */ rayCount: number;
}>;

/** Exact flattening dimensions for one completed wavelength. */
type SkyEvaluationShape = Readonly<{
	/** Number of representation choices. */ representationCount: number;
	/** Number of view variants. */ viewCount: number;
	/** Four actual cumulative stages. */ orderCount: number;
	/** Rays in each view. */ rayCount: number;
}>;

/** Compact per-channel result, consumed immediately by the streaming host. */
type SkyOrderEvaluation = Readonly<{
	/** Result schema. */ schemaId: string;
	/** Direct40 channel index. */ channel: number;
	/** Array shape in representation/view/order/ray order. */ shape: SkyEvaluationShape;
	/** Binary64 radiance in W m^-2 sr^-1 nm^-1. */ values: Float64Array;
}>;

/** A positive integration node and weight. */
type SkyQuadratureNode = Readonly<{
	/** Coordinate in [-1,1]. */ node: number;
	/** Positive integration weight. */ weight: number;
}>;

/** Cubed-sphere local face convention. */
type SkyCubeFace = Readonly<{
	/** Face outward normal. */ normal: SkyVector3;
	/** Increasing U tangent. */ uAxis: SkyVector3;
	/** Increasing V tangent. */ vAxis: SkyVector3;
}>;

/** Positive interpolation stencil in local array order. */
type SkyLinearStencil = Readonly<{
	/** Coordinate indexes. */ indices: readonly number[];
	/** Corresponding positive or zero weights. */ weights: readonly number[];
}>;

/** One generated benchmark ray before midpoint construction. */
type SkyRayGeometry = Readonly<{
	/** Surface world point. */ origin: SkyVector3;
	/** Unit direction towards sampled sky. */ direction: SkyVector3;
	/** Distance to the top boundary. */ length: number;
}>;

/** Memoized direct-source coefficients at one visited construction knot. */
type SkyDirectKnot = Readonly<{
	/** Physical position on the source meridian. */ point: SkyVector3;
	/** Source-facing tangent, across and radial basis. */ frame: readonly SkyVector3[];
	/** Extinction and separate Rayleigh/Mie scattering coefficients. */ coefficients: SkyVector3;
	/** Spectral source irradiance times direct attenuation. */ illumination: number;
}>;
