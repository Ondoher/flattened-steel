import fileSystem from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

/** Current file path constant. */
const currentFilePath = fileURLToPath(import.meta.url);
/** Fixture spec directory path constant. */
const fixtureSpecDirectoryPath = path.dirname(currentFilePath);
/** Analytic fixture path constant. */
const analyticFixturePath = '../analytic-invariants.json';
/** Legacy reference fields constant. */
const legacyReferenceFields = ['kind', 'title', 'url', 'path', 'derivationSummary'];
/** Allowed reference numbers constant. */
const allowedReferenceNumbers = new Set([1, 2, 3, 4]);

/**
 * Called by this module to read a production JSON fixture.
 *
 * @param {string} relativePath - Locate the fixture relative to the production package root.
 * @returns {unknown} - Return the parsed JSON fixture.
 */
function readProductionJson(relativePath) {
	const fullPath = path.resolve(fixtureSpecDirectoryPath, relativePath);

	return JSON.parse(fileSystem.readFileSync(fullPath, 'utf8'));
}

/**
 * Called by this module to check whether a value is a plain object.
 *
 * @param {unknown} value - Store the value to check.
 * @returns {boolean} - Return true when the value is a non-array object.
 */
function isPlainObject(value) {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Called by this module to check whether text includes a bracketed reference number.
 *
 * @param {string} text - Store the text to inspect.
 * @returns {boolean} - Return true when the text carries an inline bracket citation.
 */
function hasBracketCitation(text) {
	return /\[\d+\]/u.test(text);
}

/**
 * Called by this module to extract each bracketed citation group.
 *
 * @param {string} text - Store the citation text to inspect.
 * @returns {ProductionFixtureCitationGroup[]} - Return ordered citation groups and their offsets.
 */
function getBracketCitationGroups(text) {
	return [...text.matchAll(/\[(\d+)\]/gu)].map(
		/**
		 * Called by Array.prototype.map to transform one collection value.
		 * @param match - The match value accepted by the operation.
		 * @returns - The callback result returned to its caller.
		 */ (match) => ({
			value: match[1],
			index: match.index,
		}),
	);
}

/**
 * Called by this module to extract unique numbered references cited with bracket citations.
 *
 * @param {string} text - Store the citation text to inspect.
 * @returns {number[]} - Return sorted unique reference numbers.
 */
function getBracketReferenceNumbers(text) {
	const referenceNumbers = getBracketCitationGroups(text).map(
		/**
		 * Called by Array.prototype.map to transform one collection value.
		 * @param group - The group value accepted by the operation.
		 * @returns - The callback result returned to its caller.
		 */ (group) => Number(group.value),
	);

	return [...new Set(referenceNumbers)].sort(
		/**
		 * Called by Array.prototype.sort to compare two collection values.
		 * @param left - The left value accepted by the operation.
		 * @param right - The right value accepted by the operation.
		 * @returns - The callback result returned to its caller.
		 */ (left, right) => left - right,
	);
}

/**
 * Called by this module to assert that no superscript citation digits remain in fixture text.
 *
 * @param {string} text - Store the citation text to inspect.
 * @returns {void} -
 */
function expectNoSuperscriptCitations(text) {
	expect(text).not.toMatch(/[¹²³⁴⁵⁶⁷⁸⁹⁰]/u);
}

/**
 * Called by this module to return sorted unique reference numbers from one row's pointer objects.
 *
 * @param {readonly Algorithm32ProductionReferencePointer[]} pointers - Supplies row reference pointers.
 * @returns {number[]} - Return sorted unique pointer reference numbers.
 */
function getPointerReferenceNumbers(pointers) {
	return [
		...new Set(
			pointers.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param pointer - The pointer value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (pointer) => pointer.referenceNumber,
			),
		),
	].sort(
		/**
		 * Called by Array.prototype.sort to compare two collection values.
		 * @param left - The left value accepted by the operation.
		 * @param right - The right value accepted by the operation.
		 * @returns - The callback result returned to its caller.
		 */ (left, right) => left - right,
	);
}

/**
 * Called by this module to assert that a reference pointer follows the current compact production shape.
 *
 * @param {unknown} pointer - Store the reference pointer to validate.
 * @returns {void} -
 */
function expectReferencePointer(pointer) {
	expect(isPlainObject(pointer)).toBe(true);
	expect(pointer.referenceNumber).toEqual(jasmine.any(Number));
	expect(allowedReferenceNumbers.has(pointer.referenceNumber)).toBe(true);

	for (const legacyField of legacyReferenceFields) {
		expect(Object.hasOwn(pointer, legacyField)).toBe(false);
	}
}

/**
 * Called by this module to assert that one fixture row has the current production row envelope.
 *
 * @param {unknown} row - Store the fixture row to validate.
 * @returns {void} -
 */
function expectFixtureRow(row) {
	expect(isPlainObject(row)).toBe(true);
	expect(row.id).toEqual(jasmine.any(String));
	expect(row.id).toMatch(/^[a-z0-9]+(?:[-.][a-z0-9]+)+$/);
	expect(row.area).toEqual(jasmine.any(String));
	expect(row.quantity).toEqual(jasmine.any(String));
	expect(row.citation).toEqual(jasmine.any(String));
	expect(hasBracketCitation(row.citation)).toBe(true);
	expectNoSuperscriptCitations(row.citation);
	expect(row.references).toEqual(jasmine.any(Array));
	expect(row.references.length).toBeGreaterThan(0);
	expect(getBracketReferenceNumbers(row.citation)).toEqual(getPointerReferenceNumbers(row.references));
	expect(isPlainObject(row.assumptions)).toBe(true);
	expect(isPlainObject(row.input)).toBe(true);
	expect(row.independence).toEqual(jasmine.any(String));

	for (const pointer of row.references) {
		expectReferencePointer(pointer);
	}

	if (row.expected !== undefined) {
		expect(isPlainObject(row.expected)).toBe(true);
		expect(Object.keys(row.expected).length).toBeGreaterThan(0);
	}

	if (row.expectedError !== undefined) {
		expect(isPlainObject(row.expectedError)).toBe(true);
		expect(row.expectedError.derivation).toEqual(jasmine.any(String));
	}
}

/**
 * Called by this module to assert that the promoted analytic fixture uses the production citation shape.
 *
 * @returns {void} -
 */
function expectAnalyticInvariantFixture() {
	const fixture = readProductionJson(analyticFixturePath);

	expect(fixture).toEqual(
		jasmine.objectContaining({
			kind: 'algorithm32-production-fixture-ledger',
			id: 'analytic-invariants',
			status: 'draft',
			sourcePath: 'scripts/flat/atmosphere_rejected/reference/stages/_tests/fixtures/analytic-invariants.json',
			rows: jasmine.any(Array),
		}),
	);
	expect(fixture.rows.length).toBeGreaterThan(0);
	expect(
		fixture.rows.some(
			/**
			 * Called by Array.prototype.some to test one collection value for a matching condition.
			 * @param row - The row value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (row) => row.id === 'phase.isotropic.constant-over-solid-angle',
		),
	).toBe(true);
	expect(
		fixture.rows.some(
			/**
			 * Called by Array.prototype.some to test one collection value for a matching condition.
			 * @param row - The row value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (row) => row.id === 'in-scattering.one-sample.scalar-product',
		),
	).toBe(true);
	expect(
		fixture.rows.some(
			/**
			 * Called by Array.prototype.some to test one collection value for a matching condition.
			 * @param row - The row value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (row) => row.id === 'surface.lambertian.white-direct-normal-equals-one',
		),
	).toBe(true);

	for (const row of fixture.rows) {
		expectFixtureRow(row);
	}
}

/**
 * Called by this module to assert that old app-spec-only citations were not promoted into production rows.
 *
 * @returns {void} -
 */
function expectNoAppSpecOnlyReferences() {
	const fixture = readProductionJson(analyticFixturePath);
	const serializedRows = JSON.stringify(fixture.rows);

	expect(serializedRows).not.toContain('local-design-doc');
	expect(serializedRows).not.toContain('Reference Code Design');
	expect(serializedRows).not.toContain('Reference Stage Contracts');
	expect(serializedRows).not.toContain('stage_contracts.md');
	expect(serializedRows).not.toContain('code_design.md');
}

/**
 * Called by this module to register fixture-shape specs.
 *
 * @returns {void} -
 */
function registerFixtureSpecs() {
	it('keeps analytic invariant rows in the production fixture shape', expectAnalyticInvariantFixture);
	it('does not promote app-spec-only citations into production fixtures', expectNoAppSpecOnlyReferences);
}

describe('Algorithm32 production fixtures', registerFixtureSpecs);
