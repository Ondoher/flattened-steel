/** Installed CommonJS plugin factory whose Node interop declaration needs an explicit callable boundary. */
type LocalSunP4CommonJsFactory = () => import('rollup').Plugin;

/** Optional Rollup environment substitution result; the output has no additional source map. */
type LocalSunP4EnvironmentTransformResult = Readonly<{
	/** Transformed module source. */ code: string;
	/** No separate map emitted for this bounded transform. */ map: null;
}> | null;

/** Exact identity of one immutable or authenticated derivation parent. */
type LocalSunP4ParentIdentity = Readonly<{
	/** Repository-relative parent artifact path. */ path: string;
	/** SHA-256 of the exact parent bytes. */ sha256: string;
}>;

/** Exact ordinary-scene observations for one successful local frame. */
type LocalSunP4ApplicationRow = Readonly<{
	/** Catalog-wide actual resource and ordinary consumer comparisons. */ celestial?: LocalSunP4CelestialProofReport;
	/** Actual canvas capture carried only across the owned browser/host boundary. */ imageDataUrl?: string;
	/** Actual ordinary control action. */ action: string;
	/** Exact displayed physical observation. */ observation: GeometryObservation;
	/** Geometry-resolved finite source center. */ sourcePosition: Position;
	/** Retained canonical physical field identity. */ constructionIdentity: string;
	/** Exact live packet identity. */ frameIdentity: string;
	/** Measured receiver state identity. */ receiverIdentity: string;
	/** Direct-normal Native15 spectral irradiance density. */ directNormal: readonly number[];
	/** Diffuse-horizontal Native15 spectral irradiance density. */ diffuseHorizontal: readonly number[];
	/** Matching measured stellar adaptation luminance. */ adaptation: UnitValue<'cd m^-2'>;
	/** Actual endpoint light and shadow inventory. */ lighting: Flat32SceneSummary;
	/** Actual completed stellar generation count. */ stellarGenerationCount: number;
	/** Actual completed finite-Sun generation count. */ sunGenerationCount: number;
}>;
/** Bounded ordinary application proof outcome with genuine renderer identity. */
type LocalSunP4ApplicationReport = Readonly<{
	/** Actual application failure reported while its complete frame remained installed. */ unsupportedRetained?: true;
	/** Actual application retry reused the canonical field. */ retryReused?: true;
	/** Aborted actual candidate retained the complete frame. */ cancellationRetained?: true;
	/** Exact proof schema. */ schema: 'local-sun-p4-ordinary-application-v1';
	/** All declared browser assertions passed. */ state: 'passed';
	/** Selected independently qualified physical scattering order. */ order: SupportedCacheScatteringOrder;
	/** Observed WebGL renderer string. */ renderer: string;
	/** Complete actual source-control observations. */ rows: readonly LocalSunP4ApplicationRow[];
	/** Camera changes retained the physical field. */ cameraOnlyReuse: true;
	/** Owned runtime/backend resources completed release. */ cleanupComplete: true;
	/** Browser proof elapsed time, milliseconds. */ elapsedMilliseconds: number;
}>;

/** Frozen simulated star expectations for one predeclared exact observation. */
type LocalSunP4CelestialControlRow = Readonly<{
	/** Exact ordinary source-control action. */ action: string;
	/** Input geography and UTC instant, distinct from expected values. */ observation: GeometryObservation;
	/** Independent binary64 expected direction for all 2,000 authenticated members. */ expectedDirections: readonly UnitVector3[];
}>;
/** Portable original-gate celestial comparison authority. */
type LocalSunP4ControlsFixture = Readonly<{
	/** Unchanged accepted fixed one-pixel irradiance-to-boundary-radiance scale. */ irradianceToBoundaryRadianceScale: UnitValue<'sr^-1'>;
	/** Exact fixture schema. */ schema: 'local-sun-p4-celestial-controls-v1';
	/** Accepted simulated epoch, rotation, projection and dome inputs. */ policy: FlatStellarProjectionPolicy;
	/** Physical receiver point in meters. */ observer: readonly [number, number, number];
	/** Authenticated member-major binary32 direction/magnitude values. */ members: readonly number[];
	/** Complete frozen expected direction inventory. */ rows: readonly LocalSunP4CelestialControlRow[];
	/** Original sealed pixel/palette/magnitude gates, fixed before scoring. */ gates: Readonly<{
		continuousPixelAbsolute: number;
		integerPixelAbsolute: number;
		paletteRelative: number;
		magnitudeAbsolute: number;
	}>;
	/** Complete parent, extraction, operation and tool identities. */ derivation: Readonly<{
		/** Exact immutable/data parent identities. */ parents: readonly Readonly<{path: string; sha256: string}>[];
		/** Independent extraction and evaluation operation. */ operation: string;
		/** Extracted sealed oracle source digest. */ oracleSourceSha256: string;
		/** Maintained offline producer path. */ producer: string;
		/** Exact producer source hash. */ producerSha256: string;
		/** Node runtime identity. */ node: string;
	}>;
}>;

/** Inputs for comparisons against the genuine ordinary published celestial resources. */
type LocalSunP4CelestialProofRequest = Readonly<{
	/** Exact selected color/filter identities and measured receiver/adaptation tuple. */ presentation: StellarPresentationCompatibility;
	/** Complete actual controller frame. */ frame: PreparedLocalSunFrame;
	/** Actual resource-owning renderer. */ renderer: import('three').WebGLRenderer;
	/** Actual ordinary camera. */ camera: import('three').PerspectiveCamera;
	/** Exact physical geometry and public stellar projection capability. */ geometry: import('../../../../src/algorithm32/implementation/index.js').FlatEarthGeometry;
	/** Actual authenticated stellar source used by the ordinary mode. */ stars: StellarScreenPaletteSource;
	/** Frozen independent expected directions for this input. */ control: LocalSunP4CelestialControlRow;
	/** Exact original gates and authenticated member inputs. */ fixture: LocalSunP4ControlsFixture;
}>;
/** Once-only transmission and exact mask/disjoint behavior of the ordinary compositor. */
type LocalSunP4ConsumerProofReport = Readonly<{
	/** Maximum relative once-only spectral transmission residual. */ maxTransmissionRelative: number;
	/** Opaque scene masking returned exact zero. */ sceneMaskExactZero: true;
	/** Filtered disjoint pixel coverage returned exact zero. */ filteredDisjointExactZero: true;
}>;
/** Catalog-wide projection, collision and producer/consumer comparison observations. */
type LocalSunP4CelestialProofReport = Readonly<{
	/** Number of authenticated compared catalog members. */ catalogCount: number;
	/** Number of actual occupied pixels. */ occupiedPixels: number;
	/** Number of actual collision pixels. */ collisionPixels: number;
	/** Observed direction-component residual; not an absolute accuracy bound. */ maxDirectionAbsolute: number;
	/** Maximum original continuous raster residual. */ maxContinuousPixelAbsolute: number;
	/** Maximum original integer-boundary assignment displacement. */ maxIntegerPixelAbsolute: number;
	/** Maximum Native15 collision-palette residual. */ maxPaletteRelative: number;
	/** Number of provably disjoint exact-zero producer texels. */ disjointTexels: number;
	/** Number of positive supported producer texels. */ positiveTexels: number;
	/** Ordinary consumer mask/transmission/coverage comparisons. */ consumer: LocalSunP4ConsumerProofReport;
}>;

/** Existing Three texture property required by the offline read-only framebuffer adapter. */
type LocalSunP4TextureProperties = Readonly<{
	/** Actual native handle of an already published initialized texture. */ __webglTexture?: WebGLTexture;
}>;
/** Actual complete generation resources exposed by the existing shader diagnostic capability. */
type LocalSunP4ShaderDiagnosticSnapshot = Readonly<{
	/** Actual renderer-owned generation observations. */ runtime: Readonly<{
		/** Published stellar index/palette pair. */ stellarGeneration: Readonly<{
			publicationState: Readonly<{active: StellarScreenPaletteGeneration}>;
		}>;
		/** Joint celestial publication. */ celestialGeneration: Readonly<{
			sun: Readonly<{publicationState: Readonly<{active: CelestialSunTileGeneration}>}>;
		}>;
	}>;
}>;
