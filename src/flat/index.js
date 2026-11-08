import {registry} from '@polylith/core';
import '@polylith/features';
import '@polylith/config';
export {stopApplication} from './main/main.jsx';

await registry.start();
