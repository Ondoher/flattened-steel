import assert from 'node:assert/strict';
import path from 'node:path';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {gunzipSync} from 'node:zlib';
import {Script} from 'node:vm';
import {checkedAbsolute, createRun, identity, readRepository, repositoryRoot, sha256, verifyRun} from '../io/files.mjs';
import {renderMap} from './render.mjs';

const started = Date.now(), root = 'tmp/experiments/sky-accuracy-dials/runs/';
/** @type {DialFileIdentity[]} */ const parents = [];
/** Read an authenticated prior JSON artifact and retain its derivation identity.
 * @param {string} runName @param {string} file @returns {unknown} Parsed retained data.
 */
function read(runName, file) {
    const runPath = root + runName;
    if (!parents.some(parent => parent.path === runPath + '/sealed.json')) parents.push(verifyRun(runPath));
    const id = identity(runPath + '/' + file); parents.push(id);
    const bytes = readRepository(id.path, id);
    return JSON.parse((file.endsWith('.gz') ? gunzipSync(bytes) : bytes).toString());
}

const assessment = /** @type {SkyTargetedAssessment} */ (read('00224-targeted-gpu', 'assessment.json.gz'));
const references = /** @type {SkyJ1AssessmentRow[]} */ (read('00110-c1-j1-assess', 'rows.json'));
const physical = /** @type {CancellationPhysicalPacket} */ (read('00109-c1-physical-j1', 'reference.json'));
const control = /** @type {SkyGpuControl} */ (read('00103-c-r0-scr', 'control.json'));
assert.equal(control.buildRequest.transportSpec.atmosphere.mieSingleScatteringAlbedo, .8);
assert.equal(control.buildRequest.transportSpec.atmosphere.miePhaseFunctionG, .7);
const tablePath = 'references/results/experiments/b1-directional-sky-radiance/published-models.tsv';
const tableBytes = readRepository(tablePath, '4e11e9ebc6c8cf2eb85e608d86a750b827a17d13582f4b89f035b71824b204f4');
parents.push(identity(tablePath, tableBytes));
const lines = tableBytes.toString().trim().split(/\r?\n/), header = lines.shift().split('\t');
/** @type {Map<string, number[]>} */ const targets = new Map();
for (const line of lines) {
    const values = line.split('\t');
    if (values[0] !== 'libradtran') continue;
    const key = values.slice(1, 4).join('|'); assert.ok(!targets.has(key));
    targets.set(key, Array.from({length: 40}, (_, channel) => Number(values[header.indexOf('lambda_' + channel)])));
}
assert.equal(targets.size, 1377);
const labels = ['Corrected P1 remainder', 'Density reconstruction', 'Phase reconstruction', 'Sunlight columns', 'Transmission/product grouping', 'Split/combined grouping', 'Unisolated higher/ref gap'];
/** @type {CancellationMapRow[]} */ const rows = [];
for (const ref of references) {
    const truth = physical.rows.find(row => row.probeId === ref.probeId && row.channel === ref.channel);
    assert.ok(truth.resolved); assert.equal(ref.physicalW, (truth.gaussWatts + truth.simpsonWatts) / 2);
    const match = /^p-(\d{2})(\d{2})-(\d+)-(\d+)$/.exec(ref.probeId); assert.ok(match);
    const time = match[1] + ':' + match[2], gridX = Number(match[3]), gridY = Number(match[4]);
    assert.equal(time, ref.time); assert.equal(gridX, ref.gridX); assert.equal(gridY, ref.gridY);
    const targetW = targets.get([time, gridX, gridY].join('|'))[ref.channel]; assert.ok(Number.isFinite(targetW));
    const candidates = assessment.rows.filter(row => row.probeId === ref.probeId && row.channel === ref.channel && row.sourceCount === 80);
    assert.equal(candidates.length, 13);
    const modes = Array.from({length: 13}, (_, mode) => {
        const selected = candidates.filter(row => row.mode === mode); assert.equal(selected.length, 1); return selected[0];
    });
    assert.ok(modes.every(row => row.physicalW === ref.physicalW && row.higherW === modes[0].higherW));
    const v = modes.map(row => row.first16W), baselineW = v[12] + modes[12].higherW;
    const termsW = [v[7] - ref.physicalW, v[6] - v[7], v[4] - v[6], v[8] - v[4], v[0] - v[8], v[12] - v[0], ref.physicalW + modes[12].higherW - targetW];
    const netW = baselineW - targetW, sum = termsW.reduce((a, b) => a + b, 0), gross = termsW.reduce((a, b) => a + Math.abs(b), 0);
    assert.ok(Math.abs(sum - netW) < 1e-13);
    rows.push({probeId: ref.probeId, time, channel: ref.channel, wavelength: 360 + 11.75 * ref.channel,
        gridX, gridY, elevation: ref.elevationDegrees, separation: ref.sunSeparationDegrees, targetW, baselineW,
        physicalP1W: ref.physicalW, higherW: modes[12].higherW, termsW, netW, diagnosticGuardW: modes[12].guardW,
        cancellation: gross ? Math.max(0, Math.min(1, 1 - Math.abs(netW) / gross)) : 0});
}
assert.equal(rows.length, 160);
assert.equal(new Set(rows.map(row => row.probeId + '|' + row.channel)).size, 160);

/** Pointwise dot products preserve spatial alignment; signed spatial means are not cancellation.
 * @param {CancellationMapRow[]} selected @returns {CancellationMapSummary} Exact SSE accounting.
 */
function summarize(selected) {
    const dot = (i, j) => selected.reduce((sum, row) => sum + row.termsW[i] * row.termsW[j], 0);
    const energy = labels.map((_, i) => dot(i, i));
    const crossMw2 = labels.map((_, i) => labels.map((_, j) => 2e6 * dot(i, j)));
    const cosine = labels.map((_, i) => labels.map((_, j) => energy[i] && energy[j] ? dot(i, j) / Math.sqrt(energy[i] * energy[j]) : 0));
    const selfSseMw2 = 1e6 * energy.reduce((a, b) => a + b, 0);
    const crossSseMw2 = crossMw2.reduce((sum, row, i) => sum + row.slice(i + 1).reduce((a, b) => a + b, 0), 0);
    const totalSseMw2 = 1e6 * selected.reduce((sum, row) => sum + row.netW ** 2, 0);
    assert.ok(Math.abs(totalSseMw2 - selfSseMw2 - crossSseMw2) < 1e-8);
    return {count: selected.length, rmsMw: energy.map(value => 1000 * Math.sqrt(value / selected.length)), crossMw2, cosine,
        totalRmseMw: Math.sqrt(totalSseMw2 / selected.length), selfSseMw2, crossSseMw2, totalSseMw2};
}

/** @type {CancellationOrderExtension[]} */ const extensions = [];
/** @type {Map<string, CancellationOrderValue>} */ const orderValues = new Map();
for (const channel of [0, 8]) {
    const diagnostic = /** @type {CancellationOrderPacket} */ (
        read('00171-matched-h-n6', 'channel-' + String(channel).padStart(2, '0') + '-diagnostics.json.gz'));
    assert.equal(diagnostic.units, 'W m^-2 sr^-1 nm^-1');
    for (const row of diagnostic.rows.filter(row => row.methodId === 'reference-envelope' && row.representationId === 'grouped')) {
        const key = [row.probeId, channel, row.order].join('|'); assert.ok(!orderValues.has(key)); orderValues.set(key, row);
    }
}
for (const row of rows.filter(row => [0, 8].includes(row.channel))) {
    const value = order => {const found = orderValues.get([row.probeId, row.channel, order].join('|')); assert.ok(found); return found.value;};
    assert.ok(Math.abs(value(4) - value(1) - row.higherW) < 1e-13, 'Four-order prefix must match frozen higher light.');
    const incrementW = value(6) - value(4); assert.ok(incrementW >= -1e-13);
    extensions.push({probeId: row.probeId, time: row.time, channel: row.channel, residual4W: row.netW, residual6W: row.netW + incrementW, incrementW});
}
/** @type {CancellationOrderWitness[]} */ const orderWitnesses = [];
for (const [runName, probeId] of [['00179-p2-ref-assess', 'p-0930-5-7'], ['00200-tr-ref-assess', 'p-1230-3-5']]) {
    const reference = /** @type {CancellationP2Packet} */ (read(runName, 'reference-assessment.json'));
    for (const p2 of reference.channels) {
        assert.ok(p2.adequate);
        const row = rows.find(row => row.probeId === probeId && row.channel === p2.channel); assert.ok(row);
        const p2W = orderValues.get([probeId, p2.channel, 2].join('|')).value - orderValues.get([probeId, p2.channel, 1].join('|')).value;
        assert.ok(Math.abs(p2W - p2.originalHWatts) < 1e-13);
        const firstErrorW = row.termsW.slice(0, 6).reduce((a, b) => a + b, 0), secondErrorW = p2W - p2.referenceWatts;
        const remainderW = row.higherW - p2W + row.physicalP1W + p2.referenceWatts - row.targetW;
        assert.ok(Math.abs(firstErrorW + secondErrorW + remainderW - row.netW) < 1e-13);
        orderWitnesses.push({probeId, time: row.time, channel: row.channel, wavelength: row.wavelength, firstErrorW, secondErrorW,
            remainderW, netW: row.netW, secondAllowanceW: p2.allowanceWatts});
    }
}
assert.equal(orderWitnesses.length, 4); assert.equal(extensions.length, 80);
const summary = summarize(rows);
/** @type {CancellationMapData} */ const data = {labels, rows, summary, orderWitnesses, extensions, parents};
const python = checkedAbsolute(path.resolve('C:/Users/gande/AppData/Local/Programs/Python/Python310/python.exe'));
const pythonIdentity = {path: python, sha256: sha256(readFileSync(python))};
const run = createRun('h8-cancel-map', {parents, operation: 'Ordered pointwise P1-error telescoping, aligned SSE cross terms, sparse spatial map, independent P2 split and matched N5/N6 contribution; no transport rerun.',
    parameters: {maximumMilliseconds: 120000, maximumEvidenceBytes: 2 * 1024 ** 2, sourceIntervals: 80,
        modePath: [7, 6, 4, 8, 0, 12], referenceQualification: 'Retained libRadtran comparison; configuration/convergence qualification open.',
        higherOrderCoverage: 'Only four independent P2 scalars; N3+ error unisolated. N5/6 is a contribution, not an error.',
        spatialPolicy: 'No interpolation into unmeasured positions; cross products align time/ray/wavelength.', plotting: 'matplotlib==3.9.4', pythonIdentity}});
try {
    run.progress('verified', 'Pointwise additivity, SSE identity, independent P1/P2 joins and four-order prefixes pass.', 160, 160);
    const html = renderMap(data), script = html.split('<script>')[1].split('</script>')[0]; new Script(script);
    run.progress('plotting-tool', 'Install pinned binary plotting wheels into owned scratch; cache disabled.');
    const target = path.join(run.scratchPath, 'plotting'), report = path.join(run.scratchPath, 'pip-report.json');
    execFileSync(python, ['-m', 'pip', 'install', '--only-binary=:all:', '--disable-pip-version-check', '--no-cache-dir', '--target', target, '--report', report, 'matplotlib==3.9.4'],
        {timeout: 30000, maxBuffer: 1024 ** 2, windowsHide: true, env: {...process.env, PYTHONNOUSERSITE: '1'}});
    run.guard();
    const toolchain = JSON.parse(readFileSync(checkedAbsolute(report)).toString());
    run.progress('plot', 'Render component, spatial and scattering-order views with the pinned plotting tool.');
    const plots = JSON.parse(execFileSync(python, [path.join(repositoryRoot, 'experiments/sky-accuracy-dials/cancellation-map/plot.py')],
        {input: JSON.stringify(data), timeout: 30000, maxBuffer: 4 * 1024 ** 2, windowsHide: true,
            env: {...process.env, PYTHONPATH: target, PYTHONNOUSERSITE: '1', MPLCONFIGDIR: path.join(run.scratchPath, 'mpl')}}).toString());
    const artifacts = [run.write('decomposition.json', data), run.write('map.html', html), run.write('overview.svg', plots.svg),
        run.write('overview.png', Buffer.from(plots.png, 'base64')), run.write('plotting-toolchain.json', {pythonIdentity, python: plots.python, matplotlib: plots.matplotlib, installation: toolchain})];
    assert.ok(artifacts.reduce((sum, file) => sum + file.byteLength, 0) < 2 * 1024 ** 2);
    assert.ok(Date.now() - started < 120000);
    const seal = run.finish('accepted', {pointCount: rows.length, orderWitnessCount: orderWitnesses.length, extensionCount: extensions.length,
        elapsedMillisecondsThroughRetention: Date.now() - started, summary});
    verifyRun(run.path); console.log(JSON.stringify({run: run.path, seal, summary}));
} catch (error) {
    run.finish('failed', {error: String(error), elapsedMilliseconds: Date.now() - started}); throw error;
}
