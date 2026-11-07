import React from 'react';
import MuiToolbar from '@mui/material/Toolbar';

/**
 * Supplies a reusable dense control container without owning application actions.
 *
 * @param {AppToolbarProps} props - MUI container configuration and children.
 * @returns {React.ReactElement} - The reusable toolbar.
 */
export default function Toolbar(props) {
	let {variant = 'dense', disableGutters = true, ...rest} = props;
	return <MuiToolbar {...rest} variant={variant} disableGutters={disableGutters} />;
}
