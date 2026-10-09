using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Globalization;
using System.Threading.Tasks;
using System.Web.Script.Serialization;

/// <summary>Independent binary64 flat-medium recurrence; no candidate fields or stencils.</summary>
internal static class ShellReference {
    private static double Height, Top, Radius, HR, HM, G, Albedo, ReferenceDistance, SourceScale;
    private static double[] Z, Rho, Mu, MuWeights, OutMu, BetaR, BetaM, Irradiance;
    private static int Phi, Intervals, PositionCount, IncomingCount, OutgoingCount;
    private static double[] KernelR, KernelM,KernelRImaginary,KernelMImaginary;
    private static double IncomingPhiOffset;
    private static double PhaseMassMaximum;
    private static ParallelOptions Parallelism;
    private static int SpectralBatch;
    private static bool Piecewise;
    private static double[] GaussNodes,GaussWeights,PhiCos,PhiSin;
    private static int MaximumPathSamples;
    private static readonly JavaScriptSerializer Json = new JavaScriptSerializer { MaxJsonLength = Int32.MaxValue };

    /// <summary>Read only the runner-authenticated input; write one new requested result.</summary>
    public static void Main(string[] args) {
        if((args.Length!=2 && args.Length!=3) || File.Exists(args[1]))throw new ArgumentException("Input, new output and optional checked empty field directory required.");
        string exportDirectory=args.Length==3 ? args[2] : null;
        if(exportDirectory!=null && (!Directory.Exists(exportDirectory) || Directory.EnumerateFileSystemEntries(exportDirectory).Any()))throw new ArgumentException("A newly owned empty export directory is required.");
        var input=Json.Deserialize<Dictionary<string,object>>(File.ReadAllText(args[0]));
        Height=Number(input,"height");Top=Number(input,"top");Radius=Number(input,"radius");
        HR=Number(input,"rayleighHeight");HM=Number(input,"mieHeight");G=Number(input,"g");Albedo=Number(input,"albedo");
        ReferenceDistance=Number(input,"referenceDistance");SourceScale=Number(input,"sourceScale");
        Z=Numbers(input["altitudes"]);Rho=Numbers(input["radial"]);Mu=Numbers(input["mu"]);MuWeights=Numbers(input["muWeights"]);
        BetaR=Numbers(input["betaR"]);BetaM=Numbers(input["betaM"]);Irradiance=Numbers(input["irradiance"]);
        Phi=Convert.ToInt32(input["phi"]);Intervals=Convert.ToInt32(input["intervals"]);
        Parallelism=new ParallelOptions { MaxDegreeOfParallelism=Convert.ToInt32(input["threads"]) };
        SpectralBatch=input.ContainsKey("spectralBatch") ? Convert.ToInt32(input["spectralBatch"]) : 1;
        Piecewise=input.ContainsKey("pathRule") && (string)input["pathRule"]=="piecewise-gauss-v1";
        IncomingPhiOffset=input.ContainsKey("phiOffset") ? Number(input,"phiOffset") : 0;
        if(IncomingPhiOffset!=0 && IncomingPhiOffset!=0.5)throw new ArgumentException("Unsupported azimuth offset.");
        if(SpectralBatch<1 || SpectralBatch>3)throw new ArgumentException("Reference spectral batches must contain one to three channels.");
        if(!(Height>Top && Top>0 && Radius>0) || Phi<8 || (Phi&(Phi-1))!=0 || Intervals<2 || Intervals%2!=0)throw new ArgumentException("Invalid physical/refinement input.");
        if(Z[0]!=0 || Z[Z.Length-1]!=Top || Rho[0]!=0 || Rho[Rho.Length-1]!=Radius || BetaR.Length!=15 || BetaM.Length!=15 || Irradiance.Length!=15 || Mu.Length!=MuWeights.Length)throw new ArgumentException("Incomplete physical/spectral support.");
        for(int i=1;i<Z.Length;i++)if(Z[i]<=Z[i-1])throw new ArgumentException("Unordered altitude support.");
        for(int i=1;i<Rho.Length;i++)if(Rho[i]<=Rho[i-1])throw new ArgumentException("Unordered radial support.");
        for(int i=1;i<Mu.Length;i++)if(Mu[i]<=Mu[i-1])throw new ArgumentException("Unordered angular support.");
        if(input.ContainsKey("outgoingMu")) {
            OutMu=Numbers(input["outgoingMu"]);
            if(OutMu.Length!=Mu.Length+1 || OutMu[0]!=-1 || OutMu[OutMu.Length-1]!=1 || !OutMu.Contains(0.0))throw new ArgumentException("Incomplete nested outgoing support.");
            for(int i=0;i<OutMu.Length;i++)if(Double.IsNaN(OutMu[i]) || Double.IsInfinity(OutMu[i]) || (i>0 && OutMu[i]<=OutMu[i-1]))throw new ArgumentException("Unordered outgoing support.");
        } else {
            OutMu=new double[Mu.Length+2];OutMu[0]=-1;OutMu[OutMu.Length-1]=1;Array.Copy(Mu,0,OutMu,1,Mu.Length);
        }
        PositionCount=checked(Z.Length*Rho.Length);IncomingCount=checked(Mu.Length*Phi);OutgoingCount=checked(OutMu.Length*Phi);
        if(Piecewise)BuildGaussRule(Intervals/30);
        PhiCos=new double[Phi];PhiSin=new double[Phi];for(int i=0;i<Phi;i++){PhiCos[i]=Math.Cos(2*Math.PI*i/Phi);PhiSin[i]=Math.Sin(2*Math.PI*i/Phi);}
        var queries=((System.Collections.IEnumerable)input["queries"]).Cast<Dictionary<string,object>>().ToArray();
        var queryGroups=Enumerable.Range(0,queries.Length).GroupBy(q=>String.Join(",",Numbers(queries[q]["point"]).Select(v=>v.ToString("R",CultureInfo.InvariantCulture)))).ToArray();
        var packets=new Dictionary<string,double[]>[queries.Length];
        for(int q=0;q<queries.Length;q++)packets[q]=new Dictionary<string,double[]> {
            {"J2",new double[15]},{"J3",new double[15]},{"J4",new double[15]},
            {"L1",new double[15]},{"L2",new double[15]},{"L3",new double[15]},{"L4",new double[15]},
            {"gridJ2",new double[15]},{"gridJ3",new double[15]},{"gridJ4",new double[15]}
        };
        var watch=Stopwatch.StartNew();BuildPhaseKernels();
        double phaseBound=MuWeights.Sum()*2*Math.PI*Math.Max(PhaseR(1),Albedo*PhaseM(1));
        double epsilon=2.2204460492503131e-16;
        var tail=new Dictionary<string,double[]> {
            {"L1",new double[15]},{"L2",new double[15]},{"L3",new double[15]},{"L4",new double[15]},
            {"sourceJ2",new double[15]},{"sourceJ3",new double[15]},{"sourceJ4",new double[15]}
        };
        var roundoff=new Dictionary<string,double[]> {
            {"L1",new double[15]},{"L2",new double[15]},{"L3",new double[15]},{"L4",new double[15]},
            {"sourceJ2",new double[15]},{"sourceJ3",new double[15]},{"sourceJ4",new double[15]}
        };
        double worstFftResidual=0;
        for(int channel=0;channel<15;channel+=SpectralBatch) {
            int count=Math.Min(SpectralBatch,15-channel);
            Console.WriteLine("reference batch "+channel+": continuous L1");
            var l1=TransportPacket(null,channel,count);
            var maximumL1=l1.Select(values=>values.Max(v=>Math.Abs(v))).ToArray();
            var j2=new double[count][];
            for(int b=0;b<count;b++)j2[b]=Scatter(l1[b],channel+b,ref worstFftResidual);l1=null;
            Console.WriteLine("reference batch "+channel+": L2/J3");
            var l2=TransportPacket(j2,channel,count);
            var maximumL2=l2.Select(values=>values.Max(v=>Math.Abs(v))).ToArray();
            var j3=new double[count][];
            for(int b=0;b<count;b++)j3[b]=Scatter(l2[b],channel+b,ref worstFftResidual);l2=null;
            Console.WriteLine("reference batch "+channel+": L3/J4");
            var l3=TransportPacket(j3,channel,count);
            var maximumL3=l3.Select(values=>values.Max(v=>Math.Abs(v))).ToArray();
            var j4=new double[count][];
            for(int b=0;b<count;b++)j4[b]=Scatter(l3[b],channel+b,ref worstFftResidual);l3=null;
            for(int batchIndex=0;batchIndex<count;batchIndex++) {
            int c=channel+batchIndex;
            if(exportDirectory!=null) {
                ExportField(j2[batchIndex],exportDirectory,"J2",c);
                ExportField(j3[batchIndex],exportDirectory,"J3",c);
                ExportField(j4[batchIndex],exportDirectory,"J4",c);
            }
            double primaryMaximum=Irradiance[c]*SourceScale*Math.Pow(ReferenceDistance/(Height-Top),2)*Math.Max(PhaseR(1),PhaseM(1));
            tail["L1"][c]=primaryMaximum*Math.Exp(-32);
            tail["sourceJ2"][c]=phaseBound*tail["L1"][c];
            tail["L2"][c]=tail["sourceJ2"][c]+j2[batchIndex].Max(v=>Math.Abs(v))*Math.Exp(-32);
            tail["sourceJ3"][c]=phaseBound*tail["L2"][c];
            tail["L3"][c]=tail["sourceJ3"][c]+j3[batchIndex].Max(v=>Math.Abs(v))*Math.Exp(-32);
            tail["sourceJ4"][c]=phaseBound*tail["L3"][c];
            tail["L4"][c]=tail["sourceJ4"][c]+j4[batchIndex].Max(v=>Math.Abs(v))*Math.Exp(-32);
            int pathSamples=Math.Max(Intervals,MaximumPathSamples);
            roundoff["L1"][c]=64*epsilon*pathSamples*maximumL1[batchIndex];
            roundoff["sourceJ2"][c]=phaseBound*(roundoff["L1"][c]+64*epsilon*IncomingCount*maximumL1[batchIndex]);
            roundoff["L2"][c]=roundoff["sourceJ2"][c]+64*epsilon*pathSamples*j2[batchIndex].Max(v=>Math.Abs(v));
            roundoff["sourceJ3"][c]=phaseBound*(roundoff["L2"][c]+64*epsilon*IncomingCount*maximumL2[batchIndex]);
            roundoff["L3"][c]=roundoff["sourceJ3"][c]+64*epsilon*pathSamples*j3[batchIndex].Max(v=>Math.Abs(v));
            roundoff["sourceJ4"][c]=phaseBound*(roundoff["L3"][c]+64*epsilon*IncomingCount*maximumL3[batchIndex]);
            roundoff["L4"][c]=roundoff["sourceJ4"][c]+64*epsilon*pathSamples*j4[batchIndex].Max(v=>Math.Abs(v));
            foreach(var group in queryGroups) {
              var point=Numbers(queries[group.First()]["point"]);
              double[] primaryIncoming=PointIncoming(null,point,c),secondIncoming=PointIncoming(j2[batchIndex],point,c),thirdIncoming=PointIncoming(j3[batchIndex],point,c);
              foreach(int q in group) {
                var p=Numbers(queries[q]["point"]);var d=Numbers(queries[q]["direction"]);
                packets[q]["J2"][c]=QueryScatter(primaryIncoming,p,d,c);
                packets[q]["J3"][c]=QueryScatter(secondIncoming,p,d,c);
                packets[q]["J4"][c]=QueryScatter(thirdIncoming,p,d,c);
                packets[q]["L1"][c]=Radiance(null,p[0],p[1],p[2],d[0],d[1],d[2],c);
                packets[q]["L2"][c]=Radiance(j2[batchIndex],p[0],p[1],p[2],d[0],d[1],d[2],c);
                packets[q]["L3"][c]=Radiance(j3[batchIndex],p[0],p[1],p[2],d[0],d[1],d[2],c);
                packets[q]["L4"][c]=Radiance(j4[batchIndex],p[0],p[1],p[2],d[0],d[1],d[2],c);
                double beta=Extinction(p[2],c);
                packets[q]["gridJ2"][c]=beta*Sample(j2[batchIndex],p[0],p[1],p[2],d[0],d[1],d[2]);
                packets[q]["gridJ3"][c]=beta*Sample(j3[batchIndex],p[0],p[1],p[2],d[0],d[1],d[2]);
                packets[q]["gridJ4"][c]=beta*Sample(j4[batchIndex],p[0],p[1],p[2],d[0],d[1],d[2]);
              }
            }
            }
        }
        File.WriteAllText(args[1],Json.Serialize(new { schema="binary64-flat-recurrence-packet-v2",packets=packets,elapsedMilliseconds=watch.Elapsed.TotalMilliseconds,spectralBatch=SpectralBatch,
            positions=PositionCount,incoming=IncomingCount,outgoing=OutgoingCount,intervals=Intervals,pathRule=Piecewise ? "piecewise-gauss-v1" : "simpson-square-v2",maximumPathSamples=MaximumPathSamples,fftWorstAbsolute=worstFftResidual,tailErrorBounds=tail,roundoffErrorBounds=roundoff,phaseMassMaximum=PhaseMassMaximum,phaseMassBound=phaseBound,
            fftAuditPolicy="full-incoming-direct-sums-at-pole-horizon-and-midlatitude-cyclic-sentinels-v1",
            fields=exportDirectory==null ? null : new { schema="binary64-native-source-function-grid-v1",encoding="IEEE754-binary64-little-endian",orders=new string[]{"J2","J3","J4"},channels=15,altitudes=Z,radial=Rho,polar=OutMu,azimuthCount=Phi,shape=new int[]{Z.Length,Rho.Length,OutMu.Length,Phi},normalization="physical scattering density divided by local extinction",address="(((z*rhoCount+rho)*polarCount+polar)*azimuthCount+azimuth)",filePattern="J{order}-c{channel}.bin" },
            claim="Independent finite-grid recurrence and exact withheld query scattering; convergence/refinement qualification belongs to the outer proof." }));
    }

    /// <summary>Copy an independently computed source-function grid without changing its values or arithmetic.</summary>
    private static void ExportField(double[] values,string directory,string order,int channel) {
        string destination=Path.Combine(directory,order+"-c"+channel+".bin");
        const int chunkValues=1048576;
        var bytes=new byte[Math.Min(values.Length,chunkValues)*sizeof(double)];
        using(var stream=new FileStream(destination,FileMode.CreateNew,FileAccess.Write,FileShare.None)) {
            for(int first=0;first<values.Length;first+=chunkValues) {
                int count=Math.Min(chunkValues,values.Length-first);
                Buffer.BlockCopy(values,first*sizeof(double),bytes,0,count*sizeof(double));
                stream.Write(bytes,0,count*sizeof(double));
            }
        }
    }

    /// <summary>Read one authenticated numeric parameter.</summary>
    private static double Number(Dictionary<string,object> input,string key) { return Convert.ToDouble(input[key]); }
    /// <summary>Copy JSON numeric arrays without candidate or runtime references.</summary>
    private static double[] Numbers(object value) { return ((System.Collections.IEnumerable)value).Cast<object>().Select(Convert.ToDouble).ToArray(); }
    /// <summary>Stable exponential density column, including a horizontal segment.</summary>
    private static double Column(double z0,double z1,double length,double scale) {
        double dz=(z1-z0)/scale;
        double factor=Math.Abs(dz)<0.001 ? 1-dz/2+dz*dz/6-dz*dz*dz/24+dz*dz*dz*dz/120 : (1-Math.Exp(-dz))/dz;
        return Math.Exp(-z0/scale)*length*factor;
    }
    /// <summary>Physical scalar extinction for one pinned wavelength.</summary>
    private static double Extinction(double z,int c) { return BetaR[c]*Math.Exp(-z/HR)+BetaM[c]*Math.Exp(-z/HM); }
    /// <summary>Analytic view extinction independently of any sampled field.</summary>
    private static double Optical(double z0,double z1,double length,int c) { return BetaR[c]*Column(z0,z1,length,HR)+BetaM[c]*Column(z0,z1,length,HM); }
    /// <summary>Accepted continuous Rayleigh phase.</summary>
    private static double PhaseR(double dot) { return 3/(16*Math.PI)*(1+dot*dot); }
    /// <summary>Accepted continuous Cornette-Shanks phase.</summary>
    private static double PhaseM(double dot) { return 3/(8*Math.PI)*(1-G*G)/(2+G*G)*(1+dot*dot)/Math.Pow(1+G*G-2*G*dot,1.5); }
    /// <summary>Continuous source-calibrated primary density, never a held-amplitude shell fact.</summary>
    private static double Primary(double x,double y,double z,double dx,double dy,double dz,int c) {
        double height=Height-z,distance=Math.Sqrt(x*x+y*y+height*height);
        double sourceLength=(Top-z)*distance/height;
        double tau=Optical(z,Top,sourceLength,c),dot=(-x*dx-y*dy+height*dz)/distance;
        return Irradiance[c]*SourceScale*ReferenceDistance*ReferenceDistance/(distance*distance)*Math.Exp(-tau)*(
            BetaR[c]*Math.Exp(-z/HR)*PhaseR(dot)+Albedo*BetaM[c]*Math.Exp(-z/HM)*PhaseM(dot));
    }
    /// <summary>Stable positive boundary of the black-ground slab and declared cylinder.</summary>
    private static double Boundary(double x,double y,double z,double dx,double dy,double dz) {
        double slab=dz>0 ? (Top-z)/dz : dz<0 ? -z/dz : Double.PositiveInfinity;
        double a=dx*dx+dy*dy,b=x*dx+y*dy,rho=Math.Sqrt(x*x+y*y),inside=(Radius-rho)*(Radius+rho);
        double root=Math.Sqrt(Math.Max(0,b*b+a*inside));
        double radial=a==0 ? Double.PositiveInfinity : b>=0 ? (inside==0 ? 0 : inside/(root+b)) : (-b+root)/a;
        return Math.Max(0,Math.Min(slab,radial));
    }
    /// <summary>Composite Simpson in a squared path coordinate with analytic attenuation.</summary>
    private static double Radiance(double[] sourceFunction,double x,double y,double z,double dx,double dy,double dz,int c) {
        int ml=Bracket(OutMu,dz);double mw=(dz-OutMu[ml])/(OutMu[ml+1]-OutMu[ml]),angle=Math.Atan2(dy,dx);
        double length=Boundary(x,y,z,dx,dy,dz);
        double endZ=Math.Max(0,Math.Min(Top,z+dz*length));
        if(Optical(z,endZ,length,c)>32) {
            double low=0,high=length;
            for(int i=0;i<40;i++) {double t=(low+high)/2,alt=Math.Max(0,Math.Min(Top,z+dz*t));if(Optical(z,alt,t,c)>32)high=t;else low=t;}
            length=high;
        }
        double sum=0;
        var samples=PathSamples(x,y,z,dx,dy,dz,length,c,sourceFunction!=null);
        foreach(var sample in samples) {
            double t=sample.Distance,px=x+dx*t,py=y+dy*t,pz=Math.Max(0,Math.Min(Top,z+dz*t));
            double j=sourceFunction==null ? Primary(px,py,pz,dx,dy,dz,c) : Extinction(pz,c)*SamplePrepared(sourceFunction,px,py,pz,ml,mw,angle);
            sum+=sample.Weight*Math.Exp(-Optical(z,pz,t,c))*j;
        }
        return sum;
    }
    /// <summary>Independent positive tensor interpolation in rho, z, mu and cyclic azimuth.</summary>
    private static double Sample(double[] field,double x,double y,double z,double dx,double dy,double dz) {
        int ml=Bracket(OutMu,dz);double mw=(dz-OutMu[ml])/(OutMu[ml+1]-OutMu[ml]);
        return SamplePrepared(field,x,y,z,ml,mw,Math.Atan2(dy,dx));
    }
    /// <summary>Reuse the constant physical polar/azimuth ray state without changing interpolation.</summary>
    private static double SamplePrepared(double[] field,double x,double y,double z,int ml,double mw,double angle) {
        double rho=Math.Sqrt(x*x+y*y);
        if(rho>Radius+0.000001 || z< -0.000001 || z>Top+0.000001)throw new ArgumentException("Reference query outside physical cylinder/slab.");
        int rl=Bracket(Rho,rho),zl=Bracket(Z,z);
        double rw=(rho-Rho[rl])/(Rho[rl+1]-Rho[rl]),zw=(z-Z[zl])/(Z[zl+1]-Z[zl]);
        double phi=angle-(rho==0 ? 0 : Math.Atan2(y,x));phi=phi%(2*Math.PI);if(phi<0)phi+=2*Math.PI;
        double coordinate=phi*Phi/(2*Math.PI);int pl=(int)Math.Floor(coordinate);double pw=coordinate-pl;
        int mIndex=mw==1 ? ml+1 : ml,lo=pl%Phi,hi=(pl+1)%Phi;
        int first=(zl*Rho.Length+rl)*OutgoingCount+mIndex*Phi;
        int second=first+OutgoingCount,third=first+Rho.Length*OutgoingCount,fourth=third+OutgoingCount;
        double a0=AzimuthSample(field,first,lo,hi,pw),a1=AzimuthSample(field,second,lo,hi,pw),b0=AzimuthSample(field,third,lo,hi,pw),b1=AzimuthSample(field,fourth,lo,hi,pw);
        if(mw!=0 && mw!=1) {
            a0+=mw*(AzimuthSample(field,first+Phi,lo,hi,pw)-a0);a1+=mw*(AzimuthSample(field,second+Phi,lo,hi,pw)-a1);
            b0+=mw*(AzimuthSample(field,third+Phi,lo,hi,pw)-b0);b1+=mw*(AzimuthSample(field,fourth+Phi,lo,hi,pw)-b1);
        }
        double lower=a0+rw*(a1-a0),upper=b0+rw*(b1-b0);return lower+zw*(upper-lower);
    }
    /// <summary>Two cyclic angular taps; exact-node transport avoids unused zero-weight polar taps.</summary>
    private static double AzimuthSample(double[] field,int first,int low,int high,double weight) { return field[first+low]+weight*(field[first+high]-field[first+low]); }
    /// <summary>Complete endpoint-support bracket, preserving on-node values.</summary>
    private static int Bracket(double[] nodes,double value) {
        if(value<=nodes[0])return 0;if(value>=nodes[nodes.Length-1])return nodes.Length-2;
        int low=0,high=nodes.Length-1;while(high-low>1){int mid=(low+high)/2;if(value<nodes[mid])high=mid;else low=mid;}return low;
    }
    /// <summary>Construct transported order values at independently sampled incoming directions.</summary>
    private static double[] Transport(double[] source,int channel) {
        var output=new double[checked(PositionCount*IncomingCount)];
        Parallel.For(0,PositionCount,Parallelism,p=>{
            double x=Rho[p%Rho.Length],z=Z[p/Rho.Length];
            for(int m=0;m<Mu.Length;m++)for(int a=0;a<(IncomingPhiOffset==0 ? Phi/2+1 : Phi/2);a++) {
                double horizontal=Math.Sqrt(1-Mu[m]*Mu[m]),phi=2*Math.PI*(a+IncomingPhiOffset)/Phi;
                double value=Radiance(source,x,0,z,horizontal*Math.Cos(phi),horizontal*Math.Sin(phi),Mu[m],channel);
                output[p*IncomingCount+m*Phi+a]=value;
                if(IncomingPhiOffset==0.5)output[p*IncomingCount+m*Phi+Phi-1-a]=value;
                else if(a>0 && a<Phi/2)output[p*IncomingCount+m*Phi+Phi-a]=value;
            }
        });return output;
    }

    /// <summary>One positive physical-distance quadrature tap.</summary>
    private struct PathTap { internal double Distance,Weight; internal PathTap(double distance,double weight){Distance=distance;Weight=weight;} }

    /// <summary>Independently generate Gaussian nodes from Legendre polynomials.</summary>
    private static void BuildGaussRule(int count) {
        if(count<2 || count>32)throw new ArgumentException("Unsupported independent Gaussian path order.");
        GaussNodes=new double[count];GaussWeights=new double[count];
        for(int i=0;i<count;i++) {
            double x=Math.Cos(Math.PI*(i+0.75)/(count+0.5)),derivative=0;
            for(int iteration=0;iteration<30;iteration++) {
                double p0=1,p1=x;
                for(int degree=2;degree<=count;degree++){double next=((2*degree-1)*x*p1-(degree-1)*p0)/degree;p0=p1;p1=next;}
                derivative=count*(x*p1-p0)/(x*x-1);double step=p1/derivative;x-=step;if(Math.Abs(step)<1e-15)break;
            }
            GaussNodes[i]=x;GaussWeights[i]=2/((1-x*x)*derivative*derivative);
        }
        if(Math.Abs(GaussWeights.Sum()-2)>1e-12)throw new ArithmeticException("Gaussian path mass mismatch.");
    }

    /// <summary>Split at reference interpolation knots and physical density/attenuation scales before Gaussian integration.</summary>
    private static PathTap[] PathSamples(double x,double y,double z,double dx,double dy,double dz,double length,int c,bool interpolateField) {
        if(length==0)return new PathTap[0];
        if(!Piecewise) {
            var ordinary=new PathTap[Intervals];
            for(int i=1;i<=Intervals;i++){double u=(double)i/Intervals;ordinary[i-1]=new PathTap(length*u*u,(i==Intervals ? 1 : i%2==1 ? 4 : 2)*(2*length*u)/(3*Intervals));}
            return ordinary;
        }
        var cuts=new List<double> {0,length};
        Action<double> add=value=>{if(value>0 && value<length && !Double.IsNaN(value))cuts.Add(value);};
        if(dz!=0) {
            if(interpolateField)foreach(double altitude in Z)add((altitude-z)/dz);
            for(double altitude=0;altitude<=12000;altitude+=250)add((altitude-z)/dz);
            for(double altitude=16000;altitude<=40000;altitude+=4000)add((altitude-z)/dz);
            for(double altitude=48000;altitude<=Top;altitude+=8000)add((altitude-z)/dz);
        }
        double a=dx*dx+dy*dy,b=x*dx+y*dy,rho=Math.Sqrt(x*x+y*y);
        if(a>0) {
            add(-b/a);
            if(interpolateField)foreach(double radius in Rho) {
                double discriminant=b*b-a*(rho-radius)*(rho+radius);
                if(discriminant>=0){double root=Math.Sqrt(discriminant);add((-b-root)/a);add((-b+root)/a);}
            }
            double horizontal=Math.Sqrt(a),cos=dx/horizontal,sin=dy/horizontal;
            if(interpolateField)for(int phi=0;phi<Phi;phi++) {
                double targetCos=cos*PhiCos[phi]+sin*PhiSin[phi],targetSin=sin*PhiCos[phi]-cos*PhiSin[phi];
                double denominator=dx*targetSin-dy*targetCos;if(Math.Abs(denominator)<1e-14)continue;
                double t=-(x*targetSin-y*targetCos)/denominator;
                if((x+dx*t)*targetCos+(y+dy*t)*targetSin>=0)add(t);
            }
        }
        double endZ=Math.Max(0,Math.Min(Top,z+dz*length)),fullTau=Optical(z,endZ,length,c);
        foreach(double target in new double[] {0.125,0.25,0.5,1,2,4,8,16,32,64,128})if(target<fullTau) {
            if(dz==0){add(target/Extinction(z,c));continue;}
            double low=0,high=length;
            for(int i=0;i<32;i++){double t=(low+high)/2,alt=Math.Max(0,Math.Min(Top,z+dz*t));if(Optical(z,alt,t,c)>target)high=t;else low=t;}
            add((low+high)/2);
        }
        cuts.Sort();var samples=new List<PathTap>();
        for(int i=1;i<cuts.Count;i++) {
            double low=cuts[i-1],high=cuts[i];if(high==low)continue;
            double half=(high-low)/2,mid=low+half;
            for(int tap=0;tap<GaussNodes.Length;tap++)samples.Add(new PathTap(mid+half*GaussNodes[tap],half*GaussWeights[tap]));
        }
        int previous;
        do {previous=MaximumPathSamples;if(previous>=samples.Count)break;}while(System.Threading.Interlocked.CompareExchange(ref MaximumPathSamples,samples.Count,previous)!=previous);
        return samples.ToArray();
    }

    /// <summary>Independent spectral packet transport; share physical columns and phase, not spectral values.</summary>
    private static double[][] TransportPacket(double[][] source,int firstChannel,int count) {
        if(count==1)return new double[][] {Transport(source==null ? null : source[0],firstChannel)};
        var output=new double[count][];
        for(int c=0;c<count;c++)output[c]=new double[checked(PositionCount*IncomingCount)];
        Parallel.For(0,PositionCount,Parallelism,p=>{
            double x=Rho[p%Rho.Length],z=Z[p/Rho.Length];
            var values=new double[count];
            for(int m=0;m<Mu.Length;m++)for(int a=0;a<(IncomingPhiOffset==0 ? Phi/2+1 : Phi/2);a++) {
                double horizontal=Math.Sqrt(1-Mu[m]*Mu[m]),phi=2*Math.PI*(a+IncomingPhiOffset)/Phi;
                RadiancePacket(source,firstChannel,count,x,z,horizontal*Math.Cos(phi),horizontal*Math.Sin(phi),Mu[m],values);
                for(int c=0;c<count;c++) {
                    output[c][p*IncomingCount+m*Phi+a]=values[c];
                    if(IncomingPhiOffset==0.5)output[c][p*IncomingCount+m*Phi+Phi-1-a]=values[c];
                    else if(a>0 && a<Phi/2)output[c][p*IncomingCount+m*Phi+Phi-a]=values[c];
                }
            }
        });return output;
    }

    /// <summary>Same continuous equation with one batch-common tail boundary where every channel has tau at least 32.</summary>
    private static void RadiancePacket(double[][] source,int firstChannel,int count,double x,double z,double dx,double dy,double dz,double[] values) {
        Array.Clear(values,0,count);
        int ml=Bracket(OutMu,dz);double mw=(dz-OutMu[ml])/(OutMu[ml+1]-OutMu[ml]),angle=Math.Atan2(dy,dx);
        double length=Boundary(x,0,z,dx,dy,dz);
        double endZ=Math.Max(0,Math.Min(Top,z+dz*length));
        double rColumn=Column(z,endZ,length,HR),mColumn=Column(z,endZ,length,HM),minimum=Double.PositiveInfinity;
        for(int c=0;c<count;c++)minimum=Math.Min(minimum,BetaR[firstChannel+c]*rColumn+BetaM[firstChannel+c]*mColumn);
        if(minimum>32) {
            double low=0,high=length;
            for(int i=0;i<40;i++) {
                double t=(low+high)/2,alt=Math.Max(0,Math.Min(Top,z+dz*t));
                rColumn=Column(z,alt,t,HR);mColumn=Column(z,alt,t,HM);minimum=Double.PositiveInfinity;
                for(int c=0;c<count;c++)minimum=Math.Min(minimum,BetaR[firstChannel+c]*rColumn+BetaM[firstChannel+c]*mColumn);
                if(minimum>32)high=t;else low=t;
            }length=high;
        }
        var samples=PathSamples(x,0,z,dx,dy,dz,length,firstChannel,source!=null);
        foreach(var sample in samples) {
            double t=sample.Distance,px=x+dx*t,py=dy*t,pz=Math.Max(0,Math.Min(Top,z+dz*t));
            double weight=sample.Weight;
            double densityR=Math.Exp(-pz/HR),densityM=Math.Exp(-pz/HM);
            rColumn=Column(z,pz,t,HR);mColumn=Column(z,pz,t,HM);
            if(source==null) {
                double height=Height-pz,distance=Math.Sqrt(px*px+py*py+height*height),sourceLength=(Top-pz)*distance/height;
                double dot=(-px*dx-py*dy+height*dz)/distance;
                double phaseR=PhaseR(dot),phaseM=Albedo*PhaseM(dot),scale=SourceScale*ReferenceDistance*ReferenceDistance/(distance*distance);
                rColumn+=Column(pz,Top,sourceLength,HR);mColumn+=Column(pz,Top,sourceLength,HM);
                for(int c=0;c<count;c++) {int channel=firstChannel+c;values[c]+=weight*scale*Irradiance[channel]*Math.Exp(-BetaR[channel]*rColumn-BetaM[channel]*mColumn)*(BetaR[channel]*densityR*phaseR+BetaM[channel]*densityM*phaseM);}
            } else {
                for(int c=0;c<count;c++) {int channel=firstChannel+c;values[c]+=weight*Math.Exp(-BetaR[channel]*rColumn-BetaM[channel]*mColumn)*(BetaR[channel]*densityR+BetaM[channel]*densityM)*SamplePrepared(source[c],px,py,pz,ml,mw,angle);}
            }
        }
    }
    /// <summary>Precompute exact discrete phase-convolution Fourier kernels.</summary>
    private static void BuildPhaseKernels() {
        KernelR=new double[checked(OutMu.Length*Mu.Length*Phi)];KernelM=new double[KernelR.Length];
        KernelRImaginary=new double[KernelR.Length];KernelMImaginary=new double[KernelR.Length];
        for(int o=0;o<OutMu.Length;o++)for(int i=0;i<Mu.Length;i++) {
            double[] r=new double[Phi],m=new double[Phi],ri=new double[Phi],mi=new double[Phi];
            for(int a=0;a<Phi;a++) {double dot=OutMu[o]*Mu[i]+Math.Sqrt((1-OutMu[o]*OutMu[o])*(1-Mu[i]*Mu[i]))*Math.Cos(2*Math.PI*(a-IncomingPhiOffset)/Phi);r[a]=PhaseR(dot);m[a]=PhaseM(dot);}
            Transform(r,ri,0,false);Transform(m,mi,0,false);
            for(int a=0;a<Phi;a++) {int index=(o*Mu.Length+i)*Phi+a;double weight=MuWeights[i]*2*Math.PI/Phi;KernelR[index]=r[a]*weight;KernelM[index]=m[a]*weight;KernelRImaginary[index]=ri[a]*weight;KernelMImaginary[index]=mi[a]*weight;}
        }
        PhaseMassMaximum=0;
        for(int o=0;o<OutMu.Length;o++) {double r=0,m=0;for(int i=0;i<Mu.Length;i++){r+=KernelR[(o*Mu.Length+i)*Phi];m+=Albedo*KernelM[(o*Mu.Length+i)*Phi];}PhaseMassMaximum=Math.Max(PhaseMassMaximum,Math.Max(r,m));}
    }
    /// <summary>Scatter transported values into source functions; validate FFT against direct summation.</summary>
    private static double[] Scatter(double[] incoming,int channel,ref double worstResidual) {
        var output=new double[checked(PositionCount*OutgoingCount)];
        Parallel.For(0,PositionCount,Parallelism,p=>{
            double z=Z[p/Rho.Length],r=BetaR[channel]*Math.Exp(-z/HR),m=Albedo*BetaM[channel]*Math.Exp(-z/HM),beta=Extinction(z,channel);
            var re=new double[IncomingCount];var im=new double[IncomingCount];Array.Copy(incoming,p*IncomingCount,re,0,IncomingCount);
            for(int i=0;i<Mu.Length;i++)Transform(re,im,i*Phi,false);
            var outRe=new double[Phi];var outIm=new double[Phi];
            for(int o=0;o<OutMu.Length;o++) {
                Array.Clear(outRe,0,Phi);Array.Clear(outIm,0,Phi);
                for(int i=0;i<Mu.Length;i++)for(int a=0;a<Phi;a++) {int kernel=(o*Mu.Length+i)*Phi+a;double k=r*KernelR[kernel]+m*KernelM[kernel],ki=r*KernelRImaginary[kernel]+m*KernelMImaginary[kernel];outRe[a]+=k*re[i*Phi+a]-ki*im[i*Phi+a];outIm[a]+=k*im[i*Phi+a]+ki*re[i*Phi+a];}
                Transform(outRe,outIm,0,true);
                for(int a=0;a<Phi;a++){if(Double.IsNaN(outRe[a]) || Double.IsInfinity(outRe[a]) || outRe[a]< -1e-15)throw new ArithmeticException("Nonfinite or negative reference scattering.");output[p*OutgoingCount+o*Phi+a]=outRe[a]/beta;}
            }
        });
        int point=Math.Min(Rho.Length+1,PositionCount-1);double altitude=Z[point/Rho.Length];
        // Audit only reads the completed field. Keep every incoming tap in each
        // independent direct sum; use fixed physical outgoing sentinels rather
        // than a quadratic audit over the complete outgoing tensor.
        int horizon=Enumerable.Range(0,OutMu.Length).OrderBy(i=>Math.Abs(OutMu[i])).First();
        int[] polar=new int[] {0,OutMu.Length-1,Math.Max(0,horizon-1),horizon,Math.Min(OutMu.Length-1,horizon+1),OutMu.Length/4,3*OutMu.Length/4};
        int[] azimuth=new int[] {0,1,Phi/8,Phi/4,Phi/2,3*Phi/4,Phi-1};
        foreach(int o in polar.Distinct())foreach(int a in azimuth.Distinct()) {
            double direct=0;
            for(int i=0;i<Mu.Length;i++)for(int b=0;b<Phi;b++) {double dot=OutMu[o]*Mu[i]+Math.Sqrt((1-OutMu[o]*OutMu[o])*(1-Mu[i]*Mu[i]))*Math.Cos(2*Math.PI*(a-b-IncomingPhiOffset)/Phi);
                direct+=incoming[point*IncomingCount+i*Phi+b]*MuWeights[i]*2*Math.PI/Phi*(BetaR[channel]*Math.Exp(-altitude/HR)*PhaseR(dot)+Albedo*BetaM[channel]*Math.Exp(-altitude/HM)*PhaseM(dot));}
            double actual=output[point*OutgoingCount+o*Phi+a]*Extinction(altitude,channel),error=Math.Abs(actual-direct);
            if(error>1e-18+1e-10*Math.Abs(direct))throw new ArithmeticException("Independent FFT/direct scatter mismatch.");worstResidual=Math.Max(worstResidual,error);
        }
        return output;
    }
    /// <summary>Compute incoming transport once per physical point, independent of its withheld outgoing directions.</summary>
    private static double[] PointIncoming(double[] source,double[] point,int c) {
        double rho=Math.Sqrt(point[0]*point[0]+point[1]*point[1]);var result=new double[IncomingCount];
        for(int m=0;m<Mu.Length;m++)for(int a=0;a<(IncomingPhiOffset==0 ? Phi/2+1 : Phi/2);a++) {
            double horizontal=Math.Sqrt(1-Mu[m]*Mu[m]),phi=2*Math.PI*(a+IncomingPhiOffset)/Phi;
            result[m*Phi+a]=Radiance(source,rho,0,point[2],horizontal*Math.Cos(phi),horizontal*Math.Sin(phi),Mu[m],c);
            if(IncomingPhiOffset==0.5)result[m*Phi+Phi-1-a]=result[m*Phi+a];
            else if(a>0 && a<Phi/2)result[m*Phi+Phi-a]=result[m*Phi+a];
        }return result;
    }
    /// <summary>Evaluate withheld scattering by direct quadrature, bypassing sampled outgoing interpolation.</summary>
    private static double QueryScatter(double[] incoming,double[] point,double[] outgoing,int c) {
        double theta=Math.Atan2(point[1],point[0]),cos=Math.Cos(theta),sin=Math.Sin(theta),rho=Math.Sqrt(point[0]*point[0]+point[1]*point[1]);
        double ox=outgoing[0]*cos+outgoing[1]*sin,oy=-outgoing[0]*sin+outgoing[1]*cos,sum=0;
        for(int m=0;m<Mu.Length;m++)for(int a=0;a<Phi;a++) {
            double horizontal=Math.Sqrt(1-Mu[m]*Mu[m]),phi=2*Math.PI*(a+IncomingPhiOffset)/Phi,dx=horizontal*Math.Cos(phi),dy=horizontal*Math.Sin(phi),dz=Mu[m];
            double l=incoming[m*Phi+a],dot=ox*dx+oy*dy+outgoing[2]*dz;
            sum+=l*MuWeights[m]*2*Math.PI/Phi*(BetaR[c]*Math.Exp(-point[2]/HR)*PhaseR(dot)+Albedo*BetaM[c]*Math.Exp(-point[2]/HM)*PhaseM(dot));
        }
        return sum;
    }
    /// <summary>Radix-two complex DFT; scalar direct sums independently verify its result.</summary>
    private static void Transform(double[] real,double[] imaginary,int offset,bool inverse) {
        for(int i=1,j=0;i<Phi;i++) {int bit=Phi>>1;for(; (j&bit)!=0;bit>>=1)j^=bit;j^=bit;if(i<j){double r=real[offset+i];real[offset+i]=real[offset+j];real[offset+j]=r;r=imaginary[offset+i];imaginary[offset+i]=imaginary[offset+j];imaginary[offset+j]=r;}}
        for(int size=2;size<=Phi;size<<=1) {
            double angle=(inverse ? 2 : -2)*Math.PI/size,wr=Math.Cos(angle),wi=Math.Sin(angle);
            for(int start=0;start<Phi;start+=size) {
                double ur=1,ui=0;
                for(int j=0;j<size/2;j++) {int a=offset+start+j,b=a+size/2;double vr=real[b]*ur-imaginary[b]*ui,vi=real[b]*ui+imaginary[b]*ur;
                    real[b]=real[a]-vr;imaginary[b]=imaginary[a]-vi;real[a]+=vr;imaginary[a]+=vi;double next=ur*wr-ui*wi;ui=ur*wi+ui*wr;ur=next;}
            }
        }
        if(inverse)for(int i=0;i<Phi;i++){real[offset+i]/=Phi;imaginary[offset+i]/=Phi;}
    }
}
