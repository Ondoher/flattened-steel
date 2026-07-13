import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const productionRootPath = path.resolve(path.dirname(currentFilePath), '..');

/**
 * Read a production file as UTF-8 text.
 *
 * @param {string} relativePath - Locate the file relative to the production package root.
 * @returns {string} Return the file contents.
 */
function readProductionText(relativePath) {
	return fs.readFileSync(path.join(productionRootPath, relativePath), 'utf8');
}

/**
 * Read a production JSON fixture.
 *
 * @param {string} relativePath - Locate the JSON fixture relative to the production package root.
 * @returns {unknown} Return the parsed JSON value.
 */
function readProductionJson(relativePath) {
	return JSON.parse(readProductionText(relativePath));
}

/**
 * Walk files under a production-relative directory.
 *
 * @param {string} relativeDirectoryPath - Locate the directory relative to the production package root.
 * @returns {string[]} Return production-relative file paths using forward slashes.
 */
function walkProductionFiles(relativeDirectoryPath = '.') {
	const rootPath = path.join(productionRootPath, relativeDirectoryPath);
	const entries = fs.readdirSync(rootPath, { withFileTypes: true });
	const filePaths = [];

	for (const entry of entries) {
		const entryRelativePath = path.join(relativeDirectoryPath, entry.name);
		const entryPath = path.join(productionRootPath, entryRelativePath);
		const productionRelativePath = path.relative(productionRootPath, entryPath).replaceAll(path.sep, '/');

		if (entry.isDirectory()) {
			filePaths.push(...walkProductionFiles(entryRelativePath));
			continue;
		}

		if (entry.isFile()) {
			filePaths.push(productionRelativePath);
		}
	}

	return filePaths;
}

/**
 * Check whether a production-relative path is implementation JavaScript.
 *
 * @param {string} relativePath - Store the production-relative file path.
 * @returns {boolean} Return true when the path is non-test JavaScript source.
 */
function isProductionImplementationJavaScript(relativePath) {
	return relativePath.endsWith('.js')
		&& !relativePath.startsWith('_tests/')
		&& !relativePath.includes('/_tests/');
}

/**
 * Check whether every reference usage value is part of the scaffold contract.
 *
 * @param {unknown[]} usages - Store the usage values from a source registry entry.
 * @param {Set<string>} allowedUsages - Store accepted source usage labels.
 * @returns {boolean} Return true when every usage is accepted.
 */
function hasOnlyAllowedUsages(usages, allowedUsages) {
	for (const usage of usages) {
		if (!allowedUsages.has(usage)) {
			return false;
		}
	}

	return true;
}

/**
 * Assert that the source registry fixture is ready for future references.
 *
 * @returns {void}
 */
function expectSourceRegistryFixture() {
	const registry = readProductionJson('references/source-registry.json');
	const allowedUsages = new Set(['implementation', 'test', 'fixture', 'validation']);

	// Reason: production Algorithm32 must track external algorithms and data before code or tests depend on them.
	// Source: user production kickoff guidance, 2026-06-27; Algorithm32 Requirements, source-backed validation principles.
	expect(registry).toEqual(jasmine.objectContaining({
		kind: 'algorithm32-production-source-registry',
		id: 'algorithm32-production-source-registry',
		status: 'scaffold',
		sources: jasmine.any(Array),
	}));

	for (const source of registry.sources) {
		expect(source.id).toEqual(jasmine.any(String));
		expect(source.usage).toEqual(jasmine.any(Array));
		expect(source.title).toEqual(jasmine.any(String));
		expect(source.citation).toEqual(jasmine.any(String));
		expect(source.supports).toEqual(jasmine.any(String));
		expect(source.consumers).toEqual(jasmine.any(Array));
		expect(hasOnlyAllowedUsages(source.usage, allowedUsages)).toBe(true);
	}
}

/**
 * Assert that complex scaffold types live in the ambient type file.
 *
 * @returns {void}
 */
function expectAmbientTypeFile() {
	const types = readProductionText('types.d.ts');

	// Reason: complex production and fixture packet shapes belong in ambient types with property documentation.
	// Source: Naming And Placement Conventions, JSDoc and types.d.ts guidance.
	expect(types).toContain('type Algorithm32ProductionReferenceRegistry');
	expect(types).toContain('type Algorithm32ProductionExternalReferenceSource');
	expect(types).toContain('type Algorithm32ProductionReferencePointer');
	expect(types).toContain('Store the AMA-style numbered reference entry from references.md.');
	expect(types).toContain('Store the figure locator inside the referenced source.');
	expect(types).toContain('Store the row, record, wavelength, or dataset-entry locator');
	expect(types).toContain('Store the external source entries currently available to cite.');
}

/**
 * Assert that primary model interface files use PascalCase interface names.
 *
 * @returns {void}
 */
function expectPrimaryModelInterfaceTypeFiles() {
	const expectedFiles = [
		['types/AtmosphereModel.d.ts', 'interface AtmosphereModel'],
		['types/Color.d.ts', 'interface Color'],
		['types/GeometryModel.d.ts', 'interface GeometryModel'],
		['types/LightSourceModel.d.ts', 'interface LightSourceModel'],
	];

	for (const [relativePath, interfaceDeclaration] of expectedFiles) {
		const source = readProductionText(relativePath);

		// Reason: single-interface ambient type files should mirror class naming and use PascalCase primary interface filenames.
		// Source: Algorithm32 production design discussion, 2026-06-28.
		expect(source).toContain(interfaceDeclaration);
	}
}

/**
 * Assert that primary model interface files stay focused on the interface.
 *
 * @returns {void}
 */
function expectFocusedPrimaryModelInterfaceTypeFiles() {
	const primaryFiles = [
		'types/AtmosphereModel.d.ts',
		'types/Color.d.ts',
		'types/GeometryModel.d.ts',
		'types/LightSourceModel.d.ts',
	];
	const helperTypes = readProductionText('types/types.d.ts');
	const quantityTypes = readProductionText('quantities/types.d.ts');

	expect(quantityTypes).toContain('interface SpectralBasis');
	expect(quantityTypes).not.toMatch(/^export\s/mu);
	expect(helperTypes).not.toMatch(/type SpectralBasis\s*=\s*import\(/u);
	expect(helperTypes).toContain('type DirectLightingSample');
	expect(helperTypes).not.toContain('IncidentRadiance');
	expect(helperTypes).toContain('type AtmosphereCoordinate');
	expect(helperTypes).toContain('type AtmospherePath');
	expect(helperTypes).toContain('type SourceRelativePosition');
	expect(helperTypes).not.toContain('type CacheAccess');
	expect(helperTypes).toContain('type ScatteringCacheSampleRequest');
	expect(helperTypes).toContain('type ScatteringCacheBuildRequest');
	expect(helperTypes).toContain('type ColorConversionRequest');
	expect(helperTypes).toContain('type ColorSample');
	expect(helperTypes).toContain('type RaySegment');
	expect(helperTypes).toContain('type ExecutionConfig');
	expect(helperTypes).not.toContain('SpectralModel');

	for (const relativePath of primaryFiles) {
		const source = readProductionText(relativePath);

		// Reason: single-interface type files should stay focused; supporting request/sample/descriptor types live in types/types.d.ts.
		// Source: Algorithm32 production type layout guidance, 2026-06-28.
		expect(source).not.toMatch(/^\s*(?:export\s+)?type\s+/mu);
	}
}

/**
 * Assert that documented string unions explain each literal value.
 *
 * @returns {void}
 */
function expectStringUnionValueDocumentation() {
	const expectations = [
		['types.d.ts', '**implementation** - The source supports production implementation logic.'],
		['types.d.ts', '**scaffold** - The registry exists as a starting contract'],
	];

	for (const [relativePath, expectedText] of expectations) {
		const source = readProductionText(relativePath);

		// Reason: string literal unions should document each allowed value directly in the ambient type JSDoc.
		// Source: Algorithm32 production type documentation guidance, 2026-06-28.
		expect(source).toContain(expectedText);
	}
}

/**
 * Assert that model interfaces do not expose specific implementation families.
 *
 * @returns {void}
 */
function expectModelInterfacesHideImplementationFamilies() {
	const modelFiles = [
		'types/AtmosphereModel.d.ts',
		'types/Color.d.ts',
		'types/GeometryModel.d.ts',
		'types/LightSourceModel.d.ts',
	];
	const implementationFamilyTerms = [
		'ModelFamily',
		'family:',
		`"distant-${String.fromCharCode(115, 117, 110)}"`,
		`"local-${String.fromCharCode(115, 117, 110)}"`,
		'"spherical-atmosphere"',
		'"flat-atmosphere"',
		'"spherical-atmosphere-geometry"',
		'"flat-atmosphere-geometry"',
	];

	for (const relativePath of modelFiles) {
		const source = readProductionText(relativePath);

		for (const implementationFamilyTerm of implementationFamilyTerms) {
			// Reason: algorithm execution should depend on model behavior, not know concrete source/atmosphere/geometry implementation families.
			// Source: Algorithm32 production model interface design discussion, 2026-06-28.
			expect(source).not.toContain(implementationFamilyTerm);
		}
	}
}

/**
 * Assert that interface method JSDoc documents parameters and returns.
 *
 * @returns {void}
 */
function expectInterfaceMethodJsdocStyle() {
	const expectations = [
		['types/AtmosphereModel.d.ts', '@param coordinate - Supplies the atmosphere coordinate to sample.'],
		['types/AtmosphereModel.d.ts', '@returns The sampled atmosphere medium coefficients.'],
		['types/AtmosphereModel.d.ts', '@returns The optical-depth sample.'],
		['types/Color.d.ts', '@param request - Supplies the spectral sample and display conversion'],
		['types/Color.d.ts', '@returns The converted display color sample.'],
		['types/GeometryModel.d.ts', '@param request - Supplies geometry-owned view ray request facts.'],
		['types/GeometryModel.d.ts', '@returns The resolved view ray segment.'],
		['types/GeometryModel.d.ts', '@returns The resolved physical position stencil.'],
		['types/LightSourceModel.d.ts', '@returns The source-specific cache controller.'],
		['types/LightSourceModel.d.ts', '@returns The direct lighting sample.'],
		['types/LightSourceModel.d.ts', '@returns The source path limit.'],
	];

	for (const [relativePath, expectedText] of expectations) {
		const source = readProductionText(relativePath);

		// Reason: method JSDoc should document parameters with a hyphen after the name and include return documentation.
		// Source: Algorithm32 production JSDoc guidance, 2026-06-28.
		expect(source).toContain(expectedText);
	}
}

/**
 * Assert that stale scaffold-era first-slice contracts are no longer public
 * production contracts.
 *
 * @returns {void}
 */
function expectNoStaleFirstSliceContracts() {
	const inspectedFiles = walkProductionFiles()
		.filter((relativePath) => !relativePath.startsWith('_tests/'))
		.filter((relativePath) => !relativePath.includes('/_tests/'))
		.filter((relativePath) => /\.(?:js|d\.ts)$/.test(relativePath));
	const forbiddenSnippets = [
		'resolveRayDistance',
		'RayDistanceRequest',
		'IncidentRadiance',
		'incidentRadiance',
		'incident-radiance',
		'createIncidentRadianceCache',
		'lookupIncidentRadiance',
		'debugView',
		'setScene',
		'setCamera',
	];
	const offenders = [];

	for (const relativePath of inspectedFiles) {
		const source = readProductionText(relativePath);

		for (const forbiddenSnippet of forbiddenSnippets) {
			if (source.includes(forbiddenSnippet)) {
				offenders.push(`${relativePath}: ${forbiddenSnippet}`);
			}
		}
	}

	// Reason: Milestone 0 removes scaffold-era contracts superseded by the reconciliation handoff.
	// Source: Algorithm32 Production Implementation Plan, Milestone 0.
	expect(offenders).toEqual([]);
}

/**
 * Assert that production implementation source does not import POC modules.
 *
 * @returns {void}
 */
function expectNoPocRuntimeImports() {
	const implementationFiles = walkProductionFiles()
		.filter(isProductionImplementationJavaScript);
	const offenders = [];

	for (const relativePath of implementationFiles) {
		const source = readProductionText(relativePath);

		if (/from\s+['"].*\/POC\/|import\s*\(.*\/POC\//.test(source)) {
			offenders.push(relativePath);
		}
	}

	// Reason: POC modules are promotion evidence, not runtime dependencies for production modules.
	// Source: Algorithm32 Production Design, Production Boundaries.
	expect(offenders).toEqual([]);
}

/**
 * Assert that inherited app-level local source tint facts do not enter production.
 *
 * @returns {void}
 */
function expectNoFlatAppSourceTintLeakage() {
	const productionFiles = walkProductionFiles()
		.filter((relativePath) => !relativePath.startsWith('_tests/'))
		.filter((relativePath) => !relativePath.includes('/_tests/'))
		.filter((relativePath) => /\.(?:js|d\.ts|json|md)$/.test(relativePath));
	const forbiddenPatterns = [
		['sourceColor identifier', /\bsourceColor\b/],
		['sourceColour identifier', /\bsourceColour\b/],
		['source tint label', /source[-\s]?tint/i],
		['inherited flat-app object tint', /\br\s*:\s*1\s*,\s*g\s*:\s*0\.98\s*,\s*b\s*:\s*0\.95\b/],
		['inherited flat-app JSON tint', /"r"\s*:\s*1\s*,\s*"g"\s*:\s*0\.98\s*,\s*"b"\s*:\s*0\.95/],
	];
	const offenders = [];

	for (const relativePath of productionFiles) {
		const source = readProductionText(relativePath);

		for (const [label, pattern] of forbiddenPatterns) {
			if (pattern.test(source)) {
				offenders.push(`${relativePath}: ${label}`);
			}
		}
	}

	// Reason: the RGB local-source tint was inherited from the flat app and has no external physics reference.
	// Source: Algorithm32 Production Design, App Tint Rejection and Production Guardrail.
	expect(offenders).toEqual([]);
}

/**
 * Assert that generic production core does not use solar-specific language.
 *
 * @returns {void}
 */
function expectNoSolarLanguageOutsideLightSourceImplementations() {
	const productionFiles = walkProductionFiles()
		.filter((relativePath) => !relativePath.startsWith('_tests/'))
		.filter((relativePath) => !relativePath.includes('/_tests/'))
		.filter((relativePath) => !relativePath.startsWith('light-sources/'))
		.filter((relativePath) => !relativePath.includes('/light-sources/'))
		// The production plan assigns this one cross-stage policy to fixtures.
		.filter((relativePath) =>
			relativePath
				!== 'fixtures/local-sun-gpu-cache-parity-policy.json')
		.filter((relativePath) => /\.(?:js|d\.ts|json|md)$/.test(relativePath));
	const offenders = [];

	for (const relativePath of productionFiles) {
		const source = readProductionText(relativePath);

		if (/\bsun\b/i.test(source)) {
			offenders.push(relativePath);
		}
	}

	// Reason: generic Algorithm32 core consumes light sources; solar-specific language belongs only in concrete light-source implementations.
	// Source: Algorithm32 production light-source abstraction decision, 2026-06-29.
	expect(offenders).toEqual([]);
}

/**
 * Register the Algorithm32 production scaffold specs.
 *
 * @returns {void}
 */
function registerAlgorithm32ProductionScaffoldSpecs() {
	it('keeps a source registry fixture for implementation and test references', expectSourceRegistryFixture);
	it('keeps complex scaffold types in the ambient type file', expectAmbientTypeFile);
	it('keeps primary model interface type files named after their interfaces', expectPrimaryModelInterfaceTypeFiles);
	it('keeps primary model interface type files focused', expectFocusedPrimaryModelInterfaceTypeFiles);
	it('documents string union values in ambient type JSDoc', expectStringUnionValueDocumentation);
	it('keeps model interfaces independent of specific implementation families', expectModelInterfacesHideImplementationFamilies);
	it('documents interface method parameters and returns', expectInterfaceMethodJsdocStyle);
	it('removes stale first-slice scaffold contracts', expectNoStaleFirstSliceContracts);
	it('keeps POC imports out of production implementation files', expectNoPocRuntimeImports);
	it('rejects inherited flat-app local source tint facts', expectNoFlatAppSourceTintLeakage);
	it('keeps solar-specific language out of generic production core', expectNoSolarLanguageOutsideLightSourceImplementations);
}

describe('Algorithm32 production scaffold', registerAlgorithm32ProductionScaffoldSpecs);
