import assert from 'node:assert/strict';
import {componentGauss, incidentGroups, localJ2Rules} from '../j2/angular.mjs';
import {gaussLegendreRule} from '../reference/physical/quadrature.mjs';

/** Fixed new controls; original angular admission remains unchanged.
 * @readonly @type {readonly SkyAngularRule[]}
 */
export const angularRules = [
	{id: 'full64-az32-end', radial: 'full-positive', muCount: 64, azimuthCount: 32, placement: 'endpoint-aware'},
	{id: 'full64-az64-end', radial: 'full-positive', muCount: 64, azimuthCount: 64, placement: 'endpoint-aware'},
	{id: 'full64-az128-end', radial: 'full-positive', muCount: 64, azimuthCount: 128, placement: 'endpoint-aware'},
	{id: 'full64-az32-mid', radial: 'full-positive', muCount: 64, azimuthCount: 32, placement: 'midpoint'},
	{id: 'full64-az64-mid', radial: 'full-positive', muCount: 64, azimuthCount: 64, placement: 'midpoint'},
	{id: 'full16-az32-mid', radial: 'full-positive', muCount: 16, azimuthCount: 32, placement: 'midpoint'},
	{id: 'full32-az32-mid', radial: 'full-positive', muCount: 32, azimuthCount: 32, placement: 'midpoint'},
	{id: 'hemi8-az64-mid', radial: 'hemisphere', muCount: 8, azimuthCount: 64, placement: 'midpoint'},
	{id: 'hemi16-az64-mid', radial: 'hemisphere', muCount: 16, azimuthCount: 64, placement: 'midpoint'},
	{id: 'hemi32-az64-mid', radial: 'hemisphere', muCount: 32, azimuthCount: 64, placement: 'midpoint'},
	{id: 'hemi32-az64-end', radial: 'hemisphere', muCount: 32, azimuthCount: 64, placement: 'endpoint-aware'},
	{id: 'hemi32-az128-end', radial: 'hemisphere', muCount: 32, azimuthCount: 128, placement: 'endpoint-aware'},
	{
		id: 'squared32-az128-end',
		radial: 'squared-hemisphere',
		muCount: 32,
		azimuthCount: 128,
		placement: 'endpoint-aware',
	},
];

/** Reject undeclared rule edits at the numerical boundary.
 * @param {SkyAngularRule} rule - Complete immutable candidate.
 * @returns {void} Throws for any control outside this matrix.
 */
function requireRule(rule) {
	assert.ok(angularRules.some((candidate) => JSON.stringify(candidate) === JSON.stringify(rule)));
}

/** Generate explicit outward radial nodes without post-hoc weight normalization.
 * @param {SkyAngularRule} rule - Exact admitted product rule.
 * @returns {readonly SkyJ2GaussNode[]} Positive cosine nodes and dimensionless weights.
 */
export function radialNodes(rule) {
	requireRule(rule);
	const full = rule.muCount === 8 ? gaussLegendreRule(8) : componentGauss(rule.muCount);
	if (rule.radial === 'full-positive') return full.filter((node) => node.node > 0);
	return full.map(({node, weight}) => {
		const u = (node + 1) / 2;
		return rule.radial === 'hemisphere' ? {node: u, weight: weight / 2} : {node: u * u, weight: weight * u};
	});
}

/** Address exact historical vectors and incident values where the new rule is nested.
 * @param {SkyAngularRule} rule - Exact declared rule.
 * @param {number} index - New reflection-group ordinal.
 * @returns {SkyAngularAddress | null} Original ordinal or null for a genuinely new ray.
 */
export function reuseAddress(rule, index) {
	requireRule(rule);
	const count = rule.placement === 'midpoint' ? rule.azimuthCount / 2 : rule.azimuthCount / 2 + 1;
	const radialCount = rule.radial === 'full-positive' ? rule.muCount / 2 : rule.muCount;
	assert.ok(Number.isInteger(index) && index >= 0 && index < radialCount * count);
	if (rule.id === 'full16-az32-mid') return {ruleIndex: 0, index};
	if (rule.radial !== 'full-positive' || rule.muCount !== 64) return null;
	const radial = Math.floor(index / count),
		azimuth = index % count;
	if (rule.placement === 'endpoint-aware') {
		const oldAzimuth = azimuth < 2 ? azimuth : 1 + (azimuth - 1) * (128 / rule.azimuthCount);
		return {ruleIndex: 3, index: radial * 65 + oldAzimuth};
	}
	const endpoint = (azimuth + 0.5) * (128 / rule.azimuthCount);
	assert.ok(Number.isInteger(endpoint));
	return {ruleIndex: 3, index: radial * 65 + endpoint + 1};
}

/** Construct reflected groups, retaining original exact vectors for every reused ray.
 * @param {SkyAngularRule} rule - Declared angular control.
 * @returns {readonly SkyJ2Incident[]} Positive solid-angle groups in radial/azimuth order.
 */
export function angularGroups(rule) {
	const step = (2 * Math.PI) / rule.azimuthCount;
	/** @type {SkyJ2Incident[]} */ const result = [];
	for (const {node, weight} of radialNodes(rule)) {
		const radius = Math.sqrt(Math.max(0, 1 - node * node));
		if (rule.placement === 'endpoint-aware') {
			result.push({direction: [radius, 0, node], mirror: null, weight: weight * step});
			result.push({direction: [-radius, 0, node], mirror: null, weight: weight * step});
		}
		for (let j = rule.placement === 'midpoint' ? 0 : 1; j < rule.azimuthCount / 2; j++) {
			const angle = (j + (rule.placement === 'midpoint' ? 0.5 : 0)) * step;
			const x = radius * Math.cos(angle),
				y = radius * Math.sin(angle);
			result.push({direction: [x, y, node], mirror: [x, -y, node], weight: weight * step});
		}
	}
	const old = localJ2Rules.map(incidentGroups);
	return result.map((group, index) => {
		const address = reuseAddress(rule, index);
		if (!address) return group;
		const original = old[address.ruleIndex][address.index];
		for (let axis = 0; axis < 3; axis++)
			assert.ok(Math.abs(original.direction[axis] - group.direction[axis]) <= 8 * Number.EPSILON);
		assert.equal(Boolean(group.mirror), Boolean(original.mirror));
		return {...original, weight: group.weight};
	});
}

/** Select the bounded stage's newly evaluated or derived matrix.
 * @param {SkyAngularStage} stage - Explicit CLI stage.
 * @returns {readonly SkyAngularRule[]} No numerical target is exposed by prediction registration.
 */
export function stageRules(stage) {
	if (stage === 'derive') return angularRules.slice(0, 7);
	if (stage === 'development') return angularRules.slice(7, 9);
	if (stage === 'fine') return angularRules.slice(9);
	assert.equal(stage, 'predict');
	return [];
}

/** Choose an explicit run directory name inside the experiment's 16-character cap.
 * Scientific stage identities remain unchanged in every recipe and reference.
 * @param {SkyAngularStage} stage - Admitted semantic stage.
 * @returns {string} Unique ordinary kebab-case run name without its sequence prefix.
 */
export function angularRunName(stage) {
	/** @type {Readonly<Record<SkyAngularStage, string>>} */
	const names = {
		derive: 'j2-ang-derive',
		development: 'j2-ang-dev',
		predict: 'j2-ang-predict',
		fine: 'j2-ang-fine',
	};
	assert.ok(Object.hasOwn(names, stage), 'Unregistered angular stage.');
	return names[stage];
}
