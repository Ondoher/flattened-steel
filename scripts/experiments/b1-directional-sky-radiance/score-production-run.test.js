import assert from 'node:assert/strict';
import test from 'node:test';

import {
	assertProductionBFamilyCloseout,
	createProductionBPresentationBoundaries,
	PRODUCTION_B1_CLOSEOUT_MAXIMUM_RMSE_MILLIWATT,
} from './score-production-run.js';
import {B1_FIGURE_COLOR_CONTROL} from '../../algorithm32/production-b-experiments/B1MeasurementBoundary.js';

function resultSet({
	b1Rmse = PRODUCTION_B1_CLOSEOUT_MAXIMUM_RMSE_MILLIWATT,
	b1Classification = 'favorable',
	b2Classification = 'favorable',
	b3Classification = 'favorable',
	b3Consistent = true,
	mismatchMapComplete = true,
} = {}) {
	return {
		b1: {
			accepted: true,
			proposedStage: {
				completed: true,
				score: {aggregate: {rmseMilliwatt: b1Rmse}},
				assessment: {classification: b1Classification},
			},
		},
		b2: {
			fullBenchmarkAccepted: true,
			proposedScore: {},
			proposedAssessment: {classification: b2Classification},
		},
		b3: {
			complete: true,
			proposed: {},
			proposedAssessment: {
				classification: b3Classification,
				consistent: b3Consistent,
				mismatchAssessment: {complete: mismatchMapComplete},
			},
		},
	};
}

test('accepts the B family only when the closeout and predeclared gates are conjunctively favorable', () => {
	assert.deepEqual(assertProductionBFamilyCloseout(resultSet()), {
		b1RmseMilliwatt: PRODUCTION_B1_CLOSEOUT_MAXIMUM_RMSE_MILLIWATT,
		classification: 'favorable',
	});
});

test('rejects a favorable B1 result above the independent closeout ceiling', () => {
	assert.throws(
		() =>
			assertProductionBFamilyCloseout(
				resultSet({b1Rmse: PRODUCTION_B1_CLOSEOUT_MAXIMUM_RMSE_MILLIWATT + 0.000001}),
			),
		/aggregate RMSE/u,
	);
});

test('rejects non-favorable B1 or B2 classifications and an inconsistent B3 result', () => {
	assert.throws(() => assertProductionBFamilyCloseout(resultSet({b1Classification: 'limited'})), /B1 must remain favorable/u);
	assert.throws(() => assertProductionBFamilyCloseout(resultSet({b2Classification: 'limited'})), /B2 must remain favorable/u);
	assert.throws(() => assertProductionBFamilyCloseout(resultSet({b3Consistent: false})), /B3 must preserve/u);
	assert.throws(() => assertProductionBFamilyCloseout(resultSet({mismatchMapComplete: false})), /B3 must preserve/u);
});

test('records Basic Bruneton only as the six-figure control beside Color-free scoring', () => {
	const boundaries = createProductionBPresentationBoundaries(B1_FIGURE_COLOR_CONTROL);
	assert.equal(boundaries.physicalScoringBoundary.stage, 'post-transport-pre-color');
	assert.equal(boundaries.physicalScoringBoundary.colorDisplayModel, null);
	assert.equal(boundaries.figureColorControl.selectionId, 'basic-bruneton');
	assert.equal(boundaries.figureColorControl.implementationId, 'bruneton-figure1-display');
	assert.equal(boundaries.figureColorControl.artifactCount, 6);
	assert.equal(boundaries.figureColorControl.participatesInPhysicalScoring, false);
	assert.throws(
		() =>
			createProductionBPresentationBoundaries({
				...B1_FIGURE_COLOR_CONTROL,
				selectionId: 'color-reset-slope-078-p9',
			}),
		/Basic Bruneton/u,
	);
});
