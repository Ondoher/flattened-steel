import {readFile} from 'node:fs/promises';
import {serve} from '../../node_modules/polylith/bin/apps.js';
const config = JSON.parse(await readFile(new URL('../../polylith.json', import.meta.url), 'utf8'));
await serve('flat32', {...config, port: 8103});
