# Localized Date Field Adaptation

Status: design note requested by the owner on 2026-11-05. The simple app-wide
fields and device-local startup defaults are implemented. The owner subsequently
authorized browser-local entry formats and canonical timestamp storage; both
are now implemented.
The transferred control's in-field format adornment is adapted into the generic
FormatHintInput, used by DateField and TimeField over BaseTextInput. Richer
editing and location/time-zone behavior remain design work without an execution
plan.
The owner selected the [Temporal API policy](#selected-time-zone-api) on
2026-11-08 for future time-zone conversion and the
[current user locale](#selected-date-formatting-locale) for date formatting.

The owner requires the date parsing and editing behavior to be based on the
transferred IntlDate. The [selected parser contract](#selected-date-parser)
passes locale and time zone at construction instead of querying the `localize`
service. The current substituted LocalDateTimeFormat parser does not satisfy
that instruction. Implementation remains deferred; adapting the format
adornment did not complete the requested IntlDate adaptation.
Models are exclusively services; pure parsing/formatting/conversion utilities
must not be classified as models. Their current naming/placement is a separate
deferred correction, not a prerequisite for the toolbar implementation plan.

## Reference And Intent

Use the transferred [Date.jsx](../../../transfer/Date.jsx),
[IntlDate.js](../../../transfer/IntlDate.js), and
[date-converter.js](../../../transfer/date-converter.js) as reference material for
a compact, localization-aware date field. The source was written for a different
application; its application-specific dependencies and policies do not define
Flat's design. Preserve the transferred files as reference during adaptation.

For the [component refactor](../component-refactor/README.md), the owner
specifically identified this existing MUI date control as the starting point
to revisit. Its MUI field, format adornment and feedback layout now inform the
shared FormatHintInput. The hint appears at the input's end in an InputAdornment;
feedback uses BaseTextInput's helper-text slot below. DateField and TimeField
remain separate class controls over that general-purpose input. Flat's existing
application context and ownership boundaries replace the source application's
context/data-cache dependencies, and MUI slot properties replace the older
InputProps API.

The useful starting point is a date-value/editing model paired with a thin React
input component. Borrow the interaction and separation of date parts from their
display, adapting the implementation to Flat's existing React/ReMVC boundaries.

## Implemented Simple First Pass

The [Flat entry](README.md#current-scope) owns implementation and verification.
DateField and TimeField are app-wide controlled components under
src/flat/components; shared date/time value helpers and contracts are outside
features as well. Global configuration composes the fields through its own
view/controller and keeps drafts in DateTimeEditorModel. The accepted instant
belongs to the app-wide animation-loop service as one timestamp; main
configuration exposes it through the existing shared capability.

The fields now use the browser's default date order, separators, localized digits,
and 12/24-hour clock convention, with matching hints and parsing. The shared
LocalDateTimeFormat helper derives those conventions from Intl.DateTimeFormat;
UI phrase localization remains independent. Entry uses Gregorian calendar parts
in years 1-9999 and minute-precision clock parts. Midnight and noon normalize
correctly. Valid entry converts through shared LocalDateTime helpers using the
device's local time zone into integer milliseconds since the Unix epoch. Only
that timestamp is accepted/stored by the clock; calendar and clock parts are derived for
editing/display. The configuration facade delegates setTimestamp to animation-loop and emits
['timestamp'] changes. UTC carriers inside LocalDateTimeFormat only preserve
parts during formatting and do not define the entry time zone.

Both drafts must be valid before Use date and time accepts the pair. The current
device-local date/time initializes shared values from one clock snapshot at app
startup with seconds/milliseconds cleared, and accepted edits survive panel close/reopen in memory. Native Date resolution applies at DST gaps/overlaps for now; explicit ambiguity
policy remains deferred by the owner. The components
accept phrase keys, format hints and feedback through explicit props. The shared
input uses application context for localization while BaseTextInput supplies
the selected control defaults. There is no calendar popup or persistence.

The transferred files remain unmodified reference material. Segmented typing,
separator insertion, caret management, live locale-change reconciliation, and
zone-aware conversion remain later adaptation goals. During live animation,
clean fields refresh from the shared clock while unfinished drafts remain intact.

## Behavior To Borrow In Later Adaptation

- Keep year, month, and day values separate from displayed text.
- Present fields in the current locale's order with its appropriate separator.
- Support incomplete input while the user is editing.
- Insert separators and pad completed date segments.
- Split pasted digits according to the active field format.
- Show a compact expected-format hint inside the input (implemented through
  FormatHintInput).
- Normalize the displayed value on blur and preserve a useful caret position
  during formatting.
- Preserve the accepted calendar date when its display locale changes.

These are adaptation goals. Exact normalization, paste handling, and commit
semantics still need definition; the transferred implementation is not an oracle
for every input edge case.

## Responsibilities In Flat

| Owner                               | Purpose                                                                                                                                                                                                               |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Date value utility                  | Represent a complete calendar date using locale-neutral year/month/day values and own calendar validity, including leap years and month lengths.                                                                      |
| IntlDate parser utility             | Parse and format date text using locale and time zone supplied at construction. Own date-segment interpretation and normalization without querying the localize service or registry. |
| Date editing model-service          | Own partial drafts and incomplete/invalid feedback, delegating parsing to the configured IntlDate instance. |
| View and presentation-format helper | Prepare display text and format hints using the current user's locale. Resolve UI phrase feedback through the app's localization contract and relay editing intent to the controller. |
| React date field                    | Render compact MUI controls, report editing/commit intent, and own DOM selection, caret, focus, and other transient presentation mechanics. Receive presentation through explicit properties and callbacks.           |
| Global configuration controller     | Coordinate date editing and acceptance through the configuration owner, without absorbing parsing or calendar rules.                                                                                                  |
| Main configuration model-service    | Expose animation-loop's accepted instant as integer Unix epoch milliseconds; own location. Pages consume its public capability; the editor does not become a second canonical owner.                                  |

Names describe responsibilities, not a required number of files or classes. Value
and editing roles can remain together while they form one coherent model. Use a
shared component/model location when actual or reasonably anticipated consumers
establish reuse; otherwise keep feature-specific editing with global configuration.

The date editor belongs in the existing global configuration contribution. It
does not require a new page or workspace-specific date behavior. The
[configuration architecture](component-service-proposal.md#global-configuration-and-shared-values)
owns how accepted shared values reach consuming features.

## Adaptation Boundaries

The [MUI migration plan](../component-refactor/mui-migration-plan.md) selects
compact MUI presentation, superseding this note's earlier native-HTML direction.
Use the transferred MUI field as a starting point while preserving Flat's
CSS-variable appearance and accepted entry behavior. OnboardingContext,
data-cache, converter registry and birth-date age/year rules remain
application-specific reference details, not selected dependencies or policy.
Use Flat's canonical app context and localization contracts for UI phrases;
the selected date parser receives the current user's locale and the chosen
time zone explicitly. The browser-default entry conventions above describe
the existing first pass.

Keep render side-effect free. Initialization, locale reconciliation, and parent
value updates need explicit lifecycle handling. Define how accepted values flow
back into the field; do not rely only on an initial defaultValue. Any deferred
caret work must have an owned cleanup path. Apply Flat's local JSX, render-helper,
JSDoc, type-declaration, and method-spacing rules when code is authored.

Accepted values and copies must be independent of mutable input drafts. An empty
date must remain empty, and an invalid draft must not silently become today or
replace the previously accepted date. Normalizing on blur does not by itself
decide whether blur commits a value; blur, Enter, and explicit Apply behavior
remain interaction choices.

Correct the observed helper defects during adaptation, including isNan,
getValue's undefined reference, the empty-date check in getLongForm, and shared
mutable values in the copy constructor. The converter's empty/invalid handling
must be redesigned around Flat's eventual value contract.

## Decisions Still Open

- Whether calendars beyond the implemented Gregorian contract are needed.
- Whether entry formats should be independently selectable beyond browser defaults.
- Whether richer blur behavior is desirable beyond retaining drafts until Apply
  or Enter commits the validated pair.
- How a locale change or an external accepted-value update interacts with an
  unfinished draft.
- Paste behavior for separated values, continuous digits, and canonical date
  strings; unsupported forms should not be silently reinterpreted.
- The time basis and time-zone policy when combining date, time, and location.

A calendar date is distinct from an instant. The transferred converter uses
UTC-midnight timestamps for valid dates; Flat instead combines the entered date
and clock time using the device's local time zone for now. A calendar popup,
persistence, and location-zone semantics are not selected by this change.

## Selected Time-Zone API

Owner decision, 2026-11-08: use the Temporal API for time-zone-aware conversion.
Use the native implementation when available and a polyfill when it is not.
Both follow the same Temporal API contract. Localized input formatting/parsing
remains separate from time-zone conversion, and the shared accepted value
remains an epoch-millisecond timestamp.

The specific polyfill package, coordinate-to-zone lookup, offered time bases,
and DST disambiguation policy remain to be selected. Choosing Temporal does
not select a geographic lookup source or resolve those product decisions.
This is a design decision; implementation has not begun.

## Selected Date Formatting Locale

Owner decision, 2026-11-08: format dates using the user's current locale.
Date order, separators and date format hints follow that locale. The selected
location or time zone does not choose the formatting locale; it determines how
the shared instant is interpreted as local calendar/clock values.

A locale change changes date presentation while preserving the accepted
timestamp. Reconciliation of an unfinished entry draft during that change
remains an editing-policy question. The implemented browser-default formatting
described above is the current first pass; this decision governs its adaptation.

## Selected Date Parser

Owner decision, 2026-11-08: adapt the transferred IntlDate as the date parser.
Pass a time zone and locale when creating an instance. IntlDate must use those
explicit inputs instead of subscribing to or querying the `localize` service.
The caller owns obtaining the current user locale and the applicable time zone;
the parser owns interpreting date text with that supplied context.

This keeps parsing independent of registry/service discovery. UI phrases still
use Flat's existing localization service, and time-zone conversion follows the
selected Temporal policy. The exact constructor parameter layout and unfinished
draft reconciliation remain implementation/design details. This records the
parser direction; no parser code has been changed.

Possible extension: add time parsing to IntlDate as well, sharing its explicitly
supplied locale and time zone with date parsing. The owner identified this as a
potential simpler follow-on. Time parsing is not yet committed scope; its
editing, precision and acceptance behavior still need definition.

## Next Design Work: Time Entry And Location Time

The owner supplied no existing time-entry field to adapt. The simple time field
is now implemented alongside the date field. Richer entry behavior and the
clock's location-zone time basis remain follow-on design work; device-local
conversion is the current provisional behavior.

Consider entering the date and time in the chosen location's time zone, rather
than assuming the user's device-local time. These are distinct choices from
locale: locale governs formatting, while the time zone gives the entered clock
values their meaning. The shared setting still applies to both open views.

The design needs to address:

- Supported time-entry format, including 12/24-hour display, any AM/PM editing,
  precision, partial drafts, normalization, validation, and commit behavior.
- Whether location time, user-local time, or UTC is offered, how the active basis
  is made clear, and whether users can change it.
- How a location's time-zone identity is obtained or selected. The current city
  index and accepted location contract contain coordinates and region metadata,
  but no time-zone identifier. Manual-coordinate locations need a defined path
  as well.
- How the selected date participates in time-zone conversion, including clock
  times that are skipped or repeated during daylight-saving transitions.
- Whether changing location preserves the same instant or preserves the entered
  local date and clock time, and what feedback accompanies that change.

Keep the time-entry draft separate from accepted shared configuration, following
the same model/controller/view boundaries as the date field. If location time is
selected, its zone identity and date-dependent conversion need an explicit
contract; a display locale or an unexplained fixed offset is insufficient to
describe that choice. The selected Temporal API policy above supplies the
conversion mechanism. Lookup source, polyfill package, default zone and
instant-versus-wall-clock/DST policies remain open.

## Unified Location Lookup And Optional Override

The owner's proposed flow normalizes city selections to latitude/longitude and
uses the same coordinate-to-zone source as manually entered coordinates. City
names and administrative areas remain descriptive metadata. This keeps one
automatic time-zone authority for either input path without requiring a city
index replacement merely to obtain zones.

An optional time-zone picker could let the user correct an inappropriate lookup
result or choose among multiple candidates. Keep the automatic result and any
explicit user override distinct; the effective zone follows the override when
present. The configuration owner supplies that effective choice to all views.

Show the active named zone and whether it is automatic or manually selected,
with a way to return to automatic selection. Picker presentation, inclusion in
the initial scope, and override lifetime when location changes remain open.
Changing a zone also needs the previously noted instant-versus-clock-time policy.
This records a design option, not an implementation instruction.

## Upstream City Data With Time-Zone Identities

The full GeoNames source behind the cities.json package includes an IANA
time-zone field, as documented in the
[GeoNames export schema](https://download.geonames.org/export/dump/readme.txt).
The installed npm JSON and Flat's current compact index omit that field; this
does not mean the original geographic source lacks it.

A future city-index build could retain the source time-zone identity and stable
GeoNames identifier as source metadata. The current proposed flow above uses
one coordinate lookup for automatic resolution of both city selections and
manual coordinates. A city-record zone does not provide a general geographic
boundary lookup. No dataset replacement is selected.

## Coordinate Lookup Candidate: geo-tz

The owner identified geo-tz as a possible lookup source. Its
[maintainer documentation](https://github.com/evansiroky/node-geo-tz) describes
boundary-based coordinate lookup returning an array of IANA zone identifiers.
It reads packaged data from disk, making it a server-side candidate for Flat;
deployment must retain that runtime data. Multiple zone results need explicit
handling. Its default data combines zones equivalent since 1970; the
comprehensive data product is an option to evaluate for earlier dates.

This could implement the shared automatic coordinate lookup for city selections
and manual coordinates. No package, dataset variant, API, or installation is
selected. The
[PhotoStructure alternative's documentation](https://github.com/photostructure/tz-lookup)
also identifies geo-tz as its accuracy-oriented alternative; this is not an
independent guarantee of geographic correctness.

## Additional Reference: Modmod Date And Time-Zone Code

Read-only investigation on 2026-11-05 found these starting points in the owner's
modmod repository. These are reference sources, not runtime dependencies or a
selected conversion implementation.

- [TzDate.js](/C:/dev/modmod/server/common/TzDate.js) takes an explicit target zone,
  converts timestamps into zone-local date/time parts, identifies local calendar
  dates and day starts, and provides calendar arithmetic/day-range helpers.
  It uses Intl.DateTimeFormat plus custom search and caching, with a logger
  dependency. Its current focus is show/report day calculations.
- [TzDateSpec.js](/C:/dev/modmod/server/common/_tests/TzDateSpec.js) contains useful
  reference cases for positive/negative and half-hour offsets, daylight-saving
  changes, midnight/1 AM transitions, and variable-length days. The suite was
  inspected, not executed during this investigation.
- [localization.js](/C:/dev/modmod/src/common/localization.js) supplies the month
  names, date-order, and separator helpers expected by the transferred date
  field. Its implementation is a reference for the missing formatting context;
  its separator guessing and fallback behavior are not selected for Flat.
- [ShowsHandler.js](/C:/dev/modmod/server/features/shows/ShowsHandler.js) reads a
  configured zone identity and creates TzDate with it. The source application's
  Los Angeles fallback is application policy, not a Flat default.
- [TzDate design notes](/C:/dev/modmod/agents/topics/architecture/tzdate.md) describe
  its existing uses, concerns, and possible refactor directions. Those options
  are modmod discussion, not accepted Flat architecture or current runtime
  compatibility evidence.

The useful distinction is an explicit zone identity plus locale-neutral calendar
values, separate from localized editing. The inspected code does not supply a
city/coordinate-to-zone lookup, a time-entry widget, or a general user-entered
wall-clock-to-instant conversion with an ambiguity policy. Those remain Flat
design work.

One relevant implementation issue was confirmed with an isolated, read-only
probe using a stub logger: makeParts caches the complete result by a 30-minute
timestamp bucket. Two instants at 12:01:02Z and 12:16:17Z returned the first
instant's minutes/seconds on the same instance; a fresh instance returned the
correct second value. This cache behavior must not be carried into precise
time handling. The probe does not establish general time-zone correctness or
replace the source suite's verification.

## Verification Considerations

Later verification should cover explicit locale formats, partial typing,
separator insertion, padding, paste, caret edits, blank and invalid dates, leap
days, supported year boundaries, independent value copies, parent value updates,
locale changes, commit behavior, and cleanup. Browser checks should verify the
compact field inside the existing configuration panel. The simple-pass checks
are recorded by the [Flat entry](README.md#verification). Future date/time checks
should use explicit time zones and cover location changes and ambiguous or
nonexistent local clock times under the eventual selected policy. No implementation or
application checks were run for the original design note; the later simple
implementation has its own verification evidence.
