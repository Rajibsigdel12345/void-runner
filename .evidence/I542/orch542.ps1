$ErrorActionPreference = 'Stop'
Set-Location E:\Game
function Wait-Port([int]$port, [int]$timeoutSec = 20) {
  $sw = [Diagnostics.Stopwatch]::StartNew()
  while ($sw.ElapsedSeconds -lt $timeoutSec) {
    try { $c = New-Object Net.Sockets.TcpClient; $c.Connect('127.0.0.1', $port); $c.Close(); return $true } catch { Start-Sleep -Milliseconds 400 }
  }
  return $false
}
function Kill-Port([int]$port) {
  Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
  Start-Sleep -Milliseconds 500
}
function Refused([int]$port) {
  try { $c = New-Object Net.Sockets.TcpClient; $c.Connect('127.0.0.1', $port); $c.Close(); return $false } catch { return $true }
}
# --- 1. causal495 + causal483 (dist :4200)
Kill-Port 4200
$s1 = Start-Process -FilePath node -ArgumentList 'scripts/serve.mjs','4200','dist' -WorkingDirectory 'E:\Game' -WindowStyle Hidden -PassThru
Write-Output ('S1 dist4200 pid=' + $s1.Id + ' up=' + (Wait-Port 4200))
node .evidence/I495/causal495.mjs 2>&1 | Tee-Object -FilePath .evidence/I542/causal495_542.out
Write-Output ('S1 causal495 exit=' + $LASTEXITCODE)
node .evidence/I483/causal483.mjs 2>&1 | Tee-Object -FilePath .evidence/I542/causal483_542.out
Write-Output ('S1 causal483 exit=' + $LASTEXITCODE)
Stop-Process -Id $s1.Id -Force -ErrorAction SilentlyContinue
Write-Output ('S1 refused=' + (Refused 4200))
# --- 2. playframe491 + playframe483 (dev :5173)
Kill-Port 5173
$s2 = Start-Process -FilePath node -ArgumentList 'scripts/serve.mjs','5173' -WorkingDirectory 'E:\Game' -WindowStyle Hidden -PassThru
Write-Output ('S2 dev5173 pid=' + $s2.Id + ' up=' + (Wait-Port 5173))
node .evidence/I491/playframe491.mjs 2>&1 | Tee-Object -FilePath .evidence/I542/playframe491_542.out
Write-Output ('S2 playframe491 exit=' + $LASTEXITCODE)
node .evidence/I483/playframe483.mjs 2>&1 | Tee-Object -FilePath .evidence/I542/playframe483_542.out
Write-Output ('S2 playframe483 exit=' + $LASTEXITCODE)
Stop-Process -Id $s2.Id -Force -ErrorAction SilentlyContinue
Write-Output ('S2 refused=' + (Refused 5173))
# --- 3. pwa491 (dist :5199)
Kill-Port 5199
$s3 = Start-Process -FilePath node -ArgumentList 'scripts/serve.mjs','5199','dist' -WorkingDirectory 'E:\Game' -WindowStyle Hidden -PassThru
Write-Output ('S3 dist5199 pid=' + $s3.Id + ' up=' + (Wait-Port 5199))
node .evidence/I491/pwa491.mjs 2>&1 | Tee-Object -FilePath .evidence/I542/pwa491_542.out
Write-Output ('S3 pwa exit=' + $LASTEXITCODE)
Stop-Process -Id $s3.Id -Force -ErrorAction SilentlyContinue
Write-Output ('S3 refused=' + (Refused 5199))
# --- final hygiene: all 4 ports refused
Start-Sleep -Milliseconds 500
Write-Output ('FINAL refused 4200=' + (Refused 4200) + ' 5173=' + (Refused 5173) + ' 5199=' + (Refused 5199) + ' 4173=' + (Refused 4173))
Write-Output 'ORCH542_DONE'
