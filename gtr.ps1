<#
.SYNOPSIS
    Git Worktree Runner (gtr) - PowerShell native wrapper for managing git worktrees in EcoTrack.
.DESCRIPTION
    Wraps native git worktree commands with convenient helpers for parallel branch development,
    AI agent isolation, and environment consistency.
.EXAMPLE
    .\gtr.ps1 new feature/report-modal
    .\gtr.ps1 list
    .\gtr.ps1 run feature/report-modal git status
    .\gtr.ps1 rm feature/report-modal
#>

param(
    [Parameter(Position = 0)]
    [string]$Command = "help",

    [Parameter(Position = 1)]
    [string]$Target,

    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$ExtraArgs
)

$WorktreeBaseDir = Join-Path $PSScriptRoot ".worktrees"

function Show-Help {
    Write-Host "`nEcoTrack Git Worktree Runner (gtr)" -ForegroundColor Green
    Write-Host "Usage: .\gtr.ps1 <command> [arguments]`n" -ForegroundColor Cyan
    Write-Host "Commands:"
    Write-Host "  new <branch>       Create a new isolated worktree and branch under .worktrees/"
    Write-Host "  list               List all active git worktrees"
    Write-Host "  go <branch>        Print the absolute path to a worktree"
    Write-Host "  run <branch> <cmd> Run a shell command inside a worktree"
    Write-Host "  rm <branch>        Safely remove a worktree and clean up references"
    Write-Host "  help               Display this help text"
    Write-Host ""
}

function Sanitize-BranchName([string]$name) {
    return $name -replace '[\\/:]', '-' -replace '[^a-zA-Z0-9_\-\.]', ''
}

switch ($Command.ToLower()) {
    "new" {
        if (-not $Target) {
            Write-Error "Branch name required: .\gtr.ps1 new <branch-name>"
            exit 1
        }
        $folderName = Sanitize-BranchName $Target
        $targetDir = Join-Path $WorktreeBaseDir $folderName

        if (-not (Test-Path $WorktreeBaseDir)) {
            New-Item -ItemType Directory -Path $WorktreeBaseDir -Force | Out-Null
        }

        Write-Host "==> Creating worktree for branch '$Target' at '$targetDir'..." -ForegroundColor Cyan
        
        # Check if branch exists
        $branchExists = git branch --list $Target
        if ($branchExists) {
            git worktree add $targetDir $Target
        } else {
            git worktree add -b $Target $targetDir
        }

        if ($LASTEXITCODE -eq 0) {
            Write-Host "==> Worktree ready! Path: $targetDir" -ForegroundColor Green
        }
    }

    "list" {
        Write-Host "==> Active Git Worktrees:" -ForegroundColor Cyan
        git worktree list
    }

    "go" {
        if (-not $Target) {
            Write-Error "Branch name required: .\gtr.ps1 go <branch-name>"
            exit 1
        }
        $folderName = Sanitize-BranchName $Target
        $targetDir = Join-Path $WorktreeBaseDir $folderName
        if (Test-Path $targetDir) {
            Write-Output $targetDir
        } else {
            # Try git worktree list lookup
            $lines = git worktree list --porcelain
            $found = $null
            for ($i = 0; $i -lt $lines.Length; $i++) {
                if ($lines[$i] -match "^branch refs/heads/$Target$") {
                    $found = $lines[$i - 1] -replace "^worktree ", ""
                    break
                }
            }
            if ($found) { Write-Output $found } else { Write-Error "Worktree for '$Target' not found." }
        }
    }

    "run" {
        if (-not $Target -or -not $ExtraArgs) {
            Write-Error "Usage: .\gtr.ps1 run <branch-name> <command> [args...]"
            exit 1
        }
        $folderName = Sanitize-BranchName $Target
        $targetDir = Join-Path $WorktreeBaseDir $folderName
        if (-not (Test-Path $targetDir)) {
            Write-Error "Worktree directory does not exist: $targetDir"
            exit 1
        }
        Push-Location $targetDir
        try {
            $cmdLine = ($ExtraArgs -join " ")
            Write-Host "==> Running in ${targetDir}: $cmdLine" -ForegroundColor DarkGray
            Invoke-Expression $cmdLine
        } finally {
            Pop-Location
        }
    }

    "rm" {
        if (-not $Target) {
            Write-Error "Branch or worktree path required: .\gtr.ps1 rm <branch-name>"
            exit 1
        }
        $folderName = Sanitize-BranchName $Target
        $targetDir = Join-Path $WorktreeBaseDir $folderName
        if (-not (Test-Path $targetDir)) {
            $targetDir = $Target
        }
        Write-Host "==> Removing worktree '$targetDir'..." -ForegroundColor Yellow
        git worktree remove $targetDir --force
        if ($LASTEXITCODE -eq 0) {
            Write-Host "==> Worktree removed successfully." -ForegroundColor Green
        }
    }

    Default {
        Show-Help
    }
}
