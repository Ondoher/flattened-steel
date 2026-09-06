import {rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {FLAT32_GENERATED_DIRECTORIES} from './consts.js';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '../..');

for (const relativeDirectory of FLAT32_GENERATED_DIRECTORIES) {
	const target = path.resolve(repositoryRoot, relativeDirectory);
	const relativeTarget = path.relative(repositoryRoot, target);

	if (relativeTarget.startsWith('..') || path.isAbsolute(relativeTarget)) {
		throw new Error(`Refusing to remove a path outside the repository: ${target}`);
	}

	await rm(target, {force: true, recursive: true});
}
