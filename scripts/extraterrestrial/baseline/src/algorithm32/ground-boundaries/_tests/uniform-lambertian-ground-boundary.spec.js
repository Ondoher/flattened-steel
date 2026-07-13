import {
	createSpectralBasis,
	createSpectralPacket,
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
} from '../../quantities/index.js';
import { UniformLambertianGroundBoundary } from '../index.js';

function createBasis(id = 'ground-brdf-test-basis') {
	return createSpectralBasis({
		id,
		channels: [
			{
				id: 'blue',
				center: { value: 450, units: 'nanometers' },
				width: { value: 100, units: 'nanometers' },
			},
			{
				id: 'green',
				center: { value: 550, units: 'nanometers' },
				width: { value: 100, units: 'nanometers' },
			},
			{
				id: 'red',
				center: { value: 650, units: 'nanometers' },
				width: { value: 100, units: 'nanometers' },
			},
		],
	});
}

function createAlbedo({
	basis = createBasis(),
	values = [0, 0.5, 1],
	provenanceIdentity = 'ground-brdf-test-albedo-v1',
} = {}) {
	return createSpectralPacket({
		quantity: SPECTRAL_QUANTITIES.REFLECTANCE,
		units: SPECTRAL_UNITS.DIMENSIONLESS,
		basis,
		values,
		provenanceIdentity,
	});
}

function createRequest(spectralBasis) {
	return {
		hit: {
			position: { coordinates: [0, 0, 0], units: 'meters' },
			normal: [0, 0, 1],
			distance: { value: 1, units: 'meters' },
		},
		incomingDirection: [0, 0, 1],
		outgoingDirection: [0, 1, 0],
		spectralBasis,
	};
}

describe('UniformLambertianGroundBoundary', () => {
	it('returns albedo divided by pi as a typed spectral BRDF', () => {
		const albedo = createAlbedo();
		const boundary = new UniformLambertianGroundBoundary({
			id: 'test-lambertian-ground-v1',
			albedo,
		});
		const brdf = boundary.evaluateBrdf(createRequest(albedo.basis));

		expect(brdf.quantity).toBe(SPECTRAL_QUANTITIES.BRDF);
		expect(brdf.units).toBe(SPECTRAL_UNITS.INVERSE_SOLID_ANGLE);
		expect(brdf.basis).toBe(albedo.basis);
		expect(brdf.values).toEqual([0, 0.5 / Math.PI, 1 / Math.PI]);
		expect(brdf.provenanceIdentity)
			.toBe(`algorithm32-uniform-lambertian-brdf-v1:${albedo.contentHash}`);
		expect(boundary.evaluateBrdf(createRequest(albedo.basis))).toBe(brdf);
	});

	it('contributes the same typed BRDF to reflective cache construction', () => {
		const albedo = createAlbedo();
		const boundary = new UniformLambertianGroundBoundary({
			id: 'cache-lambertian-ground-v1',
			albedo,
		});
		const module = boundary.createCacheModule(
			/** @type {CacheBuildContext} */ (/** @type {unknown} */ ({})),
		);
		const brdfBinding = module.bindings.find(
			({ spec }) => spec.id === 'uniform-lambertian-ground-cache-brdf',
		);

		expect(module.owner).toBe('ground');
		expect(module.provides).toEqual(['ground.reflectance']);
		expect(brdfBinding?.value).toEqual(jasmine.objectContaining({
			quantity: SPECTRAL_QUANTITIES.BRDF,
			units: SPECTRAL_UNITS.INVERSE_SOLID_ANGLE,
			values: [0, 0.5 / Math.PI, 1 / Math.PI],
		}));
		expect(module.blocks.map(({ source }) => source).join('\n'))
			.toContain('float cacheGroundBrdf(');
		expect(module.blocks.map(({ source }) => source).join('\n'))
			.toContain('return uCacheGroundBrdf[wavelengthIndex];');

		const changed = new UniformLambertianGroundBoundary({
			id: 'cache-lambertian-ground-v1',
			albedo: createAlbedo({
				values: [0, 0.25, 1],
				provenanceIdentity: 'changed-cache-ground-albedo-v1',
			}),
		}).createCacheModule(
			/** @type {CacheBuildContext} */ (/** @type {unknown} */ ({})),
		);
		expect(changed.contentHash).not.toBe(module.contentHash);
	});

	it('describes basis and albedo content without exposing executable values', () => {
		const albedo = createAlbedo();
		const boundary = new UniformLambertianGroundBoundary({
			id: 'described-lambertian-ground-v1',
			albedo,
		});
		const descriptor = boundary.describe();

		expect(descriptor).toEqual(jasmine.objectContaining({
			kind: 'algorithm32-ground-boundary',
			id: 'described-lambertian-ground-v1',
			model: 'uniform-lambertian-spectral-ground-v1',
			quantity: 'spectral-brdf',
			units: 'sr^-1',
			brdf: 'lambertian',
			spectralBasisHash: albedo.basisHash,
			albedoHash: albedo.contentHash,
		}));
		expect(descriptor.contentHash).toMatch(/^sha256:[0-9a-f]{64}$/u);
		expect('values' in descriptor).toBeFalse();
		expect(Object.isFrozen(descriptor)).toBeFalse();
		expect(boundary.describe()).not.toBe(descriptor);
	});

	it('requires physical reflectance values', () => {
		for (const values of [
			[-0.01, 0.5, 1],
			[0, 0.5, 1.01],
		]) {
			expect(() => new UniformLambertianGroundBoundary({
				albedo: createAlbedo({ values }),
			})).toThrowError(/in \[0, 1\]/u);
		}
	});

	it('rejects implicit resampling across spectral bases', () => {
		const albedo = createAlbedo();
		const boundary = new UniformLambertianGroundBoundary({ albedo });

		expect(() => boundary.evaluateBrdf(createRequest(createBasis('other-ground-basis'))))
			.toThrowError(/basis are incompatible/u);
	});

	it('derives stable boundary identity from id, basis, and albedo content', () => {
		const albedo = createAlbedo();
		const first = new UniformLambertianGroundBoundary({ id: 'identity-ground', albedo });
		const same = new UniformLambertianGroundBoundary({ id: 'identity-ground', albedo });
		const changedAlbedo = new UniformLambertianGroundBoundary({
			id: 'identity-ground',
			albedo: createAlbedo({
				values: [0, 0.25, 1],
				provenanceIdentity: 'changed-ground-brdf-test-albedo-v1',
			}),
		});
		const changedId = new UniformLambertianGroundBoundary({
			id: 'other-identity-ground',
			albedo,
		});

		expect(same.describe().contentHash).toBe(first.describe().contentHash);
		expect(changedAlbedo.describe().contentHash).not.toBe(first.describe().contentHash);
		expect(changedId.describe().contentHash).not.toBe(first.describe().contentHash);
	});
});
