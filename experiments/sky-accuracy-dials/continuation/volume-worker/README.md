# Bounded volume L1 worker pool

`createVolumeWorkerPool(spec, channels, options)` in `pool.mjs` schedules independent
physical rays across one through four Node workers. Every worker calls the existing
volume L1 evaluator with `simpson-expanded-medium` and `outerStrategy: 'global'`.
Numerical budgets, physical components and admission remain unchanged.

```js
const pool = createVolumeWorkerPool(spec, channels, {
	workerCount: 4,
	deadlineEpochMilliseconds,
	guard,
	onComplete: (completedCount, id) => reportProgress(completedCount, id),
});
try {
	const rows = await pool.evaluate(tasks);
} finally {
	await pool.close();
}
```

Each task is `{id, origin, direction}` and each returned row is
`{id, result, elapsedMilliseconds}`. A batch permits zero through 4096 unique ids.
Only one batch may be active; subsequent batches reuse the same workers. The spec
and channels are cloned at creation, and tasks are cloned at batch admission.
Results retain exact caller order despite worker arrival order. The optional
`onComplete(completedCount, id)` callback reports arrival progress, with the count
reset for each batch. It receives no numerical values and must not perform
arrival-order summation.

The main-thread guard runs every 500 milliseconds and on worker messages/errors,
subject to the caller keeping the main event loop responsive. Workers independently
check the shared absolute deadline inside the numerical evaluator. Each worker has
`maxOldGenerationSizeMb: 512`; this bounds its V8 old-generation heap, not total RSS.
Only one task is queued per worker. A guard or callback throw permanently cancels
the pool and rejects its active batch with the exact thrown value after all workers
have joined. Worker errors, unexpected exits and missing results fail explicitly.
No unresolved numerical result is fabricated or silently admitted.

Always await `close()` in `finally`. It is idempotent, cancels an active batch, and
joins every worker even when another worker fails. Any termination failure is
reported separately by `close()` without replacing the original guard error.

The pool and worker do not write files or open external connections. The main
runner owns source and input authentication, immutable evidence, resource ledgers,
progress records, storage bounds and all numerical reductions in caller order.

The focused `proof.mjs` runner reads and verifies immutable pilot `00161`, replays
eight original rays, and compares their full channels and aggregate numerical work
exactly. It additionally compares every non-timing method field with fresh serial
evaluation and checks ordering, pool reuse, input bounds, guard cancellation,
periodic guarding, worker errors, deadlines and close during work. It writes no
files, creates no immutable run, and provides local verification only. Run it with:

```powershell
& 'C:/Users/gande/AppData/Roaming/nvm/v25.4.0/node.exe' 'experiments/sky-accuracy-dials/continuation/volume-worker/proof.mjs'
```
