$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$outDir = "$PWD\public\icons"
if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force }

function Generate-Icon([int]$size, [string]$outFile, [bool]$isMaskable) {
    $scale = if ($isMaskable) { 0.50 } else { 0.62 }
    $innerOffset = $size * (1.0 - $scale) / 2.0
    
    $svg = @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 $size $size" width="$size" height="$size">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FAF8F5"/>
      <stop offset="100%" stop-color="#F2EDE4"/>
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#5A4A3E" flood-opacity="0.12"/>
    </filter>
  </defs>

  <rect width="$size" height="$size" fill="url(#bgGrad)"/>
  
  <g transform="translate($innerOffset, $innerOffset) scale($($scale * ($size / 300.0)))" filter="url(#softShadow)">
    <path d="M70 155 C70 45, 230 45, 230 155" fill="none" stroke="#716D66" stroke-width="16" stroke-linecap="round"/>
    <path d="M150 85 C115 62, 95 105, 150 132 C205 105, 185 62, 150 85 Z" fill="#26593F"/>
    <path d="M150 90 L150 132" stroke="#1D4330" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="188" cy="112" r="9" fill="#D97706"/>
    <path d="M40 160 C40 245, 90 275, 150 275 C210 275, 260 245, 260 160 Z" fill="#D9532F"/>
    <path d="M30 160 Q150 144 270 160 Q150 176 30 160 Z" fill="#BF3F1D"/>
  </g>
</svg>
"@

    $html = @"
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${size}px; height: ${size}px; overflow: hidden; background: #FAF8F5; }
  svg { display: block; width: ${size}px; height: ${size}px; }
</style>
</head>
<body>
$svg
</body>
</html>
"@

    $tempHtml = "$PWD\temp_gen_${size}.html"
    Set-Content -Path $tempHtml -Value $html -Encoding utf8
    $url = "file:///" + ($tempHtml -replace '\\', '/')
    
    $args = @(
        "--headless=new",
        "--disable-gpu",
        "--window-size=${size},${size}",
        "--hide-scrollbars",
        "--screenshot=$outFile",
        $url
    )
    
    $proc = Start-Process $edgePath -ArgumentList $args -PassThru -Wait
    Remove-Item -Path $tempHtml -Force -ErrorAction SilentlyContinue
    
    if (Test-Path $outFile) {
        $len = (Get-Item $outFile).Length
        Write-Host "Criado: $outFile ($len bytes)"
    } else {
        Write-Error "Falha: $outFile"
    }
}

Write-Host "Gerando icones..."

# 1. Apple Touch Icon (180x180 png para iOS Safari)
Generate-Icon -size 180 -outFile "$PWD\public\apple-touch-icon.png" -isMaskable $false
Copy-Item "$PWD\public\apple-touch-icon.png" "$PWD\public\icons\apple-touch-icon.png" -Force

# 2. PWA Standard 192x192
Generate-Icon -size 192 -outFile "$PWD\public\icons\icon-192.png" -isMaskable $false

# 3. PWA Standard 512x512
Generate-Icon -size 512 -outFile "$PWD\public\icons\icon-512.png" -isMaskable $false

# 4. PWA Maskable 512x512
Generate-Icon -size 512 -outFile "$PWD\public\icons\icon-maskable-512.png" -isMaskable $true

# 5. Favicons
Generate-Icon -size 32 -outFile "$PWD\public\favicon-32x32.png" -isMaskable $false
Generate-Icon -size 16 -outFile "$PWD\public\favicon-16x16.png" -isMaskable $false
Copy-Item "$PWD\public\favicon-32x32.png" "$PWD\public\favicon.png" -Force

Write-Host "Concluido!"
