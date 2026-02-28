$url = "https://github.com/protocolbuffers/protobuf/releases/download/v3.24.0/protoc-3.24.0-win64.zip"
$zip = "protoc.zip"
$out = "protoc-bin"
Invoke-WebRequest -Uri $url -OutFile $zip
Expand-Archive -Path $zip -DestinationPath $out -Force
Write-Host "Done! protoc.exe is at: $out\bin\protoc.exe"
