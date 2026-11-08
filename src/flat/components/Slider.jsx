import React, {Component} from 'react';
import MuiSlider from '@mui/material/Slider';
import AppContext from '../common/AppContext.js';

/**
 * Controlled scalar slider with transient interaction boundaries and exact cleanup.
 *
 * @extends {Component<AppSliderProps, AppSliderState>}
 */
export default class Slider extends Component {
	static contextType = AppContext;

	/**
	 * Creates stable gesture adapters without owning the accepted value.
	 *
	 * @param {AppSliderProps} props - Prepared value and outward interaction callbacks.
	 */
	constructor(props) {
		super(props);
		this.state = {generation: 0};
		this._editing = false;
		this._begin = this._begin.bind(this);
		this._cancel = this._cancel.bind(this);
		this._end = this._end.bind(this);
		this._onChange = this._onChange.bind(this);
		this._onCommit = this._onCommit.bind(this);
		this._onKeyDown = this._onKeyDown.bind(this);
	}

	/**
	 * Releases an outstanding interaction when its control disappears.
	 */
	componentWillUnmount() {
		this._finish(true);
	}

	/**
	 * Cancels an active gesture when the owning presentation disables the control.
	 *
	 * @param {AppSliderProps} previous - Prior control state.
	 */
	componentDidUpdate(previous) {
		if (!previous.disabled && this.props.disabled) {
			this._finish(true);
		}
	}

	/**
	 * Starts one interaction before reporting any changed value.
	 */
	_begin() {
		if (this._editing || this.props.disabled) {
			return;
		}
		this._editing = true;
		document.addEventListener('pointercancel', this._cancel);
		window.addEventListener('blur', this._cancel);
		this.props.onInteractionStart?.();
	}

	/**
	 * Ends one interaction and releases its global cancellation listeners.
	 *
	 * @param {boolean} cancelled - Whether the gesture was interrupted.
	 */
	_finish(cancelled) {
		if (!this._editing) {
			return;
		}
		this._editing = false;
		document.removeEventListener('pointercancel', this._cancel);
		window.removeEventListener('blur', this._cancel);
		if (cancelled) {
			this.props.onInteractionCancel?.();
		}
		this.props.onInteractionEnd?.();
	}

	/**
	 * Completes a keyboard or focus interaction once.
	 */
	_end() {
		this._finish(false);
	}

	/**
	 * Releases an interrupted pointer/window interaction once.
	 */
	_cancel() {
		if (!this._editing) {
			return;
		}
		// Retire MUI's interrupted widget so its document drag listeners are released.
		this.setState((state) => ({generation: state.generation + 1}));
		this._finish(true);
	}

	/**
	 * Starts keyboard editing before MUI's native input changes.
	 *
	 * @param {React.KeyboardEvent<HTMLSpanElement>} event - Slider editing gesture.
	 */
	_onKeyDown(event) {
		if (
			['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(event.key)
		) {
			this._begin();
		}
		if (event.key === 'Escape') {
			this._cancel();
		}
	}

	/**
	 * Reports MUI's scalar numeric value after beginning its interaction.
	 *
	 * @param {Event} event - MUI slider event.
	 * @param {number|number[]} value - Value emitted by the scalar slider configuration.
	 */
	_onChange(event, value) {
		this._begin();
		this.props.onChange(/** @type {number} */ (value));
	}

	/**
	 * Reports a committed value, keeping repeated keyboard changes in one gesture.
	 *
	 * @param {Event|React.SyntheticEvent} event - Commit source.
	 * @param {number|number[]} value - Scalar configured value.
	 */
	_onCommit(event, value) {
		this.props.onCommit?.(/** @type {number} */ (value));
		if (event.type !== 'keydown' && event.type !== 'keyup') {
			this._end();
		}
	}

	/**
	 * Renders a scalar MUI slider with its supported context-size default.
	 *
	 * @returns {React.ReactNode} - Shared controlled slider.
	 */
	render() {
		let context = /** @type {AppContextValue} */ (this.context);
		let {
			id,
			size,
			autoFocus,
			onChange,
			onCommit,
			onInteractionStart,
			onInteractionEnd,
			onInteractionCancel,
			...props
		} = this.props;
		let resolvedSize = size !== undefined ? size : context.controlSize;
		// MUI 9's focus trap selects a declaratively marked descendant on popup entry.
		let focusTarget = autoFocus ? '' : undefined;
		let slotProps = {input: {id, autoFocus, 'data-mui-focusable': focusTarget}};
		return (
			<MuiSlider
				key={this.state.generation}
				{...props}
				size={resolvedSize}
				slotProps={slotProps}
				onPointerDown={this._begin}
				onKeyDownCapture={this._onKeyDown}
				onKeyUp={this._end}
				onBlur={this._end}
				onChange={this._onChange}
				onChangeCommitted={this._onCommit}
			/>
		);
	}
}
