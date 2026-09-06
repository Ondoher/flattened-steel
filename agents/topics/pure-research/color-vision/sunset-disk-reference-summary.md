# Sunset-Disk Reference Summary

Focus: Colorimetry, perception, adaptation, and camera premises.

Related owners: [appearance-review](../../poc-flat32/appearance-review/sunset-disk-reference-summary.md), [physics-numerics](../physics-numerics/sunset-disk-reference-summary.md).

## Human Visual Adaptation And Solar Appearance

No reviewed source provides a calibrated universal curve for the perceived Sun
disk as a function of solar elevation. The available vision research instead
supports composing three mechanisms: physical atmospheric attenuation, visual
adaptation to the surrounding field, and intraocular glare.

The pupil is only a limited exposure control. Natural-vision measurements report
approximately 2--8 mm pupil diameters, corresponding to about a 16-fold change in
retinal illuminance. Most of the visual system's much larger operating range
comes from photoreceptor and retinal or neural adaptation to background
luminance and contrast:

- [Regulation of pupil size in natural vision across the human lifespan](https://pmc.ncbi.nlm.nih.gov/articles/PMC11295891/)
- [Functional Circuitry of the Retina](https://pmc.ncbi.nlm.nih.gov/articles/PMC5749398/)
- [Adaptation and visual coding](https://pmc.ncbi.nlm.nih.gov/articles/PMC3245980/)

Adaptation is temporally asymmetric and occurs at multiple rates. Much useful
light adaptation can be rapid, while recovery after a strong photopigment bleach
can take substantially longer:

- [Rapid Adaptation of Night Vision](https://pmc.ncbi.nlm.nih.gov/articles/PMC5787096/)
- [Human retinal dark adaptation tracked in vivo with the electroretinogram](https://pmc.ncbi.nlm.nih.gov/articles/PMC9796346/)

A bright source also scatters inside the eye. This retinal straylight creates a
veiling luminance that reduces nearby contrast and produces disability glare; it
is not atmospheric scattering and therefore belongs to a later optical or
perceptual response rather than `pathRadiance`:

- [Glare's causes, consequences, and clinical challenges after a century of ophthalmic study](https://pubmed.ncbi.nlm.nih.gov/22445628/)
- [Effect of corneal light scatter on vision: a review of the literature](https://pmc.ncbi.nlm.nih.gov/articles/PMC4844042/)

The low Sun is not governed by adaptation alone. Its long atmospheric path
attenuates direct irradiance and preferentially removes shorter wavelengths;
aerosol optical thickness and water vapor make the resulting disk brightness and
color strongly condition-dependent. [Direct solar radiation: spectrum and
irradiance derived from sun-photometer
measurements](https://pubmed.ncbi.nlm.nih.gov/20531745/) supports treating this
as physical transport rather than a time-of-day display rule.

These findings support a realistic default in which a high Sun may naturally
overexpose toward white, while an atmospherically attenuated sunrise or sunset
disk becomes resolved and warm only when its transported radiance falls into the
adapted display range. The renderer must not guarantee disk visibility.

Direct solar viewing can damage the retina, and pupil constriction provides
little protection at solar irradiance. Apparent comfort or visibility near the
horizon is not a safety criterion; see [Ocular hazard from viewing the sun
unprotected and through various windows and
filters](https://pubmed.ncbi.nlm.nih.gov/20125678/).
