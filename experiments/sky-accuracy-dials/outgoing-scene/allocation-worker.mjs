import {createRun,identity} from '../io/files.mjs';

/** One real concurrent allocation, without numerical work or shared writes. */
const run=createRun('h62-lock-child',{parents:[identity(process.argv[2])],operation:'Focused real allocator concurrency proof: allocate and seal one empty child with the same requested name as its peer.',parameters:{pid:process.pid}});
run.finish('accepted',{allocated:run.path});
console.log(JSON.stringify({run:run.path}));
