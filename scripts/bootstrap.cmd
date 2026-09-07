@echo off
setlocal
set "DESKTOP_REPAIR_ROOT=%~dp0.."
set "DESKTOP_REPAIR_ARGS=%*"
powershell.exe -NoLogo -NoProfile -NonInteractive -Command "$ErrorActionPreference='Stop';try{$m=Get-Content -LiteralPath (Join-Path $env:DESKTOP_REPAIR_ROOT 'patch-manifest.json') -Raw -Encoding UTF8|ConvertFrom-Json;$d=Join-Path $env:LOCALAPPDATA 'ChatGPT-PerformanceFix\tools';$n=Join-Path $d ('node-'+$m.bundledNodeSHA256.Substring(0,12)+'.exe');if(!(Test-Path -LiteralPath $n)){$p=Get-AppxPackage -Name OpenAI.Codex|Select-Object -First 1;if(!$p){throw 'Official client is not installed'};$s=Join-Path $p.InstallLocation 'app\resources\cua_node\bin\node.exe';if((Get-FileHash -LiteralPath $s).Hash -ne $m.bundledNodeSHA256){throw 'Unsupported client runtime'};New-Item -ItemType Directory -Path $d -Force|Out-Null;Copy-Item -LiteralPath $s -Destination $n};if((Get-FileHash -LiteralPath $n).Hash -ne $m.bundledNodeSHA256){throw 'Runtime integrity check failed'};& $n (Join-Path $env:DESKTOP_REPAIR_ROOT 'scripts\installer.cjs');exit $LASTEXITCODE}catch{Write-Error $_;exit 1}"
exit /b %errorlevel%

