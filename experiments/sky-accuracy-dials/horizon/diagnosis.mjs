import assert from 'node:assert/strict';
import {createRun, identity, readRepository, verifyRun} from '../io/files.mjs';
import {ciePath, colorimetry, colorControls} from './diagnosis-color.mjs';
import {transport, miePhase, gaussRule} from './diagnosis-transport.mjs';
import {SphericalEarthGeometry} from '../../../src/algorithm32/implementation/spherical-earth/SphericalEarthGeometry.js';

/** Read an immutable, boundary-checked JSON artifact.
 * @param {string} path @returns {any} Parsed artifact.
 */
function read(path) {return JSON.parse(readRepository(path).toString('utf8'));}

/** H3: independently project the retained spectral evidence, without cache execution.
 * @returns {void} Seals a new color-attribution run.
 */
function colorAudit() {
    const paired = 'tmp/experiments/sky-accuracy-dials/runs/00239-horizon-stages';
    const reference = 'tmp/experiments/sky-accuracy-dials/runs/00241-horizon-species';
    const parents = [verifyRun(paired), verifyRun(reference), identity(ciePath),
        identity('references/downloads/cie-1931-2deg/CIE_xyz_1931_2deg.csv_metadata.json'),
        ...['diagnosis.mjs', 'diagnosis-color.mjs'].map(file => identity(`experiments/sky-accuracy-dials/horizon/${file}`)),
        identity('src/algorithm32/profiles/native-15/consts.js')];
    const recipe = {parents, operation: 'H3 independent original-CIE CSV quadrature to XYZ then declared D65 linear sRGB; separate midpoint parity, W3C matrix rounding and constant-within-bin matching-function integration.',
        parameters: {maximumMilliseconds: 120000, maximumEvidenceBytes: 4 * 1024 ** 2, midpointRelativeTolerance: 1e-8,
            prediction: 'Midpoint and declared rounded matrix reproduce observed RGB within 1e-8 relative; independent matrix/bin integration may move chromaticity, but no unresolved spectrum is recovered.',
            sources: ['https://cie.co.at/datatable/cie-1931-colour-matching-functions-2-degree-observer', 'https://www.w3.org/TR/2026/CRD-css-color-4-20261009/#color-conversion-code'],
            limitations: 'Uses same published CIE data source but independent raw CSV parser, quadrature and matrix. Bin integration assumes constant within-bin spectral density; actual spectral discretization remains unqualified.'}};
    const run = createRun('h3-color', recipe), started = Date.now();
    try {
        const controls = colorControls();
        const rows = [];
        for (const mode of ['local', 'distant']) {
            const path = `${paired}/${mode}-observation.json`; parents.push(identity(path));
            const observation = read(path);
            for (const ray of observation.rays) {
                if (ray.stages[4][0] !== 0) continue;
                const spectrum = ray.stages.slice(5, 9).flat().slice(0, 15);
                const midpoint = colorimetry(spectrum, 'midpoint', false);
                const observed = ray.stages[2].slice(0, 3);
                rows.push({mode, uv: ray.uv, elevationDegrees: ray.elevationDegrees, spectrum, observed, midpoint,
                    preciseMatrix: colorimetry(spectrum), binIntegrated: colorimetry(spectrum, 'bin-integrated'),
                    signedParityDifference: midpoint.rgb.map((value, index) => value - observed[index])});
            }
        }
        const path = `${reference}/reference.json`; parents.push(identity(path));
        const continuous = read(path);
        const referenceRows = continuous.rows.map(row => ({elevationDegrees: row.elevationDegrees,
            midpoint: colorimetry(row.high), binIntegrated: colorimetry(row.high, 'bin-integrated'),
            rayleigh: colorimetry(row.components.rayleighValues, 'bin-integrated'), mie: colorimetry(row.components.mieValues, 'bin-integrated')}));
        // Float32 shader accumulation has its own tolerance; test the independent
        // arithmetic against the retained binary64 weight projection separately.
        const maximumMidpointRelative = Math.max(...continuous.rows.flatMap(row => colorimetry(row.high, 'midpoint', false).rgb.map((value, index) => Math.abs(value - row.referenceRgb[index]) / Math.max(1e-12, Math.abs(row.referenceRgb[index])))));
        assert.ok(maximumMidpointRelative < 1e-8);
        const maximumGpuRelative = Math.max(...rows.flatMap(row => row.signedParityDifference.map((value, index) => Math.abs(value) / Math.max(1e-12, Math.abs(row.observed[index])))));
        assert.ok(maximumGpuRelative < 1e-4);
        const result = {controls, rows, referenceRows, maximumMidpointRelative, maximumGpuRelative, elapsedMilliseconds: Date.now() - started};
        assert.ok(result.elapsedMilliseconds < 120000);
        assert.ok(Buffer.byteLength(JSON.stringify(result)) < 4 * 1024 ** 2);
        run.write('color.json', result); run.finish('accepted', {rows: rows.length, maximumMidpointRelative, maximumGpuRelative, elapsedMilliseconds: result.elapsedMilliseconds});
        verifyRun(run.path);
        console.log(JSON.stringify({run: run.path, maximumMidpointRelative, maximumGpuRelative, neutral: referenceRows.find(row => row.elevationDegrees === 3)}));
    } catch (error) {run.finish('failed', {error: String(error)}); throw error;}
}

/** H4: trace the existing continuous local equation into physical path contributions.
 * @returns {void} Seals small path/species records, without changing earlier runs.
 */
function pathAudit() {
    const parent = 'tmp/experiments/sky-accuracy-dials/runs/00241-horizon-species';
    const parents = [verifyRun(parent), identity(`${parent}/reference.json`), identity(ciePath),
        ...['diagnosis.mjs', 'diagnosis-transport.mjs', 'diagnosis-color.mjs'].map(file => identity(`experiments/sky-accuracy-dials/horizon/${file}`)),
        identity('experiments/sky-accuracy-dials/continuation/direct-solver/math.mjs')];
    const run = createRun('h4-path', {parents, operation: 'H4 matched continuous local N1 path/species decomposition; exact flat source/view exponential columns and 4096 Simpson intervals.',
        parameters: {elevations: [0.05, 3, 20], maximumMilliseconds: 120000, maximumEvidenceBytes: 2 * 1024 ** 2,
            relativeParityTolerance: 1e-10, additiveTolerance: 1e-12, prediction: 'The neutral band adds nearby warm Mie and blue Rayleigh contributions, with source/view attenuation and dilution explicitly accounted for; no new color operation.'}});
    const started = Date.now();
    try {
        const prior = read(`${parent}/reference.json`);
        const rows = prior.rows.filter(row => [0.05, 3, 20].includes(row.elevationDegrees)).map(row => {
            const inputs = {...row.inputs, geometry: /** @type {const} */ ('flat'), sourceKind: /** @type {const} */ ('finite'), sourceDirection: [0, 0, 1], radius: 6360000, topAltitude: 100000, incidentScale: 1};
            const result = transport(inputs, 4096, 64, true);
            const maximumParityRelative = Math.max(...row.high.map((value, channel) => Math.abs(result.spectrum[channel] - value) / value));
            assert.ok(maximumParityRelative < 1e-10);
            return {elevationDegrees: row.elevationDegrees, inputs, result, maximumParityRelative,
                totalColor: colorimetry(result.spectrum, 'bin-integrated'), rayleighColor: colorimetry(result.rayleigh, 'bin-integrated'), mieColor: colorimetry(result.mie, 'bin-integrated'),
                stratumColors: result.strata.map(segment => ({lowMeters: segment.lowMeters, highMeters: segment.highMeters,
                    rayleigh: colorimetry(segment.rayleigh, 'bin-integrated'), mie: colorimetry(segment.mie, 'bin-integrated')}))};
        });
        const result = {rows, elapsedMilliseconds: Date.now() - started};
        assert.ok(result.elapsedMilliseconds < 120000 && Buffer.byteLength(JSON.stringify(result)) < 2 * 1024 ** 2);
        run.write('path.json', result); run.finish('accepted', {rows: rows.length, elapsedMilliseconds: result.elapsedMilliseconds}); verifyRun(run.path);
        console.log(JSON.stringify({run: run.path, rows: rows.map(row => ({elevation: row.elevationDegrees, parity: row.maximumParityRelative, color: row.totalColor, nearby: row.stratumColors.slice(0, 7)}))}));
    } catch (error) {run.finish('failed', {error: String(error)}); throw error;}
}

/** H5: small same-order contrasts with explicit geometry/source changes.
 * @returns {void} Seals matched continuous N1 rows and their refinement checks.
 */
function geometryAudit() {
    const parent = 'tmp/experiments/sky-accuracy-dials/runs/00241-horizon-species';
    const paired = 'tmp/experiments/sky-accuracy-dials/runs/00239-horizon-stages';
    const prior = read(`${parent}/reference.json`), observation = read(`${paired}/distant-observation.json`);
    const geometry = new SphericalEarthGeometry({bottomRadius: {value: 6360000, units: 'meters'}, topRadius: {value: 6420000, units: 'meters'}, observerHeight: {value: 5, units: 'meters'}});
    const distantDirection = [...geometry.resolveDistantSunSceneState(observation.facts.state.observation).directionToSourceModel];
    const localVector = prior.physical.sourcePosition.map((value, axis) => value - (axis === 2 ? 5 : 0));
    const localDistance = Math.hypot(...localVector), localDirection = localVector.map(value => value / localDistance);
    const matchedIncidentScale = (prior.physical.referenceDistance / localDistance) ** 2;
    const parents = [verifyRun(parent), verifyRun(paired), identity(`${parent}/reference.json`), identity(`${paired}/distant-observation.json`), identity(ciePath),
        identity('src/algorithm32/implementation/spherical-earth/SphericalEarthGeometry.js'),
        ...['diagnosis.mjs', 'diagnosis-transport.mjs', 'diagnosis-color.mjs'].map(file => identity(`experiments/sky-accuracy-dials/horizon/${file}`)),
        identity('experiments/sky-accuracy-dials/continuation/direct-solver/math.mjs')];
    const run = createRun('h5-n1-geometry', {parents, operation: 'H5 matched Native15 continuous N1 across finite/parallel source, flat/spherical medium, top altitude and actual distant source placement; change one declared boundary in each adjacent pair.',
        parameters: {elevations: [0.25, 3, 20], headingsDegrees: [0, 90, 180], localDirection, distantDirection, matchedIncidentScale,
            outerIntervals: [2048, 4096], curvedColumnNodes: [64, 128], refinementRelativeTolerance: 1e-4,
            maximumMilliseconds: 120000, maximumEvidenceBytes: 4 * 1024 ** 2,
            prediction: 'Replacing local finite illumination by matched parallel illumination retains a near-neutral 3-degree away-Sun band; source/geometry shifts can alter balance without a color-conversion defect.',
            limitation: 'N1 physical contrasts only; current distant N4 has no authenticated matching pure-order split, so no N4 accuracy or order-increment attribution is claimed.'}});
    const started = Date.now();
    try {
        const rows = [];
        for (const elevation of [0.25, 3, 20]) for (const heading of [0, 90, 180]) {
            const e = elevation * Math.PI / 180, h = heading * Math.PI / 180, horizontal = Math.hypot(localDirection[0], localDirection[1]);
            const x = localDirection[0] / horizontal, y = localDirection[1] / horizontal;
            const direction = [Math.cos(e) * (x * Math.cos(h) - y * Math.sin(h)), Math.cos(e) * (y * Math.cos(h) + x * Math.sin(h)), Math.sin(e)];
            /** @type {HorizonTransportInput} */
            const base = {...prior.physical, direction, geometry: 'flat', sourceKind: 'finite', sourceDirection: localDirection,
                radius: 6360000, topAltitude: 100000, incidentScale: matchedIncidentScale,
                length: prior.rows.find(row => row.elevationDegrees === elevation).inputs.length};
            /** @type {HorizonTransportInput[]} */
            const cases = [base, {...base, sourceKind: 'parallel'},
                {...base, sourceKind: 'parallel', geometry: 'spherical', length: undefined},
                {...base, sourceKind: 'parallel', geometry: 'spherical', length: undefined, topAltitude: 60000},
                {...base, sourceKind: 'parallel', geometry: 'spherical', length: undefined, topAltitude: 60000, sourceDirection: distantDirection},
                {...base, sourceKind: 'parallel', geometry: 'spherical', length: undefined, topAltitude: 60000, sourceDirection: distantDirection, incidentScale: 1}];
            const names = ['flat-finite', 'flat-parallel-matched', 'sphere-100km-matched', 'sphere-60km-matched', 'sphere-actual-direction', 'sphere-actual-irradiance'];
            for (let index = 0; index < cases.length; index++) {
                assert.ok(Date.now() - started < 120000, 'H5 CPU time cap reached.'); run.guard();
                const inputs = cases[index], low = transport(inputs, 2048, 64), high = transport(inputs, 4096, 128);
                const maximumRefinementRelative = Math.max(...high.spectrum.map((value, channel) => Math.abs(value - low.spectrum[channel]) / Math.max(1e-12, value)));
                assert.ok(maximumRefinementRelative < 1e-4, `H5 unresolved ${names[index]} ${elevation}/${heading}: ${maximumRefinementRelative}`);
                rows.push({name: names[index], elevationDegrees: elevation, headingDegreesFromLocalSun: heading, inputs,
                    length: high.length, spectrum: high.spectrum, rayleigh: high.rayleigh, mie: high.mie,
                    color: colorimetry(high.spectrum, 'bin-integrated'), maximumRefinementRelative});
            }
            run.progress('n1-geometry', `Completed elevation ${elevation}, local-Sun relative heading ${heading}.`, rows.length, 54);
        }
        const result = {rows, localDirection, distantDirection, matchedIncidentScale, elapsedMilliseconds: Date.now() - started};
        assert.ok(result.elapsedMilliseconds < 120000 && Buffer.byteLength(JSON.stringify(result)) < 4 * 1024 ** 2);
        run.write('geometry.json', result); run.finish('accepted', {rows: rows.length, maximumRefinementRelative: Math.max(...rows.map(row => row.maximumRefinementRelative)), elapsedMilliseconds: result.elapsedMilliseconds}); verifyRun(run.path);
        console.log(JSON.stringify({run: run.path, elapsedMilliseconds: result.elapsedMilliseconds, localDirection, distantDirection,
            selected: rows.filter(row => row.elevationDegrees === 3 && row.headingDegreesFromLocalSun === 180).map(row => ({name: row.name, color: row.color, refinement: row.maximumRefinementRelative}))}));
    } catch (error) {run.finish('failed', {error: String(error)}); throw error;}
}

/** H6: predeclared phase/albedo factorial with an analytic spectral interaction prediction.
 * @returns {void} Seals physical sensitivity evidence without fitting or production adoption.
 */
function assumptionAudit() {
    const parent = 'tmp/experiments/sky-accuracy-dials/runs/00245-h4-path';
    const parents = [verifyRun(parent), identity(`${parent}/path.json`), identity(ciePath),
        ...['diagnosis.mjs', 'diagnosis-transport.mjs', 'diagnosis-color.mjs'].map(file => identity(`experiments/sky-accuracy-dials/horizon/${file}`)),
        identity('experiments/sky-accuracy-dials/continuation/direct-solver/math.mjs')];
    const run = createRun('h6-phase-albedo', {parents, operation: 'H6 recomputed continuous local N1 factorial: g=0 versus g=0.7 Cornette-Shanks phase and albedo=1 versus 0.8 at fixed full extinction; predict spectral interaction before execution.',
        parameters: {elevations: [0.05, 3, 20], intervals: 4096, maximumMilliseconds: 120000, maximumEvidenceBytes: 2 * 1024 ** 2,
            interactionRelativeTolerance: 1e-10, interactionAbsoluteFloor: 1e-12,
            prediction: 'A=g0 warms the 3-degree away-Sun band into R>G>B while the 20-degree control remains blue; B=albedo1 is a smaller warm shift. I_AB = 0.25*(L_A-L_baseline) at each wavelength.',
            limitation: 'Uncalibrated physical sensitivities, not numerical accuracy improvements, actual aerosol estimates or proposed production settings. Zero g is not isotropic in this phase family.'}});
    const started = Date.now();
    try {
        const rule = gaussRule(128);
        const normalization = [0, 0.7].map(g => ({g, integral: 4 * Math.PI * rule.nodes.reduce((sum, node, index) => sum + rule.weights[index] * miePhase(2 * node - 1, g), 0)}));
        assert.ok(normalization.every(row => Math.abs(row.integral - 1) < 1e-10));
        assert.ok(miePhase(1, 0.7) > miePhase(-1, 0.7));
        assert.ok(Math.abs(miePhase(0.25, 0) - 3 * (1 + 0.25 ** 2) / (16 * Math.PI)) < 1e-15);
        const prior = read(`${parent}/path.json`);
        const rows = prior.rows.map(row => {
            assert.ok(Date.now() - started < 120000); run.guard();
            const cases = [row.inputs, {...row.inputs, g: 0}, {...row.inputs, albedo: 1}, {...row.inputs, g: 0, albedo: 1}];
            const names = ['baseline', 'A-g0', 'B-albedo1', 'AB'];
            const readings = cases.map((inputs, index) => {
                const result = transport(inputs, 4096);
                return {name: names[index], g: inputs.g, albedo: inputs.albedo, spectrum: result.spectrum,
                    rayleigh: result.rayleigh, mie: result.mie, color: colorimetry(result.spectrum, 'bin-integrated')};
            });
            const [baseline, a, b, ab] = readings;
            const baselineRelative = Math.max(...baseline.spectrum.map((value, channel) => Math.abs(value - row.result.spectrum[channel]) / value));
            assert.ok(baselineRelative < 1e-12);
            const interaction = baseline.spectrum.map((value, channel) => ab.spectrum[channel] - a.spectrum[channel] - b.spectrum[channel] + value);
            const prediction = baseline.spectrum.map((value, channel) => 0.25 * (a.spectrum[channel] - value));
            const maximumInteractionResidual = Math.max(...interaction.map((value, channel) => Math.abs(value - prediction[channel]) / Math.max(1e-12, Math.abs(prediction[channel]))));
            assert.ok(maximumInteractionResidual < 1e-10);
            const warm = rgb => rgb[0] > rgb[1] && rgb[1] > rgb[2];
            const predictedWarmOrderingPassed = row.elevationDegrees === 3 ? warm(a.color.rgb) : row.elevationDegrees === 20 ? a.color.rgb[2] > a.color.rgb[0] : null;
            return {elevationDegrees: row.elevationDegrees, readings, interaction, prediction, maximumInteractionResidual, baselineRelative, predictedWarmOrderingPassed,
                redBlueRatioChanges: readings.map(reading => reading.color.redBlueRatio - baseline.color.redBlueRatio)};
        });
        const result = {normalization, rows, elapsedMilliseconds: Date.now() - started};
        assert.ok(result.elapsedMilliseconds < 120000 && Buffer.byteLength(JSON.stringify(result)) < 2 * 1024 ** 2);
        run.write('assumptions.json', result);
        const predictionPassed = rows.every(row => row.predictedWarmOrderingPassed !== false);
        run.finish(predictionPassed ? 'accepted' : 'rejected', {predictionPassed, elapsedMilliseconds: result.elapsedMilliseconds}); verifyRun(run.path);
        console.log(JSON.stringify({run: run.path, predictionPassed, rows: rows.map(row => ({elevation: row.elevationDegrees, interactionResidual: row.maximumInteractionResidual,
            readings: row.readings.map(reading => ({name: reading.name, rgb: reading.color.rgb, xy: reading.color.xy, redBlueRatio: reading.color.redBlueRatio}))}))}));
    } catch (error) {run.finish('failed', {error: String(error)}); throw error;}
}

if (process.argv[2] === 'h3') colorAudit();
else if (process.argv[2] === 'h4') pathAudit();
else if (process.argv[2] === 'h5') geometryAudit();
else if (process.argv[2] === 'h6') assumptionAudit();
else throw new RangeError('Select a registered diagnosis stage.');
