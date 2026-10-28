import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {Registry, Service, registry} from '@polylith/core';
import setupDeployment from '../setup-deployment.js';

describe('repository deployment setup', () => {
	it('attaches the exact shared registry before starting master-only services', async () => {
		let shared = new Registry();
		let starts = 0;
		class InstallationService extends Service {
			constructor() {
				super('installation-test', shared);
				this.implement(['start']);
			}
			start() {
				assert.equal(registry.getAttached('shared'), shared);
				starts += 1;
			}
		}
		new InstallationService();
		await setupDeployment({sharedRegistry: shared}, true);
		assert.equal(starts, 1);
	});

	it('attaches the shared registry in discovered execution without restarting it', async () => {
		let starts = 0;
		let shared = {
			start: async () => {
				starts += 1;
			},
		};
		await setupDeployment({sharedRegistry: shared}, false);
		assert.equal(registry.getAttached('shared'), shared);
		assert.equal(starts, 0);
	});

	it('rejects a missing installation handoff', async () => {
		await assert.rejects(setupDeployment({}, true), /shared registry/u);
	});
});
