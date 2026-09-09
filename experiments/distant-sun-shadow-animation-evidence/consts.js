import path from 'node:path';
import {fileURLToPath} from 'node:url';

const sourceRoot = path.dirname(fileURLToPath(import.meta.url));

/** Absolute authored source root for this contained experiment. */
export const SOURCE_ROOT = sourceRoot;
/** Absolute repository root derived from the authored module location. */
export const REPOSITORY_ROOT = path.resolve(sourceRoot, '..', '..');
/** Absolute ignored output root for generated experiment evidence. */
export const OUTPUT_ROOT = path.join(
	REPOSITORY_ROOT,
	'tmp',
	'experiments',
	'distant-sun-shadow-animation-evidence',
);
/** Pinned Chrome executable used by the hardware WebGL proof runner. */
export const CHROME_EXECUTABLE = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
