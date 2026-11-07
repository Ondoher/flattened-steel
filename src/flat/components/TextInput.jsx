import React from 'react';
import BaseTextInput from './BaseTextInput.jsx';
/**
 * Call this component to render BaseTextInput with localization enabled.
 *
 * @param {object} props - The component properties.
 * @returns {React.ReactElement} - The localized component presentation.
 */
export default function TextInput(props) {
	return <BaseTextInput localize {...props} />;
}
