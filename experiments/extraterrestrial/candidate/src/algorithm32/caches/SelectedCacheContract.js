import { NATIVE_15_SPECTRAL_BASIS } from '../profiles/native-15-profile.js';
import {
	CUBED_SPHERE_W27_DIRECTION_DOMAIN,
	FIBONACCI_34_DIRECTION_DOMAIN,
	NATIVE_48_POSITION_DOMAIN,
} from '../domains/index.js';
import {
	DEFAULT_CACHE_CONSTRUCTION_CONTROLS,
	SUPPORTED_CACHE_SCATTERING_ORDERS,
} from './CacheConstructionControlsDescriptor.js';
import {
	createDirectionalSpectralFieldDescriptor,
	DIRECTION_DOMAIN_ROLES,
	DIRECTIONAL_FIELD_QUANTITIES,
	DIRECTIONAL_FIELD_UNITS,
} from './DirectionalSpectralFieldDescriptor.js';
import { createScalarArrayTextureLayout } from './ScalarArrayTextureLayout.js';

export const DEFAULT_SCATTERING_DENSITY_LAYOUT = createScalarArrayTextureLayout({
	id: 'algorithm32-default-scattering-density-layout-v1',
	directionCount: CUBED_SPHERE_W27_DIRECTION_DOMAIN.count,
	positionCount: NATIVE_48_POSITION_DOMAIN.count,
	wavelengthCount: NATIVE_15_SPECTRAL_BASIS.channelCount,
});

export const DEFAULT_CUMULATIVE_SCATTERING_FIELD =
	createDirectionalSpectralFieldDescriptor({
		id: 'algorithm32-default-cumulative-scattering-field-v1',
		quantity: DIRECTIONAL_FIELD_QUANTITIES.SCATTERING_DENSITY,
		units: DIRECTIONAL_FIELD_UNITS.SCATTERING_DENSITY,
		directionRole: DIRECTION_DOMAIN_ROLES.OUTGOING_SCATTERING_DENSITY,
		basis: NATIVE_15_SPECTRAL_BASIS,
		positionDomain: NATIVE_48_POSITION_DOMAIN,
		directionDomain: CUBED_SPHERE_W27_DIRECTION_DOMAIN,
		precision: 'binary32',
		layout: DEFAULT_SCATTERING_DENSITY_LAYOUT,
		order: {
			kind: 'cumulative-through',
			value: DEFAULT_CACHE_CONSTRUCTION_CONTROLS.maximumScatteringOrder,
		},
		provenanceIdentity: 'algorithm32-selected-cache-contract-v1',
	});

/**
 * Frozen stage-one cache foundation. It declares the selected physical
 * domains and field but deliberately does not claim that recurrence or a
 * resident CPU/GPU cache has been implemented.
 */
export const SELECTED_CACHE_FOUNDATION = ({
	id: 'algorithm32-selected-cache-foundation-v1',
	basis: NATIVE_15_SPECTRAL_BASIS,
	positionDomain: NATIVE_48_POSITION_DOMAIN,
	incomingDirectionDomain: FIBONACCI_34_DIRECTION_DOMAIN,
	outgoingDirectionDomain: CUBED_SPHERE_W27_DIRECTION_DOMAIN,
	supportedMaximumScatteringOrders: SUPPORTED_CACHE_SCATTERING_ORDERS,
	controls: DEFAULT_CACHE_CONSTRUCTION_CONTROLS,
	layout: DEFAULT_SCATTERING_DENSITY_LAYOUT,
	field: DEFAULT_CUMULATIVE_SCATTERING_FIELD,
});
