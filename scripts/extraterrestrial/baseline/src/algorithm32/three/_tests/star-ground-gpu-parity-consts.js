export const STAR_GROUND_GPU_PARITY_REPORT_SCHEMA_ID =
	"algorithm32-production-ground-webgl-parity-report-v1";

export const STAR_GROUND_GPU_PARITY_BUILD_TIMEOUT_MILLISECONDS =
	30 * 60 * 1000;

export const STAR_GROUND_GPU_PARITY_MAXIMUM_SCATTERING_ORDER = 4;

export const STAR_GROUND_GPU_PARITY_FAILURE_SAMPLE_LIMIT = 24;

/** @type {Readonly<Record<string, string>>} */
export const STAR_GROUND_GPU_PARITY_FIELD_NAME_BY_PLAN_ID = {
	"distant-sun-j1": "J1",
	"distant-sun-l1": "L1",
	"distant-sun-j2": "J2",
	"distant-sun-j-through-2": "Jthrough2",
	"distant-sun-l2": "L2",
	"distant-sun-j3": "J3",
	"distant-sun-j-through-3": "Jthrough3",
	"distant-sun-l3": "L3",
	"distant-sun-j4": "J4",
	"distant-sun-j-through-4": "Jthrough4",
};

/** @type {readonly string[]} */
export const STAR_GROUND_GPU_PARITY_EXECUTED_FIELD_IDS = [
	"J1",
	"L1",
	"J2",
	"Jthrough2",
	"L2",
	"J3",
	"Jthrough3",
	"L3",
	"J4",
	"Jthrough4",
];

/** @type {readonly string[]} */
export const STAR_GROUND_GPU_PARITY_PURE_SCATTERING_IDS = [
	"J1",
	"J2",
	"J3",
	"J4",
];

/** @type {readonly string[]} */
export const STAR_GROUND_GPU_PARITY_PURE_RADIANCE_IDS = [
	"L1",
	"L2",
	"L3",
];

/** @type {readonly string[]} */
export const STAR_GROUND_GPU_PARITY_CUMULATIVE_PASS_IDS = [
	"Jthrough2",
	"Jthrough3",
	"Jthrough4",
];

/** @type {readonly string[]} */
export const STAR_GROUND_GPU_PARITY_REFLECTIVE_EVIDENCE_FIELD_IDS =
	[
		"J2",
		"J3",
		"J4",
		"Jthrough2",
		"Jthrough3",
		"Jthrough4",
	];

export const STAR_GROUND_GPU_PARITY_RESIDENT_FIELD_ID = "Jthrough4";

export const STAR_GROUND_GPU_PARITY_CPU_LOGICAL_FIRST_ORDER_EVIDENCE =
	"logical-j1-no-n4-copy-pass";

export const STAR_GROUND_GPU_PARITY_FIRST_ORDER_GPU_EVIDENCE =
	"J1-is-the-logical-N4-Jthrough1-value;"
	+ "no-Jthrough1-copy-pass-is-executed;"
	+ "the-existing-N1-browser-lane-owns-exact-copy-evidence";
