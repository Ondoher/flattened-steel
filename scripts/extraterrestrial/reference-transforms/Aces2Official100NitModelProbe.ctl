// Observe the pinned core's AP0-to-JMh and tone/chroma stages before gamut
// compression. Input is ACES2065-1 from the project wrapper; output is JMh.

import "Lib.Academy.Utilities";
import "Lib.Academy.Tonescale";
import "Lib.Academy.OutputTransform";

const Chromaticities LIMITING_REC709_D65 =
    {
        {0.6400, 0.3300},
        {0.3000, 0.6000},
        {0.1500, 0.0600},
        {0.3127, 0.3290}
    };

const ODTParams STEP5_ODT_PARAMS = init_ODTParams(100., LIMITING_REC709_D65);

void main(
    input varying float rIn,
    input varying float gIn,
    input varying float bIn,
    input varying float aIn,
    output varying float rOut,
    output varying float gOut,
    output varying float bOut,
    output varying float aOut)
{
    float aces[3] = {rIn, gIn, bIn};
    float AP0_clamped[3] = clamp_AP0_to_AP1(
        aces,
        0.,
        STEP5_ODT_PARAMS.ts.forward_limit);
    float inputJMh[3] = RGB_to_JMh(
        AP0_clamped,
        STEP5_ODT_PARAMS.input_params);
    float tonemappedJMh[3] = tonemap_and_compress_fwd(
        inputJMh,
        STEP5_ODT_PARAMS);

    rOut = tonemappedJMh[0];
    gOut = tonemappedJMh[1];
    bOut = tonemappedJMh[2];
    aOut = aIn;
}
