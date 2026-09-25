Add-Type -AssemblyName System.IO.Compression.FileSystem

$docxPath = 'c:\Users\Skinny\Downloads\final year project\Intelligent_Logistics_Platform_All_Screens.docx'
$zip = [System.IO.Compression.ZipFile]::OpenRead($docxPath)
$entry = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$xmlContent = $reader.ReadToEnd()
$reader.Close()
$stream.Close()
$zip.Dispose()

[xml]$doc = $xmlContent
$ns = New-Object System.Xml.XmlNamespaceManager($doc.NameTable)
$ns.AddNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main')

$paragraphs = $doc.SelectNodes('//w:p', $ns)
$output = @()
foreach ($para in $paragraphs) {
    $texts = $para.SelectNodes('.//w:t', $ns)
    $line = ($texts | ForEach-Object { $_.InnerText }) -join ''
    if ($line.Trim() -ne '') {
        $output += $line
    }
}

$output | Out-File -FilePath 'c:\Users\Skinny\Downloads\final year project\docx_output.txt' -Encoding UTF8
Write-Host "Done. Lines: $($output.Count)"
