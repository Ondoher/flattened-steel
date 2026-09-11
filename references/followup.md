# Project Reference Follow-up

Status: current project-wide citation and research follow-up. This document
indexes researched facts, source leads, unresearched facts, claim boundaries,
and unresolved reference work across the repository. It is not a citation
authority; accepted external references belong in [references.md](references.md)
and official experiment evidence belongs in [experiments.md](experiments.md).

## Color Reset Research Register

This section is the sole detailed ledger for Color Reset research status,
evidence boundaries, source/provenance work, experiment registration work,
open questions, and investigation order. Production
[MVP requirement M3](../agents/topics/production-app/mvp/requirements.md#m3--color-reset-scientific-authority)
owns the first-MVP completion gate for these rows and their C5 license and
redistribution decisions. Moving C4 and C5 changes scheduling only and does not
accept, remove, or weaken any row or authorize public redistribution.

### Color Reset Researched Facts

These source-backed facts are already researched at the stated boundary. Their
canonical formulas, values, and citations remain in
[algorithm32-working-facts.md](algorithm32-working-facts.md); this section
collects their Color Reset relevance beside the unresolved inventory below.

| Researched fact | Canonical authority | Boundary not established by that authority |
| --- | --- | --- |
| Irradiance integrates incident radiance over cosine-projected solid angle, and a planar receiver applies the incidence cosine. | `FACT-A32-003024`; AMA bibliography entry `[8]` | This does not establish the center-direction approximation error for a partially horizon-clipped extended solar disk or convergence of the 32-direction receiver quadrature. |
| A Lambertian diffuse reflector uses the constant BRDF `rho/pi`; the corresponding leaving-radiance fixtures reproduce that relationship. | `FACT-A32-003113` and `FACT-A32-003114`; PBRT Diffuse Reflection, bibliography entry `[8]` | The selected `rho=0.18` is a declared neutral test parameter, not a universal material constant. Consumer linkage and official Color experiment promotion remain tracked by SRC-CR-002 and EXP-CR-002. |
| The photopic maximum luminous-efficacy convention uses `683 lm/W`. | `FACT-A32-003004`; CIE TN 002:2014 | This does not authenticate the exact sampled CIE 1931 color-matching table, its Native15 resampling, license, or production consumer provenance required by SRC-CR-001. |
| The project’s XYZ-to-linear-sRGB transform and standard sRGB transfer have external colorimetric definitions. | `FACT-A32-003006` and `FACT-A32-003012`; ICC sRGB registry and W3C sRGB transform | These sources do not select the Color Reset gain curve, stellar perceptual filters, or scene-light calibration. |
| Bruneton’s clear-sky comparison defines the retained Figure-1 exponential display mapping, including `K = 1 / (5 * 683)`. | `FACT-A32-003007`; pinned Bruneton clear-sky implementation and CIE TN 002:2014 | This is authority for the inherited display relationship, not for `slope-078/p9`, receiver-light adaptation, or the inverse Three-light bridge. |

The project-wide canonical bibliography and working-fact register, rather than
production implementation or this summary, remain the authority for these
facts.

### Missing Third-Party Sources Or Canonical Registrations

These rows are the actionable closure ledger for Color Reset facts that still
need external authority or canonical source registration.

| Gap | Fact requiring authority | Increment that introduced the fact | Material already retained | Missing work |
| --- | --- | --- | --- | --- |
| SRC-CR-001 | Native15 photopic projection uses the CIE 1931 2-degree observer and maximum luminous efficacy `683 lm/W` to derive lux. | CR2 | `cr2-available-light-inventory-v1.json` names the observer and constant. | Add the canonical CIE source to the bibliography with exact table/version/locator; identify and hash the sampled color-matching data; record license and the Native15 integration/resampling operation; cite it from the production fixture and source. |
| SRC-CR-002 | The neutral diffuse/direct receiver response uses the Lambertian `rho/pi` relationship. | CR3 | Bibliography entry `[8]` already covers PBRT radiometry; CR3 fixes `rho=0.18` as an experiment parameter. | Confirm the exact PBRT section supports the implemented relationship and cite `[8]` from the promoted fixture/source. No external source is needed to claim `rho=0.18` as a declared neutral test parameter. |
| SRC-CR-003 | Clear-sky twilight receiver light and sky brightness broadly follow the normalized Koomen measurements over their declared valid solar-elevation range. | CR4I, using physical fields acquired in CR4H | The CR4I fixture names Koomen et al., JOSA 42 (1952), pages 353–356, and the Optica locator; extracted trend data are retained in the contained fixture closure. | Add a complete AMA bibliography entry; pin exact pages, tables/figures, extraction values, payload identity, license, and transformation; retain the report-only/non-absolute claim boundary. |
| SRC-CR-004 | Zenith-region UBVRI twilight trends follow the Patat–Ugolnikov–Postylyakov polynomial fits only within solar zenith `95–105` degrees. | CR4I, using physical fields acquired in CR4H | The CR4I fixture records DOI `10.1051/0004-6361:20064992`, the official PDF locator, coefficients, and validity range. | Add the AMA bibliography entry; pin exact equations/table/pages, retained payload hash and license, and coefficient extraction; preserve the non-matched-direction and report-only limits. |
| SRC-CR-005 | The production stellar roster is the 2,000 brightest eligible BSC V/50 records ordered by finite `Vmag` then HR. | CR6B; the earlier 500-member source is exercised in CR6 | The BSC V/50 TSV is retained at `experiments/extraterrestrial/catalogs/bright-star-catalog-v50.tsv`, 556,724 bytes, SHA-256 `d79223194f938533b4a4b7d832249d8661cf7adda088a8a0ec44039d3baab759`. | Add the catalog’s canonical publisher/authors, edition, data date, stable CDS locator, exact table/column meanings, license and redistribution status; document acquisition and parsing; cite the source from the production catalog fixture/data. |
| SRC-CR-006 | The covered 1,993 stellar spectra use the retained Pickles spectral atlas and its declared interpolation/materialization policy. | Coverage reported in CR6B; complete retained packet set established in CR6F | `pickles-v1998/dat.tar.gz`, SHA-256 `d25a74fe853d4b343c56fc936b18ebaf640b4946f5776f0797b66a44890a6130`, plus the contained materialization implementation and packet outputs. | Add the Pickles publication/data-set bibliography entry, version, original locator, wavelength and flux semantics, license, payload provenance, and exact resampling/interpolation equations; cite it from every promoted packet fixture. |
| SRC-CR-007 | Johnson B and V response curves define the catalog-color reconstruction and V-magnitude normalization used by the 2,000-member materializer. | Coverage reported in CR6B; used decisively in CR6F | SVO Johnson B XML SHA-256 `887af6b6164fd2e41c5b17d450286819a4758b83e7a6b89bfe9bad73a28ee197`; Johnson V XML SHA-256 `bbbbef8da2f3d074f2ab12307f6c85320d12e1a3306a27086c4564c227abacc6`. | Register the SVO Filter Profile Service and exact filter-profile identifiers/locators; record download date, response semantics, wavelength units, Vega reference/zero-point authority, licenses, and integration/normalization equations. |
| SRC-CR-008 | Low-light stellar chroma generally contracts toward neutral while rod contribution can alter mesopic color appearance. | CR6D | The closed design links Shin, Yaguchi, and Shioiri (2004), DOI `10.1007/s10043-004-0265-2`, and Cao et al. (2008), PubMed `18561973`. | Add full AMA entries; inspect the papers and cite exact experiments/pages supporting only the bounded qualitative premise. Do not treat them as authority for the project’s `0.65` retention equation or parameter. |
| SRC-CR-009 | Naked-eye stellar color becomes unavailable at a brighter magnitude than stellar detection, with a cited estimate near `V=3`. | CR6D | The closed design links Vollmer (2026), PubMed `41842225`. | Verify publication status, methods, population, viewing conditions, and exact supported threshold; add a full AMA entry and precise locator, or remove the threshold premise if the source does not support it. It does not authorize the selected `V=3.2` transition by itself. |
| SRC-CR-010 | CIE mesopic vision provides a recognized framework, but the project filter is only an approximation and not CIE 191 conformance. | CR6D design boundary; operationalized in CR6E | The closed design links CIE 191:2010. | Add the full standard entry, edition, publisher locator, accessed date, and exact sections supporting the qualitative mesopic boundary; record access/license limitations. Keep the explicit non-conformance claim. |
| SRC-CR-011 | Scotopic stellar luminance uses CIE `V'(lambda)` and `1700 lm/W`. | CR6E | `CIE_sle_scotopic.csv`, 7,218 bytes, SHA-256 `6a75d3fdbcbf5e9e9a07478511933eefeda953f3e2cc14b74459e5a099ec3759`, DOI `10.25039/CIE.DS.gr6w4b5g`. | Add the CIE data-set bibliography entry; pin version, exact DOI locator, wavelength/value semantics, license, and Native15 integration rule. Identify the exact authority and locator for `1700 lm/W` rather than inferring it from the data filename. |
| SRC-CR-012 | The approximation blends across declared adaptation boundaries `0.005–5 cd/m^2`. | CR6E | The CR6E fixture records both endpoints and attributes them broadly to the CIE scotopic/mesopic/photopic boundary. | Locate the exact CIE 191 or other authoritative section supporting these endpoints and the applicable viewing conditions. If the endpoints are project-selected approximation bounds instead, relabel them as such and rely on the official CR6E experiment for their selection. |

### Missing First-Party Official Experiment Authority

These rows require official-experiment promotion, not a paper that
retroactively “proves” an owner-selected display parameter. Multiple contained
runs may be consolidated into fewer standalone official experiments if the new
definitions preserve each input, control, oracle, tolerance, claim, and
non-claim boundary.

| Gap | Fact currently used by the production design | Increment/run that introduced or selected it | Required authority work |
| --- | --- | --- | --- |
| EXP-CR-001 | Direct-normal, direct-horizontal, diffuse-horizontal, and total-horizontal Native15 receiver-light measurement distinguish twilight states without clock or framebuffer input. | CR2, accepted run `000007-available-light-inventory` | Create and register a standalone receiver-light experiment with the quadrature domain, units, basis, analytic relationships, convergence/sensitivity checks, result hashes, and bounded claims. Resolve SRC-CR-001 first. |
| EXP-CR-002 | The selected neutral Lambertian direct/diffuse/additive scene-light relationship preserves the sky outside its geometry mask. | CR3, accepted run `000011-neutral-geometry-ambient-proof` | Register a standalone neutral-scene lighting experiment with independent input packets, material parameter, geometry domain, CPU/GPU boundary, tolerances, and non-claims. Link SRC-CR-002. |
| EXP-CR-003 | `slope-078/p9` is the selected continuous global achromatic twilight response and preserves the qualified daylight/low-Sun envelope. | Candidate family introduced in CR4G run `000033`; selected after CR4H–CR4K review; qualified in CR8 run `000065` | Define one official Color-response experiment covering the equation, receiver input, chronology, preservation envelope, B1 non-participation, candidate selection, exact controls, rejected boundaries, and result hashes. Link SRC-CR-003/004 only for contextual physical trends, not parameter fitting. |
| EXP-CR-004 | Basic Bruneton remains independently selectable, the B1 table/figures remain exact, and unsupported Color selection fails closed. | CR8, accepted run `000065-color-reset-qualification` | Either include this as a distinct implementation/qualification boundary in EXP-CR-003 or register a separate official qualification experiment. Preserve B1 generator/scorer independence and identify the promoted production revision when rerun. |
| EXP-CR-005 | A one-pixel unresolved-star presentation with global `q=24` is the lowest satisfactory tested calibration under the fixed cadence. | CR6C, selected by accepted run `000049-cr6c-one-pixel-brightness-calibration-narrowed` after CR6/CR6A diagnosis | Register a standalone bounded presentation experiment with exact source/transport inputs, viewport, one-pixel proof, calibration bracket, clipping/onset gates, owner-review boundary, and explicit no-arbitrary-display/no-human-threshold claims. |
| EXP-CR-006 | Optional stellar chroma retention `0.65` is the least aggressive sufficient enabled row while disabled physical color remains exact. | CR6D, accepted run `000052-cr6d-toggleable-low-light-stellar-chroma` | Register the exact filter equation, magnitude inputs, identity path, luminance preservation, bracket, owner selection, and nonstellar invariants. Resolve SRC-CR-008/009/010 as qualitative premise sources; do not cite them for `0.65`. |
| EXP-CR-007 | Optional maximum rod contribution `0.5`, ordered before chroma contraction, is the selected bounded mesopic approximation. | CR6E, accepted run `000054-cr6e-toggleable-mesopic-stellar-luminance` | Register adaptation-input construction, CIE integration, signed-RGB behavior, filter order, strength bracket, exact toggle controls, onset requalification, and non-conformance claims. Resolve SRC-CR-010/011/012. |
| EXP-CR-008 | The exact brightest-2,000 BSC roster preserves the production 500-member ordered prefix. | CR6B, accepted run `000047-cr6b-brightest-2000-catalog-proof` | Register catalog identity, parser, eligibility rules, sort/tie policy, complete roster hash, endpoints, prefix comparison, and non-appearance claims. Resolve SRC-CR-005. |
| EXP-CR-009 | All 2,000 members have finite nonnegative Native15 packets with an exact `1,993/7` retained/proxy partition and declared photometric reconstruction accuracy. | CR6F, accepted run `000055-cr6f-brightest-2000-spectral-materialization` | Register every source payload and transformation, the seven proxy applicability limits, units, wavelength semantics, packet hash, reconstruction oracle/tolerance, and non-claims. Resolve SRC-CR-005/006/007. |
| EXP-CR-010 | The 2,000-member WebGL2 package fits the declared 152,000-byte representation and reproduces selected float32 shader readbacks. | CR6G, accepted run `000057-cr6g-brightest-2000-runtime-capacity` | Register the exact input packet identities, layout, resource limit, browser/backend identity, readback domain, build timing claim boundary, and result hashes. A new production recast must still receive its own focused CPU/GPU conformance evidence. |
| EXP-CR-011 | The accepted sky, neutral scene lighting, one-pixel stars, and optional human-vision chain remain credible together for the selected cadence. | CR7, accepted run `000062-integrated-color-reset-sequence` | Register an integrated appearance experiment only after its component authorities exist. Preserve the owner-review role, static-scene scope, 500-star parent boundary, and all non-claims. The production 2,000-star sequence requires a new result rather than relabeling CR7. |
| EXP-CR-012 | The extra 1,500 catalog members increase occupied pixels but do not become two-code robust under `q=24`; this does not invalidate roster, spectra, or capacity. | CR6H, rejected appearance run `000058-cr6h-brightest-2000-appearance` | Retain this as registered negative evidence or as an adverse case within the future 2,000-star production appearance experiment. Preserve the failed robust-added-member gate and transport-surrogate limitation. |

### Facts That Do Not Need A New External Source

These are engineering or owner-selected boundaries. They still need production
tests or official experiment registration where listed above, but searching
for a third-party publication is not the missing step:

- `slope-078/p9` equation and parameter selection;
- `q=24` one-pixel presentation calibration;
- chroma retention `0.65`;
- maximum rod contribution `0.5`;
- the exact filter order and registry identifiers;
- the 152,000-byte package layout and selected GPU readback indices;
- fail-closed selector behavior and atomic lifecycle policy; and
- San Jose as the fixed summer review geometry rather than a light-pollution
  model.

### Color Reset Unresearched Facts

The following statements are research premises or unresolved claims, not
established production-design facts. The linked
Color research-action rows above own the specific source and official-
experiment work needed to retain, narrow, or remove them.

| Unresearched premise or fact | Owning gaps | Current claim boundary |
| --- | --- | --- |
| Rod contribution can shift relative apparent stellar luminance so blue-green stars may brighten while red stars may dim. | SRC-CR-008, SRC-CR-010, SRC-CR-011; EXP-CR-007 | This is only a qualitative premise for the optional mesopic approximation. It does not authorize maximum rod contribution `0.5`, the blend equation, or a physiological-simulation claim. |
| Perceived stellar chroma generally contracts as adaptation luminance falls. | SRC-CR-008, SRC-CR-010; EXP-CR-006 | This does not authorize chroma retention `0.65`, the selected magnitude transition, or the implemented interpolation. |
| Mesopic behavior may be approximated by a smooth blend of photopic and scotopic response. | SRC-CR-010, SRC-CR-011, SRC-CR-012; EXP-CR-007 | The production filter remains an optional project approximation and does not claim CIE 191 conformance, temporal adaptation, or retinal simulation. |
| Stellar color can become difficult to perceive while the star remains detectable, including the reported threshold near `V=3`. | SRC-CR-008, SRC-CR-009, SRC-CR-010; EXP-CR-006 | The qualitative separation and any threshold require source verification. They do not authorize the selected `V=3.2` transition. |
| CIE 1931 color-matching data and the exact `683 lm/W` convention support the Native15 photopic projection. | SRC-CR-001; EXP-CR-001 | The implementation is engineering-qualified, but the exact data version, resampling, license, and consumer citations are not yet authoritative. |
| CIE scotopic `V'(lambda)` data and the exact `1700 lm/W` convention support the Native15 scotopic projection. | SRC-CR-011; EXP-CR-007 | The local payload is authenticated for execution, but its canonical source semantics, integration rule, license, and the `1700 lm/W` authority remain open. |
| The `0.005–5 cd/m^2` adaptation interval applies to the selected viewing conditions. | SRC-CR-012; EXP-CR-007 | Until researched, these are project-selected approximation bounds rather than externally established limits. |
| Koomen and Patat measurements and fits support the stated twilight trends within their declared domains. | SRC-CR-003, SRC-CR-004; EXP-CR-003 | They are contextual trend comparisons only, not a complete absolute receiver-light authority or parameter fit. |
| The BSC, Pickles, Johnson/SVO, and Vega inputs have the stated identity, semantics, version, license, and redistribution status. | SRC-CR-005, SRC-CR-006, SRC-CR-007; EXP-CR-008, EXP-CR-009 | Local payload authentication does not establish source provenance, scientific adequacy, or redistribution permission. |
| The seven red-member continuum proxies are physically applicable to their catalog members. | SRC-CR-006, SRC-CR-007; EXP-CR-009 | Production records the exact proxy partition, but must not claim physical adequacy until applicability limits are independently established. |
| The integrated brightest-2,000 appearance is credible under the selected cadence. | EXP-CR-011, EXP-CR-012 | Roster, packet, capacity, and engineering qualification remain separate from appearance acceptance; the rejected CR6H result remains adverse evidence. |
| San Jose is representative beyond being a fixed summer review geometry. | EXP-CR-003, EXP-CR-005, EXP-CR-011 | It supplies repeatability only. It is not a light-pollution model and does not establish location-independent response or presentation. |

An existing URL, DOI, retained payload, plausible expectation, or passing
contained run cannot substitute for canonical source registration or the
official-experiment boundary required by these rows.

### Color Reset Research Questions

These questions are retained for later investigation. They do not authorize a
production algorithm change while research is deferred; production continues
to reproduce the selected equations and parameters exactly.

| Question | Introduced by | Why it remains open | Current production handling |
| --- | --- | --- | --- |
| For a partially horizon-clipped extended solar disk, how closely does the selected `directHorizontal = directNormal * max(0, up dot sourceCenter)` approximation reproduce an explicit disk integral? | CR2 / EXP-CR-001 | The contained lane selected the center-direction projection, but did not establish its error near disk-center horizon crossing against a resolved-disk horizontal-irradiance authority. | Preserve the selected formula unchanged. Keep geometry-owned visible-disk support in `directNormal`, publish the center-cosine projection separately, and investigate only in the future receiver-light authority. |
| Is the fixed 32-direction cosine-weighted receiver quadrature converged for the sharpest supported twilight and near-horizon cache gradients? | CR2 / EXP-CR-001 | Analytic constant-radiance and CPU/GPU agreement prove implementation, not convergence for every supported sky field. | Retain the fixed quadrature identity and record it in every measurement; defer alternative-count sensitivity to the standalone receiver-light experiment. |
| What independent source should bound absolute clear-sky total-horizontal illuminance across civil, nautical, and astronomical twilight for the selected atmosphere? | CR4H-CR4I / SRC-CR-003-004 | Koomen and Patat currently support contextual trends with limited domains, not a complete absolute receiver-light authority. | Treat production values as engineering-qualified outputs of the accepted atmosphere and receiver-light algorithm, not externally validated absolute measurements. |
| Under what viewing conditions was `total-horizontal photopic lux / pi` a defensible temporary luminance proxy for the pre-P3 source-luminance-lift Color implementation? | Production P2 transition from CR2 to P3 | Division by pi supplied the temporary unit conversion but was not a physiological adaptation model. | The superseded runtime path is removed. Retain the question only for interpretation of historical P2 evidence; current Color Reset consumes lux directly. |
| Which canonical cache-content identity should supplement runtime object identity when receiver light is compared across processes or persisted evidence runs? | Production P2 | Production cache ownership guarantees exact in-process invalidation, but not every `GpuScatteringCache` exposes one common serializable content identity. | Key live invalidation to profile/model inputs, exact cache object generation, basis, direct packet hashes, diffuse packet hash, and quadrature identity; require a serializable cache-content identity in the future official experiment record. |
| What directional diffuse representation is required to extend the exact CR3 Lambertian response from a horizontal receiver to arbitrary production surface normals? | Production P4 adaptation of CR3 and the [ambient-light design](../agents/topics/production-app/runtime-integration/ambient-light-design.md) | P2 publishes the integrated `diffuseHorizontal` packet, while CR3 evaluated arbitrary normals from a full directional radiance field. One horizontal integral cannot reconstruct that angular distribution. | Keep the Color-free Lambertian evaluator exact when supplied surface-oriented irradiance. Use the selected black-ground upper-hemisphere Three approximation, claim exactness only for the upward horizontal neutral boundary, and defer a directional-field representation and convergence study. |
| How closely does the median photopic luminance of the fixed 32 receiver-hemisphere samples reproduce the contained experiment's median physical unmasked sky-pixel luminance across the supported cadence, fields of view, and DPR values? | Production P7 adaptation of CR6E / EXP-CR-007 | The receiver samples avoid a framebuffer dependency and are deterministic, but agreement with the denser screen statistic has not been quantified. | Use the 32-sample median as the explicit production adaptation approximation, retain its quadrature and receiver-light identities, and defer count/view sensitivity plus framebuffer comparison to the future mesopic authority. |
| What production-owned offline asset adapter should regenerate B1's direct-40 paper profile after distant-Sun runtime recurrence removal? | Production P8 fresh B1 qualification | Ordinary runtime setup correctly requires an exact prebuilt asset, while the existing production offline compiler is fixed to Native15/W27/F68 and cannot emit B1's 40-channel paper-profile cache. | Do not restore runtime recurrence. Retain the CPU paper-profile reference and add a focused offline B1 compiler/asset adapter before claiming fresh GPU B1 qualification. |

### Color Reset Investigation Order

1. Promote or redesign the receiver-light and Color authorities
   (EXP-CR-001–004), including CIE photopic and twilight-reference source gaps.
2. Resolve BSC, Pickles, Johnson, and Vega provenance before distributing
   production-owned 2,000-member data (SRC-CR-005–007; EXP-CR-008–010).
3. Resolve the low-light perception references and exact CIE locators before
   final first-MVP scientific/numerical-authority acceptance of the optional
   filters (SRC-CR-008–012; EXP-CR-006/007).
4. Register the bounded star presentation and negative 2,000-star appearance
   evidence before the integrated production appearance run
   (EXP-CR-005/011/012).

No Color research row is closed merely because a URL, DOI, local file, or
accepted contained run exists. Closure requires canonical registrations and
exact consumer citations under the project reference policy.

## Trapezoidal Path Finding

The catalog contains a suitable, previously overlooked mathematical authority
for the endpoint-trapezoid integration schedule:

- Talvila E, Wiersma M. *Simple derivation of basic quadrature formulas*.
  arXiv:1202.0249. https://arxiv.org/abs/1202.0249.
- The paper states the uniform composite trapezoidal rule in the form
  `deltaS * (0.5 * f_0 + sum(f_i) + 0.5 * f_N)`. This supports a finite
  interval divided into `N` uniform intervals, `N + 1` sample points,
  half-weight endpoints, unit-weight interior points, and sample measure equal
  to interval length times trapezoid weight.
- The source was retained as `SOURCE-EXT-000133` in
  [r0-second-pass.json](catalog-inputs/r0-second-pass.json), but the catalog
  classified it only as a candidate midpoint-family source and did not verify
  its composite-trapezoid formula. Primary-source review resolves that
  formula-level gap.

The paper-facing statement should describe the selected numerical method. A
statement that the production dependency happens to use the method is an
implementation observation and does not itself belong in the paper-facing
facts register.

## Fact-level Source Assessment

| Working fact | Source finding | Required follow-up or claim boundary |
| --- | --- | --- |
| `FACT-A32-000018` | Talvila and Wiersma directly support the uniform composite trapezoidal schedule and weights. Bruneton's pinned implementation supplies published-software precedent for the same schedule. | Rewrite as a numerical-method statement rather than a production observation. Add Talvila and Wiersma to the canonical AMA bibliography before citing it. |
| `FACT-A32-000021` | PBRT supports optical depth and Beer-Lambert transmittance. Talvila and Wiersma support applying trapezoidal quadrature to the segment extinction integral. | Divide attribution between transport physics and numerical quadrature. The selected interval count still requires convergence evidence. |
| `FACT-A32-000035` | PBRT supports `tau = integral(sigma_t ds)` and `T = exp(-tau)`. Talvila and Wiersma support the discrete trapezoidal sum. | Divide attribution as above. Do not treat an implementation sum or passing unit test as physical authority. |
| `FACT-A32-000026` | Gonzalez supports a nearly equal-area spherical Fibonacci lattice and equal point weights. For a full sphere, `4*pi/N` follows by distributing the sphere's `4*pi` solid-angle measure across `N` equal-weight samples. | Limit the claim to the nearly equal-area Fibonacci quadrature family. Verify correspondence of each Algorithm32 direction sequence with the cited construction. Direction-count adequacy and radiative error require convergence evidence. |
| `FACT-A32-000027` | Bruneton's 2016 clear-sky comparison supports an approximate exponential atmospheric-density profile and the comparison profile's 8 km molecular and 1.2 km aerosol scale heights. | Split out `max(0, h)`. Clamping negative altitude to sea-level density is an Algorithm32 boundary policy, not an externally supported atmospheric fact. |
| `FACT-A32-000034` | Bruneton's pinned implementation explicitly sets transmittance to zero when a segment intersects the ground. | State the physical/model result as zero source visibility or transmittance. Positive-infinite optical depth is only Algorithm32's sentinel encoding and should not be presented as atmospheric physics. |
| `FACT-A32-000210` | PBRT supports ray parameterization, ray-plane intersection reasoning, and selection of the nearest positive boundary. | No located external source supports the combined ground, top-atmosphere, observer-dome, request-cap, and source-cap precedence. Keep that precedence as an Algorithm32 Methods/design decision. Any claim of physical adequacy requires a bounded experiment. |

## External Sources Located

### Composite trapezoidal rule

Talvila and Wiersma provide the direct numerical-analysis authority for the
schedule underlying `FACT-A32-000018`, `FACT-A32-000021`, and
`FACT-A32-000035`:

- https://arxiv.org/abs/1202.0249
- Catalog lead: [r0-second-pass.json](catalog-inputs/r0-second-pass.json)

The formula's stated error result assumes the paper's regularity conditions.
It does not select an Algorithm32 interval count or demonstrate convergence of
an atmospheric calculation.

### Spherical Fibonacci quadrature

Gonzalez A. *Measurement of Areas on a Sphere Using Fibonacci and
Latitude-Longitude Lattices*. Mathematical Geosciences. 2009.
doi:10.1007/s11004-009-9257-x. https://arxiv.org/abs/0912.4540.

The reviewed construction and equal-weight locators are recorded for
`SOURCE-EXT-000016` in
[step-032-completion.json](catalog-inputs/step-032-completion.json). The paper
supports the nearly equal-area Fibonacci family; it does not select the
Algorithm32 sample count or establish atmospheric-radiance accuracy.

### Exponential atmosphere profiles

Bruneton E. *A Qualitative and Quantitative Evaluation of 8 Clear Sky
Models*. IEEE Transactions on Visualization and Computer Graphics. 2017.
doi:10.1109/TVCG.2016.2622272. https://arxiv.org/abs/1612.04336.

This source supports approximate exponential molecular density with altitude
and records the selected comparison profile's scale heights. It does not
support extending the profile below the ground by clamping altitude.

### Pinned Bruneton software

AMA reference 12 already identifies Bruneton's pinned precomputed-atmosphere
software. The retained
[functions.glsl](downloads/bruneton-precomputed-atmosphere-34f14e7/functions.glsl)
provides published-software precedent for:

- a uniform endpoint-trapezoid optical-length integral with `500` intervals;
- `N + 1` evaluations with endpoint weight `0.5` and interior weight `1`;
- summing constituent optical lengths and applying exponential
  transmittance; and
- returning zero transmittance for a ground-intersecting segment.

This is strong implementation precedent and Algorithm32 lineage. It does not
replace a numerical-analysis citation, prove that `500` is converged, or make
the Bruneton implementation an independent validation of Algorithm32.

The retained Bruneton comparison implementations also carry older endpoint
averaging precedent in `nishita93.cc` and `nishita96.cc`. The corresponding
Nishita 1993 and 1996 publications are plausible scholarly leads, but their
papers have not been verified as stating the exact discretization used by the
comparison code.

## `poly-gc-react` Lineage

The `poly-gc-react` `atmosflat-019` evidence records attributed exponential
density optical length, trapezoidal integration, and Beer-Lambert
transmittance to Bruneton. It also recorded Gonzalez as the source for the
full-sphere Fibonacci direction family.

Those records used mutable `master` GitHub links and some stale line locators.
Use the pinned Bruneton payload retained in this repository for exact software
citations. The POC and later production implementations share the same
lineage, so they are not independent corroboration of one another.

The older Nishita implementations and the Bruneton/Gonzalez source records
are useful provenance. Project documentation, production code, and historical
tests remain lineage rather than paper authority.

## Interval-count Evidence Boundary

Retained run
`000142-n-order-bruneton-j1-transmittance-interval-diagnostic` found material
differences between 20 and 500 source-transmittance intervals on one frozen
Algorithm32 corpus. Its mapped-500 representation reconstructed its exact-500
comparison within the run's existing gates.

This run is not registered in [experiments.md](experiments.md), so it is not
an official citable experiment. It demonstrates interval sensitivity only. It
does not prove that 500 intervals are converged, physically accurate, or
universally required. Promotion would require a standalone experiment with an
independent convergence oracle and an explicit claim boundary.

## Canonical Follow-up

1. Add Talvila and Wiersma to [references.md](references.md), with the exact
   composite-trapezoid equation or page locator.
2. Add Gonzalez to the canonical bibliography, retaining the reviewed
   construction and equal-weight locators from `SOURCE-EXT-000016`.
3. Add Bruneton's clear-sky comparison paper to the canonical bibliography
   for exponential-density and comparison-profile claims.
4. Reshape the affected working-fact rows so each row owns one paper-worthy
   proposition and separates physical authority, quadrature, and local policy.
5. Check the production distant and local direction generators against the
   cited Gonzalez construction.
6. Define an official convergence experiment for path and source-path
   interval counts if production or paper claims depend on particular counts.
7. Treat flat-domain caps and their precedence as declared Methods/design
   choices unless a future experiment makes and bounds a physical-adequacy
   claim.
