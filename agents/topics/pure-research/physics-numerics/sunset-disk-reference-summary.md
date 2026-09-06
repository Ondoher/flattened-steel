# Sunset-Disk Reference Summary

Focus: Physical and numerical claim authority.

Related owners: [appearance-review](../../poc-flat32/appearance-review/sunset-disk-reference-summary.md), [color-vision](../color-vision/sunset-disk-reference-summary.md).

## Sources And Lessons

### [Taking Pictures of the Sun](https://lyncean.education/projects/astronomy/solar-photography/)

This is an educational photography account, not a calibrated radiometric study.
It demonstrates that an ordinary exposure turns the Sun into a broad glare patch,
while a strong solar filter reveals the disk but makes the surrounding scene
black. Its sunrise and sunset sequences combine separately exposed and stacked
images. Use it as evidence of the scene's extreme dynamic range, not as a disk,
sky, color, or glare reference.

### [A Novel Automatic White Balance Method for Color Constancy Under Different Color Temperatures](https://ieeexplore.ieee.org/stamp/stamp.jsp?arnumber=9509540)

The linked sunrise-to-sunset figure illustrates changing color temperature and
the effect of white-balance correction. The publication does not establish the
figure as a calibrated measurement sequence with controlled exposure and camera
response. It supports the general expectation that low-Sun illumination becomes
warmer, but its images cannot validate disk visibility, luminance, or disk-to-sky
contrast. The [ResearchGate figure](https://www.researchgate.net/figure/Color-temperature-changes-at-various-times-from-sunrise-to-sunset-a-Original-images_fig1_353781295)
is the same evidence, not an independent source.

### [Realistic Solar Disc Rendering](https://naos-be.zcu.cz/server/api/core/bitstreams/59c50f89-7916-4475-ae3b-dbd0e8d63a8f/content)

This method models a spectral solar disk with limb darkening, layered atmospheric
extinction, aerosol properties, refraction, dispersion, and temperature-dependent
mirages. For a disk ray, it replaces ordinary aerosol extinction with a reduced
`(1 - g)` term because strongly forward-scattered aerosol light remains close to
the apparent source direction. This supports testing whether production's full
Mie extinction makes the disk too dim after a long near-horizon path.

The published approximation must not be copied literally: it reduces total
aerosol extinction, including absorption, although absorbed light cannot remain
in the apparent disk. A defensible test must preserve aerosol absorption and
reduce only the scattering excluded from a defined angular acceptance region.
The paper also uses a simple luminance gamma transform and identifies calibrated
photographic validation and proper HDR tone mapping as future work, so its
rendered pictures are not appearance or luminance oracles.

### _Realistic Rendering and Reconstruction of Astronomical Objects and an Augmented Reality Application for Astronomy_

The user-supplied 2007 Andrei Lintu dissertation contains the preceding solar-disk
method as Chapter 4; it is expanded documentation, not independent confirmation.
It specifies a 35 km layered atmosphere, OPAC climate and humidity aerosol data,
eight wavelengths from 380--720 nm, typically 300--30,000 layers, atmospheric
refraction and dispersion, and the same reduced-aerosol-extinction equation. It
reinforces both the forward-scattering hypothesis and the method's limitations.

### [Influence of color on glare perception revealed when seeing the sun through colored glazing](https://www.nature.com/articles/s41598-025-21737-5.pdf)

This is calibrated evidence about solar glare and HDR capture, but it observes
the Sun through colored glazing rather than validating an unfiltered sunset.
Neutral glazing transmitted about 0.38% or 2.37% while measured mean disk
luminance remained approximately 3.41 or 25.8 million cd/m2, respectively. The
HDR camera required a neutral-density factor of 3134.8 to avoid pixel overflow;
the spectroradiometer used a factor of 755.7 and a 1-degree aperture around the
approximately 0.533-degree disk.

This establishes that the visible Sun is an extreme-HDR source and that display
saturation can erase disk-to-sky contrast even when raw transport is strong. It
also finds color-dependent perceived glare at similar photometric luminance, so
white clipping or generic bloom is not a complete perceptual model. Because the
Sun was filtered and the experiments were not a controlled horizon sequence,
the reported luminances are sanity evidence rather than a sunset oracle.
