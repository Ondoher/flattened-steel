    /// <summary>Substitute only this entry into an authenticated reference source; measure its positive finite kernels without field values.</summary>
    public static void Main(string[] args) {
        if(args.Length!=2 || File.Exists(args[1]))throw new ArgumentException("Checked input and new operator output required.");
        var input=Json.Deserialize<Dictionary<string,object>>(File.ReadAllText(args[0]));
        Height=Number(input,"height");Top=Number(input,"top");Radius=Number(input,"radius");
        HR=Number(input,"rayleighHeight");HM=Number(input,"mieHeight");G=Number(input,"g");Albedo=Number(input,"albedo");
        Z=Numbers(input["altitudes"]);Rho=Numbers(input["radial"]);Mu=Numbers(input["mu"]);MuWeights=Numbers(input["muWeights"]);
        OutMu=Numbers(input["operatorOutMu"]);BetaR=Numbers(input["betaR"]);BetaM=Numbers(input["betaM"]);
        Phi=Convert.ToInt32(input["phi"]);Intervals=Convert.ToInt32(input["intervals"]);SpectralBatch=Convert.ToInt32(input["spectralBatch"]);
        IncomingPhiOffset=Number(input,"phiOffset");Piecewise=(string)input["pathRule"]=="piecewise-gauss-v1";
        if(Phi<8 || SpectralBatch<1 || SpectralBatch>3 || BetaR.Length!=15 || BetaM.Length!=15)throw new ArgumentException("Unsupported operator inventory.");
        PositionCount=Z.Length*Rho.Length;IncomingCount=Mu.Length*Phi;
        if(Piecewise)BuildGaussRule(Intervals/30);
        PhiCos=new double[Phi];PhiSin=new double[Phi];for(int i=0;i<Phi;i++){PhiCos[i]=Math.Cos(2*Math.PI*i/Phi);PhiSin[i]=Math.Sin(2*Math.PI*i/Phi);}
        var watch=Stopwatch.StartNew();BuildPhaseKernels();
        var queries=((System.Collections.IEnumerable)input["queries"]).Cast<Dictionary<string,object>>().ToArray();
        double queryPhaseMaximum=0;
        foreach(var query in queries) {
            var p=Numbers(query["point"]);var d=Numbers(query["direction"]);double angle=Math.Atan2(p[1],p[0]);
            double ox=d[0]*Math.Cos(angle)+d[1]*Math.Sin(angle),oy=-d[0]*Math.Sin(angle)+d[1]*Math.Cos(angle),r=0,m=0;
            for(int polar=0;polar<Mu.Length;polar++)for(int a=0;a<Phi;a++) {
                double h=Math.Sqrt(1-Mu[polar]*Mu[polar]),phi=2*Math.PI*(a+IncomingPhiOffset)/Phi;
                double dot=ox*h*Math.Cos(phi)+oy*h*Math.Sin(phi)+d[2]*Mu[polar],weight=MuWeights[polar]*2*Math.PI/Phi;
                r+=weight*PhaseR(dot);m+=weight*Albedo*PhaseM(dot);
            }queryPhaseMaximum=Math.Max(queryPhaseMaximum,Math.Max(r,m));
        }
        var maximum=new double[][] {new double[15],new double[15]};var sync=new object();long cases=0;
        Action<double,double,double,bool> point=(x,y,z,scalar)=>{
            var local=new double[][] {new double[15],new double[15]};long localCases=0;
            for(int first=0;first<15;first+=scalar ? 1 : SpectralBatch) {
                int count=scalar ? 1 : Math.Min(SpectralBatch,15-first);
                for(int polar=0;polar<Mu.Length;polar++)for(int a=0;a<(IncomingPhiOffset==0 ? Phi/2+1 : Phi/2);a++) {
                    double h=Math.Sqrt(1-Mu[polar]*Mu[polar]),phi=2*Math.PI*(a+IncomingPhiOffset)/Phi;
                    for(int policy=0;policy<2;policy++) {
                        var mass=OperatorKernel(x,y,z,h*Math.Cos(phi),h*Math.Sin(phi),Mu[polar],first,count,policy==1);
                        for(int c=0;c<count;c++)local[policy][first+c]=Math.Max(local[policy][first+c],mass[c]);
                        localCases++;
                    }
                }
            }
            lock(sync){for(int policy=0;policy<2;policy++)for(int c=0;c<15;c++)maximum[policy][c]=Math.Max(maximum[policy][c],local[policy][c]);cases+=localCases;}
        };
        Parallel.For(0,PositionCount,new ParallelOptions {MaxDegreeOfParallelism=Convert.ToInt32(input["threads"])},i=>{
            point(Rho[i%Rho.Length],0,Z[i/Rho.Length],SpectralBatch==1);
            if(i%64==0)Console.WriteLine("operator grid "+i+"/"+PositionCount);
        });
        var groups=queries.GroupBy(q=>String.Join(",",Numbers(q["point"]).Select(v=>v.ToString("R",CultureInfo.InvariantCulture)))).ToArray();
        foreach(var group in groups){var p=Numbers(group.First()["point"]);point(Math.Sqrt(p[0]*p[0]+p[1]*p[1]),0,p[2],true);}
        foreach(var query in queries) {
            var p=Numbers(query["point"]);var d=Numbers(query["direction"]);
            for(int c=0;c<15;c++)for(int policy=0;policy<2;policy++) {
                var mass=OperatorKernel(p[0],p[1],p[2],d[0],d[1],d[2],c,1,policy==1);
                maximum[policy][c]=Math.Max(maximum[policy][c],mass[0]);cases++;
            }
        }
        if(maximum.Any(row=>row.Any(v=>Double.IsNaN(v) || Double.IsInfinity(v) || v<0)))throw new ArithmeticException("Invalid positive kernel mass.");
        File.WriteAllText(args[1],Json.Serialize(new {schema="native-positive-operator-v1",maximumKernelMass=maximum,phaseGridMaximum=PhaseMassMaximum,phaseQueryMaximum=queryPhaseMaximum,maximumPathSamples=MaximumPathSamples,cases=cases,positions=PositionCount,queryPoints=groups.Length,elapsedMilliseconds=watch.Elapsed.TotalMilliseconds}));
    }

    /// <summary>Replay the original scalar or batch-common tau-32 boundary and source-independent quadrature; sum only positive attenuation/extinction weights.</summary>
    private static double[] OperatorKernel(double x,double y,double z,double dx,double dy,double dz,int first,int count,bool field) {
        double length=Boundary(x,y,z,dx,dy,dz),endZ=Math.Max(0,Math.Min(Top,z+dz*length));
        double minimum=Double.PositiveInfinity;for(int c=0;c<count;c++)minimum=Math.Min(minimum,Optical(z,endZ,length,first+c));
        if(minimum>32){double low=0,high=length;for(int i=0;i<40;i++){double t=(low+high)/2,alt=Math.Max(0,Math.Min(Top,z+dz*t));minimum=Double.PositiveInfinity;for(int c=0;c<count;c++)minimum=Math.Min(minimum,Optical(z,alt,t,first+c));if(minimum>32)high=t;else low=t;}length=high;}
        var samples=PathSamples(x,y,z,dx,dy,dz,length,first,field);var mass=new double[count];
        foreach(var tap in samples) {
            double alt=Math.Max(0,Math.Min(Top,z+dz*tap.Distance));
            for(int c=0;c<count;c++)mass[c]+=tap.Weight*Math.Exp(-Optical(z,alt,tap.Distance,first+c))*Extinction(alt,first+c);
        }return mass;
    }
