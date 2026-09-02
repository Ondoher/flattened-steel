import ScalarMath from '../../math/ScalarMath.js';

/** Executable local-solar-zenith interpolation domain. */
export default class SolarZenithDomain {
	/** @readonly @type {string} */ id;
	/** @readonly @type {number} */ count;
	/** @readonly @type {Angle} */ firstCenter;
	/** @readonly @type {Angle} */ spacing;
	/** @readonly @type {readonly SolarZenithNode[]} */ nodes;

	/**
	 * Creates one uniform cell-center local-solar-zenith domain.
	 *
	 * @param {SolarZenithDomainDefinition} definition - The domain identity and cell-center facts.
	 */
	constructor(definition) {
		if (!Number.isInteger(definition.count) || definition.count < 2) {
			throw new RangeError('SolarZenithDomain count must be an integer of at least two.');
		}
		if (definition.firstCenter.units !== 'radians' || definition.spacing.units !== 'radians') {
			throw new RangeError('SolarZenithDomain angles must use radians.');
		}
		if (!(definition.spacing.value > 0) || !Number.isFinite(definition.spacing.value)) {
			throw new RangeError('SolarZenithDomain spacing must be positive and finite.');
		}

		this.id = definition.id;
		this.count = definition.count;
		this.firstCenter = definition.firstCenter;
		this.spacing = definition.spacing;
		this.nodes = Array.from({length: definition.count}, (_unused, index) => {
			const radians = definition.firstCenter.value + index * definition.spacing.value;

			return {
				index,
				angle: {value: radians, units: 'radians'},
				muS: Math.cos(radians),
			};
		});
	}

	/**
	 * Call this method to resolve a physical local solar-zenith angle into one or two interpolation taps.
	 *
	 * @param {Angle} angle - The local solar-zenith angle.
	 * @returns {SolarZenithStencil} - The normalized interpolation stencil.
	 */
	resolveStencil(angle) {
		if (angle.units !== 'radians' || !Number.isFinite(angle.value)) {
			throw new RangeError('Solar-zenith lookup angle must be finite radians.');
		}

		const coordinate = ScalarMath.clamp(
			(angle.value - this.firstCenter.value) / this.spacing.value,
			0,
			this.count - 1,
		);
		const lowerIndex = Math.floor(coordinate);
		const upperIndex = Math.ceil(coordinate);

		if (lowerIndex === upperIndex) {
			return {indices: [lowerIndex], weights: [1]};
		}

		const upperWeight = coordinate - lowerIndex;
		return {
			indices: [lowerIndex, upperIndex],
			weights: [1 - upperWeight, upperWeight],
		};
	}
}
