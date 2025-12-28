$content = Get-Content "src\App.tsx" -Raw
$content = $content -replace '<RoleGuard>', '' -replace '</RoleGuard>', ''
Set-Content "src\App.tsx" -Value $content -NoNewline
Write-Host "Removed all RoleGuard wrappers"
