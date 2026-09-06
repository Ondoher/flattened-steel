import {createHash} from 'node:crypto';
import {lstat, mkdir, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';

import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER} from '../../../src/algorithm32/sampling-domains/index.js';
import {CanonicalValueHash} from '../../../src/algorithm32/value-identity/CanonicalValueHash.js';
import {CAPTURE_TIMES} from '../../experiments/b1-directional-sky-radiance/benchmark-domain.js';
import {createBrunetonProductionProfile} from '../../experiments/b1-directional-sky-radiance/production-profile.js';
import DistantSunSceneCacheOfflineCompiler from '../solar-zenith-cache/DistantSunSceneCacheOfflineCompiler.js';
import B1Direct40CacheAssetManifest, {
	B1_DIRECT40_CACHE_LAYOUT,
	B1_DIRECT40_CACHE_PAYLOAD_CODEC,
	B1_DIRECT40_DIRECTION_INDEX_CODEC,
} from './B1Direct40CacheAssetManifest.js';
import B1Direct40CacheAssetSetManifest, {B1_DIRECT40_PROFILE_FAMILY} from './B1Direct40CacheAssetSetManifest.js';
import B1Direct40CacheAssetVerifier from './B1Direct40CacheAssetVerifier.js';
import {
	DistantSunProfileCompilerInputs,
	DISTANT_SUN_PROFILE_COMPILER_IDENTITY,
} from './DistantSunProfileCompilerInputs.js';

export const B1_DIRECT40_OFFLINE_ASSET_ADAPTER_IDENTITY = 'algorithm32-production-b1-direct40-offline-asset-adapter-v8';
export const B1_DIRECT40_OFFLINE_ASSET_ADAPTER_LEGACY_IDENTITIES = Object.freeze([
	'algorithm32-production-b1-direct40-offline-asset-adapter-v1',
	'algorithm32-production-b1-direct40-offline-asset-adapter-v2',
	'algorithm32-production-b1-direct40-offline-asset-adapter-v3',
	'algorithm32-production-b1-direct40-offline-asset-adapter-v4',
	'algorithm32-production-b1-direct40-offline-asset-adapter-v5',
	'algorithm32-production-b1-direct40-offline-asset-adapter-v6',
	'algorithm32-production-b1-direct40-offline-asset-adapter-v7',
]);

const BROWSER_MODULE =
	'/repository/scripts/algorithm32/production-b-experiments/runB1Direct40OfflineCompilerBrowser.js';
const LOGICAL_LAYER_BYTE_LENGTH = 48 * 4374 * Float32Array.BYTES_PER_ELEMENT;

function sha256(bytes) {
	return createHash('sha256').update(bytes).digest('hex');
}

function jsonControl(value) {
	return JSON.parse(JSON.stringify(value, (_key, item) => (ArrayBuffer.isView(item) ? Array.from(item) : item)));
}

/** Production-owned adapter that emits immutable direct-40 cache assets for the B1 condition family. */
export default class B1Direct40OfflineAssetAdapter extends DistantSunSceneCacheOfflineCompiler {
	async _requireContainedTarget(target) {
		const resolved = path.resolve(target);
		const allowedRoot = path.resolve(
			this._repositoryRoot,
			'tmp',
			'extraterrestrial',
			'production-color-reset',
			'p8',
		);
		if (!resolved.startsWith(`${allowedRoot}${path.sep}`)) {
			throw new Error('B1 direct-40 output must remain below the production Color Reset P8 output root.');
		}
		const parent = path.dirname(resolved);
		if ((await realpath(parent)) !== parent) {
			throw new Error('B1 direct-40 output parent may not traverse a link.');
		}
		return resolved;
	}

	async _createSetDirectory(target) {
		const outputDirectory = await this._requireContainedTarget(target);
		await lstat(outputDirectory)
			.then(() => {
				throw new Error('B1 direct-40 asset-set directory must not already exist.');
			})
			.catch((error) => {
				if (error.code !== 'ENOENT') throw error;
			});
		await mkdir(outputDirectory, {recursive: false});
		if ((await realpath(outputDirectory)) !== outputDirectory) {
			throw new Error('B1 direct-40 asset-set directory must resolve exactly.');
		}
		return outputDirectory;
	}

	_createProfile(condition) {
		if (
			!condition ||
			condition.id !== `b1-${condition.localTime}` ||
			!CAPTURE_TIMES.includes(condition.localTime) ||
			!Number.isFinite(condition.fittedAzimuthDegrees)
		) {
			throw new RangeError('B1 direct-40 compilation requires one canonical fitted condition.');
		}
		return createBrunetonProductionProfile({
			time: condition.localTime,
			fittedAzimuthDegrees: condition.fittedAzimuthDegrees,
			maximumScatteringOrder: 4,
		});
	}

	async compileCondition({outputDirectory: requestedOutput, condition, productionRevision}) {
		if (typeof productionRevision !== 'string' || productionRevision.length === 0) {
			throw new TypeError('B1 direct-40 compilation requires an explicit production revision.');
		}
		const outputDirectory = await this._requireContainedTarget(requestedOutput);
		const profile = this._createProfile(condition);
		const inputSet = DistantSunProfileCompilerInputs.createInputSet(profile);
		const control = jsonControl({
			condition,
			compilerIdentity: inputSet.compilerIdentity,
			profileIdentity: inputSet.profileIdentity,
			numericalIdentity: inputSet.numericalIdentity,
			buildRequest: inputSet.buildRequest,
		});
		const execution = await this.compileLayers({
			outputDirectory,
			control,
			browserModulePath: BROWSER_MODULE,
			layerCount: 40,
		});
		if (execution.layers.some((layer) => layer.byteLength !== LOGICAL_LAYER_BYTE_LENGTH)) {
			throw new Error('B1 direct-40 compiler emitted an incompatible logical layer shape.');
		}
		const browser = execution.browserExecution.result;
		if (
			browser.schemaId !== 'algorithm32-b1-direct40-offline-browser-result-v1' ||
			browser.compilerIdentity !== inputSet.compilerIdentity ||
			browser.profileIdentity?.contentHash !== profile.contentHash ||
			browser.numericalIdentity !== inputSet.numericalIdentity ||
			browser.retainedBlockCount !== 48 ||
			browser.wavelengths?.length !== 40
		) {
			throw new Error('B1 direct-40 browser result is incompatible with the requested profile.');
		}

		const logicalOracle = Buffer.concat(execution.layers);
		const seamEncoding = this._encodeExactSeams(logicalOracle, 48, 40);
		const cumulativeScatteringDensity = await this._writePayload(
			outputDirectory,
			'cumulative-j4-direct40-native48-w27',
			'f32',
			seamEncoding.payload,
			B1_DIRECT40_CACHE_PAYLOAD_CODEC,
		);
		const logicalToUniqueIndex = await this._writePayload(
			outputDirectory,
			'w27-logical-to-unique',
			'u16',
			seamEncoding.logicalToUniqueIndex,
			B1_DIRECT40_DIRECTION_INDEX_CODEC,
		);
		const compilerEvidence = {
			schemaId: 'algorithm32-b1-direct40-compiler-evidence-v1',
			adapterIdentity: B1_DIRECT40_OFFLINE_ASSET_ADAPTER_IDENTITY,
			recurrenceCompilerIdentity: DISTANT_SUN_PROFILE_COMPILER_IDENTITY,
			productionRevision,
			condition,
			profileIdentity: inputSet.profileIdentity,
			numericalIdentity: inputSet.numericalIdentity,
			buildRequestContentHash: CanonicalValueHash.sha256Value(inputSet.buildRequest),
			logicalLayerSha256: execution.layers.map((layer) => sha256(layer)),
			browser,
			browserStderr: execution.browserExecution.stderr,
			progress: execution.progress,
			tool: {node: process.version, platform: process.platform, architecture: process.arch},
		};
		const evidenceBytes = this._jsonBytes(compilerEvidence);
		const evidenceSha256 = sha256(evidenceBytes);
		const evidencePath = `compiler-evidence-${evidenceSha256}.json`;
		await writeFile(path.join(outputDirectory, evidencePath), evidenceBytes, {flag: 'wx'});

		const record = B1Direct40CacheAssetManifest.createRecord({
			profile: inputSet.profileIdentity,
			condition: {
				id: condition.id,
				localTime: condition.localTime,
				instant: profile.models.sourcePlacement.observation.instant,
				directionToSource: profile.models.sourcePlacement.placement.directionToLight,
				sourceIdentity: profile.models.lightSource.id,
			},
			physical: {
				spectralBasisId: profile.spectral.basis.id,
				spectralBasisContentHash: profile.spectral.basis.contentHash,
				sourceIrradianceContentHash: profile.spectral.sourceIrradianceDensity.contentHash,
				atmosphereId: profile.models.atmosphere.id,
				geometryId: profile.models.geometry.id,
				groundId: profile.models.groundBoundary.id,
				groundAlbedoContentHash: profile.models.groundBoundary.albedo.contentHash,
			},
			domains: {
				position: {id: profile.domains.positions.id, count: 48},
				incoming: {id: profile.domains.incomingDirections.id, count: 68},
				outgoing: {
					id: profile.domains.outgoingDirections.id,
					faceWidth: 27,
					logicalCount: 4374,
					uniqueCount: CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.uniqueDirectionCount,
				},
				spectrum: {
					id: profile.spectral.basis.id,
					contentHash: profile.spectral.basis.contentHash,
					channelCount: 40,
				},
			},
			numerical: {
				viewPathIntervalCount: 40,
				sourcePathTransmittanceIntervalCount: 20,
				cacheTransportIntervalCount: 40,
				maximumScatteringOrder: 4,
			},
			layout: {axisOrder: B1_DIRECT40_CACHE_LAYOUT, scalarType: 'float32-little-endian'},
			cumulativeScatteringDensity,
			logicalToUniqueIndex,
			derivation: {
				compilerIdentity: B1_DIRECT40_OFFLINE_ASSET_ADAPTER_IDENTITY,
				productionRevision,
				operation: 'GPU actual-point cumulative J4 on direct-40/Native48/F68/W27; exact W27 seam deduplication',
				inputs: {
					profileContentHash: profile.contentHash,
					numericalIdentity: inputSet.numericalIdentity,
					buildRequestContentHash: compilerEvidence.buildRequestContentHash,
					compilerEvidence: {
						path: evidencePath,
						byteLength: evidenceBytes.byteLength,
						sha256: evidenceSha256,
					},
				},
			},
		});
		const manifestBytes = this._jsonBytes(record);
		const manifestSha256 = sha256(manifestBytes);
		const manifestPath = `asset-manifest-${manifestSha256}.json`;
		await writeFile(path.join(outputDirectory, manifestPath), manifestBytes, {flag: 'wx'});
		return {outputDirectory, manifestPath, manifestSha256, manifest: record, profile};
	}

	async compileSet({outputDirectory: requestedOutput, conditions, productionRevision}) {
		if (
			!Array.isArray(conditions) ||
			conditions.length !== CAPTURE_TIMES.length ||
			!conditions.every((condition, index) => condition.localTime === CAPTURE_TIMES[index])
		) {
			throw new RangeError('B1 direct-40 asset construction requires the ordered 17-condition set.');
		}
		const outputDirectory = await this._createSetDirectory(requestedOutput);
		const assets = [];
		for (const condition of conditions) {
			const directoryName = `condition-${condition.localTime.replace(':', '')}`;
			const result = await this.compileCondition({
				outputDirectory: path.join(outputDirectory, directoryName),
				condition,
				productionRevision,
			});
			assets.push({
				condition,
				manifestPath: `${directoryName}/${result.manifestPath}`,
				manifestSha256: result.manifestSha256,
				assetIdentity: result.manifest.assetIdentity,
				profile: {id: result.profile.id, contentHash: result.profile.contentHash},
			});
		}
		const setRecord = B1Direct40CacheAssetSetManifest.createRecord({
			profileFamily: B1_DIRECT40_PROFILE_FAMILY,
			productionRevision,
			assets,
		});
		const manifestBytes = this._jsonBytes(setRecord);
		const manifestSha256 = sha256(manifestBytes);
		const manifestPath = `asset-set-manifest-${manifestSha256}.json`;
		await writeFile(path.join(outputDirectory, manifestPath), manifestBytes, {flag: 'wx'});
		const verification = await B1Direct40CacheAssetVerifier.verifySet({
			setDirectory: outputDirectory,
			productionRevision,
		});
		return {outputDirectory, manifestPath, manifestSha256, manifest: setRecord, verification};
	}
}
