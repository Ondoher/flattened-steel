import React from 'react';

export default React.createContext({
	registry: null,
	locale: 'en-US',
	localize: null,
	localizationEnabled: false,
	accessibilityEnabled: false,
});
