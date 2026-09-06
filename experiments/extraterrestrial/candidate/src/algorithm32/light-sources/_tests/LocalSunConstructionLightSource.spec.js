import {
	createLocalSunShellFactCache,
} from '../create-local-sun-shell-fact-cache.js';
import LocalSunConstructionLightSource from
	'../LocalSunConstructionLightSource.js';
import { LocalSunLightSource } from '../LocalSunLightSource.js';
import {
	createTestSourceIrradiance,
} from './spectralTestValues.js';

describe('LocalSunConstructionLightSource', () => {
	it('holds only primary-J1 lighting at the containing shell mean', () => {
		const source = createSource();
		const shellFactCache =
			createLocalSunShellFactCache({
				sourceConfiguration:
					source.configuration,
			});
		const constructionSource =
			new LocalSunConstructionLightSource({
				source,
				shellFactCache,
			});
		const distanceFromSource =
			0.5 * (
				shellFactCache.boundaries[1]
				+ shellFactCache.boundaries[2]
			);
		const request = {
			sourceRelativePosition: {
				distanceFromSource: {
					value: distanceFromSource,
					units: 'meters',
				},
				directionToSource: [0, 0, 1],
			},
		};
		const expected =
			shellFactCache.resolveShell(
				distanceFromSource,
			);
		const construction =
			constructionSource.sampleDirectLighting(request);
		const continuous =
			source.sampleDirectLighting(request);

		expect(constructionSource.id).toBe(source.id);
		expect(constructionSource.describe())
			.toEqual(source.describe());
		expect(construction.metadata).toEqual(
			jasmine.objectContaining({
				constructionLightKind:
					'shell-held-arithmetic-mean',
				shellIndex: expected.shellIndex,
				heldIncidentScale:
					expected.heldIncidentScale,
			}),
		);
		expect(construction.sourceIrradiance.values)
			.toEqual([
				expected.heldIncidentScale,
				2 * expected.heldIncidentScale,
			]);
		expect(continuous.metadata).not.toEqual(
			jasmine.objectContaining({
				constructionLightKind:
					'shell-held-arithmetic-mean',
			}),
		);
	});

	it('delegates the physical finite-source path limit', () => {
		const source = createSource();
		const constructionSource =
			new LocalSunConstructionLightSource({
				source,
				shellFactCache:
					createLocalSunShellFactCache({
						sourceConfiguration:
							source.configuration,
					}),
			});

		expect(constructionSource.resolveSourcePathLimit({
			sourceRelativePosition: {
				distanceFromSource: {
					value: 20,
					units: 'meters',
				},
			},
		})).toEqual({
			maxDistance: {
				value: 20,
				units: 'meters',
			},
			reason: 'finite-local-source-distance',
		});
	});
});

/** @returns {LocalSunLightSource} The fixed physical test source. */
function createSource() {
	return new LocalSunLightSource({
		sourceKey: 'construction-local-sun',
		position: {
			coordinates: [4_800_000, 0, 4_800_000],
			units: 'meters',
		},
		sourceIrradiance:
			createTestSourceIrradiance([1, 2]),
		referenceDistance: {
			value: 4_800_000,
			units: 'meters',
		},
		referenceSpectralIncidentScale: 1,
		radius: {
			value: 25_749.504,
			units: 'meters',
		},
		distanceFalloff: true,
	});
}
