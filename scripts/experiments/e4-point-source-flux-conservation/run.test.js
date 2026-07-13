import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CASES,
  SOURCE_PACKETS,
  evaluateCase,
  runExperiment,
  spectralRadianceForEntry
} from './run.js';

const closePacket = (actual, expected, relativeTolerance = 1e-12) => {
  assert.equal(actual.length, expected.length);
  actual.forEach((value, channel) => {
    const scale = Math.max(Math.abs(expected[channel]), Number.MIN_VALUE);
    assert.ok(
      Math.abs(value - expected[channel]) <= relativeTolerance * scale,
      `channel ${channel}: expected ${expected[channel]}, received ${value}`
    );
  });
};

const caseById = (id) => CASES.find((candidate) => candidate.id === id);

test('all declared footprints include normalized on-raster and off-raster mass', () => {
  for (const input of CASES) {
    for (const source of input.sources) {
      const mass = source.footprint.reduce((sum, entry) => sum + entry.weight, 0);
      assert.ok(Math.abs(mass - 1) <= 8 * Number.EPSILON);
      assert.ok(source.footprint.every((entry) =>
        entry.weight >= 0 && entry.solidAngleSteradians > 0));
    }
  }
});

test('the interior response reconstructs every source-flux channel', () => {
  const result = evaluateCase(caseById('interior'));
  assert.ok(result.accepted);
  closePacket(result.aggregateObservedTotalFlux, SOURCE_PACKETS.primary);
});

test('edge and corner cases preserve off-raster loss without renormalization', () => {
  const edge = evaluateCase(caseById('edge')).sourceResults[0];
  const corner = evaluateCase(caseById('corner')).sourceResults[0];
  assert.equal(edge.onRasterMass, 0.5);
  assert.equal(edge.offRasterMass, 0.5);
  assert.equal(corner.onRasterMass, 0.16);
  assert.equal(corner.offRasterMass, 0.84);
  closePacket(edge.observedOnRasterFlux,
    SOURCE_PACKETS.primary.map((value) => value * 0.5));
  closePacket(corner.observedOffRasterFlux,
    SOURCE_PACKETS.primary.map((value) => value * 0.84));
});

test('a fully off-raster response reports zero visible and complete lost flux', () => {
  const result = evaluateCase(caseById('fully-off-raster')).sourceResults[0];
  assert.ok(result.observedOnRasterFlux.every((value) => value === 0));
  closePacket(result.observedOffRasterFlux, SOURCE_PACKETS.primary);
  closePacket(result.observedTotalFlux, SOURCE_PACKETS.primary);
});

test('flux recovery is invariant to pixel solid angle', () => {
  const fine = evaluateCase(caseById('fine-resolution'));
  const wide = evaluateCase(caseById('wide-field'));
  closePacket(fine.aggregateObservedTotalFlux, SOURCE_PACKETS.primary);
  closePacket(wide.aggregateObservedTotalFlux, SOURCE_PACKETS.primary);
  closePacket(fine.aggregateObservedTotalFlux, wide.aggregateObservedTotalFlux);

  const fineRadiance = spectralRadianceForEntry(SOURCE_PACKETS.primary, 0.5, 1e-7);
  const wideRadiance = spectralRadianceForEntry(SOURCE_PACKETS.primary, 0.5, 1e-5);
  assert.ok(fineRadiance.every((value, channel) => value > wideRadiance[channel]));
});

test('overlapping point sources add linearly in shared pixels', () => {
  const result = evaluateCase(caseById('overlapping-sources'));
  assert.ok(result.accepted);
  assert.ok(result.additivityComparison.accepted);
  closePacket(
    result.aggregateObservedTotalFlux,
    SOURCE_PACKETS.primary.map((value, channel) =>
      value + SOURCE_PACKETS.secondary[channel])
  );
});

test('the complete E4 experiment satisfies every declared criterion', () => {
  const result = runExperiment();
  assert.ok(result.accepted);
  assert.equal(result.results.length, CASES.length);
  assert.ok(result.results.every((iteration) => iteration.accepted));
});
