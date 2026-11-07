import React from 'react';
import LocalDateTimeField from './LocalDateTimeField.jsx';

/**
 * Presents a caller-owned local time draft through the shared field base.
 *
 * @param {DateTimeFieldProps} props - Prepared entry and outward editing intent.
 * @returns {React.ReactElement} - Controlled local-format time field.
 */
export default function TimeField(props) {
	return <LocalDateTimeField {...props} kind="time" />;
}
