import {Service} from '@polylith/core';
import express from 'express';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
/**
 * Final server router that serves the deployable application for unmatched routes.
 *
 * @implements {AppRouter}
 */
export class AppRouter extends Service {
	/**
	 * Creates the application router.
	 *
	 * @param {unknown} registry - The owning Polylith registry.
	 */
	constructor(registry) {
		super('app-router', registry);
		this.implement(['ready', 'routes']);
	}
	/** Call this method to register the router as the final route owner. */
	ready() {
		this.registry.subscribe('routers').setLast('app-router');
	}
	/**
	 * Call this method to install static assets and the application catch-all route.
	 *
	 * @param {unknown} _app - The Polylith Express application.
	 * @param {unknown} router - The server router.
	 * @param {FlatServerApplication} application - Polylith's effective deployment metadata.
	 */
	routes(_app, router, application) {
		let indexFile = application.getIndexFile();
		let base = `${application.getRouterRoot().replace(/\/$/, '')}/`;
		router.use(express.static(path.dirname(indexFile), {index: false}));
		router.get('*', async (request, response, next) => {
			if (request.path === '/api' || request.path.startsWith('/api/')) return next();
			try {
				let document = await readFile(indexFile, 'utf8');
				let escapedBase = base.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
				response.type('html').send(document.replace('<base href="./" />', `<base href="${escapedBase}" />`));
			} catch (error) {
				next(error);
			}
		});
	}
}
new AppRouter();
