/** Read-only P2-qualified Native48/Native15 package root in the relocated archive. */
export const THE_HOURS_PACKAGE_ROOT =
	'archive/production-algorithm32/distant-sun-shared-block-cache/runs/2026-09-12T23-03-01-509Z-b2f6177e-e49a-4bc8-8bfd-ac3cfcde3f90/published/9a30749c6d4e6c23d7a84839788c068133051fbbd9bd93d07de8b18a6ee432ec';
/** Pinned package report verified against the retained P2 index. */
export const THE_HOURS_PACKAGE_REPORT = {
	path: 'package-set.json',
	byteLength: 3268,
	sha256: 'bee0301de150115a5c068c492b20e5e631f4bd7da4104b4f847d4564dda3145e',
};
/** Complete immutable original sixty-second choreography. */
export const THE_HOURS_ORIGINAL = {
	path: 'archive/experiments/distant-sun-shadow-animation-evidence/runs/1788974488678-creative-animation/scene-trace.json',
	byteLength: 3212518,
	sha256: '1b0be658dc383c3aec7a6d3663757f8a3c5dbc5e85bd13f9bc2f4cc0751c84a6',
};
/** Fixed short-control camera retained by the selected strobing experiment. */
export const THE_HOURS_FIXED_CAMERA = {
	positionMeters: [-88.12306109121104, 12, 12.688320826394001],
	viewDirection: [0.9299476559464637, 0.12186934340514748, -0.34690808629617687],
	fieldOfViewDegrees: 60,
	elevationDegrees: 7,
};
/** Pinned selected POC control configurations; their cameras differ by diagnostic. @type {Readonly<Record<string, TheHoursArtifactIdentity>>} */
export const THE_HOURS_SHORT_CONTROLS = {
	daylight: {
		path: 'archive/experiments/distant-sun-recording-strobing/runs/00046-fixed-capture/configuration.json',
		byteLength: 986,
		sha256: '5000e592af28516b523b04e546e96d3fd73eee15f6012c3bd3f5e4a32a4ee239',
	},
	sunrise: {
		path: 'archive/experiments/distant-sun-recording-strobing/runs/00044-fixed-capture/configuration.json',
		byteLength: 968,
		sha256: '34dd5b60d1ac0db74aebf71ab1ab7012f6794f7ddc1f74d045fd73863d0f36e3',
	},
	sunset: {
		path: 'archive/experiments/distant-sun-recording-strobing/runs/00042-fixed-capture/configuration.json',
		byteLength: 968,
		sha256: '0351c2a9a7e5924d0ddac6cd84f49913545889a99511296856688a945c776c5d',
	},
};
/** Original human stellar presentation; physical sky and receiver spectra remain independent. @type {readonly Flat32PresentationFilterConfiguration[]} */
export const THE_HOURS_PRESENTATION_FILTERS = [
	{
		id: 'human-mesopic-luminance-v1',
		stage: 'source-linear',
		target: 'stellar',
		enabled: true,
		parameters: {maximumRodContribution: 0.5},
	},
	{
		id: 'human-low-light-chroma-v1',
		stage: 'source-linear',
		target: 'stellar',
		enabled: true,
		parameters: {maximumChromaRetention: 0.65},
	},
];
