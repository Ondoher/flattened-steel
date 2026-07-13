import * as THREE from 'three';
import ExactSphereGroundObject from '../ExactSphereGroundObject.js';

describe('ExactSphereGroundObject', () => {
	it('accepts only unit-bearing scene contracts and raycasts the exact sphere', () => {
		const object = new ExactSphereGroundObject({
			radius: { value: 2, units: 'scene-units' },
			center: { coordinates: [0, 0, 0], units: 'scene-units' },
			sceneScale: { value: 10, units: 'meters-per-scene-unit' },
		});
		const raycaster = new THREE.Raycaster(
			new THREE.Vector3(0, 0, 5),
			new THREE.Vector3(0, 0, -1),
		);
		const intersections = [];

		object.updateMatrixWorld(true);
		object.raycast(raycaster, intersections);

		expect(intersections.length).toBe(1);
		expect(intersections[0].distance).toBeCloseTo(3, 12);
		expect(object.userData.sceneScale).toEqual({
			value: 10,
			units: 'meters-per-scene-unit',
		});
		expect(() => new ExactSphereGroundObject({
			radiusSceneUnits: 2,
			centerSceneUnits: [0, 0, 0],
			metersPerSceneUnit: 10,
		})).toThrowError();
	});

	it('defaults only an absent name and preserves the nullable spectral reference sentinel', () => {
		const configuration = {
			radius: { value: 2, units: 'scene-units' },
			center: { coordinates: [0, 0, 0], units: 'scene-units' },
			sceneScale: { value: 10, units: 'meters-per-scene-unit' },
		};
		const object = new ExactSphereGroundObject(configuration);
		const nullableReferenceObject = new ExactSphereGroundObject({
			...configuration,
			name: 'sphere-ground',
			spectralReferenceId: null,
		});

		expect(object.name).toBe('exact-sphere-ground-endpoint');
		expect(nullableReferenceObject.userData.spectralReferenceId).toBeNull();
		expect(() => new ExactSphereGroundObject({ ...configuration, name: null }))
			.toThrowError(/name/);
		expect(() => new ExactSphereGroundObject({ ...configuration, spectralReferenceId: 7 }))
			.toThrowError(/spectralReferenceId/);
	});
});
