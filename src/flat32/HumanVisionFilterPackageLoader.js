const EXPECTED_SCHEMA = 'algorithm32-production-human-vision-filter-package-v1';
const EXPECTED_SOURCE_SHA256 = '6a75d3fdbcbf5e9e9a07478511933eefeda953f3e2cc14b74459e5a099ec3759';
const EXPECTED_ARTIFACT_SHA256 = '85e1d15c93e849550dbe84fdf1df000565eda0f57ac6e10210b5ee200bc91a09';

function bytesToHex(bytes) {
	return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
}

async function sha256(bytes) {
	return bytesToHex(new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', bytes)));
}

/** Load the authenticated local-only CIE-derived Native15 scotopic weights. */
export async function loadHumanVisionFilterPackage(
	manifestUrl = 'presentation-filters/human-vision-filter-package-v1/manifest.json',
	fetchImplementation = globalThis.fetch,
) {
	if (typeof fetchImplementation !== 'function') throw new TypeError('Human-vision loading requires fetch.');
	const absoluteManifestUrl = new URL(manifestUrl, globalThis.location?.href ?? 'http://localhost/');
	const manifestResponse = await fetchImplementation(absoluteManifestUrl);
	if (!manifestResponse.ok) throw new Error(`Human-vision manifest request failed with ${manifestResponse.status}.`);
	const manifest = await manifestResponse.json();
	if (
		manifest.schemaId !== EXPECTED_SCHEMA ||
		manifest.packageId !== 'human-vision-filter-package-v1' ||
		manifest.parents?.sourceSha256 !== EXPECTED_SOURCE_SHA256 ||
		manifest.artifact?.sha256 !== EXPECTED_ARTIFACT_SHA256
	) throw new Error('Human-vision manifest identity is incompatible.');
	const artifactResponse = await fetchImplementation(new URL(manifest.artifact.path, absoluteManifestUrl));
	if (!artifactResponse.ok) throw new Error(`Human-vision artifact request failed with ${artifactResponse.status}.`);
	const bytes = await artifactResponse.arrayBuffer();
	if (bytes.byteLength !== manifest.artifact.byteLength || await sha256(bytes) !== EXPECTED_ARTIFACT_SHA256) {
		throw new Error('Human-vision artifact bytes do not match the accepted package.');
	}
	const values = JSON.parse(new TextDecoder().decode(bytes)).values;
	if (!Array.isArray(values) || values.length !== 15 || !values.every((value) => Number.isFinite(value) && value >= 0)) {
		throw new Error('Human-vision package must contain 15 finite nonnegative weights.');
	}
	return Object.freeze({
		identity: `sha256:${EXPECTED_ARTIFACT_SHA256}`,
		scotopicLuminanceWeights: Object.freeze([...values]),
	});
}
