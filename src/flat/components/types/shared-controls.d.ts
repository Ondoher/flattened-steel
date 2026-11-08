/**
 * Product button properties, including a native element ref for focus restoration.
 */
type AppButtonProps = Omit<import('@mui/material/Button').ButtonProps, 'ref'> & {
	/**
	 * Phrase key with optional replacements; translated by the control.
	 */
	label?: LocalizedText;
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
	 * Phrase key with optional replacements; translated by the control.
	 */
	label: LocalizedText;
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
	 * Display label prepared by the caller; result data is not translated by this control.
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
	 * Phrase key translated by the control.
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
	 * Requests initial input focus when this control is mounted in a popup.
	 */
	autoFocus?: boolean;
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
 * Native option behavior supplied by MUI, including its optional React key.
 */
type TypeAheadOptionAttributes = React.HTMLAttributes<HTMLLIElement> & {key?: React.Key};

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
	 * Requests native input focus when mounted in a popup.
	 */
	autoFocus?: boolean;
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
	 * Optional pointer/touch snap targets in slider-value units, within min/max.
	 * Targets are read without mutation; the first supplied point wins an equal-distance tie.
	 * Keyboard and native-input changes retain their ordinary precise values.
	 */
	snapPoints?: readonly number[];
	/**
	 * Inclusive attraction distance in slider-value units; absent, zero or negative disables snapping.
	 * Values outside every target's radius pass through unchanged.
	 */
	snapRadius?: number;
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
	 * Reports the committed numeric value using the same snapping policy as onChange.
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
 * An anchored interactive MUI Popover, owned transiently by its trigger.
 */
type PanelButtonProps = {
	/**
	 * Optional icon-only trigger; absence retains the text-and-arrow presentation.
	 */
	icon?: React.ReactNode;
	/**
	 * Optional trigger presentation class.
	 */
	className?: string;
	/**
	 * Changing this request value asks the popup to close declaratively.
	 */
	closeRequest?: number;
	/**
	 * Called after MUI's exit transition while still closed, for deferred navigation.
	 */
	onClosed?: () => void;
	/**
	 * Stable element or option identity supplied by the presentation owner.
	 */
	id?: string;
	/**
	 * Phrase key and optional replacements for the trigger and popup name.
	 */
	label: LocalizedText;
	/**
	 * Interactive content whose domain state remains owned by the caller.
	 */
	children: React.ReactNode | ((open: boolean) => React.ReactNode);
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
	 * Point on the trigger used to anchor the Popover; defaults to bottom left.
	 */
	anchorOrigin?: PanelButtonOrigin;
	/**
	 * Point on the popup attached to the anchor; defaults to top left.
	 */
	transformOrigin?: PanelButtonOrigin;
	/**
	 * Reports a change in this control's transient panel visibility.
	 *
	 * @param open - Whether the panel is now open.
	 */
	onOpenChange?: (open: boolean) => void;
};

/**
 * Positioning origin supported by MUI Popover.
 */
type PanelButtonOrigin = import('@mui/material/Popover').PopoverOrigin;

/**
 * Interactive-panel anchor; visibility is derived and domain content remains outside this state.
 */
type PanelButtonState = {
	/**
	 * MUI positioning anchor supplied by the trigger's click event, or null when closed.
	 */
	anchorEl: HTMLButtonElement | null;
};
