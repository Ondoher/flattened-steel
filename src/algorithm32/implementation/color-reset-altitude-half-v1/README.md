# Altitude half frame display

`color-reset-altitude-half-v1` is the accepted frame-exposure successor to p2.
It preserves the original p2 CPU conversions used by endpoint/scene lighting.
Its separate `displayAdaptationIlluminance(receiverIlluminance, observerHeight)`
operation prepares a synthetic lux control for the frame display, not a physical
measurement. Callers must supply raw facade illuminance multiplied by any
illustrative presentation scale exactly once. Flat callers supply zero height.

The frame shader retains the receiver-lux binding and consumes the distinct
`color.displayAdaptationIlluminance.value` binding. Existing stellar adaptation,
spectra, transport, cache fields and source/scene lighting are unchanged.
Height and illumination controls are versioned fixed values in `consts.js`.
They are empirical display parameters with no caller overrides in this version.

The operation adds a smooth height-weighted lift to the supplied control, then
uses the unchanged p2 gain and Bruneton exponential encoding. Height weight is
zero through10 km and one from40 km, with a cubic smoothstep between. The lift
is11.031121053719228 lux, activates with `1-exp(-illuminance/0.00007870837738151098)`,
and fades by a smoothstep from88.28045178070643 to385 lux. Zero light retains the
night anchor. Inputs above385 lux retain native p2. Negative/invalid physical
quantities are rejected at the public operation; finite supported heights are
not restricted to app presets.

The authorizing derivation and limitations are the completed
[twilight exposure study](../../../../agents/topics/poc-experiments/engineering-studies/twilight-exposure/results.md).
Its70-case result00011-regressions and verification00013-verify are immutable
parents. The adjacent accepted-gain fixture records their identity and values;
no production runtime imports or reads the experiment. The promotion plan lives
under production Product Behavior. Twilight stars still dim and a narrow late
bright limb remains. Full-night stars and lower/Flat response are retained.
