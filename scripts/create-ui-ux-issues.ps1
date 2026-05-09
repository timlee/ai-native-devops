param(
  [string]$Repo = "",
  [string]$DraftDir = ".github/issue-drafts",
  [switch]$DryRun,
  [switch]$VerboseBodyPreview
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Require-Command {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command not found: $Name"
  }
}

function Invoke-Gh {
  param([string[]]$Args)
  if ([string]::IsNullOrWhiteSpace($Repo)) {
    & gh @Args
  } else {
    & gh @Args --repo $Repo
  }
}

function Ensure-Label {
  param(
    [string]$Name,
    [string]$Color,
    [string]$Description
  )

  Invoke-Gh @("label", "create", $Name, "--color", $Color, "--description", $Description, "--force") | Out-Null
}

function Show-DryRunLabel {
  param(
    [string]$Name,
    [string]$Color,
    [string]$Description
  )

  Write-Host ("[DRY-RUN] Would ensure label '{0}' (#{1}) - {2}" -f $Name, $Color, $Description)
}

function Resolve-BodyContent {
  param(
    [string]$Path,
    [hashtable]$IssueMap
  )

  $body = Get-Content -Path $Path -Raw -Encoding UTF8
  foreach ($key in $IssueMap.Keys) {
    $token = "[[{0}]]" -f $key
    $replacement = "#{0}" -f $IssueMap[$key]
    $body = $body.Replace($token, $replacement)
  }
  return $body
}

function New-Issue {
  param(
    [string]$Id,
    [string]$Title,
    [string[]]$Labels,
    [string]$BodyFile,
    [hashtable]$IssueMap
  )

  $fullBodyFile = Join-Path (Get-Location) $BodyFile
  if (-not (Test-Path -Path $fullBodyFile)) {
    throw "Draft file not found: $BodyFile"
  }

  $body = Resolve-BodyContent -Path $fullBodyFile -IssueMap $IssueMap
  $tmp = [System.IO.Path]::GetTempFileName()
  try {
    Set-Content -Path $tmp -Value $body -Encoding UTF8

    $labelArg = [string]::Join(",", $Labels)
    $output = Invoke-Gh @("issue", "create", "--title", $Title, "--label", $labelArg, "--body-file", $tmp)

    if (-not $output) {
      throw "Issue creation returned empty output for $Id"
    }

    $url = $output | Select-Object -Last 1
    if ($url -notmatch "/issues/(\d+)$") {
      throw "Unable to parse issue number from output: $url"
    }

    $number = [int]$Matches[1]
    $IssueMap[$Id] = $number
    Write-Host ("Created {0} -> #{1}" -f $Id, $number)
  }
  finally {
    Remove-Item -Path $tmp -ErrorAction SilentlyContinue
  }
}

function Show-DryRunIssue {
  param(
    [string]$Id,
    [string]$Title,
    [string[]]$Labels,
    [string]$BodyFile,
    [hashtable]$IssueMap,
    [int]$SyntheticNumber,
    [bool]$ShowFullBody
  )

  $fullBodyFile = Join-Path (Get-Location) $BodyFile
  if (-not (Test-Path -Path $fullBodyFile)) {
    throw "Draft file not found: $BodyFile"
  }

  $resolvedBody = Resolve-BodyContent -Path $fullBodyFile -IssueMap $IssueMap
  $unresolvedTokens = @((([regex]::Matches($resolvedBody, "\[\[UX-\d{2}\]\]") | ForEach-Object { $_.Value }) | Select-Object -Unique))

  Write-Host ("[DRY-RUN] Would create {0}" -f $Id)
  Write-Host ("          Title: {0}" -f $Title)
  Write-Host ("          Labels: {0}" -f ([string]::Join(", ", $Labels)))
  if ($unresolvedTokens.Count -gt 0) {
    Write-Host ("          Unresolved dependency tokens: {0}" -f ([string]::Join(", ", $unresolvedTokens)))
  } else {
    Write-Host "          Dependency tokens resolved."
  }

  if ($ShowFullBody) {
    Write-Host "          Full resolved body:"
    Write-Host "          -------------------"
    foreach ($line in ($resolvedBody -split "`r?`n")) {
      Write-Host ("          {0}" -f $line)
    }
    Write-Host "          -------------------"
  } else {
    $preview = $resolvedBody.Substring(0, [Math]::Min(220, $resolvedBody.Length)).Replace("`r", "").Replace("`n", " ")
    Write-Host ("          Body preview: {0}" -f $preview)
  }

  $IssueMap[$Id] = $SyntheticNumber
  Write-Host ("          Synthetic issue number: #{0}" -f $SyntheticNumber)
}

if (-not $DryRun) {
  Require-Command -Name "gh"

  # Verify authentication context before mutating repository issues.
  if (-not (& gh auth status *> $null)) {
    throw "gh is not authenticated. Run 'gh auth login' first."
  }
}

$labels = @(
  @{ Name = "ui-ux"; Color = "1f6feb"; Description = "UI/UX initiative" },
  @{ Name = "plan-phase"; Color = "0e8a16"; Description = "Lifecycle plan phase" },
  @{ Name = "story"; Color = "5319e7"; Description = "Backlog story" },
  @{ Name = "audit"; Color = "fbca04"; Description = "Audit activity" },
  @{ Name = "accessibility"; Color = "d93f0b"; Description = "Accessibility and compliance" },
  @{ Name = "compliance"; Color = "b60205"; Description = "Compliance scope" },
  @{ Name = "theming"; Color = "0052cc"; Description = "Theming and visual consistency" },
  @{ Name = "information-architecture"; Color = "5319e7"; Description = "Information architecture and navigation" },
  @{ Name = "error-handling"; Color = "e99695"; Description = "Error and empty state handling" },
  @{ Name = "performance"; Color = "c2e0c6"; Description = "Performance and latency" }
)

foreach ($label in $labels) {
  if ($DryRun) {
    Show-DryRunLabel -Name $label.Name -Color $label.Color -Description $label.Description
  } else {
    Ensure-Label -Name $label.Name -Color $label.Color -Description $label.Description
  }
}

$issues = @(
  @{
    Id = "UX-01"
    Title = "AI DevOps UI/UX: UX-01 Audit and baseline"
    Labels = @("audit", "ui-ux", "plan-phase", "story")
    BodyFile = (Join-Path $DraftDir "ux-01.md")
  },
  @{
    Id = "UX-03"
    Title = "AI DevOps UI/UX: UX-03 visual consistency and theming"
    Labels = @("theming", "ui-ux", "plan-phase", "story")
    BodyFile = (Join-Path $DraftDir "ux-03.md")
  },
  @{
    Id = "UX-05"
    Title = "AI DevOps UI/UX: UX-05 error and empty states"
    Labels = @("error-handling", "ui-ux", "plan-phase", "story")
    BodyFile = (Join-Path $DraftDir "ux-05.md")
  },
  @{
    Id = "UX-02"
    Title = "AI DevOps UI/UX: UX-02 accessibility baseline"
    Labels = @("accessibility", "compliance", "ui-ux", "plan-phase", "story")
    BodyFile = (Join-Path $DraftDir "ux-02.md")
  },
  @{
    Id = "UX-04"
    Title = "AI DevOps UI/UX: UX-04 IA and navigation improvements"
    Labels = @("information-architecture", "ui-ux", "plan-phase", "story")
    BodyFile = (Join-Path $DraftDir "ux-04.md")
  },
  @{
    Id = "UX-06"
    Title = "AI DevOps UI/UX: UX-06 perceived performance"
    Labels = @("performance", "ui-ux", "plan-phase", "story")
    BodyFile = (Join-Path $DraftDir "ux-06.md")
  }
)

$issueMap = @{}
$syntheticBase = 9000
$syntheticOffset = 0
foreach ($issue in $issues) {
  if ($DryRun) {
    $syntheticOffset += 1
    Show-DryRunIssue -Id $issue.Id -Title $issue.Title -Labels $issue.Labels -BodyFile $issue.BodyFile -IssueMap $issueMap -SyntheticNumber ($syntheticBase + $syntheticOffset) -ShowFullBody:$VerboseBodyPreview
  } else {
    New-Issue -Id $issue.Id -Title $issue.Title -Labels $issue.Labels -BodyFile $issue.BodyFile -IssueMap $issueMap
  }
}

Write-Host ""
if ($DryRun) {
  Write-Host "Dry-run completed. Synthetic UX mapping:"
} else {
  Write-Host "Created UI/UX issues:"
}
$issueMap.GetEnumerator() |
  Sort-Object Name |
  ForEach-Object { Write-Host ("- {0} -> #{1}" -f $_.Key, $_.Value) }
