# Render a bounded scientific request using the installed .NET Charting library.
# All transport is stdin/stdout; the caller alone owns artifact persistence.
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
[Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$plotRequest = [Console]::In.ReadToEnd() | ConvertFrom-Json
Add-Type -AssemblyName System.Windows.Forms.DataVisualization
Add-Type -AssemblyName System.Drawing
$plotChart = [System.Windows.Forms.DataVisualization.Charting.Chart]::new()
$plotStream = [System.IO.MemoryStream]::new()
try {
    $plotChart.Width = 1200
    $plotChart.Height = 760
    $plotChart.BackColor = [System.Drawing.Color]::White
    $plotChart.AntiAliasing = 'All'
    $plotChart.TextAntiAliasingQuality = 'High'
    $plotChart.Font = [System.Drawing.Font]::new('Arial', 10)
    $plotTitle = $plotChart.Titles.Add([string]$plotRequest.title)
    $plotTitle.Font = [System.Drawing.Font]::new('Arial', 16, [System.Drawing.FontStyle]::Bold)
    $plotNote = $plotChart.Titles.Add([string]$plotRequest.description)
    $plotNote.Font = [System.Drawing.Font]::new('Arial', 10)
    $plotNote.Docking = 'Bottom'
    $plotNote.IsDockedInsideChartArea = $false
    $plotArea = [System.Windows.Forms.DataVisualization.Charting.ChartArea]::new('scientific')
    $plotArea.AxisX.Title = [string]$plotRequest.xLabel
    $plotArea.AxisY.Title = [string]$plotRequest.yLabel
    $plotArea.AxisX.IsStartedFromZero = $false
    $plotArea.AxisY.IsStartedFromZero = $false
    $plotArea.AxisX.MajorGrid.LineColor = [System.Drawing.Color]::Gainsboro
    $plotArea.AxisY.MajorGrid.LineColor = [System.Drawing.Color]::Gainsboro
    $plotArea.AxisY.LabelStyle.Format = 'G5'
    $plotArea.AxisX.LabelStyle.Font = [System.Drawing.Font]::new('Arial', 9)
    $plotArea.AxisY.LabelStyle.Font = [System.Drawing.Font]::new('Arial', 9)
    $plotChart.ChartAreas.Add($plotArea)
    $plotLegend = [System.Windows.Forms.DataVisualization.Charting.Legend]::new('selectors')
    $plotLegend.Docking = 'Bottom'
    $plotLegend.Font = [System.Drawing.Font]::new('Arial', 9)
    $plotChart.Legends.Add($plotLegend)
    $plotColors = @('#0072B2', '#D55E00', '#009E73', '#CC79A7', '#E69F00', '#56B4E9', '#444444', '#8C564B')
    $plotSeriesIndex = 0
    foreach ($plotSeriesInput in $plotRequest.series) {
        $plotSeries = [System.Windows.Forms.DataVisualization.Charting.Series]::new("series-$plotSeriesIndex")
        $plotSeries.LegendText = [string]$plotSeriesInput.label
        $plotSeries.ChartArea = 'scientific'
        $plotSeries.ChartType = 'Line'
        if ($plotRequest.PSObject.Properties['kind']) {
            if ($plotRequest.kind -eq 'point') { $plotSeries.ChartType = 'Point' }
            elseif ($plotRequest.kind -eq 'column') { $plotSeries.ChartType = 'Column' }
        }
        $plotSeries.BorderWidth = 2
        if ($plotSeriesIndex -ge $plotColors.Length) { $plotSeries.BorderDashStyle = 'Dash' }
        $plotSeries.MarkerStyle = 'Circle'
        $plotSeries.MarkerSize = 6
        $plotSeries.Color = [System.Drawing.ColorTranslator]::FromHtml($plotColors[$plotSeriesIndex % $plotColors.Length])
        for ($plotPointIndex = 0; $plotPointIndex -lt $plotSeriesInput.x.Count; $plotPointIndex++) {
            [void]$plotSeries.Points.AddXY([double]$plotSeriesInput.x[$plotPointIndex], [double]$plotSeriesInput.y[$plotPointIndex])
        }
        $plotChart.Series.Add($plotSeries)
        $plotSeriesIndex++
    }
    if ($plotRequest.PSObject.Properties['xTicks'] -and $plotRequest.xTicks.Count -gt 0) {
        $plotTickValues = @($plotRequest.xTicks | ForEach-Object { [double]$_.value } | Sort-Object -Unique)
        $plotTickHalfWidth = 0.4
        if ($plotTickValues.Count -gt 1) {
            $plotTickGap = [double]::PositiveInfinity
            for ($plotTickIndex = 1; $plotTickIndex -lt $plotTickValues.Count; $plotTickIndex++) {
                $plotTickGap = [Math]::Min($plotTickGap, $plotTickValues[$plotTickIndex] - $plotTickValues[$plotTickIndex - 1])
            }
            $plotTickHalfWidth = 0.45 * $plotTickGap
        }
        foreach ($plotTick in $plotRequest.xTicks) {
            [void]$plotArea.AxisX.CustomLabels.Add([double]$plotTick.value - $plotTickHalfWidth, [double]$plotTick.value + $plotTickHalfWidth, [string]$plotTick.label)
        }
    }
    $plotChart.SaveImage($plotStream, [System.Windows.Forms.DataVisualization.Charting.ChartImageFormat]::Png)
    $plotHostFile = Join-Path $PSHOME 'powershell.exe'
    $plotAssembly = [System.Windows.Forms.DataVisualization.Charting.Chart].Assembly
    $plotTool = @{
        powershell = @{
            path = $plotHostFile
            sha256 = (Get-FileHash -LiteralPath $plotHostFile -Algorithm SHA256).Hash.ToLowerInvariant()
            byteLength = (Get-Item -LiteralPath $plotHostFile).Length
            version = $PSVersionTable.PSVersion.ToString()
        }
        charting = @{
            path = $plotAssembly.Location
            sha256 = (Get-FileHash -LiteralPath $plotAssembly.Location -Algorithm SHA256).Hash.ToLowerInvariant()
            byteLength = (Get-Item -LiteralPath $plotAssembly.Location).Length
            version = $plotAssembly.FullName
        }
    }
    @{schemaId = 'sky-standard-plot-v1'; base64 = [Convert]::ToBase64String($plotStream.ToArray()); tool = $plotTool} | ConvertTo-Json -Depth 5 -Compress
}
finally {
    $plotStream.Dispose()
    $plotChart.Dispose()
}
