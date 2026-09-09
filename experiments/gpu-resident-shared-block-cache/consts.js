import path from 'node:path';
import {fileURLToPath} from 'node:url';

const sourceRoot = path.dirname(fileURLToPath(import.meta.url));

export const SOURCE_ROOT = sourceRoot;
export const REPOSITORY_ROOT = path.resolve(sourceRoot, '..', '..');
export const OUTPUT_ROOT = path.join(REPOSITORY_ROOT, 'tmp', 'experiments', 'gpu-resident-shared-block-cache');
export const CHROME_EXECUTABLE = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
