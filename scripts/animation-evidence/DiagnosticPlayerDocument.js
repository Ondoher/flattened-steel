/// <reference path="./types.d.ts" />

/**
 * Call this function to escape caller text for HTML text and attribute contexts.
 * @param {string} value Caller text.
 * @returns {string} Escaped text.
 */
function escapeHtml(value) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

/**
 * Call this function to safely embed JSON inside an HTML script element.
 * @param {unknown} value JSON-compatible value.
 * @returns {string} Script-safe JSON text.
 */
function scriptJson(value) {
	return JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e').replaceAll('&', '\\u0026');
}

/** Standalone diagnostic-player document composition. */
export const DiagnosticPlayerDocument = Object.freeze({
	/**
	 * Call this method to compose a synchronized ideal-versus-trace video diagnostic.
	 * @param {AnimationEvidenceDiagnosticDocumentConfiguration} configuration Player content and evidence.
	 * @returns {string} Complete standalone HTML document.
	 */
	create(configuration) {
		if (!configuration || typeof configuration !== 'object')
			throw new TypeError('Diagnostic configuration is required.');
		if (!Array.isArray(configuration.timeline) || configuration.timeline.length === 0) {
			throw new TypeError('Diagnostic timeline must not be empty.');
		}
		const safeTimeline = scriptJson(configuration.timeline);
		const safeProvenance = scriptJson(configuration.provenance);
		return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(configuration.title)}</title>
<style>html,body{margin:0;background:#101319;color:#eef2f7;font:16px system-ui,sans-serif}main{padding:18px}.note{color:#ffd18a}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.pane{position:relative;background:#000;border:1px solid #4d5968}.pane video{display:block;width:100%;aspect-ratio:16/9;background:#000}.label{position:absolute;left:12px;top:10px;background:#000c;padding:6px 9px;font-weight:700}.overlay{position:absolute;left:12px;right:12px;bottom:12px;background:#07101be6;padding:8px 10px;font:14px ui-monospace,monospace;white-space:pre-wrap}.controls{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;margin:14px 0}.timeline{height:26px;background:#202733;position:relative}.mark{position:absolute;top:0;width:2px;height:100%;background:#f05}.custom{background:#fc3;height:45%}.readout{display:grid;grid-template-columns:1fr 1fr;gap:14px}.card{background:#171d26;padding:12px;white-space:pre-wrap;font:14px ui-monospace,monospace}button,input{font:inherit}input{width:100%}</style></head>
<body><main><h1>${escapeHtml(configuration.title)}</h1><p>${escapeHtml(configuration.subtitle)}</p><p class="note">${escapeHtml(configuration.disclosure)}</p>
<div class="grid"><div class="pane"><video id="ideal" muted preload="auto" src="${escapeHtml(configuration.idealVideoUrl)}"></video><span class="label">Ideal cadence</span><span id="idealOverlay" class="overlay"></span></div><div class="pane"><video id="trace" muted preload="auto" src="${escapeHtml(configuration.traceVideoUrl)}"></video><span class="label">Measured trace replay</span><span id="traceOverlay" class="overlay"></span></div></div>
<div class="controls"><button id="play" type="button">Play / pause</button><input id="seek" type="range" min="0" max="${configuration.timeline.length - 1}" step="1" value="0"><output id="time">0.000 s</output></div>
<div id="timeline" class="timeline" aria-label="Presentation-slot diagnostic markers"></div><div class="readout"><div id="details" class="card"></div><div class="card">Legend\nmagenta = held presentation slot\nyellow = caller-defined marker\n\nProvenance\n<span id="provenance"></span></div></div>
<script>const records=${safeTimeline};const provenance=${safeProvenance};const ideal=document.querySelector('#ideal');const trace=document.querySelector('#trace');const seek=document.querySelector('#seek');const time=document.querySelector('#time');const details=document.querySelector('#details');const idealOverlay=document.querySelector('#idealOverlay');const traceOverlay=document.querySelector('#traceOverlay');const timeline=document.querySelector('#timeline');const last=Math.max(1,records.length-1);for(const record of records){for(const marker of record.markers){const node=document.createElement('i');node.className=marker==='held-presentation-slot'?'mark':'mark custom';node.style.left=(100*record.slotIndex/last)+'%';node.title=marker;timeline.append(node)}}function show(index){const record=records[index];seek.value=String(index);const seconds=record.timestampMicroseconds/1e6;time.value=seconds.toFixed(3)+' s';idealOverlay.textContent='slot '+record.slotIndex+' · '+seconds.toFixed(3)+' s';traceOverlay.textContent='source '+record.sourceFrameId+(record.heldFromPreviousSlot?' · HELD':'');details.textContent=JSON.stringify(record,null,2)}function synchronize(index){const seconds=records[index].timestampMicroseconds/1e6;ideal.currentTime=seconds;trace.currentTime=seconds;show(index)}seek.addEventListener('input',()=>synchronize(Number(seek.value)));document.querySelector('#play').addEventListener('click',async()=>{if(ideal.paused){trace.currentTime=ideal.currentTime;await Promise.all([ideal.play(),trace.play()])}else{ideal.pause();trace.pause()}});ideal.addEventListener('timeupdate',()=>show(Math.min(last,Math.round(ideal.currentTime*1e6*last/records[last].timestampMicroseconds))));document.querySelector('#provenance').textContent=JSON.stringify(provenance,null,2);show(0)</script></main></body></html>`;
	},
});
