/** Fixed display conditioning parameters; lux values are controls, not measured light. */
type ColorResetAltitudeHalfResponse = Readonly<{
	/** Observer height through which the native p2 response is retained. */
	heightStart: Distance;
	/** Observer height at which the accepted correction is fully applied. */
	heightEnd: Distance;
	/** Maximum virtual illumination lift used only for frame display. */
	lift: UnitValue<'lux'>;
	/** Low-light activation preserving the zero-illumination night anchor. */
	activation: UnitValue<'lux'>;
	/** Start of the return to native daylight response. */
	taperStart: UnitValue<'lux'>;
	/** End of the return to native daylight response. */
	taperEnd: UnitValue<'lux'>;
}>;
