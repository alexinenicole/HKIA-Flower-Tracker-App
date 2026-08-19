$base = 'https://hellokittyislandadventure.wiki.gg/wiki/Special:FilePath/'

$entries = @(
  @{ key='ombre';      img='Ombre_Pattern.png' },
  @{ key='trim';       img='Trim_Pattern.png' },
  @{ key='speckled';   img='Speckled_Pattern.png' },
  @{ key='alternate';  img='Alternate_Pattern.png' },
  @{ key='striped';    img='Stripe_Pattern_Black.png' },
  @{ key='patch';      img='Patch_Pattern.png' },
  @{ key='ring';       img='Ring_Pattern.png' },
  @{ key='confetti';   img='Confetti_Pattern.png' },
  @{ key='iridescent'; img='Iridescent_Pattern.png' },
  @{ key='glow';       img='Glow_Pattern.png' },
  @{ key='frost';      img='Frost_Pattern.png' },
  @{ key='molten';     img='Molten_Pattern.png' },
  @{ key='crystal';    img='Crystal_Pattern.png' },
  @{ key='cosmic';     img='Cosmic_Pattern.png' },
  @{ key='glitter';    img='Glitter_Pattern.png' },
  @{ key='sunbeam';    img='Sunbeam_Pattern.png' }
)

New-Item -ItemType Directory -Force -Path 'assets\patterns' | Out-Null

foreach ($e in $entries) {
  $url  = $base + $e.img
  $dest = "assets\patterns\" + $e.key + ".png"
  try {
    Invoke-WebRequest -Uri $url -OutFile $dest -TimeoutSec 15 -UseBasicParsing -ErrorAction Stop
    Write-Host ("OK " + $e.key)
  } catch {
    Write-Host ("FAIL " + $e.key + " - " + $_.Exception.Message)
  }
  Start-Sleep -Seconds 2
}
Write-Host "Done"
