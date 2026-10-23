/** Ambient contracts owned by this contained experiment. */

/** Identity of a read-only parent or a closed generated artifact. */
type TwilightArtifact = {path: string; bytes: number; sha256: string};
/** Current run's append-only progress and exclusive artifact writer. */
type TwilightRun = {
	path: string;
	absolute: string;
	write(name: string, data: unknown): void;
	progress(phase: string, message: string, extra?: Record<string, unknown>): void;
	finish(state: string, facts?: Record<string, unknown>): void;
};
/** Ordered capture request; physical times are resolved by the retained app controller. */
type TwilightCase = {
	id: string;
	location: number;
	mode: string;
	height: number;
	time: string;
	minutes?: number;
	view?: string;
	fov?: number;
	layers?: number[];
	heading?: number[];
	resetHeading?: boolean;
	verifyCandidates?: boolean;
};
