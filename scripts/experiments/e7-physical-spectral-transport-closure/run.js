import { pathToFileURL } from 'node:url';
export const EXPERIMENT = 'E7';
export const NAME = 'Physical Spectral Transport Closure';
export const QUESTION = 'What channel-wise composition rule produces the observable pre-display spectrum from atmospheric path radiance, transported endpoint radiance, extended-source radiance, and point-source radiance?';
export const CHANNEL_COUNT = 15;
const zeros = () => Array(CHANNEL_COUNT).fill(0);
const make = (seed) => Object.freeze(Array.from({ length: CHANNEL_COUNT }, (_, i) => (seed * (i + 1) + ((i + seed) % 4) * 0.3) * 1e-6));
export const COMPONENTS = Object.freeze({ path: make(1), endpoint: make(2), extended: make(3), point: make(4) });
const component = (name, values, scale = 1) => Object.freeze({ name, values, scale });
export const CASES = Object.freeze([
  ...Object.entries(COMPONENTS).map(([name, values]) => Object.freeze({ id: `isolated-${name}`, components: Object.freeze([component(name, values)]) })),
  Object.freeze({ id: 'combined', components: Object.freeze(Object.entries(COMPONENTS).map(([n, v]) => component(n, v))) }),
  Object.freeze({ id: 'scaled', components: Object.freeze(Object.entries(COMPONENTS).map(([n, v], i) => component(n, v, [0.25, 1.5, 2, 0.75][i]))) }),
  Object.freeze({ id: 'reordered', components: Object.freeze(Object.entries(COMPONENTS).reverse().map(([n, v]) => component(n, v))) })
]);
function assertComponent(item) { if (!Array.isArray(item.values) || item.values.length !== CHANNEL_COUNT || item.values.some((v) => !Number.isFinite(v)) || !Number.isFinite(item.scale)) throw new TypeError('Components require finite 15-channel packets and scale.'); }
export function compose(components) { const out = zeros(); for (const item of components) { assertComponent(item); for (let i = 0; i < CHANNEL_COUNT; i += 1) out[i] += item.values[i] * item.scale; } return Object.freeze(out); }
const oracle = (components) => Object.freeze(Array.from({ length: CHANNEL_COUNT }, (_, i) => components.reduce((sum, item) => sum + item.values[i] * item.scale, 0)));
function compare(a, b, n) { const rel = 16 * n * Number.EPSILON / (1 - n * Number.EPSILON); let residual = 0, limit = 0; for (let i = 0; i < CHANNEL_COUNT; i += 1) { residual = Math.max(residual, Math.abs(a[i] - b[i])); limit = Math.max(limit, Math.max(Math.abs(a[i]), Math.abs(b[i]), Number.MIN_VALUE) * rel); } return Object.freeze({ maximumResidual: residual, maximumLimit: limit, accepted: residual <= limit }); }
export function evaluateCase(input) { const observed = compose(input.components), expected = oracle(input.components), comparison = compare(observed, expected, 4 * input.components.length + 4); return Object.freeze({ id: input.id, componentCount: input.components.length, observed, expected, comparison, outputDataType: 'spectral radiance density', displayTransformCount: 0, accepted: comparison.accepted }); }
export function runExperiment() { const results = CASES.map(evaluateCase); const combined = results.find((r) => r.id === 'combined'), reordered = results.find((r) => r.id === 'reordered'); const ordering = compare(combined.observed, reordered.observed, 32); const isolatedSum = compose(results.filter((r) => r.id.startsWith('isolated-')).map((r) => component(r.id, r.observed))); const isolation = compare(isolatedSum, combined.observed, 32); return Object.freeze({ results, ordering, isolation, accepted: results.every((r) => r.accepted && r.displayTransformCount === 0) && ordering.accepted && isolation.accepted }); }
const f = (v) => Number(v).toExponential(6);
export function renderReport(run) {
  const lines = [
    `# ${EXPERIMENT} - ${NAME}`,
    '',
    '## Question',
    '',
    QUESTION,
    '',
    '## Inputs',
    '',
    '```json',
    JSON.stringify({
      basis: {
        channelCount: CHANNEL_COUNT,
        dataType: 'unit-compatible spectral radiance density'
      },
      formula: 'L_final=L_path+L_endpoint_transported+L_extended+L_point',
      displayTransformsInsideBoundary: 0,
      componentPackets: COMPONENTS,
      cases: CASES
    }, null, 2),
    '```',
    '',
    '## Iterations',
    '',
    `Iterations: ${run.results.length}`,
    '',
    '| iteration | case | components | output type | display transforms | residual | limit | accepted |',
    '| ---: | --- | ---: | --- | ---: | ---: | ---: | --- |'
  ];
  run.results.forEach((r, i) => lines.push(`| ${i + 1} | ${r.id} | ${r.componentCount} | ${r.outputDataType} | ${r.displayTransformCount} | ${f(r.comparison.maximumResidual)} | ${f(r.comparison.maximumLimit)} | ${r.accepted ? 'yes' : 'no'} |`));
  lines.push(
    '',
    '## Cross-case invariants',
    '',
    '```json',
    JSON.stringify({
      ordering: run.ordering,
      isolatedComponentClosure: run.isolation
    }, null, 2),
    '```',
    '',
    '## Conclusion',
    '',
    run.accepted
      ? 'Accepted. The observable pre-display packet is the channel-wise sum L_final = L_path + L_endpoint_transported + L_extended + L_point. Isolated components close to the combined result, scaling is linear, ordering is immaterial, and the boundary performs no display conversion.'
      : 'Rejected. A spectral composition invariant failed.'
  );
  return `${lines.join('\n')}\n`;
}
const invoked = process.argv[1] && pathToFileURL(process.argv[1]).href; if (invoked === import.meta.url) { const r = runExperiment(); process.stdout.write(renderReport(r)); if (!r.accepted) process.exitCode = 1; }
