import {read} from '../geometry-incoming/common.mjs';
import {base,registration} from '../illumination-basis/common.mjs';
export {base,registration};
export const key = row => `${row.profile}|${row.target}|${row.channel}`;
export const prior = name => base + name;
export const witnesses = ['node-89','reserved-out-1'];
export const channels = [3,5,8];
/** Reuse the admitted weights and independently integrated model output.
 * @param {any} f @returns {any}
 */
export function retained(f) {
 const sector = read(prior(`00590-h108-sector-wave/${f.t.id}-weights.json.gz`)).levels.at(-1).rows.find(x=>x.profile===f.p.id&&x.channel===f.packet.channel);
 return sector;
}
