import {SCORE_CHANNELS, assertAligned} from './boundary.mjs';
import {scoreBoundary, spectralDelta} from './metrics.mjs';

/** Escape all XML text and attribute delimiters. @param {unknown} value @returns {string} */
function xml(value) {
	return String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

/** Escape a CSV field using the standard quoted-field convention. @param {unknown} value @returns {string} */
function csv(value) {
	return `"${String(value).replaceAll('"', '""')}"`;
}

/** Wrap visible descriptions while retaining the complete original in the SVG description element. @param {string} value @returns {string[]} */
function descriptionLines(value) {
	const lines = [''];
	for (const word of value.split(/\s+/u)) {
		if (lines.at(-1).length + word.length + 1 > 125 && lines.at(-1)) lines.push('');
		lines[lines.length - 1] += `${lines.at(-1) ? ' ' : ''}${word}`;
	}
	if (lines.length > 2)
		throw new Error('Keep the visible plot description within two lines; detailed provenance belongs in metadata.');
	return lines;
}

/** Draw a self-contained scientific SVG, retaining exact values in tooltips and provenance metadata. @param {DialPlotOptions} options @returns {string} */
export function renderScientificSvg(options) {
	if (
		!options.title ||
		!options.description ||
		!options.xLabel ||
		!options.yLabel ||
		!options.series.length ||
		options.series.length > 6
	)
		throw new Error('A scientific figure requires labelled axes, scope and one to six series.');
	for (const series of options.series)
		if (
			!series.label ||
			!series.x.length ||
			series.x.length !== series.y.length ||
			[...series.x, ...series.y].some((value) => !Number.isFinite(value))
		)
			throw new Error('Figure series must contain paired finite coordinates.');
	const allX = options.series.flatMap((series) => [...series.x]),
		allY = options.series.flatMap((series) => [...series.y]);
	let minimumX = Math.min(...allX),
		maximumX = Math.max(...allX),
		minimumY = Math.min(0, ...allY),
		maximumY = Math.max(0, ...allY);
	if (minimumX === maximumX) {
		minimumX -= 0.5;
		maximumX += 0.5;
	}
	if (minimumY === maximumY) {
		minimumY -= 0.5;
		maximumY += 0.5;
	}
	const padding = (maximumY - minimumY) * 0.08;
	minimumY -= padding;
	maximumY += padding;
	const left = 115,
		right = 1190,
		top = 180,
		bottom = 620;
	const x = (value) => left + ((value - minimumX) / (maximumX - minimumX)) * (right - left);
	const y = (value) => bottom - ((value - minimumY) / (maximumY - minimumY)) * (bottom - top);
	const lines = [];
	for (let tick = 0; tick <= 5; tick++) {
		const value = minimumY + (tick / 5) * (maximumY - minimumY);
		lines.push(
			`<line x1="${left}" y1="${y(value)}" x2="${right}" y2="${y(value)}" stroke="#dfe5ea"/><text x="${left - 12}" y="${y(value) + 5}" text-anchor="end">${value.toPrecision(4)}</text>`,
		);
	}
	const ticks =
		options.xTicks ??
		Array.from({length: 7}, (_, index) => ({
			value: minimumX + (index / 6) * (maximumX - minimumX),
			label: (minimumX + (index / 6) * (maximumX - minimumX)).toFixed(1),
		}));
	for (const tick of ticks) {
		if (!Number.isFinite(tick.value) || tick.value < minimumX || tick.value > maximumX)
			throw new Error('Figure tick outside the plotted coordinate range.');
		lines.push(
			`<text x="${x(tick.value)}" y="${bottom + 25}" text-anchor="middle" font-size="13">${xml(tick.label)}</text>`,
		);
	}
	lines.push(`<line x1="${left}" y1="${y(0)}" x2="${right}" y2="${y(0)}" stroke="#80909c"/>`);
	const colors = ['#155d9a', '#bb4a24', '#338566', '#824fa3', '#977919', '#4c6578'];
	options.series.forEach((series, ordinal) => {
		const legendX = left + (ordinal % 3) * 355,
			legendY = 116 + Math.floor(ordinal / 3) * 28;
		lines.push(
			`<line x1="${legendX}" y1="${legendY}" x2="${legendX + 26}" y2="${legendY}" stroke="${colors[ordinal]}" stroke-width="3"/><text x="${legendX + 34}" y="${legendY + 5}" font-size="14">${xml(series.label)}</text>`,
		);
		lines.push(
			`<polyline points="${series.x.map((value, index) => `${x(value)},${y(series.y[index])}`).join(' ')}" fill="none" stroke="${colors[ordinal]}" stroke-width="2.5"/>`,
		);
		series.x.forEach((value, index) =>
			lines.push(
				`<circle cx="${x(value)}" cy="${y(series.y[index])}" r="3" fill="${colors[ordinal]}"><title>${xml(`${series.label}: x=${value}, y=${series.y[index]}`)}</title></circle>`,
			),
		);
	});
	const description = descriptionLines(options.description)
		.map((line, index) => `<text x="${left}" y="${73 + index * 19}" font-size="14">${xml(line)}</text>`)
		.join('');
	return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="730" viewBox="0 0 1280 730" role="img" aria-labelledby="title description"><title id="title">${xml(options.title)}</title><desc id="description">${xml(options.description)}</desc><metadata>${xml(JSON.stringify(options.provenance))}</metadata><rect width="1280" height="730" fill="white"/><g font-family="Arial,sans-serif" font-size="15" fill="#21303c"><text x="${left}" y="43" font-size="23" font-weight="bold">${xml(options.title)}</text>${description}${lines.join('')}<text x="650" y="683" text-anchor="middle">${xml(options.xLabel)}</text><text transform="translate(25 400) rotate(-90)" text-anchor="middle">${xml(options.yLabel)}</text></g></svg>\n`;
}

/** Produce compact numerical-response and measurement-score artifacts without publishing any result. @param {DialAnalysisBoundary} control @param {DialAnalysisBoundary} candidate @param {DialAnalysisBoundary} measured @param {DialComparisonReportOptions} options @returns {DialComparisonReport} */
export function comparisonReport(control, candidate, measured, options) {
	assertAligned(control, candidate);
	const channels = options.scoreChannels ?? SCORE_CHANNELS;
	const controlScore = scoreBoundary(control, measured, channels),
		candidateScore = scoreBoundary(candidate, measured, channels);
	const delta = spectralDelta(control, candidate);
	const sampleCount = delta.times.length * delta.rayIndices.length;
	const spectralChanges = delta.channels.map((channel, channelIndex) => {
		let sum = 0,
			squares = 0;
		for (let sample = 0; sample < sampleCount; sample++) {
			const value = delta.values[sample * delta.channels.length + channelIndex];
			sum += value;
			squares += value * value;
		}
		return {
			channel,
			wavelengthNanometers: 360 + 11.75 * channel,
			meanChangeW: sum / sampleCount,
			rmsChangeW: Math.sqrt(squares / sampleCount),
		};
	});
	const aggregateChangeMilliwatt = candidateScore.aggregateRmseMilliwatt - controlScore.aggregateRmseMilliwatt;
	const direction =
		aggregateChangeMilliwatt > 0 ? 'worsening' : aggregateChangeMilliwatt < 0 ? 'improvement' : 'no change';
	const percentage =
		controlScore.aggregateRmseMilliwatt > 0
			? `${((100 * Math.abs(aggregateChangeMilliwatt)) / controlScore.aggregateRmseMilliwatt).toFixed(6)}% ${direction}`
			: 'percentage undefined at zero control RMSE';
	const interpretation = `${Math.abs(aggregateChangeMilliwatt).toPrecision(8)} mW m^-2 sr^-1 nm^-1 ${direction}; ${percentage}.`;
	const rows = controlScore.conditions.map((before, index) => {
		const after = candidateScore.conditions[index];
		return [
			before.time,
			before.rmseMilliwatt,
			after.rmseMilliwatt,
			after.rmseMilliwatt - before.rmseMilliwatt,
			before.sampleCount,
		];
	});
	rows.push([
		'aggregate',
		controlScore.aggregateRmseMilliwatt,
		candidateScore.aggregateRmseMilliwatt,
		aggregateChangeMilliwatt,
		controlScore.sampleCount,
	]);
	const csvText =
		[
			[
				'time',
				'control_rmse_mW_m-2_sr-1_nm-1',
				'candidate_rmse_mW_m-2_sr-1_nm-1',
				'new_minus_old_rmse_mW_m-2_sr-1_nm-1',
				'scalar_count',
			],
			...rows,
		]
			.map((row) => row.map(csv).join(','))
			.join('\n') + '\n';
	const markdown = `${options.title}\n\n${controlScore.fullRegisteredBoundary ? 'Complete registered 17 x 81 x 31 Kider score boundary.' : 'Explicit screening/subset score; this is not full B1 qualification.'} Score channels: ${channels.join(', ')}. Numerical spectra retain channels: ${control.channels.join(', ')}.\n\n${interpretation}\n\n| Time | Control RMSE | Candidate RMSE | New minus old | Scalars |\n| --- | ---: | ---: | ---: | ---: |\n${rows.map((row) => `| ${row.join(' | ')} |`).join('\n')}\n\nRMSE units: mW m^-2 sr^-1 nm^-1; lower is better. Aggregate follows sqrt(mean(condition RMSE squared)). Spectral change is a separate physical response, not a claim of convergence or improved measurement agreement. Signed means can cancel across directions; the spectral figure also retains RMS change. Existing measurements are known development data; any prospective claim concerns withheld intervention outcomes and requires its separate sealed prediction evaluation.\n`;
	const spectralSvg = renderScientificSvg({
		title: 'Physical spectral response of the intervention',
		description:
			'Candidate minus control; signed mean and RMS across selected directions and times. No accuracy claim.',
		xLabel: 'Point wavelength (nm)',
		yLabel: 'Spectral radiance change (mW m^-2 sr^-1 nm^-1)',
		series: [
			{
				label: 'Signed mean change',
				x: spectralChanges.map((entry) => entry.wavelengthNanometers),
				y: spectralChanges.map((entry) => entry.meanChangeW * 1000),
			},
			{
				label: 'RMS change',
				x: spectralChanges.map((entry) => entry.wavelengthNanometers),
				y: spectralChanges.map((entry) => entry.rmsChangeW * 1000),
			},
		],
		provenance: options.provenance,
	});
	const scoreSvg = renderScientificSvg({
		title: 'Kider agreement at the selected capture times',
		description: `${controlScore.fullRegisteredBoundary ? 'Complete registered score' : 'Screening/subset score'}; channels ${channels.join(',')}. Lower RMSE is better.`,
		xLabel: 'Local EDT time on 2013-05-27',
		yLabel: 'Spectral radiance RMSE (mW m^-2 sr^-1 nm^-1)',
		xTicks: control.times.map((time, index) => ({value: index, label: time})),
		series: [
			{
				label: control.configId,
				x: control.times.map((_, index) => index),
				y: controlScore.conditions.map((entry) => entry.rmseMilliwatt),
			},
			{
				label: candidate.configId,
				x: control.times.map((_, index) => index),
				y: candidateScore.conditions.map((entry) => entry.rmseMilliwatt),
			},
		],
		provenance: options.provenance,
	});
	return {
		controlScore,
		candidateScore,
		spectralChanges,
		aggregateChangeMilliwatt,
		interpretation,
		markdown,
		csv: csvText,
		spectralSvg,
		scoreSvg,
	};
}
