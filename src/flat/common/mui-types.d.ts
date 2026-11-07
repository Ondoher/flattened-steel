/**
 * MUI theme owned by the application theme service.
 */
type FlatMuiTheme = import('@mui/material/styles').Theme;

/**
 * Theme capability exposed through the application registry after readiness.
 */
interface FlatThemeServiceContract {
	/**
	 * Call this method to obtain the stable application theme.
	 *
	 * @returns - The theme derived from application control defaults.
	 */
	getTheme(): FlatMuiTheme;
}

/**
 * Selection event emitted by the maintained MUI select control.
 */
type MuiSelectChangeEvent = import('@mui/material/Select').SelectChangeEvent<unknown>;
