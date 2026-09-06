import {StellarScreenPaletteGpuResource} from './StellarScreenPaletteGpuResource.js';

function identityKey(product) {
	return JSON.stringify({
		identities: product.identities,
		viewport: product.viewport,
		paletteEntryCount: product.palette.length / 15,
	});
}

/** Atomically stage, publish, restore, replace, and dispose indexed GPU caches. */
export class StellarScreenPaletteGpuController {
	constructor({gl}) {
		this.gl = gl;
		this.active = null;
		this.activeProduct = null;
		this.activeIdentityKey = null;
		this.retainedProduct = null;
		this.generation = 0;
		this.disposed = false;
		this.metrics = {
			createdResourceCount: 0,
			reusedBuildCount: 0,
			replacementCount: 0,
			failedBuildCount: 0,
			stagingCleanupHandleCount: 0,
			disposedResourceCount: 0,
			abandonedResourceCount: 0,
			restoredResourceCount: 0,
		};
	}

	build(product, options = {}) {
		if (this.disposed) throw new Error('Cannot build with a disposed GPU controller.');
		const key = identityKey(product);
		if (!options.force && this.active && key === this.activeIdentityKey) {
			this.metrics.reusedBuildCount += 1;
			return Object.freeze({resource: this.active, generation: this.generation, reused: true});
		}
		let staged;
		try {
			staged = new StellarScreenPaletteGpuResource(this.gl, product, options);
		} catch (error) {
			this.metrics.failedBuildCount += 1;
			this.metrics.stagingCleanupHandleCount += error.stagingCleanup?.deletedHandleCount ?? 0;
			throw error;
		}
		this.metrics.createdResourceCount += 1;
		const replaced = this.active;
		this.active = staged;
		this.activeProduct = product;
		this.retainedProduct = product;
		this.activeIdentityKey = key;
		this.generation += 1;
		if (replaced) {
			if (replaced.dispose()) this.metrics.disposedResourceCount += 1;
			this.metrics.replacementCount += 1;
		}
		return Object.freeze({resource: staged, generation: this.generation, reused: false});
	}

	handleContextLost() {
		if (this.disposed) return false;
		if (this.active?.abandonAfterContextLoss()) {
			this.metrics.abandonedResourceCount += 1;
		}
		this.active = null;
		this.activeProduct = null;
		this.activeIdentityKey = null;
		return true;
	}

	handleContextRestored(gl = this.gl) {
		if (this.disposed) throw new Error('Cannot restore a disposed GPU controller.');
		if (!this.retainedProduct) throw new Error('No complete CPU product is retained for restoration.');
		this.gl = gl;
		const published = this.build(this.retainedProduct, {force: true});
		this.metrics.restoredResourceCount += 1;
		return published;
	}

	dispose() {
		if (this.disposed) return false;
		if (this.active?.dispose()) this.metrics.disposedResourceCount += 1;
		this.active = null;
		this.activeProduct = null;
		this.activeIdentityKey = null;
		this.retainedProduct = null;
		this.disposed = true;
		return true;
	}

	describe() {
		return Object.freeze({
			generation: this.generation,
			disposed: this.disposed,
			hasActiveResource: this.active !== null,
			metrics: Object.freeze({...this.metrics}),
		});
	}
}
