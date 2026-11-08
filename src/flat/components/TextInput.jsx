import React from 'react';
import BaseTextInput from './BaseTextInput.jsx';
/**
 * Presents a text input using the base's shared localization boundary.
 *
 * @param {object} props - The component properties.
 * @returns {React.ReactElement} - The localized component presentation.
 */
export default function TextInput(props) {
	return <BaseTextInput {...props} />;
}
