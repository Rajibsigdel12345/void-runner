$ErrorActionPreference = "Stop"
$layout = "0_0|w0_0|w0+w1_0|0_h0|w0_h0|w0+w1_h0"
$views = @("f34","front","back","side","top")
foreach ($a in @("hunter","gunship","sentry","wasp")) {
  foreach ($m in @("clay","tint")) {
    $ins = @()
    foreach ($v in $views) { $ins += "-i"; $ins += "aud_${a}_${v}_${m}.png" }
    $ins += "-i"; $ins += "aud_${a}_front_sil96.png"
    $f = "[0][1][2][3][4][5]xstack=inputs=6:layout=$layout"
    ffmpeg -y -loglevel error @ins -lavfi $f -frames:v 1 "sheet_${a}_${m}.png" | Out-Null
  }
  $f2 = "[0][1]hstack=inputs=2:longest=1"
  ffmpeg -y -loglevel error -i "aud_${a}_front_sil96.png" -i "aud_${a}_back_sil96.png" -lavfi $f2 -frames:v 1 "sheet_${a}_sil.png" | Out-Null
}
Get-ChildItem sheet_*.png | Select-Object Name, Length, LastWriteTime