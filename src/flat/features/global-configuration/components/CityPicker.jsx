import React, {Component} from 'react';
import TypeAhead from '../../../components/TypeAhead.jsx';

/**
 * Adapts prepared city results to the shared control without owning city search.
 *
 * @extends {Component<CityPickerProps>}
 */
export default class CityPicker extends Component {
	/**
	 * Creates the stable city-content renderer.
	 *
	 * @param {CityPickerProps} props - Prepared query/results and outward intents.
	 */
	constructor(props) {
		super(props);
		this._renderOption = this._renderOption.bind(this);
	}

	/**
	 * Maps a prepared city into the generic option contract.
	 *
	 * @param {CityMatchPresentation} match - Prepared catalog result.
	 * @returns {TypeAheadOption} - Generic identity and presentation.
	 */
	_toOption(match) {
		return {id: match.id, label: match.name, detail: match.detail};
	}

	/**
	 * Owns the city-specific option content and its styled region.
	 *
	 * @param {TypeAheadOption} option - Prepared city presentation.
	 * @returns {React.ReactNode} - Name and geographic detail.
	 */
	_renderOption(option) {
		return (
			<div className="city-option-content">
				<span>{option.label}</span>
				<span className="city-result-detail">{option.detail}</span>
			</div>
		);
	}

	/**
	 * Renders controlled city entry using existing catalog ranking and callbacks.
	 *
	 * @returns {React.ReactNode} - Configuration-specific city control.
	 */
	render() {
		let {query, matches, disabled, onQueryChange, onSelectCity} = this.props;
		let label = 'global-configuration.city';
		let placeholder = 'global-configuration.cities.placeholder';
		let noOptionsText = 'controls.no-options';
		let clearText = 'controls.clear';
		let openText = 'controls.open-options';
		let closeText = 'controls.close-options';
		let options = matches.map(this._toOption);
		return (
			<div className="city-picker">
				<TypeAhead
					id="global-city-query"
					label={label}
					query={query}
					options={options}
					disabled={disabled}
					placeholder={placeholder}
					noOptionsText={noOptionsText}
					clearText={clearText}
					openText={openText}
					closeText={closeText}
					renderOption={this._renderOption}
					onQueryChange={onQueryChange}
					onSelect={onSelectCity}
				/>
			</div>
		);
	}
}
