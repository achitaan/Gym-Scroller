# Run this script as Administrator to allow Node.js through Windows Firewall

Write-Host "Adding firewall rules for Node.js..." -ForegroundColor Green

# Find all Node.js executables
$nodePaths = @(
    "C:\Program Files\nodejs\node.exe",
    "C:\Program Files (x86)\nodejs\node.exe"
)

foreach ($nodePath in $nodePaths) {
    if (Test-Path $nodePath) {
        Write-Host "Found Node.js at: $nodePath" -ForegroundColor Yellow
        
        # Remove old rules if they exist
        Remove-NetFirewallRule -DisplayName "Node.js Server*" -ErrorAction SilentlyContinue
        
        # Add inbound rule
        New-NetFirewallRule -DisplayName "Node.js Server (Inbound)" -Direction Inbound -Program $nodePath -Action Allow -Profile Any -ErrorAction SilentlyContinue
            
        Write-Host "Added firewall rule for Node.js" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Firewall configured! Now restart your frontend:" -ForegroundColor Green
Write-Host "  cd frontend" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor Cyan
