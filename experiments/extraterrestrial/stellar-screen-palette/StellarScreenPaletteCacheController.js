/** Own atomic publication and CPU-generation lifecycle for a screen palette. */
export class StellarScreenPaletteCacheController {
	#builder;
	#current = null;
	#generation = 0;
	#disposed = false;
	#releaseCount = 0;

	constructor({builder}) {
		if (!builder || typeof builder.build !== 'function') {
			throw new TypeError('Screen-palette controller requires a builder.');
		}
		this.#builder = builder;
	}

	get current() {
		return this.#current;
	}

	get state() {
		return Object.freeze({
			generation: this.#generation,
			disposed: this.#disposed,
			hasPublishedGeneration: this.#current !== null,
			releaseCount: this.#releaseCount,
		});
	}

	rebuild(request) {
		if (this.#disposed) throw new Error('Cannot rebuild a disposed screen-palette controller.');
		const candidate = this.#builder.build(request);
		const published = Object.freeze({
			generation: this.#generation + 1,
			product: candidate,
		});
		this.#current = published;
		this.#generation = published.generation;
		return published;
	}

	dispose() {
		if (this.#disposed) return false;
		this.#disposed = true;
		if (this.#current !== null) {
			this.#current = null;
			this.#releaseCount += 1;
		}
		return true;
	}
}
