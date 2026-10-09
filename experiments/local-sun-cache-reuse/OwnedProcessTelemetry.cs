using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.Linq;
using System.Runtime.InteropServices;
using System.Web.Script.Serialization;

/// <summary>Read a Toolhelp process snapshot and memory of only the wrapper, collector and owned child tree; never manage processes or write files.</summary>
internal static class OwnedProcessTelemetry {
    [StructLayout(LayoutKind.Sequential,CharSet=CharSet.Unicode)]
    private struct Entry {
        public uint Size,Usage,Pid;
        public UIntPtr DefaultHeap;
        public uint Module,Threads,Parent;
        public int Priority;
        public uint Flags;
        [MarshalAs(UnmanagedType.ByValTStr,SizeConst=260)] public string Name;
    }
    [StructLayout(LayoutKind.Sequential)]
    private struct Counters {
        public uint Size,Faults;
        public UIntPtr PeakWorking,Working,PeakPaged,Paged,PeakNonpaged,Nonpaged,Pagefile,PeakPagefile,Private;
    }
    [DllImport("kernel32.dll",SetLastError=true)] private static extern IntPtr CreateToolhelp32Snapshot(uint flags,uint pid);
    [DllImport("kernel32.dll",EntryPoint="Process32FirstW",CharSet=CharSet.Unicode,SetLastError=true)] private static extern bool First(IntPtr snapshot,ref Entry entry);
    [DllImport("kernel32.dll",EntryPoint="Process32NextW",CharSet=CharSet.Unicode,SetLastError=true)] private static extern bool Next(IntPtr snapshot,ref Entry entry);
    [DllImport("kernel32.dll",SetLastError=true)] private static extern IntPtr OpenProcess(uint rights,bool inherit,uint pid);
    [DllImport("kernel32.dll",SetLastError=true)] private static extern bool GetExitCodeProcess(IntPtr handle,out uint code);
    [DllImport("psapi.dll",SetLastError=true)] private static extern bool GetProcessMemoryInfo(IntPtr handle,ref Counters counters,uint bytes);
    [DllImport("kernel32.dll",SetLastError=true)] private static extern bool CloseHandle(IntPtr handle);

    /// <summary>Validate two live-owner identifiers, enumerate parent links, and emit only measured owned PIDs and byte totals.</summary>
    public static void Main(string[] args) {
        int root,wrapper;
        if(args.Length!=2 || !Int32.TryParse(args[0],out root) || root<=0 || !Int32.TryParse(args[1],out wrapper) || wrapper<=0)throw new ArgumentException("Positive child and wrapper PIDs required.");
        var watch=Stopwatch.StartNew();var parents=new Dictionary<uint,uint>();
        var snapshot=CreateToolhelp32Snapshot(2,0);
        if(snapshot==new IntPtr(-1))throw new Win32Exception(Marshal.GetLastWin32Error());
        try {
            var entry=new Entry {Size=(uint)Marshal.SizeOf(typeof(Entry))};
            if(!First(snapshot,ref entry))throw new Win32Exception(Marshal.GetLastWin32Error());
            do {parents[entry.Pid]=entry.Parent;entry.Size=(uint)Marshal.SizeOf(typeof(Entry));}while(Next(snapshot,ref entry));
            int error=Marshal.GetLastWin32Error();if(error!=18)throw new Win32Exception(error);
        } finally {CloseHandle(snapshot);}
        var owned=new HashSet<uint> {(uint)root};bool changed;
        do {changed=false;foreach(var pair in parents)if(owned.Contains(pair.Value) && owned.Add(pair.Key))changed=true;}while(changed);
        owned.Add((uint)wrapper);owned.Add((uint)Process.GetCurrentProcess().Id);
        long privateBytes=0,workingBytes=0;var measured=new List<uint>();
        foreach(uint pid in owned.OrderBy(id=>id)) {
            var handle=OpenProcess(0x1000,false,pid);
            if(handle==IntPtr.Zero){int error=Marshal.GetLastWin32Error();if(error==87)continue;throw new Win32Exception(error,"Cannot inspect owned PID "+pid);}
            try {
                var counters=new Counters {Size=(uint)Marshal.SizeOf(typeof(Counters))};
                if(!GetProcessMemoryInfo(handle,ref counters,counters.Size)) {
                    int error=Marshal.GetLastWin32Error();uint exit;
                    if(GetExitCodeProcess(handle,out exit) && exit!=259)continue;
                    throw new Win32Exception(error,"Cannot read owned memory for PID "+pid);
                }
                privateBytes=checked(privateBytes+(long)counters.Private.ToUInt64());workingBytes=checked(workingBytes+(long)counters.Working.ToUInt64());measured.Add(pid);
            } finally {CloseHandle(handle);}
        }
        if(!measured.Contains((uint)wrapper))throw new InvalidOperationException("Live wrapper memory was not measured.");
        Console.WriteLine(new JavaScriptSerializer().Serialize(new {schema="win32-owned-tree-resource-v1",privateBytes=privateBytes,workingSetBytes=workingBytes,pids=measured.ToArray(),collectorMilliseconds=watch.Elapsed.TotalMilliseconds}));
    }
}
