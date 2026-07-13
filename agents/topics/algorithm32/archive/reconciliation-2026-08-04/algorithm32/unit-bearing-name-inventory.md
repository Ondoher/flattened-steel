# Algorithm32 Unit-Bearing Name Inventory

This document owns Step 7.1's classification of unit-bearing names in
`src/algorithm32`. It applies the Algorithm32 rule that durable data properties
use neutral names and carry units as data, while computational bindings already
normalized to a known unit may state that unit in their names.

## Audit Basis

The reproducible current-state scan covers every JavaScript, JSX, and
ambient-declaration identifier, plus every identifier-like token in embedded
shader source, containing `Meters`, `Radians`, `Degrees`, `Nanometers`,
`Micrometers`, `Milliseconds`, or `Seconds`. It includes unit tokens in the
middle of names as well as terminal suffixes.

The final reconciled tree contains 1,014 AST occurrences and 123 unique AST
names. Embedded source contributes 50 additional shader-only names, producing 173
unique current names in the conservative inventory.

## Classification Summary

| Classification | Unique names | Disposition |
| --- | ---: | --- |
| JavaScript normalized locals and parameters | 90 | Retain. Each is a computational binding already normalized to the named unit. |
| Shader-local scalars and uniforms | 52 | Retain. Shader arithmetic requires fixed scalar units at the GPU boundary. |
| Explicit conversion, construction, clock, and wrapping callables | 22 | Retain. The unit token describes the operation's input or scalar result, not durable data. |
| Private unit-normalizing computational methods | 7 | Retain. Their raw scalar/vector result is consumed immediately by local computation. |
| Platform API names | 2 | False positives: `Date.getUTCMilliseconds()` and `Date.getUTCSeconds()`. |
| Durable result property | 0 | No current violation. |
| **Total** | **173** | **No actionable durable violation.** |

## Reviewed Properties And Methods

The 33 code-level names that occur as a method/function definition, member
access, or object key received individual semantic review.

| Names | Count | Classification and evidence |
| --- | ---: | --- |
| `acceptPositionInMeters`, `durationFromMilliseconds`, `durationInSeconds`, `inDegrees`, `inMeters`, `inMicrometers`, `inNanometers`, `inRadians`, `nowMilliseconds`, `optionalMeters`, `positionInMeters`, `positiveMetersOrDefault`, `scaleInMetersPerSceneUnit`, `toDegrees`, `toMeters`, `toMetersPosition`, `toMetersSeries`, `toMicrometers`, `toNanometers`, `toRadians`, `wrapDegrees`, `wrapRadians` | 22 | Callable operations whose names state the accepted or produced computational unit. They return a quantity packet or an immediately consumed normalized scalar/vector and are not durable data-property names. Retain. |
| `_cameraPositionMetersOrNull`, `_endpointExtentMetersOrNull`, `_endpointPositionMetersListOrNull`, `_flatGroundExtentMeters`, `_fractionalYearRadians`, `_solarDeclinationDegrees`, `_wavelengthMicrometersForChannel` | 7 | Private computational methods returning normalized raw values for immediate local use. The unit is part of the method's scalar/vector contract. Retain. |
| `uMetersPerSceneUnit`, `uSceneDepthMaxMeters` | 2 | Three.js uniform-map keys paired with GLSL uniforms. They are shader-local scalar bindings, not configuration, request, result, sample, or serialized domain data. Retain. |
| `getUTCMilliseconds`, `getUTCSeconds` | 2 | Standard `Date` methods. False positives outside Algorithm32 naming authority. |
No unit-bearing class field, ambient type property, configuration property,
request property, sample property, descriptor property, or JSON key was found.
The quoted-key and JSON scan reproduces only the two shader uniform-map keys.

## Permitted JavaScript Computational Bindings

These 90 names occur only as local/module variables, parameters, or their
references. They are normalized scalars or vectors and remain permitted:

`altitudeMeters`, `angularRadiusRadians`, `apexAltitudeMeters`,
`atmosphereHeightMeters`, `bottomRadiusMeters`, `cacheAltitudeNodesMeters`,
`cacheBoundaryAltitudeMeters`, `cachePositionNodesMeters`,
`cacheRadialMaximumMeters`, `cacheRadialNodesMeters`,
`cameraGroundRelativePositionMeters`, `cameraPositionMeters`,
`cameraWorldPositionMeters`, `candidateEndDistanceMeters`,
`closestLatitudeDegrees`, `closestLongitudeDegrees`, `cpuSubmitSeconds`,
`defaultValueMeters`, `distanceAlongRayMeters`, `distanceFromSourceMeters`,
`distanceMeters`, `domeCenterMeters`, `domeRadiusMeters`,
`elapsedMilliseconds`, `endDistanceMeters`, `endpointExtentMeters`,
`endpointPositionMeters`, `exactNodeAltitudeMeters`,
`explicitEndDistanceMeters`, `farthestGroundEndpointMeters`,
`geometryPositionMeters`, `groundAnchorMeters`, `groundCenterMeters`,
`groundExtentMeters`, `groundRelativePositionMeters`, `halfExtentMeters`,
`horizonDistanceMeters`, `horizontalOffsetMeters`,
`interpolatedAltitudeMeters`, `intervalLengthFromPreviousMeters`,
`intervalLengthMeters`, `latitudeDegrees`, `longitudeDegrees`,
`lowerAltitudeMeters`, `maxObserverViewRayExtentMeters`,
`maximumDistanceMeters`, `maximumMeters`, `maximumRhoMeters`, `measureMeters`,
`mieScaleHeightMeters`, `minimumDistanceMeters`, `modelPositionMeters`,
`nearNodeOffsetMeters`, `observerAltitudeMeters`, `observerHeightMeters`,
`normalizedRadialDistanceMeters`, `observerPositionMeters`,
`observerRadiusMeters`, `orbitAngleDegrees`,
`originMeters`, `paddedCacheAltitudeNodesMeters`,
`paddedCacheRadialNodesMeters`, `positionMeters`, `previousMeters`,
`radialDistanceMeters`, `radiusMeters`, `rayleighScaleHeightMeters`, `referenceDistanceMeters`,
`requestedEndDistanceMeters`, `requestedLimitMeters`, `rhoMeters`,
`safeDistanceMeters`, `scaleHeightMeters`, `sceneDepthMaxMeters`,
`sceneSkyRayLimitMeters`, `sourceHeightMeters`, `sourceLimitMeters`,
`sourcePositionMeters`, `sourceSubpointMeters`, `sphereRadiusMeters`,
`startDistanceMeters`, `startLongitudeDegrees`, `topAltitudeMeters`,
`topRadiusMeters`, `upperAltitudeMeters`, `valueMeters`, `vectorMeters`,
`wavelengthMicrometers`, `wavelengthNanometers`, and `widthNanometers`.

## Permitted Embedded Shader Bindings

The shader-only portion contains 50 names found inside GLSL source or exact
shader-source expectations. Together with the two uniform-map bridge keys
reviewed above, all 52 are fixed-unit shader-local scalars:

`atmosphereExitMeters`, `boundaryDistanceMeters`,
`cacheWavelengthMicrometers`, `candidateDistanceMeters`, `candidateMeters`,
`candidateRhoMeters`, `clampedDistanceMeters`, `coordinateMeters`,
`curvatureDenominatorMeters`, `decodedTerminationMeters`,
`distanceAlongPathMeters`, `domeDistanceMeters`, `endpointDistanceMeters`,
`fallbackSkyDistanceMeters`, `firstBoundaryMeters`, `firstRhoMeters`,
`groundDistanceMeters`, `groundPositionMeters`, `heightMeters`,
`lastBoundaryMeters`, `lastRhoMeters`, `lowerMeters`, `lowerRhoMeters`,
`nextDistanceMeters`, `nodeAltitudeMeters`, `nodesMeters`, `pathLengthMeters`,
`pathSampleMeasureMeters`, `previousDistanceMeters`, `radialOffsetMeters`,
`radiusAtRadialOffsetMeters`, `sceneTerminationMeters`,
`sceneTerminationMetersFromDepth`, `segmentLengthMeters`,
`selectedBoundaryDistanceMeters`, `selectedDistanceMeters`, `selectedMeters`,
`sourceDistanceMeters`, `startPositionMeters`, `stepMeters`,
`tangentDistanceMeters`, `tgroundPositionMeters`, `topDistanceMeters`,
`transverseDistanceSquaredMeters`, `transverseOffsetMeters`,
`uCameraGroundRelativePositionMeters`, `uCameraWorldPositionMeters`,
`upperMeters`, `uSceneTerminationMeters`, and `zMeters`.

## Step 7.2 Completion

Step 7.2 leaves `color/bruneton/BrunetonColorDisplayModel.js` with the neutral
diagnostic property
`cieTableResolution: {value: 1, units: 'nanometers'}`. Focused contract coverage
asserts that positive current shape.

The migration does not rename normalized JavaScript locals, shader bindings,
conversion/normalization callables, private computational methods, or platform
APIs.
