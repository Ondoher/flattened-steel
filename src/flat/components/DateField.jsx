import React from 'react';
import LocalDateTimeField from './LocalDateTimeField.jsx';

/**
 * Presents a caller-owned local date draft through the shared field base.
 *
 * @param {DateTimeFieldProps} props - Prepared entry and outward editing intent.
 * @returns {React.ReactElement} - Controlled local-format date field.
 */
export default function DateField(props) {
	return <LocalDateTimeField {...props} kind="date" />;
}
