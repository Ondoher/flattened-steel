import assert from 'node:assert/strict';
import {createRun,identity,readRepository,verifyRun} from '../io/files.mjs';
import typescript from 'typescript';

/** Qualify usable capture artifacts without changing a source-integrity-failed parent's disposition.
 * @returns {void} New accepted qualification only if executed sources, dependency exclusions and numerical checks prove compatible.
 */
function main(){
	const source='tmp/experiments/sky-accuracy-dials/runs/00281-h34-h37-local',report='tmp/experiments/sky-accuracy-dials/runs/00284-h36-h37-report';
	const parents=[verifyRun(source),verifyRun(report)],seal=/** @type {LocalHorizonRecoverySeal} */(JSON.parse(readRepository(source+'/sealed.json').toString()));
	const excluded=['experiments/sky-accuracy-dials/local-horizon/evaluate.mjs','experiments/sky-accuracy-dials/local-horizon/types.d.ts'];
	assert.equal(seal.state,'failed');assert.equal(seal.heartbeatFailure,null);
	assert.deepEqual(seal.sourceFailures.map(x=>x.path).sort(),excluded.slice().sort());
	const unchanged=seal.sources.filter(x=>!excluded.includes(x.path));
	for(const item of unchanged)readRepository(item.path,item);
	const graph=/** @type {DialFileIdentity[]} */(JSON.parse(readRepository(source+'/source-identities.json').toString()));
	for(const item of graph){assert.ok(!excluded.includes(item.path),'Changed source entered executed browser graph');readRepository(item.path,item);}
	const host=['experiments/sky-accuracy-dials/local-horizon/run.mjs','experiments/sky-accuracy-dials/io/files.mjs','experiments/sky-accuracy-dials/horizon-reference/math.mjs','experiments/sky-accuracy-dials/horizon/diagnosis-color.mjs'];
	for(const item of unchanged.filter(x=>host.includes(x.path))){
		const text=readRepository(item.path,item).toString(),tree=typescript.createSourceFile(item.path,text,typescript.ScriptTarget.Latest,true);
		for(const statement of tree.statements)if(typescript.isImportDeclaration(statement)){
			assert.ok(!statement.moduleSpecifier.getText(tree).includes('evaluate.mjs'));
			assert.ok(!statement.moduleSpecifier.getText(tree).includes('types.d.ts'));
		}
	}
	const evaluation=/** @type {LocalHorizonRecoveryEvaluation} */(JSON.parse(readRepository(report+'/evaluation.json').toString()));
	assert.equal(evaluation.rows.length,18);assert.ok(evaluation.rows.every(x=>x.refinement<0.002));
	assert.ok(evaluation.parity.every(x=>x.maximumRelative<0.002));
	const run=createRun('h37-qualify',{parents,operation:'Qualify completed computational artifacts from a failed whole-tree integrity capture: all unchanged experimental source identities, exact browser dependency graph, changed-file nonparticipation and retained independent CPU/GPU parity. Parent remains failed, with no provenance waiver or GPU rerender.',parameters:{excluded,scope:'Selected capture artifacts and their derived numerical report; not whole-parent acceptance or implementation compliance.'}});
	let sealed=false;
	try{
		run.write('executed-capture.mjs',readRepository(host[0]));
		run.write('qualification.json',{source,report,parentState:seal.state,sourceFailures:seal.sourceFailures,unchangedSourceCount:unchanged.length,unchangedBrowserDependencyCount:graph.length,
			excluded,exclusionReason:'The report evaluator is not imported/executed by capture or its browser graph. Ambient declarations have no runtime execution. Both changed files remain subject to later source review. The parent run state is preserved.',
			qualifiedArtifacts:seal.artifacts.filter(x=>/baseline\.png|reference-|registration\.json|independent-rays\.json|production\.glsl|tool\.json/.test(x.path)).map(x=>identity(x.path)),
			parity:evaluation.parity,maximumRefinement:Math.max(...evaluation.rows.map(x=>x.refinement)),limits:'Exact executed-source qualification and numerical controls support these artifacts. This does not retroactively accept the failed run or waive its whole-tree integrity failure.'});
		run.finish('accepted',{qualified:true,source,report});sealed=true;verifyRun(run.path);assert.equal(JSON.parse(readRepository(run.path+'/sealed.json').toString()).state,'accepted');console.log(run.path);
	}catch(error){if(!sealed)run.finish('failed',{error:String(error)});throw error;}
}

main();
