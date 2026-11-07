import BaseFormMessage from '../../../components/BaseFormMessage.jsx';
import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMore from '@mui/icons-material/ExpandMore';
import React, {Component} from 'react';
import Button from '../../../components/Button.jsx';
import BaseTextInput from '../../../components/BaseTextInput.jsx';
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
				<Button type="button" onClick={onRetry}>
					{label}
				</Button>
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
				<BaseFormMessage className="location-error" type="error" role="alert">
					{message}
				</BaseFormMessage>
			);
		}
		return (
			<form className="location-coordinates" onSubmit={this._onSubmit} noValidate>
				<BaseTextInput
					label={latitudeLabel}
					name="latitude"
					type="number"
					slotProps={{htmlInput: {min: -90, max: 90, step: 'any'}}}
					value={presentation.editor.latitude}
					onChange={this._onLatitude}
				/>
				<BaseTextInput
					label={longitudeLabel}
					name="longitude"
					type="number"
					slotProps={{htmlInput: {min: -180, max: 180, step: 'any'}}}
					value={presentation.editor.longitude}
					onChange={this._onLongitude}
				/>
				{error}
				<Button type="submit" label={applyLabel} />
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
		let expandIcon = <ExpandMore />;
		return (
			<div className="location-editor" data-settings-focus="location" tabIndex={-1}>
				<Typography component="h4" variant="subtitle1">
					{title}
				</Typography>
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
				<Accordion className="location-coordinate-disclosure" disableGutters square elevation={0}>
					<AccordionSummary
						id="coordinate-summary"
						aria-controls="coordinate-details"
						expandIcon={expandIcon}
					>
						<Typography variant="body2">{coordinateLabel}</Typography>
					</AccordionSummary>
					<AccordionDetails>{this._renderCoordinates()}</AccordionDetails>
				</Accordion>
				<p className="city-attribution">
					<a href="https://www.geonames.org/">{attribution}</a>
				</p>
			</div>
		);
	}
}
