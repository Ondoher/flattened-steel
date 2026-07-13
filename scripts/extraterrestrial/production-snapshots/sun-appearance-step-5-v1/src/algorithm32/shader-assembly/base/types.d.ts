/**
 * Shader-contribution owner identity.
 *
 * - **"runtime"** - The shared runtime skeleton owner.
 * - **"geometry"** - The geometry capability owner.
 * - **"lightSource"** - The atmospheric light-source owner.
 * - **"atmosphere"** - The atmospheric-medium owner.
 * - **"cache"** - The scattering-cache owner.
 * - **"celestialCache"** - The independently owned celestial-cache contribution owner.
 * - **"transport"** - The radiance-transport owner.
 * - **"color"** - The display-color composition owner.
 */
type ShaderOwnerId =
	'runtime' | 'geometry' | 'lightSource' | 'atmosphere' | 'cache' | 'celestialCache' | 'transport' | 'color';

/**
 * Expected shader-binding update cadence.
 *
 * - **"setup"** - A value established during runtime setup.
 * - **"config"** - A value refreshed when accepted configuration changes.
 * - **"frame"** - A value refreshed for each rendered frame.
 */
type ShaderUpdateFrequency = 'setup' | 'config' | 'frame';

/**
 * Kind of binding consumed by a shader contribution.
 *
 * - **"uniform"** - A scalar or vector shader uniform.
 * - **"texture"** - A renderer texture sampler.
 * - **"define"** - A compile-time shader definition.
 */
type ShaderBindingKind = 'uniform' | 'texture' | 'define';

/**
 * Shader-source assembly slot.
 *
 * - **"declareTypes"** - Type declarations emitted before executable source.
 * - **"declareConstants"** - Constant declarations emitted before helper source.
 * - **"declareHelpers"** - Shared helper declarations.
 * - **"reconstructRay"** - View-ray reconstruction source.
 * - **"resolvePathBounds"** - Physical path-bound resolution source.
 * - **"sampleAtmosphere"** - Atmospheric-medium sampling source.
 * - **"sampleLightSource"** - Atmospheric light-source sampling source.
 * - **"sampleScatteringCache"** - Scattering-cache sampling source.
 * - **"sampleCelestialCache"** - Celestial-cache sampling source.
 * - **"evaluateTransport"** - Radiance-transport evaluation source.
 * - **"evaluateCelestialRadiance"** - Live celestial-radiance evaluation source.
 * - **"composeSpectralRadiance"** - Path and celestial spectral-radiance composition source.
 * - **"composeSceneColor"** - Scene-color composition source.
 * - **"encodeOutput"** - Final output-encoding source.
 * - **"diagnosticOutput"** - Optional diagnostic-output source.
 */
type ShaderSourceSlot =
	| 'declareTypes'
	| 'declareConstants'
	| 'declareHelpers'
	| 'reconstructRay'
	| 'resolvePathBounds'
	| 'sampleAtmosphere'
	| 'sampleLightSource'
	| 'sampleScatteringCache'
	| 'sampleCelestialCache'
	| 'evaluateTransport'
	| 'evaluateCelestialRadiance'
	| 'composeSpectralRadiance'
	| 'composeSceneColor'
	| 'encodeOutput'
	| 'diagnosticOutput';

/**
 * Shader-contribution property required before optional fields are supplied.
 *
 * - **"id"** - The stable contribution identifier.
 * - **"owner"** - The capability owner of the contribution.
 */
type ShaderContributionConfigurationRequiredProperty = 'id' | 'owner';

/** Owner-supplied fields for one direct shader contribution. */
type ShaderContributionConfiguration = Pick<ShaderContribution, ShaderContributionConfigurationRequiredProperty> &
	Partial<ShaderContribution>;

/** Runtime shader-binding requirement. */
type ShaderBindingRequirement = {
	/** Stable binding identifier. */
	readonly id: string;

	/** Owner requesting the binding. */
	readonly owner: ShaderOwnerId;

	/** Binding kind. */
	readonly kind: ShaderBindingKind;

	/** Value that updates frequency. */
	readonly updateFrequency: ShaderUpdateFrequency;

	/** Runtime value key used by the binder. */
	readonly valueKey: string;

	/** Requirement for setup failure when the value is unavailable. */
	readonly required: boolean;
};

/** Shader-uniform declaration. */
type ShaderUniformDeclaration = {
	/** GLSL uniform name. */
	readonly name: string;

	/** GLSL uniform type. */
	readonly type: string;

	/** Runtime value key. */
	readonly valueKey: string;

	/** Optional owner-supplied default used before a live runtime value is available. */
	readonly defaultValue?: unknown;
};

/** Shader-texture sampler declaration. */
type ShaderTextureDeclaration = {
	/** GLSL texture-uniform name. */
	readonly name: string;

	/** GLSL sampler type. */
	readonly type: string;

	/** Runtime value key. */
	readonly valueKey: string;
};

/** Ordered GLSL source block. */
type ShaderSourceBlock = {
	/** Stable block identifier. */
	readonly id: string;

	/** Assembly slot. */
	readonly slot: ShaderSourceSlot;

	/** Slot-local ordering value. */
	readonly order: number;

	/** GLSL source code. */
	readonly code: string;
};

/** Owner-provided shader contribution. */
type ShaderContribution = {
	/** Stable contribution identifier. */
	readonly id: string;

	/** Contribution owner. */
	readonly owner: ShaderOwnerId;

	/** Shader symbols provided by this contribution. */
	readonly provides: readonly string[];

	/** Shader symbols required by this contribution. */
	readonly requires: readonly string[];

	/** Define lines emitted before uniforms and functions. */
	readonly defines: readonly string[];

	/** Uniform declarations. */
	readonly uniforms: readonly ShaderUniformDeclaration[];

	/** Texture declarations. */
	readonly textures: readonly ShaderTextureDeclaration[];

	/** GLSL function, type, and helper blocks. */
	readonly functions: readonly ShaderSourceBlock[];

	/** Ordered main-body hook blocks. */
	readonly mainHooks: readonly ShaderSourceBlock[];

	/** Runtime binding requirements. */
	readonly bindingRequirements: readonly ShaderBindingRequirement[];

	/** Optional owner diagnostics for tests and tooling. */
	readonly diagnostics?: unknown;
};

/** Context for an owner-provided shader-contribution method. */
type ShaderContributionRequest = {
	/** Aggregate execution model that owns profile and physical collaborators. */
	readonly model: SharedModel;
};
