import {createHash} from 'node:crypto';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

import {Algorithm32} from '../../../src/algorithm32/implementation/algorithm32/Algorithm32.js';
import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER} from '../../../src/algorithm32/sampling-domains/index.js';
import {SPECTRAL_QUANTITIES, SPECTRAL_UNITS, SpectralPacket} from '../../../src/algorithm32/spectral-values/index.js';
import {loadKiderDataset} from '../../experiments/b1-directional-sky-radiance/benchmark.js';
import {
	compareSpectralTables,
	PRODUCTION_GPU_PARITY_LIMITS,
} from '../../experiments/b1-directional-sky-radiance/compare-production-backends.js';
import {
	createBrunetonProductionProfile,
	createViewDirection,
} from '../../experiments/b1-directional-sky-radiance/production-profile.js';
import B1Direct40CacheAssetVerifier from './B1Direct40CacheAssetVerifier.js';

const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const DIAGNOSTIC_OUTPUT_ROOT = path.join(REPOSITORY_ROOT, 'tmp', 'extraterrestrial');

function sha256(bytes) {
	return createHash('sha256').update(bytes).digest('hex');
}

function requireOutputDirectory(requestedPath) {
	const outputDirectory = path.resolve(requestedPath);
	if (!outputDirectory.startsWith(`${DIAGNOSTIC_OUTPUT_ROOT}${path.sep}`)) {
		throw new Error('Single-asset CPU diagnostics must remain below tmp/extraterrestrial.');
	}
	mkdirSync(outputDirectory, {recursive: false});
	return outputDirectory;
}

function selectCpuCondition(cpuTablePath, localTime) {
	const lines = readFileSync(cpuTablePath, 'utf8').trim().split(/\r?\n/u);
	const selected = [lines[0], ...lines.slice(1).filter((line) => line.split('\t', 3)[1] === localTime)];
	if (selected.length !== 82) throw new Error(`CPU reference does not contain exactly 81 ${localTime} rows.`);
	return `${selected.join('\n')}\n`;
}

class Direct40R32fCpuCache {
	constructor({verifiedAsset, spectralBasis}) {
		const payload = verifiedAsset.manifest.cumulativeScatteringDensity;
		const bytes = readFileSync(path.join(verifiedAsset.assetDirectory, payload.path));
		this._values = new Float32Array(
			bytes.buffer,
			bytes.byteOffset,
			bytes.byteLength / Float32Array.BYTES_PER_ELEMENT,
		);
		this._logicalToUnique = CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.logicalToUniqueDirectionIndices;
		this._uniqueDirectionCount = CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.uniqueDirectionCount;
		this._spectralBasis = spectralBasis;
		this.sampleProvenanceIdentity = `${verifiedAsset.manifest.assetIdentity}:r32f-cpu-diagnostic`;
	}

	sampleCumulativeScatteringDensity(request) {
		const positionStencil = request.geometry.resolveScatteringCachePositionStencil({
			position: request.context.position,
			atmosphereCoordinate: request.context.atmosphereCoordinate,
		});
		const directionStencil = request.geometry.resolveScatteringCacheDirectionStencil({
			position: request.context.position,
			physicalOutgoingDirection: request.context.physicalOutgoingDirection,
		});
		const values = new Float64Array(40);
		for (let positionTap = 0; positionTap < positionStencil.indices.length; positionTap += 1) {
			const positionIndex = positionStencil.indices[positionTap];
			for (let directionTap = 0; directionTap < directionStencil.indices.length; directionTap += 1) {
				const uniqueDirectionIndex = this._logicalToUnique[directionStencil.indices[directionTap]];
				const weight = positionStencil.weights[positionTap] * directionStencil.weights[directionTap];
				for (let channelIndex = 0; channelIndex < 40; channelIndex += 1) {
					const index =
						(channelIndex * 48 + positionIndex) * this._uniqueDirectionCount + uniqueDirectionIndex;
					values[channelIndex] += this._values[index] * weight;
				}
			}
		}
		return new SpectralPacket({
			quantity: SPECTRAL_QUANTITIES.SCATTERING_DENSITY,
			units: SPECTRAL_UNITS.SCATTERING_DENSITY,
			basis: this._spectralBasis,
			semantics: this._spectralBasis.semantics,
			values,
			provenanceIdentity: this.sampleProvenanceIdentity,
		});
	}

	dispose() {}
}

export async function compareSingleAssetCpuReference({
	assetDirectory,
	productionRevision,
	cpuTablePath,
	outputDirectory: requestedOutputDirectory,
	localTime = '09:30',
}) {
	const condition = loadKiderDataset().conditions.find((candidate) => candidate.time === localTime);
	if (!condition) throw new Error(`Unknown canonical B1 condition: ${localTime}.`);
	const diagnosticCondition = {
		id: `b1-${localTime}`,
		localTime,
		fittedAzimuthDegrees: condition.sun.fittedAzimuthDegrees,
	};
	const verifiedAsset = await B1Direct40CacheAssetVerifier.verifyAsset({
		assetDirectory: path.resolve(assetDirectory),
		condition: diagnosticCondition,
		productionRevision,
	});
	const profile = createBrunetonProductionProfile({
		time: localTime,
		fittedAzimuthDegrees: condition.sun.fittedAzimuthDegrees,
		maximumScatteringOrder: 4,
	});
	const cache = new Direct40R32fCpuCache({verifiedAsset, spectralBasis: profile.spectral.basis});
	const algorithm = new Algorithm32({profile});
	const lines = [
		['model', 'time', 'grid_x', 'grid_y', ...Array.from({length: 40}, (_, index) => `lambda_${index}`)].join('\t'),
	];
	try {
		for (let gridX = 0; gridX < 9; gridX += 1) {
			for (let gridY = 0; gridY < 9; gridY += 1) {
				const values = algorithm.evaluate({
					viewRay: {direction: createViewDirection(gridX, gridY)},
					scatteringCache: cache,
				}).pathRadiance.values;
				lines.push(
					['proposed', localTime, gridX, gridY, ...values.map((value) => value.toPrecision(17))].join('\t'),
				);
			}
		}
	} finally {
		algorithm.dispose();
		cache.dispose();
	}
	const outputDirectory = requireOutputDirectory(requestedOutputDirectory);
	const referenceText = selectCpuCondition(path.resolve(cpuTablePath), localTime);
	const assetText = `${lines.join('\n')}\n`;
	const referenceName = `cpu-reference-${localTime.replace(':', '')}.tsv`;
	const assetName = `asset-r32f-cpu-${localTime.replace(':', '')}.tsv`;
	const referencePath = path.join(outputDirectory, referenceName);
	const assetPath = path.join(outputDirectory, assetName);
	writeFileSync(referencePath, referenceText, {encoding: 'utf8', flag: 'wx'});
	writeFileSync(assetPath, assetText, {encoding: 'utf8', flag: 'wx'});
	const comparison = compareSpectralTables(referencePath, assetPath);
	const report = {
		schema: 'algorithm32-b1-single-asset-r32f-cpu-comparison-v1',
		condition: localTime,
		order: 4,
		gate: {
			accepted:
				comparison.rmse <= PRODUCTION_GPU_PARITY_LIMITS.rmse &&
				comparison.maximumAbsoluteDifference <= PRODUCTION_GPU_PARITY_LIMITS.maximumAbsoluteDifference,
			limits: PRODUCTION_GPU_PARITY_LIMITS,
		},
		comparison,
		derivation: {
			productionRevision,
			assetIdentity: verifiedAsset.manifest.assetIdentity,
			referenceTable: {name: referenceName, sha256: sha256(referenceText)},
			assetCpuTable: {name: assetName, sha256: sha256(assetText)},
		},
	};
	writeFileSync(path.join(outputDirectory, 'comparison-report.json'), `${JSON.stringify(report, null, 2)}\n`, {
		encoding: 'utf8',
		flag: 'wx',
	});
	return report;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
	const [assetDirectory, productionRevision, cpuTablePath, outputDirectory, localTime = '09:30'] =
		process.argv.slice(2);
	if (!assetDirectory || !productionRevision || !cpuTablePath || !outputDirectory) {
		throw new Error(
			'Usage: node compare-single-asset-cpu-reference.js <asset-directory> <production-revision> <cpu-table> <fresh-output-directory> [local-time]',
		);
	}
	const report = await compareSingleAssetCpuReference({
		assetDirectory,
		productionRevision,
		cpuTablePath,
		outputDirectory,
		localTime,
	});
	process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}
