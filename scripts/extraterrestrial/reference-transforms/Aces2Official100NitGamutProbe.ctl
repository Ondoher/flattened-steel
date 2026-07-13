// Exercise the unchanged pinned gamut core directly at its generated hue,
// display-cusp, and reach-table boundaries. Input/output channel order is JMh.

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
    float inputJMh[3] = {rIn, gIn, bIn};
    float outputJMh[3] = gamut_compress_fwd(inputJMh, STEP5_ODT_PARAMS);
    rOut = outputJMh[0];
    gOut = outputJMh[1];
    bOut = outputJMh[2];
    aOut = aIn;
}
