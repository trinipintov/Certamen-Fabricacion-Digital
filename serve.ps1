param([int]$Port = 3000)

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "     SMART GLASSES POV - Servidor Local WebXR                " -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

$listener = $null
$started = $false
$currentPort = $Port

# Probar puertos automáticos si el inicial está ocupado
while (-not $started -and $currentPort -lt ($Port + 10)) {
    try {
        $listener = New-Object System.Net.HttpListener
        $listener.Prefixes.Add("http://localhost:$currentPort/")
        $listener.Prefixes.Add("http://127.0.0.1:$currentPort/")
        $listener.Start()
        $started = $true
    } catch [System.Net.HttpListenerException] {
        $listener.Close()
        $currentPort++
    }
}

if (-not $started) {
    Write-Host "[ERROR] No se pudo encontrar un puerto libre entre $Port y $($Port + 10)." -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Servidor iniciado en: " -NoNewline -ForegroundColor Green
Write-Host "http://localhost:$currentPort/" -ForegroundColor Yellow
Write-Host ""
Write-Host "Archivos servidos desde: $Root" -ForegroundColor Gray
Write-Host ""
Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor DarkGray
Write-Host ""

$mimeTypes = @{
    '.html' = 'text/html; charset=utf-8'
    '.js'   = 'application/javascript; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.json' = 'application/json'
    '.glb'  = 'model/gltf-binary'
    '.gltf' = 'model/gltf+json'
    '.obj'  = 'text/plain'
    '.mtl'  = 'text/plain'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.gif'  = 'image/gif'
    '.svg'  = 'image/svg+xml'
    '.ico'  = 'image/x-icon'
    '.woff' = 'font/woff'
    '.woff2' = 'font/woff2'
    '.ttf'  = 'font/ttf'
    '.mp3'  = 'audio/mpeg'
    '.wav'  = 'audio/wav'
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $path = $request.Url.LocalPath
        if ($path -eq '/') { $path = '/index.html' }

        $filePath = Join-Path $Root $path
        $fullPath = [System.IO.Path]::GetFullPath($filePath)
        $fullRoot = [System.IO.Path]::GetFullPath($Root)
        if (-not $fullPath.StartsWith($fullRoot)) {
            $response.StatusCode = 403
            $response.Close()
            continue
        }

        if (Test-Path $filePath -PathType Leaf) {
            $extension = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = $mimeTypes[$extension]
            if (-not $contentType) { $contentType = 'application/octet-stream' }

            $content = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentType = $contentType
            $response.ContentLength64 = $content.Length
            $response.Headers.Add('Access-Control-Allow-Origin', '*')
            $response.OutputStream.Write($content, 0, $content.Length)

            Write-Host "[$($request.HttpMethod)] $path - 200 OK" -ForegroundColor DarkGray
        } else {
            $response.StatusCode = 404
            $errorMessage = "404 - Archivo no encontrado: $path"
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($errorMessage)
            $response.ContentType = 'text/plain; charset=utf-8'
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)

            Write-Host "[$($request.HttpMethod)] $path - 404 Not Found" -ForegroundColor Red
        }

        $response.Close()
    }
}
catch {
    Write-Host ""
    Write-Host "[INFO] $($_.Exception.Message)" -ForegroundColor DarkGray
}
finally {
    if ($listener -and $listener.IsListening) {
        $listener.Stop()
        $listener.Close()
        Write-Host ""
        Write-Host "Servidor detenido." -ForegroundColor Yellow
    }
}
