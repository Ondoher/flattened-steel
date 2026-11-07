module.exports = function (config) {
	config.set({
		frameworks: ['jasmine'],
		files: [
			'src/flat/styles/app.css',
			'src/flat/components/**/*.css',
			'src/flat/features/**/*.css',
			{pattern: 'tests/flat/**/*.js', type: 'module'},
		],
		reporters: ['spec'],
		client: {captureConsole: true},
		browsers: ['ChromeHeadless'],
		singleRun: true,
		autoWatch: false,
		restartOnFileChange: false,
	});
};
