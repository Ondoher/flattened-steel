import {createHash} from 'node:crypto';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {
	DIRECTION_CONTRACT,
	FIXED_CONDITIONS,
	FULL_WAVELENGTHS_NM,
	GRASS_ALBEDO,
	MATCHED_ATMOSPHERE,
	PENNDORF_SCATTERING_PER_METER_AT_0C,
	PUBLISHED,
	SOLAR_IRRADIANCE,
} from './contract.js';

const SIGNIFICANT_DIGITS = 6;

// Matches the six-significant-digit default formatting used by the pinned C++
// adapter closely enough to reproduce its text inputs rather than silently
// increasing their precision in the JavaScript recast.
export function cppDefaultFloat(value) {
	if (!Number.isFinite(value)) throw new TypeError('Cannot format a non-finite number.');
	if (Object.is(value, -0) || value === 0) return '0';
	const exponent = Math.floor(Math.log10(Math.abs(value)));
	if (exponent < -4 || exponent >= SIGNIFICANT_DIGITS) {
		const [mantissa, rawExponent] = value.toExponential(SIGNIFICANT_DIGITS - 1).split('e');
		const compactMantissa = mantissa.replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1');
		const numericExponent = Number(rawExponent);
		const sign = numericExponent >= 0 ? '+' : '-';
		return `${compactMantissa}e${sign}${String(Math.abs(numericExponent)).padStart(2, '0')}`;
	}
	const decimalPlaces = Math.max(0, SIGNIFICANT_DIGITS - exponent - 1);
	return value.toFixed(decimalPlaces).replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1');
}

function interpolateClamped(x, start, end, values) {
	if (x <= start) return values[0];
	if (x >= end) return values.at(-1);
	const coordinate = ((x - start) / (end - start)) * (values.length - 1);
	const lower = Math.floor(coordinate);
	const fraction = coordinate - lower;
	return values[lower] * (1 - fraction) + values[lower + 1] * fraction;
}

export function rayleighScatteringSpectrum() {
	const temperatureCorrection = 273.16 / (273.16 + 15);
	const corrected = PENNDORF_SCATTERING_PER_METER_AT_0C.map((value) => value * temperatureCorrection);
	return Object.freeze(FULL_WAVELENGTHS_NM.map((wavelength) => interpolateClamped(wavelength, 360, 830, corrected)));
}

export function groundAlbedoSpectrum() {
	return Object.freeze(
		FULL_WAVELENGTHS_NM.map((wavelength) => interpolateClamped(wavelength, 360, 800, GRASS_ALBEDO)),
	);
}

export function mieExtinctionSpectrum(alpha, beta) {
	return Object.freeze(
		FULL_WAVELENGTHS_NM.map(
			(wavelength) => (beta * (wavelength / 1000) ** -alpha) / (MATCHED_ATMOSPHERE.aerosolScaleHeightKm * 1000),
		),
	);
}

function altitudeKm(layerIndex) {
	const layerCount = MATCHED_ATMOSPHERE.layerCount;
	if (layerIndex === layerCount) return 0;
	const atmosphereHeightMeters = MATCHED_ATMOSPHERE.atmosphereTopKm * 1000;
	const scaleHeightMeters = MATCHED_ATMOSPHERE.rayleighScaleHeightKm * 1000;
	const massPerLayer = (1 - Math.exp(-atmosphereHeightMeters / scaleHeightMeters)) / layerCount;
	return (-scaleHeightMeters * Math.log(1 - (layerCount - layerIndex) * massPerLayer)) / 1000;
}

function legendre(order, x) {
	if (order === 0) return 1;
	if (order === 1) return x;
	let previousPrevious = 1;
	let previous = x;
	for (let currentOrder = 2; currentOrder <= order; currentOrder += 1) {
		const current = ((2 * currentOrder - 1) * x * previous - (currentOrder - 1) * previousPrevious) / currentOrder;
		previousPrevious = previous;
		previous = current;
	}
	return previous;
}

function cornetteShanks(g, mu) {
	const normalization = ((3 / (8 * Math.PI)) * (1 - g * g)) / (2 + g * g);
	return (normalization * (1 + mu * mu)) / (1 + g * g - 2 * g * mu) ** 1.5;
}

export function phaseFunctionMoments(g) {
	return Object.freeze(
		Array.from({length: MATCHED_ATMOSPHERE.phaseMomentCount}, (_, order) => {
			let sum = 0;
			for (let sample = 0; sample < 1000; sample += 1) {
				const mu = (sample + 0.5) / 1000;
				sum += legendre(order, mu) * cornetteShanks(g, mu);
			}
			return sum / 2000;
		}),
	);
}

function lines(values) {
	return `${values.join('\n')}\n`;
}

export function buildSupportFileMap(parameters = PUBLISHED.coarse) {
	const {alpha, beta, g} = parameters;
	const files = new Map();
	const altitudes = Array.from({length: MATCHED_ATMOSPHERE.layerCount + 1}, (_, index) => altitudeKm(index));
	const rayleigh = rayleighScatteringSpectrum();
	const mieExtinction = mieExtinctionSpectrum(alpha, beta);
	const moments = phaseFunctionMoments(g);
	const albedo = groundAlbedoSpectrum();

	files.set(
		'solar_spectrum.txt',
		lines(
			FULL_WAVELENGTHS_NM.map(
				(wavelength, index) => `${cppDefaultFloat(wavelength)} ${cppDefaultFloat(SOLAR_IRRADIANCE[index])}`,
			),
		),
	);

	files.set(
		'atmosphere.txt',
		lines(
			altitudes.map((altitude) => {
				const relativeDensity = Math.exp(-altitude / MATCHED_ATMOSPHERE.rayleighScaleHeightKm);
				return [
					cppDefaultFloat(altitude),
					cppDefaultFloat(1013 * relativeDensity),
					'288',
					cppDefaultFloat(2.545818e19 * relativeDensity),
				].join(' ');
			}),
		),
	);

	const altitudeHeader = altitudes.map(cppDefaultFloat).join(' ');
	const molecularScattering = [altitudeHeader];
	const molecularAbsorption = [altitudeHeader];
	for (let wavelengthIndex = 0; wavelengthIndex < FULL_WAVELENGTHS_NM.length; wavelengthIndex += 1) {
		const scatteringRow = [cppDefaultFloat(FULL_WAVELENGTHS_NM[wavelengthIndex])];
		const absorptionRow = [cppDefaultFloat(FULL_WAVELENGTHS_NM[wavelengthIndex])];
		for (let layer = 0; layer < MATCHED_ATMOSPHERE.layerCount; layer += 1) {
			const upperDensity = Math.exp(-altitudes[layer] / MATCHED_ATMOSPHERE.rayleighScaleHeightKm);
			const lowerDensity = Math.exp(-altitudes[layer + 1] / MATCHED_ATMOSPHERE.rayleighScaleHeightKm);
			const opticalDepth =
				rayleigh[wavelengthIndex] *
				MATCHED_ATMOSPHERE.rayleighScaleHeightKm *
				1000 *
				(lowerDensity - upperDensity);
			scatteringRow.push(cppDefaultFloat(opticalDepth));
			absorptionRow.push('0.0');
		}
		molecularScattering.push(scatteringRow.join(' '));
		molecularAbsorption.push(absorptionRow.join(' '));
	}
	files.set('molecular_scattering.txt', lines(molecularScattering));
	files.set('molecular_absorption.txt', lines(molecularAbsorption));

	const aerosolIndex = [];
	for (let layer = 0; layer <= MATCHED_ATMOSPHERE.layerCount; layer += 1) {
		const filename = `aerosol_properties_${layer}.txt`;
		aerosolIndex.push(`${cppDefaultFloat(altitudes[layer])} ${filename}`);
		const layerDensity = Math.exp(-altitudes[layer] / MATCHED_ATMOSPHERE.aerosolScaleHeightKm);
		const layerRows = FULL_WAVELENGTHS_NM.map((wavelength, wavelengthIndex) => {
			const extinctionPerKm = layer === 0 ? 0 : mieExtinction[wavelengthIndex] * layerDensity * 1000;
			return [
				cppDefaultFloat(wavelength),
				cppDefaultFloat(extinctionPerKm),
				cppDefaultFloat(MATCHED_ATMOSPHERE.aerosolSingleScatteringAlbedo),
				...moments.map(cppDefaultFloat),
			].join(' ');
		});
		files.set(filename, lines(layerRows));
	}
	files.set('aerosol_properties.txt', lines(aerosolIndex));

	files.set(
		'albedo.txt',
		lines(
			FULL_WAVELENGTHS_NM.map(
				(wavelength, index) => `${cppDefaultFloat(wavelength)} ${cppDefaultFloat(albedo[index])}`,
			),
		),
	);

	files.set(
		'model.txt',
		[
			'#source irradiance',
			'source solar solar_spectrum.txt per_nm',
			`wavelength ${cppDefaultFloat(FULL_WAVELENGTHS_NM[0])} ${cppDefaultFloat(FULL_WAVELENGTHS_NM.at(-1))}`,
			'',
			'#atmosphere profile',
			'atmosphere_file atmosphere.txt',
			`earth_radius ${cppDefaultFloat(MATCHED_ATMOSPHERE.earthRadiusKm)}`,
			'',
			'#molecular properties',
			'mol_tau_file sca molecular_scattering.txt',
			'mol_tau_file abs molecular_absorption.txt',
			'mol_abs_param none',
			'no_absorption mol',
			'rayleigh_depol 0.0',
			'crs_model rayleigh Penndorf',
			'',
			'#aerosol properties',
			'aerosol_default',
			'aerosol_file explicit aerosol_properties.txt',
			'disort_intcor moments',
			'',
			'#ground properties',
			'albedo_file albedo.txt',
			'',
			'#solver and output options',
			'pseudospherical',
			'output_process per_nm',
			'output_user lambda uu',
			'quiet',
			'',
		].join('\n'),
	);

	return files;
}

export function buildCaseInput(condition) {
	if (!condition || !FIXED_CONDITIONS.some((item) => item.id === condition.id)) {
		throw new TypeError('A pinned B3 fixed condition is required.');
	}
	const zeniths = DIRECTION_CONTRACT.uvspecViewZenithsDeg;
	const azimuths = DIRECTION_CONTRACT.uvspecViewAzimuthsDeg;
	return [
		'include model.txt',
		`sza ${cppDefaultFloat(condition.sunZenithDeg)}`,
		`phi0 ${cppDefaultFloat(condition.sunAzimuthDeg)}`,
		`umu ${zeniths.map((zenith) => cppDefaultFloat(-Math.cos((zenith * Math.PI) / 180))).join(' ')}`,
		`phi ${azimuths.map(cppDefaultFloat).join(' ')}`,
		'',
	].join('\n');
}

export function writeSupportFiles(directory, parameters = PUBLISHED.coarse) {
	mkdirSync(directory, {recursive: true});
	const files = buildSupportFileMap(parameters);
	for (const [relativePath, content] of files) {
		const destination = join(directory, relativePath);
		mkdirSync(dirname(destination), {recursive: true});
		writeFileSync(destination, content, 'utf8');
	}
	return Object.freeze({directory: resolve(directory), fileCount: files.size});
}

export function fingerprintUvspecExecutable({uvspecPath, wslUser = null}) {
	if (typeof uvspecPath !== 'string' || uvspecPath.length === 0) {
		throw new TypeError('An explicit uvspec executable path is required.');
	}
	if (!uvspecPath.startsWith('/')) {
		return createHash('sha256').update(readFileSync(uvspecPath)).digest('hex');
	}
	const execution = spawnSync(
		'wsl.exe',
		[...(wslUser ? ['--user', wslUser] : []), '--exec', 'sha256sum', '--', uvspecPath],
		{encoding: 'utf8', windowsHide: true},
	);
	if (execution.error) {
		throw new Error(`Could not fingerprint uvspec: ${execution.error.message}`);
	}
	if (execution.status !== 0) {
		throw new Error(
			[`Could not fingerprint uvspec; sha256sum exited ${execution.status}.`, execution.stderr?.trim()]
				.filter(Boolean)
				.join(' '),
		);
	}
	const match = execution.stdout.trim().match(/^([0-9a-f]{64})(?:\s|$)/i);
	if (!match) throw new Error('Could not parse the uvspec SHA-256 fingerprint.');
	return match[1].toLowerCase();
}

export function executeFixedCases({
	uvspecPath,
	workDirectory,
	conditions = FIXED_CONDITIONS,
	parameters = PUBLISHED.coarse,
	wslUser = null,
}) {
	if (typeof uvspecPath !== 'string' || uvspecPath.length === 0) {
		throw new TypeError('An explicit uvspec executable path is required.');
	}
	writeSupportFiles(workDirectory, parameters);
	const executions = [];
	const wslExecutable = uvspecPath.startsWith('/');
	const wslWorkDirectory = wslExecutable
		? workDirectory.replace(/^([A-Za-z]):/, (_, drive) => `/mnt/${drive.toLowerCase()}`).replaceAll('\\', '/')
		: null;
	for (const condition of conditions) {
		const inputFilename = `${condition.id}.inp`;
		const outputFilename = `${condition.id}.out`;
		const input = buildCaseInput(condition);
		writeFileSync(join(workDirectory, inputFilename), input, 'utf8');
		const execution = wslExecutable
			? spawnSync(
					'wsl.exe',
					[
						...(wslUser ? ['--user', wslUser] : []),
						'--cd',
						wslWorkDirectory,
						'--exec',
						uvspecPath,
						'-i',
						inputFilename,
					],
					{encoding: 'utf8', windowsHide: true},
				)
			: spawnSync(uvspecPath, ['-i', inputFilename], {cwd: workDirectory, encoding: 'utf8', windowsHide: true});
		if (execution.error) {
			throw new Error(`uvspec failed to start for ${condition.id}: ${execution.error.message}`);
		}
		if (execution.status !== 0) {
			throw new Error(
				[`uvspec failed for ${condition.id} with exit code ${execution.status}.`, execution.stderr?.trim()]
					.filter(Boolean)
					.join(' '),
			);
		}
		writeFileSync(join(workDirectory, outputFilename), execution.stdout, 'utf8');
		executions.push(
			Object.freeze({
				conditionId: condition.id,
				inputPath: resolve(workDirectory, inputFilename),
				inputSha256: createHash('sha256').update(input).digest('hex'),
				outputPath: resolve(workDirectory, outputFilename),
				outputSha256: createHash('sha256').update(execution.stdout).digest('hex'),
				launcher: wslExecutable ? `wsl.exe${wslUser ? ` --user ${wslUser}` : ''} --exec` : 'native',
				stderr: execution.stderr?.trim() ?? '',
			}),
		);
	}
	return Object.freeze(executions);
}
