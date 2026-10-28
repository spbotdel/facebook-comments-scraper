Add-Type -AssemblyName System.Drawing

$assetsDir = Join-Path $PSScriptRoot 'assets'
New-Item -ItemType Directory -Force -Path $assetsDir | Out-Null

function New-RoundedRectanglePath {
    param(
        [float]$X,
        [float]$Y,
        [float]$Width,
        [float]$Height,
        [float]$Radius
    )

    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $diameter = $Radius * 2
    $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
    $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
    $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
    $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
    $path.CloseFigure()
    return $path
}

function New-AvatarBitmap {
    param([int]$Size)

    $bitmap = New-Object System.Drawing.Bitmap(
        $Size,
        $Size,
        [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
    )
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $scale = $Size / 1024.0
    $graphics.ScaleTransform($scale, $scale)

    $backgroundRect = New-Object System.Drawing.RectangleF(0, 0, 1024, 1024)
    $backgroundBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $backgroundRect,
        [System.Drawing.Color]::FromArgb(255, 7, 24, 41),
        [System.Drawing.Color]::FromArgb(255, 13, 66, 103),
        135
    )
    $graphics.FillRectangle($backgroundBrush, $backgroundRect)

    $glowBrush = New-Object System.Drawing.SolidBrush(
        [System.Drawing.Color]::FromArgb(52, 31, 198, 255)
    )
    $graphics.FillEllipse($glowBrush, 500, -170, 750, 750)

    $gridPen = New-Object System.Drawing.Pen(
        [System.Drawing.Color]::FromArgb(16, 226, 250, 255),
        2
    )
    for ($i = 80; $i -lt 1024; $i += 96) {
        $graphics.DrawLine($gridPen, $i, 0, $i, 1024)
        $graphics.DrawLine($gridPen, 0, $i, 1024, $i)
    }

    $shadowBrush = New-Object System.Drawing.SolidBrush(
        [System.Drawing.Color]::FromArgb(60, 0, 0, 0)
    )
    $mainShadow = New-RoundedRectanglePath -X 138 -Y 190 -Width 610 -Height 410 -Radius 92
    $graphics.FillPath($shadowBrush, $mainShadow)

    $mainTail = New-Object System.Drawing.Drawing2D.GraphicsPath
    $mainTail.AddPolygon([System.Drawing.PointF[]]@(
        [System.Drawing.PointF]::new(250, 566),
        [System.Drawing.PointF]::new(188, 748),
        [System.Drawing.PointF]::new(408, 600)
    ))

    $mainBrush = New-Object System.Drawing.SolidBrush(
        [System.Drawing.Color]::FromArgb(255, 245, 252, 255)
    )
    $mainPath = New-RoundedRectanglePath -X 124 -Y 176 -Width 610 -Height 410 -Radius 92
    $graphics.FillPath($mainBrush, $mainPath)
    $graphics.FillPath($mainBrush, $mainTail)

    $dotBrush = New-Object System.Drawing.SolidBrush(
        [System.Drawing.Color]::FromArgb(255, 9, 42, 67)
    )
    $graphics.FillEllipse($dotBrush, 252, 330, 54, 54)
    $graphics.FillEllipse($dotBrush, 350, 330, 54, 54)
    $graphics.FillEllipse($dotBrush, 448, 330, 54, 54)

    $replyShadow = New-RoundedRectanglePath -X 548 -Y 456 -Width 332 -Height 238 -Radius 72
    $graphics.FillPath($shadowBrush, $replyShadow)

    $replyTail = New-Object System.Drawing.Drawing2D.GraphicsPath
    $replyTail.AddPolygon([System.Drawing.PointF[]]@(
        [System.Drawing.PointF]::new(652, 646),
        [System.Drawing.PointF]::new(798, 790),
        [System.Drawing.PointF]::new(646, 690)
    ))

    $replyBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.RectangleF(510, 408, 390, 330)),
        [System.Drawing.Color]::FromArgb(255, 38, 209, 255),
        [System.Drawing.Color]::FromArgb(255, 0, 137, 255),
        45
    )
    $replyPath = New-RoundedRectanglePath -X 534 -Y 442 -Width 332 -Height 238 -Radius 72
    $replyBorder = New-Object System.Drawing.Pen(
        [System.Drawing.Color]::FromArgb(255, 9, 42, 67),
        22
    )
    $graphics.FillPath($replyBrush, $replyPath)
    $graphics.FillPath($replyBrush, $replyTail)
    $graphics.DrawPath($replyBorder, $replyPath)
    $graphics.DrawPolygon(
        $replyBorder,
        [System.Drawing.PointF[]]@(
            [System.Drawing.PointF]::new(652, 646),
            [System.Drawing.PointF]::new(798, 790),
            [System.Drawing.PointF]::new(646, 690)
        )
    )

    $replyPen = New-Object System.Drawing.Pen(
        [System.Drawing.Color]::White,
        34
    )
    $replyPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $replyPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $graphics.DrawLine($replyPen, 604, 560, 676, 560)
    $graphics.DrawLine($replyPen, 640, 524, 640, 596)

    $accentBrush = New-Object System.Drawing.SolidBrush(
        [System.Drawing.Color]::FromArgb(255, 255, 107, 82)
    )
    $graphics.FillEllipse($accentBrush, 830, 246, 72, 72)

    $outputPath = Join-Path $assetsDir "actor-avatar-$Size.png"
    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $graphics.Dispose()
    $backgroundBrush.Dispose()
    $glowBrush.Dispose()
    $gridPen.Dispose()
    $shadowBrush.Dispose()
    $mainTail.Dispose()
    $mainBrush.Dispose()
    $mainPath.Dispose()
    $dotBrush.Dispose()
    $replyShadow.Dispose()
    $replyTail.Dispose()
    $replyBrush.Dispose()
    $replyPath.Dispose()
    $replyBorder.Dispose()
    $replyPen.Dispose()
    $accentBrush.Dispose()
    $bitmap.Dispose()

    Write-Output $outputPath
}

New-AvatarBitmap -Size 1024
New-AvatarBitmap -Size 512
New-AvatarBitmap -Size 256
