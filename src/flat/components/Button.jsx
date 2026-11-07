import React from 'react';
import BaseButton from './BaseButton.jsx';

/**
 * Presents a product action using the base's context defaults and supported overrides.
 *
 * @param {AppButtonProps} props - Prepared action presentation.
 * @returns {React.ReactElement} - The shared button.
 */
export default function Button(props) {
	let className = ['app-button', props.className].filter(Boolean).join(' ');
	return <BaseButton {...props} className={className} />;
}
