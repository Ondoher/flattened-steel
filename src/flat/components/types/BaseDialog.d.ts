/**
 * Semantic purpose of a declarative dialog action.
 *
 * - **"cancel"** - The action reports cancellation intent.
 * - **"confirm"** - The action reports confirmation intent.
 */
type BaseDialogActionIntent = 'cancel' | 'confirm';

/**
 * Declarative dialog action state.
 */
type BaseDialogAction = {
	/**
	 * Stable action identifier.
	 */
	readonly id: string;
	/**
	 * Localization phrase key and optional replacements.
	 */
	readonly label: LocalizedText;
	/**
	 * Optional workflow-neutral callback classification.
	 */
	readonly intent?: BaseDialogActionIntent;
	/**
	 * Whether activation is permitted.
	 */
	readonly enabled?: boolean;
	/**
	 * Whether the action is omitted from presentation.
	 */
	readonly hidden?: boolean;
	/**
	 * Visual action priority.
	 */
	readonly priority?: 'primary' | 'secondary';
	/**
	 * Explicit action size, falling back to application context.
	 */
	readonly size?: 'small' | 'medium' | 'large';
	/**
	 * Explicit appearance takes precedence over priority and context.
	 */
	readonly variant?: 'text' | 'outlined' | 'contained';
	/**
	 * Whether the action exposes a pressed state.
	 */
	readonly pressable?: boolean;
	/**
	 * Current pressed state for a pressable action.
	 */
	readonly pressed?: boolean;
};

/**
 * Child-facing presentation controller for declarative dialog updates.
 */
type BaseDialogController = {
	/**
	 * Replaces the title phrase.
	 *
	 * @param value - Phrase key and optional replacements.
	 */
	setTitle(value: LocalizedText): void;

	/**
	 * Replaces the description phrase.
	 *
	 * @param value - Phrase key and optional replacements.
	 */
	setDescription(value: LocalizedText): void;

	/**
	 * Updates one action's presentation.
	 *
	 * @param id - Stable action identity.
	 * @param patch - Action presentation changes.
	 */
	setActionState(id: string, patch: Partial<BaseDialogAction>): void;

	/**
	 * Replaces the live announcement phrase.
	 *
	 * @param value - Phrase key and optional replacements.
	 */
	announce(value: LocalizedText): void;

	/**
	 * Reports submit intent to the owning workflow.
	 */
	submit(): void;
};

/**
 * Public properties consumed by BaseDialog.
 */
type BaseDialogProps = {
	readonly open: boolean;
	readonly title?: LocalizedText;
	readonly description?: LocalizedText;
	readonly actions?: readonly BaseDialogAction[];
	readonly children?: import('react').ReactNode | ((dialog: BaseDialogController) => import('react').ReactNode);
	readonly resetToken?: unknown;
	readonly showClose?: boolean;
	readonly closeLabel?: string;
	/**
	 * Optional size override for the close IconButton.
	 */
	readonly closeButtonProps?: {readonly size?: 'small' | 'medium' | 'large'};
	readonly titleId?: string;
	readonly descriptionId?: string;
	readonly onAction?: (id: string) => void;
	readonly onClose?: (reason: string) => void;
	readonly onCancel?: (id: string) => void;
	readonly onConfirm?: (id: string) => void;
};

/**
 * BaseDialog React presentation component.
 */
declare class BaseDialog extends import('react').Component<BaseDialogProps> {}
export default BaseDialog;
