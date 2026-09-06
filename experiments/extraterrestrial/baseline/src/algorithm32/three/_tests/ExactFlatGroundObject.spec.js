import * as THREE from 'three';
import ExactFlatGroundObject from '../ExactFlatGroundObject.js';

describe('ExactFlatGroundObject', () => {
	it('accepts only unit-bearing scene contracts and raycasts the exact plane', () => {
		const object = new ExactFlatGroundObject({
			center: { coordinates: [0, 0, 0], units: 'scene-units' },
			width: { value: 4, units: 'scene-units' },
			depth: { value: 4, units: 'scene-units' },
			sceneScale: { value: 10, units: 'meters-per-scene-unit' },
		});
		const raycaster = new THREE.Raycaster(
			new THREE.Vector3(0, 2, 0),
			new THREE.Vector3(0, -1, 0),
		);
		const intersections = [];

		object.updateMatrixWorld(true);
		object.raycast(raycaster, intersections);

		expect(intersections.length).toBe(1);
		expect(intersections[0].distance).toBeCloseTo(2, 12);
		expect(object.userData.sceneScale).toEqual({
			value: 10,
			units: 'meters-per-scene-unit',
		});
		expect(() => new ExactFlatGroundObject({
			widthSceneUnits: 4,
			depthSceneUnits: 4,
			metersPerSceneUnit: 10,
		})).toThrowError();
	});

	it('defaults only an absent name and preserves the nullable spectral reference sentinel', () => {
		const configuration = {
			width: { value: 4, units: 'scene-units' },
			depth: { value: 4, units: 'scene-units' },
			sceneScale: { value: 10, units: 'meters-per-scene-unit' },
		};
		const object = new ExactFlatGroundObject(configuration);
		const nullableReferenceObject = new ExactFlatGroundObject({
			...configuration,
			name: 'flat-ground',
			spectralReferenceId: null,
		});

		expect(object.name).toBe('exact-flat-ground-endpoint');
		expect(nullableReferenceObject.userData.spectralReferenceId).toBeNull();
		expect(() => new ExactFlatGroundObject({ ...configuration, name: null }))
			.toThrowError(/name/);
		expect(() => new ExactFlatGroundObject({ ...configuration, spectralReferenceId: 7 }))
			.toThrowError(/spectralReferenceId/);
	});
});
