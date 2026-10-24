"""Acquire the paper-published ATom derivative and inspect NASA mission listings."""
import hashlib
import json
import pathlib
import re
import sys
import time
import urllib.request
import zipfile

ROOT=pathlib.Path(__file__).resolve().parents[2]
RUN=ROOT/sys.argv[1]
RUN.resolve().relative_to(ROOT/'tmp/experiments/clean-horizon-profiles/runs')
assert not (RUN/'manifest.json').exists()
records=[]
def download(name,url):
 start=time.monotonic()
 try:
  digest=hashlib.sha256();size=0
  with urllib.request.urlopen(url,timeout=60) as response, (RUN/name).open('xb') as output:
   while True:
    block=response.read(1024*1024)
    if not block: break
    output.write(block);digest.update(block);size+=len(block)
    if size%(32*1024*1024)==0:print(json.dumps({'file':name,'receivedBytes':size}),flush=True)
  row={'file':name,'url':url,'state':'downloaded','bytes':size,'sha256':digest.hexdigest()}
 except Exception as error:row={'file':name,'url':url,'state':'failed','error':type(error).__name__+': '+str(error)}
 row['seconds']=time.monotonic()-start;records.append(row);print(json.dumps(row),flush=True)
 return row['state']=='downloaded'

url='https://zenodo.org/api/records/18815333/files/analysis_data.zip/content'
if download('analysis_data.zip',url):
 with zipfile.ZipFile(RUN/'analysis_data.zip') as archive:
  inventory=[{'path':item.filename,'bytes':item.file_size,'compressed':item.compress_size,'crc32':item.CRC} for item in archive.infolist()]
  (RUN/'zip-inventory.json').write_text(json.dumps(inventory,indent=2))
  print(json.dumps({'archiveEntries':len(inventory),'inventory':inventory[:35]}),flush=True)
  for item in archive.infolist():
   if item.is_dir(): continue
   assert not pathlib.PurePosixPath(item.filename).is_absolute() and '..' not in pathlib.PurePosixPath(item.filename).parts
   destination=RUN/'data'/item.filename
   destination.parent.mkdir(parents=True,exist_ok=True)
   with destination.open('xb') as stream:stream.write(archive.read(item))
for dataset in ['MER-MED','AMP']:
 name='nasa-'+dataset+'.html'
 if download(name,'https://espoarchive.nasa.gov/archive/browse/atom/DC8/'+dataset):
  html=(RUN/name).read_text(errors='replace')
  links=re.findall(r'href=["\']([^"\']+)',html)
  interesting=[link for link in links if any(word in link for word in ['.nc','.ict','.zip','/archive/download/'])]
  print(json.dumps({'listing':dataset,'links':interesting[:30]}),flush=True)
(RUN/'downloads.json').write_text(json.dumps(records,indent=2))
