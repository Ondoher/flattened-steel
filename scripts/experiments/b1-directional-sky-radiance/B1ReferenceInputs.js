import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {gunzipSync} from 'node:zlib';

/** Authenticated original measurement bytes stored beside the acquired Kider archives. */
export default class B1ReferenceInputs {
	static root = fileURLToPath(
		new URL(
			'../../../references/downloads/kider-clear-sky-framework-2014/radiance-2013-05-27-bruneton-subset/',
			import.meta.url,
		),
	);
	static bundlePath = fileURLToPath(
		new URL(
			'../../../references/downloads/kider-clear-sky-framework-2014/radiance-2013-05-27-bruneton-subset/kider-spectra.json.gz',
			import.meta.url,
		),
	);
	static _files = null;

	/** Return the verified original-byte container identity for durable derivation records. */
	static identity() {
		this.files();
		return Object.freeze(JSON.parse(readFileSync(new URL('./inputs/manifest.json', import.meta.url), 'utf8')));
	}

	static files() {
		if (this._files) return this._files;
		const manifest = JSON.parse(readFileSync(new URL('./inputs/manifest.json', import.meta.url), 'utf8'));
		const bytes = readFileSync(this.bundlePath);
		if (
			bytes.length !== manifest.byteLength ||
			createHash('sha256').update(bytes).digest('hex') !== manifest.sha256
		)
			throw new Error('Bundled B1 reference input identity failed.');
		const files = JSON.parse(gunzipSync(bytes, {maxOutputLength: 128 * 1024 * 1024}).toString('utf8'));
		if (Object.keys(files).length !== 1377 || manifest.fileCount !== 1377)
			throw new Error('Bundled B1 measurement coverage is incomplete.');
		this._files = Object.freeze(files);
		return this._files;
	}
}
