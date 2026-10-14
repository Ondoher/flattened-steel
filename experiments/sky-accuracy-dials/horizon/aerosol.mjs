import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import path from 'node:path';
import {createRun, identity, readRepository, verifyRun} from '../io/files.mjs';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../src/algorithm32/profiles/index.js';
import {ColorResetSlope078P2ColorDisplayModel} from '../../../src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js';
import {aerosolMaterial, aerosolPhase, validateAerosolTable} from './aerosol-optics.mjs';
import {ciePath, colorimetry} from './diagnosis-color.mjs';
import {transport} from './diagnosis-transport.mjs';

const started = Date.now(), root = 'tmp/experiments/sky-accuracy-dials/runs/';
const materialRun = `${root}00235-aerosol-screen`, geometryRun = `${root}00246-h5-n1-geometry`, observationRun = `${root}00239-horizon-stages`;
const parents = [materialRun, geometryRun, observationRun].map(verifyRun);
const materialPath = `${materialRun}/inputs.json.gz`, geometryPath = `${geometryRun}/geometry.json`;
const observationPaths = ['local', 'distant'].map(mode => `${observationRun}/${mode}-observation.json`);
parents.push(...[materialPath, geometryPath, ...observationPaths].map(file => identity(file)));
// Authenticate the read-only display/profile implementation as well as experiment source.
const visited = new Set();
/** Record the relative static import closure, with checked reads for every member.
 * @param {string} file @returns {void}
 */
function implementationParents(file) {
    if (visited.has(file)) return;
    visited.add(file);
    const bytes = readRepository(file);
    parents.push(identity(file, bytes));
    for (const match of bytes.toString().matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g)) {
        implementationParents(path.posix.normalize(path.posix.join(path.posix.dirname(file), match[1])));
    }
}
implementationParents('src/algorithm32/profiles/index.js');
implementationParents('src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js');
parents.push(identity(ciePath));
const replayRun = process.argv[2];
const replay = replayRun ? (parents.push(verifyRun(replayRun), identity(`${replayRun}/aerosol.json`)), JSON.parse(readRepository(`${replayRun}/aerosol.json`).toString())) : null;
const optical = JSON.parse(gunzipSync(readRepository(materialPath)).toString()).optical;
/** @type {HorizonAerosolParentRow[]} */
const physical = JSON.parse(readRepository(geometryPath).toString()).rows.filter(row => ['flat-finite', 'sphere-actual-irradiance'].includes(row.name));
assert.equal(physical.length, 18);
const lux = observationPaths.map(file => JSON.parse(readRepository(file).toString()).facts.uniforms.uColorResetTotalHorizontalIlluminanceLux);
const wavelengths = NATIVE_15_SPECTRAL_BASIS.channels.map(channel => channel.center.value);
const material = aerosolMaterial(optical.bands, wavelengths, 0.8);
const names = ['baseline', 'phase', 'albedo', 'both'];
const display = new ColorResetSlope078P2ColorDisplayModel();
const run = createRun('h7-aerosol', {parents,
    operation: 'H7 continuous N1 measured aerosol phase/SSA factorial at fixed extinction; matched Native15 flat/spherical rays, independent CIE color and fixed-baseline-illuminance diagnostic display.',
    parameters: {geometries: ['flat-finite', 'sphere-actual-irradiance'], elevationsDegrees: [0.25, 3, 20], headingsDegrees: [0, 90, 180], cases: names,
        viewIntervals: [2048, 4096], columnNodes: [64, 128], refinementRelativeTolerance: 1e-4, baselineParityTolerance: 1e-10,
        maximumMilliseconds: 180000, maximumEvidenceBytes: 4 * 1024 ** 2, unsupportedCenters: material.unsupportedCenters,
        shortwavePolicy: 'Below 440 nm retain baseline CS g=0.7 and SSA=0.8; no extrapolation.',
        prediction: 'Joint intervention increases raw R/B for flat 3-degree away-Sun N1; not an all-ray or whole-N4 prediction.',
        interaction: 'I=(SSA(lambda)/0.8-1)*(L_phase-L_baseline), with fixed extinction.',
        display: 'Installed midpoint CIE convention and p2 response at each geometry baseline lux; separate equal-Y chips are diagnostic only.',
        retrieval: optical.selected}});

/** Relative maximum with a radiance floor; retains signed differences in the result.
 * @param {number[]} a @param {number[]} b @returns {number}
 */
function relative(a, b) {return Math.max(...a.map((value, index) => Math.abs(value - b[index]) / Math.max(1e-12, Math.abs(b[index]))));}

/** Installed display response, including its own encoding exactly once.
 * @param {number[]} rgb @param {number} illuminance @returns {number[]}
 */
function displayed(rgb, illuminance) {
    assert.equal(rgb.length, 3);
    return [...display.linearSrgbToDisplayRgb(/** @type {HorizonLinearRgb} */ (rgb), {value: illuminance, units: 'lux'})];
}

/** Encode the sampled diagnostic colors as an SVG chart, never a full-scene render.
 * @param {HorizonAerosolRow[]} rows @param {boolean} equalY @returns {string}
 */
function chart(rows, equalY) {
    const content = ['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="600" viewBox="0 0 1000 600">',
        '<rect width="1000" height="600" fill="#171b20"/>', '<g fill="#eeeeee" font-family="sans-serif">',
        `<text x="20" y="30" font-size="21">H7 aerosol response: away-Sun sampled rays, N1 in both geometries</text>`,
        `<text x="20" y="56" font-size="14">${equalY ? 'Equal baseline luminance per ray: hue diagnostic only' : 'Physical radiance at fixed baseline display illuminance'}; these are not app screenshots.</text>`];
    const labels = ['Baseline', 'Measured phase', 'Measured SSA', 'Both'];
    labels.forEach((label, column) => content.push(`<text x="${160 + 205 * column}" y="91" font-size="16">${label}</text>`));
    ['flat-finite', 'sphere-actual-irradiance'].forEach((geometry, group) => {
        const top = 115 + 225 * group;
        content.push(`<text x="20" y="${top + 17}" font-size="15">${group === 0 ? 'Flat / local' : 'Sphere / distant'}</text>`);
        [20, 3, 0.25].forEach((elevation, rowIndex) => {
            const y = top + rowIndex * 60;
            content.push(`<text x="30" y="${y + 44}" font-size="14">${elevation} deg</text>`);
            names.forEach((name, column) => {
                const row = rows.find(item => item.geometry === geometry && item.elevationDegrees === elevation && item.headingDegrees === 180 && item.case === name);
                assert.ok(row);
                const rgb = equalY ? row.equalLuminanceDisplay : row.display;
                assert.ok(rgb.every(value => Number.isFinite(value) && value >= 0 && value <= 1));
                const hex = rgb.map(value => Math.round(value * 255).toString(16).padStart(2, '0')).join('');
                content.push(`<rect x="${150 + 205 * column}" y="${y + 25}" width="190" height="48" fill="#${hex}"/>`);
            });
        });
    });
    content.push('<text x="20" y="567" font-size="13">Regional retrieval; wavelengths below 440 nm unchanged. Fixed extinction and source/geometry.</text>',
        '<text x="20" y="589" font-size="13">Not San Jose calibration, an N4 comparison, or a production cache change.</text>', '</g></svg>');
    return content.join('\n');
}

try {
    // The old independent material representation is replayed at its supported target bands.
    let maximumMaterialParity = 0;
    for (const retained of optical.values.filter(value => !value.extrapolated)) {
        const replay = aerosolMaterial(optical.bands, [retained.wavelength], 0.8);
        assert.ok(Math.abs(replay.albedos[0] - retained.albedo) < 1e-12);
        for (const cosine of [-1, -0.2539451275576396, 0, 0.9, 1]) {
            maximumMaterialParity = Math.max(maximumMaterialParity, relative([aerosolPhase(replay.phaseTables[0], cosine)], [aerosolPhase(retained, cosine)]));
        }
    }
    assert.ok(maximumMaterialParity < 1e-12);
    for (const band of optical.bands) {
        const exact = aerosolMaterial(optical.bands, [band.wavelength], 0.8);
        assert.equal(exact.albedos[0], band.albedo); assert.deepEqual(exact.phaseTables[0].pdf, band.pdf);
        assert.ok(aerosolPhase(band, 1) > aerosolPhase(band, 0) && aerosolPhase(band, 1) > aerosolPhase(band, -1), 'Forward scattering is cosine +1.');
    }
    assert.equal(material.unsupportedCenters.length, 3);
    assert.ok(material.phaseTables.slice(0, 3).every(value => value === null));
    assert.ok(material.albedos.slice(0, 3).every(value => value === 0.8));
    const masses = material.phaseTables.filter(Boolean).map(validateAerosolTable);
    /** @type {HorizonAerosolRow[]} */
    const rows = [];
    let maximumRefinementRelative = 0, maximumBaselineRelative = 0, maximumInteractionAbsolute = 0;
    for (const parent of physical) {
        const geometryLux = lux[parent.name === 'flat-finite' ? 0 : 1];
        const baselineY = colorimetry(parent.spectrum, 'midpoint', false).luminanceCdPerM2;
        const group = [];
        for (const name of names) {
            assert.ok(Date.now() - started < 180000, 'H7 CPU budget exhausted; no automatic retry.');
            run.progress('compute', `${parent.name}, ${parent.elevationDegrees} degrees, heading ${parent.headingDegreesFromLocalSun}, ${name}.`, rows.length, 72);
            /** @type {HorizonTransportInput} */
            const inputs = {...parent.inputs};
            if (name === 'phase' || name === 'both') inputs.aerosolPhaseTables = material.phaseTables;
            if (name === 'albedo' || name === 'both') inputs.aerosolAlbedos = material.albedos;
            const low = transport(inputs, 2048, 64), high = transport(inputs, 4096, 128);
            const refinement = relative(low.spectrum, high.spectrum);
            assert.ok(refinement < 1e-4); maximumRefinementRelative = Math.max(maximumRefinementRelative, refinement);
            if (name === 'baseline') {
                const parity = relative(high.spectrum, parent.spectrum);
                assert.ok(parity < 1e-10); maximumBaselineRelative = Math.max(maximumBaselineRelative, parity);
            }
            assert.deepEqual(high.rayleigh, parent.rayleigh);
            assert.deepEqual(high.spectrum.slice(0, 3), parent.spectrum.slice(0, 3));
            const midpoint = colorimetry(high.spectrum, 'midpoint', false), binIntegrated = colorimetry(high.spectrum, 'bin-integrated');
            const equalLuminanceScale = baselineY / midpoint.luminanceCdPerM2;
            const row = {geometry: parent.name, elevationDegrees: parent.elevationDegrees, headingDegrees: parent.headingDegreesFromLocalSun, case: name,
                spectrum: high.spectrum, rayleigh: high.rayleigh, mie: high.mie, midpoint, binIntegrated,
                illuminanceLux: geometryLux, display: displayed(midpoint.rgb, geometryLux), equalLuminanceScale,
                equalLuminanceDisplay: displayed(midpoint.rgb.map(value => value * equalLuminanceScale), geometryLux), maximumRefinementRelative: refinement};
            rows.push(row); group.push(row);
        }
        const [baseline, phase, albedo, both] = group;
        const interaction = both.spectrum.map((value, channel) => value - phase.spectrum[channel] - albedo.spectrum[channel] + baseline.spectrum[channel]);
        const prediction = phase.spectrum.map((value, channel) => (material.albedos[channel] / 0.8 - 1) * (value - baseline.spectrum[channel]));
        const interactionResidual = Math.max(...interaction.map((value, channel) => Math.abs(value - prediction[channel])));
        assert.ok(interactionResidual < 1e-10); maximumInteractionAbsolute = Math.max(maximumInteractionAbsolute, interactionResidual);
        // The same extinction means the factorial is exactly linear in the SSA factor at N1.
        both.interaction = {observed: interaction, predicted: prediction, maximumAbsoluteResidual: interactionResidual};
        run.guard();
    }
    const witness = rows.filter(row => row.geometry === 'flat-finite' && row.elevationDegrees === 3 && row.headingDegrees === 180);
    const predictionPassed = witness[3].midpoint.redBlueRatio > witness[0].midpoint.redBlueRatio;
    if (replay) assert.deepEqual(rows, replay.rows, 'Provenance-only repeat must retain every numerical result.');
    const result = {schemaId: 'horizon-aerosol-response-v1', parents, wavelengths, material, physicalParents: physical,
        retrieval: optical.selected, rows, checks: {maximumMaterialParity, masses, maximumRefinementRelative, maximumBaselineRelative,
            maximumInteractionAbsoluteResidual: maximumInteractionAbsolute, unsupportedChannelsUnchanged: true, rayleighUnchanged: true, forwardCosineVerified: true,
            exactReplayVerified: replay ? replayRun : null, predictionPassed},
        elapsedMillisecondsBeforeRetention: Date.now() - started};
    const artifacts = [run.write('aerosol.json', result), run.write('comparison.svg', chart(rows, false)), run.write('equal-luminance.svg', chart(rows, true))];
    assert.ok(artifacts.reduce((sum, file) => sum + file.byteLength, 0) < 4 * 1024 ** 2);
    assert.ok(Date.now() - started < 180000, 'H7 budget includes setup and artifact retention.');
    const seal = run.finish(predictionPassed ? 'accepted' : 'rejected', {rows: rows.length, checks: result.checks, elapsedMillisecondsThroughRetention: Date.now() - started});
    verifyRun(run.path); console.log(JSON.stringify({run: run.path, seal, checks: result.checks}));
} catch (error) {
    run.finish('failed', {error: String(error), elapsedMilliseconds: Date.now() - started});
    throw error;
}
