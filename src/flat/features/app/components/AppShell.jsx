import React from 'react';

/**
 * Call this small stateless wrapper to present controller-activated feature content.
 *
 * @param {AppShellProps} props - Presentation supplied by AppView.
 * @returns {React.ReactElement} - Application boundary without workspace implementation.
 */
export default function AppShell({content}) {
	return <>{content}</>;
}
