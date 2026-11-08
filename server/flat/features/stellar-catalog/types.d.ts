/**
 * Exact package bytes and format, independent of HTTP.
 */
type FlatStellarAsset = {bytes: Buffer; mediaType: string};

/**
 * Operational package kinds consumed by stellar composition.
 */
type FlatStellarPackageKind = 'stars' | 'human-vision';

/**
 * Registered filesystem owner for Flat's stellar package.
 */
type FlatStellarCatalog = import('./catalog.js').StellarCatalog;
