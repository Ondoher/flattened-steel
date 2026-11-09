import {act} from 'react';
import {Euler, Quaternion} from 'three';
import {Registry} from '@polylith/core';
import DirectionRibbon from '../DirectionRibbon.jsx';
import {getCameraHeading} from '../../common/camera-heading.js';
import {createTestHarness} from '../../testing/TestHarness.js';
import {FlatEarthModel} from '../../features/flat-earth/models/FlatEarthModel.js';
import {SphericalEarthModel} from '../../features/spherical-earth/models/spherical-earth-model.js';
import {FlatEarthSession} from '../../features/flat-earth/FlatEarthSession.js';
import {SphericalEarthSession} from '../../features/spherical-earth/SphericalEarthSession.js';
import FlatEarthPage from '../../features/flat-earth/components/FlatEarthPage.jsx';
import SphericalEarthPage from '../../features/spherical-earth/components/SphericalEarthPage.jsx';

describe('Camera directional ribbon', () => {
	it('keeps all eight headings through pitch changes, vertical looks and north wraparound', () => {
		for (const heading of [0, 1, 45, 90, 135, 180, 225, 270, 315, 359]) {
			for (const pitch of [0, 0.8, Math.PI / 2, -Math.PI / 2]) {
				const orientation = new Quaternion()
					.setFromEuler(new Euler(pitch, (-heading * Math.PI) / 180, 0, 'YXZ'))
					.toArray();
				const actual = getCameraHeading(orientation);
				const difference = ((actual - heading + 540) % 360) - 180;
				expect(difference).toBeCloseTo(0, 8);
			}
		}
	});

	it('centers localized cardinal and intercardinal labels and wraps north without a visual jump', () => {
		const harness = createTestHarness().withLocale('en-US');
		try {
			const result = harness.render(DirectionRibbon, {headingDegrees: 90});
			expect(result.query('[role="img"]').getAttribute('aria-label')).toBe('Direction: E');
			expect(result.query('[data-direction="e"]').style.left).toBe('50%');
			expect([...result.queryAll('.direction-ribbon-label')].map((node) => node.textContent)).toEqual([
				'N',
				'NE',
				'E',
				'SE',
				'S',
				'SW',
				'W',
				'NW',
			]);
			result.rerender({headingDegrees: 359});
			const before = parseFloat(result.query('[data-direction="n"]').style.left);
			result.rerender({headingDegrees: 1});
			const after = parseFloat(result.query('[data-direction="n"]').style.left);
			expect(Math.abs(after - before)).toBeLessThan(2);
		} finally {
			harness.unmount();
		}
	});

	it('toggles each feature independently, follows accepted orientation and retains the exact canvas', () => {
		for (const [Model, Session, Page, slug] of [
			[FlatEarthModel, FlatEarthSession, FlatEarthPage, 'flat-earth'],
			[SphericalEarthModel, SphericalEarthSession, SphericalEarthPage, 'spherical-earth'],
		]) {
			const model = new Model(new Registry());
			model.start();
			model.open('one');
			model.open('two');
			const listeners = new Set(),
				factory = jasmine.createSpy('runtime');
			const session = new Session(
				'one',
				model,
				(state) => {
					for (const callback of listeners) {
						callback({viewId: 'one', state});
					}
				},
				factory,
			);
			const canvas = document.createElement('canvas');
			const view = {
				getState: () => session.getState(),
				getCanvas: () => canvas,
				listen: (_event, callback) => {
					listeners.add(callback);
					return callback;
				},
				unlisten: (_event, callback) => listeners.delete(callback),
				attach: jasmine.createSpy('attach'),
				detach: jasmine.createSpy('detach'),
			};
			const harness = createTestHarness().withLocale('en-US');
			try {
				const result = harness.render(Page, {viewId: 'one', sceneView: view, initialState: session.getState()});
				expect(result.query('.direction-ribbon')).toBeNull();
				act(() => session.toggleCompass());
				expect(result.query('[data-direction="n"]').style.left).toBe('50%');
				act(() => {
					model.setOrientation(
						'one',
						new Quaternion().setFromEuler(new Euler(0, -Math.PI / 2, 0, 'YXZ')).toArray(),
					);
					session.onChange(session.getState());
				});
				expect(result.query('[data-direction="e"]').style.left).toBe('50%');
				expect(model.getCamera('two').compassVisible).toBeFalse();
				expect(result.query(`.${slug}-surface canvas`)).toBe(canvas);
				act(() => session.toggleCompass());
				expect(result.query('.direction-ribbon')).toBeNull();
				expect(result.query(`.${slug}-surface canvas`)).toBe(canvas);
				expect(view.attach).toHaveBeenCalledTimes(1);
				expect(view.detach).not.toHaveBeenCalled();
				expect(factory).not.toHaveBeenCalled();
				model.close('one');
				model.open('one');
				expect(model.getCamera('one').compassVisible).toBeFalse();
			} finally {
				harness.unmount();
				model.stop();
			}
		}
	});
});
