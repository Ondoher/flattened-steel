import React from 'react';

/** @type {AppContextValue} */
const defaultContext = {
	registry: null,
	locale: 'en-US',
	localize: null,
	localizationEnabled: false,
	accessibilityEnabled: false,
	controlSize: 'small',
	controlVariant: 'outlined',
};

export default React.createContext(defaultContext);
