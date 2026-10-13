import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {performance} from 'node:perf_hooks';
import os from 'node:os';
import {LocalSunAssemblyProof} from '../assembly/LocalSunAssemblyProof.js';
import {LocalSunAssemblyControls} from '../assembly/LocalSunAssemblyControls.js';
import {LocalSunCompactConstructionProfile} from '../../../../src/algorithm32/implementation/local-sun/cache/LocalSunCompactConstructionProfile.js';
import LocalSunConstructionDomainSelection from '../../../../src/algorithm32/implementation/local-sun/cache/LocalSunConstructionDomainSelection.js';
import {LocalSunCompactCpuAssembly} from '../../../../src/algorithm32/implementation/local-sun/cache/LocalSunCompactCpuAssembly.js';
import DistanceMath from '../../../../src/algorithm32/math/DistanceMath.js';
import {CanonicalAtmosphere} from '../../../../src/algorithm32/implementation/canonical-atmosphere/CanonicalAtmosphere.js';

/** Focused complete compact construction-profile proof; no full spectral field, recurrence or runtime execution. */
export class LocalSunCompactProfileProof {
	/** Authenticated independent authority/path tooling. @type {LocalSunAssemblyControls} */
	_controls = new LocalSunAssemblyControls();

	/** Called by proof checks to enforce a predeclared numerical comparison.
	 *
	 * @param {number} actual - Candidate result.
	 * @param {number} expected - Frozen independent value.
	 * @param {number} absolute - Predeclared absolute allowance.
	 * @param {number} [relative] - Predeclared relative allowance.
	 * @returns {number} - Absolute residual.
	 * @throws {Error} - The candidate is nonfinite or exceeds its fixed gate.
	 */
	_near(actual, expected, absolute, relative = 0) {
		let residual = Math.abs(actual - expected);
		if (!Number.isFinite(actual) || residual > absolute + relative * Math.abs(expected))
			throw new Error('Compact profile comparison failed: ' + actual + ' versus ' + expected);
		return residual;
	}

	/** Call this method to prove real compact selection, physical positions, independent primary samples and allocation estimates.
	 *
	 * @returns {LocalSunCompactProfileProofReport} - Passed configuration/reference checks and observed small-job cost.
	 * @throws {Error} - Authority, support, accounting, resource or independent comparison fails.
	 */
	verify() {
		let started = performance.now();
		let freeBefore = os.freemem();
		if (freeBefore < 4 * 1024 ** 3) throw new Error('Four GiB free-memory reserve required.');
		let base = new LocalSunAssemblyProof();
		let authority = base.readAuthority();
		let p0Path = 'src/algorithm32/implementation/local-sun/cache/fixtures/local-sun-compact-p0-controls.json';
		if (this._controls.paths.hash(p0Path) !== '74a7cb03fd646d6ec4754e45e46f7ed622c815d09cd82ceeef174819c3513db6')
			throw new Error('Frozen P0 control identity differs.');
		let p0 = /** @type {LocalSunP0Fixture} */ (
			JSON.parse(readFileSync(this._controls.paths.checkedPath(p0Path), 'utf8'))
		);
		let setup = base.createPhysicalDefinition();
		let definition = {
			geometry: setup.geometry,
			atmosphere: setup.atmosphere,
			lightSource: setup.lightSource,
			groundBoundary: null,
			topologyControls: {
				coverageRadius: DistanceMath.inMeters(p0.controls.geometry.coverageRadius.value),
				altitudes: p0.controls.rows.map((row) => DistanceMath.inMeters(row.altitude.value)),
				bandRadii: [
					DistanceMath.inMeters(p0.controls.bands[0].innerRadius.value),
					...p0.controls.bands.map((band) => DistanceMath.inMeters(band.outerRadius.value)),
				],
				boundaryExtinctionLengthMultiples: [0.25, 0.5, 1, 2, 4, 8, 16],
			},
			provenanceIdentity: 'p0:74a7cb03:compact-profile-controls',
		};
		let profile = new LocalSunCompactConstructionProfile(definition);
		let domains = LocalSunConstructionDomainSelection.fromCompactProfile(profile);
		if (
			domains !== profile.domains ||
			domains.positions.count !== 1049 ||
			domains.incomingDirections.directionCount !== 1920 ||
			domains.outgoingDirections.directionCount !== 4374 ||
			'zNodes' in domains ||
			'rhoNodes' in domains ||
			'zCount' in domains.positions ||
			'rhoCount' in domains.positions
		)
			throw new Error('Compact selection must retain real ragged domains without rectangular axes.');
		let coordinatesChecked = 0;
		for (let expected of p0.controls.nodes) {
			let actual = domains.positions.nodes[expected.index];
			let xyz = DistanceMath.toMetersPosition(/** @type {Position} */ (actual.metadata.position));
			this._near(actual.coordinate.value, expected.altitude.value, 1e-7);
			this._near(xyz[2], expected.altitude.value, 1e-7);
			this._near(Math.hypot(xyz[0], xyz[1]), expected.horizontalDistance.value, 1e-7);
			if (
				actual.index !== expected.index ||
				actual.metadata.rowIndex !== expected.rowIndex ||
				actual.metadata.bandId !== expected.bandId
			)
				throw new Error('Compact physical address mapping differs.');
			coordinatesChecked++;
		}
		if (
			coordinatesChecked !== 1049 ||
			JSON.stringify(domains.topology.omittedBands) !== JSON.stringify(p0.controls.omittedBands)
		)
			throw new Error('Compact omission or complete node coverage differs.');
		if (
			profile.numerical.sourcePathTransmittance.kind !== 'analytic-exponential-column-v1' ||
			'intervalCount' in profile.numerical.sourcePathTransmittance ||
			profile.numerical.cacheTransport.intervalCount !== 48 ||
			profile.numerical.cacheTransport.opticalDepthCutoff !== 64 ||
			profile.numerical.viewPath.intervalCount !== 15 ||
			profile.numerical.maximumScatteringOrder !== 4
		)
			throw new Error('Complete local policy applicability differs.');
		let estimate = profile.estimateResources({
			retainedScatteringFields: 1,
			otherOwnedGpuBytes: {value: 0, units: 'bytes'},
		});
		if (
			estimate.scatteringFieldBytes.value !== 1049 * 4374 * 15 * 4 ||
			estimate.incomingRadianceBytes.value !== 1049 * 1920 * 15 * 4 ||
			estimate.phaseBytes.value !== 1920 * 4374 * 4 ||
			estimate.totalOwnedGpuEstimateBytes.value !== 1255635360 ||
			estimate.fullCpuRetainedSpectralBytes.value !== (5 * 1049 * 4374 * 15 + 3 * 1049 * 1920 * 15) * 8 ||
			estimate.spectralBuffersAllocated !== 0 ||
			!estimate.estimateFitsCeiling
		)
			throw new Error('Independent scalar-count/overlap accounting differs.');
		let remaining = 1600000000 - estimate.totalOwnedGpuEstimateBytes.value;
		if (
			!profile.estimateResources({
				retainedScatteringFields: 1,
				otherOwnedGpuBytes: {value: remaining, units: 'bytes'},
			}).estimateFitsCeiling ||
			profile.estimateResources({
				retainedScatteringFields: 1,
				otherOwnedGpuBytes: {value: remaining + 1, units: 'bytes'},
			}).estimateFitsCeiling
		)
			throw new Error('Allocation ceiling boundary differs.');
		let clone = new LocalSunCompactConstructionProfile({
			...definition,
			provenanceIdentity: 'same-input-different-derivation',
		});
		if (clone.contentHash !== profile.contentHash || clone.domains.topology.id !== domains.topology.id)
			throw new Error('Provenance metadata changed executable identity.');
		// Deliberately corrupt an isolated clone to exercise ingress against changed retained facts.
		Reflect.set(clone.domains.positions, 'count', 1048);
		let directPosition = definition.geometry.resolveCompactLocalSunCacheNodePosition({
			topology: domains.topology,
			positionIndex: 400,
		});
		let directRequest = {
			sourceRelativePosition: definition.geometry.resolveSourceRelativePosition({position: directPosition}),
		};
		let directBefore = definition.lightSource.sampleDirectLighting(directRequest).sourceIrradiance.values;
		let candidate = LocalSunCompactCpuAssembly.fromCompactProfile(profile, setup.calculator);
		if (
			candidate.domains.radiancePacking !== domains.radiancePacking ||
			candidate.domains.scatteringPacking !== domains.scatteringDensityPacking ||
			candidate.primaryMemoUsage.spectra !== 0
		)
			throw new Error('Assembly did not consume selected profile packings lazily.');
		let maximumPrimaryError = 0,
			primaryComparisons = 0;
		for (let control of authority.primary) {
			for (let [i, direction] of authority.directions.entries()) {
				let actual = candidate.samplePrimaryScatteringDensity({
					positionIndex: control.positionIndex,
					directionIndex: direction.index,
				});
				for (let c = 0; c < 15; c++) {
					maximumPrimaryError = Math.max(
						maximumPrimaryError,
						this._near(
							actual.values[c],
							control.samples[i][c],
							authority.limits.primaryAbsolute,
							authority.limits.primaryRelative,
						),
					);
					primaryComparisons++;
				}
			}
		}
		if (
			JSON.stringify(directBefore) !==
			JSON.stringify(definition.lightSource.sampleDirectLighting(directRequest).sourceIrradiance.values)
		)
			throw new Error('Profile construction changed continuous physical source behavior.');
		let rejected = 0;
		for (let operation of [
			() => LocalSunConstructionDomainSelection.fromCompactProfile(clone),
			() => LocalSunConstructionDomainSelection.fromCompactProfile({...profile}),
			() =>
				LocalSunConstructionDomainSelection.fromProfile(
					/** @type {Algorithm32ExecutionProfile} */ (/** @type {unknown} */ (profile)),
				),
			() =>
				new LocalSunCompactConstructionProfile(
					/** @type {LocalSunCompactConstructionProfileDefinition} */ (
						/** @type {unknown} */ ({...definition, sourceTransmittanceIntervalCount: 20})
					),
				),
			() =>
				new LocalSunCompactConstructionProfile(
					/** @type {LocalSunCompactConstructionProfileDefinition} */ (
						/** @type {unknown} */ ({...definition, groundBoundary: {}})
					),
				),
			() =>
				new LocalSunCompactConstructionProfile({
					...definition,
					atmosphere: new CanonicalAtmosphere({
						constants: {...definition.atmosphere.constants, miePhaseFunctionG: 0.6},
					}),
				}),
			() =>
				profile.estimateResources({
					retainedScatteringFields: -1,
					otherOwnedGpuBytes: {value: 0, units: 'bytes'},
				}),
			() =>
				domains.topology.resolvePositionStencil({
					altitude: DistanceMath.inMeters(100001),
					horizontalDistance: DistanceMath.inMeters(0),
				}),
		]) {
			try {
				operation();
			} catch (error) {
				if (!(error instanceof TypeError || error instanceof RangeError)) throw error;
				rejected++;
			}
		}
		if (rejected !== 8) throw new Error('Compact profile ingress/support rejection differs.');
		return {
			status: 'PASSED',
			coordinatesChecked,
			primaryComparisons,
			maximumPrimaryError,
			rejected,
			profileId: profile.id,
			profileContentHash: profile.contentHash,
			estimate,
			primaryMemoSpectra: candidate.primaryMemoUsage.spectra,
			elapsedMilliseconds: performance.now() - started,
			freeBeforeBytes: freeBefore,
			rssAfterBytes: process.memoryUsage().rss,
			fullFieldsQualified: false,
			ordinaryRuntimeProfileQualified: false,
			continuousSourceUnchanged: true,
		};
	}

	/** Call this method to preserve a new immutable profile proof with authenticated authorities and complete material derivation.
	 *
	 * @param {string} directory - New normalized directory under the plan-owned ignored run root.
	 * @returns {LocalSunCompactProfileProofReport} - Passed bounded proof.
	 * @throws {Error} - Destination, authority or proof is invalid, or an immutable output already exists.
	 */
	writeComparison(directory) {
		if (!directory.startsWith('tmp/production-local-sun-cache-promotion/runs/'))
			throw new Error('Plan-owned compact profile output required.');
		let destination = this._controls.paths.checkedPath(directory);
		if (existsSync(destination)) throw new Error('Existing immutable compact profile output rejected.');
		let report = this.verify();
		let sources = [
			'scripts/algorithm32/local-sun-cache/compact-profile/LocalSunCompactProfileProof.js',
			'scripts/algorithm32/local-sun-cache/assembly/LocalSunAssemblyProof.js',
			'scripts/algorithm32/local-sun-cache/assembly/LocalSunAssemblyControls.js',
			'src/algorithm32/implementation/local-sun/cache/LocalSunCompactConstructionProfile.js',
			'src/algorithm32/implementation/local-sun/cache/LocalSunConstructionDomainSelection.js',
			'src/algorithm32/implementation/local-sun/cache/LocalSunCompactCpuAssembly.js',
			'src/algorithm32/implementation/local-sun/cache/LocalSunCompactTransport.js',
			'src/algorithm32/implementation/local-sun/cache/LocalSunCompactReconstruction.js',
			'src/algorithm32/implementation/local-sun/cache/LocalSunConstructionLightSource.js',
			'src/algorithm32/implementation/local-sun/cache/LocalSunShellFactCache.js',
			'src/algorithm32/implementation/local-sun/cache/LocalSunFieldPacking.js',
			'src/algorithm32/implementation/canonical-atmosphere/CanonicalAtmosphere.js',
			'src/algorithm32/implementation/canonical-atmosphere/cache/CanonicalExponentialCacheColumn.js',
			'src/algorithm32/implementation/flat-earth/FlatEarthGeometry.js',
			'src/algorithm32/implementation/flat-earth/FlatScatteringCacheGeometry.js',
			'src/algorithm32/implementation/flat-earth/CompactLocalCacheTopology.js',
			'src/algorithm32/implementation/local-sun/LocalSunLightSource.js',
			'src/algorithm32/sampling-domains/direction/horizon-partitioned/FlatHorizonPartitionedDirectionDomain.js',
			'src/algorithm32/sampling-domains/direction/cubed-sphere/CubedSphereDirectionDomain.js',
			'src/algorithm32/profiles/native-15/native-15-profile.js',
			'src/algorithm32/implementation/algorithm32/model/SharedModel.js',
			'src/algorithm32/implementation/algorithm32/model/SpectralModel.js',
			'src/algorithm32/atmospheric-transport/spectral/SpectralCalculator.js',
			'src/algorithm32/spectral-values/SpectralPacket.js',
			'src/algorithm32/value-identity/CanonicalValueHash.js',
		];
		let authorities = [
			{
				path: 'src/algorithm32/implementation/local-sun/cache/fixtures/local-sun-compact-p0-controls.json',
				artifact: 'p0-authority.json',
			},
			{path: this._controls.fixturePath, artifact: 'primary-authority.json'},
		];
		let comparison =
			JSON.stringify(
				{
					schema: 'local-sun-compact-profile-comparison-v1',
					report,
					derivation: {
						parents: authorities.map((a) => ({...a, sha256: this._controls.paths.hash(a.path)})),
						implementation: sources.map((p) => ({path: p, sha256: this._controls.paths.hash(p)})),
						operation:
							'Construct complete explicit compact cache profile from genuine bound owners and P0 seed inputs; derive extinction from actual medium; compare every physical node, selected independent J1, exact no-buffer packing/allocation arithmetic, overlap ceiling, ingress and support. No full spectral fields/recurrence or ordinary runtime profile.',
						parameters: {
							positions: 1049,
							incoming: 1920,
							outgoing: 4374,
							channels: 15,
							order: 4,
							refinement: [0.25, 0.5, 1, 2, 4, 8, 16],
							sourcePath: 'analytic',
							cacheTransport: {intervals: 48, tauCutoff: 64},
							viewSelection: {intervals: 15},
							coordinateAbsolute: 1e-7,
							primaryAbsolute: 1e-12,
							primaryRelative: 2e-7,
							ownedGpuCeilingBytes: 1600000000,
							cpuBytesPerScalar: 8,
							gpuBytesPerScalar: 4,
						},
						tools: {node: process.version},
						command:
							'node scripts/algorithm32/local-sun-cache/compact-profile/LocalSunCompactProfileProof.js --out ' +
							directory,
					},
				},
				null,
				'\t',
			) + '\n';
		mkdirSync(path.dirname(destination), {recursive: true});
		mkdirSync(destination);
		for (let a of authorities)
			writeFileSync(path.join(destination, a.artifact), readFileSync(this._controls.paths.checkedPath(a.path)), {
				flag: 'wx',
			});
		writeFileSync(path.join(destination, 'comparison.json'), comparison, {flag: 'wx'});
		writeFileSync(
			path.join(destination, 'manifest.json'),
			JSON.stringify(
				{
					schema: 'local-sun-compact-profile-run-v1',
					state: 'passed',
					artifacts: [
						...authorities.map((a) => ({path: a.artifact, sha256: this._controls.paths.hash(a.path)})),
						{path: 'comparison.json', sha256: createHash('sha256').update(comparison).digest('hex')},
					],
				},
				null,
				'\t',
			) + '\n',
			{flag: 'wx'},
		);
		return report;
	}
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
	let args = process.argv.slice(2);
	if (!(args.length === 0 || (args.length === 2 && args[0] === '--out')))
		throw new Error('Use no arguments or --out <new-plan-run-directory>.');
	let proof = new LocalSunCompactProfileProof();
	console.log(JSON.stringify(args.length ? proof.writeComparison(args[1]) : proof.verify(), null, 2));
}
