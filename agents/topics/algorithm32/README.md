# Algorithm32

Status: current topic router.

Algorithm32 is maintained exclusively in this repository. Its current working
documents are divided by canonical ownership:

- [Algorithm32 standards](standards.md) owns reusable Algorithm32-specific
  conventions and links the current owners while they are consolidated.
- [Completed standards reconciliation](./archive/reconciliation-2026-08-04/README.md)
  preserves the finished work ledger, execution plan, and tracking evidence;
  it is historical rather than active guidance.
- [Archived Algorithm32-Star topic documentation]
  (archive/algorithm32-star/README.md) contains the retired Star-only topic
  records; it is historical context, not active guidance.
- [Production](production/README.md) owns implementation state, sequencing,
  architecture boundaries, and promotion gates.
- [Ground boundary](ground/README.md) owns the active profile-albedo/BRDF
  contract, current implementation surface, and CPU-to-GPU handoff.
- [Scattering cache](cache/README.md) owns recurrence, numerical domains,
  GPU cache construction, lifecycle, and runtime sampling.
- [Validation](validation/README.md) owns external benchmark and qualitative
  whole-output claim boundaries.
- [Preimplementation experiments](experiments/README.md) owns scientific
  questions and standalone evidence promotion.
- [Flat geometry and local sources](flat-local/README.md) owns the planned
  final extension phase.
- [Extraterrestrial sources](../extraterrestrial/README.md) owns visible
  post-atmosphere source transport.
- [Testing](../testing/README.md) owns Jasmine and application-test runner
  boundaries.
- [References](../references/README.md) routes canonical citations, facts,
  downloads, and official experiments.

Every capability is implemented on CPU first and completed on GPU. Production
cache building moves to the GPU; CPU cache construction remains the oracle and
parity surface. Full citation and broad testing hardening follow visible
integration but remain required before release or publication.
