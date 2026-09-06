import {StableValueHash} from '../../value-identity/StableValueHash.js';
import {ShaderSource} from '../../shader-assembly/base/ShaderSource.js';
import {STELLAR_ONE_PIXEL_PRESENTATION} from './StellarPointPresentation.js';
import {StellarScreenPaletteGenerationPolicy} from './StellarScreenPaletteGenerationPolicy.js';

const SOURCE_MEMBERS_VALUE_KEY = 'runtime.celestial.stellarSourceMembers';
const SOURCE_SPECTRA_VALUE_KEY = 'runtime.celestial.stellarSourceSpectra';
const SCREEN_INDEX_OUTPUT_ID = 'celestial.stellar.screen-index';
const ORDER_DEPTH_OUTPUT_ID = 'celestial.stellar.order-depth';
const PALETTE_OUTPUT_ID = 'celestial.stellar.palette';

/** Standard-pipeline point-index and sparse-palette shader-stage source owner. */
export class StellarScreenPaletteGenerationStages {
	/** Immutable stellar input table. @type {StellarGenerationSourceTable} */
	_source;
	/** Geometry-owned transform and classification operations. @type {StellarGenerationGeometryShaderContribution} */
	_geometry;
	/** Validated capacity, format, and numerical rules. @type {StellarScreenPaletteGenerationPolicy} */
	_policy;

	/**
	 * Create the stellar generation-stage source owner.
	 *
	 * @param {StellarScreenPaletteGenerationStagesConfiguration} configuration - Source table and geometry operations.
	 */
	constructor(configuration) {
		this._source = configuration.source;
		this._geometry = configuration.geometry;
		this._policy = StellarScreenPaletteGenerationPolicy.createBase(this._source.layout);
	}

	/** @returns {readonly StellarScreenPaletteGenerationStageDescription[]} - Ordered point-index and sparse-palette stages. */
	createStages() {
		return [this._createPointStage(), this._createPaletteStage()];
	}

	/** @returns {readonly CelestialGenerationBindingRequirement[]} - Immutable split-source sampler bindings. */
	_sourceBindings() {
		return [
			{
				id: 'stellar-source.members',
				owner: 'stellarSource',
				kind: 'texture',
				updateFrequency: 'setup',
				valueKey: SOURCE_MEMBERS_VALUE_KEY,
				required: true,
			},
			{
				id: 'stellar-source.spectra',
				owner: 'stellarSource',
				kind: 'texture',
				updateFrequency: 'setup',
				valueKey: SOURCE_SPECTRA_VALUE_KEY,
				required: true,
			},
		];
	}

	/** @returns {string} - GLSL declarations for geometry-owned uniforms. */
	_geometryUniformSource() {
		return this._geometry.uniforms.map((uniform) => `uniform ${uniform.type} ${uniform.name};`).join('\n');
	}

	/** @returns {StellarScreenPaletteGenerationStageDescription} - One-member-per-point deterministic index stage. */
	_createPointStage() {
		const memberCount = this._source.layout.memberCount;
		const geometryUniforms = this._geometryUniformSource();
		const vertexShaderSource = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;

uniform highp sampler2D uStellarSourceMembers;
${geometryUniforms}

${this._geometry.source}

flat out highp uint vStellarCandidateIndex;

void main() {
	int memberIndex = gl_VertexID;
	vec3 catalogDirection = texelFetch(uStellarSourceMembers, ivec2(memberIndex, 0), 0).xyz;
	StellarProjectionResult projection = stellarProjectCatalogDirection(catalogDirection);
	vStellarCandidateIndex = uint(memberIndex + 1);
	gl_PointSize = 1.0;
	if (!projection.occupied) {
		gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
		return;
	}
	float orderDepth = (float(memberIndex) + 1.0) / ${Number(memberCount + 1).toFixed(1)};
	gl_Position = vec4(stellarTopLeftPixelCenterToClip(projection.topLeftPixel), orderDepth * 2.0 - 1.0, 1.0);
}`;
		const fragmentShaderSource = `#version 300 es
precision highp float;
precision highp int;

flat in highp uint vStellarCandidateIndex;
layout(location = 0) out highp uint outStellarScreenIndex;

void main() {
	outStellarScreenIndex = vStellarCandidateIndex;
}`;
		return this._stage({
			id: 'celestial-generation.stellar-point-index',
			order: 100,
			vertexCount: memberCount,
			topology: 'points',
			vertexShaderSource,
			fragmentShaderSource,
			depthPolicy: 'lowest-canonical-member',
			outputs: [
				{
					id: SCREEN_INDEX_OUTPUT_ID,
					format: 'R16UI',
					persistence: 'published',
					shape: 'viewport',
					clearValue: 0,
				},
				{
					id: ORDER_DEPTH_OUTPUT_ID,
					format: 'DEPTH_COMPONENT24',
					persistence: 'transient',
					shape: 'viewport-depth-order',
					clearValue: 1,
				},
			],
			dependencies: [],
			bindingRequirements: [this._sourceBindings()[0], ...this._geometry.bindingRequirements],
			completionBoundary: 'stage',
		});
	}

	/** @returns {StellarScreenPaletteGenerationStageDescription} - Sparse representative and collision-accumulation stage. */
	_createPaletteStage() {
		const layout = this._source.layout;
		const paletteLayout = this._policy.layout;
		const pointPresentationScale = ShaderSource.formatFloat(
			STELLAR_ONE_PIXEL_PRESENTATION.irradianceToBoundaryRadianceScale,
		);
		const geometryUniforms = this._geometryUniformSource();
		const vertexShaderSource = `#version 300 es
precision highp float;

void main() {
	vec2 position = gl_VertexID == 0
		? vec2(-1.0, -1.0)
		: (gl_VertexID == 1 ? vec2(3.0, -1.0) : vec2(-1.0, 3.0));
	gl_Position = vec4(position, 0.0, 1.0);
}`;
		const fragmentShaderSource = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
precision highp usampler2D;

uniform highp sampler2D uStellarSourceMembers;
uniform highp sampler2D uStellarSourceSpectra;
uniform highp usampler2D uStellarScreenIndex;
${geometryUniforms}

${this._geometry.source}

layout(location = 0) out highp float outStellarPaletteValue;

vec3 stellarGenerationCatalogDirection(int memberIndex) {
	return texelFetch(uStellarSourceMembers, ivec2(memberIndex, 0), 0).xyz;
}

void main() {
	int entryIndex = int(gl_FragCoord.x);
	int channelIndex = int(gl_FragCoord.y);
	outStellarPaletteValue = 0.0;
	if (entryIndex == 0 || entryIndex > ${layout.memberCount}
		|| channelIndex < 0 || channelIndex >= ${paletteLayout.rowCount}) {
		return;
	}
	int representativeMemberIndex = entryIndex - 1;
	StellarProjectionResult representative = stellarProjectCatalogDirection(
		stellarGenerationCatalogDirection(representativeMemberIndex)
	);
	if (!representative.occupied) {
		return;
	}
	uint selectedIndex = texelFetch(
		uStellarScreenIndex,
		stellarTopLeftPixelToFramebuffer(representative.topLeftPixel),
		0
	).r;
	if (selectedIndex != uint(entryIndex)) {
		return;
	}
	float accumulatedValue = 0.0;
	for (int memberIndex = 0; memberIndex < ${layout.memberCount}; memberIndex += 1) {
		StellarProjectionResult memberProjection = stellarProjectCatalogDirection(
			stellarGenerationCatalogDirection(memberIndex)
		);
		if (!memberProjection.occupied
			|| any(notEqual(memberProjection.topLeftPixel, representative.topLeftPixel))) {
			continue;
		}
		if (channelIndex == ${paletteLayout.visualMagnitudeRow}) {
			float visualMagnitude = texelFetch(uStellarSourceMembers, ivec2(memberIndex, 0), 0).w;
			accumulatedValue += pow(10.0, -0.4 * visualMagnitude);
		} else {
			float irradiance = texelFetch(uStellarSourceSpectra, ivec2(memberIndex, channelIndex), 0).r;
			accumulatedValue += irradiance * ${pointPresentationScale};
		}
	}
	outStellarPaletteValue = channelIndex == ${paletteLayout.visualMagnitudeRow}
		? -2.5 * log(accumulatedValue) / log(10.0)
		: accumulatedValue;
}`;
		return this._stage({
			id: 'celestial-generation.stellar-sparse-palette',
			order: 110,
			vertexCount: 3,
			topology: 'fullscreen-triangles',
			vertexShaderSource,
			fragmentShaderSource,
			depthPolicy: 'disabled',
			outputs: [
				{
					id: PALETTE_OUTPUT_ID,
					format: 'R32F',
					persistence: 'published',
					shape: 'stellar-entry-by-native-channel-plus-visual-magnitude',
					clearValue: 0,
				},
			],
			dependencies: [SCREEN_INDEX_OUTPUT_ID],
			bindingRequirements: [...this._sourceBindings(), ...this._geometry.bindingRequirements],
			completionBoundary: 'publication',
		});
	}

	/**
	 * Add a stable source hash to one complete stage description.
	 *
	 * @param {Omit<CelestialGenerationStageDescription, 'sourceHash'>} stage - Complete unhashed stage.
	 * @returns {StellarScreenPaletteGenerationStageDescription} - Hashed standard-pipeline stage.
	 */
	_stage(stage) {
		const policyIdentity = this._policy.identity;
		const stellarLayout = this._policy.layout;
		const numericalPolicy = this._policy.numericalPolicy;
		return {
			...stage,
			policyIdentity,
			stellarLayout,
			numericalPolicy,
			sourceHash: StableValueHash.stableHash({
				geometryIdentity: this._geometry.identity,
				policyIdentity,
				sourceIdentity: this._source.identity,
				stage,
			}),
		};
	}
}
