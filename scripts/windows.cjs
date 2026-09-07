'use strict';
const {spawnSync}=require('node:child_process'),path=require('node:path');
function powershell(code,extraEnv={}){
 const command="[Console]::OutputEncoding=[System.Text.UTF8Encoding]::new($false);$ErrorActionPreference='Stop';"+code;
 const result=spawnSync(path.join(process.env.SystemRoot,'System32','WindowsPowerShell','v1.0','powershell.exe'),['-NoLogo','-NoProfile','-NonInteractive','-Command',command],{encoding:'utf8',env:{...process.env,...extraEnv},maxBuffer:4*1024*1024});
 if(result.error)throw result.error;
 if(result.status!==0)throw Error((result.stderr||result.stdout||'Windows 查询失败').trim());
 return result.stdout.replace(/^\uFEFF/,'').trim();
}
function packageInfo(){const text=powershell("Get-AppxPackage -Name OpenAI.Codex | Select-Object -First 1 Name,@{Name='Version';Expression={[string]$_.Version}},@{Name='Architecture';Expression={[string]$_.Architecture}},InstallLocation,PackageFamilyName,PackageFullName | ConvertTo-Json -Compress");return text?JSON.parse(text):null}
function runningClients(){const text=powershell("ConvertTo-Json -Compress -InputObject @(Get-CimInstance Win32_Process -Filter \"Name='ChatGPT.exe'\" | Select-Object ProcessId,ExecutablePath)");return text?JSON.parse(text):[]}
function signature(file){return powershell("(Get-AuthenticodeSignature -LiteralPath $env:DESKTOP_REPAIR_VERIFY_FILE).Status.ToString()",{DESKTOP_REPAIR_VERIFY_FILE:file})}
function shortcut(file,target,icon){powershell("$s=New-Object -ComObject WScript.Shell;$l=$s.CreateShortcut($env:DESKTOP_REPAIR_SHORTCUT);$l.TargetPath=$env:DESKTOP_REPAIR_TARGET;$l.WorkingDirectory=Split-Path -Parent $env:DESKTOP_REPAIR_TARGET;$l.IconLocation=$env:DESKTOP_REPAIR_ICON+',0';$l.WindowStyle=1;$l.Description='ChatGPT';$l.Save()",{DESKTOP_REPAIR_SHORTCUT:file,DESKTOP_REPAIR_TARGET:target,DESKTOP_REPAIR_ICON:icon})}
module.exports={powershell,packageInfo,runningClients,signature,shortcut};

