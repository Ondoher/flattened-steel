import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {createRun, identity, readRepository, verifyRun} from '../io/files.mjs';

const started = Date.now(), root = 'tmp/experiments/sky-accuracy-dials/runs/';
/** @type {DialFileIdentity[]} */ const parents = [];
/** Authenticate an immutable producer before reading one of its JSON artifacts.
 * @param {string} name @param {string} file @returns {unknown} Parsed artifact.
 */
function read(name, file) {
    const base = root + name;
    if (!parents.some(p => p.path === base + '/sealed.json')) parents.push(verifyRun(base));
    const id = identity(base + '/' + file); parents.push(id);
    const bytes = readRepository(id.path, id);
    return JSON.parse((file.endsWith('.gz') ? gunzipSync(bytes) : bytes).toString());
}
/** Reject nonfinite or materially different scalar identities.
 * @param {number} a @param {number} b @param {number} tolerance @returns {void}
 */
function close(a, b, tolerance = 1e-13) {
    assert.ok(Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tolerance, `${a} versus ${b}`);
}
const map = /** @type {CancellationMapData} */ (read('00250-h8-cancel-map', 'decomposition.json'));
const physical = /** @type {SmallRayPhysicalPacket} */ (read('00109-c1-physical-j1', 'reference.json'));
const control = /** @type {SkyGpuControl} */ (read('00103-c-r0-scr', 'control.json'));
const registration = /** @type {SmallRayRegistration} */ (read('00099-c0-registration', 'registration.json'));
const firstInput = /** @type {SmallRayInputs} */ (read('00230-direct-converge', 'inputs.json'));
const first = /** @type {SmallRayDirectPacket} */ (read('00230-direct-converge', 'results.json.gz'));
const alternateInput = /** @type {SmallRayInputs} */ (read('00232-alternate-rays', 'inputs.json'));
const alternate = /** @type {SmallRayDirectPacket} */ (read('00232-alternate-rays', 'results.json.gz'));
const horizon = /** @type {SmallRayHorizonPacket} */ (read('00245-h4-path', 'path.json'));
const tablePath = 'references/results/experiments/b1-directional-sky-radiance/published-models.tsv';
const tableBytes = readRepository(tablePath, '4e11e9ebc6c8cf2eb85e608d86a750b827a17d13582f4b89f035b71824b204f4');
parents.push(identity(tablePath, tableBytes));
const lines = tableBytes.toString().trim().split(/\r?\n/), header = lines.shift().split('\t');
/** @type {Map<string, number[]>} */ const targets = new Map();
for (const line of lines) {
    const cells = line.split('\t'); if (cells[0] !== 'libradtran') continue;
    const key = cells.slice(1, 4).join('|'); assert.ok(!targets.has(key));
    targets.set(key, Array.from({length: 40}, (_, c) => Number(cells[header.indexOf('lambda_' + c)])));
}
assert.equal(targets.size, 1377);
const spec = control.buildRequest.transportSpec, atmosphere = spec.atmosphere;
assert.equal(atmosphere.ozone.absorptionEnabled, false);
/** Verify physical coefficients, successful numerical controls and unique coverage.
 * @param {SmallRayInputs} input @param {SmallRayDirectPacket} packet @returns {void}
 */
function qualify(input, packet) {
    const m = input.medium;
    close(m.bottom, spec.planet.bottomRadiusMeters / 1000);
    close(m.top, spec.planet.topRadiusMeters / 1000);
    close(m.rayleighHeight, atmosphere.rayleighScaleHeightMeters / 1000);
    close(m.mieHeight, atmosphere.mieScaleHeightMeters / 1000);
    close(m.albedo, atmosphere.mieSingleScatteringAlbedo); close(m.g, atmosphere.miePhaseFunctionG);
    for (const [slot, channel] of input.channels.entries()) {
        const s = spec.domains.spectrum.channels[channel];
        close(m.rayleigh[slot], s.rayleighScatteringPerMeter * 1000);
        close(m.mie[slot], s.mieExtinctionPerMeter * 1000);
        close(m.sun[slot], s.sourceIrradianceDensityWattsPerSquareMeterPerNanometer);
        close(m.ground[slot], s.groundAlbedo);
    }
    assert.equal(packet.failure, null);
    assert.equal(packet.rows.length, input.rays.length * input.channels.length);
    assert.equal(new Set(packet.rows.map(r => r.ray + '|' + r.channel)).size, packet.rows.length);
    for (const r of packet.rows) {
        assert.ok(r.parity && r.attenuationResolved && r.rouletteResolved);
        assert.ok(input.rays.some(ray => ray.id === r.ray) && input.channels.includes(r.channel));
        close(r.first.mean + r.second.mean + r.higher.mean, r.total.mean);
        assert.ok(r.total.halfWidth95 > 0 && Number.isFinite(r.total.halfWidth95));
    }
}
qualify(firstInput, first); qualify(alternateInput, alternate);
assert.equal(first.rows.length, 20); assert.equal(alternate.rows.length, 30);
/** @type {SmallRayJoinedRow[]} */ const joined = [];
for (const direct of first.rows) {
    const ray = firstInput.rays.find(r => r.id === direct.ray); assert.ok(ray);
    const row = map.rows.find(r => r.probeId === direct.ray && r.channel === direct.channel); assert.ok(row);
    const probe = registration.probeRays.find(r => r.time === row.time && r.gridX === row.gridX && r.gridY === row.gridY); assert.ok(probe);
    ray.origin.forEach((x, i) => close(x, probe.origin[i] / 1000));
    ray.direction.forEach((x, i) => close(x, probe.direction[i], 8 * Number.EPSILON));
    const p1 = physical.rows.find(r => r.probeId === row.probeId && r.channel === row.channel); assert.ok(p1?.resolved);
    close(row.physicalP1W, (p1.gaussWatts + p1.simpsonWatts) / 2, 0);
    const p1ReferenceDifferenceW = row.physicalP1W - direct.cpu[1];
    const p1ReferenceAllowanceW = p1.empiricalAllowanceWatts + Math.abs(direct.cpu[0] - direct.cpu[1]);
    assert.ok(p1.empiricalAllowanceWatts > 0 && Math.abs(p1ReferenceDifferenceW) <= p1ReferenceAllowanceW);
    const target = targets.get([row.time, row.gridX, row.gridY].join('|'))[row.channel]; close(target, row.targetW, 0);
    const firstErrorW = row.termsW.slice(0, 6).reduce((a, b) => a + b, 0);
    const higherErrorW = row.higherW - (direct.total.mean - row.physicalP1W);
    const solverGapW = direct.total.mean - target;
    const termsW = [...row.termsW.slice(0, 6), higherErrorW, solverGapW];
    close(termsW.reduce((a, b) => a + b, 0), row.netW);
    const p2 = map.orderWitnesses.find(r => r.probeId === row.probeId && r.channel === row.channel);
    const secondErrorW = p2?.secondErrorW ?? null;
    const thirdPlusErrorW = p2 ? higherErrorW - p2.secondErrorW : null;
    const extension = map.extensions.find(r => r.probeId === row.probeId && r.channel === row.channel);
    joined.push({probeId: row.probeId, time: row.time, channel: row.channel, wavelength: row.wavelength,
        elevation: row.elevation, separation: row.separation, firstErrorW, higherErrorW, solverGapW,
        netW: row.netW, directW: direct.total.mean, halfWidth95W: direct.total.halfWidth95,
        samplingResolved: direct.samplingResolved, p1ReferenceDifferenceW, p1ReferenceAllowanceW,
        termsW, n6IncrementW: extension?.incrementW ?? null,
        secondErrorW, thirdPlusErrorW});
}
/** @type {SmallRayAlternateRow[]} */ const alternateRows = [];
for (const direct of alternate.rows) {
    const ray = alternateInput.rays.find(r => r.id === direct.ray); assert.ok(ray && ray.models);
    const target = targets.get([ray.time, ray.x, ray.y].join('|'))[direct.channel]; assert.ok(Number.isFinite(target));
    const slot = alternateInput.channels.indexOf(direct.channel); close(target, ray.models.libradtran[slot], 0);
    const separation = Math.acos(Math.max(-1, Math.min(1, ray.direction[2]))) * 180 / Math.PI;
    const cosine = ray.origin.reduce((s, x, i) => s + x * ray.direction[i], 0) / Math.hypot(...ray.origin);
    const elevation = Math.asin(Math.max(-1, Math.min(1, cosine))) * 180 / Math.PI;
    close(separation, ray.separation, 1e-7); close(elevation, ray.elevation, 2e-6);
    const approximationW = ray.models.control[slot] - direct.total.mean, solverGapW = direct.total.mean - target;
    const netW = ray.models.control[slot] - target; close(approximationW + solverGapW, netW);
    alternateRows.push({ray: ray.id, probeId: 'p-' + ray.time.replace(':', '') + '-' + ray.x + '-' + ray.y,
        time: ray.time, channel: direct.channel, elevation: ray.elevation, separation: ray.separation,
        approximationW, solverGapW, netW, halfWidth95W: direct.total.halfWidth95, samplingResolved: direct.samplingResolved});
}
for (const row of horizon.rows) {
    assert.equal(row.result.spectrum.length, 15);
    row.result.spectrum.forEach((value, c) => close(value, row.result.rayleigh[c] + row.result.mie[c]));
    row.totalColor.rgb.forEach((value, c) => {
        close(value, row.rayleighColor.rgb[c] + row.mieColor.rgb[c], 1e-8);
        close(value, row.stratumColors.reduce((s, stratum) => s + stratum.rayleigh.rgb[c] + stratum.mie.rgb[c], 0), 1e-8);
    });
}
/** RMS of a signed scalar vector, converted to spectral mW.
 * @param {number[]} values @returns {number} Equal-weight diagnostic subset RMS.
 */
function rms(values) {assert.ok(values.length); return 1000 * Math.sqrt(values.reduce((s, x) => s + x * x, 0) / values.length);}
const summary = {
    joinedCount: joined.length, alternateCount: alternateRows.length,
    joinedSamplingMisses: joined.filter(r => !r.samplingResolved).length,
    originalRmseMw: rms(joined.map(r => r.netW)), directRmseMw: rms(joined.map(r => r.solverGapW)),
    firstErrorRmsMw: rms(joined.map(r => r.firstErrorW)), higherErrorRmsMw: rms(joined.map(r => r.higherErrorW)),
    alternateControlRmseMw: rms(alternateRows.map(r => r.netW)), alternateDirectRmseMw: rms(alternateRows.map(r => r.solverGapW)),
    positiveFirst: joined.filter(r => r.firstErrorW > 0).length,
    negativeSolverGap: joined.filter(r => r.solverGapW < 0).length,
};
const data = {parents, joined, alternate: alternateRows, flatHorizon: horizon.rows, summary,
    qualification: 'Retained direct marginal sampling intervals exclude systematics; libRadtran configuration/convergence equivalence remains open. H8 hybrid and Native48 alternate control are separate baselines.',
    equations: {first: 'A-P', higher: 'H-(C-P)', solverGap: 'C-R', net: '(A-P)+(H-C+P)+(C-R)=A+H-R',
        covariance: 'The same C enters higher and solverGap with opposite signs. Their sampling errors cancel in the exact sum; do not add their intervals as independent errors.'}};
/** HTML-escape ordinary text before inserting it into the offline table.
 * @param {string} value @returns {string} Escaped text.
 */
function escape(value) {return value.replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));}
/** Render fixed tabular evidence without interpolating unmeasured positions.
 * @param {string[]} headers @param {(string | number)[][]} rows @returns {string} HTML table.
 */
function table(headers, rows) {
    return '<table><tr>' + headers.map(h => '<th>' + escape(h) + '</th>').join('') + '</tr>' + rows.map(row => '<tr>' + row.map(v => '<td>' + escape(String(v)) + '</td>').join('') + '</tr>').join('') + '</table>';
}
const mw = value => (1000 * value).toFixed(3);
const html = '<!doctype html><html lang="en"><meta charset="utf-8"><title>Small-ray cancellation attribution</title>' +
    '<style>body{font:16px system-ui;margin:30px;max-width:1500px}table{border-collapse:collapse;margin:20px 0}td,th{border:1px solid #aaa;padding:7px;text-align:right}td:first-child{text-align:left}p{max-width:1100px;line-height:1.5}</style>' +
    '<h1>Small-ray cancellation attribution</h1><p>Fixed paper atmosphere; signed spectral mW m^-2 sr^-1 nm^-1. P1 error + higher-order approximation + continuous/libRadtran gap = net. Direct +/- values are marginal sampling half-widths, not total uncertainty. The last two terms share opposing sampling uncertainty. This table preserves all five producer precision misses.</p>' +
    table(['Ray', 'nm', 'Elevation', 'Sun separation', 'P1 error', 'Higher approximation', 'Continuous/LR gap', 'Direct +/-95%', 'Net', 'Precision met'], joined.map(r => [r.probeId, r.wavelength, r.elevation.toFixed(2), r.separation.toFixed(2), mw(r.firstErrorW), mw(r.higherErrorW), mw(r.solverGapW), mw(r.halfWidth95W), mw(r.netW), String(r.samplingResolved)])) +
    '<h2>Independent P2 subset</h2><p>Higher approximation is separated into P2 error and remaining orders-three-plus approximation only at four qualified scalars.</p>' +
    table(['Ray', 'nm', 'P2 error', 'Orders-three-plus approximation', 'Continuous/LR gap'], joined.filter(r => r.secondErrorW !== null).map(r => [r.probeId, r.wavelength, mw(r.secondErrorW), mw(r.thirdPlusErrorW), mw(r.solverGapW)])) +
    '<h2>Separate Native48 alternate baseline</h2><p>These six rays use their original Native48 control, not the H8 hybrid.</p>' +
    table(['Ray', 'nm', 'Approximation', 'Continuous/LR gap', 'Direct +/-95%', 'Net'], alternateRows.map(r => [r.probeId, 360 + 11.75 * r.channel, mw(r.approximationW), mw(r.solverGapW), mw(r.halfWidth95W), mw(r.netW)])) +
    '<h2>Separate Flat local-Sun N1 witnesses</h2><p>Native15, finite source, different geometry. These are physical light contributions at fixed extinction, not errors against the spherical paper reference.</p>' +
    table(['Elevation', 'Total R/B', 'Rayleigh R/B', 'Mie R/B'], horizon.rows.map(r => [r.elevationDegrees, (r.totalColor.rgb[0] / r.totalColor.rgb[2]).toFixed(4), (r.rayleighColor.rgb[0] / r.rayleighColor.rgb[2]).toFixed(4), (r.mieColor.rgb[0] / r.mieColor.rgb[2]).toFixed(4)])) +
    '<p>Reference configuration/convergence qualification remains open. <a href="joined.json">Numerical data, parent identities and equations</a></p></html>';
assert.ok(Date.now() - started < 60000, 'H9 reporting cap');
const run = createRun('h9-small-rays', {parents, operation: 'Join immutable small-ray direct references to H8; separate first/higher/model gaps and retain distinct alternate/flat boundaries.',
    parameters: {maximumMilliseconds: 60000, maximumEvidenceBytes: 2 * 1024 ** 2,
        geometryTolerance: 'Original five: 8 epsilon direction; exact converted origins. Alternate derived elevation 2e-6 degrees.',
        physicalTolerance: '1e-13 in producer km units', p1Parity: 'Original two-method empirical allowance plus direct CPU coarse/fine difference; no new tolerance fitting.',
        preflightCorrection: 'An initial preallocation check treated independently integrated P1 estimates as exact to 1e-10 W. Observed maximum 3.171e-10 W is inside original empirical allowances; corrected to compare using those unchanged allowances. No run was allocated or cap exhausted.',
        referenceQualification: data.qualification, equations: data.equations}});
try {
    run.progress('verified', 'Physical inputs, shared geometry, reference identities and additive partitions checked.', 50, 50);
    const files = [run.write('joined.json', data), run.write('joined.html', html)];
    assert.ok(files.reduce((s, f) => s + f.byteLength, 0) < 2 * 1024 ** 2);
    assert.ok(Date.now() - started < 60000);
    const seal = run.finish('accepted', {summary, elapsedMillisecondsThroughRetention: Date.now() - started});
    verifyRun(run.path); console.log(JSON.stringify({run: run.path, seal, summary}));
} catch (error) {run.finish('failed', {error: String(error)}); throw error;}
