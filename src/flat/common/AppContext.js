import React from 'react';

/**
 * @type {AppContextValue}
 */
const defaultContext = {
	registry: null,
	locale: 'disabled',
	localize: null,
	accessibilityEnabled: false,
	controlSize: 'small',
	controlVariant: 'outlined',
};

export default React.createContext(defaultContext);
