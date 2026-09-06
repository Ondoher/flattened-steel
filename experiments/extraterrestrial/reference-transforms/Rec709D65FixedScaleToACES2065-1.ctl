// Contained Step 5.3 input wrapper.
//
// Input is the signed scene-linear Rec.709/D65 coordinate produced by the
// production spectral projection.  The frozen Figure-1 coefficient is applied
// exactly once, then the official ACES utility conversion produces ACES2065-1
// (AP0).  There is deliberately no project-authored clamp.

import "Lib.Academy.Utilities";
import "Lib.Academy.ColorSpaces";

const Chromaticities REC709_D65 =
    {
        {0.6400, 0.3300},
        {0.3000, 0.6000},
        {0.1500, 0.0600},
        {0.3127, 0.3290}
    };

const Chromaticities AP0 =
    {
        {0.73470, 0.26530},
        {0.00000, 1.00000},
        {0.00010, -0.07700},
        {0.32168, 0.33767}
    };

const float FIXED_SCENE_SCALE = 0.00029282576866764276;
const float REC709_D65_TO_AP0[3][3] =
    calculate_rgb_to_rgb_matrix(REC709_D65, AP0);

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
    float sceneRGB[3] = {
        rIn * FIXED_SCENE_SCALE,
        gIn * FIXED_SCENE_SCALE,
        bIn * FIXED_SCENE_SCALE
    };
    float aces2065[3] = mult_f3_f33(sceneRGB, REC709_D65_TO_AP0);

    rOut = aces2065[0];
    gOut = aces2065[1];
    bOut = aces2065[2];
    aOut = aIn;
}
