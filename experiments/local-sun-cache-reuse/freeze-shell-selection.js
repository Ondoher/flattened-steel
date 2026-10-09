import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {rollup} from 'rollup';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {repositoryRoot,checkPath,hash} from './run-boundary.js';

/** Freeze the development selection before opening orbital holdout results.
 * @returns {Promise<void>} - Immutable numerical selection, explicitly not accuracy or phase acceptance.
 */
async function main() {
	const run=await ExperimentRun.create('p3-selection');
	try {
		const layoutParent=await readParent('00217-p3-layout-v2','layout.json'),gateParent=await readParent('00217-p3-layout-v2','gates.json');
		const development=[];
		for(const name of ['00218-p3-shell-v3a','00219-p3-stencil-proof','00220-p3-primary-cmp','00221-p3-reference-cmp','00234-p3-omission','00251-p3-move-proof']) {
			const parent=await readParent(name,'result.json');development.push(parent);
		}
		const layout=JSON.parse(new TextDecoder().decode(layoutParent.bytes));
		if(layout.schema!=='local-sun-shell-layout-v9' || layout.nodes.length!==1049 || layout.interpolation!=='euclidean-radius' || layout.reconstruction!=='geometric-density')throw new Error('Unselected shell numerical layout.');
		const entry=path.join(repositoryRoot,'experiments/local-sun-cache-reuse/rotation-model.js');await checkPath(repositoryRoot,entry);
		const commonjs=createRequire(import.meta.url)('@rollup/plugin-commonjs'),warnings=[];
		const bundle=await rollup({input:entry,plugins:[nodeResolve({browser:true}),commonjs()],onwarn(w){warnings.push({code:w.code,message:w.message});}});
		let files;try {files=bundle.watchFiles;}finally{await bundle.close();}
		const implementation=[];
		for(const target of [...new Set([...files,...['freeze-shell-selection.js','ExperimentRun.js','parent-evidence.js','run-boundary.js','shell-client.js'].map(name=>path.join(repositoryRoot,'experiments/local-sun-cache-reuse',name))])].filter(name=>!name.startsWith('\0'))) {
			await checkPath(repositoryRoot,target);const bytes=await readFile(target);implementation.push({path:path.relative(repositoryRoot,target).replaceAll('\\','/'),sha256:hash(bytes)});
		}
		const numerical={schema:'shell-development-selection-v1',layoutSha256:layoutParent.artifactSha256,gatesSha256:gateParent.artifactSha256,layoutSchema:layout.schema,nodes:layout.nodes.length,
			incoming:'partitioned-polar40-midpoint-azimuth48-v1',outgoing:'cubed-sphere-W27',spectral:'Native15',maximumOrder:4,format:'R32F',buildTransport:'column48-tail64',runtime:'analytic-columns-positive-column15-v1',sourceStrengthBands:2048,
			boundaryExtinctionLengthMultiples:layout.boundaryExtinctionLengthMultiples,qualification:'unqualified-development-selection',holdout:'flat-90',
			mutationRule:'Do not tune numerical equations, nodes, angular/path resolution or acceptance limits using holdout results. Independent-reference correction and application ownership/performance work remain separate; any numerical successor requires a new recorded selection and cannot inherit untouched-holdout status.'};
		await run.write('layout.json',layoutParent.bytes);await run.write('gates.json',gateParent.bytes);
		await run.write('selection.json',JSON.stringify({...numerical,identity:'sha256:'+hash(JSON.stringify({numerical,implementation}))},null,'\t'));
		await run.write('inputs.json',JSON.stringify({parents:[layoutParent,gateParent,...development].map(({bytes,...identity})=>identity),implementation,warnings,operation:'Freeze the selected v9 numerical data/equations and source identities after development and before orbital Flat90 candidate evaluation. Freeze is not physical acceptance; unresolved reference/resource/source-review gates stay open.',tools:{node:process.version},command:process.argv.slice(1)},null,'\t'));
		await run.finish('accepted');console.log(JSON.stringify({run:run.name,nodes:layout.nodes.length,selectionFrozen:true,qualified:false}));
	} catch(error){await run.finish('failed',error instanceof Error?error.stack:String(error));throw error;}
}
await main();
