/** Fixed scene request retained from immutable run 000493. */
export const SAN_JOSE_NAUTICAL_SCENE = Object.freeze({
	id: 'sunset-plus-one-hour',
	location: Object.freeze({
		name: 'San Jose',
		latitudeDegrees: 37.3382,
		longitudeDegrees: -121.8863,
	}),
	timeIso: '2024-06-21T04:26:03.503Z',
	directionToSourceUpEastNorth: Object.freeze([
		-0.16946677586889025,
		-0.7579900644516986,
		0.6298667113517853,
	]),
	solarElevationDegrees: -9.756817735470484,
	observer: Object.freeze({
		heightMeters: 1.7,
		upDirectionUpEastNorth: Object.freeze([1, 0, 0]),
	}),
	camera: Object.freeze({
		viewAzimuthDegrees: -59.99625193137896,
		viewElevationDegrees: 5,
		verticalFieldOfViewDegrees: 78,
		viewport: Object.freeze({width: 640, height: 400}),
	}),
	parents: Object.freeze({
		currentSceneRunId:
			'000493-san-jose-nautical-twilight-ozone-f68-w39-preview',
		currentSceneArtifactSetSha256:
			'63ccccc8ce9e2796781dc6ac0fbd4c912c4340815050215f85dd263ea8ea966f',
		actualPointJ1ControlRunId:
			'000497-san-jose-nautical-twilight-actual-point-j1-control',
		actualPointJ1ControlArtifactSetSha256:
			'3460c9e3b4d450757861ad57ef9ae459d0a34b2d52af729611a68638cae82877',
	}),
});

export default SAN_JOSE_NAUTICAL_SCENE;
