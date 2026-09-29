param([Parameter(Mandatory)] [string] $JsonPath, [Parameter(Mandatory)] [string] $OutPath)

$json = Get-Content $JsonPath -Raw | ConvertFrom-Json
$data = if ($json.data) { $json.data } else { $json.result.data }
[IO.File]::WriteAllBytes($OutPath, [Convert]::FromBase64String($data))
$OutPath
