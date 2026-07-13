import { createScalarArrayTextureLayout } from '../../caches/ScalarArrayTextureLayout.js';

/** Pack one geometry-owned primary celestial payload into the standard R32F array layout. */
export class PrimaryCelestialR32FRepresentation {
	constructor({ primaryCache, sourceId }) {
		const payload = primaryCache?.payloads?.get(sourceId);
		if (!payload?.field?.data) throw new TypeError('R32F representation requires an assembled source payload.');
		this.sourceId = sourceId;
		this.directionCount = payload.domain.uNodes.length;
		this.positionCount = payload.domain.altitudeNodesMeters.length;
		this.wavelengthCount = payload.channelCount;
		this.layout = createScalarArrayTextureLayout({ id: `primary-celestial-${sourceId}-r32f-v1`, directionCount: this.directionCount, positionCount: this.positionCount, wavelengthCount: this.wavelengthCount });
		this.values = new Float32Array(this.directionCount * this.positionCount * this.wavelengthCount);
		for (let position = 0; position < this.positionCount; position += 1) for (let direction = 0; direction < this.directionCount; direction += 1) for (let wavelength = 0; wavelength < this.wavelengthCount; wavelength += 1) this.values[this.offset(direction, position, wavelength)] = payload.field.data[((position * this.directionCount + direction) * this.wavelengthCount) + wavelength];
	}

	offset(direction, position, wavelength) { return ((wavelength * this.positionCount + position) * this.directionCount) + direction; }
	read(direction, position, wavelength) { return this.values[this.offset(direction, position, wavelength)]; }
}

export default PrimaryCelestialR32FRepresentation;
