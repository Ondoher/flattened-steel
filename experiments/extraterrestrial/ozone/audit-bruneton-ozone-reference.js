import assert from 'node:assert/strict';
import {
	BRUNETON_OZONE_AUTHORITY,
	BRUNETON_OZONE_CROSS_SECTIONS_SQUARE_METERS,
	DIRECT_40_WAVELENGTHS_NANOMETERS,
	NATIVE_15_WAVELENGTHS_NANOMETERS,
	auditBrunetonOzoneReference,
	ozoneAbsorptionExtinctionPerMeter,
	ozoneCrossSectionAtNanometers,
	ozoneDensityScaleAtAltitudeMeters,
} from './BrunetonOzoneReference.js';

const audit = auditBrunetonOzoneReference();

function assertNear(actual, expected, tolerance = 1e-15) {
	assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected} by more than ${tolerance}.`);
}

assert.equal(BRUNETON_OZONE_CROSS_SECTIONS_SQUARE_METERS.length, 48);
assert.equal(NATIVE_15_WAVELENGTHS_NANOMETERS.length, 15);
assert.equal(DIRECT_40_WAVELENGTHS_NANOMETERS.length, 40);
assert.equal(audit.ozoneColumnMoleculesPerSquareMeter, 8.061e22);
assert.equal(audit.maximumOzoneNumberDensityPerCubicMeter, 5.374e18);
assert.equal(audit.densityIntegralFromOneKilometerTrapezoids, 15000);
assert.deepEqual(audit.densityAnchors, {
	at0Meters: 0,
	at10000Meters: 0,
	at25000Meters: 1,
	at40000Meters: 0,
	at60000Meters: 0,
});
assert.equal(audit.tableMaximum.wavelengthNanometers, 600);
assert.equal(audit.tableMaximum.crossSectionSquareMeters, 5.019e-25);
assertNear(audit.tableMaximum.verticalOpticalDepth, 0.040458159);
assertNear(ozoneCrossSectionAtNanometers(595), 4.86e-25, 1e-40);
assertNear(audit.shared595NanometerAnchor.verticalOpticalDepth, 0.03917646);
assert.equal(ozoneDensityScaleAtAltitudeMeters(17500), 0.5);
assert.equal(ozoneDensityScaleAtAltitudeMeters(32500), 0.5);
assertNear(
	ozoneAbsorptionExtinctionPerMeter(25000, 595),
	audit.maximumOzoneNumberDensityPerCubicMeter * 4.86e-25,
	1e-20,
);
assert.ok(audit.native15.every((sample) => sample.verticalOpticalDepth >= 0));
assert.ok(audit.direct40.every((sample) => sample.verticalOpticalDepth >= 0));
assert.throws(() => ozoneCrossSectionAtNanometers(359), /\[360, 830\]/);
assert.throws(() => ozoneDensityScaleAtAltitudeMeters(Number.NaN), /finite/);

process.stdout.write(
	`${JSON.stringify(
		{
			schema: 'contained-bruneton-ozone-reference-audit-v1',
			status: 'passed',
			authorityId: BRUNETON_OZONE_AUTHORITY.id,
			...audit,
		},
		null,
		2,
	)}\n`,
);
