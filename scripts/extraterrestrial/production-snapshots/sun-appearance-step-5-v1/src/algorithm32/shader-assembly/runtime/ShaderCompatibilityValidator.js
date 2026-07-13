/** Object that validates executable symbol relationships between shader contributions. */
export class ShaderCompatibilityValidator {
	/**
	 * Call this method to validate one shader assembly request. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {ShaderAssemblyRequest} request - Supplies the candidate shader assembly.
	 * @returns {ShaderSymbolValidationReport} - Return the validation report.
	 */
	validate(request) {
		const {contributions, mainRequiredSymbols, systemProvidedSymbols = []} = request;
		const systemProvidedSymbolSet = new Set(systemProvidedSymbols);
		const providedBySymbol = new Map();
		const requiredSymbols = new Set(mainRequiredSymbols);
		const errors = [];
		const warnings = [];

		for (const contribution of contributions) {
			for (const symbol of contribution.provides) {
				if (!providedBySymbol.has(symbol)) {
					providedBySymbol.set(symbol, []);
				}

				providedBySymbol.get(symbol).push(contribution.id);
			}

			for (const symbol of contribution.requires) {
				requiredSymbols.add(symbol);
			}
		}

		const duplicateProvidedSymbols = [...providedBySymbol.entries()]
			.filter(
				/**
				 * Called by Array.prototype.filter to test whether one collection value is retained.
				 * @param input1 - The destructured input accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ ([, providers]) => providers.length > 1,
			)
			.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param input1 - The destructured input accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ ([symbol]) => symbol,
			)
			.sort();

		duplicateProvidedSymbols.forEach(
			/**
			 * Called by Array.prototype.forEach to process one collection value.
			 * @param symbol - The symbol value accepted by the operation.
			 */ (symbol) => {
				errors.push(
					`Symbol ${symbol} is provided by multiple contributions: ${providedBySymbol.get(symbol).join(', ')}`,
				);
			},
		);

		const providedSymbols = [...providedBySymbol.keys()].sort();
		const requiredSymbolList = [...requiredSymbols].sort();
		const missingRequiredSymbols = requiredSymbolList.filter(
			/**
			 * Called by Array.prototype.filter to test whether one collection value is retained.
			 * @param symbol - The symbol value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (symbol) => !providedBySymbol.has(symbol) && !systemProvidedSymbolSet.has(symbol),
		);

		missingRequiredSymbols.forEach(
			/**
			 * Called by Array.prototype.forEach to process one collection value.
			 * @param symbol - The symbol value accepted by the operation.
			 */ (symbol) => {
				errors.push(`Required shader symbol is missing: ${symbol}`);
			},
		);

		const unusedProvidedSymbols = providedSymbols
			.filter(
				/**
				 * Called by Array.prototype.filter to test whether one collection value is retained.
				 * @param symbol - The symbol value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (symbol) => !requiredSymbols.has(symbol),
			)
			.sort();

		unusedProvidedSymbols.forEach(
			/**
			 * Called by Array.prototype.forEach to process one collection value.
			 * @param symbol - The symbol value accepted by the operation.
			 */ (symbol) => {
				warnings.push(`Provided shader symbol is not required by this assembly: ${symbol}`);
			},
		);

		return {
			status: errors.length === 0 ? 'accepted' : 'rejected',
			providedSymbols,
			requiredSymbols: requiredSymbolList,
			duplicateProvidedSymbols,
			missingRequiredSymbols,
			unusedProvidedSymbols,
			warnings,
			errors,
		};
	}
}
