import {registry} from '@polylith/core';
import '@polylith/features';
import '@polylith/config';

import {Flat32Application} from './Flat32Application.js';

const SUNSET_FACING_CAMERA_DIRECTION = /** @type {const} */ ([-0.784864, 0.422618, -0.453204]);
const FLAT_180_SOURCE_FACING_CAMERA_DIRECTION = /** @type {const} */ ([-0.0007728, 0.151886, -0.988397]);

await registry.start();

window.__flat32Cleanup?.();

const root = document.getElementById('main-content');

if (root === null) {
	throw new Error('Flat32 requires the #main-content application root.');
}

const diagnostic = new URLSearchParams(window.location.search).get('diagnostic');
const flatDiagnosticMatch = diagnostic?.match(/^flat(0|135|180)-(wide|default)-n([124])(?:-(ferwerda|bruneton))?$/) ?? null;
const referenceColorMatch = diagnostic?.match(/^spherical-(reference|sunset-facing)-(ferwerda|bruneton)-n4$/) ?? null;
if (
	diagnostic === 'spherical-wide-n4' ||
	diagnostic === 'spherical-default-n1' ||
	flatDiagnosticMatch !== null ||
	referenceColorMatch !== null
) {
	document.documentElement.dataset.flat32Diagnostic = diagnostic;
}
const applicationConfiguration =
	diagnostic === 'spherical-wide-n4'
		? {
				cameraFieldOfViewDegrees: 120,
				maximumScatteringOrder: /** @type {const} */ (4),
				reviewObjectsEnabled: false,
			}
		: diagnostic === 'spherical-default-n1'
			? {
					initialModeKind: /** @type {const} */ ('spherical-distant'),
					maximumScatteringOrder: /** @type {const} */ (1),
					reviewObjectsEnabled: true,
				}
			: referenceColorMatch !== null
				? {
						cameraFieldOfViewDegrees: 78,
					cameraDirectionScene:
						referenceColorMatch[1] === 'sunset-facing'
							? SUNSET_FACING_CAMERA_DIRECTION
							: /** @type {const} */ ([0, 0.422618, -0.906308]),
						maximumScatteringOrder: /** @type {const} */ (4),
						reviewObjectsEnabled: false,
						colorDisplayModelConfiguration:
							referenceColorMatch[2] === 'bruneton'
								? {model: 'bruneton-control'}
								: referenceColorMatch[1] === 'reference'
									? {model: 'ferwerda-control', adaptationLuminanceCdPerSquareMeter: 0.001}
									: undefined,
					}
			: flatDiagnosticMatch !== null
				? {
						...(flatDiagnosticMatch[2] === 'wide' ? {cameraFieldOfViewDegrees: 120} : {}),
						...(flatDiagnosticMatch[1] === '180'
							? {cameraDirectionScene: FLAT_180_SOURCE_FACING_CAMERA_DIRECTION}
							: {}),
						initialFlatTimeIndex:
							flatDiagnosticMatch[1] === '180' ? 4 : flatDiagnosticMatch[1] === '135' ? 3 : 0,
						initialModeKind: /** @type {const} */ ('flat-local'),
						maximumScatteringOrder: /** @type {SupportedCacheScatteringOrder} */ (
							Number(flatDiagnosticMatch[3])
						),
						reviewObjectsEnabled: flatDiagnosticMatch[2] !== 'wide',
						...(flatDiagnosticMatch[4] === 'bruneton'
							? {colorDisplayModelConfiguration: {model: 'bruneton-control'}}
							: {}),
					}
				: {};
const application = new Flat32Application(root, applicationConfiguration);

window.__flat32Cleanup = application.dispose.bind(application);
application.start();
