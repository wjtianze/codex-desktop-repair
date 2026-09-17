'use strict';
const APP_ID='Wjtianze.CodexDesktopRepair';
const source=String.raw`
using System;
using System.Runtime.InteropServices;
public static class RepairShortcutIdentity {
 [StructLayout(LayoutKind.Sequential)] struct Key { public Guid group; public uint id; }
 [StructLayout(LayoutKind.Explicit,Size=24)] struct Value { [FieldOffset(0)] public ushort type; [FieldOffset(8)] public IntPtr text; }
 [ComImport,Guid("886D8EEB-8CF2-4446-8D02-CDBA1DBDCF99"),InterfaceType(ComInterfaceType.InterfaceIsIUnknown)] interface Store {
  [PreserveSig] int GetCount(out uint count); [PreserveSig] int GetAt(uint index,out Key key); [PreserveSig] int GetValue(ref Key key,out Value value); [PreserveSig] int SetValue(ref Key key,ref Value value); [PreserveSig] int Commit();
 }
 [DllImport("shell32.dll",CharSet=CharSet.Unicode)] static extern int SHGetPropertyStoreFromParsingName(string name,IntPtr context,uint flags,ref Guid iid,out Store store);
 [DllImport("shell32.dll")] static extern int SHGetPropertyStoreForWindow(IntPtr window,ref Guid iid,out Store store);
 [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr window,out uint pid);
 [DllImport("ole32.dll")] static extern int PropVariantClear(ref Value value);
 static void Text(Store s,uint id,string text){var k=new Key{group=new Guid("9F4C2855-9F79-4B39-A8D0-E1D42DE1D5F3"),id=id};var v=new Value{type=31,text=Marshal.StringToCoTaskMemUni(text)};try{Marshal.ThrowExceptionForHR(s.SetValue(ref k,ref v));}finally{PropVariantClear(ref v);}}
 public static void Window(long handle,int expectedPid,string appId,string command,string icon,string name){uint pid;GetWindowThreadProcessId(new IntPtr(handle),out pid);if(pid!=expectedPid)throw new InvalidOperationException("Window owner changed");var iid=typeof(Store).GUID;Store s;Marshal.ThrowExceptionForHR(SHGetPropertyStoreForWindow(new IntPtr(handle),ref iid,out s));try{Text(s,2,command);Text(s,3,icon);Text(s,4,name);Text(s,5,appId);Marshal.ThrowExceptionForHR(s.Commit());}finally{Marshal.ReleaseComObject(s);}}
 public static void Set(string file,string appId){var iid=typeof(Store).GUID;Store s;Marshal.ThrowExceptionForHR(SHGetPropertyStoreFromParsingName(file,IntPtr.Zero,2,ref iid,out s));try{var k=new Key{group=new Guid("9F4C2855-9F79-4B39-A8D0-E1D42DE1D5F3"),id=5};var v=new Value{type=31,text=Marshal.StringToCoTaskMemUni(appId)};try{Marshal.ThrowExceptionForHR(s.SetValue(ref k,ref v));Marshal.ThrowExceptionForHR(s.Commit());}finally{PropVariantClear(ref v);}}finally{Marshal.ReleaseComObject(s);}}
}`;
module.exports={APP_ID,source};
