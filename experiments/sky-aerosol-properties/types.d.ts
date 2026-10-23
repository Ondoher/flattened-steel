/** Ambient contracts owned by this contained experiment. */
/** Quadrature nodes and weights on the unit interval. */
type AerosolRule = {/** Node coordinates. */ nodes:number[]; /** Integral weights. */ weights:number[]};
/** Geometry choice for the reused independent solver.
 * - **"spherical"** - Concentric spherical atmosphere.
 * - **"flat"** - Mathematical slab control only.
 */
type AerosolGeometry='spherical'|'flat';
/** Source geometry for physical equations.
 * - **"parallel"** - Collimated distant illumination.
 * - **"finite"** - Finite point-source normalization.
 */
type AerosolSource='parallel'|'finite';
/** Frozen scientific medium; all coefficient arrays use Native15 channel order. */
type AerosolMedium={
 /** Geometry. */ geometry:AerosolGeometry; /** Light-source geometry. */ sourceKind:AerosolSource;
 /** Ground radius, metres. */ radius:number; /** Shell thickness, metres. */ topAltitude:number;
 /** Finite source position, metres. */ sourcePosition:number[]; /** Unit direction to distant Sun. */ sourceDirection:number[];
 /** Finite-source normalization distance, metres. */ referenceDistance:number; /** Source multiplier. */ incidentScale:number;
 /** Molecular scale height, metres. */ rayleighHeight:number; /** Aerosol scale height, metres. */ mieHeight:number;
 /** Single-scattering albedo. */ albedo:number; /** Cornette–Shanks shape parameter. */ g:number;
 /** Molecular scattering coefficients, m^-1. */ rayleigh:number[]; /** Aerosol extinction coefficients, m^-1. */ mie:number[];
 /** Spectral irradiance density, W m^-2 nm^-1. */ sourceIrradiance:number[]; /** Observer altitude, metres. */ observerHeight:number;
};
/** One independent physical ray/channel. */
type AerosolGroup={/** Query id. */ id:string; /** Scientific inputs. */ medium:AerosolMedium; /** Position, metres. */ origin:number[]; /** Unit view vector. */ direction:number[]; /** Spectral channel index. */ channel:number; /** Ray length, metres. */ end:number};
/** First opaque-ground or top-shell boundary. */
type AerosolBoundary={/** Physical path length, metres. */ distance:number; /** Whether ground is hit. */ ground:boolean};
/** Species-separated first-order directional radiance. */
type AerosolDirect={/** Total radiance density. */ total:number; /** Before view attenuation. */ before:number; /** Molecular then aerosol radiance. */ species:number[]; /** Distance-bin radiance. */ bins:number[]; /** Distance bins before attenuation. */ beforeBins:number[]};
/** Angular image field, degrees; not a perspective camera projection. */
type AerosolView={/** Stable field id. */ id:string; /** Left azimuth. */ azimuthMinimum:number; /** Right azimuth. */ azimuthMaximum:number; /** Bottom elevation. */ elevationMinimum:number; /** Top elevation. */ elevationMaximum:number};
/** Standalone WebGL2 sky evaluation. */
type AerosolGpuInput={/** Complete numerical shader. */ shader:string; /** Pixel columns. */ width:number; /** Pixel rows. */ height:number; /** Unit spectral probe directions. */ directions:number[][]};
/** GPU case readback. */
type AerosolGpuCase={/** Applied coefficient multiplier. */ fraction:number; /** Bottom-up linear RGB(A) values. */ pixels:number[]; /** Native15 probe spectra. */ spectra:number[][]};
/** Actual GPU telemetry and results. */
type AerosolGpuResult={/** Hardware description. */ renderer:string; /** Measured execution time. */ milliseconds:number; /** Evaluated cases. */ cases:AerosolGpuCase[]};
/** Explicit property intervention relative to original atmosphere. */
type AerosolSetting={/** Stable id. */ id:string; /** Extinction fraction. */ amount:number; /** Single-scattering albedo. */ ssa:number; /** Cornette–Shanks shape. */ g:number};
/** Exact artifact identity used in derivation manifests. */
type AerosolArtifact={/** Repository-relative name. */ path:string; /** Bytes. */ byteLength:number; /** SHA-256. */ sha256:string};
/** Physical CIE color with unmodified signed linear RGB. */
type AerosolColor={/** Tristimulus values. */ xyz:number[]; /** Chromaticity. */ xy:number[]; /** Photopic luminance, cd m^-2. */ Y:number; /** Signed linear sRGB. */ rgb:number[]; /** Source-normalized red/blue ratio. */ sourceRelativeRB:number};
/** Measured selected ray. */
type AerosolRay={/** Stable query id. */ id:string; /** Direction vector. */ direction:number[]; /** Native15 radiance density. */ spectrum:number[]; /** Molecular contribution. */ molecular:number[]; /** Aerosol contribution. */ aerosol:number[]; /** Physical projection. */ color:AerosolColor; /** Relative quadrature refinement. */ refinement:number; /** Final quadrature count. */ nodes:number};
/** One setting at one independent geometric condition. */
type AerosolMeasurement={/** Intervention. */ setting:AerosolSetting; /** Condition id. */ condition:string; /** Exact medium. */ medium:AerosolMedium; /** Rays. */ rays:AerosolRay[]; /** Sparse near-Sun/background luminance ratio. */ glowContrast:number};
/** Uniform-controlled GPU request. */
type AerosolSessionInput=AerosolGpuInput & {
 /** Scalar physical parameters; original coefficient arrays stay unchanged. */ parameters:AerosolSetting & {/** Metres above ground. */ observerHeight:number; /** Unit source direction. */ sourceDirection:number[]};
 /** Angular output field. */ view:AerosolView;
};
/** One owned browser-page GPU session. */
type AerosolGpuSession={
 /** Actual device. */ gl:WebGL2RenderingContext; /** Reused numerical program. */ program:WebGLProgram;
 /** Float storage. */ texture:WebGLTexture; /** Readback target. */ frame:WebGLFramebuffer;
 /** Hardware description. */ renderer:string; /** Program source identity. */ shader:string;
 /** Target width. */ width:number; /** Target height. */ height:number;
};
