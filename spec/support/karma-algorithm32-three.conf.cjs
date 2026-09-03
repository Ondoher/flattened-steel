const {readFileSync, writeFileSync} = require('node:fs');
const {resolve} = require('node:path');

function createIndexedTransportSnapshotMiddleware() {
	return function captureIndexedTransportSnapshot(request, response, next) {
		if (request.method !== 'POST' || request.url !== '/a32-indexed-transport-snapshot') return next();
		let body = '';
		request.on('data', (chunk) => (body += chunk));
		request.on('end', () => {
			const fixtureDirectory = resolve(
				__dirname,
				'../../src/algorithm32/implementation/local-sun/cache/fixtures',
			);
			const policy = JSON.parse(
				readFileSync(resolve(fixtureDirectory, 'local-sun-gpu-transport-offload-policy.json'), 'utf8'),
			);
			if (policy.status !== 'unsealed')
				throw new Error('Indexed GPU snapshot capture requires an unsealed policy.');
			writeFileSync(resolve(fixtureDirectory, 'local-sun-gpu-transport-indexed-r32f-v2.json'), `${body}\n`, {
				flag: 'wx',
			});
			response.end('ok');
		});
	};
}
createIndexedTransportSnapshotMiddleware.$inject = [];

/** Resolve production's Node-facing bare Three import in Karma's native-module host. */
function createThreeImportPreprocessor() {
	return function resolveThreeImport(content, _file, done) {
		done(null, content.replace(/from\s+(['"])three\1/gu, "from '/base/node_modules/three/build/three.module.js'"));
	};
}

createThreeImportPreprocessor.$inject = [];

/**
 * Adapt the React feature modules to Karma's native-module browser host.
 *
 * React and ReactDOM are loaded from their browser distributions. The R3F
 * portal and R3F hooks are irrelevant to this lane because it neither mounts
 * children nor invokes the R3F wrapper, so the test host supplies inert
 * behavior at those seams.
 */
function createReactComposerImportPreprocessor() {
	return function resolveReactComposerImports(content, _file, done) {
		done(
			null,
			content
				.replace("import React from 'react';", 'const React = globalThis.React;')
				.replace(
					"import React, {useRef} from 'react';",
					'const React = globalThis.React; const { useRef } = React;',
				)
				.replace(
					"import {createPortal} from '@react-three/fiber';",
					'const createPortal = (children) => children ?? null;',
				)
				.replace(
					"import {useFrame, useThree} from '@react-three/fiber';",
					'const useFrame = () => {}; const useThree = () => ({});',
				)
				.replace(
					"import * as THREE from 'three';",
					"import * as THREE from '/base/node_modules/three/build/three.module.js';",
				)
				.replace(
					"from 'three/examples/jsm/postprocessing/EffectComposer.js'",
					"from '/base/node_modules/three/examples/jsm/postprocessing/EffectComposer.js'",
				)
				.replace(
					"from 'three/examples/jsm/postprocessing/RenderPass.js'",
					"from '/base/node_modules/three/examples/jsm/postprocessing/RenderPass.js'",
				),
		);
	};
}

createReactComposerImportPreprocessor.$inject = [];

/**
 * Allow a durable focused run without committing Jasmine focus markers.
 * Use karma-jasmine's documented grep syntax, including `/pattern/flags`.
 */
const focusedSpecPattern = process.env.ALGORITHM32_THREE_GREP;

module.exports = function configureAlgorithm32ThreeKarma(config) {
	config.set({
		basePath: '../..',
		frameworks: ['jasmine'],
		files: [
			{
				pattern: 'node_modules/three/build/*.js',
				included: false,
				served: true,
				watched: false,
			},
			{
				pattern: 'node_modules/three/examples/jsm/postprocessing/*.js',
				included: false,
				served: true,
				watched: false,
			},
			{
				pattern: 'node_modules/three/examples/jsm/shaders/*.js',
				included: false,
				served: true,
				watched: false,
			},
			{
				pattern: 'node_modules/react/umd/react.development.js',
				included: true,
				served: true,
				watched: false,
			},
			{
				pattern: 'node_modules/react-dom/umd/react-dom.development.js',
				included: true,
				served: true,
				watched: false,
			},
			{
				pattern: 'src/algorithm32/**/fixtures/*.json',
				included: false,
				served: true,
				watched: false,
			},
			{
				pattern: 'src/algorithm32/**/_tests/**/*.browser.js',
				included: true,
				served: true,
				watched: false,
				type: 'module',
			},
			{
				pattern: 'src/algorithm32/**/*.js',
				included: false,
				served: true,
				watched: false,
			},
			{
				pattern: 'src/flat32/Brightest2000StellarCatalogPackageLoader.js',
				included: false,
				served: true,
				watched: false,
			},
			{
				pattern: 'server/flat32/data/brightest-2000-stellar-package-v1/*',
				included: false,
				served: true,
				watched: false,
			},
		],
		exclude: ['src/algorithm32/implementation/local-sun/cache/_tests/local-sun-gpu-transport-baseline.browser.js'],
		plugins: [
			require('karma-jasmine'),
			require('karma-chrome-launcher'),
			require('karma-spec-reporter'),
			{
				'preprocessor:algorithm32ThreeImport': ['factory', createThreeImportPreprocessor],
			},
			{
				'preprocessor:algorithm32ReactComposerImport': ['factory', createReactComposerImportPreprocessor],
			},
			{'middleware:indexedTransportSnapshot': ['factory', createIndexedTransportSnapshotMiddleware]},
		],
		middleware: ['indexedTransportSnapshot'],
		preprocessors: {
			'node_modules/three/examples/jsm/**/*.js': ['algorithm32ThreeImport'],
			'src/algorithm32/implementation/flat-earth/three/FlatGeometrySceneAdapter.js': ['algorithm32ThreeImport'],
			'src/algorithm32/implementation/spherical-earth/three/SphericalGeometrySceneAdapter.js': [
				'algorithm32ThreeImport',
			],
			'src/algorithm32/implementation/flat-earth/three/ExactFlatGroundObject.js': ['algorithm32ThreeImport'],
			'src/algorithm32/implementation/spherical-earth/three/ExactSphereGroundObject.js': [
				'algorithm32ThreeImport',
			],
			'src/algorithm32/implementation/react-three/Algorithm32AtmosphereComposer.js': [
				'algorithm32ReactComposerImport',
			],
			'src/algorithm32/implementation/react-three/Algorithm32R3FAtmosphereComposer.js': [
				'algorithm32ReactComposerImport',
			],
		},
		reporters: ['spec'],
		client: {
			args: focusedSpecPattern ? ['--grep', focusedSpecPattern] : [],
			captureConsole: true,
			jasmine: {
				random: false,
				stopOnSpecFailure: false,
				timeoutInterval: 900000,
			},
		},
		customLaunchers: {
			Algorithm32ChromeHeadless: {
				base: 'ChromeHeadless',
				flags: ['--enable-webgl', '--ignore-gpu-blocklist'],
			},
		},
		browsers: ['Algorithm32ChromeHeadless'],
		browserDisconnectTolerance: 1,
		browserDisconnectTimeout: 180000,
		browserNoActivityTimeout: 900000,
		captureTimeout: 60000,
		concurrency: 1,
		failOnEmptyTestSuite: true,
		autoWatch: false,
		singleRun: true,
		colors: true,
		port: 9877,
	});
};
