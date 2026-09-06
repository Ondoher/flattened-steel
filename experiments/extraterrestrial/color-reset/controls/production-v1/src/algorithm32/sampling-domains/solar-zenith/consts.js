import SolarZenithDomain from './SolarZenithDomain.js';

/** Selected one-degree, 180-cell local-solar-zenith domain. */
export const SOLAR_ZENITH_180_DOMAIN_OWNER = new SolarZenithDomain({
	id: 'uniform-solar-zenith-cell-centers-180x1-degree-v1',
	count: 180,
	firstCenter: {value: Math.PI / 360, units: 'radians'},
	spacing: {value: Math.PI / 180, units: 'radians'},
});
