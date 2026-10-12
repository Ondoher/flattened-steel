import {existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {LocalSunAmplitudeControls} from './LocalSunAmplitudeControls.js';
import {LocalSunLightSource} from '../../../../src/algorithm32/implementation/local-sun/LocalSunLightSource.js';
import {LocalSunShellFactCache} from '../../../../src/algorithm32/implementation/local-sun/cache/LocalSunShellFactCache.js';
import LocalSunConstructionLightSource from '../../../../src/algorithm32/implementation/local-sun/cache/LocalSunConstructionLightSource.js';

/** Production-source comparison against separately frozen analytic held-strength authority. */
export class LocalSunAmplitudeProof {
	/** Offline authority owns checked repository paths and independent input authentication. */
	_controls = new LocalSunAmplitudeControls();

	/** Called by comparisons to reject failed evidence gates.
	 *
	 * @param {boolean} condition - Required result.
	 * @param {string} message - Failed condition.
	 * @returns {void} - No value.
	 * @throws {Error} - The required condition is false.
	 */
	_require(condition, message) {
		if (!condition) throw new Error(message);
	}

	/** Called by analytic binary64 comparisons; bounds were selected before candidate scoring.
	 *
	 * @param {number} actual - Production scalar, with the same units as expected.
	 * @param {number} expected - Independent analytic scalar.
	 * @param {number} absolute - Absolute roundoff allowance in the scalar's units.
	 * @param {number} relative - Dimensionless relative roundoff allowance.
	 * @returns {number} - Absolute observed error.
	 * @throws {Error} - Nonfinite, negative or outside the predeclared bound.
	 */
	_compare(actual, expected, absolute, relative) {
		let error = Math.abs(actual - expected);
		this._require(
			Number.isFinite(actual) && actual >= 0 && error <= absolute + relative * Math.abs(expected),
			'Analytic source comparison failed.',
		);
		return error;
	}

	/** Called by packet comparisons to enforce source meaning as well as numerical values.
	 *
	 * @param {SpectralIrradiancePacket} packet - Actual physical source sample.
	 * @param {LocalSunAmplitudeFixture} fixture - Independently authenticated calibration and semantics.
	 * @returns {void} - No value.
	 * @throws {Error} - Quantity, units, basis channels or bin interpretation differ.
	 */
	_packetMeaning(packet, fixture) {
		this._require(
			packet.quantity === fixture.packet.quantity &&
				packet.units === fixture.packet.units &&
				packet.semantics === fixture.packet.semantics &&
				packet.values.length === 15,
			'Source spectral meaning differs.',
		);
		this._require(packet.basis.channels.length === fixture.packet.channels.length, 'Source basis size differs.');
		for (let [index, expected] of fixture.packet.channels.entries()) {
			let actual = packet.basis.channels[index];
			this._require(
				actual.id === expected.id &&
					actual.center.units === 'nanometers' &&
					actual.width.units === 'nanometers' &&
					actual.center.value === expected.center &&
					actual.width.value === expected.width,
				'Source basis channel differs.',
			);
		}
	}

	/** Call this method to qualify the selected held-strength vector and construction-only Native15 packet scaling.
	 * It compares every held band, exact lower-boundary ownership, midpoint and final endpoint samples, and
	 * continuous direct-light output against the independent analytic equation. The existing source is configured
	 * through its public placement method; no candidate output supplies expected values. Radius clipping is inactive
	 * under the admitted support. This does not qualify fields, transport, other profiles, GPU or complete-frame reuse.
	 *
	 * @returns {LocalSunAmplitudeProofReport} - Successful bounded capability comparison.
	 * @throws {Error} - Authority authentication, a public sample or any comparison fails.
	 */
	verify() {
		let fixture = this._controls.verify();
		let authoritySha256 = this._controls.hash(this._controls.fixturePath);
		this._require(
			authoritySha256 === '9d157f86ddbc15d66302341cb2cb5e9817c9b60f28010334b3840e53d689a4ff',
			'Predeclared held-strength authority changed.',
		);
		let source = new LocalSunLightSource({
			sourceKey: 'compact-p1-amplitude-proof',
			referenceDistance: fixture.source.referenceDistance,
			referenceSpectralIncidentScale: fixture.source.referenceSpectralIncidentScale,
			radius: fixture.source.radius,
			distanceFalloff: fixture.source.distanceFalloff,
		});
		source.configureGeometryPlacement({kind: 'finite-position', position: fixture.source.position});
		let facts = new LocalSunShellFactCache({
			sourceConfiguration: source.configuration,
			sourceDistanceBounds: fixture.bounds,
		});
		let construction = new LocalSunConstructionLightSource({source, shellFactCache: facts});
		this._require(
			facts.shellCount === fixture.bandCount && fixture.heldScales.length === 2048,
			'Held band count differs.',
		);
		let scales = facts.heldIncidentScales;
		let boundaries = facts.boundaries;
		// Frozen P0 queries complement exact binary64 candidate-boundary ownership probes.
		let parent = /** @type {LocalSunP0Fixture} */ (
			JSON.parse(readFileSync(this._controls.checkedPath(fixture.derivation.parents[0].path), 'utf8'))
		);
		let independentBoundaries = parent.controls.sourceAmplitude.boundaries;
		let maximumScaleError = 0;
		let maximumIrradianceError = 0;
		let spectralComparisons = 0;
		let continuousSamples = 0;
		for (let index = 0; index < fixture.bandCount; index++) {
			let expected = fixture.heldScales[index];
			maximumScaleError = Math.max(
				maximumScaleError,
				this._compare(scales[index], expected, fixture.limits.absoluteScale, fixture.limits.relative),
			);
			let queries = [
				boundaries[index],
				(independentBoundaries[index].value + independentBoundaries[index + 1].value) / 2,
			];
			if (index === fixture.bandCount - 1) queries.push(boundaries[index + 1]);
			for (let distance of queries) {
				/** Complete physical source-relative query supplied through the public sample contract. @type {LocalSunPhysicalSampleRequest} */
				let request = {
					sourceRelativePosition: {
						distanceFromSource: {value: distance, units: 'meters'},
						directionToSource: [0, 0, 1],
						directionFromSource: [0, 0, -1],
					},
				};
				let held = construction.sampleDirectLighting(request);
				let direct = source.sampleDirectLighting(request);
				if (!held.metadata || typeof held.metadata !== 'object' || Array.isArray(held.metadata))
					throw new Error('Held sample metadata is not an object.');
				let heldMetadata = /** @type {LocalSunAmplitudeSampleMetadata} */ (held.metadata);
				let heldScale = heldMetadata.heldIncidentScale;
				if (typeof heldScale !== 'number') throw new Error('Held sample metadata lacks its numeric amplitude.');
				let directMetadata = /** @type {LocalSunContinuousDirectLightingMetadata} */ (direct.metadata);
				this._require(
					heldMetadata.shellIndex === index &&
						heldMetadata.constructionLightKind === 'shell-held-arithmetic-mean' &&
						!heldMetadata.shellDistanceClamped,
					'Construction ownership differs.',
				);
				let continuousScale = fixture.source.referenceDistance.value ** 2 / (distance * distance);
				maximumScaleError = Math.max(
					maximumScaleError,
					this._compare(heldScale, expected, fixture.limits.absoluteScale, fixture.limits.relative),
					this._compare(
						directMetadata.incidentScale,
						continuousScale,
						fixture.limits.absoluteScale,
						fixture.limits.relative,
					),
				);
				this._require(
					!('constructionLightKind' in directMetadata) && directMetadata.distanceClampedToRadius === false,
					'Continuous direct source was replaced by a held approximation.',
				);
				this._packetMeaning(held.sourceIrradiance, fixture);
				this._packetMeaning(direct.sourceIrradiance, fixture);
				for (let [channelIndex, channel] of fixture.packet.channels.entries()) {
					maximumIrradianceError = Math.max(
						maximumIrradianceError,
						this._compare(
							held.sourceIrradiance.values[channelIndex],
							channel.value * expected,
							fixture.limits.absoluteIrradiance,
							fixture.limits.relative,
						),
						this._compare(
							direct.sourceIrradiance.values[channelIndex],
							channel.value * continuousScale,
							fixture.limits.absoluteIrradiance,
							fixture.limits.relative,
						),
					);
					spectralComparisons += 2;
				}
				continuousSamples++;
			}
		}
		// Accessors must preserve accepted values even if a caller modifies its own copy.
		scales[0] = -1;
		this._compare(
			facts.heldIncidentScales[0],
			fixture.heldScales[0],
			fixture.limits.absoluteScale,
			fixture.limits.relative,
		);
		return {
			status: 'PASSED',
			authoritySha256,
			bands: facts.shellCount,
			spectralComparisons,
			maximumScaleError,
			maximumIrradianceError,
			continuousSamples,
			fieldsQualified: false,
		};
	}

	/** Call this method to preserve new immutable scalar-source evidence with complete derivation and tool identities.
	 * Existing output is rejected before candidate scoring; partial failed writes remain inspectable without a passed
	 * manifest. Parent controls are copied without modifying their original bytes. No fields or GPU are allocated.
	 *
	 * @param {string} directory - New normalized directory under the plan-owned ignored run root.
	 * @returns {LocalSunAmplitudeProofReport} - Passed report preserved in that new run.
	 * @throws {Error} - The destination is unsupported, linked, already exists or comparison fails.
	 */
	writeComparison(directory) {
		this._require(
			directory.startsWith('tmp/production-local-sun-cache-promotion/runs/'),
			'Plan-owned output required.',
		);
		let destination = this._controls.checkedPath(directory);
		this._require(!existsSync(destination), 'Comparison run already exists and is immutable.');
		let report = this.verify();
		let fixture = this._controls.verify();
		let authority = readFileSync(this._controls.checkedPath(this._controls.fixturePath));
		let parent = readFileSync(this._controls.checkedPath(fixture.derivation.parents[0].path));
		let implementationPaths = [
			'scripts/algorithm32/local-sun-cache/source-amplitude/LocalSunAmplitudeProof.js',
			'scripts/algorithm32/local-sun-cache/source-amplitude/LocalSunAmplitudeControls.js',
			'src/algorithm32/implementation/local-sun/cache/LocalSunShellFactCache.js',
			'src/algorithm32/implementation/local-sun/cache/LocalSunConstructionLightSource.js',
			'src/algorithm32/implementation/local-sun/LocalSunLightSource.js',
			'src/algorithm32/profiles/native-15/native-15-profile.js',
			'src/algorithm32/profiles/native-15/consts.js',
			'src/algorithm32/spectral-values/SpectralMath.js',
			'src/algorithm32/spectral-values/SpectralPacket.js',
			'src/algorithm32/spectral-values/SpectralBasis.js',
			'src/algorithm32/spectral-values/consts.js',
		];
		let result = `${JSON.stringify(
			{
				schema: 'local-sun-held-amplitude-comparison-v1',
				report,
				derivation: {
					parents: [
						{artifact: 'authority.json', sha256: report.authoritySha256},
						{artifact: 'p0-authority.json', sha256: fixture.derivation.parents[0].sha256},
					],
					operation:
						'Compare every held band and construction/direct Native15 source sample against frozen independent midpoint-in-inverse-square authority; no field, transport, GPU or frame acceptance.',
					implementation: implementationPaths.map((relative) => ({
						path: relative,
						sha256: this._controls.hash(relative),
					})),
					configuration: {source: fixture.source, bounds: fixture.bounds, limits: fixture.limits},
					tools: {node: process.version},
					command: `node scripts/algorithm32/local-sun-cache/source-amplitude/LocalSunAmplitudeProof.js --out ${directory}`,
				},
			},
			null,
			'\t',
		)}\n`;
		mkdirSync(path.dirname(destination), {recursive: true});
		mkdirSync(destination);
		writeFileSync(path.join(destination, 'authority.json'), authority, {flag: 'wx'});
		writeFileSync(path.join(destination, 'p0-authority.json'), parent, {flag: 'wx'});
		writeFileSync(path.join(destination, 'comparison.json'), result, {flag: 'wx'});
		writeFileSync(
			path.join(destination, 'manifest.json'),
			`${JSON.stringify(
				{
					schema: 'local-sun-held-amplitude-comparison-run-v1',
					state: 'passed',
					artifacts: [
						{path: 'authority.json', sha256: report.authoritySha256},
						{path: 'p0-authority.json', sha256: fixture.derivation.parents[0].sha256},
						{path: 'comparison.json', sha256: createHash('sha256').update(result).digest('hex')},
					],
				},
				null,
				'\t',
			)}\n`,
			{flag: 'wx'},
		);
		return report;
	}
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
	let args = process.argv.slice(2);
	if (!(args.length === 0 || (args.length === 2 && args[0] === '--out')))
		throw new Error('Use no arguments or --out <new-plan-run-directory>.');
	let proof = new LocalSunAmplitudeProof();
	console.log(JSON.stringify(args.length ? proof.writeComparison(args[1]) : proof.verify(), null, 2));
}
