import React from 'react';
import BaseText from './BaseText.jsx';
/**
 * Call this component to render text with localization enabled.
 *
 * @param {object} props - The text properties.
 * @returns {React.ReactElement} - The localized text presentation.
 */
export default function Text(props) {
	return <BaseText localize {...props} />;
}
