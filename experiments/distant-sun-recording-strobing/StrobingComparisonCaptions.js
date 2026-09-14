/** Fixed provenance captions plus exact per-frame cache states for derived diagnostic movies. */
export class StrobingComparisonCaptions {
	/** @param {string} text @param {number} [y] @returns {string} */
	static label(text, y = 12) {
		if (!/^[a-zA-Z0-9 ._/-]+$/u.test(text)) throw new Error('Unsafe fixed comparison caption.');
		return `drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':text='${text}':fontsize=20:fontcolor=white:x=12:y=${y}:box=1:boxcolor=black@0.65`;
	}

	/** @param {StrobingMeasuredSceneFrame[]} frames @returns {string} */
	static trace(frames) {
		if (frames.length !== 120) throw new Error('Diagnostic caption trace must contain 120 frames.');
		const intervals = [];
		for (let first = 0; first < frames.length;) {
			const scene = frames[first].sharedScene;
			if (typeof scene !== 'string' || !/^\d{1,3}$/u.test(scene))
				throw new Error('Diagnostic scene caption is invalid.');
			let end = first + 1;
			while (end < frames.length && frames[end].sharedScene === scene) end++;
			intervals.push(`${this.label(`Cache scene ${scene}`, 310)}:enable='between(n,${first},${end - 1})'`);
			first = end;
		}
		intervals.push(
			`drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':text='Frame %{n}  clip %{pts\\:hms}':fontsize=17:fontcolor=white:x=12:y=335:box=1:boxcolor=black@0.65`,
		);
		return intervals.join(',');
	}
}
