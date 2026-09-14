/** Deterministic diagnostic or native full-film output selection. */
type StrobingRenderOptions = CreativeNodeOptions & {
	/** Whether to preserve the entire original choreography and titles. */
	fullFilm: boolean;
	/** Whether to compare identical geometry against two resident cache scene views. */
	ablation: boolean;
	/** Sealed generated candidate package run; absent for the deployed control. */
	candidateRun?: string;
	/** Retained presentation duration in seconds. */
	durationSeconds: number;
	/** Original choreography time of the first output frame. */
	startSeconds: number;
	/** Cache mechanism under measurement. */
	variant: StrobingCacheVariant;
	/** Interpolation of the original one-second physical receiver-light measurements. */
	lightingInterpolation: StrobingLightingInterpolation;
	/** Explicit contained display-response selection, independent of the cache. */
	colorResponse: StrobingColorResponse;
};

/** Physical receiver-light interpolation policy.
 * - **"linear"** - Original once-per-second linear interpolation.
 * - **"monotone-cubic"** - Shared monotone tangents through the same physical samples.
 */
type StrobingLightingInterpolation = 'linear' | 'monotone-cubic';

/** Frozen bundle's native packet constructor, preserving its runtime class identity. */
interface Window {
	/** Constructor exposed in the intercepted page for physical spectral interpolation. */
	__creativeSpectralPacket: CreativeSpectralPacketConstructor;
}

/** Cache mechanism selection for causal controls.
 * - **"control"** - Original nearest-bin publication with exact-frame presentation.
 * - **"stable-ground"** - Same representation regenerated with stable ground intersections.
 * - **"stable-ground-cubic"** - Four-metre surface limit with monotone cubic solar-angle interpolation.
 */
type StrobingCacheVariant = 'control' | 'stable-ground' | 'stable-ground-cubic';

/** Browser configuration with explicit control geometry and timing. */
type StrobingRenderConfiguration = CreativeRenderConfiguration &
	StrobingRenderOptions & {
		/** Exact native-pixel means, without the legacy diagnostic resampling. */
		sourceMeasurement: string;
		/** Frozen browser module host origin. */
		baseUrl: string;
		/** Newly allocated evidence run identity. */
		runId: string;
		/** Frozen parent camera for diagnostic sweeps; unused by full films. */
		fixedCamera?: CreativeCameraSnapshot;
	};

/** Pinned control fields consumed by the renderer launcher. */
type StrobingControl = {
	/** Exact camera from the immutable parent trace. */
	fixedCamera: CreativeCameraSnapshot;
};

/** Additional read-only cache diagnostics from the current production mode. */
type StrobingActiveMode = CreativeSolarMode & {
	/** Distant Sun's cache attachment, absent on the original dense path. */
	lightSource: {
		/** Current shared-cache controller diagnostics. */
		sharedCacheAttachment?: StrobingCacheAttachment;
	};
};

/** Experiment access to the live cache view, without changing its stored bytes. */
interface StrobingCacheAttachment {
	/** Current bounded controller measurements. */ diagnostics(): object;
	/** Pin a preparation route for the ablation's two adjacent scene views. */ setRoute(
		route: readonly number[],
	): void;
	/** Currently published coherent binding owner. */ active: StrobingCacheView;
}

/** Live shader-facing cache publication. */
interface StrobingCacheView {
	/** Read the current bindings and source-independent cache scene selection. */
	getRuntimePublication(): CacheRuntimePublication;
}

/** Offline publication operation accepted by the current renderer. */
type StrobingSceneRuntime = CreativeApplication['_sceneRuntime'] & {
	/** Complete one synchronous prepared publication before caller-owned rendering. */
	atFrameBoundary(operation: () => void, signal: AbortSignal): Promise<void>;
};

/** Exact direction binding owned by the current shared-cache runtime. */
type StrobingAtmosphereRuntime = CreativeSolarRuntime & {
	/** Mutable dynamic source binding, refreshed on every render. */
	_bindingValues: {'lightSource.direction'?: {set(x: number, y: number, z: number): unknown}};
};
/** Full film frame with its exact original choreography and pre-encode measurements. */
type StrobingFilmSceneFrame = StrobingMeasuredSceneFrame & {
	/** Exact UTC observation time from the original score. */ instant: string;
	/** Exact observer-local camera snapshot. */ camera: CreativeCameraSnapshot;
	/** Regional display-code means measured before encoding. */ sourceRegions: Record<string, StrobingPixelRegion>;
	/** Physical-to-display diagnostics present in horizon-investigation captures. */ color?: {
		/** Explicit experiment color variant. */ response: StrobingColorResponse;
		/** Native display model identity before the declared contained constants patch. */ model: string;
		/** Physical receiver illuminance before display gain. */ illuminanceLux: number;
		/** Physical adapting luminance; unchanged by color ablations. */ adaptationLuminance: UnitValue;
		/** Multiplicative pre-tone-map gain. */ gain: number;
		/** d(log gain)/d(log illuminance). */ gainLogElasticity: number;
	};
};
