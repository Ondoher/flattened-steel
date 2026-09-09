# Desert ground appearance

The foundation is the spherical geometry's provided ground object. The
observatory adds visible terrain and architecture without replacing that
geometry-owned ground/depth seam.

`DesertReflectance.js` owns an illustrative warm, dry sand spectrum on the
existing Native15 basis. Its broad visible-to-near-infrared rise is informed
by Figure 23, the laboratory Sinai desert sand reflectance plot in the
[NASA-hosted report 19770003673](https://ntrs.nasa.gov/api/citations/19770003673/downloads/19770003673.pdf):
roughly 10% near 400 nm and 50% near 800 nm. Intermediate channel values are
art-directed estimates, not a downloaded laboratory sample, calibrated
digitization, or a claim about the soil at San Jose. San Jose supplies the
astronomical location; the desert observatory is a fictional composition.

The dimensionless channel reflectances, in increasing Native15 wavelength
order from approximately 376 to 814 nm, are:

```text
0.080 0.110 0.160 0.210 0.250 0.290 0.330 0.360
0.390 0.415 0.435 0.455 0.475 0.490 0.505
```

Local ground bounce uses Algorithm32's time-dependent horizontal direct and
diffuse spectral irradiance: `E_ground(lambda) = rho(lambda) *
(E_direct_horizontal(lambda) + E_diffuse_horizontal(lambda))`. A separate
lower-hemisphere light in the cloned lighting adapter represents this
unoccluded, uniform Lambertian-ground approximation. It is not a full local
radiosity solution; terrain/architecture occlusion of the bounce is omitted.

The retained atmosphere caches explicitly use the canonical black-ground
boundary. They remain unchanged. This local spectral ground response does
not claim desert-reflective J2-J4 atmospheric scattering; that would require
new cache construction with the selected ground spectrum. Existing lighting
and production code remain untouched.
