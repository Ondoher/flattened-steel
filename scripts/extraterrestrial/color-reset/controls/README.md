# Color Reset Control Snapshots

This directory contains immutable, contained copies of the exact production
runtime closure needed by a color-reset control. The experiment runs these
copies rather than importing `src/algorithm32` or `src/flat32`.

`production-v1/` is the CR0 snapshot. Its manifest records every copied file,
SHA-256 identity, static import edge, and declared package dependency. The CR0
runner compares the snapshot byte-for-byte with the corresponding production
files before rendering and inventories the complete production trees before
and after execution.

Create a new versioned snapshot when the accepted production control changes;
never replace a snapshot used by a terminal run.
