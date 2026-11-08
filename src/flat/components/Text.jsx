import React from 'react';
import BaseText from './BaseText.jsx';
/**
 * Presents text using the base's shared localization boundary.
 *
 * @param {object} props - The text properties.
 * @returns {React.ReactElement} - The localized text presentation.
 */
export default function Text(props) {
	return <BaseText {...props} />;
}
