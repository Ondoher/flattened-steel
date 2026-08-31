import {createHash} from 'node:crypto';
import {join} from 'node:path';

import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
	headless: true,
	protocolTimeout: 900_000,
	args: [
		'--enable-gpu',
		'--enable-webgl',
		'--ignore-gpu-blocklist',
		'--use-angle=d3d11',
		'--disable-background-timer-throttling',
		'--window-size=1280,720',
	],
});
const page = await browser.newPage();
await page.setViewport({width: 1280, height: 720, deviceScaleFactor: 1});
const requests = [];
const consoleMessages = [];
page.on('request', (request) => {
	if (request.url().includes('distant-sun')) requests.push(request.url());
});
page.on('console', (message) => consoleMessages.push(`${message.type()}: ${message.text()}`));

const snapshot = async () => {
	const image = await page.screenshot({type: 'png'});
	return {
		...(await page.evaluate(() => {
			const shell = document.querySelector('.flat32-shell');
			const canvas = document.querySelector('#flat32-canvas');
			return {
				shell: shell ? {...shell.dataset} : null,
				canvas: canvas ? {...canvas.dataset} : null,
				error: document.querySelector('#flat32-error')?.textContent ?? '',
			};
		})),
		imageSha256: createHash('sha256').update(image).digest('hex'),
	};
};

try {
	await page.goto('http://localhost:8081/flat32/', {waitUntil: 'networkidle2', timeout: 120_000});
	await page.waitForFunction(() => document.querySelector('.flat32-shell')?.dataset.flat32State === 'ready', {
		timeout: 120_000,
	});
	const before = await snapshot();
	await page.click('#flat32-location-control');
	await page.click('#flat32-location-control');
	await page.click('#flat32-time-basis-control');
	await page.click('button[data-flat32-globe-time="2"]');
	await page.click('button[data-flat32-hour-offset="1"]');
	await page.click('button[data-flat32-hour-offset="1"]');
	await page.waitForFunction(
		(previousZenith) => {
			const shell = document.querySelector('.flat32-shell');
			return (
				shell?.dataset.flat32Time === 'Sunset +2h' &&
				shell.dataset.flat32State === 'ready' &&
				shell.dataset.flat32DistantSunCacheState === 'dark' &&
				shell.dataset.flat32AtmospherePairing === 'spherical/distant' &&
				shell.dataset.flat32SolarZenithDegrees !== previousZenith
			);
		},
		{timeout: 300_000},
		before.shell.flat32SolarZenithDegrees,
	);
	const after = await snapshot();
	const afterImagePath = join(process.cwd(), 'tmp', 'extraterrestrial', `flat32-san-jose-dark-${Date.now()}.png`);
	await page.screenshot({type: 'png', path: afterImagePath});
	process.stdout.write(`${JSON.stringify({before, after, afterImagePath, requests, consoleMessages}, null, 2)}\n`);
} finally {
	await browser.close();
}
