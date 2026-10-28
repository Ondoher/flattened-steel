import React, {useContext} from 'react';
import AppContext from '../../../common/AppContext.js';
/**
 * Call this component to render the generated semantic starter page.
 *
 * @returns {React.ReactElement} - The starter page.
 */
export default function Page() {
	const context = useContext(AppContext);
	const heading = context.localizationEnabled
		? (context.localize?.translate('workspace.title', {}, undefined, context.locale) ?? '')
		: 'Workspace';
	return (
		<section>
			<h1>{heading}</h1>
		</section>
	);
}
