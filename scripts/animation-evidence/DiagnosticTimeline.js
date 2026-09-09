/// <reference path="./types.d.ts" />

/** Diagnostic timeline composition for fixed-cadence replay evidence. */
export const DiagnosticTimeline = Object.freeze({
	/**
	 * Call this method to annotate replay slots with hold groups, caller markers, and caller details.
	 * @param {readonly AnimationEvidenceReplayEntry[]} mapping Fixed-cadence replay mapping.
	 * @param {Readonly<{markers?: (entry: AnimationEvidenceReplayEntry) => readonly string[]; details?: (entry: AnimationEvidenceReplayEntry) => Readonly<Record<string, unknown>>}>} [configuration] Caller-owned diagnostic projections.
	 * @returns {readonly AnimationEvidenceDiagnosticEntry[]} Annotated presentation timeline.
	 */
	build(mapping, configuration = {}) {
		if (!Array.isArray(mapping) || mapping.length === 0)
			throw new TypeError('mapping must contain at least one slot.');
		/** @type {{sourceFrameId: string | number; entries: AnimationEvidenceReplayEntry[]}[]} */
		const groups = [];
		for (const entry of mapping) {
			const active = groups.at(-1);
			if (active && active.sourceFrameId === entry.sourceFrameId) active.entries.push(entry);
			else groups.push({sourceFrameId: entry.sourceFrameId, entries: [entry]});
		}
		const groupBySlot = new Map();
		for (const group of groups) {
			for (const [ordinal, entry] of group.entries.entries()) {
				groupBySlot.set(entry.slotIndex, {
					firstSlotIndex: group.entries[0].slotIndex,
					ordinal,
					slotCount: group.entries.length,
				});
			}
		}
		return Object.freeze(
			mapping.map((entry) => {
				const group = groupBySlot.get(entry.slotIndex);
				if (!group) throw new Error(`Missing hold group for slot ${entry.slotIndex}.`);
				const markers = [
					...(entry.heldFromPreviousSlot ? ['held-presentation-slot'] : []),
					...(configuration.markers?.(entry) ?? []),
				];
				return Object.freeze({
					...entry,
					holdGroupFirstSlotIndex: group.firstSlotIndex,
					holdGroupOrdinal: group.ordinal,
					holdGroupSlotCount: group.slotCount,
					markers: Object.freeze([...new Set(markers)]),
					details: Object.freeze({...configuration.details?.(entry)}),
				});
			}),
		);
	},

	/**
	 * Call this method to summarize generic hold and measured-frame-jump annotations.
	 * @param {readonly AnimationEvidenceDiagnosticEntry[]} timeline Annotated timeline.
	 * @returns {Readonly<Record<string, number>>} Diagnostic counts.
	 */
	summarize(timeline) {
		if (!Array.isArray(timeline) || timeline.length === 0) throw new TypeError('timeline must not be empty.');
		return Object.freeze({
			slotCount: timeline.length,
			heldSlotCount: timeline.filter((entry) => entry.heldFromPreviousSlot).length,
			sourceJumpCount: timeline.filter((entry) => (entry.measuredFrameAdvance ?? 0) > 1).length,
			holdGroupCount: timeline.filter((entry) => entry.holdGroupOrdinal === 0 && entry.holdGroupSlotCount > 1)
				.length,
			maximumHoldGroupSlotCount: Math.max(...timeline.map((entry) => entry.holdGroupSlotCount)),
		});
	},
});
