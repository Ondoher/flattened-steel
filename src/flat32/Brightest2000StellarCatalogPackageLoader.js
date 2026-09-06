import {createBrightest2000StellarCatalogDefinition} from '../algorithm32/implementation/star-field/Brightest2000StellarCatalogPackage.js';

function bytesToHex(bytes) {
	return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
}

async function sha256(bytes) {
	return bytesToHex(new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', bytes)));
}

async function loadArtifact(fetchImplementation, baseUrl, artifact, kind) {
	const response = await fetchImplementation(new URL(artifact.path, baseUrl));
	if (!response.ok) throw new Error(`Brightest-2,000 ${kind} request failed with ${response.status}.`);
	const bytes = await response.arrayBuffer();
	if (bytes.byteLength !== artifact.byteLength || (await sha256(bytes)) !== artifact.sha256) {
		throw new Error(`Brightest-2,000 ${kind} bytes do not match the manifest.`);
	}
	return bytes;
}

/** Load and authenticate the local-only production brightest-2,000 package. */
export async function loadBrightest2000StellarCatalogPackage(
	manifestUrl = 'stellar-catalogs/brightest-2000-stellar-package-v1/manifest.json',
	fetchImplementation = globalThis.fetch,
) {
	if (typeof fetchImplementation !== 'function') throw new TypeError('Brightest-2,000 loading requires fetch.');
	const absoluteManifestUrl = new URL(manifestUrl, globalThis.location?.href ?? 'http://localhost/');
	const response = await fetchImplementation(absoluteManifestUrl);
	if (!response.ok) throw new Error(`Brightest-2,000 manifest request failed with ${response.status}.`);
	const manifest = await response.json();
	const [rosterBytes, packetsBytes, memberBytes, spectraBytes] = await Promise.all([
		loadArtifact(fetchImplementation, absoluteManifestUrl, manifest.artifacts?.roster, 'roster'),
		loadArtifact(fetchImplementation, absoluteManifestUrl, manifest.artifacts?.packets, 'packets'),
		loadArtifact(fetchImplementation, absoluteManifestUrl, manifest.artifacts?.members, 'member texture'),
		loadArtifact(fetchImplementation, absoluteManifestUrl, manifest.artifacts?.spectra, 'spectra texture'),
	]);
	const decoder = new TextDecoder();
	return createBrightest2000StellarCatalogDefinition({
		manifest,
		roster: JSON.parse(decoder.decode(rosterBytes)),
		packets: JSON.parse(decoder.decode(packetsBytes)),
		memberTexels: new Float32Array(memberBytes),
		spectraTexels: new Float32Array(spectraBytes),
	});
}
