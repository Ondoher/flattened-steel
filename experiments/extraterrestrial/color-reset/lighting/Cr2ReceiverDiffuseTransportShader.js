import {
	ReceiverEnvironmentLightTransportShader,
} from '../controls/production-v1/src/algorithm32/implementation/scene-lighting/ReceiverEnvironmentLightTransportShader.js';

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

/**
 * Contained CR2 specialization of the production common-path transport
 * shader. Production owns every transport contribution; CR2 changes only the
 * number of receiver directions addressed by the diagnostic ingress texture.
 */
export class Cr2ReceiverDiffuseTransportShader extends ReceiverEnvironmentLightTransportShader {
	constructor(directionCount) {
		super();
		requireCondition(
			Number.isSafeInteger(directionCount) && directionCount > 0,
			'CR2 receiver diffuse shader requires a positive direction count.',
		);
		this._directionCount = directionCount;
	}

	_geometryContribution(geometryContribution) {
		const contribution = super._geometryContribution(geometryContribution);
		let replacementCount = 0;
		const functions = contribution.functions.map((block) => {
			if (block.id !== 'geometry-reconstruct-helper') return block;
			replacementCount += 1;
			return {
				...block,
				code: `ViewRay reconstructViewRay(vec2 textureCoordinates) {
	int directionIndex = clamp(int(floor(textureCoordinates.x * ${this._directionCount}.0)), 0, ${this._directionCount - 1});
	vec3 direction = normalize(texelFetch(uReceiverEnvironmentDirections, ivec2(directionIndex, 0), 0).xyz);
	return ViewRay(uCameraWorldPositionMeters, direction);
}`,
			};
		});
		requireCondition(
			replacementCount === 1,
			'CR2 could not specialize the one production receiver-direction ingress.',
		);
		return {
			...contribution,
			id: `${contribution.id}-cr2-${this._directionCount}`,
			functions,
		};
	}
}
