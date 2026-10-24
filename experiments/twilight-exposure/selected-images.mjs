import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer';
import {PNG} from 'pngjs';
import {checked, createRun, identity, releaseBrowserWork} from './io.mjs';

const parent = 'tmp/experiments/twilight-exposure/runs/00011-regressions';
const results = JSON.parse(readFileSync(checked(parent + '/results.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(checked(parent + '/manifest.json'), 'utf8'));
assert.equal(manifest.state, 'accepted');
const sections = [
	{id: 'high', title: '40 km twilight', note: 'The main improvement: less white washout around and below the horizon. A narrow bright limb remains, especially as night exposure returns.', cases: ['sj40000-p30', 'sj40000-p40', 'sj40000-p50', 'sj40000-p60', 'sj40000-p80', 'sj40000-p100']},
	{id: 'middle', title: '25 km independent check', note: 'Fresh intermediate-altitude scenes. The bright band shrinks, but twilight stars become dimmer.', cases: ['sj25000-p50', 'sj25000-p80']},
	{id: 'protected', title: 'Lower elevations and Flat', note: 'The recommended function keeps current exposure through 10 km and in Flat mode. These views are preserved within capture precision.', cases: ['sj5-p50', 'sj5-p80', 'sj10000-p50', 'ug5-flat180']},
	{id: 'anchors', title: 'Daylight and genuine night', note: 'The original daylight response and genuine-night stellar appearance are retained.', cases: ['sj40000-noon', 'sj40000-night']},
];
const selected = sections.flatMap(s => s.cases);
const imageNames = selected.flatMap(id => [id + '-native.png', id + '-altitude-half.png']);
const parents = [identity(parent + '/manifest.json'), identity(parent + '/results.json'), identity('tmp/experiments/twilight-exposure/runs/00013-verify/manifest.json'), ...imageNames.map(n => identity(parent + '/' + n))];
const run = createRun('selected-images', 'Assemble owner-requested recommended exposure images from immutable qualified pixels; no rerendering or color changes', parents);
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
let browser = null;
try {
	const lineage = [];
	for (const name of imageNames) {
		run.progress('copy-image', name, {completed: lineage.length, total: imageNames.length});
		const original = identity(parent + '/' + name), expected = manifest.artifacts.find(a => a.path === original.path);
		assert.deepEqual(original, expected, 'Source image differs from its sealed manifest');
		const bytes = readFileSync(checked(original.path)), image = PNG.sync.read(bytes);
		assert.equal(image.width, 1024); assert.equal(image.height, 576);
		run.write('images/' + name, bytes);
		const derived = identity(run.path + '/images/' + name);
		assert.equal(derived.sha256, original.sha256);
		lineage.push({parent: original, operation: 'byte-for-byte copy', parameters: {colorChanges: false, resampling: false}, result: derived});
	}
	const cards = sections.map(section => `<section id="${section.id}"><header><h2>${section.title}</h2><p>${section.note}</p></header><div class="cards">${section.cases.map(id => {
		const source = results.sources.find(s => s.id === id), row = results.rows.find(r => r.case === id && r.candidate === 'altitude-half');
		assert.ok(source && row);
		const facts = source.facts, height = facts.spec.height, label = height < 1000 ? height + ' m' : height / 1000 + ' km';
		const time = facts.spec.time === 'noon' ? 'Solar noon' : facts.spec.minutes === 180 ? 'Sunset +3 hours' : facts.spec.time.startsWith('flat') ? 'Flat 180' : 'Sunset +' + facts.spec.minutes + ' minutes';
		const title = `${facts.state.locationLabel} · ${label} · ${time}`;
		const band = row.metrics.bandWhiteFraction;
		const metric = band === null ? '' : `<p class="metric">Near-white horizon band: <span>${(100 * row.native.bandWhiteFraction).toFixed(1)}% production → ${(100 * band).toFixed(1)}% recommended</span></p>`;
		return `<article data-height="${height}"><h3>${escape(title)}</h3><p class="context">${facts.spec.mode === 'flat-local' ? 'Flat' : 'Globe'} · ${facts.camera.fov}° vertical FOV · ${escape(facts.state.observation.instant)}</p><div class="pair">${[['native', 'production', 'Current production'], ['altitude-half', 'recommended', 'Recommended prototype']].map(([suffix, kind, caption]) => `<figure data-kind="${kind}"><figcaption>${caption}</figcaption><a href="images/${id}-${suffix}.png" target="_blank" rel="noopener" aria-label="Open full resolution ${escape(title)} ${caption}"><img loading="lazy" width="1024" height="576" src="images/${id}-${suffix}.png" alt="${escape(title)} with ${caption.toLowerCase()}"></a></figure>`).join('')}</div>${metric}</article>`;
	}).join('')}</div></section>`).join('');
	const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Recommended twilight exposure images</title><style>
:root{color-scheme:dark;font-family:system-ui,sans-serif;background:#10151d;color:#e7edf6}*{box-sizing:border-box}body{margin:0}main{max-width:1480px;margin:auto;padding:40px 28px 64px}h1{font-size:clamp(28px,4vw,46px);line-height:1.1;margin:12px 0 18px}h2{font-size:25px;margin:0 0 8px}h3{font-size:17px;margin:0 0 8px}.intro{max-width:850px;line-height:1.6;color:#bdc9da}.badge{font-size:13px;color:#9dd8cc;letter-spacing:.04em}.controls{position:sticky;top:0;z-index:2;display:flex;gap:18px;align-items:center;flex-wrap:wrap;padding:16px 0;background:#10151df5;border-block:1px solid #344151}label{display:flex;gap:10px;align-items:center;font-size:14px}select{font:inherit;background:#202b3a;color:#fff;border:1px solid #687c95;border-radius:6px;padding:8px}a{color:#9cc6ff}nav{display:flex;gap:18px;flex-wrap:wrap;margin:20px 0 32px;font-size:14px}section{scroll-margin-top:100px;margin:36px 0 48px}section>header p{color:#b5c2d3;max-width:900px;line-height:1.5}.cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}article{min-width:0;background:#17202c;border:1px solid #334257;border-radius:10px;padding:16px}.context{font-size:12px;color:#a6b5ca;margin:0 0 14px}.pair{display:grid;grid-template-columns:1fr;gap:16px}figure{margin:0;min-width:0}figcaption{font-size:13px;margin:0 0 7px;color:#d1e1f3}img{display:block;width:100%;height:auto;background:#000;border:1px solid #425068}figure a{display:block}figure a:focus-visible{outline:3px solid #9cc6ff;outline-offset:4px}.metric{font-size:12px;color:#a9b9ce;margin:14px 0 0}.metric span{color:#e0ebf8}body[data-view="recommended"] figure[data-kind="production"],body[data-view="production"] figure[data-kind="recommended"]{display:none}body[data-view="compare"] .cards{grid-template-columns:1fr}body[data-view="compare"] .pair{grid-template-columns:repeat(2,minmax(0,1fr))}[hidden]{display:none!important}footer{border-top:1px solid #344151;padding-top:20px;color:#a9b9ce;font-size:13px;line-height:1.6}@media(max-width:760px){main{padding:26px 14px}.cards,body[data-view="compare"] .pair{grid-template-columns:1fr}.controls{gap:10px}label{flex-wrap:wrap;gap:5px}nav{gap:12px}article{padding:12px}}
</style></head><body data-view="recommended"><main><div class="badge">ALTITUDE HALF · EXPERIMENT PROTOTYPE · PRODUCTION UNCHANGED</div><h1>Recommended twilight exposure images</h1><p class="intro">The recommended curve reduces high-altitude twilight washout while keeping current exposure through 10 km and in Flat mode. Twilight stars are dimmer, and a bright limb remains. Select <strong>Side by side</strong> to compare with production. Click any image for its original 1024 × 576 pixels.</p><div class="controls"><label>Show <select id="view"><option value="recommended">Recommended only</option><option value="compare">Side by side</option><option value="production">Production only</option></select></label><label>Elevation <select id="height"><option value="all">All selected scenes</option><option value="40000">40 km</option><option value="25000">25 km</option><option value="10000">10 km</option><option value="5">5 m</option></select></label></div><nav aria-label="Scene groups">${sections.map(s => `<a href="#${s.id}">${s.title}</a>`).join('')}</nav>${cards}<footer>These are the previously qualified images, copied without pixel changes. Comparisons within each scene share optics, camera, FOV and atmospheric cache; only display response differs. “Sunset” is the app’s surface-reference preset. Near-white percentages cover the registered horizon band, not the whole image. <a href="../../../../../agents/topics/poc-experiments/engineering-studies/twilight-exposure/results.md">Full findings and limitations</a>.</footer></main><script>
const view=document.querySelector('#view'),height=document.querySelector('#height');
view.addEventListener('change',()=>document.body.dataset.view=view.value);
height.addEventListener('change',()=>{document.querySelectorAll('article[data-height]').forEach(card=>card.hidden=height.value!=='all'&&card.dataset.height!==height.value);document.querySelectorAll('section').forEach(section=>section.hidden=!section.querySelector('article:not([hidden])'));});
document.querySelectorAll('nav a').forEach(link=>link.addEventListener('click',()=>{height.value='all';height.dispatchEvent(new Event('change'));}));
</script></body></html>`;
	run.write('index.html', html);
	run.write('derivation.json', {operation: 'Curated selection and byte-identical image copies, with selectable HTML captions; no new scene renders', candidate: results.registry.candidates.find(c => c.id === 'altitude-half'), sections, lineage});
	run.progress('verify-page', 'Checking image loading, comparison control and responsive layout');
	browser = await puppeteer.launch({executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, userDataDir: run.absolute + '/work-browser', args: ['--disable-gpu']});
	const page = await browser.newPage(), errors = []; page.on('pageerror', e => errors.push(String(e)));
	await page.setViewport({width: 1440, height: 1000, deviceScaleFactor: 1});
	await page.goto(pathToFileURL(checked(run.path + '/index.html')).href);
	await page.evaluate(async () => {for (const image of document.images) image.loading = 'eager'; await Promise.all([...document.images].map(i => i.decode()));});
	const imageCount = await page.evaluate(() => [...document.images].filter(i => i.naturalWidth === 1024 && i.naturalHeight === 576).length);
	assert.equal(imageCount, imageNames.length);
	const visibleImages = () => page.evaluate(() => [...document.images].filter(i => i.getBoundingClientRect().width > 0).length);
	assert.equal(await visibleImages(), selected.length);
	run.write('page-preview.png', await page.screenshot());
	await page.select('#view', 'compare'); assert.equal(await visibleImages(), selected.length * 2);
	await page.select('#height', '25000'); assert.equal(await visibleImages(), 4);
	await page.select('#height', 'all'); await page.select('#view', 'recommended');
	await page.setViewport({width: 390, height: 844, deviceScaleFactor: 1});
	const mobile = await page.evaluate(() => ({viewport: innerWidth, width: document.documentElement.scrollWidth}));
	assert.ok(mobile.width <= mobile.viewport, 'Mobile horizontal overflow'); assert.deepEqual(errors, []);
	await browser.close(); browser = null; releaseBrowserWork(run);
	for (const original of parents) assert.deepEqual(identity(original.path), original);
	run.write('verification.json', {accepted: true, cards: selected.length, images: imageCount, recommendedMode: selected.length, compareMode: selected.length * 2, heightFilter25km: 4, mobile, pageErrors: errors, originalPixelHashesPreserved: true});
	run.finish('accepted', {page: run.path + '/index.html', sceneCount: selected.length});
} catch (error) {
	if (browser) await browser.close(); releaseBrowserWork(run);
	run.write('failure.json', {error: String(error)}); run.finish('failed', {error: String(error)}); process.exitCode = 1;
}
