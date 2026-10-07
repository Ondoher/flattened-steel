import {copyFile, constants} from 'node:fs/promises';
import path from 'node:path';
import {TheHoursRun} from './TheHoursRun.js';
import {TheHoursRetainedInputs} from './TheHoursRetainedInputs.js';
import {TheHoursMedia} from './TheHoursMedia.js';
import {THE_HOURS_SHORT_CONTROLS} from './consts.js';

/** Derived review media and synchronized index, preserving every parent recording. */
export class TheHoursDeliverables {
	/** Creates a delivery owner for one newly allocated run.
	 * @param {TheHoursRun} run - Active task-contained output capability.
	 */
	constructor(run) {
		this._run = run;
		this._media = new TheHoursMedia(run);
		this._archive = new TheHoursRun({
			outputRoot: '.codex-tmp/p3-strobing-20261007/runs',
			evidenceRoot: 'D:/flattened-steel',
		});
	}

	/** Called by delivery to admit a closed exact task-local parent.
	 * @param {TheHoursArtifactIdentity} manifest - Complete closed parent manifest identity.
	 * @returns {Promise<TheHoursRetainedInputs>} - Authenticated read-only parent capability.
	 */
	async _reader(manifest) {
		const reader = new TheHoursRetainedInputs({
			run: this._run,
			parentRoot: manifest.path.slice(0, -'/artifact-manifest.json'.length),
			manifest: {...manifest, path: 'artifact-manifest.json'},
		});
		await reader.load();
		return reader;
	}

	/** Called by delivery to retain an exact unannotated recording and make a side-by-side derivative.
	 * @param {string} name - Registered film/short operation.
	 * @param {string} candidate - Checked candidate recording.
	 * @param {TheHoursArtifactIdentity} original - Exact read-only archive recording.
	 * @returns {Promise<void>} - Original copied unchanged and synchronized derivative recorded.
	 */
	async _compare(name, candidate, original) {
		await this._archive.authenticate(original);
		const source = await this._archive.parentPath(original.path),
			directory = await this._run.directory('deliverables');
		await copyFile(source, path.join(directory, `poc-${name}.mp4`), constants.COPYFILE_EXCL);
		await this._media.execute(`comparison-${name}`, [
			'-n',
			'-i',
			source,
			'-i',
			candidate,
			'-filter_complex',
			'[0:v]scale=1024:576:flags=lanczos,setpts=PTS-STARTPTS[left];[1:v]scale=1024:576:flags=lanczos,setpts=PTS-STARTPTS[right];[left][right]hstack=inputs=2[comparison]',
			'-map',
			'[comparison]',
			'-an',
			'-c:v',
			'libx264',
			'-preset',
			'medium',
			'-crf',
			'18',
			'-pix_fmt',
			'yuv420p',
			'-r',
			'30',
			'-movflags',
			'+faststart',
			path.join(directory, `comparison-${name}.mp4`),
		]);
	}

	/** Call this method to assemble exact recordings, synchronized comparisons and one review index.
	 * Rejected automated film outcomes remain deliverable and visibly rejected.
	 * @param {TheHoursArtifactIdentity} qualificationManifest - Exact closed full-film qualification manifest.
	 * @returns {Promise<TheHoursDeliveryResult>} - Automated disposition and inspectable linked media.
	 */
	async create(qualificationManifest) {
		const qualified = await this._reader(qualificationManifest),
			result = /** @type {TheHoursFilmQualificationSummary} */ (await qualified.json('result.json'));
		const qualificationParents = /** @type {TheHoursArtifactIdentity[]} */ (await qualified.json('parents.json'));
		const filmPin = qualificationParents.find(
			(parent) => parent.path === `${result.parentRoot}/artifact-manifest.json`,
		);
		if (!filmPin) throw new Error('Full-film qualification omits its exact parent manifest.');
		const film = await this._reader(filmPin),
			native = await film.path('recording/original-workflow.mp4');
		const original = {
			path: 'archive/experiments/distant-sun-recording-strobing/runs/00050-fixed-film/captures/creative-full-day.mp4',
			byteLength: 217683322,
			sha256: 'd9515ca56c8b6c870cf5a12f1f838bd2bce5cbca3c50e6e6e13da8eaa898742d',
		};
		await this._compare('film', native, original);
		const admission = /** @type {TheHoursShortAdmission} */ (await film.json('short-proof-admission.json'));
		const controls = {
			sunset: {byteLength: 4786479, sha256: 'f938642d5ab1a4df325c4ede0160dc5f0fce38879e4764a5beb9d1f509599730'},
			sunrise: {byteLength: 5542984, sha256: 'a0cdc4baf7967248508d3c45c92289c0d82f923b71065f7f45c00b92255a8cde'},
			daylight: {byteLength: 4448589, sha256: '87d86868bf4cf6b79696c256dd2284d6bd3fa23508b183843f1e3c19f1573c62'},
		};
		const links = [
			{
				label: 'Native4K production candidate',
				href: `../${result.parentRoot.split('/').at(-1)}/recording/original-workflow.mp4`,
			},
			{
				label: '1024×576 review copy',
				href: `../${qualificationManifest.path.split('/').at(-2)}/deliverables/the-hours-1024x576.mp4`,
			},
			{
				label: 'The Hours synchronized comparison: selected POC left, production right',
				href: 'deliverables/comparison-film.mp4',
			},
		];
		const parents = [qualificationManifest, filmPin, original];
		for (const pin of admission.parents.filter((parent) => parent.path.endsWith('/artifact-manifest.json'))) {
			const short = await this._reader(pin),
				shortResult = /** @type {TheHoursShortQualification} */ (await short.json('result.json'));
			const name = shortResult.parentRoot.includes('early-ground')
				? 'early-ground'
				: shortResult.parentRoot.includes('sunrise')
					? 'sunrise'
					: shortResult.parentRoot.includes('sunset')
						? 'sunset'
						: 'daylight';
			const candidate = await short.path('recording/original-workflow.mp4');
			links.push({
				label: `${name} qualified unannotated diagnostic`,
				href: `../${pin.path.split('/').at(-2)}/recording/original-workflow.mp4`,
			});
			if (name !== 'early-ground') {
				const control = {
					...controls[name],
					path: THE_HOURS_SHORT_CONTROLS[name].path.replace(
						'/configuration.json',
						'/captures/creative-full-day.mp4',
					),
				};
				await this._compare(name, candidate, control);
				parents.push(control);
				links.push({
					label: `${name} synchronized comparison: selected POC left, production right`,
					href: `deliverables/comparison-${name}.mp4`,
				});
			}
			parents.push(pin);
		}
		await this._run.writeJson('artifact-index.json', {
			schemaId: 'algorithm32-the-hours-delivery-v1',
			automatedPass: result.pass,
			ownerInspection: 'pending',
			parents,
			links,
			derivation:
				'Authenticated originals copied bit for bit; each comparison decodes both inputs, synchronizes presentation time to zero, scales each to1024x576 and horizontally joins at30FPS, encoded x264CRF18. Native recordings and source proofs remain unchanged.',
		});
		await this._run.write(
			'index.html',
			`<!doctype html><html lang="en"><meta charset="utf-8"><title>P3 The Hours review</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{max-width:1100px;margin:2rem auto;padding:0 1rem;font:18px system-ui;background:#161616;color:#eee}a{color:#afd9ff}video{width:100%;background:#000}section{margin:3rem 0}</style><h1>P3 The Hours review</h1><p>Automated full-film gates: <strong>${result.pass ? 'passed' : 'rejected'}</strong>. Native-resolution owner inspection and mapped source-review acceptance remain pending.</p><p>Comparisons share the original astronomical clock, seed, geometry and camera score. Left: selected4m POC. Right: anchored Native48 production P2 with full-float scene color. Source traces and rejected diagnostics remain preserved. Review the native file at100% scale, including early ground112/125, both horizons and camera transitions.</p>${links.map((link) => `<section><h2>${link.label}</h2><p><a href="${link.href}">Open unannotated recording</a></p><video controls preload="metadata" src="${link.href}"></video></section>`).join('')}<p><a href="artifact-index.json">Authenticated artifact and derivation index</a></p></html>`,
		);
		return {automatedPass: result.pass, ownerInspection: 'pending', links};
	}
}
