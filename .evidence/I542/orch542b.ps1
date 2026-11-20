$ErrorActionPreference = 'Continue'
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
# --- A. dev :5173 -> causal483 + playframe491 + playframe483
Kill-Port 5173
$s2 = Start-Process -FilePath node -ArgumentList 'scripts/serve.mjs','5173' -WorkingDirectory 'E:\Game' -WindowStyle Hidden -PassThru
Write-Output ('S2 dev5173 pid=' + $s2.Id + ' up=' + (Wait-Port 5173))
node .evidence/I483/causal483.mjs 2>&1 | Tee-Object -FilePath .evidence/I542/causal483_542.out
Write-Output ('A causal483 exit=' + $LASTEXITCODE)
node .evidence/I491/playframe491.mjs 2>&1 | Tee-Object -FilePath .evidence/I542/playframe491_542.out
Write-Output ('A playframe491 exit=' + $LASTEXITCODE)
node .evidence/I483/playframe483.mjs 2>&1 | Tee-Object -FilePath .evidence/I542/playframe483_542.out
Write-Output ('A playframe483 exit=' + $LASTEXITCODE)
Stop-Process -Id $s2.Id -Force -ErrorAction SilentlyContinue
Write-Output ('S2 refused=' + (Refused 5173))
# --- B. dist :5199 -> pwa491
Kill-Port 5199
$s3 = Start-Process -FilePath node -ArgumentList 'scripts/serve.mjs','5199','dist' -WorkingDirectory 'E:\Game' -WindowStyle Hidden -PassThru
Write-Output ('S3 dist5199 pid=' + $s3.Id + ' up=' + (Wait-Port 5199))
node .evidence/I491/pwa491.mjs 2>&1 | Tee-Object -FilePath .evidence/I542/pwa491_542.out
Write-Output ('B pwa491 exit=' + $LASTEXITCODE)
Stop-Process -Id $s3.Id -Force -ErrorAction SilentlyContinue
Write-Output ('S3 refused=' + (Refused 5199))
# --- final hygiene: all 4 ports refused
Start-Sleep -Milliseconds 500
Write-Output ('FINAL refused 4200=' + (Refused 4200) + ' 5173=' + (Refused 5173) + ' 5199=' + (Refused 5199) + ' 4173=' + (Refused 4173))
Write-Output 'ORCH542B_DONE'
