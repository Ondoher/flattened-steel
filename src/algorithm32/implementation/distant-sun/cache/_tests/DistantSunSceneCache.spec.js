import {NATIVE_48_POSITION_DOMAIN_OWNER} from '../../../../sampling-domains/position/spherical-native/consts.js';
import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER} from '../../../../sampling-domains/direction/cubed-sphere/consts.js';
import {SOLAR_ZENITH_180_DOMAIN_OWNER} from '../../../../sampling-domains/solar-zenith/consts.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../../profiles/native-15/native-15-profile.js';
import DistantSunSceneCache from '../DistantSunSceneCache.js';
import DistantSunSceneCacheAssetLoader from './reference/DistantSunSceneCacheAssetLoader.js';
import DistantSunSceneCacheLedger from '../DistantSunSceneCacheLedger.js';

function createLedger() {
	return new DistantSunSceneCacheLedger({
		sceneSun: {
			id: 'san-jose-nautical-twilight',
			instant: '2024-06-21T04:26:03.503Z',
			directionToSourceUpEastNorth: [-0.16946677586889025, -0.7579900644516986, 0.6298667113517853],
			sourceIdentity: 'algorithm32-native-distant-collimated-sun-v1',
		},
		support: {
			id: 'san-jose-fixed-observer-complete-rotation-v1',
			bottomRadius: {value: 6360000, units: 'meters'},
			topRadius: {value: 6420000, units: 'meters'},
			observerAltitude: {value: 1.7, units: 'meters'},
			observerSolarZenith: {value: (99.75863153048778 * Math.PI) / 180, units: 'radians'},
			completeCameraRotation: true,
			arbitraryShortenedEndpoint: true,
		},
		positionDomain: NATIVE_48_POSITION_DOMAIN_OWNER,
		solarZenithDomain: SOLAR_ZENITH_180_DOMAIN_OWNER,
		outgoingDirectionDomain: CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
	});
}

function texture(id, storage, valueKey) {
	return {
		id,
		storage,
		backendId: 'scene-cache-backend',
		runtimeBinding: {id: `${id}:binding`, valueKey, fieldId: id, backendId: 'scene-cache-backend'},
		disposeCount: 0,
		dispose() {
			this.disposeCount += 1;
		},
	};
}

describe('DistantSunSceneCache', () => {
	it('repackages every Native15 scalar into the logical face-grid atlas without changing its value', () => {
		const logicalToUnique = new Uint16Array(
			CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.logicalToUniqueDirectionIndices,
		);
		const source = new Float32Array(4058 * 15);
		for (let channelIndex = 0; channelIndex < 15; channelIndex += 1) {
			for (let uniqueIndex = 0; uniqueIndex < 4058; uniqueIndex += 1) {
				source[channelIndex * 4058 + uniqueIndex] = channelIndex * 5000 + uniqueIndex;
			}
		}
		const packed = DistantSunSceneCacheAssetLoader.prototype._packRgbaChannels(source, logicalToUnique, 1);

		for (const logicalIndex of [0, 26, 728, 729, 2187, 4373]) {
			const faceIndex = Math.floor(logicalIndex / 729);
			const faceLocalIndex = logicalIndex - faceIndex * 729;
			const vIndex = Math.floor(faceLocalIndex / 27);
			const uIndex = faceLocalIndex - vIndex * 27;
			for (const channelIndex of [0, 3, 4, 8, 14]) {
				const groupIndex = Math.floor(channelIndex / 4);
				const componentIndex = channelIndex % 4;
				const atlasX = groupIndex * 162 + faceIndex * 27 + uIndex;
				const packedIndex = (vIndex * 648 + atlasX) * 4 + componentIndex;
				expect(packed[packedIndex]).toBe(source[channelIndex * 4058 + logicalToUnique[logicalIndex]]);
			}
			const paddingX = 3 * 162 + faceIndex * 27 + uIndex;
			expect(packed[(vIndex * 648 + paddingX) * 4 + 3]).toBe(0);
		}
	});

	it('owns two opaque textures and contributes point-local exact-seam lookup', () => {
		const ledger = createLedger();
		const cumulative = texture(
			'scene-values',
			{format: 'RGBA32F', width: 648, height: 27, layers: ledger.retainedBlockCount},
			'cache.sceneCumulativeScatteringDensity',
		);
		const index = texture(
			'scene-index',
			{format: 'R16UI', width: 4374, height: 1, layers: 1},
			'cache.sceneLogicalToUniqueDirection',
		);
		const cache = new DistantSunSceneCache({
			manifest: {
				record: {
					cacheIdentity: 'scene-cache-identity',
					exactSeamPayload: {byteLength: 150_227_160},
					logicalToUniqueIndex: {byteLength: 8_748},
				},
				requireCacheIdentity() {},
			},
			ledger,
			cumulativeTexture: cumulative,
			directionIndexTexture: index,
		});
		const contribution = cache.createShaderContribution();
		const source = contribution.functions[0].code;

		expect(cache.cacheIdentity).toBe('scene-cache-identity');
		expect(cache.resources).toEqual({
			residentTextureBytes: {value: 172_729_260, units: 'bytes'},
			hostStagingBytes: {value: 322_965_168, units: 'bytes'},
		});
		expect(cache.getRuntimeBindings().bindings).toEqual([cumulative.runtimeBinding, index.runtimeBinding]);
		expect(contribution.textures.map((entry) => entry.type)).toEqual(['sampler2DArray', 'usampler2D']);
		expect(source).toContain('vec3 up = normalize(positionMeters);');
		expect(source).toContain('distantSceneLocalOutgoingDirection');
		expect(source).toContain('dot(normalize(positionMeters), directionToSource)');
		expect(source).toContain('distantScenePackedRow');
		expect(source).toContain('uintBitsToFloat(0x7fc00000u)');
		expect(source).not.toContain('uDistantSunLogicalToUniqueDirection');
		expect(source).not.toContain('for (int channelIndex = 0;');
		expect(source).toContain('vec4 density0 = vec4(0.0);');
		expect(source).toContain('distantSceneDirectionCoordinate');
		expect(source.match(/texture\(uDistantSunSceneCumulativeCache/gu)?.length).toBe(4);

		cache.dispose();
		cache.dispose();
		expect(cumulative.disposeCount).toBe(1);
		expect(index.disposeCount).toBe(1);
		expect(() => cache.getRuntimeBindings()).toThrowError(/disposed/u);
	});

	it('preserves point-local cache coordinates and Native15 reconstruction under rotation', () => {
		const normalize = (value) => {
			const length = Math.hypot(...value);
			return value.map((component) => component / length);
		};
		const dot = (left, right) => left.reduce((sum, value, index) => sum + value * right[index], 0);
		const cross = (left, right) => [
			left[1] * right[2] - left[2] * right[1],
			left[2] * right[0] - left[0] * right[2],
			left[0] * right[1] - left[1] * right[0],
		];
		const rotate = (value) => {
			const angle = 1.137;
			return [
				value[0] * Math.cos(angle) - value[1] * Math.sin(angle),
				value[0] * Math.sin(angle) + value[1] * Math.cos(angle),
				value[2],
			];
		};
		const coordinates = (point, source, outgoing) => {
			const up = normalize(point);
			const muS = dot(up, source);
			const xAxis = normalize(source.map((value, index) => value - muS * up[index]));
			const yAxis = normalize(cross(up, xAxis));
			const localDirection = [dot(outgoing, xAxis), dot(outgoing, yAxis), dot(outgoing, up)];
			return {
				muS,
				altitudeRadius: Math.hypot(...point),
				directionStencil: CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.resolveStencil(localDirection),
			};
		};
		const reconstructNative15 = (coordinate) =>
			Array.from({length: 15}, (_unused, channel) =>
				coordinate.directionStencil.indices.reduce(
					(total, index, tap) =>
						total + coordinate.directionStencil.weights[tap] * (index + 1) * (channel + 1) * 1e-12,
					0,
				),
			);
		const point = [12, -4, 7];
		const source = normalize([0.3, 0.8, 0.52]);
		const outgoing = normalize([-0.6, 0.2, 0.77]);
		const original = coordinates(point, source, outgoing);
		const rotated = coordinates(rotate(point), rotate(source), rotate(outgoing));

		expect(rotated.altitudeRadius).toBeCloseTo(original.altitudeRadius, 12);
		expect(rotated.muS).toBeCloseTo(original.muS, 12);
		expect(rotated.directionStencil.indices).toEqual(original.directionStencil.indices);
		for (let tap = 0; tap < original.directionStencil.weights.length; tap += 1) {
			expect(rotated.directionStencil.weights[tap]).toBeCloseTo(original.directionStencil.weights[tap], 12);
		}
		const originalSpectrum = reconstructNative15(original);
		const rotatedSpectrum = reconstructNative15(rotated);
		for (let channel = 0; channel < originalSpectrum.length; channel += 1) {
			expect(rotatedSpectrum[channel]).toBeCloseTo(originalSpectrum[channel], 12);
		}
	});
});
