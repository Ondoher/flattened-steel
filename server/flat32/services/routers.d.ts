/** Router contribution registry consumed during server startup. */
export interface RoutersService extends EventBus {
	/** Append one ordinary router; duplicate identifiers throw. */
	add(name: string): void;
	/** Read an independent ordered snapshot, with the final router last. */
	get(): string[];
	/** Select the single final fallback; duplicate or second selections throw. */
	setLast(name: string): void;
}
