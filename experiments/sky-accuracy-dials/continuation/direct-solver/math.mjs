import assert from 'node:assert/strict';

/** Gauss-Legendre integration rule on [0,1]. Only mathematical rule nodes are retained.
 * @param {number} count @returns {SkyDirectRule}
 */
export function gauss(count) {
	assert.ok(Number.isInteger(count) && count >= 2 && count <= 256);
	const nodes = [],
		weights = [];
	for (let i = 0; i < count; i++) {
		let z = Math.cos((Math.PI * (i + 0.75)) / (count + 0.5)),
			derivative = 0;
		for (let iteration = 0; iteration < 40; iteration++) {
			let p = 1,
				previous = 0;
			for (let j = 1; j <= count; j++) {
				const old = p;
				p = ((2 * j - 1) * z * p - (j - 1) * previous) / j;
				previous = old;
			}
			derivative = (count * (z * p - previous)) / (z * z - 1);
			const next = z - p / derivative;
			if (Math.abs(next - z) < 2e-15) {
				z = next;
				break;
			}
			z = next;
		}
		nodes.push((1 + z) / 2);
		weights.push(1 / ((1 - z * z) * derivative * derivative));
	}
	return {nodes, weights};
}

/** Direct binary64 calculation used for physical proofs and matching GPU quadrature.
 * No memoization, field reconstruction, inherited radiance or optical-depth lookup.
 * @param {SkyDirectMedium} medium @param {SkyDirectProfile} profile @param {number} channel
 * @returns {{radiance:(p:readonly number[],v:readonly number[],order:number,outer?:boolean)=>number,transmission:(p:readonly number[],v:readonly number[],distance:number)=>number,kernel:(p:readonly number[],cosine:number)=>number}}
 */
export function directCpu(medium, profile, channel) {
	const path = gauss(profile.path),
		view = gauss(profile.view),
		optical = gauss(profile.transmission),
		angular = gauss(profile.mu);
	const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
	const unit = (p) => {
		const r = Math.hypot(...p);
		return p.map((x) => x / r);
	};
	const along = (p, v, t) => p.map((x, i) => x + t * v[i]);
	function boundary(p, v) {
		const r = Math.hypot(...p),
			b = dot(p, v),
			c = (r - medium.bottom) * (r + medium.bottom),
			dg = b * b - c;
		if (b < 0 && dg >= 0) return {distance: Math.max(0, c / (-b + Math.sqrt(dg))), ground: true};
		const ct = (r - medium.top) * (r + medium.top),
			root = Math.sqrt(b * b - ct);
		return {distance: b >= 0 ? -ct / (b + root) : -b + root, ground: false};
	}
	function density(p) {
		const h = Math.max(0, Math.hypot(...p) - medium.bottom);
		return [
			medium.rayleigh[channel] * Math.exp(-h / medium.rayleighHeight),
			medium.mie[channel] * Math.exp(-h / medium.mieHeight),
		];
	}
	function transmission(p, v, distance) {
		let tau = 0;
		for (let i = 0; i < optical.nodes.length; i++) {
			const b = density(along(p, v, distance * optical.nodes[i]));
			tau += optical.weights[i] * (b[0] + b[1]);
		}
		return Math.exp(-distance * tau);
	}
	function sunlight(p) {
		const edge = boundary(p, [0, 0, 1]);
		return edge.ground ? 0 : medium.sun[channel] * transmission(p, [0, 0, 1], edge.distance);
	}
	function kernel(p, c) {
		const b = density(p),
			g = medium.g;
		const pr = (3 * (1 + c * c)) / (16 * Math.PI),
			pm = ((((3 / (8 * Math.PI)) * (1 - g * g)) / (2 + g * g)) * (1 + c * c)) / (1 + g * g - 2 * g * c) ** 1.5;
		return b[0] * pr + b[1] * medium.albedo * pm;
	}
	function direction(mu, phi, n) {
		const helper = Math.abs(n[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
		const a = unit([
			helper[1] * n[2] - helper[2] * n[1],
			helper[2] * n[0] - helper[0] * n[2],
			helper[0] * n[1] - helper[1] * n[0],
		]);
		const b = [n[1] * a[2] - n[2] * a[1], n[2] * a[0] - n[0] * a[2], n[0] * a[1] - n[1] * a[0]],
			r = Math.sqrt(1 - mu * mu);
		return n.map((x, i) => mu * x + r * (Math.cos(phi) * a[i] + Math.sin(phi) * b[i]));
	}
	function ground(p, order) {
		const n = unit(p),
			a = medium.ground[channel];
		if (order === 1) return (a / Math.PI) * sunlight(p) * Math.max(0, n[2]);
		let sum = 0;
		for (let m = 0; m < profile.mu; m++)
			for (let j = 0; j < profile.phi; j++) {
				const mu = angular.nodes[m],
					u = direction(mu, (2 * Math.PI * (j + 0.5)) / profile.phi, n);
				sum += angular.weights[m] * mu * radiance(p, u, order - 1);
			}
		return ((a * 2) / profile.phi) * sum;
	}
	function source(p, v, order) {
		if (order === 1) return sunlight(p) * kernel(p, v[2]);
		let sum = 0;
		for (let m = 0; m < profile.mu; m++)
			for (let j = 0; j < profile.phi; j++) {
				const u = direction(2 * angular.nodes[m] - 1, (2 * Math.PI * (j + 0.5)) / profile.phi, [0, 0, 1]);
				sum += angular.weights[m] * kernel(p, dot(v, u)) * radiance(p, u, order - 1);
			}
		return ((4 * Math.PI) / profile.phi) * sum;
	}
	function radiance(p, v, order, outer = false) {
		assert.ok(Number.isInteger(order) && order >= 1 && order <= 4);
		const edge = boundary(p, v),
			rule = outer ? view : path;
		let sum = edge.ground ? transmission(p, v, edge.distance) * ground(along(p, v, edge.distance), order) : 0;
		for (let i = 0; i < rule.nodes.length; i++) {
			const t = edge.distance * rule.nodes[i];
			sum += edge.distance * rule.weights[i] * transmission(p, v, t) * source(along(p, v, t), v, order);
		}
		return sum;
	}
	return {radiance, transmission, kernel};
}

/** Manufactured checks independent of Kider score. @returns {number} */
export function proof() {
	let checks = 0;
	for (const n of [4, 8, 16, 32, 64]) {
		const r = gauss(n);
		for (let power = 0; power < Math.min(8, 2 * n); power++) {
			assert.ok(
				Math.abs(r.nodes.reduce((s, x, i) => s + r.weights[i] * x ** power, 0) - 1 / (power + 1)) < 2e-13,
			);
			checks++;
		}
	}
	const medium = {
		bottom: 1,
		top: 2,
		rayleighHeight: 1e20,
		mieHeight: 1e20,
		albedo: 0.8,
		g: 0.7,
		rayleigh: [0.2],
		mie: [0.1],
		sun: [1],
		ground: [0],
	};
	const p = {name: 'proof', view: 8, path: 4, transmission: 8, mu: 8, phi: 16, orders: 2};
	const cpu = directCpu(medium, p, 0);
	assert.ok(Math.abs(cpu.transmission([0, 0, 1], [0, 0, 1], 0.5) - Math.exp(-0.15)) < 1e-14);
	checks++;
	const r = gauss(128);
	assert.ok(
		Math.abs(
			4 * Math.PI * r.nodes.reduce((s, u, i) => s + r.weights[i] * cpu.kernel([0, 0, 1], 2 * u - 1), 0) - 0.28,
		) < 1e-12,
	);
	checks++;
	const empty = directCpu({...medium, rayleigh: [0], mie: [0]}, p, 0);
	for (const n of [1, 2]) {
		assert.equal(empty.radiance([0, 0, 1], [0, 0, 1], n, true), 0);
		checks++;
	}
	const ground = directCpu({...medium, rayleigh: [0], mie: [0], ground: [0.5]}, p, 0);
	assert.ok(Math.abs(ground.radiance([0, 0, 1.5], [0, 0, -1], 1, true) - 0.5 / Math.PI) < 1e-14);
	checks++;
	assert.ok(
		Math.abs(
			directCpu({...medium, sun: [2]}, p, 0).radiance([0, 0, 1], [0, 0, 1], 1, true) -
				2 * cpu.radiance([0, 0, 1], [0, 0, 1], 1, true),
		) < 1e-14,
	);
	checks++;
	return checks;
}
