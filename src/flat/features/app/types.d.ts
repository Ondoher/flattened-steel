/**
 * Public application presentation capability declared by its owning service.
 */
type AppViewService = import('./views/app.js').AppView;

/**
 * Public application activation capability declared by its owning service.
 */
type AppControllerService = import('./controller.js').AppController;

/**
 * Browser-history intent for primary-view selection.
 * - **"push"** - Add a browser-history entry.
 * - **"replace"** - Replace the current entry for startup selection.
 * - **"none"** - Reconcile without writing history.
 */
type AppHistoryMode = 'push' | 'replace' | 'none';

/**
 * Workspace selection context.
 */
type AppPageOptions = {
	/**
	 * Open view identity; omission selects the primary view.
	 */
	viewId?: string;
	/**
	 * History behavior; secondary-view selection never changes the URL.
	 */
	history?: AppHistoryMode;
};

/**
 * Minimal application presentation surrounding activated feature content.
 */
type AppShellProps = {
	/**
	 * Workspace presentation obtained through its public controller capability.
	 */
	content: React.ReactNode;
};

/**
 * Activated app facts supplied by the controller, without duplicated canonical context.
 */
type AppState = {
	/**
	 * Latest defensive context supplied by the owning context service.
	 */
	context: AppContextValue;
	/**
	 * Activated feature content held for its controller-owned lifetime.
	 */
	content: React.ReactNode;
};

/**
 * App-view projection ready for the root presentation.
 */
type AppPresentationState = {
	/**
	 * Canonical application context projection.
	 */
	context: AppContextValue;
	/**
	 * Concrete presentation chosen by AppView.
	 */
	presentation: React.ReactNode;
};

/**
 * Root component input, explicitly limited to its own presentation capability.
 */
type AppRootProps = {
	/**
	 * Owning app view service.
	 */
	appView: AppViewService;
	/**
	 * Initial disposable projection; owner replacement is keyed by appView identity.
	 */
	initialState: AppPresentationState;
};
