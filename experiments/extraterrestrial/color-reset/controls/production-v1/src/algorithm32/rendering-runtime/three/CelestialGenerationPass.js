/** Composer-compatible coordinator for atomic stellar and Sun generation consumption. */
export class CelestialGenerationPass {
	enabled = true;
	needsSwap = false;
	clear = false;
	renderToScreen = false;

	/**
	 * Create the joint standard-pipeline generation participant.
	 *
	 * @param {CelestialGenerationPassConfiguration} configuration - Optional stellar and required Sun stages.
	 */
	constructor(configuration) {
		this._stellar = configuration.stellar;
		this._sun = configuration.sun;
		this._disposed = false;
	}

	get stages() {
		return [...(this._stellar?.stages ?? []), ...this._sun.stages].sort((left, right) => left.order - right.order);
	}

	/** @returns {CelestialGenerationPublicationState} - Current all-or-zero publication state. */
	get publicationState() {
		const stellarState = this._stellar?.publicationState ?? null;
		const sunState = this._sun.publicationState;
		const stellarValues = this._stellar?.bindingValues() ?? null;
		const sunValues = this._sun.bindingValues();
		const stellarComplete =
			stellarState === null ||
			(stellarState.active !== null &&
				stellarValues?.['runtime.celestial.stellarScreenIndex'] != null &&
				stellarValues?.['runtime.celestial.stellarPalette'] != null);
		const complete = sunState.active !== null && sunValues !== null && stellarComplete;
		return {
			active: complete
				? {
						transactionId: `${stellarState?.active?.id ?? 'no-stars'}:${sunState.active.id}`,
						stellar: stellarState?.active ?? null,
						sun: sunState.active,
						status: 'complete',
					}
				: null,
			staging: null,
			dirtyReason: stellarState?.dirtyReason ?? sunState.dirtyReason,
		};
	}

	/** Return generated values only when every enabled layer has a matching completion. */
	consumerBindingValues() {
		const stellarValues = this._stellar?.bindingValues() ?? {};
		const sunValues = this._sun.bindingValues();
		const stellarComplete =
			this._stellar === null ||
			(stellarValues['runtime.celestial.stellarScreenIndex'] !== null &&
				stellarValues['runtime.celestial.stellarPalette'] !== null);
		if (!sunValues || !stellarComplete) {
			return {
				...(this._stellar?.zeroConsumerBindingValues() ?? {}),
				...this._sun.zeroConsumerBindingValues(),
			};
		}
		return {...stellarValues, ...sunValues};
	}

	markDirty(reason) {
		if (this._disposed) return;
		this._stellar?.markDirty(reason);
		this._sun.markDirty(reason);
	}

	async prepare(renderer) {
		if (this._disposed) throw new Error('Cannot prepare a disposed celestial generation pass.');
		await this._stellar?.prepare(renderer);
		await this._sun.prepare(renderer);
		this._stellar?.render(renderer);
		this._sun.render(renderer);
		if (this.publicationState.active === null) {
			throw new Error('Celestial generation preparation did not publish one complete compatible output set.');
		}
	}

	setSize(width, height) {
		this._stellar?.setSize(width, height);
		this._sun.setSize(width, height);
	}

	render(renderer) {
		if (this._disposed || !this.enabled) return;
		this._stellar?.render(renderer);
		this._sun.render(renderer);
	}

	handleContextLoss() {
		if (this._disposed) return;
		this._stellar?.handleContextLoss();
		this._sun.handleContextLoss();
	}

	handleContextRestoration() {
		if (this._disposed) return;
		this._stellar?.handleContextRestoration();
		this._sun.handleContextRestoration();
	}

	getDiagnostics() {
		return {
			status: this._disposed ? 'disposed' : 'ready',
			publicationState: this.publicationState,
			stellar: this._stellar?.getDiagnostics() ?? null,
			sun: this._sun.getDiagnostics(),
		};
	}

	dispose() {
		if (this._disposed) return;
		this._disposed = true;
		this.enabled = false;
		this._stellar?.dispose();
		this._sun.dispose();
	}
}
