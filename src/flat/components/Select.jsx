import React from 'react';
import BaseSelect from './BaseSelect.jsx';
/**
 * Call this component to render BaseSelect with localization enabled.
 *
 * @param {object} props - The component properties.
 * @returns {React.ReactElement} - The localized component presentation.
 */
export default function Select(props) {
	return <BaseSelect localize {...props} />;
}
