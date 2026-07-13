/** UTC world anchor used by solar placement and flat-orbit policy. */
type SolarWorldAnchor = Readonly<{
	/** Latitude where the approximate solar center is overhead. */
	readonly latitude: Angle;
	/** Greenwich anchor longitude. */
	readonly longitude: Angle;
	/** Greenwich apparent-solar-noon instant. */
	readonly instant: string;
}>;
