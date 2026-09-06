// Exercise the exact display-encoding branch owned by the pinned ACES core.
// Input is display-linear Rec.709/D65; output is its official continuous
// sRGB-piecewise code value. No rendering transform is applied in this probe.

import "Lib.Academy.Utilities";
import "Lib.Academy.Tonescale";
import "Lib.Academy.OutputTransform";
import "Lib.Academy.DisplayEncoding";

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
    float displayLinear[3] = {rIn, gIn, bIn};
    float codeValues[3] = moncurve_inv_f3(displayLinear, 2.4, 0.055);

    rOut = codeValues[0];
    gOut = codeValues[1];
    bOut = codeValues[2];
    aOut = aIn;
}
