"""Select a reserved interval using observed stability only, before predictions."""
import bisect
import json
import statistics as stats
import sys
sys.dont_write_bytecode=True
from evidence import Run
from netcdf import NetCDF


def main():
    """Apply a frozen clear/stable rule and rank eligible windows by pilot separation."""
    with Run('stable-windows',['netcdf.py','stability.py'],'M1 pre-model cloud/stability selection') as run:
        parent=run.parent('00009-arm-optics')
        run.parent('00020-case-freeze')
        spectra=NetCDF(parent/'raw/sgpsaszevisC1.a1.20230822.000001.nc')
        lidar=NetCDF(parent/'raw/sgprlproffex1thorC1.c0.20230822.000000.nc')
        try:
            t,w=spectra.read('time'),spectra.read('wavelength')
            channels={center:min(range(len(w)),key=lambda i:abs(w[i]-center)) for center in [440,550,675,780]}
            bands={center:spectra.read('zenith_radiance',[0,index],[len(t),1]) for center,index in channels.items()}
            lt=lidar.read('time');nh=lidar.dimensions[1]['size']
            # Use declared variable dimensions instead of assuming dimension order.
            nh=lidar.variables['feature_mask']['dimensions'][1]['size']
            mask,qc=lidar.read('feature_mask'),lidar.read('qc_profile')
            rows=[]
            for start in range(13*3600,23*3600,5*60):
                stop=start+4*60
                a,b=bisect.bisect_left(t,start),bisect.bisect_left(t,stop)
                li=[i for i,x in enumerate(lt) if start<=x<stop]
                clean=bool(li) and all(qc[i]==0 and not any(int(v)&12 for v in mask[i*nh:(i+1)*nh]) for i in li)
                cvs={str(c):stats.stdev(v[a:b])/stats.mean(v[a:b]) for c,v in bands.items()} if b-a>=50 else {}
                stable=bool(cvs) and all(v<=(0.06 if c=='780' else 0.03) for c,v in cvs.items())
                rows.append({'utcSecondsInterval':[start,stop],'count':b-a,'cloudScreenPass':clean,
                    'temporalCV':cvs,'eligible':clean and stable and abs(start-(22*3600+20*60))>=20*60})
            eligible=[r for r in rows if r['eligible']]
            # Prefer same afternoon and a different solar elevation, not residual agreement.
            afternoon=[r for r in eligible if r['utcSecondsInterval'][0]>=18*3600]
            selected=min(afternoon or eligible,key=lambda r:abs(r['utcSecondsInterval'][0]-(22*3600+20*60))) if eligible else None
            run.json('result.json',{'rule':'4 minute windows on fixed5minute grid; >=50 spectra; lidarQC0/no cloud or rain; CV<=3% at440/550/675 and<=6% at780; >=20minutes pilot separation; closest eligible afternoon window',
                'selectedReservedWindow':selected,'rows':rows,
                'supersedesReservedWindowIn':'00020-case-freeze','reason':'Original reserved window has15-50% visible temporal variation; selection uses no predictions',
                'fullAccuracyQualified':False})
            print(json.dumps({'eligible':len(eligible),'selected':selected}),flush=True)
        finally:
            spectra.close();lidar.close()

if __name__=='__main__':main()
