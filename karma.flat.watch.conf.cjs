const configureFlat = require('./karma.flat.conf.cjs');

/**
 * Call this function to watch Flat tests using the same application and component styles as the normal lane.
 *
 * @param {object} config - Karma configuration capability.
 */
module.exports = function (config) {
	configureFlat(config);
	config.set({singleRun: false, autoWatch: true, restartOnFileChange: true});
};
