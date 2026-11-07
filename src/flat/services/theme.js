import {Service} from '@polylith/core';
import {createTheme} from '@mui/material/styles';

/**
 * Owns one stable MUI theme derived from application control defaults.
 *
 * @implements {FlatThemeServiceContract}
 */
export class ThemeService extends Service {
	/**
	 * Registers the application theme capability.
	 *
	 * @param {unknown} [registry] - Owning application registry.
	 */
	constructor(registry) {
		super('theme', registry);
		this.implement(['ready', 'getTheme']);
		/** @type {FlatMuiTheme | null} */
		this.theme = null;
	}

	/**
	 * Called at readiness to derive compatible component defaults once.
	 */
	ready() {
		if (this.theme) {
			return;
		}
		let {controlSize: size, controlVariant: variant} = this.registry.subscribe('app-context').get();
		this.theme = createTheme({
			cssVariables: {colorSchemeSelector: 'class'},
			colorSchemes: {light: true, dark: true},
			components: {
				MuiButton: {defaultProps: {size, variant}},
				MuiTextField: {defaultProps: {size, variant}},
				MuiFormControl: {defaultProps: {size, variant}},
				MuiSelect: {defaultProps: {size, variant}},
				MuiCheckbox: {defaultProps: {size}},
				MuiRadio: {defaultProps: {size}},
				MuiIconButton: {defaultProps: {size}},
			},
		});
	}

	/**
	 * Call this method after readiness to obtain the stable theme instance.
	 *
	 * @returns {FlatMuiTheme} - Application theme shared by its presentation tree.
	 */
	getTheme() {
		return this.theme;
	}
}

new ThemeService();
