# Sync Window Design

Status: owner-specified contract. The service-only implementation is complete
under the separately authorized [execution plan](camera-sync-service-plan.md).
Page, UI and production startup integration have not begun. This document owns
behavior; the plan's final report owns implementation and verification evidence.

## Ownership

There is one application-local `camera-sync` service. Pages participate by
registering the name of a service that receives synchronization callbacks.
Pages communicate through `camera-sync` rather than knowing the other page's
implementation.

The service implementation belongs in `src/flat/services/camera-sync.js`.
The [service-only implementation plan](camera-sync-service-plan.md) excludes
page, UI and production startup integration. Its public data types live in
`src/flat/services/types.d.ts`, and its public capability is exported beside
the implementation in `camera-sync.d.ts`.

The service owns participation, remembered controls and synchronization
relationships. Its contract makes no assumptions about a UI, including whether
one exists. It accepts supported requests and reports synchronization changes
through callbacks; consumers decide how to present state and expose actions.

Each participating view has its own registered receiver service,
with an instance-specific name that may incorporate the view number. The
callbacks therefore identify their destination through that service instance;
they do not need an additional view or handle argument.

## Synchronization modes

The mode is a named string union, shared by `sync` and `synced`:

```ts
type CameraSyncMode = 'now' | 'them' | 'both' | 'off';
```

When implemented, this type belongs in an ambient `.d.ts` file.

In this table, A is the caller of `sync` and B is the other participating page.

| Mode | Current camera state sent immediately | Future updates |
| --- | --- | --- |
| `now` | B's current state is sent to A. | Creates no subscription and leaves existing subscriptions intact. |
| `them` | B's current state is sent to A. | A receives updates whenever B's camera changes. |
| `both` | B's current state is sent immediately to A. B already has those settings. | Both pages receive updates when the other camera changes. |
| `off` | No camera synchronization is requested. | Cancels all synchronization, including a `both` relationship. |

The caller always adopts the other page's current settings. `them` and `both`
start with an immediate update, then subscribe for future changes. For `both`,
the service immediately calls `cameraChanged` on the caller with the other
page's current settings. The other page already has those settings and needs
no initial camera update. Both participants receive `synced('both')`, and
subsequent changes flow in either direction. Initial synchronization does not
exchange or swap the two camera states, and does not wait for the next camera
change.

Subscriptions accumulate until `off` cancels them. If A already follows B
through `them`, and B requests `them` to follow A, the reciprocal subscriptions
combine into `both`. A `them` request never downgrades an existing `both`
relationship. `off` is the operation for cancelling synchronization.

### Service transitions

The service defines behavior for every supported mode based on the registered
participants, remembered controls and current subscriptions.

| Existing relationship | Request | Service behavior |
| --- | --- | --- |
| Other participant absent or has not supplied its first camera state | `now`, `them` or `both` | Do nothing; do not create a subscription or queue the request. |
| Any active subscription | `now` | Copy the other page's current settings to the caller and preserve the subscription. |
| `both` | `them` | Copy the other page's current settings to the caller and retain `both`. |
| A follows B through `them` | B requests `them` | B adopts A's current settings; the reciprocal subscriptions become `both`. |
| `both` | `both` | Immediately send the other page's current settings to the caller and retain `both`. |
| Any relationship, including already off | `off` | Leave all synchronization cancelled. |

### Consuming feature's UI policy

The following rules belong to the consuming feature's presentation. They are
not part of the camera-sync service contract.

- Disable `now` while there is a subscription.
- Disable synchronization actions when there is only one open window.
- Do not offer `them` as an action while `both` is active.
- Use `off` to cancel synchronization before choosing a different subscription
  arrangement.

The service does not know which actions a consumer exposes or how requests
originate.

## Camera controls

The initial synchronized settings are camera orientation in the common local
coordinate system and observer elevation in meters. FOV is excluded for now
and can be reconsidered after using the feature. Each view retains its own
aspect ratio.

The types belong in an ambient `.d.ts` file:

```ts
/**
 * Unit quaternion in the shared scene axes: east, up and south, in x/y/z/w order.
 */
type CameraSyncOrientation = readonly [x: number, y: number, z: number, w: number];

/**
 * Requested camera settings shared between participating views.
 */
interface CameraSyncControls {
	/**
	 * Requested orientation relative to the common local scene axes.
	 */
	readonly orientation: CameraSyncOrientation;

	/**
	 * Requested observer elevation above ground in meters.
	 */
	readonly observerHeightMeters: number;
}
```

Updates represent requested controls, including requested elevation while a
scene is preparing. An older preparation completing must not republish old
values as a new camera-control change.

The service retains independent snapshots of the controls, so later mutation
of a page's object cannot silently change its remembered state. When delivering
settings to another participant, it also records that participant's new
requested settings; it does not depend on a callback echo to keep that state
current.

## Possible request metering

Consider metering camera-change delivery through debounce or another
coalescing policy. This is a candidate optimization; no timing interval or
scheduling policy has been selected.

A trailing debounce waits until input pauses, which could leave the other
camera stationary throughout continuous mouse movement. Frame-based or
short-interval coalescing could keep orientation following during movement
while delivering only the latest requested controls. Elevation preparation
may benefit from a different cadence. These alternatives need evaluation in
the application before choosing a policy.

If metering is adopted, the proposed constraints are:

- Keep the most recent requested controls immediately; meter outgoing
  `cameraChanged` deliveries rather than delaying remembered state.
- Preserve the immediate copy made by `now`, `them` and `both`.
- Ensure the final requested settings are delivered after input stops.
- Cancel pending deliveries when synchronization is turned off or the
  associated registration is removed. Old pending work must not overwrite a
  newer immediate synchronization.

Metering would belong to camera-sync and make no assumptions about UI events
or which input device produced an update.

Metering must not wait for an earlier `cameraChanged` promise to finish before
delivering a newer change. Rate scheduling and asynchronous completion are
separate concerns.

## Camera-sync service

### `register(serviceName): handle`

Called when a page wants to participate in synchronization. `serviceName` is
the name of a registered service implementing the callbacks below. The return
value is the handle used in subsequent `update`, `sync` and `unregister` calls.

The camera-sync service is registered during application service setup. Each
page registers its instance-specific receiver early and calls `update` with
its initial controls, without waiting for scene preparation to complete.

### `unregister(hdl)`

Called when a participating page closes or its mounted page instance changes.
It removes the participation record and remembered camera controls, cancels
the associated synchronization, and removes the instance-specific receiver
service from the application registry. Any remaining affected participant is
notified with `synced('off')`.

### `update(hdl, cameraControls: CameraSyncControls)`

Called once to supply initial controls and every time the user changes the
page's camera controls. The service always remembers the most recent camera
controls for each participant and calls the services that are currently
synchronized to that participant.

User control changes always call `cameraSync.update`, whether synchronization
is enabled or disabled. Applying controls received through `cameraChanged`
must not fire a new update message. Programmatic application of received
settings must be distinguished from user interaction, preventing feedback
without requiring a repeated exchange of unchanged settings.

### `sync(hdl, mode: CameraSyncMode)`

Requests synchronization according to the selected mode. `hdl` identifies the
requesting participant. The service begins calling `cameraChanged` on the
appropriate registered service. `now`, `them` and `both` initially supply only
the requesting page with the other page's current camera state. Subscription
behavior follows the mode and transition rules above.

If the other participant is not registered or has not supplied its first
camera state, a `now`, `them` or `both` request does nothing. It produces no
callbacks, creates no subscription, and is not queued for later registration or
initialization. This is a service rule independent of window counts or UI state.

`off` cancels all synchronization, even if `both` was initiated by the other
participant.

## Participating service callbacks

### `synced(mode: CameraSyncMode)`

Called when synchronization has been initiated or cancelled. The receiving
service can use this notification to update presentation, such as an icon
button's state. `off` notifies participants that synchronization is cancelled,
including when the other participant cancels a `both` relationship.
When reciprocal `them` subscriptions combine, both participants are notified
with `synced('both')`.

### `cameraChanged(cameraControls: CameraSyncControls): Promise<Error | void>`

Called when the participating page should update its camera controls because
of synchronization. The page applies the supplied controls through its own
camera implementation without firing a new `cameraSync.update` message.

This callback is asynchronous. Successful completion returns no value. A
participant that cannot apply the requested controls returns an `Error` value
rather than throwing or rejecting the promise for that expected failure.

Calls may overlap. Camera-sync does not wait for a previous call to finish
before invoking `cameraChanged` again, including for the same participant.
An unresolved promise does not block or serialize newer deliveries. Completion
of an older call does not replace the most recent requested controls remembered
by the service. This concurrency policy may be reconsidered later.

For now, camera-sync ignores returned errors. They do not change the active
relationship, restore previous requested controls, or trigger a UI notification.
The remembered controls remain the requested controls.

More informative typed error results, such as `not-ready` or `cancel`, may be
introduced later. They are deferred rather than part of the initial contract.
