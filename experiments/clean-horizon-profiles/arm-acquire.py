"""Acquire clean-date ARM lidar with ephemeral, non-echoed credentials only."""
import datetime
import getpass
import hashlib
import json
import pathlib
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT=pathlib.Path(__file__).resolve().parents[2]
RUN=ROOT/sys.argv[1]
RUN.resolve().relative_to(ROOT/'tmp/experiments/clean-horizon-profiles/runs')
assert not (RUN/'manifest.json').exists()
class LocalRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,request,response,code,message,headers,new_url):
  parsed=urllib.parse.urlsplit(new_url)
  if parsed.scheme!='https' or parsed.hostname!='adc.arm.gov':raise ValueError('ARM redirect left selected provider')
  return super().redirect_request(request,response,code,message,headers,new_url)
opener=urllib.request.build_opener(LocalRedirect())
username=getpass.getpass('ARM username (not retained): ').strip()
token=getpass.getpass('ARM access token (not retained): ').strip()
assert username and token and not any(c in username+token for c in ':\r\n\0')
authorization=username+':'+token
records=[]
role=sys.argv[2] if len(sys.argv)>2 else 'lidar'
assert role in ['lidar','surface']
streams=['sgprlproffex1thorC1.c0'] if role=='lidar' else ['sgpaoppsap1flynn1mE13.c1','sgpmetE13.b1']
for date,stream in [(date,stream) for date in ['2023-12-05','2023-01-05','2023-02-27'] for stream in streams]:
 start=time.monotonic()
 end=(datetime.date.fromisoformat(date)+datetime.timedelta(days=1)).isoformat()
 row={'date':date,'stream':stream,'endpoint':'https://adc.arm.gov/armlive/query'}
 try:
  params={'user':authorization,'ds':stream,'start':date,'end':end,'wt':'json'}
  with opener.open('https://adc.arm.gov/armlive/query?'+urllib.parse.urlencode(params),timeout=40) as response:data=json.loads(response.read())
  files=[name for name in data.get('files',[]) if isinstance(name,str) and re.fullmatch(re.escape(stream)+r'\.'+date.replace('-','')+r'\.\d{6}\.(?:nc|cdf)',name)]
  row['availableFiles']=files;row['state']='no-files'
  if files:
   name=files[0];url='https://adc.arm.gov/armlive/saveData?'+urllib.parse.urlencode({'user':authorization,'file':name})
   digest=hashlib.sha256();size=0
   with opener.open(url,timeout=60) as response:
    prefix=response.read(512)
    if not(prefix[:3]==b'CDF' or prefix[:8]==b'\x89HDF\r\n\x1a\n'):raise ValueError('Response is not NetCDF/HDF5')
    with (RUN/name).open('xb') as output:
     output.write(prefix);digest.update(prefix);size=len(prefix)
     while True:
      block=response.read(1024*1024)
      if not block:break
      output.write(block);digest.update(block);size+=len(block)
   row.update({'state':'downloaded','file':name,'bytes':size,'sha256':digest.hexdigest()})
 except urllib.error.HTTPError as error:row.update({'state':'failed','httpStatus':error.code,'error':'ARM request rejected; response and credential-bearing URL omitted.'})
 except Exception as error:row.update({'state':'failed','errorType':type(error).__name__})
 row['seconds']=time.monotonic()-start;records.append(row);print(json.dumps(row),flush=True)
(RUN/'acquisition.json').write_text(json.dumps({'authentication':'Ephemeral supplied ARM credentials; no secrets persisted.','records':records},indent=2))
username=token=authorization=''
