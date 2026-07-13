import { PointerLockControls } from
	'three/examples/jsm/controls/PointerLockControls.js';

/** Own pointer-lock camera rotation for the Flat32 scene. */
export class PointerLookController {
	/**
	 * @param {HTMLCanvasElement} canvas - Receives pointer-lock requests.
	 * @param {import('three').PerspectiveCamera} camera - Rotates with pointer movement.
	 * @param {Flat32PointerLookChangeHandler} onChange - Reports lock state changes.
	 */
	constructor(canvas, camera, onChange) {
		this._canvas = canvas;
		this._onChange = onChange;
		this._controls = new PointerLockControls(camera, canvas);
		this._disposed = false;
		this._handleCanvasClick = this._handleCanvasClick.bind(this);
		this._handleLock = this._handleLock.bind(this);
		this._handleUnlock = this._handleUnlock.bind(this);
	}

	/** Request pointer lock after the user activates the rendered scene. */
	_handleCanvasClick() {
		if (!this._disposed && !this._controls.isLocked) {
			this._controls.lock();
		}
	}

	/** Publish active mouse-look state. */
	_handleLock() {
		this._onChange(true);
	}

	/** Publish released mouse-look state. */
	_handleUnlock() {
		this._onChange(false);
	}

	/** Install pointer listeners and configure the migrated look sensitivity. */
	start() {
		if (this._disposed) {
			throw new Error('Cannot start a disposed Flat32 pointer-look controller.');
		}

		this._controls.pointerSpeed = 0.7;
		this._controls.minPolarAngle = 0.05;
		this._controls.maxPolarAngle = Math.PI - 0.05;
		this._canvas.addEventListener('click', this._handleCanvasClick);
		this._controls.addEventListener('lock', this._handleLock);
		this._controls.addEventListener('unlock', this._handleUnlock);
		this._onChange(false);
	}

	/** Release pointer lock, listeners, and Three control resources. */
	dispose() {
		if (this._disposed) {
			return;
		}

		this._disposed = true;
		this._canvas.removeEventListener('click', this._handleCanvasClick);
		this._controls.removeEventListener('lock', this._handleLock);
		this._controls.removeEventListener('unlock', this._handleUnlock);
		this._controls.unlock();
		this._controls.dispose();
	}
}
