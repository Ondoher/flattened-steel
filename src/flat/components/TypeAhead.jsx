import React, {Component} from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import AppContext from '../common/AppContext.js';
import BaseTextInput from './BaseTextInput.jsx';

/**
 * Presents ranked results without acquiring search, query or accepted-value ownership.
 *
 * @extends {Component<TypeAheadProps, TypeAheadState>}
 */
export default class TypeAhead extends Component {
	static contextType = AppContext;

	/**
	 * Creates transient popup state and stable MUI adapters.
	 *
	 * @param {TypeAheadProps} props - Prepared query/results and callbacks.
	 */
	constructor(props) {
		super(props);
		this.state = {open: false};
		this._onInputChange = this._onInputChange.bind(this);
		this._onSelect = this._onSelect.bind(this);
		this._onOpen = this._onOpen.bind(this);
		this._onClose = this._onClose.bind(this);
		this._onKeyDown = this._onKeyDown.bind(this);
		this._renderInput = this._renderInput.bind(this);
		this._renderOption = this._renderOption.bind(this);
	}

	/**
	 * Called for typing or clear intent; internal option resets never overwrite the query.
	 *
	 * @param {React.SyntheticEvent} event - MUI input event.
	 * @param {string} query - Current input text.
	 * @param {TypeAheadInputReason} reason - Origin of the proposed text change.
	 */
	_onInputChange(event, query, reason) {
		if (reason === 'input' || reason === 'clear') {
			this.props.onQueryChange(query);
		}
	}

	/**
	 * Called for selection to report only the stable option identity.
	 *
	 * @param {React.SyntheticEvent} event - Selection gesture.
	 * @param {TypeAheadOption|string|null} option - Chosen result, unaccepted query text, or clear.
	 */
	_onSelect(event, option) {
		if (option && typeof option !== 'string') {
			this.props.onSelect(option.id);
		}
	}

	/**
	 * Called by MUI to open the transient results popup.
	 */
	_onOpen() {
		this.setState({open: true});
	}

	/**
	 * Called by MUI to dismiss its results popup.
	 */
	_onClose() {
		this.setState({open: false});
	}

	/**
	 * Consumes the first Escape before a containing settings/panel surface sees it.
	 *
	 * @param {React.KeyboardEvent<HTMLDivElement>} event - Popup keyboard interaction.
	 */
	_onKeyDown(event) {
		if (event.key === 'Escape' && this.state.open) {
			event.stopPropagation();
		}
	}

	/**
	 * Preserves the order and complete matches supplied by the search owner.
	 *
	 * @param {TypeAheadOption[]} options - Already ranked results.
	 * @returns {TypeAheadOption[]} - Results without a second filter.
	 */
	_filterOptions(options) {
		return options;
	}

	/**
	 * Supplies the prepared visible option label.
	 *
	 * @param {TypeAheadOption|string} option - Prepared option or editable query text.
	 * @returns {string} - Display label.
	 */
	_optionLabel(option) {
		return typeof option === 'string' ? option : option.label;
	}

	/**
	 * Supplies a stable React key even when labels repeat.
	 *
	 * @param {TypeAheadOption|string} option - Prepared option or editable query text.
	 * @returns {string} - Stable option identity.
	 */
	_optionKey(option) {
		return typeof option === 'string' ? option : option.id;
	}

	/**
	 * Matches refreshed option objects to the caller's selected identity.
	 *
	 * @param {TypeAheadOption} option - Current result object.
	 * @param {TypeAheadOption} value - Caller-owned selection.
	 * @returns {boolean} - Whether the identities match.
	 */
	_equalOption(option, value) {
		return option.id === value.id;
	}

	/**
	 * Composes the maintained text base with MUI's complete input-slot wiring.
	 *
	 * @param {TypeAheadInputParams} params - MUI field and native input slots.
	 * @returns {React.ReactElement} - Input with inherited field defaults.
	 */
	_renderInput(params) {
		let {label, placeholder, size, variant, inputRef} = this.props;
		return (
			<BaseTextInput
				{...params}
				label={label}
				placeholder={placeholder}
				size={size}
				variant={variant}
				inputRef={inputRef}
			/>
		);
	}

	/**
	 * Owns the option element while allowing domain-specific prepared content.
	 *
	 * @param {React.HTMLAttributes<HTMLLIElement> & {key?: React.Key}} attributes - MUI option behavior.
	 * @param {TypeAheadOption} option - Prepared option.
	 * @returns {React.ReactElement} - One interactive option.
	 */
	_renderOption(attributes, option) {
		let {key, ...props} = attributes;
		let content = this.props.renderOption ? this.props.renderOption(option) : option.label;
		return (
			<li {...props} key={key ?? option.id} data-option-id={option.id}>
				{content}
			</li>
		);
	}

	/**
	 * Renders MUI's popup and input with one base-level context-size boundary.
	 *
	 * @returns {React.ReactNode} - Controlled type-ahead presentation.
	 */
	render() {
		let context = /** @type {AppContextValue} */ (this.context);
		let {
			id,
			query,
			options,
			value = null,
			disabled,
			size,
			noOptionsText,
			clearText,
			openText,
			closeText,
		} = this.props;
		let resolvedSize = size !== undefined ? size : context.controlSize;
		let open = this.state.open && !disabled;
		return (
			<Autocomplete
				id={id}
				className="app-type-ahead"
				size={resolvedSize}
				fullWidth
				options={options}
				value={value}
				inputValue={query}
				disabled={disabled}
				open={open}
				openOnFocus
				autoHighlight
				freeSolo
				noOptionsText={noOptionsText}
				clearText={clearText}
				openText={openText}
				closeText={closeText}
				filterOptions={this._filterOptions}
				getOptionLabel={this._optionLabel}
				getOptionKey={this._optionKey}
				isOptionEqualToValue={this._equalOption}
				renderInput={this._renderInput}
				renderOption={this._renderOption}
				onInputChange={this._onInputChange}
				onChange={this._onSelect}
				onOpen={this._onOpen}
				onClose={this._onClose}
				onKeyDown={this._onKeyDown}
			/>
		);
	}
}
