/** Store one canonical spectral channel before it is assembled into a basis and packet. */
type SpectralChannelConstant = Readonly<{
	/** Identify the channel. */
	name: string;
	/** Store the unit-bearing channel center. */
	wavelength: Wavelength;
	/** Store the unit-bearing top-of-atmosphere source irradiance density. */
	sourceIrradiance: UnitValue<"W m^-2 nm^-1">;
	/** Store the unit-bearing wavelength-bin width. */
	wavelengthBinWidth: Wavelength;
}>;
