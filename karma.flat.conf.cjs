module.exports = function (config) {
	config.set({
		frameworks: ['jasmine'],
		files: ['src/flat/styles/app.css', 'src/flat/features/**/*.css', 'tests/flat/**/*.js'],
		reporters: ['spec'],
		client: {captureConsole: true},
		browsers: ['ChromeHeadless'],
		singleRun: true,
		autoWatch: false,
		restartOnFileChange: false,
	});
};
