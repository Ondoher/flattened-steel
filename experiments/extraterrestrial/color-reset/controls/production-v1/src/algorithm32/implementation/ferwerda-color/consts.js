/** Fixed display condition accepted by the Ferwerda production port. */
export const FERWERDA_DISPLAY_CONDITION = Object.freeze({
	maximumLuminance: Object.freeze({value: 80, units: 'cd m^-2'}),
	adaptationLuminance: Object.freeze({value: 40, units: 'cd m^-2'}),
});

/** Smallest positive luminance used only to keep log10 defined at exact zero. */
export const FERWERDA_ADAPTATION_EPSILON = 1e-6;

/** E8 native-15 basis responses shared with the unchanged Bruneton comparison. */
export const NATIVE_15_LINEAR_SRGB_BASIS_RESPONSES = Object.freeze([
	Object.freeze([14.749358550069186, -12.461809444307793, 87.0946400969207]),
	Object.freeze([526.2783136675116, -458.55532519841455, 3237.2612774897575]),
	Object.freeze([4860.670464118019, -4772.7836927559265, 39151.920333292415]),
	Object.freeze([-3060.0889637085575, 630.8578131011398, 29358.021601771536]),
	Object.freeze([-13632.173462494251, 13736.143434391024, 4381.701642849098]),
	Object.freeze([-16218.356823408865, 31693.381438654007, -2831.7761080281125]),
	Object.freeze([13090.311666839618, 25900.771554214934, -3445.8601281741517]),
	Object.freeze([50412.333624759995, 5985.729871526668, -1751.5249369399994]),
	Object.freeze([40037.66348377322, -2711.74301170623, -470.97288279674353]),
	Object.freeze([10784.85206753291, -1100.5301263483966, -80.95993013896909]),
	Object.freeze([1404.8097211248464, -151.91580336427623, -9.471889119435332]),
	Object.freeze([162.89272907807108, -17.68227705091523, -1.089886496392673]),
	Object.freeze([17.002541340620876, -1.8456545849604458, -0.1137609522231646]),
	Object.freeze([1.938132985276144, -0.21038756748325607, -0.012967705204170663]),
	Object.freeze([0.21580616718156756, -0.02342611824797461, -0.0014439210507229407]),
]);

export const FERWERDA_ADAPTATION_KINDS = Object.freeze({
	BRIGHTNESS_PROXY: 'receiver-local-brightness-proxy',
	QUALIFIED_STARLIGHT_REFERENCE: 'qualified-starlight-reference',
});
