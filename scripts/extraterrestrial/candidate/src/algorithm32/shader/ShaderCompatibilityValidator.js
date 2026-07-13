import { acceptShaderAssemblyCollections } from './shaderCollectionValidation.js';

/** Validate executable symbol relationships between shader contributions. */
export class ShaderCompatibilityValidator {
	/**
	 * Validate one shader assembly request.
	 *
	 * @param {ShaderAssemblyRequest} request - Supplies the candidate shader assembly.
	 * @returns {ShaderSymbolValidationReport} Return the validation report.
	 */
	validate(request) {
		if (!request || typeof request !== 'object') {
			throw new TypeError('Shader assembly request is required.');
		}

		const {
			contributions,
			mainRequiredSymbols,
			systemProvidedSymbols,
		} = acceptShaderAssemblyCollections(request);
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
			.filter(([, providers]) => providers.length > 1)
			.map(([symbol]) => symbol)
			.sort();

		duplicateProvidedSymbols.forEach((symbol) => {
			errors.push(`Symbol ${symbol} is provided by multiple contributions: ${providedBySymbol.get(symbol).join(', ')}`);
		});

		const providedSymbols = [...providedBySymbol.keys()].sort();
		const requiredSymbolList = [...requiredSymbols].sort();
		const missingRequiredSymbols = requiredSymbolList
			.filter((symbol) => !providedBySymbol.has(symbol) && !systemProvidedSymbolSet.has(symbol));

		missingRequiredSymbols.forEach((symbol) => {
			errors.push(`Required shader symbol is missing: ${symbol}`);
		});

		const unusedProvidedSymbols = providedSymbols
			.filter((symbol) => !requiredSymbols.has(symbol))
			.sort();

		unusedProvidedSymbols.forEach((symbol) => {
			warnings.push(`Provided shader symbol is not required by this assembly: ${symbol}`);
		});

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
