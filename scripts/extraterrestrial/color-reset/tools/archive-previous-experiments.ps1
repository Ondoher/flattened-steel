[CmdletBinding()]
param(
	[ValidateSet(
		'all',
		'support',
		'runs',
		'production-support',
		'runtime-superseded',
		'inventory',
		'runtime-active'
	)]
	[string[]] $Target = @('all'),

	[switch] $Prune,

	[switch] $VerifyOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$script:RepositoryRoot = [System.IO.Path]::GetFullPath(
	(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..\..\..')).Path
)
$script:OutputRoot = Join-Path $script:RepositoryRoot 'tmp\extraterrestrial'
$script:ArchiveRoot = Join-Path $script:RepositoryRoot 'archives\extraterrestrial-pre-color-reset-20260831'
$script:Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

if (-not (Test-Path -LiteralPath (Join-Path $script:RepositoryRoot '.git'))) {
	throw "Repository identity check failed at $script:RepositoryRoot"
}

function Test-PathInside {
	param(
		[Parameter(Mandatory = $true)] [string] $Candidate,
		[Parameter(Mandatory = $true)] [string] $Parent
	)

	$candidateFull = [System.IO.Path]::GetFullPath($Candidate).TrimEnd('\', '/')
	$parentFull = [System.IO.Path]::GetFullPath($Parent).TrimEnd('\', '/')
	return $candidateFull.Equals($parentFull, [System.StringComparison]::OrdinalIgnoreCase) -or
		$candidateFull.StartsWith(
			$parentFull + [System.IO.Path]::DirectorySeparatorChar,
			[System.StringComparison]::OrdinalIgnoreCase
		)
}

function Convert-ToRepositoryRelativePath {
	param([Parameter(Mandatory = $true)] [string] $FullPath)

	$normalized = [System.IO.Path]::GetFullPath($FullPath)
	if (-not (Test-PathInside -Candidate $normalized -Parent $script:RepositoryRoot)) {
		throw "Path escaped repository: $normalized"
	}

	return $normalized.Substring($script:RepositoryRoot.Length).TrimStart('\', '/').Replace('\', '/')
}

function Resolve-SafeOutputSource {
	param([Parameter(Mandatory = $true)] [string] $RepositoryRelativePath)

	if ([System.IO.Path]::IsPathRooted($RepositoryRelativePath)) {
		throw "Archive source must be repository-relative: $RepositoryRelativePath"
	}

	$fullPath = [System.IO.Path]::GetFullPath((Join-Path $script:RepositoryRoot $RepositoryRelativePath))
	if (-not (Test-PathInside -Candidate $fullPath -Parent $script:OutputRoot)) {
		throw "Archive source escaped tmp/extraterrestrial: $RepositoryRelativePath"
	}
	if (Test-PathInside -Candidate $fullPath -Parent (Join-Path $script:OutputRoot 'color-reset')) {
		throw "The active color-reset output is not an archive source: $RepositoryRelativePath"
	}
	if (-not (Test-Path -LiteralPath $fullPath)) {
		return $null
	}

	$item = Get-Item -LiteralPath $fullPath -Force
	if (($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) {
		throw "Archive source is a reparse point: $fullPath"
	}

	$currentPath = $fullPath
	while (Test-PathInside -Candidate $currentPath -Parent $script:RepositoryRoot) {
		$current = Get-Item -LiteralPath $currentPath -Force
		if (($current.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) {
			throw "Archive source has a reparse-point ancestor: $($current.FullName)"
		}
		if ($currentPath.Equals($script:RepositoryRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
			break
		}
		$currentPath = Split-Path -Parent $currentPath
	}

	return $item
}

function Write-JsonAtomically {
	param(
		[Parameter(Mandatory = $true)] [string] $Path,
		[Parameter(Mandatory = $true)] $Value
	)

	$temporaryPath = "$Path.partial"
	$json = $Value | ConvertTo-Json -Depth 12
	[System.IO.File]::WriteAllText($temporaryPath, $json + [Environment]::NewLine, $script:Utf8NoBom)
	if (Test-Path -LiteralPath $Path) {
		Remove-Item -LiteralPath $Path -Force
	}
	Move-Item -LiteralPath $temporaryPath -Destination $Path
}

function Get-Sha256 {
	param([Parameter(Mandatory = $true)] [string] $Path)

	$fullPath = [System.IO.Path]::GetFullPath($Path)
	if ($fullPath.StartsWith('\\')) {
		$extendedPath = '\\?\UNC\' + $fullPath.Substring(2)
	} else {
		$extendedPath = '\\?\' + $fullPath
	}
	$sha = [System.Security.Cryptography.SHA256]::Create()
	$stream = New-Object System.IO.FileStream(
		$extendedPath,
		[System.IO.FileMode]::Open,
		[System.IO.FileAccess]::Read,
		[System.IO.FileShare]::Read
	)
	try {
		$hashBytes = $sha.ComputeHash($stream)
	} finally {
		$stream.Dispose()
		$sha.Dispose()
	}
	return ([System.BitConverter]::ToString($hashBytes)).Replace('-', '').ToLowerInvariant()
}

function Get-ArchiveInventory {
	param(
		[Parameter(Mandatory = $true)] [string] $Id,
		[Parameter(Mandatory = $true)] [string[]] $SourceRoots,
		[Parameter(Mandatory = $true)] [bool] $KeepSource,
		[Parameter(Mandatory = $true)] [string] $ArchiveName
	)

	$sourceItems = @()
	foreach ($sourceRoot in $SourceRoots) {
		$item = Resolve-SafeOutputSource -RepositoryRelativePath $sourceRoot
		if ($null -ne $item) {
			$sourceItems += $item
		}
	}
	if ($sourceItems.Count -eq 0) {
		throw "No live source remains for archive target '$Id'."
	}

	$allItems = @()
	foreach ($sourceItem in $sourceItems) {
		$allItems += $sourceItem
		if ($sourceItem.PSIsContainer) {
			$allItems += Get-ChildItem -LiteralPath $sourceItem.FullName -Recurse -Force
		}
	}

	$reparsePoints = @($allItems | Where-Object {
		($_.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0
	})
	if ($reparsePoints.Count -ne 0) {
		throw "Archive target '$Id' contains $($reparsePoints.Count) reparse point(s); first: $($reparsePoints[0].FullName)"
	}

	$files = @($allItems | Where-Object { -not $_.PSIsContainer } | Sort-Object FullName -Unique)
	$directories = @($allItems | Where-Object { $_.PSIsContainer } | ForEach-Object {
		(Convert-ToRepositoryRelativePath -FullPath $_.FullName).TrimEnd('/') + '/'
	} | Sort-Object -Unique)

	$fileRecords = @()
	$totalBytes = [int64]0
	$completedBytes = [int64]0
	$progressClock = [System.Diagnostics.Stopwatch]::StartNew()
	$lastProgressMilliseconds = [int64]0
	for ($index = 0; $index -lt $files.Count; $index += 1) {
		$file = $files[$index]
		$length = [int64]$file.Length
		$sha256 = Get-Sha256 -Path $file.FullName
		$relativePath = Convert-ToRepositoryRelativePath -FullPath $file.FullName
		$fileRecords += [ordered]@{
			path = $relativePath
			bytes = $length
			sha256 = $sha256
		}
		$totalBytes += $length
		$completedBytes += $length

		if (($progressClock.ElapsedMilliseconds - $lastProgressMilliseconds) -ge 30000) {
			Write-Host ("[{0}] hashed {1}/{2} files ({3:N3} GiB)" -f $Id, ($index + 1), $files.Count, ($completedBytes / 1GB))
			$lastProgressMilliseconds = $progressClock.ElapsedMilliseconds
		}
	}

	$commit = (& git -C $script:RepositoryRoot rev-parse HEAD).Trim()
	if ($LASTEXITCODE -ne 0) {
		throw "Unable to resolve source commit."
	}

	return [pscustomobject][ordered]@{
		schema = 'flattened-steel.extraterrestrial-archive-content.v1'
		createdUtc = [DateTime]::UtcNow.ToString('o')
		archiveId = $Id
		archiveName = $ArchiveName
		sourceCommit = $commit
		repositoryRootName = Split-Path -Leaf $script:RepositoryRoot
		sourceRoots = @($sourceItems | ForEach-Object { Convert-ToRepositoryRelativePath -FullPath $_.FullName })
		keepLiveSource = $KeepSource
		fileCount = $fileRecords.Count
		directoryCount = $directories.Count
		totalBytes = $totalBytes
		directories = $directories
		files = $fileRecords
	}
}

function Invoke-BsdtarArchive {
	param(
		[Parameter(Mandatory = $true)] [string] $Id,
		[Parameter(Mandatory = $true)] [string] $Destination,
		[Parameter(Mandatory = $true)] [string[]] $SourceRoots,
		[Parameter(Mandatory = $true)] [string] $EmbeddedManifestDirectory
	)

	$tar = Get-Command tar.exe -ErrorAction Stop
	$arguments = @('--format=zip', '-c', '-f', $Destination, '-C', $script:RepositoryRoot)
	$arguments += $SourceRoots
	$arguments += @('-C', $EmbeddedManifestDirectory, 'archive-content-manifest.json')

	Write-Output "[$Id] compressing to $(Split-Path -Leaf $Destination)"
	& $tar.Source @arguments
	$tarExitCode = $LASTEXITCODE
	if ($tarExitCode -ne 0) {
		throw "bsdtar failed for '$Id' with exit code $tarExitCode."
	}
}

function Test-ArchiveAgainstManifest {
	param(
		[Parameter(Mandatory = $true)] [string] $ArchivePath,
		[Parameter(Mandatory = $true)] $Manifest
	)

	$id = [string]$Manifest.archiveId
	$archive = [System.IO.Compression.ZipFile]::OpenRead($ArchivePath)
	try {
		$entriesByPath = @{}
		foreach ($entry in $archive.Entries) {
			$path = $entry.FullName.Replace('\', '/').TrimStart('./')
			if ([string]::IsNullOrEmpty($entry.Name)) {
				continue
			}
			if ($entriesByPath.ContainsKey($path)) {
				throw "Archive '$id' contains duplicate file entry '$path'."
			}
			$entriesByPath[$path] = $entry
		}

		$expectedFileCount = @($Manifest.files).Count + 1
		if ($entriesByPath.Count -ne $expectedFileCount) {
			throw "Archive '$id' contains $($entriesByPath.Count) files; expected $expectedFileCount including its manifest."
		}
		if (-not $entriesByPath.ContainsKey('archive-content-manifest.json')) {
			throw "Archive '$id' is missing archive-content-manifest.json."
		}

		$progressClock = [System.Diagnostics.Stopwatch]::StartNew()
		$lastProgressMilliseconds = [int64]0
		$verifiedBytes = [int64]0
		$records = @($Manifest.files)
		for ($index = 0; $index -lt $records.Count; $index += 1) {
			$record = $records[$index]
			$path = [string]$record.path
			if (-not $entriesByPath.ContainsKey($path)) {
				throw "Archive '$id' is missing '$path'."
			}
			$entry = $entriesByPath[$path]
			if ([int64]$entry.Length -ne [int64]$record.bytes) {
				throw "Archive '$id' length mismatch for '$path'."
			}

			$sha = [System.Security.Cryptography.SHA256]::Create()
			$stream = $entry.Open()
			try {
				$hashBytes = $sha.ComputeHash($stream)
			} finally {
				$stream.Dispose()
				$sha.Dispose()
			}
			$hash = ([System.BitConverter]::ToString($hashBytes)).Replace('-', '').ToLowerInvariant()
			if ($hash -ne [string]$record.sha256) {
				throw "Archive '$id' SHA-256 mismatch for '$path'."
			}
			$verifiedBytes += [int64]$record.bytes

			if (($progressClock.ElapsedMilliseconds - $lastProgressMilliseconds) -ge 30000) {
				Write-Output ("[{0}] verified {1}/{2} files ({3:N3} GiB)" -f $id, ($index + 1), $records.Count, ($verifiedBytes / 1GB))
				$lastProgressMilliseconds = $progressClock.ElapsedMilliseconds
			}
		}
	} finally {
		$archive.Dispose()
	}

	Write-Output "[$id] complete entry/SHA-256 verification passed"
}

function Remove-VerifiedSources {
	param(
		[Parameter(Mandatory = $true)] [string] $Id,
		[Parameter(Mandatory = $true)] [string[]] $SourceRoots
	)

	foreach ($sourceRoot in $SourceRoots) {
		$item = Resolve-SafeOutputSource -RepositoryRelativePath $sourceRoot
		if ($null -eq $item) {
			continue
		}
		$resolved = [System.IO.Path]::GetFullPath($item.FullName)
		if (-not (Test-PathInside -Candidate $resolved -Parent $script:OutputRoot)) {
			throw "Refusing to prune outside tmp/extraterrestrial: $resolved"
		}
		if (Test-PathInside -Candidate $resolved -Parent (Join-Path $script:OutputRoot 'color-reset')) {
			throw "Refusing to prune active color-reset output: $resolved"
		}
		Write-Output "[$Id] pruning verified source $sourceRoot"
		if ($resolved.StartsWith('\\')) {
			$deletePath = '\\?\UNC\' + $resolved.Substring(2)
		} else {
			$deletePath = '\\?\' + $resolved
		}
		if ($item.PSIsContainer) {
			Remove-Item -LiteralPath $deletePath -Recurse -Force
		} else {
			Remove-Item -LiteralPath $deletePath -Force
		}
	}
}

function Invoke-ArchiveTarget {
	param([Parameter(Mandatory = $true)] $Definition)

	$id = [string]$Definition.id
	$archivePath = Join-Path $script:ArchiveRoot ([string]$Definition.archiveName)
	$manifestPath = "$archivePath.manifest.json"
	$resultPath = "$archivePath.result.json"
	$partialPath = "$archivePath.partial.zip"
	$stagePath = Join-Path $script:ArchiveRoot ".stage-$id"

	if (Test-Path -LiteralPath $archivePath) {
		if (-not (Test-Path -LiteralPath $manifestPath)) {
			throw "Existing archive lacks its sidecar manifest: $archivePath"
		}
		$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
		Test-ArchiveAgainstManifest -ArchivePath $archivePath -Manifest $manifest
	} else {
		if ($VerifyOnly) {
			throw "Archive does not exist for verify-only target '$id': $archivePath"
		}
		if (Test-Path -LiteralPath $partialPath) {
			Remove-Item -LiteralPath $partialPath -Force
		}
		if (Test-Path -LiteralPath $stagePath) {
			Remove-Item -LiteralPath $stagePath -Recurse -Force
		}

		$manifest = Get-ArchiveInventory `
			-Id $id `
			-SourceRoots @($Definition.sourceRoots) `
			-KeepSource ([bool]$Definition.keepSource) `
			-ArchiveName ([string]$Definition.archiveName)
		Write-JsonAtomically -Path $manifestPath -Value $manifest

		New-Item -ItemType Directory -Path $stagePath -Force | Out-Null
		Copy-Item -LiteralPath $manifestPath -Destination (Join-Path $stagePath 'archive-content-manifest.json')
		try {
			Invoke-BsdtarArchive `
				-Id $id `
				-Destination $partialPath `
				-SourceRoots @($manifest.sourceRoots) `
				-EmbeddedManifestDirectory $stagePath
			Test-ArchiveAgainstManifest -ArchivePath $partialPath -Manifest $manifest
			Move-Item -LiteralPath $partialPath -Destination $archivePath
		} finally {
			if (Test-Path -LiteralPath $stagePath) {
				Remove-Item -LiteralPath $stagePath -Recurse -Force
			}
		}
	}

	$archiveHash = Get-Sha256 -Path $archivePath
	$result = [ordered]@{
		schema = 'flattened-steel.extraterrestrial-archive-result.v1'
		verifiedUtc = [DateTime]::UtcNow.ToString('o')
		archiveId = $id
		archivePath = Convert-ToRepositoryRelativePath -FullPath $archivePath
		archiveBytes = [int64](Get-Item -LiteralPath $archivePath -Force).Length
		archiveSha256 = $archiveHash
		manifestPath = Convert-ToRepositoryRelativePath -FullPath $manifestPath
		sourceRoots = @($manifest.sourceRoots)
		sourceFileCount = [int64]$manifest.fileCount
		sourceBytes = [int64]$manifest.totalBytes
		keepLiveSource = [bool]$manifest.keepLiveSource
		pruned = $false
	}

	if ($Prune -and -not [bool]$manifest.keepLiveSource) {
		Remove-VerifiedSources -Id $id -SourceRoots @($manifest.sourceRoots)
		$result['pruned'] = $true
		$result['prunedUtc'] = [DateTime]::UtcNow.ToString('o')
	}
	Write-JsonAtomically -Path $resultPath -Value $result
	Write-Output ("[{0}] archive ready: {1:N3} GiB, SHA-256 {2}" -f $id, ($result['archiveBytes'] / 1GB), $archiveHash)
}

New-Item -ItemType Directory -Path $script:ArchiveRoot -Force | Out-Null

$productionRoot = Join-Path $script:OutputRoot 'production-adoption'
$reservedProductionChildren = @(
	'one-degree-inventory-20260829-1',
	'one-degree-runtime-packages-20260830-1',
	'one-degree-bin-covered-runtime-packages-20260830-1'
)
$productionSupportRoots = @()
if (Test-Path -LiteralPath $productionRoot) {
	$productionSupportRoots = @(
		Get-ChildItem -LiteralPath $productionRoot -Force |
			Where-Object { $reservedProductionChildren -notcontains $_.Name } |
			ForEach-Object { Convert-ToRepositoryRelativePath -FullPath $_.FullName }
	)
}

$supportRoots = @(
	Get-ChildItem -LiteralPath $script:OutputRoot -Force |
		Where-Object { @('color-reset', 'runs', 'production-adoption') -notcontains $_.Name } |
		ForEach-Object { Convert-ToRepositoryRelativePath -FullPath $_.FullName }
)

$definitions = @(
	[ordered]@{
		id = 'support'
		archiveName = 'extraterrestrial-support-output-2026-08-31.zip'
		sourceRoots = $supportRoots
		keepSource = $false
	},
	[ordered]@{
		id = 'runs'
		archiveName = 'extraterrestrial-run-output-000001-000585-2026-08-31.zip'
		sourceRoots = @('tmp/extraterrestrial/runs')
		keepSource = $false
	},
	[ordered]@{
		id = 'runtime-superseded'
		archiveName = 'extraterrestrial-production-adoption-runtime-superseded-output-2026-08-31.zip'
		sourceRoots = @('tmp/extraterrestrial/production-adoption/one-degree-runtime-packages-20260830-1')
		keepSource = $false
	},
	[ordered]@{
		id = 'inventory'
		archiveName = 'extraterrestrial-production-adoption-inventory-output-2026-08-31.zip'
		sourceRoots = @('tmp/extraterrestrial/production-adoption/one-degree-inventory-20260829-1')
		keepSource = $false
	},
	[ordered]@{
		id = 'production-support'
		archiveName = 'extraterrestrial-production-adoption-support-output-2026-08-31.zip'
		sourceRoots = $productionSupportRoots
		keepSource = $false
	},
	[ordered]@{
		id = 'runtime-active'
		archiveName = 'extraterrestrial-production-adoption-runtime-active-output-2026-08-31.zip'
		sourceRoots = @('tmp/extraterrestrial/production-adoption/one-degree-bin-covered-runtime-packages-20260830-1')
		keepSource = $true
	}
)

$selectedIds = @($Target)
if ($selectedIds -contains 'all') {
	$selectedIds = @($definitions | ForEach-Object { $_.id })
}

foreach ($definition in $definitions) {
	if ($selectedIds -notcontains $definition.id) {
		continue
	}
	$archivePath = Join-Path $script:ArchiveRoot ([string]$definition.archiveName)
	if (@($definition.sourceRoots).Count -eq 0 -and -not (Test-Path -LiteralPath $archivePath)) {
		Write-Output "[$($definition.id)] no source entries; skipped"
		continue
	}
	Invoke-ArchiveTarget -Definition $definition
}
