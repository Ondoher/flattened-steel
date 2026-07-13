# Extraterrestrial Source Inventory

Status: current source scope and readiness. This is not an experiment result
register or implementation history.

The source roadmap targets one extended Sun, one finite extended Moon, and one
point-source calibration fixture. The first cache capability uses a bounded
additive mechanics roster over spherical/radial geometry:

- one aggregate infinite star-field layer with at least two point members; and
- one distant uniform Sun-disk layer.

The roster establishes cache, transform, additive layering, transport, and
conservation mechanics. It does not establish calibrated Sun, Sirius, or
catalog-star inputs. The Moon is wholly deferred to the
[resolved-Moon follow-up](moon-follow-up.md); later flat, profiled,
mutual-ordering, catalog-scale, planetary, and diffuse classes also require
separate decisions and evidence.

## First Integration Set

| Source | Selected physical boundary | Current readiness | Required evidence or implementation work |
| --- | --- | --- | --- |
| Distant Sun | One static solar field-source definition references the canonical packet that owns disk-integrated spectral irradiance and the selected angular-support/profile contract. A separate evaluated placement state owns the celestial direction and epoch; geometry transforms it. A visible extended disk derives radiance from the canonical radiometry packet without duplicating it. | The packet identity and uniform normalized disk are selected design inputs. Retained CPU runs are promotion candidates, not official calibration evidence; wavelength-dependent limb darkening remains optional research. | Fresh CPU and GPU integration; `EXPERIMENT-A32-XA-002` for extended transport and `EXPERIMENT-A32-XA-003` for calibrated-source closure before a paper/release claim. |
| Globe Moon | The intended later boundary is an observer-specific, oriented finite 3D lunar surface. Geometry will own body placement/orientation, surface coordinates and normals, physical depth/opacity, and Moon-over-star visibility. A lunar radiometry owner will evaluate body-fixed spectral surface data under the canonical Sun before terrestrial atmospheric transport. | Deferred in full. No Moon source, analytic surrogate, finite-body layer, texture, lighting, placement state, or occlusion edge belongs to the active first family. Retained analytic-sphere, LIME, Air-LUSI, ROLO, and external-stash material is follow-up evidence only. | Complete the [resolved-Moon follow-up](moon-follow-up.md), including the cache-factorization decision, objective geometry/orientation cases, spectral surface and solar-lighting contract, renderer depth/mask path, and independent lunar calibration evidence. |
| Sirius | The retained CALSPEC Sirius payload is the intended owner of point spectral irradiance; Rieke/MSX anchors are intended independent absolute-scale checks rather than runtime owners. Sirius is a candidate member of the aggregate star-field layer, not the owner of that layer. | The source choice and externally supported unit conversion are selected design inputs. Its retained payload and historical reductions do not constitute an official calibration; XA3 has not established the applied payload selection, binning, or uncertainty result. The first multi-member mechanics roster may use analytic labeled point packets instead. | `EXPERIMENT-A32-XA-001` for point conservation, `EXPERIMENT-A32-XA-003` for source calibration, then fresh CPU/GPU integration. |

The canonical external citations and retained research-payload disposition are
owned by
[`/references/references.md`](../../../references/references.md). This
inventory names intended roles but does not duplicate hashes, versions,
bibliography text, or manifest/license status. The current fact-by-fact
disposition is in [fact accounting](fact-accounting.md).

## First Cache Layer Mapping

| Layer | Mechanics source role | Claim boundary |
| --- | --- | --- |
| `starField`, `infinite-point-set` | One bounded static member table maps each point source to its transported-irradiance field. The live query packet supplies each exact direction; the consumer retains direction, field result, and identity until visibility/projection complete, then emits one aggregate result. | At least two analytic members prove exact-direction handling, additivity, and aggregate/per-member conservation; no catalog capacity or calibrated Sirius claim. |
| `sun`, `distant-extended` | One uniform distant Sun disk proves direction-resolved transported radiance and pixel-footprint integration. | Mechanics only unless XA3 separately qualifies the canonical Sun packet. |

Both layers belong to one immutable generation and publish, fail, replace, and
dispose atomically. They compose additively and the first family permits no
celestial foreground edges; point members never block one another.

## Later Source Classes

| Source class | Disposition | Decision still required |
| --- | --- | --- |
| Resolved, Sun-lit Moon | Deferred follow-up | Finite shape and body orientation; body-fixed spectral texture/BRDF; live Sun illumination and terminator; terrestrial spectral transport; celestial depth/mask; exact Moon-over-star visibility; cache factorization; and objective orientation, phase, conservation, and lifecycle evidence. See [resolved-Moon follow-up](moon-follow-up.md). |
| Broader catalog stars | Research | Catalog/version, passband and zero point, magnitude system, extinction state, SED family, uncertainty, and apparent-direction accuracy. A visual magnitude must not uniformly scale the solar spectrum. |
| `flat32` synthetic stars | Diagnostic only | A synthetic source becomes physical only when it declares a typed SED and flux. Authored RGB, point size, disk radius, or brightness level is not stellar radiometry. |
| Planets | Deferred | Reflected/emitted spectral model, phase law, finite geometry, and a conservative resolved-to-point transition. |
| Milky Way, zodiacal light, and diffuse external fields | Deferred | Calibrated spectral-radiance map, celestial frame, projection, solid-angle-conservative sampling, catalog-star subtraction, provenance, and license. |
| Human/camera-visible source presentation | Deferred claim layer | Named observer or camera, adaptation/exposure, optics/response, complete local sky background, display luminance/dynamic range, and independent validation. |

Airglow, aurora, local light pollution, and scene reflections are not
extraterrestrial source classes. Sun illumination of the deferred lunar
surface belongs to the Moon radiometry path. Celestial illumination of the
terrestrial atmosphere, ground, or scene remains outside this visible-boundary
phase and requires a separately designed atmospheric light-source and cache
path.

## Ownership Rules

- The canonical Sun packet remains the sole runtime solar owner. Reference
  spectra quantify agreement or uncertainty and do not become shadow packets.
- Once selected, an ephemeris, catalog, or state provider owns its declared
  placement-provider contract and each evaluated placement state in a named
  celestial frame; radiometry providers own source power. The static
  field-source definition and evaluated placement state have separate
  fingerprints. Geometry alone maps the latter through body/geographic state
  into its ground, model, and cache frames. Provider-supplied placement is not
  an ephemeris-accuracy claim without objective qualification. Neither
  provider owns camera response or display.
- A source may be physically integrated before observer visibility is claimed.
- Passing one source class does not promote another. Shared descriptors,
  visibility, and integration machinery may be promoted independently from an
  object-specific calibration.
