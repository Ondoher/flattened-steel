# Standard Base-control Integration Assessment

Status: supporting assessment for the [MUI migration plan](mui-migration-plan.md).
M1 has installed the selected catalog and dependencies under the subsequent
independent-execution authorization. The
[execution record](mui-migration-execution.md) owns installation, narrow
adaptations and verification. This assessment retains the source inventory
and integration responsibilities.

## Maintained Source and Installation Boundary

Create-app and initialize-project share the same maintained ComponentAssets
catalog. Selection depends on base components, localization and testing.
Flat's selected capabilities require all four catalog groups:

| Group       | Paths | Contents                                                     |
| ----------- | ----: | ------------------------------------------------------------ |
| testing     |     1 | TestHarness implementation                                   |
| baseTesting |     1 | TestHarness behavioral spec                                  |
| base        |    24 | Nonlocalized components, text helper, declarations and specs |
| localized   |     5 | BaseText/Text, declarations and text spec                    |

The 31 selected paths contain 12 JSX component implementations, 12 declarations,
five behavioral spec files, the text-resolution helper and TestHarness.
At baseline, thirty paths were absent under `src/flat/`; M1 copied them.
`testing/TestHarness.js` already existed and was retained. This is the catalog inventory, not the
complete supporting-integration change count.

The engine copies catalog source bytes with their application-relative paths
and preserves imports. It does not synthesize a different implementation.
The new-app apply workflow rejects an existing application slug and existing
output paths. Installing into Flat therefore requires a focused retrofit using
the maintained assets and generated MUI support as references, rather than
rerunning new-app creation over the current application.

## What Already Fits

- Flat already owns a Polylith browser build, app-specific test entry and Karma
  runner. Component declarations are included by its browser type configuration.
- Its AppContext provides the registry, locale, localization service and both
  feature flags expected by the maintained components.
- Its localization service implements the translate boundary used by the
  shared component text helper. HTML text support's parser dependency is already
  declared.
- App-wide DateField/TimeField and feature code occupy different names from the
  selected component assets; they can remain during foundation integration.
- CSS copying and browser test styles already include component stylesheet
  locations. Generated toolkit mock context/registry modules are not needed.

## Required Integration

**Dependencies and theme.** Add the missing MUI Material, icons, styled-engine
and Emotion packages, preserving repository dependency policy and the existing
React version. Check React-is compatibility with the selected MUI release and
React 18.3.1. Add the standard registry-owned theme service, its declaration and
test. Integrate StyledEngineProvider with CSS layers, ThemeProvider and
CssBaseline into the existing startup path, preserving its activation,
ready/stop behavior and application context. Preserve Flat's dark appearance
and compact control density through the CSS theme layer; the generated neutral
light-first default is a starting template, not Flat's selected appearance.

**Assets and harness.** Copy the complete selected component/helper/declaration
and spec set into matching paths. Reconcile the existing TestHarness rather
than overwriting it. Preserve its current native-event, context and cleanup
behavior while satisfying the maintained harness specs and themed tests.
Keep application services and real context/registry wiring in the generated
app tests; toolkit-only test doubles/resolver configuration stay outside Flat.

**Base-layer control defaults.** After copying, update applicable app-local base
components to use the actual AppContext controlSize/controlVariant fields when
supported caller props are absent. Controls built from a base inherit that
policy automatically; do not repeat it in each concrete control. Preserve
supported explicit overrides and reconcile hard-coded priority/variant defaults
that could mask context. The owner specifically requested this integration
change while retaining wholesale source acceptance for unrelated concerns.
Supplied base size/variant props always win, including over conflicting nested
props. Context supplies defaults only when the corresponding prop is absent.

**Phrases and text contracts.** Merge `common.close: Close` into the current
phrase catalog for BaseDialog. Base controls treat text literally by default;
concrete TextInput/Select/Text localize by default. Existing Flat views often
already supply translated text, so adapters must explicitly preserve that
literal/prelocalized boundary and avoid a second translation attempt.

**Test entry.** Include these five suites in the existing `src/flat/spec.js`:

- `testing/_tests/TestHarnessSpec.js`
- `components/_tests/FormControlsSpec.js`
- `components/_tests/FeedbackSpec.js`
- `components/_tests/BaseDialogSpec.js`
- `components/_tests/BaseTextSpec.js`

Preserve the current browser setup import and all application specs. Verify
portal/popup tests and cleanup against the actual theme and DOM ownership.

**Maintained-source acceptance and standards.** The owner expects the maintained
components to meet the standards and accepts taking them wholesale regardless.
No preliminary local-style or prop-type rewrite is required as a condition of
bringing them over. Earlier observations about JSX and declarations are not a
completed standards review or accepted findings. Keep the remaining integration
work focused on Flat's wiring and concrete build/runtime compatibility.
Add MUI and base-component standards to Flat's applicable folder set and
regenerate the standards guide when adoption is performed. Existing
engineering-review cancellation remains in force.

Promotion of the six repository-local rules is deferred until the Polylith
skills review work is complete. The [topic entry](README.md) records that
follow-up. This assessment does not authorize rule promotion; M0/M1 implementation
authority is recorded in the plan and execution record.

## Verification and Remaining Scope

Integration verification needs client types, the complete Flat browser suite
including the copied suites, normal builds and real application checks. Check
small control dimensions, localization, literal labels, validation, focus,
popup containment and local/discoverable app behavior. Preserve renderer/cache
lifetimes while replacing controls. Current implementation evidence is linked from the execution record. This
assessment itself records source inventory rather than test results.

Installing the base layer does not itself migrate existing feature controls.
That usage conversion follows the foundation integration. The preferred
direction is bottom-up: use MUI controls inside the existing React views, then
migrate non-toolbar settings surfaces after their controls are ready. The
saved plan defers toolbar-container/layout conversion while migrating hosted
controls in place. Root theme/provider
wiring enables that progression without a page-layout replacement. TypeAhead, Toolbar,
Slider and the interactive panel button remain app controls to integrate with
MUI. The [transferred Date reference](../../../transfer/Date.jsx) and its
[adaptation owner](../flat/date-field-adaptation.md) remain the starting point
for Date. The [topic entry](README.md) owns the broader control scope and the
later single-line Flat toolbar direction.
