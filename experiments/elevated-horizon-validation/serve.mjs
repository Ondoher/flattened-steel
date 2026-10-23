import {readFileSync} from 'node:fs';
import {serve} from '../../node_modules/polylith/bin/apps.js';
import {checked} from './io.mjs';
const config = JSON.parse(readFileSync(checked('polylith.json'), 'utf8'));
await serve('flat32', {...config, port: 8097});
