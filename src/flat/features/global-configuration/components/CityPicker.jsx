import React, {Component, createRef} from 'react';

/**
 * Controlled city-search presentation with local popup and keyboard-selection state.
 *
 * @extends {Component<CityPickerProps, CityPickerState>}
 */
export default class CityPicker extends Component {
	/**
	 * Creates local menu state and stable named DOM handlers.
	 *
	 * @param {CityPickerProps} props - Prepared query/results and outward intents.
	 */
	constructor(props) {
		super(props);
		this.state = {open: false, activeId: null};
		/** @type {React.RefObject<HTMLUListElement>} */
		this._results = createRef();
		this._onChange = this._onChange.bind(this);
		this._onFocus = this._onFocus.bind(this);
		this._onBlur = this._onBlur.bind(this);
		this._onKeyDown = this._onKeyDown.bind(this);
		this._onResultMouseDown = this._onResultMouseDown.bind(this);
		this._onSelectResult = this._onSelectResult.bind(this);
		this._scrollActiveResult = this._scrollActiveResult.bind(this);
	}

	/**
	 * Called by the search input to report query text and reopen results.
	 *
	 * @param {React.ChangeEvent<HTMLInputElement>} event - Search input change.
	 */
	_onChange(event) {
		this.setState({open: true, activeId: null});
		this.props.onQueryChange(event.currentTarget.value);
	}

	/**
	 * Called by input focus to show the current search results.
	 */
	_onFocus() {
		this.setState({open: true});
	}

	/**
	 * Called by focus leaving the picker to dismiss its menu without a delayed timer.
	 *
	 * @param {React.FocusEvent<HTMLDivElement>} event - Picker focus transition.
	 */
	_onBlur(event) {
		if (!event.currentTarget.contains(event.relatedTarget)) {
			this.setState({open: false});
		}
	}

	/**
	 * Called by keyboard handling or rendering to resolve the currently highlighted result.
	 *
	 * @returns {number} - Active index, defaulting to the first current result.
	 */
	_activeIndex() {
		let index = this.props.matches.findIndex((match) => match.id === this.state.activeId);
		return Math.max(0, index);
	}

	/**
	 * Called by the input to navigate results, commit a city, or dismiss only the picker.
	 *
	 * @param {React.KeyboardEvent<HTMLInputElement>} event - Keyboard intent.
	 */
	_onKeyDown(event) {
		let matches = this.props.matches;
		if (event.key === 'Escape' && this.state.open) {
			event.preventDefault();
			event.stopPropagation();
			this.setState({open: false});
			return;
		}
		if (!matches.length) {
			return;
		}
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			let direction = event.key === 'ArrowDown' ? 1 : -1;
			let index = this.state.open ? (this._activeIndex() + direction + matches.length) % matches.length : 0;
			this.setState({open: true, activeId: matches[index].id}, this._scrollActiveResult);
		} else if (event.key === 'Enter' && this.state.open) {
			event.preventDefault();
			this.props.onSelectCity(matches[this._activeIndex()].id);
			this.setState({open: false, activeId: null});
		}
	}

	/**
	 * Called after keyboard selection updates to keep the highlighted result visible in the scrolling list.
	 */
	_scrollActiveResult() {
		this._results.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({block: 'nearest'});
	}

	/**
	 * Called by pointer selection to keep focus in the combobox until the choice is committed.
	 *
	 * @param {React.MouseEvent<HTMLLIElement>} event - Pointer press on a result.
	 */
	_onResultMouseDown(event) {
		event.preventDefault();
	}

	/**
	 * Called by a result click to report its stable identity.
	 *
	 * @param {React.MouseEvent<HTMLLIElement>} event - Result selection.
	 */
	_onSelectResult(event) {
		this.props.onSelectCity(event.currentTarget.dataset.cityId);
		this.setState({open: false, activeId: null});
	}

	/**
	 * Called by result rendering to present one stable, prepared city option.
	 *
	 * @param {CityMatchPresentation} match - City result presentation.
	 * @param {number} index - Current result position for combobox focus identification.
	 * @returns {React.ReactNode} - City option.
	 */
	_renderResult(match, index) {
		let selected = index === this._activeIndex();
		let id = `global-city-result-${index}`;
		return (
			<li
				key={match.id}
				id={id}
				role="option"
				aria-selected={selected}
				data-city-id={match.id}
				onMouseDown={this._onResultMouseDown}
				onClick={this._onSelectResult}
			>
				<span>{match.name}</span>
				<span className="city-result-detail">{match.detail}</span>
			</li>
		);
	}

	/**
	 * Called by rendering to prepare the repeated result elements outside their enclosing JSX.
	 *
	 * @returns {React.ReactNode} - Result list, or no list while dismissed or empty.
	 */
	_renderResults() {
		if (!this.state.open || this.props.disabled || !this.props.matches.length) {
			return null;
		}
		let results = this.props.matches.map((match, index) => this._renderResult(match, index));
		return (
			<ul ref={this._results} id="global-city-results" className="city-results" role="listbox">
				{results}
			</ul>
		);
	}

	/**
	 * Call this method to render a labelled city combobox without model or registry access.
	 *
	 * @returns {React.ReactNode} - Search input and optional result list.
	 */
	render() {
		let {query, disabled, text} = this.props;
		let label = text('global-configuration.city');
		let placeholder = text('global-configuration.cities.placeholder');
		let expanded = this.state.open && !disabled && this.props.matches.length > 0;
		let controls = expanded ? 'global-city-results' : undefined;
		let activeDescendant = expanded ? `global-city-result-${this._activeIndex()}` : undefined;
		return (
			<div className="city-picker" onBlur={this._onBlur}>
				<label htmlFor="global-city-query">{label}</label>
				<input
					id="global-city-query"
					type="search"
					role="combobox"
					autoComplete="off"
					aria-autocomplete="list"
					aria-expanded={expanded}
					aria-controls={controls}
					aria-activedescendant={activeDescendant}
					value={query}
					disabled={disabled}
					placeholder={placeholder}
					onChange={this._onChange}
					onFocus={this._onFocus}
					onKeyDown={this._onKeyDown}
				/>
				{this._renderResults()}
			</div>
		);
	}
}
