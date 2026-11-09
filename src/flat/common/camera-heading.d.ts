/**
 * Call this function to read the horizontal heading of an accepted scene camera orientation.
 *
 * @param orientation - Unit quaternion using scene east/up/south axes.
 * @returns - Clockwise degrees from north within [0, 360).
 */
export function getCameraHeading(orientation: SceneCameraOrientation): number;
