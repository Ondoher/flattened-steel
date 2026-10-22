"""Own one production GPU subprocess and seal its contained outputs."""
import argparse
import json
import subprocess
import sys
sys.dont_write_bytecode=True
from evidence import Run
from inventory import REPO_ROOT


def main():
    """Authenticate the physical input; relay observable GPU work without altering it."""
    parser=argparse.ArgumentParser();parser.add_argument('--input-run',required=True);parser.add_argument('--refine',action='store_true');parser.add_argument('--converge',action='store_true');args=parser.parse_args()
    with Run('prod-convergence' if args.converge else 'prod-refinement' if args.refine else 'prod-caches',['compute.py','gpu.mjs','gpu-types.d.ts'],'M3 actual production GPU cache numerical sensitivity' if args.refine or args.converge else 'M3 actual production corrected/legacy GPU caches and lookup') as run:
        parent=run.parent(args.input_run)
        (run.path/'contract.json').write_bytes((parent/'contract.json').read_bytes())
        process=None
        with (run.path/'node.log').open('x',encoding='utf-8') as log:
            try:
                process=subprocess.Popen(['node',str(REPO_ROOT/'experiments/arm-spectral-validation/gpu.mjs'),
                    run.path.relative_to(REPO_ROOT).as_posix(),*(['--refine'] if args.refine else []),*(['--converge'] if args.converge else [])],cwd=REPO_ROOT,stdin=subprocess.DEVNULL,
                    stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,bufsize=1)
                for line in process.stdout:
                    log.write(line);log.flush()
                    if line.startswith('{'):
                        value=json.loads(line)
                        phase=value.get('phase','gpu')
                        run.event(phase,'Production GPU compiler/lookup',details=value)
                        if phase in ['wavelength-start','wavelength-complete','channel-probed']:print(line,end='',flush=True)
                if process.wait():raise RuntimeError('Production GPU subprocess failed; inspect node.log')
            finally:
                if process is not None and process.poll() is None:
                    process.terminate();process.wait(timeout=30)

if __name__=='__main__':main()
