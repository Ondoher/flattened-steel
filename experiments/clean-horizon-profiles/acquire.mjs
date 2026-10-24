import {spawn} from 'node:child_process';
import {createRun, identity, root, source} from './io.mjs';

const run = createRun('acquire', 'M1 ATom source access, optical metadata and smallest-file acquisition', [
 identity('experiments/elevated-horizon-validation/io.mjs'),
 identity('src/flat32/Flat32Atmosphere.js'),
 identity('src/flat32/Flat32ProductionSelections.js'),
 identity('scripts/libradtran/installation.json'),
]);
let output = '', errorOutput = '';
try {
 const result = await new Promise((resolve, reject) => {
  const child = spawn('python', [source + '/acquire.py', run.path], {cwd: root, windowsHide: true, stdio: ['ignore','pipe','pipe']});
  child.stdout.on('data', value => { output += value; process.stdout.write(value); });
  child.stderr.on('data', value => { errorOutput += value; });
  child.on('error', reject);
  child.on('close', code => resolve(code));
 });
 run.write('transport.log', output + errorOutput);
 if (result !== 0) throw Error('Acquisition transport exited ' + result);
 run.finish('accepted', {meaning:'Source inventory complete; individual download failures remain explicit.',transport:'Python urllib system HTTPS; no credentials'});
} catch (error) {
 run.write('failure.json', {message:String(error)});run.write('transport-error.log', output + errorOutput);
 run.finish('failed', {error:String(error)});process.exitCode=1;
}
