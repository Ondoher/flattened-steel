module.exports = function configureFlat32Karma(config) {
	const fullCache = process.env.FLAT32_FULL_ACCEPTANCE === '1';
	const cacheServer = process.env.FLAT32_DISTANT_SUN_CACHE_SERVER_URL;
	const cacheProxies =
		fullCache && cacheServer
			? {
					'/base/dist/flat32/api/distant-sun-scene-cache': `${cacheServer.replace(/\/$/u, '')}/api/distant-sun-scene-cache`,
					'/flat32/scene-caches/': `${cacheServer.replace(/\/$/u, '')}/scene-caches/`,
				}
			: {};
	config.set({
		basePath: '../..',
		frameworks: ['jasmine'],
		files: [
			{
				pattern: 'dist/flat32/**/*',
				included: false,
				served: true,
				watched: false,
			},
			{
				pattern: 'tests/flat32/flat32.js',
				included: true,
				served: true,
				watched: false,
				type: 'module',
			},
		],
		plugins: [require('karma-jasmine'), require('karma-chrome-launcher'), require('karma-spec-reporter')],
		proxies: cacheProxies,
		reporters: ['spec'],
		client: {
			args: fullCache ? ['full-cache'] : ['basic-cache'],
			captureConsole: true,
			jasmine: {
				random: false,
				stopOnSpecFailure: false,
				timeoutInterval: 900000,
			},
		},
		customLaunchers: {
			Flat32ChromeHeadless: {
				base: 'Chrome',
				flags: [
					'--headless=new',
					'--enable-gpu',
					'--enable-webgl',
					'--ignore-gpu-blocklist',
					'--use-angle=d3d11',
					'--force-device-scale-factor=2',
					'--disable-background-timer-throttling',
					'--window-size=1024,768',
				],
			},
		},
		browsers: ['Flat32ChromeHeadless'],
		browserDisconnectTolerance: 0,
		browserDisconnectTimeout: 180000,
		browserNoActivityTimeout: fullCache ? 900000 : 300000,
		captureTimeout: 60000,
		concurrency: 1,
		failOnEmptyTestSuite: true,
		autoWatch: false,
		singleRun: true,
		colors: true,
		port: 9882,
	});
};
