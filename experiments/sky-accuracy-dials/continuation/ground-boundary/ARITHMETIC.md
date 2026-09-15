# Independent selected-ground arithmetic enclosure

This helper covers only the original receiver-local anchored surface, channels0/8, explicit ground coefficients, disabled ozone, S80 and I512 with g=0.7. It prepares all selected coordinate bounds before target outputs exist. Its descriptive packed-sum estimate uses the B0 interval midpoint; interval inclusion, rather than that midpoint, determines the local arithmetic result.

The original samplers default to lowp. The browser therefore queries both fragment LOW_FLOAT and HIGH_FLOAT and requires at least23 precision bits and the declared exponent range. Even on an admitted format, the helper propagates a one-part-in2^23 conversion interval for normal direction, weight and L1 operands; it does not infer exact fetches from the query. Missing or insufficient metadata stops before recurrence work. Subnormal effects are covered separately.

The normative bases are GLSL ES3.00 revision6 sections4.5.1,4.5.2,4.5.4 and8, and OpenGL ES3.0.6 section6.1.12. The first defines operation limits, representable conversions, sampler defaults and returned precision. The latter defines queried numeric precision and range. See the [GLSL specification](https://registry.khronos.org/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf) and [OpenGL ES specification](https://registry.khronos.org/OpenGL/specs/es/3.0/es_spec_3.0.pdf).

Basic highp operations use epsilon=2^-23, allowing one ULP rather than assuming round-to-nearest. Division and inverse-square-root bounds retain an extra rounding-mode margin; exp/exp2 use (4+2|x|) ULP. The CPU interval implementation rounds binary64 bounds outward. Its exp enclosure uses a degree24 Taylor polynomial on x/128 with a Lagrange remainder and seven squarings. CPU sqrt is only a starting estimate: squared outward endpoints independently certify the bracket.

For pow(x,1.5), every computed base interval must lie inside [1/16,4]. Log2 then lies inside [-4,2]; the published log2, multiply and exp2 bounds give a frozen relative allowance below4.42e-6. The exact-real comparison x*sqrt(x) avoids trusting a CPU pow implementation. A different asymmetry parameter is rejected; for example, g=0.8 can make the base too small for this version's domain.

At ground, point and radialAnchorPoint are the same shader value. Their subtraction is exactly zero, so the anchored altitude is zero. Original L1 returns zero for strictly inward local directions before the reflected-ground path runs. Source transmission uses the unchanged stable anchored S80 formula. B0 uses the actual normalized representative-point incidence. The receiver-local phase functions return packed local directions directly; no world-frame phase rotation is silently assumed.

Let A_old and A_new be the nonnegative unmodified upper-hemisphere sums in the old and corrected shaders, and B the added lower-hemisphere sum. All coefficients, phase operands and sampled weights are positive in the checked domain. The frozen maximum term ratio K includes phase/coefficient, direction/weight conversion and L1 conversion variation. Thus A_new/A_old lies in [1/K,K], including the zero-sum case by continuity.

Each product-plus-sum path has at most514 rounding factors, bounded by gamma=514*epsilon/(1-514*epsilon). If Y is the observed nonnegative original shadow, a conservative old/new upper-sum comparison allowance is

    E_shadow = Y * (K * (1+gamma)/(1-gamma) - 1).

For precomputed B in [B_lo,B_hi], the corrected-minus-shadow result must lie inside

    [B_lo - E_shadow - gamma*B_hi - E_subnormal,
     B_hi + E_shadow + gamma*B_hi + E_subnormal].

The old-shadow multiplier is frozen before Y exists and is not fitted to the observed residual. E_subnormal=2^-108 exceeds the combined bounded512-term underflow contributions; the helper requires weighted scattering below1 and K<=1.01. Actual endpoint field values must be finite nonnegative Float32 values below1. These generous operand-range limits are fixed before target execution.

Analytic Rayleigh beta_R*B0/2 and the actual packed I512 Rayleigh discrepancy are kept separate from the Mie weighted half-space sum. Successful local inclusion certifies this selected J2-only arithmetic intervention under its prerequisites; it does not establish a physical quadrature reference, later-order boundary repair, or a Kider improvement.
