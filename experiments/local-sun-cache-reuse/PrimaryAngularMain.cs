    /// <summary>Replace only the frozen entry; replay continuous primary rays at diagnostic incoming grids, without source fields or candidate data.</summary>
    public static void Main(string[] args) {
        if(args.Length!=2 || File.Exists(args[1]))throw new ArgumentException("Checked input and new diagnostic output required.");
        var input=Json.Deserialize<Dictionary<string,object>>(File.ReadAllText(args[0]));
        Height=Number(input,"height");Top=Number(input,"top");Radius=Number(input,"radius");
        HR=Number(input,"rayleighHeight");HM=Number(input,"mieHeight");G=Number(input,"g");Albedo=Number(input,"albedo");
        ReferenceDistance=Number(input,"referenceDistance");SourceScale=Number(input,"sourceScale");
        BetaR=Numbers(input["betaR"]);BetaM=Numbers(input["betaM"]);Irradiance=Numbers(input["irradiance"]);
        Z=Numbers(input["altitudes"]);Rho=Numbers(input["radial"]);OutMu=Numbers(input["outgoingMu"]);
        Intervals=Convert.ToInt32(input["intervals"]);IncomingPhiOffset=Number(input,"phiOffset");
        Piecewise=(string)input["pathRule"]=="piecewise-gauss-v1";
        if(!Piecewise || IncomingPhiOffset!=0.5 || BetaR.Length!=15 || BetaM.Length!=15 || Irradiance.Length!=15)throw new ArgumentException("Unsupported diagnostic policy.");
        BuildGaussRule(Intervals/30);
        var cases=((System.Collections.IEnumerable)input["diagnosticCases"]).Cast<Dictionary<string,object>>().ToArray();
        var groups=Enumerable.Range(0,cases.Length).GroupBy(i=>Convert.ToInt32(cases[i]["channel"])+":"+String.Join(",",Numbers(cases[i]["point"]).Select(v=>v.ToString("R",CultureInfo.InvariantCulture)))).ToArray();
        var levels=((System.Collections.IEnumerable)input["diagnosticLevels"]).Cast<Dictionary<string,object>>().ToArray();
        var measurements=new List<object>();var watch=Stopwatch.StartNew();
        foreach(var level in levels) {
            Mu=Numbers(level["mu"]);MuWeights=Numbers(level["muWeights"]);Phi=Convert.ToInt32(level["phi"]);IncomingCount=checked(Mu.Length*Phi);
            if(Mu.Length!=MuWeights.Length || Phi<8 || Phi%2!=0 || MuWeights.Any(v=>v<=0 || Double.IsNaN(v) || Double.IsInfinity(v)))throw new ArgumentException("Invalid incoming grid.");
            var azimuth=level.ContainsKey("azimuth") ? ((System.Collections.IEnumerable)level["azimuth"]).Cast<Dictionary<string,object>>().ToArray() : null;
            if(azimuth!=null && (azimuth.Length!=Phi || azimuth.Any(t=>Number(t,"weight")<=0 || Double.IsNaN(Number(t,"weight")) || Double.IsInfinity(Number(t,"weight")) || Number(t,"phi")<0 || Number(t,"phi")>=2*Math.PI)))throw new ArgumentException("Invalid positive azimuth rule.");
            var values=new double[cases.Length];
            Parallel.ForEach(groups,new ParallelOptions {MaxDegreeOfParallelism=4},group=>{
                int first=group.First(),c=Convert.ToInt32(cases[first]["channel"]);var p=Numbers(cases[first]["point"]);
                if(p.Length!=3 || c<0 || c>=15)throw new ArgumentException("Invalid diagnostic point/channel.");
                var incoming=azimuth==null ? PointIncoming(null,p,c) : DiagnosticIncoming(p,c,azimuth);
                foreach(int i in group) {
                    var d=Numbers(cases[i]["direction"]);
                    if(d.Length!=3)throw new ArgumentException("Invalid diagnostic direction.");
                    values[i]=azimuth==null ? QueryScatter(incoming,p,d,c) : DiagnosticScatter(incoming,p,d,c,azimuth);
                    if(values[i]<0 || Double.IsNaN(values[i]) || Double.IsInfinity(values[i]))throw new ArithmeticException("Invalid diagnostic scattering.");
                }
            });
            measurements.Add(new {name=(string)level["name"],polarCount=Mu.Length,azimuthCount=Phi,values=values});
            Console.WriteLine("primary angular "+level["name"]);
        }
        File.WriteAllText(args[1],Json.Serialize(new {schema="native-primary-angular-v1",measurements=measurements,elapsedMilliseconds=watch.Elapsed.TotalMilliseconds,maximumPathSamples=MaximumPathSamples}));
    }

    /// <summary>Compute continuous primary incoming values once per point/channel using unchanged frozen physical helpers.</summary>
    private static double[] DiagnosticIncoming(double[] p,int c,Dictionary<string,object>[] azimuth) {
        var incoming=new double[IncomingCount];int index=0;
        for(int polar=0;polar<Mu.Length;polar++) {
            double dz=Mu[polar],horizontal=Math.Sqrt(1-dz*dz);
            foreach(var tap in azimuth) {
                double phi=Number(tap,"phi");
                incoming[index++]=Radiance(null,p[0],p[1],p[2],horizontal*Math.Cos(phi),horizontal*Math.Sin(phi),dz,c);
            }
        }return incoming;
    }

    /// <summary>Apply each outgoing direction's original phase equations separately to the shared incoming values and positive weights.</summary>
    private static double DiagnosticScatter(double[] incoming,double[] p,double[] d,int c,Dictionary<string,object>[] azimuth) {
        double r=BetaR[c]*Math.Exp(-p[2]/HR),m=Albedo*BetaM[c]*Math.Exp(-p[2]/HM),sum=0;
        int index=0;
        for(int polar=0;polar<Mu.Length;polar++) {
            double dz=Mu[polar],horizontal=Math.Sqrt(1-dz*dz);
            foreach(var tap in azimuth) {
                double phi=Number(tap,"phi"),dx=horizontal*Math.Cos(phi),dy=horizontal*Math.Sin(phi),dot=d[0]*dx+d[1]*dy+d[2]*dz;
                sum+=incoming[index++]*MuWeights[polar]*Number(tap,"weight")*(r*PhaseR(dot)+m*PhaseM(dot));
            }
        }return sum;
    }
