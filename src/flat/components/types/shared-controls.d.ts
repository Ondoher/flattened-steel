/**
 * Product button properties, including a native element ref for focus restoration.
 */
type AppButtonProps = Omit<import('@mui/material/Button').ButtonProps, 'ref'> & {
	/**
	 * Prepared literal display label, or a phrase key when localization is enabled.
	 */
	label?: string;
	/**
	 * Whether the button label is a localization phrase key.
	 */
	localize?: boolean;
	/**
	 * Explicit action priority, applied only when variant is absent.
	 */
	priority?: 'primary' | 'secondary';
	/**
	 * Optional authored pressed-state presentation.
	 */
	selected?: boolean;
	/**
	 * Native button capability for focus restoration and anchoring.
	 */
	buttonRef?: React.Ref<HTMLButtonElement>;
};

/**
 * Prepared option independent of any domain catalog.
 */
type AppSelectOption = {
	/**
	 * Controlled scalar selection value.
	 */
	value: string | number;
	/**
	 * Prepared literal display label.
	 */
	label: string;
	/**
	 * Whether this choice can be selected.
	 */
	disabled?: boolean;
};

/**
 * Prepared search option independent of any domain catalog.
 */
type TypeAheadOption = {
	/**
	 * Stable element or option identity supplied by the presentation owner.
	 */
	id: string;
	/**
	 * Prepared literal display label, or a phrase key when localization is enabled.
	 */
	label: string;
	/**
	 * Optional prepared secondary option detail.
	 */
	detail?: string;
};

/**
 * Controlled query, ranked results and outward selection intent.
 */
type TypeAheadProps = {
	/**
	 * Stable element or option identity supplied by the presentation owner.
	 */
	id?: string;
	/**
	 * Prepared literal display label, or a phrase key when localization is enabled.
	 */
	label: string;
	/**
	 * Caller-owned editable search text.
	 */
	query: string;
	/**
	 * Prepared ranked results; this control does not filter or reorder them.
	 */
	options: readonly TypeAheadOption[];
	/**
	 * Caller-owned controlled value.
	 */
	value?: TypeAheadOption | null;
	/**
	 * Whether interaction is disabled.
	 */
	disabled?: boolean;
	/**
	 * Prepared empty-field input hint.
	 */
	placeholder?: string;
	/**
	 * Prepared feedback when no result is available.
	 */
	noOptionsText?: string;
	/**
	 * Prepared label for clearing query text.
	 */
	clearText?: string;
	/**
	 * Prepared label for opening results.
	 */
	openText?: string;
	/**
	 * Prepared label for closing results.
	 */
	closeText?: string;
	/**
	 * Supported explicit size, falling back to application context at the base boundary.
	 */
	size?: 'small' | 'medium';
	/**
	 * Supported explicit appearance, falling back to the underlying base context policy.
	 */
	variant?: 'outlined' | 'filled' | 'standard';
	/**
	 * Native input capability for caller-owned focus management.
	 */
	inputRef?: React.Ref<HTMLInputElement>;
	/**
	 * Renders prepared option content inside the control-owned interactive option.
	 *
	 * @param option - Prepared result to present.
	 * @returns - Option content without replacing its behavior wrapper.
	 */
	renderOption?: (option: TypeAheadOption) => React.ReactNode;
	/**
	 * Reports a typing or clear intent; option-selection resets are excluded.
	 *
	 * @param query - Proposed editable query text.
	 */
	onQueryChange: (query: string) => void;
	/**
	 * Reports an explicit choice without accepting free-form query text.
	 *
	 * @param id - Stable chosen option identity.
	 */
	onSelect: (id: string) => void;
};

/**
 * MUI's field slot contract supplied by Autocomplete.
 */
type TypeAheadInputParams = import('@mui/material/Autocomplete').AutocompleteRenderInputParams;

/**
 * Open state belongs to the control, independently of the query owner.
 */
type TypeAheadState = {
	/**
	 * Whether this transient popup is open.
	 */
	open: boolean;
};

/**
 * Event reasons emitted by MUI while typing, resetting or choosing an option.
 */
type TypeAheadInputReason = import('@mui/material/Autocomplete').AutocompleteInputChangeReason;

/**
 * Scalar controlled slider with explicit transient interaction boundaries.
 */
type AppSliderProps = {
	/**
	 * Stable element or option identity supplied by the presentation owner.
	 */
	id?: string;
	/**
	 * Additional control class for presentation layout.
	 */
	className?: string;
	/**
	 * Caller-owned controlled value.
	 */
	value: number;
	/**
	 * Minimum permitted slider value.
	 */
	min?: number;
	/**
	 * Maximum permitted slider value.
	 */
	max?: number;
	/**
	 * Numeric slider increment.
	 */
	step?: number;
	/**
	 * Whether interaction is disabled.
	 */
	disabled?: boolean;
	/**
	 * Supported explicit size, falling back to application context at the base boundary.
	 */
	size?: 'small' | 'medium';
	/**
	 * Prepared accessible slider name.
	 */
	'aria-label'?: string;
	/**
	 * Identity of prepared slider description content.
	 */
	'aria-describedby'?: string;
	/**
	 * Prepared spoken representation of the current slider value.
	 */
	'aria-valuetext'?: string;
	/**
	 * Reports a numeric value while the current slider interaction is active.
	 *
	 * @param value - Proposed scalar slider value.
	 */
	onChange: (value: number) => void;
	/**
	 * Reports MUI's committed numeric value.
	 *
	 * @param value - Committed scalar value.
	 */
	onCommit?: (value: number) => void;
	/**
	 * Called once before a pointer or keyboard interaction reports changed values.
	 */
	onInteractionStart?: () => void;
	/**
	 * Called once when an interaction completes, loses focus, is cancelled or unmounts.
	 */
	onInteractionEnd?: () => void;
	/**
	 * Called before interaction-end when an active gesture is interrupted.
	 */
	onInteractionCancel?: () => void;
};

/**
 * Identity of MUI's transient interaction widget after cancellation.
 */
type AppSliderState = {
	/**
	 * Identity used to retire an interrupted MUI interaction widget.
	 */
	generation: number;
};

/**
 * Reusable dense toolbar configuration without application ownership.
 */
type AppToolbarProps = import('@mui/material/Toolbar').ToolbarProps;

/**
 * A nonmodal anchored interactive panel, owned transiently by its trigger.
 */
type PanelButtonProps = {
	/**
	 * Stable element or option identity supplied by the presentation owner.
	 */
	id?: string;
	/**
	 * Prepared literal display label, or a phrase key when localization is enabled.
	 */
	label: string;
	/**
	 * Interactive content whose domain state remains owned by the caller.
	 */
	children: React.ReactNode;
	/**
	 * Whether interaction is disabled.
	 */
	disabled?: boolean;
	/**
	 * Supported explicit size, falling back to application context at the base boundary.
	 */
	size?: 'small' | 'medium' | 'large';
	/**
	 * Supported explicit appearance, falling back to the underlying base context policy.
	 */
	variant?: 'text' | 'outlined' | 'contained';
	/**
	 * Supported Popper placement relative to the trigger.
	 */
	placement?: import('@mui/material/Popper').PopperProps['placement'];
	/**
	 * Reports a change in this control's transient panel visibility.
	 *
	 * @param open - Whether the panel is now open.
	 */
	onOpenChange?: (open: boolean) => void;
};

/**
 * Interactive-panel visibility; domain content remains outside this state.
 */
type PanelButtonState = {
	/**
	 * Whether this transient popup is open.
	 */
	open: boolean;
};
