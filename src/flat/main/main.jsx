import React from 'react';
import {createRoot} from 'react-dom/client';
import {registry} from '@polylith/core';
import CssBaseline from '@mui/material/CssBaseline';
import StyledEngineProvider from '@mui/styled-engine/StyledEngineProvider';
import {ThemeProvider} from '@mui/material/styles';

import '../services/localize.js';
import '../services/app-context.js';
import '../services/theme.js';
import '../services/animation-loop.js';
import '../services/configuration.js';
import '../services/io.js';
import '../services/stellar-catalog.js';
import '../services/distant-sun-cache.js';

import '../services/app-pages.js';
import '../services/url.js';

let root = null;

/**
 * Call this method to unmount the generated application presentation.
 *
 * @returns {Promise<void>} - Completion after scene consumers and shared providers stop.
 */
export async function stopApplication() {
	root?.unmount();
	root = null;
	registry.subscribe('app-controller')?.stop();
	await Promise.all([
		registry.subscribe('flat-earth-controller').stop(),
		registry.subscribe('spherical-earth-controller').stop(),
	]);
	registry.subscribe('app-view')?.stop();
	registry.subscribe('distant-sun-cache').stop();
	registry.subscribe('stellar-catalog').stop();
	registry.subscribe('configuration').stop();
	registry.subscribe('animation-loop').stop();
}

registry.listen('ready', () => {
	registry.subscribe('app-controller').activate();
	let content = registry.subscribe('app-view').getComponent();
	let themeOwner = /** @type {FlatThemeServiceContract} */ (registry.subscribe('theme'));
	let theme = themeOwner.getTheme();
	root ??= createRoot(document.getElementById('main-content'));
	root.render(
		<React.StrictMode>
			<StyledEngineProvider enableCssLayer>
				<ThemeProvider theme={theme} defaultMode="dark" storageManager={null}>
					<CssBaseline />
					{content}
				</ThemeProvider>
			</StyledEngineProvider>
		</React.StrictMode>,
	);
});
