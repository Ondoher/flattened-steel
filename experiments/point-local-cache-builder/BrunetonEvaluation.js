import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';

/** Run-65 qualification using expanded cache values and the accepted Q30 view equation. */
export default class BrunetonEvaluation {
	/** Call this method to integrate expanded caches and compare every B1 radiance against run 65.
	 * Authentication failures reject; numerical mismatches return a rejected result with figures and diagnostics.
	 * @param {BuilderRun} run - Current evidence owner.
	 * @param {BuilderPackage} packet - Complete materialized Direct40 cache.
	 * @param {BuilderPackageReader} owner - Package reader and expansion owner.
	 * @param {Buffer} directions - Authenticated exact seam map.
	 * @returns {Promise<BuilderB1Result>} - Numerical agreement, benchmark scores, and figure identities.
	 */
	async run(run, packet, owner, directions) {
		const historicalRoot = 'experiments/extraterrestrial/solar-zenith-cache/point-local-scene-cache';
		const integrationPath = historicalRoot + '/runB1PointLocalBrowser.js';
		for (const path of [
			integrationPath,
			historicalRoot + '/b1PointLocalInputs.js',
			historicalRoot + '/buildInventoryLedger.js',
			'experiments/extraterrestrial/solar-zenith-cache/san-jose-nautical-cache-poc/geometry/ActualPointCoordinates.js',
			'scripts/experiments/b1-directional-sky-radiance/benchmark.js',
			'scripts/experiments/b1-directional-sky-radiance/benchmark-domain.js',
			'scripts/experiments/b1-directional-sky-radiance/published-oracle.js',
			'scripts/experiments/b1-directional-sky-radiance/figure5.js',
		])
			await run.read(path);
		const view = await import(pathToFileURL(await run.files.resolve(integrationPath)).href);
		const benchmark = await import(
			pathToFileURL(await run.files.resolve('scripts/experiments/b1-directional-sky-radiance/benchmark.js')).href
		);
		const figures = await import(
			pathToFileURL(await run.files.resolve('scripts/experiments/b1-directional-sky-radiance/figure5.js')).href
		);
		const targetRoot = 'tmp/extraterrestrial/color-reset/runs/000065-color-reset-qualification';
		const manifest = JSON.parse((await run.read(targetRoot + '/artifact-manifest.json')).toString('utf8'));
		assert.equal(manifest.conclusion, 'accepted');
		assert.equal(manifest.artifactSetSha256, '1f5fa1226d1520847fa900fea14870144e6c07f1cbecd11dc0ff4246d2b8bfe1');
		for (const artifact of manifest.artifacts) await run.read(targetRoot + '/' + artifact.path, artifact);
		const targetPath = targetRoot + '/data/b1-point-local-direct40-w27-q30.tsv';
		const targetBytes = await run.read(targetPath);
		assert.equal(run.files.hash(targetBytes), 'e6d62e23ec0184cc9941e8305d4ea9e69691cf996d5bce8523afb641830ce634');
		const pinsRoot = 'tmp/experiments/point-local-cache-builder/00000-profiles';
		const pinsSeal = JSON.parse((await run.read(pinsRoot + '/sealed.json')).toString('utf8'));
		assert.equal(pinsSeal.state, 'accepted');
		const pins = JSON.parse(
			(
				await run.read(
					pinsRoot + '/profiles.json',
					pinsSeal.artifacts.find((a) => a.path === pinsRoot + '/profiles.json'),
				)
			).toString('utf8'),
		);
		assert.deepEqual(packet.buildRequest, pins.bruneton);
		assert.deepEqual(
			packet.scenes.map((scene) => scene.request),
			pins.scenes,
		);
		assert.deepEqual(
			packet.wavelengths,
			Array.from({length: 40}, (_, i) => i),
		);
		const spectra = packet.scenes.map(() => Array.from({length: 81}, () => Array(40).fill(0)));
		const spec = packet.buildRequest.transportSpec;
		const altitudeNodes = spec.domains.position.nodes.map((node) => node.altitudeMeters);
		run.progress({phase: 'b1-decode', message: 'Authenticating and decoding each shared block once.'});
		await owner.prepare(run, packet);
		for (let channelIndex = 0; channelIndex < packet.channelCount; channelIndex++) {
			const channel = spec.domains.spectrum.channels[channelIndex];
			const unique = await owner.readChannel(run, packet, channelIndex);
			const extinction = (altitude) =>
				channel.rayleighScatteringPerMeter * Math.exp(-altitude / spec.atmosphere.rayleighScaleHeightMeters) +
				channel.mieExtinctionPerMeter * Math.exp(-altitude / spec.atmosphere.mieScaleHeightMeters);
			for (const [index, scene] of packet.scenes.entries()) {
				const values = owner.expand(packet, index, unique, directions);
				const ledger = {
					rows: scene.ledger.rows.map((row) => ({
						retainedZenith: {firstIndex: row.firstSolarZenithIndex, lastIndex: row.lastSolarZenithIndex},
						packed: {firstRow: row.firstPackedRow},
					})),
				};
				for (let direction = 0; direction < 81; direction++)
					spectra[index][direction][channelIndex] = view.integrateB1Direction({
						values,
						ledger,
						altitudeNodes,
						state: scene.request,
						localDirection: view.createB1DiskDirection(Math.floor(direction / 9), direction % 9),
						extinction,
						intervalCount: pins.viewIntegration.intervalCount,
						distribution: pins.viewIntegration.distribution,
					});
			}
			run.progress({
				phase: 'b1-view',
				completed: channelIndex + 1,
				total: packet.channelCount,
				message: 'Expanded cache and integrated accepted Q30 view equation.',
			});
		}
		const lines = [
			[
				'model',
				'time',
				'grid_x',
				'grid_y',
				...spec.domains.spectrum.channels.map((channel) => channel.centerNanometers),
			].join('\t'),
		];
		packet.scenes.forEach((scene, index) =>
			spectra[index].forEach((values, direction) =>
				lines.push(
					['candidate', scene.request.time, Math.floor(direction / 9), direction % 9, ...values].join('\t'),
				),
			),
		);
		const table = await run.write('b1.tsv', Buffer.from(lines.join('\n') + '\n'));
		const dataset = benchmark.loadKiderDataset();
		assert.equal(dataset.rawAcquisitionSha256, benchmark.EXPECTED_DATASET_FINGERPRINTS.rawAcquisitionSha256);
		assert.equal(dataset.processedGridSha256, benchmark.EXPECTED_DATASET_FINGERPRINTS.processedGridSha256);
		const models = benchmark.parseSpectraTsv(await run.files.resolve(table.path));
		const targets = benchmark.parseSpectraTsv(await run.files.resolve(targetPath));
		const grid = models.values().next().value,
			targetGrid = targets.values().next().value;
		const score = benchmark.scoreModels(dataset, models).values().next().value;
		const targetScore = benchmark.scoreModels(dataset, targets).values().next().value;
		assert.equal(targetScore.aggregate.rmseMilliwatt, 11.554012538468113);
		let count = 0,
			sumSquares = 0,
			maximum = 0,
			worst = null;
		for (const scene of packet.scenes)
			for (let x = 0; x < 9; x++)
				for (let y = 0; y < 9; y++)
					for (let channel = 0; channel < 40; channel++) {
						const actual = grid.get(scene.request.time)[x][y][channel],
							expected = targetGrid.get(scene.request.time)[x][y][channel];
						assert(Number.isFinite(actual) && actual >= 0);
						const delta = actual - expected;
						count++;
						sumSquares += delta * delta;
						if (Math.abs(delta) > maximum) {
							maximum = Math.abs(delta);
							worst = {time: scene.request.time, x, y, channel, actual, expected, delta};
						}
					}
		const imageArtifacts = [];
		const imageComparisons = [];
		for (const scene of figures.FIGURE5_SCENES) {
			const measured = dataset.conditions.find((condition) => condition.time === scene.time).grid;
			const candidate = figures.renderAlgorithm32Figure5Panel(grid.get(scene.time), measured, scene);
			const target = figures.renderAlgorithm32Figure5Panel(targetGrid.get(scene.time), measured, scene);
			imageArtifacts.push(await run.write(`b1-${scene.fileTime}.png`, candidate.png));
			imageArtifacts.push(await run.write(`target-${scene.fileTime}.png`, target.png));
			imageComparisons.push({
				time: scene.time,
				candidateRgbaSha256: candidate.rgbaSha256,
				targetRgbaSha256: target.rgbaSha256,
				exact: candidate.rgbaSha256 === target.rgbaSha256,
			});
		}
		const rms = Math.sqrt(sumSquares / count),
			scoreDifference = score.aggregate.rmseMilliwatt - targetScore.aggregate.rmseMilliwatt;
		const limits = pins.acceptance.bruneton;
		const result = {
			accepted:
				maximum <= limits.allChannelMaximumAbsoluteWatts &&
				rms <= limits.allChannelRmsWatts &&
				Math.abs(scoreDifference) <= limits.scoreDifferenceMilliwatts,
			comparedValues: count,
			maximumAbsoluteWatts: maximum,
			rmsWatts: rms,
			worst,
			scoreDifferenceMilliwatts: scoreDifference,
			candidateScore: score,
			targetScore,
			limits,
			imageComparisons,
			table,
			imageArtifacts,
		};
		await run.write('b1-comparison.json', result);
		const rows = score.conditionScores
			.map(
				(s, i) =>
					`<text x="30" y="${70 + i * 24}">${s.time}</text><rect x="100" y="${57 + i * 24}" width="${targetScore.conditionScores[i].rmseMilliwatt * 20}" height="6" fill="#888"/><rect x="100" y="${65 + i * 24}" width="${s.rmseMilliwatt * 20}" height="6" fill="#1267b1"/>`,
			)
			.join('');
		await run.write(
			'b1-scores.svg',
			Buffer.from(
				`<svg xmlns="http://www.w3.org/2000/svg" width="850" height="520" viewBox="0 0 850 520"><rect width="850" height="520" fill="white"/><g font-family="sans-serif" font-size="13"><text x="30" y="25">B1 RMSE: run 65 (gray), candidate (blue); bar scale 20 px per mW m^-2 sr^-1 nm^-1</text>${rows}<text x="30" y="495">Aggregate: target ${targetScore.aggregate.rmseMilliwatt.toFixed(9)}, candidate ${score.aggregate.rmseMilliwatt.toFixed(9)}</text></g></svg>`,
			),
		);
		return result;
	}
}
