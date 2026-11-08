import {PointerLockControls} from 'three/examples/jsm/controls/PointerLockControls.js';

/**
 * Owns Flat32-equivalent pointer look for one scene surface without releasing another view's lock.
 */
export class PointerLookController {
	/**
	 * Creates native input and Three controls for one retained camera.
	 *
	 * @param {HTMLCanvasElement} canvas - Pointer-lock owner surface.
	 * @param {SceneLookCamera} camera - Camera rotated by actual mouse input.
	 * @param {(status: SceneLookStatus) => void} onStatus - Scoped interaction status.
	 * @param {() => void} onChange - Actual orientation-change callback.
	 */
	constructor(canvas, camera, onStatus, onChange) {
		this.canvas = canvas;
		this.onStatus = onStatus;
		this.onChange = onChange;
		this.controls = new PointerLockControls(camera, canvas);
		this.started = false;
		this.disposed = false;
		this._click = this._click.bind(this);
		this._lock = this._lock.bind(this);
		this._unlock = this._unlock.bind(this);
		this._error = this._error.bind(this);
		this._keyDown = this._keyDown.bind(this);
	}

	/**
	 * Called by trusted canvas activation to request native mouse look and report a rejected request.
	 */
	_click() {
		if (this.disposed || this.controls.isLocked) {
			return;
		}
		try {
			void Promise.resolve(this.canvas.requestPointerLock()).catch(this._error);
		} catch (error) {
			this._error();
		}
	}

	/**
	 * Called by Three controls when this canvas owns pointer lock.
	 */
	_lock() {
		this.onStatus('locked');
	}

	/**
	 * Called by Three controls when native Escape or another owner releases mouse look.
	 */
	_unlock() {
		this.onStatus('idle');
	}

	/**
	 * Called after a native request fails without discarding the rendered scene.
	 */
	_error() {
		if (!this.disposed) {
			this.onStatus('error');
		}
	}

	/**
	 * Called by keyboard input to release only this canvas when Escape reaches the document.
	 *
	 * @param {KeyboardEvent} event - Native keyboard input while mouse look is active.
	 */
	_keyDown(event) {
		let document = this.canvas.ownerDocument;
		if (event.key === 'Escape' && document.pointerLockElement === this.canvas) {
			document.exitPointerLock();
		}
	}

	/**
	 * Call this method after first scene publication to install one set of input listeners.
	 */
	start() {
		if (this.started || this.disposed) {
			return;
		}
		this.started = true;
		this.controls.pointerSpeed = 0.7;
		this.controls.minPolarAngle = 0.05;
		this.controls.maxPolarAngle = Math.PI - 0.05;
		this.canvas.addEventListener('click', this._click);
		this.canvas.ownerDocument.addEventListener('keydown', this._keyDown);
		this.controls.addEventListener('lock', this._lock);
		this.controls.addEventListener('unlock', this._unlock);
		this.controls.addEventListener('change', this.onChange);
		this.onStatus('idle');
	}

	/**
	 * Call this method to release exact native listeners and only this canvas's pointer lock.
	 */
	dispose() {
		if (this.disposed) {
			return;
		}
		this.disposed = true;
		this.canvas.removeEventListener('click', this._click);
		this.canvas.ownerDocument.removeEventListener('keydown', this._keyDown);
		this.controls.removeEventListener('lock', this._lock);
		this.controls.removeEventListener('unlock', this._unlock);
		this.controls.removeEventListener('change', this.onChange);
		this.controls.dispose();
		if (this.canvas.ownerDocument.pointerLockElement === this.canvas) {
			this.canvas.ownerDocument.exitPointerLock();
		}
	}
}
