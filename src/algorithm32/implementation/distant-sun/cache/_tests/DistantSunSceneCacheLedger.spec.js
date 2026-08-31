import {NATIVE_48_POSITION_DOMAIN_OWNER} from '../../../../sampling-domains/position/spherical-native/consts.js';
import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER} from '../../../../sampling-domains/direction/cubed-sphere/consts.js';
import {SOLAR_ZENITH_180_DOMAIN_OWNER} from '../../../../sampling-domains/solar-zenith/consts.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../../profiles/native-15/native-15-profile.js';
import DistantSunSceneCacheLedger from '../DistantSunSceneCacheLedger.js';

describe('DistantSunSceneCacheLedger', /** Called by Jasmine to register the named test suite. */ () => {
	it('builds the qualified San Jose nautical inventory and exact byte ledgers', /** Called by Jasmine to exercise the named behavior. */ () => {
		const ledger = createLedger();

		expect(ledger.retainedBlockCount).toBe(617);
		expect(ledger.oracleByteLength).toBe(161925480);
		expect(ledger.exactSeamByteLength).toBe(150235908);
		expect(ledger.rows).toHaveSize(48);
		expect(ledger.lookupPackedRow(0, ledger.rows[0].firstSolarZenithIndex)).toBe(0);
	});

	it('rejects coordinates outside the interpolation-closed scene support', /** Called by Jasmine to exercise the named behavior. */ () => {
		const ledger = createLedger();
		const first = ledger.rows[0];

		expect(
			/** Called by Jasmine to invoke the rejected lookup. */ () =>
				ledger.lookupPackedRow(0, first.firstSolarZenithIndex - 1),
		).toThrowError(/outside declared support/u);
	});

	it('reconstructs only an interpolation-closed external ledger superset with exact byte shape', () => {
		const record = createLedger().toRecord();
		const domains = {
			positionDomain: NATIVE_48_POSITION_DOMAIN_OWNER,
			solarZenithDomain: SOLAR_ZENITH_180_DOMAIN_OWNER,
			outgoingDirectionDomain: CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
			spectralBasis: NATIVE_15_SPECTRAL_BASIS,
		};

		expect(DistantSunSceneCacheLedger.fromRecord(record, domains).toRecord()).toEqual(record);
		expect(() =>
			DistantSunSceneCacheLedger.fromRecord(
				{...record, retainedBlockCount: record.retainedBlockCount - 1},
				domains,
			),
		).toThrowError(/byte shape does not match/u);
	});
});

/** Called by this module to construct the qualified nautical ledger. */
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
