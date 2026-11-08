/**
 * App-owned authenticated catalog service.
 */
type StellarCatalogService = import('../stellar-catalog.js').StellarCatalog;

/**
 * Engine-owned immutable stellar source definition.
 */
type StellarSource =
	import('../../../algorithm32/implementation/star-field/StellarPointSetSource.js').StellarPointSetSource;

/**
 * Existing Algorithm32 source-linear presentation capability.
 */
type StellarPresentation =
	import('../../../algorithm32/implementation/presentation-filter/ViewPresentationFilterRegistry.js').ViewPresentationFilterRegistry;

/**
 * Shared immutable source and human presentation prepared as one application lifetime.
 */
type StellarResources = Readonly<{
	source: StellarSource;
	presentationFilters: StellarPresentation;
}>;

/**
 * Untrusted stellar package payload descriptor, authenticated at the HTTP boundary.
 */
type StellarArtifact = {path: string; byteLength: number; sha256: string};
