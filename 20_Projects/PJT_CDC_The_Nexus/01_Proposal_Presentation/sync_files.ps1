Get-ChildItem -Path "C:\99_Develop\SynologyDrive\20_Projects\PJT_CDC_The_Nexus" -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
    if (!$_.PSIsContainer) {
        try {
            [System.IO.File]::OpenRead($_.FullName).Close()
        } catch {
            # 에러 무시
        }
    }
}
