import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {dirname, resolve} from 'node:path';
import {createDefaultAuthorityProbeCoordinates} from './local-sun-gpu-transport-authority.js';

const directory = dirname(fileURLToPath(import.meta.url));
const policyPath = resolve(directory, '..', 'fixtures', 'local-sun-gpu-transport-offload-policy.json');

describe('local-Sun GPU transport offload policy', /** Called by Jasmine to register the named suite. */ () => {
	it('seals one default authority profile and its selected transport probes', async () => {
		const policy = JSON.parse(await readFile(policyPath, 'utf8'));
		const coordinates = createDefaultAuthorityProbeCoordinates();

		expect(policy).toEqual({
			id: 'algorithm32-local-sun-gpu-transport-offload-policy-v2',
			status: 'sealed',
			defaultProfile: {
				maximumScatteringOrder: 4,
				positionDomain: 'z19-rho15',
				incomingDirectionDomain: 'paired-fibonacci-34',
				outgoingDirectionDomain: 'w27',
				spectralBasis: 'native-15',
				transportIntervalCount: 15,
			},
			authority: {
				cpuSnapshot: 'local-sun-gpu-transport-cpu-authority-v2.json',
				cpuSnapshotSha256: 'c2a2018c5c3d5db0e737c695439365a976220b1c914c94c5e7dcaf2a88b27b9e',
				capturePolicySha256: 'b7d1a77c13f07a9005e58c4b82a897c4489bfa4eb7c9ef9a685c1a29a2f4b66e',
				packedR32fSnapshot: 'local-sun-gpu-transport-indexed-r32f-v2.json',
				visualBaselines: null,
			},
			fixedRowControl: {
				queryCount: 9690,
				activeTapCount: 677983,
				maximumTapCount: 236,
				queryOffsetsSha256: 'baa118fb4dc90d2e2f77168a84d540180eae9f9abc48afd7b012489803f82b55',
				sourcesSha256: 'a51930904df40590c7b03ee5a3e6f55db9d6f1492e23948a341d8a0c95392eef',
				coefficientsSha256: '1b237a8cd101311424a08e9290767115ccc801d12f2e27fbdf3820b3575969c3',
			},
			probeSelection: {
				positionIndices: [0, 14, 15, 16, 207, 268, 270, 284],
				incomingDirectionIndices: [0, 1, 4, 5, 8, 9, 32, 33],
				wavelengthCount: 15,
			},
		});
		expect(coordinates).toHaveSize(960);
		expect(
			new Set(
				coordinates.map(
					({directionIndex, positionIndex, wavelengthIndex}) =>
						`${directionIndex}:${positionIndex}:${wavelengthIndex}`,
				),
			).size,
		).toBe(960);
		const fixtureDirectory = resolve(directory, '..', 'fixtures');
		const cpuText = await readFile(resolve(fixtureDirectory, policy.authority.cpuSnapshot), 'utf8');
		const gpuText = await readFile(resolve(fixtureDirectory, policy.authority.packedR32fSnapshot), 'utf8');
		expect(createHash('sha256').update(cpuText).digest('hex')).toBe(policy.authority.cpuSnapshotSha256);
		const cpu = JSON.parse(cpuText);
		const gpu = JSON.parse(gpuText);
		for (const field of ['l2', 'l3']) {
			expect(cpu[field]).toHaveSize(960);
			expect(gpu[field]).toHaveSize(960);
			for (let index = 0; index < cpu[field].length; index += 1) {
				expect(gpu[field][index].coordinates).toEqual(cpu[field][index].coordinates);
				expect(Math.abs(gpu[field][index].value - cpu[field][index].value)).toBeLessThanOrEqual(
					2e-9 + 0.005 * Math.abs(cpu[field][index].value),
				);
			}
		}
	});
});
