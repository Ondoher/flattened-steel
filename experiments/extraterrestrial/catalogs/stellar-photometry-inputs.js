import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';

function octal(bytes) { return Number.parseInt(Buffer.from(bytes).toString('utf8').replace(/\0.*$/, '').trim(), 8) || 0; }
function tarEntries(tar) {
	const entries = [];
	for (let offset = 0; offset + 512 <= tar.length;) {
		const name = tar.subarray(offset, offset + 100).toString('utf8').replace(/\0.*$/, '');
		if (!name) break;
		const size = octal(tar.subarray(offset + 124, offset + 136));
		entries.push({ name, data: tar.subarray(offset + 512, offset + 512 + size) });
		offset += 512 + Math.ceil(size / 512) * 512;
	}
	return entries;
}

function templateMetadata(fileName) {
	const match = /^uk([obafgkm])(\d+(?:p\d+)?)(iii|ii|iv|v|i)\.dat\.gz$/i.exec(fileName);
	if (!match) return null;
	const text = match[2].replace('p', '.');
	const subtype = text.includes('.') ? Number(text) : (text.length === 2 && Number(text) < 10 ? Number(`${text[0]}.${text[1]}`) : Number(text));
	return { id: fileName.replace(/\.dat\.gz$/i, ''), spectralClass: match[1].toUpperCase(), subtype, luminosityClass: match[3].toUpperCase() };
}

function parseTemplate(fileName, compressed) {
	const metadata = templateMetadata(fileName);
	if (!metadata) return null;
	const samples = [];
	for (const line of gunzipSync(compressed).toString('utf8').split(/\r?\n/)) {
		if (line.trim().startsWith('#')) continue;
		const [angstrom, flux] = line.trim().split(/\s+/).map(Number);
		if (Number.isFinite(angstrom) && Number.isFinite(flux) && angstrom >= 3500 && angstrom <= 8500) samples.push([angstrom / 10, flux]);
	}
	if (samples.length < 2) throw new Error(`Pickles template ${fileName} does not cover the native visible range.`);
	return Object.freeze({ ...metadata, wavelengthNanometers: Float64Array.from(samples.map((sample) => sample[0])), normalizedFlux: Float64Array.from(samples.map((sample) => sample[1])) });
}

/** Load the checked-in Pickles V1998 archive into normalized visible-range templates. */
export async function loadPicklesV1998(path) {
	const entries = tarEntries(gunzipSync(await readFile(path)));
	const templates = entries.map((entry) => parseTemplate(entry.name, entry.data)).filter(Boolean);
	if (templates.length < 100) throw new Error(`Pickles archive yielded only ${templates.length} normal templates.`);
	return Object.freeze(templates);
}

/** Parse a checked-in SVO VOTable response, retaining its declared Vega zero point. */
export async function loadSvoJohnsonFilter(path) {
	const text = await readFile(path, 'utf8');
	const id = /<PARAM name="filterID" value="([^"]+)"/.exec(text)?.[1];
	const zeroPointJy = Number(/<PARAM name="ZeroPoint" value="([^"]+)"/.exec(text)?.[1]);
	const pivotAngstrom = Number(/<PARAM name="WavelengthRef" value="([^"]+)"/.exec(text)?.[1]);
	const pairs = [...text.matchAll(/<TR>\s*<TD>([^<]+)<\/TD>\s*<TD>([^<]+)<\/TD>\s*<\/TR>/g)].map((match) => [Number(match[1]), Number(match[2])]);
	if (!id || !Number.isFinite(zeroPointJy) || !Number.isFinite(pivotAngstrom) || pairs.length < 2) throw new Error(`Invalid SVO filter input: ${path}`);
	return Object.freeze({ id, zeroPointJy, pivotWavelengthNanometers: pivotAngstrom / 10, wavelengthNanometers: Float64Array.from(pairs.map((pair) => pair[0] / 10)), transmission: Float64Array.from(pairs.map((pair) => pair[1])) });
}
