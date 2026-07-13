/**
 * Built-in uniform-Lambertian ground material.
 *
 * - **"grass"** - Retained Bruneton grass albedo averaged onto Native-15.
 */
type UniformLambertianGroundMaterial = 'grass';

/** Shared optional identity for one spatially uniform Lambertian boundary. */
type UniformLambertianGroundBoundaryIdentity = Readonly<{
	/** Value that identifies this explicitly configured boundary. */
	readonly id?: string;
}>;

/** Type that configures one spatially uniform Lambertian ground boundary. */
type UniformLambertianGroundBoundaryOptions = UniformLambertianGroundBoundaryIdentity &
	(
		| Readonly<{
				/** Built-in physical ground material selected by the caller. */
				readonly material: UniformLambertianGroundMaterial;
				/** Exact albedo is mutually exclusive with a built-in material. */
				readonly albedo?: never;
		  }>
		| Readonly<{
				/** Exact aligned spectral albedo selected by the caller. */
				readonly albedo: SpectralReflectancePacket;
				/** Built-in material is mutually exclusive with exact albedo. */
				readonly material?: never;
		  }>
	);
