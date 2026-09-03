import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../server/flat32/data/human-vision-filter-package-v1');
const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
const bytes = await readFile(path.join(root, manifest.artifact.path));
const values = JSON.parse(bytes.toString('utf8')).values;
const hash = createHash('sha256').update(bytes).digest('hex');
if (
	manifest.schemaId !== 'algorithm32-production-human-vision-filter-package-v1' ||
	manifest.parents.sourceSha256 !== '6a75d3fdbcbf5e9e9a07478511933eefeda953f3e2cc14b74459e5a099ec3759' ||
	bytes.byteLength !== manifest.artifact.byteLength ||
	hash !== manifest.artifact.sha256 ||
	!Array.isArray(values) || values.length !== 15 ||
	!values.every((value) => Number.isFinite(value) && value >= 0)
) throw new Error('P7 human-vision package verification failed.');
console.log(JSON.stringify({accepted: true, count: values.length, artifactSha256: hash, byteLength: bytes.byteLength}, null, 2));
