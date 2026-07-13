/**
 * Owner of one cache-construction module.
 *
 * - **"lightSource"** - The atmospheric light-source owner.
 * - **"atmosphere"** - The atmospheric-medium owner.
 * - **"geometry"** - The geometry capability owner.
 * - **"ground"** - The reflective-ground owner.
 * - **"transport"** - The radiance-transport owner.
 * - **"cache"** - The shared cache capability owner.
 */
type CacheBuildOwner = 'lightSource' | 'atmosphere' | 'geometry' | 'ground' | 'transport' | 'cache';

/**
 * Construction-shader phase containing one source block.
 *
 * - **"declare"** - Global declarations emitted before functions.
 * - **"function"** - Reusable function definitions.
 * - **"main"** - Statements emitted inside the cache entry point.
 */
type CacheShaderPhase = 'declare' | 'function' | 'main';

/** Type that supplies one deterministically ordered construction-source block. */
type CacheShaderBlock = Readonly<{
	/** Id value. */ id: string;
	/** Phase value. */ phase: CacheShaderPhase;
	/** Order value. */ order: number;
	/** Source value. */ source: string;
}>;

/**
 * Kind of one declarative cache-construction binding.
 *
 * - **"uniform"** - A runtime shader uniform.
 * - **"data"** - Packed scalar texture data.
 * - **"define"** - A compile-time scalar definition.
 */
type CacheBindingKind = 'uniform' | 'data' | 'define';

/**
 * Type that represents the update frequency of one cache-construction binding.
 *
 * - **"build"** - One value shared by the complete cache build.
 * - **"pass"** - One value shared by a logical construction pass.
 * - **"layer"** - One value selected for a wavelength-layer submission.
 */
type CacheBindingFrequency = 'build' | 'pass' | 'layer';

/** Type that describes one shader binding independently of its value. */
type CacheBindingSpec = Readonly<{
	/** Id value. */ id: string;
	/** Name value. */ name: string;
	/** Kind value. */ kind: CacheBindingKind;
	/** Shader type value. */ shaderType: string;
	/** Frequency value. */ frequency: CacheBindingFrequency;
}>;

/** Pairing of one uniform specification with the value its shader type accepts. */
type CacheUniformBinding =
	| Readonly<{
			/** Spec value. */ spec: CacheBindingSpec &
				Readonly<{
					/** Kind value. */ kind: 'uniform';
					/** Shader type value. */ shaderType: 'float';
				}>;
			/** Value value. */ value: number | UnitValue;
	  }>
	| Readonly<{
			/** Spec value. */ spec: CacheBindingSpec &
				Readonly<{
					/** Kind value. */ kind: 'uniform';
					/** Shader type value. */ shaderType: 'int';
				}>;
			/** Value value. */ value: number;
	  }>
	| Readonly<{
			/** Spec value. */ spec: CacheBindingSpec &
				Readonly<{
					/** Kind value. */ kind: 'uniform';
					/** Shader type value. */ shaderType: 'bool';
				}>;
			/** Value value. */ value: boolean;
	  }>
	| Readonly<{
			/** Spec value. */ spec: CacheBindingSpec &
				Readonly<{
					/** Kind value. */ kind: 'uniform';
					/** Shader type value. */ shaderType: 'vec3';
				}>;
			/** Value value. */ value: Position | UnitVector3;
	  }>
	| Readonly<{
			/** Spec value. */ spec: CacheBindingSpec &
				Readonly<{
					/** Kind value. */ kind: 'uniform';
					/** Shader type value. */ shaderType: `float[${number}]`;
				}>;
			/** Value value. */ value: SpectralPacket;
	  }>;

/**
 * Shader sampler type accepted by one packed cache-data binding.
 *
 * - **"sampler2D"** - A two-dimensional packed scalar texture.
 * - **"sampler2DArray"** - A layered packed scalar texture.
 */
type CacheDataShaderType = 'sampler2D' | 'sampler2DArray';

/**
 * Stable runtime frequency accepted by data and define cache bindings.
 *
 * - **"build"** - One value shared by the complete cache build.
 * - **"pass"** - One value shared by a logical construction pass.
 */
type CacheBindingRuntimeFrequency = 'build' | 'pass';

/** Pairing of one packed-data specification with its normalized values. */
type CacheDataBinding = Readonly<{
	/** Spec value. */ spec: CacheBindingSpec &
		Readonly<{
			/** Kind value. */ kind: 'data';
			/** Shader type value. */ shaderType: CacheDataShaderType;
			/** Frequency value. */ frequency: CacheBindingRuntimeFrequency;
		}>;
	/** Value value. */ value: CacheData;
}>;

/**
 * Numeric shader type accepted by one scalar cache definition.
 *
 * - **"int"** - An integer compile-time definition.
 * - **"float"** - A floating-point compile-time definition.
 */
type CacheDefineScalarType = 'int' | 'float';

/** Pairing of one compile-time specification with its scalar literal. */
type CacheDefineBinding =
	| Readonly<{
			/** Spec value. */ spec: CacheBindingSpec &
				Readonly<{
					/** Kind value. */ kind: 'define';
					/** Shader type value. */ shaderType: CacheDefineScalarType;
					/** Frequency value. */ frequency: CacheBindingRuntimeFrequency;
				}>;
			/** Value value. */ value: number;
	  }>
	| Readonly<{
			/** Spec value. */ spec: CacheBindingSpec &
				Readonly<{
					/** Kind value. */ kind: 'define';
					/** Shader type value. */ shaderType: 'bool';
					/** Frequency value. */ frequency: CacheBindingRuntimeFrequency;
				}>;
			/** Value value. */ value: boolean;
	  }>;

/** Pairing of one construction binding specification with its typed value. */
type CacheBinding = CacheUniformBinding | CacheDataBinding | CacheDefineBinding;

/** Canonical identity value projected from one typed cache binding. */
type CacheBindingIdentity =
	| number
	| boolean
	| UnitValue
	| Position
	| UnitVector3
	| Readonly<{
			/** Optional packed-data identifier. */
			id?: string;
			/** Canonical content hash for packed data or a spectral packet. */
			contentHash: string;
	  }>;

/** Type that supplies one owner module before its stable identity is derived. */
type CacheBuildModuleDefinition = Readonly<{
	/** Id value. */ id: string;
	/** Owner value. */ owner: CacheBuildOwner;
	/** Shader symbols provided by the binding. */ provides: readonly string[];
	/** Requires value. */ requires: readonly string[];
	/** Blocks value. */ blocks: readonly CacheShaderBlock[];
	/** Bindings value. */ bindings: readonly CacheBinding[];
}>;

/** Type that describes one identified owner-supplied construction module. */
type CacheBuildModule = CacheBuildModuleDefinition &
	Readonly<{
		/** Content hash value. */ contentHash: string;
	}>;

/** Contract that supplies the structural GPU-construction capability owned by a model. */
interface CacheBuildContributor {
	/**
	 * Call this method to create cache module.
	 * @param context - The execution context accepted by the operation.
	 * @returns - The result produced by the operation.
	 */ createCacheModule(context: CacheBuildContext): CacheBuildModule;
}

/** Type that supplies one typed pass view to an owner contributor. */
type CacheBuildContext = Readonly<{
	/** Kind value. */ kind: CachePassKind;
	/** Order value. */ order: CacheOrder;
	/** Inputs value. */ inputs: readonly CacheFieldSpec[];
	/** Output value. */ output: CacheFieldSpec;
	/** Options value. */ options: CacheConstructionOptions;
	/** Value that supplies the source-selected executable construction lattice. */
	domains: CacheConstructionDomains;
	/** Value that supplies an executable path interval count to a direct-radiance pass. */
	pathIntervalCount?: number;
	/** Value that supplies one precomputed kernel only to a transport pass. */
	transportData?: CacheTransportData;
	/** Value that supplies reflective-ground work only to a reflective scatter pass. */
	groundReflection?: CacheGroundReflection;
}>;
