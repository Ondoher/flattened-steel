/** Explicit per-channel aerosol inputs for matched offline qualification. */
export const DistantSunPointLocalCacheAerosolOptics = Object.freeze({
	/** Accept an optional azimuth-integrated phase probability table without renormalizing it.
	 * @param {DistantSunMiePhaseTable | undefined} table - Strict cosine nodes and PDF per unit cosine.
	 * @returns {void} - Invalid or non-normalized tables throw before compilation.
	 */
	acceptTable(table) {
		if (table === undefined) return;
		if (
			!Array.isArray(table?.mu) ||
			!Array.isArray(table.pdf) ||
			table.mu.length !== table.pdf.length ||
			table.mu.length < 2 ||
			table.mu.length > 256 ||
			table.mu[0] !== -1 ||
			table.mu.at(-1) !== 1
		)
			throw new RangeError('Aerosol phase tables require matching cosine/PDF arrays covering [-1, 1].');
		let mass = 0;
		for (let i = 0; i < table.mu.length; i++) {
			if (
				!Number.isFinite(table.mu[i]) ||
				!Number.isFinite(table.pdf[i]) ||
				table.pdf[i] < 0 ||
				(i > 0 && table.mu[i] <= table.mu[i - 1])
			)
				throw new RangeError(
					'Aerosol phase tables require increasing finite cosines and nonnegative finite PDFs.',
				);
			if (i > 0) mass += ((table.mu[i] - table.mu[i - 1]) * (table.pdf[i] + table.pdf[i - 1])) / 2;
		}
		if (Math.abs(mass - 1) > 1e-5) throw new RangeError('Aerosol phase PDF must already integrate to one.');
	},
	/** Validate a supplied spectral channel at the external compiler-input boundary.
	 * @param {DistantSunSceneCacheCompilerChannel} channel - Channel with optional explicit aerosol optics.
	 * @returns {void} - Unsupported scattering strength or phase data throws.
	 */
	acceptChannel(channel) {
		const ssa = channel.mieSingleScatteringAlbedo;
		if (ssa !== undefined && (!Number.isFinite(ssa) || ssa < 0 || ssa > 1))
			throw new RangeError('Aerosol single-scattering albedo must be in [0, 1].');
		this.acceptTable(channel.miePhaseTable);
	},
	/** Project an explicit matched material onto the selected spectral basis.
	 * @param {DistantSunSceneCacheCompilerChannel[]} channels - Existing spectral channels.
	 * @param {readonly DistantSunSpectralAerosolOptics[] | undefined} optics - Optional material in exactly the same channel order.
	 * @returns {DistantSunSceneCacheCompilerChannel[]} - Channels with complete explicit optics; omission preserves existing inputs.
	 */
	project(channels, optics) {
		if (optics === undefined) return channels;
		if (!Array.isArray(optics) || optics.length !== channels.length)
			throw new RangeError('Explicit aerosol optics must match the selected spectral basis.');
		return channels.map((channel, i) => {
			const material = optics[i];
			if (!material || material.mieSingleScatteringAlbedo === undefined)
				throw new RangeError('Explicit aerosol material requires each channel single-scattering albedo.');
			const result = {
				...channel,
				mieSingleScatteringAlbedo: material.mieSingleScatteringAlbedo,
				...(material.miePhaseTable === undefined ? {} : {miePhaseTable: material.miePhaseTable}),
			};
			this.acceptChannel(result);
			return result;
		});
	},
	/** Emit the retained piecewise-linear phase evaluation for an accepted table.
	 * @param {DistantSunMiePhaseTable} table - Normalized azimuth-integrated PDF on cosine nodes.
	 * @returns {string} - Phase function per steradian; no rescaling of the supplied material.
	 */
	createShaderSource(table) {
		this.acceptTable(table);
		const count = table.mu.length;
		return `const float AEROSOL_MU[${count}]=float[](${table.mu.map((value) => value.toExponential(16)).join(',')});
const float AEROSOL_PDF[${count}]=float[](${table.pdf.map((value) => value.toExponential(16)).join(',')});
float miePhase(vec3 outgoingDirection, vec3 incomingDirection) {
	float c=clamp(dot(outgoingDirection,incomingDirection),-1.0,1.0); int lo=0, hi=${count - 1};
	for(int i=0;i<${Math.ceil(Math.log2(count))};i++){int mid=(lo+hi)/2;if(c>=AEROSOL_MU[mid])lo=mid;else hi=mid;}
	lo=min(lo,${count - 2});float u=clamp((c-AEROSOL_MU[lo])/(AEROSOL_MU[lo+1]-AEROSOL_MU[lo]),0.0,1.0);
	return mix(AEROSOL_PDF[lo],AEROSOL_PDF[lo+1],u)/(2.0*PI);
}`;
	},
});
