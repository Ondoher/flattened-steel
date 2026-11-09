/**
 * Perspective camera borrowed by shared native mouse input.
 */
type SceneLookCamera = import('three').PerspectiveCamera;

/**
 * Native pointer-lock interaction state.
 */
type SceneLookStatus = 'idle' | 'locked' | 'error';

/**
 * Accepted scene-camera quaternion in x, y, z, w order.
 */
type SceneCameraOrientation = readonly [number, number, number, number];
