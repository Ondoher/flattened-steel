import React, {Component} from 'react';
import CityPicker from './CityPicker.jsx';

/**
 * Presents city search, accepted-location feedback, and explicitly committed coordinate drafts.
 *
 * @extends {Component<LocationEditorProps>}
 */
export default class LocationEditor extends Component {
	/**
	 * Creates stable DOM event adapters for outward editing intents.
	 *
	 * @param {LocationEditorProps} props - Prepared editor values and callbacks.
	 */
	constructor(props) {
		super(props);
		this._onLatitude = this._onLatitude.bind(this);
		this._onLongitude = this._onLongitude.bind(this);
		this._onSubmit = this._onSubmit.bind(this);
	}

	/**
	 * Called by the latitude input to report draft text.
	 *
	 * @param {React.ChangeEvent<HTMLInputElement>} event - Latitude edit.
	 */
	_onLatitude(event) {
		this.props.onCoordinateChange('latitude', event.currentTarget.value);
	}

	/**
	 * Called by the longitude input to report draft text.
	 *
	 * @param {React.ChangeEvent<HTMLInputElement>} event - Longitude edit.
	 */
	_onLongitude(event) {
		this.props.onCoordinateChange('longitude', event.currentTarget.value);
	}

	/**
	 * Called by form submission to request acceptance without navigating.
	 *
	 * @param {React.FormEvent<HTMLFormElement>} event - Coordinate submission.
	 */
	_onSubmit(event) {
		event.preventDefault();
		this.props.onApplyCoordinates();
	}

	/**
	 * Called by rendering to present the accepted location separately from search drafts.
	 *
	 * @returns {React.ReactNode} - Current shared-location summary.
	 */
	_renderSelection() {
		let {presentation, text} = this.props;
		let summary = text('global-configuration.location.none');
		if (presentation.locationCoordinates !== null) {
			let name = presentation.locationLabel ?? text('global-configuration.location.manual');
			summary = text('global-configuration.location.selected', {
				name,
				coordinates: presentation.locationCoordinates,
			});
		}
		return (
			<p className="location-selection" role="status">
				{summary}
			</p>
		);
	}

	/**
	 * Called by rendering to present catalog status and retry intent.
	 *
	 * @returns {React.ReactNode} - City-loading feedback region.
	 */
	_renderCatalogStatus() {
		let {presentation, text, onRetry} = this.props;
		let message = text(presentation.catalogMessage);
		let retry = null;
		if (presentation.canRetry) {
			let label = text('global-configuration.cities.retry');
			retry = (
				<button type="button" onClick={onRetry}>
					{label}
				</button>
			);
		}
		return (
			<div className="city-catalog-status">
				<p role="status">{message}</p>
				{retry}
			</div>
		);
	}

	/**
	 * Called by rendering to present manual coordinates and validation feedback.
	 *
	 * @returns {React.ReactNode} - Explicit coordinate-entry form.
	 */
	_renderCoordinates() {
		let {presentation, text} = this.props;
		let latitudeLabel = text('global-configuration.latitude');
		let longitudeLabel = text('global-configuration.longitude');
		let applyLabel = text('global-configuration.coordinates.apply');
		let error = null;
		if (presentation.coordinateError) {
			let message = text(presentation.coordinateError);
			error = (
				<p className="location-error" role="alert">
					{message}
				</p>
			);
		}
		return (
			<form className="location-coordinates" onSubmit={this._onSubmit} noValidate>
				<label>
					<span>{latitudeLabel}</span>
					<input
						name="latitude"
						type="number"
						min="-90"
						max="90"
						step="any"
						value={presentation.editor.latitude}
						onChange={this._onLatitude}
					/>
				</label>
				<label>
					<span>{longitudeLabel}</span>
					<input
						name="longitude"
						type="number"
						min="-180"
						max="180"
						step="any"
						value={presentation.editor.longitude}
						onChange={this._onLongitude}
					/>
				</label>
				{error}
				<button type="submit">{applyLabel}</button>
			</form>
		);
	}

	/**
	 * Call this method to render feature-owned location controls without accessing services.
	 *
	 * @returns {React.ReactNode} - Location settings region.
	 */
	render() {
		let {presentation, text, onQueryChange, onSelectCity} = this.props;
		let title = text('global-configuration.location.title');
		let disabled = !presentation.searchEnabled;
		let attribution = text('global-configuration.cities.attribution');
		let coordinateLabel = text('global-configuration.coordinates.disclosure');
		return (
			<div className="location-editor" data-settings-focus="location" tabIndex={-1}>
				<h4>{title}</h4>
				{this._renderSelection()}
				<CityPicker
					query={presentation.editor.query}
					matches={presentation.matches}
					disabled={disabled}
					text={text}
					onQueryChange={onQueryChange}
					onSelectCity={onSelectCity}
				/>
				{this._renderCatalogStatus()}
				<details className="location-coordinate-disclosure">
					<summary>{coordinateLabel}</summary>
					{this._renderCoordinates()}
				</details>
				<p className="city-attribution">
					<a href="https://www.geonames.org/">{attribution}</a>
				</p>
			</div>
		);
	}
}
