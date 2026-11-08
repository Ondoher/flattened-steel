/**
 * Perspective camera borrowed by shared native mouse input.
 */
type SceneLookCamera = import('three').PerspectiveCamera;

/**
 * Native pointer-lock interaction state.
 */
type SceneLookStatus = 'idle' | 'locked' | 'error';
