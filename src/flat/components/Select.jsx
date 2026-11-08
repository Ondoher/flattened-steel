import React from 'react';
import BaseSelect from './BaseSelect.jsx';
/**
 * Presents a select using the base's shared localization boundary.
 *
 * @param {object} props - The component properties.
 * @returns {React.ReactElement} - The localized component presentation.
 */
export default function Select(props) {
	return <BaseSelect {...props} />;
}
