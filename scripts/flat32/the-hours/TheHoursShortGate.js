import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import Files from '../../algorithm32/solar-zenith-cache/DistantSunSharedCacheGenerationFiles.js';

/** Read-only admission of four exact accepted short proofs before full-film work. */
export class TheHoursShortGate {
	/** Creates a gate without allocating output or admitting evidence.
	 * @param {TheHoursRunCapability} run - Repository identity and new output capability.
	 */
	constructor(run) {
		this._run = run;
		this._files = new Files(run.repositoryRoot);
	}

	/** Called by admission to validate a bounded exact task-owned JSON artifact.
	 * @param {TheHoursArtifactIdentity} identity - Complete pinned byte identity.
	 * @returns {Promise<unknown>} - Authenticated parsed JSON.
	 */
	async _json(identity) {
		if (!/^\.codex-tmp\/p3-strobing-20261007\//u.test(identity.path) || identity.byteLength > 32 * 1024 * 1024)
			throw new Error('Short gate input is outside this task or exceeds its bound.');
		const bytes = await readFile(await this._files.resolve(identity.path));
		if (
			bytes.length !== identity.byteLength ||
			createHash('sha256').update(bytes).digest('hex') !== identity.sha256
		)
			throw new Error('Short gate artifact identity mismatch.');
		return JSON.parse(bytes.toString('utf8'));
	}

	/** Call this method to admit four closed independently qualified short evidence chains.
	 * Native4K uses qualified80Mbps; matched720p diagnostics use qualified160Mbps.
	 * @param {TheHoursArtifactIdentity} identity - Exact gate selection artifact.
	 * @returns {Promise<TheHoursShortAdmission>} - Parents and selected film policy.
	 */
	async admit(identity) {
		const selection = /** @type {TheHoursShortSelection} */ (await this._json(identity));
		if (selection.schemaId !== 'algorithm32-the-hours-short-selection-v1' || selection.proofs.length !== 4)
			throw new Error('Full film requires four declared short proofs.');
		const names = new Set(),
			parents = [identity];
		for (const proof of selection.proofs) {
			if (!['daylight', 'sunrise', 'sunset', 'early-ground'].includes(proof.name) || names.has(proof.name))
				throw new Error('Short gate repeats or omits an operation.');
			names.add(proof.name);
			const manifest = /** @type {TheHoursArtifactManifest} */ (await this._json(proof.manifest));
			if (
				manifest.schemaId !== 'algorithm32-the-hours-proof-v1' ||
				manifest.disposition !== 'accepted' ||
				createHash('sha256').update(JSON.stringify(manifest.artifacts)).digest('hex') !==
					manifest.artifactSetSha256
			)
				throw new Error('Short qualification is not an accepted sealed run.');
			const resultIdentity = manifest.artifacts.find((artifact) => artifact.path === 'result.json');
			if (!resultIdentity) throw new Error('Short qualification result is missing.');
			const root = proof.manifest.path.slice(0, -'/artifact-manifest.json'.length),
				resultPin = {...resultIdentity, path: root + '/result.json'};
			const result = /** @type {TheHoursShortQualification} */ (await this._json(resultPin));
			const native = proof.name === 'early-ground';
			if (
				!result.pass ||
				!result.sourceTemporal.pass ||
				!result.originalSourceTemporal.pass ||
				!result.encodedTemporal.pass ||
				!result.workflowTemporal.pass ||
				result.frameCount !== (native ? 60 : 120) ||
				result.workflowBitrate !== (native ? 80000000 : 160000000) ||
				result.maximumNativeMeanDifference > 1e-10 ||
				result.replay.maximumNativeMeanDifference > 1e-10 ||
				result.replay.recording.heldOutputSlotCount !== 0
			)
				throw new Error('Short qualification does not pass declared source/cadence/media gates.');
			if (native && (!result.recurrence || Object.values(result.recurrence).some((value) => !value.pass)))
				throw new Error('Retained112/125 proof is incomplete.');
			if (
				(proof.name === 'sunrise' || proof.name === 'sunset') &&
				(!result.horizon ||
					Object.values(result.horizon).some(
						(value) => !value.pass || value.windows.length !== 1 || value.windows[0].name !== proof.name,
					))
			)
				throw new Error('Short horizon proof is incomplete.');
			parents.push(proof.manifest, resultPin);
		}
		const admission = {parents, filmBitrate: 80000000, diagnosticBitrate: 160000000};
		await this._run.writeJson('short-proof-admission.json', admission);
		return admission;
	}
}
