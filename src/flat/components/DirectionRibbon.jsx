import React, {Component} from 'react';
import AppContext from '../common/AppContext.js';
import {resolveComponentText} from './component-text.js';

const DIRECTIONS = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

/**
 * Presents cardinal and intercardinal bearings on a heading tape with a fixed center indicator.
 *
 * @extends {Component<DirectionRibbonProps>}
 */
export default class DirectionRibbon extends Component {
	static contextType = AppContext;

	/**
	 * Owns one localized bearing and its prepared position relative to the camera heading.
	 *
	 * @param {string} direction - Stable direction phrase suffix.
	 * @param {number} index - Clockwise bearing index at 45-degree intervals.
	 * @returns {React.ReactNode} - Positioned direction label.
	 */
	_renderDirection(direction, index) {
		let context = /** @type {AppContextValue} */ (this.context);
		let text = resolveComponentText(context, `camera.compass.${direction}`);
		let offset = ((index * 45 - this.props.headingDegrees + 540) % 360) - 180;
		let style = {left: `${50 + (offset * 100) / 180}%`};
		return (
			<span className="direction-ribbon-label" key={direction} data-direction={direction} style={style}>
				{text}
			</span>
		);
	}

	/**
	 * Prepares the complete direction label set before composing its JSX.
	 *
	 * @returns {React.ReactNode[]} - Eight localized compass points, clipped to the visible tape.
	 */
	_renderDirections() {
		return DIRECTIONS.map((direction, index) => this._renderDirection(direction, index));
	}

	/**
	 * Presents a responsive 180-degree tape centered on the camera's horizontal heading.
	 *
	 * @returns {React.ReactNode} - Shared directional ribbon without numeric ticks or scene dependencies.
	 */
	render() {
		let context = /** @type {AppContextValue} */ (this.context);
		let direction = DIRECTIONS[Math.round(this.props.headingDegrees / 45) % DIRECTIONS.length];
		let name = resolveComponentText(context, `camera.compass.${direction}`);
		let label = resolveComponentText(context, 'camera.compass.heading', {direction: name});
		let directions = this._renderDirections();
		return (
			<div className="direction-ribbon" role="img" aria-label={label} data-heading={this.props.headingDegrees}>
				<div className="direction-ribbon-track">{directions}</div>
			</div>
		);
	}
}
