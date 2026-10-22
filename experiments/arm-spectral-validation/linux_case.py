"""Execute one current Windows-owned case in WSL; the host owns sealing."""
import argparse
import json
from pathlib import Path
import sys
sys.dont_write_bytecode=True
from inventory import checked_path, OUTPUT_ROOT
from solver import execute, installed, sha


def main():
    """Use the pinned existing executable, with all writes below the active case."""
    parser=argparse.ArgumentParser();parser.add_argument('--case',required=True);args=parser.parse_args()
    case=checked_path(Path(args.case));case.relative_to(OUTPUT_ROOT/'runs')
    if case.parent.parent!=OUTPUT_ROOT/'runs':raise ValueError('Case must be an immediate child of its active run')
    if (case.parent/'sealed.json').exists():raise ValueError('Case owner already sealed')
    config=json.loads((case.parent/'installation.json').read_text())
    executable=installed(config['executable'])
    if sha(executable)!=config['expectedSha256']:raise ValueError('Solver identity changed')
    identity=json.loads((case.parent/'data-identity.json').read_text())
    for entry in identity['files']:
        if sha(installed(Path(config['dataDirectory'])/entry['path']))!=entry['sha256']:raise ValueError('Installed data changed')
    elapsed=execute(executable,case,None,timeout=180)
    (case/'execution.json').write_text(json.dumps({'solverWallSeconds':elapsed,'executableSha256':config['expectedSha256']})+'\n')
    print(json.dumps({'case':case.name,'solverWallSeconds':elapsed}),flush=True)

if __name__=='__main__':main()
