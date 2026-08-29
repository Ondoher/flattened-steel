# Point-Local Solar-Zenith Scene Cache

This contained successor lane implements the selected distant-Sun cache
contract without modifying the historical observer-projected POC. It stores
one cumulative Native15 scattering-density spectrum at each packed
`(altitude, local solar zenith, outgoing direction)` state.

P0 and P1 freeze the contract and interpolation-closed San Jose inventories.
P2 directly accumulates selected local rows from the actual-point N4 solver.
P3 compiles complete Native15 payloads, P4 consumes the packed point-local
lookup, and P5 renders solar noon and nautical twilight unconditionally.

Accepted immutable runs are `000516`, `000517`, `000519`, `000520`, `000522`,
`000524`, `000525`, `000526`, `000527`, `000528`, `000529`, and `000530`. Runs `000518`, `000521`, and
`000523` are preserved failed operational predecessors. Generated evidence belongs only below
`tmp/extraterrestrial/runs`.

P6.1 rebuilds solar noon with an isolated quadratic, fixed-count 48-node
radial domain and compares it with Native48 under retained, linear, and
chromaticity displays. The gray band survives with nearly unchanged Native15
shape. Run `000527` separates scattering orders and Rayleigh/aerosol
contributions at the dominant near-observer path sample: the pixel is `56.79%`
final-event Mie and `49.07%` higher order, materially above the blue-sky
control. Run `000528` completes the isolated aerosol-loading control: aerosol
changes band
brightness and hue, but the structure survives at zero loading and is then
`77.70%` J1. The resulting isolated variable is the uniform 15-interval camera-path
quadrature, whose first roughly `56.5 km` horizon interval is represented by
one dominant sample.
Run `000529` confirms that diagnosis using the unchanged canonical cache:
correctly weighted quadratic distance spacing turns the band blue at the same
15-sample count, while 30 and 60 intervals converge closely. Run `000530`
qualifies Q30 against uniform-960 sparse integration across solar noon,
nautical twilight, atmosphere exit, ground hit, and object-shortened endpoints;
its worst magnitude/shape errors are `0.927412%` and `0.000764425`. Q30 is the
retained contained candidate, not a production promotion.

Run `000531` begins P7 with four opaque-black, ground-anchored analytic boxes
at `2.5`, `7`, `16`, and `32 km`. The nearest true box intersection replaces
the Geometry endpoint for each covered camera ray, so distance-dependent haze
comes from the ordinary live atmospheric integration. Solar-noon and nautical
Q30/Q60 images are preserved; surface lighting and general mesh coverage
remain outside this first look.

Run `000532` incrementally compiles the four missing scene caches for +10
minutes, sunset, -10 minutes, and -1 hour. Run `000533` combines those with
the accepted +1 hour and solar-noon caches and preserves six object-free Q30
renders. It retains the historical display rule of gamma `0.125` after
geometric sunset and gamma `1` while source-lit. At +10 minutes, that strong
lift makes the otherwise tiny atmospheric radiance before short ground hits
visible in the lower frame; the ground intersection itself remains active.
