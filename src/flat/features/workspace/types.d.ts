/**
 * Public workspace presentation capability declared by its owning service.
 */
type WorkspaceViewService = import('./views/workspace.js').WorkspaceView;

/**
 * Public workspace composition capability declared by its owning service.
 */
type WorkspaceControllerService = import('./controller.js').WorkspaceController;

/**
 * Public contribution catalog capability declared by its owning service.
 */
type WorkspaceUiContributionsService = import('./services/ui-contributions.js').UiContributionsService;

/**
 * Presentation state exposed by the workspace controller through its view service.
 */
type WorkspaceShellState = {
	/**
	 * Whether the current URL identifies an unknown page.
	 */
	notFound: boolean;
	/**
	 * Independently identified view presentations in workspace order.
	 */
	views: WorkspaceViewport[];
	/**
	 * Ordered defensive page metadata.
	 */
	pages: AppPageRecord[];
	/**
	 * Feature-owned shared toolbar presentation.
	 */
	toolbar: MountedUiContribution[];
	/**
	 * Workspace-owned configuration scope and contributed content.
	 */
	configuration: WorkspaceConfigurationPresentation;
};

/**
 * Stable identity and canonical page selection of one open view.
 */
type WorkspaceViewRecord = {
	/**
	 * Unique identity, never reused after this view closes.
	 */
	id: string;
	/**
	 * Registered page definition, or an empty view.
	 */
	pageId: string | null;
};

/**
 * Canonical configuration surface state shared by its toolbar and panel.
 */
type WorkspaceConfiguration = {
	/**
	 * Whether the nonmodal panel is open.
	 */
	open: boolean;
	/**
	 * Open view identity, or null for workspace-wide settings.
	 */
	target: string | null;
};

/**
 * Defensive model snapshot, excluding scene and React state.
 */
type WorkspaceSnapshot = {
	/**
	 * One primary view and at most one optional view.
	 */
	views: WorkspaceViewRecord[];
	/**
	 * Configuration scope and visibility.
	 */
	configuration: WorkspaceConfiguration;
	/**
	 * Unknown primary URL state.
	 */
	notFound: boolean;
};

/**
 * Fixed workspace presentation extension points.
 * - **"toolbar"** - Shared workspace toolbar content.
 * - **"view-tools"** - Controls owned by one open view.
 * - **"configuration"** - Workspace or view-scoped settings.
 * - **"status"** - Status presentation owned by one open view.
 */
type UiContributionSlot = 'toolbar' | 'view-tools' | 'configuration' | 'status';

/**
 * Feature-owned contribution registration, without executable callbacks.
 */
type UiContributionDefinition = {
	/**
	 * Identity unique within its slot and scope.
	 */
	id: string;
	/**
	 * Service implementing contribution mounting and release.
	 */
	controller: string;
	/**
	 * Intended presentation host.
	 */
	slot: UiContributionSlot;
	/**
	 * Open-view identity; omission or null denotes workspace scope.
	 */
	viewId?: string | null;
	/**
	 * Finite ordering value; defaults to zero.
	 */
	order?: number;
};

/**
 * Catalog metadata with an exact lifetime identity and normalized scope.
 */
type UiContributionRecord = UiContributionDefinition & {
	/**
	 * Exact token, distinct across remove/re-register cycles.
	 */
	registrationId: number;
	/**
	 * Normalized view scope.
	 */
	viewId: string | null;
	/**
	 * Normalized ordering.
	 */
	order: number;
};

/**
 * Controller-owned presentation produced by a feature view service.
 */
type MountedUiContribution = {
	/**
	 * Registration lifetime used as React's stable semantic key.
	 */
	registrationId: number;
	/**
	 * Owner's renderable presentation.
	 */
	component: React.ReactNode;
};

/**
 * Projected state for one view host.
 */
type WorkspaceViewport = WorkspaceViewRecord & {
	/**
	 * Selected metadata, or no definition.
	 */
	page: AppPageRecord | null;
	/**
	 * Renderable page mounted by the owning feature.
	 */
	component: React.ReactNode;
	/**
	 * View-scoped tools.
	 */
	tools: MountedUiContribution[];
	/**
	 * View-scoped status.
	 */
	status: MountedUiContribution[];
};

/**
 * Projected configuration panel state and content.
 */
type WorkspaceConfigurationPresentation = WorkspaceConfiguration & {
	/**
	 * Feature-owned settings for the selected scope.
	 */
	contributions: MountedUiContribution[];
};

/**
 * Page mounting context delivered to a registered feature controller.
 */
type WorkspacePageMount = {
	/**
	 * Registered definition selected by the workspace.
	 */
	page: AppPageRecord;
	/**
	 * Independent lifetime identity for the mounted instance.
	 */
	viewId: string;
};

/**
 * Registered page-controller capability, implemented independently by each feature.
 */
interface WorkspacePageController {
	/**
	 * Call this method to mount one independently identified page through its owning view.
	 *
	 * @param request - Registered page definition and independent target-view identity.
	 * @returns - Mounted feature presentation, or null when the feature produces no content.
	 */
	mount(request: WorkspacePageMount): React.ReactElement | null;

	/**
	 * Call this method to release the controller-owned resources of one mounted page instance.
	 *
	 * @param viewId - Exact mounted-view lifetime to release.
	 */
	unmount(viewId: string): void;
}

/**
 * Contribution mounting context delivered to its owning controller.
 */
type WorkspaceContributionMount = {
	/**
	 * Exact registered metadata and lifetime.
	 */
	contribution: UiContributionRecord;
};

/**
 * Public contribution-controller capability, independent of host implementation.
 */
interface WorkspaceContributionController {
	/**
	 * Call this method to mount feature-owned contribution presentation through its view service.
	 *
	 * @param request - Exact registration metadata and contribution lifetime.
	 * @returns - Mounted contribution presentation, or null when the feature produces no content.
	 */
	mountContribution(request: WorkspaceContributionMount): React.ReactElement | null;

	/**
	 * Call this method to release controller-owned resources for an exact contribution lifetime.
	 *
	 * @param request - Original registration metadata identifying the lifetime to release.
	 */
	unmountContribution(request: WorkspaceContributionMount): void;
}

/**
 * Mounted page lifetime owned by the workspace controller.
 */
type WorkspacePageSession = {
	/**
	 * Metadata identifying the mounted definition.
	 */
	page: AppPageRecord;
	/**
	 * Borrowed feature capability responsible for final release.
	 */
	controller: WorkspacePageController;
	/**
	 * Renderable feature presentation.
	 */
	component: React.ReactElement;
};

/**
 * Mounted contribution lifetime owned by the workspace controller.
 */
type WorkspaceContributionSession = MountedUiContribution & {
	/**
	 * Original metadata used for exact release.
	 */
	contribution: UiContributionRecord;
	/**
	 * Borrowed contributor capability.
	 */
	controller: WorkspaceContributionController;
};

/**
 * Presentation-only localization callback; enabled lookup failures remain empty.
 */
type WorkspaceText = (key: string, replacements?: Record<string, string | number>, literal?: string) => string;

/**
 * Shell boundary props, without model or unrelated service access.
 */
type WorkspaceShellProps = {
	/**
	 * Owning presentation capability.
	 */
	workspaceView: WorkspaceViewService;
	/**
	 * Initial projected state.
	 */
	initialState: WorkspaceShellState;
};

/**
 * Shared toolbar props.
 */
type WorkspaceToolbarProps = {
	/**
	 * Localized text projection.
	 */
	text: WorkspaceText;
	/**
	 * Whether two views are open.
	 */
	comparison: boolean;
	/**
	 * Whether configuration is open.
	 */
	configurationOpen: boolean;
	/**
	 * Shared feature-owned content.
	 */
	contributions: MountedUiContribution[];
	/**
	 * Workspace comparison intent.
	 */
	onToggleComparison: () => void;
	/**
	 * Configuration visibility intent.
	 */
	onToggleConfiguration: () => void;
};

/**
 * View-grid props, consisting only of presentation and intent callbacks.
 */
type WorkspaceProps = {
	/**
	 * Localized text projection.
	 */
	text: WorkspaceText;
	/**
	 * Open view presentations.
	 */
	views: WorkspaceViewport[];
	/**
	 * Available page metadata.
	 */
	pages: AppPageRecord[];
	/**
	 * Unknown routed page state for the primary view.
	 */
	notFound: boolean;
	/**
	 * Selection intent encoded by a native control.
	 */
	onSelectPage: React.ChangeEventHandler<HTMLSelectElement>;
	/**
	 * Optional-view close intent.
	 */
	onCloseView: React.MouseEventHandler<HTMLButtonElement>;
};

/**
 * A single generic view-frame presentation.
 */
type ViewportFrameProps = Omit<WorkspaceProps, 'views'> & {
	/**
	 * Current view.
	 */
	viewport: WorkspaceViewport;
	/**
	 * One-based display position.
	 */
	number: number;
};

/**
 * Configuration surface presentation and view-mediated actions.
 */
type ConfigurationPanelProps = {
	/**
	 * Localized text projection.
	 */
	text: WorkspaceText;
	/**
	 * Current scope and its content.
	 */
	configuration: WorkspaceConfigurationPresentation;
	/**
	 * Available view targets.
	 */
	views: WorkspaceViewport[];
	/**
	 * Panel close intent.
	 */
	onClose: () => void;
	/**
	 * Scope selection intent encoded by a native control.
	 */
	onSelectTarget: React.ChangeEventHandler<HTMLSelectElement>;
};

/**
 * Opaque feature presentation mounted for one view identity.
 */
type WorkspacePageContent = {
	/**
	 * Target open-view lifetime.
	 */
	viewId: string;
	/**
	 * Presentation supplied by the page's own view.
	 */
	component: React.ReactNode;
};

/**
 * Flat mounted contribution facts, prior to presentation-host projection.
 */
type WorkspaceContributionContent = UiContributionRecord & {
	/**
	 * Owner-rendered presentation.
	 */
	component: React.ReactNode;
};

/**
 * Controller-owned workspace state passed to its view for projection.
 */
type WorkspaceState = {
	/**
	 * Defensive canonical model snapshot.
	 */
	workspace: WorkspaceSnapshot;
	/**
	 * Available definition metadata in catalog order.
	 */
	pages: AppPageRecord[];
	/**
	 * Mounted page results without controller implementation references.
	 */
	pageContent: WorkspacePageContent[];
	/**
	 * Eligible mounted contributions in catalog order, without owner references.
	 */
	contributions: WorkspaceContributionContent[];
};
