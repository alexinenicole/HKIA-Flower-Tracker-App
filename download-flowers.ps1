$base = 'https://hellokittyislandadventure.wiki.gg/wiki/Special:FilePath/'

$entries = @(
  @{ key='Anemone';      img='Anemone.png' },
  @{ key='Belbutton';    img='Bellbutton.png' },
  @{ key='Dandelily';    img='Dandelily.png' },
  @{ key='Dreampuff';    img='Dreampuff.png' },
  @{ key='Ghostgleam';   img='Ghostgleam.png' },
  @{ key='Heavy_Nettle'; img='Heavy_Nettle.png' },
  @{ key='Hibiscus';     img='Hibiscus.png' },
  @{ key='Penstemum';    img='Penstemum.png' },
  @{ key='Thistle';      img='Thistle.png' },
  @{ key='Tulias';       img='Tulias.png' },
  @{ key='Blazebulb';    img='Blazebulb.png' },
  @{ key='Crystalia';    img='Crystalia.png' },
  @{ key='Frostfeather'; img='Frostfeather.png' },
  @{ key='Bubbaluna';    img='Bubbaluna.png' },
  @{ key='Wheatflower';  img='Wheatflower.png' },
  @{ key='Sunburst';     img='Sunburst.png' },
  @{ key='Marigold';     img='Marigold.png' },
  @{ key='Eggwort';      img='Eggwort.png' },
  @{ key='Pinwheel';     img='Pinwheel.png' },
  @{ key='Petunia';      img='Petunia.png' },
  @{ key='Bowblossom';   img='Bowblossom.png' },
  @{ key='Poinsettia';   img='Poinsettia.png' },
  @{ key='Glowbal';      img='Glowbal.png' },
  @{ key='Rose';         img='Rose.png' },
  @{ key='Happadil';     img='Happadil.png' }
)

New-Item -ItemType Directory -Force -Path 'assets\flowers' | Out-Null

foreach ($e in $entries) {
  $url  = $base + $e.img
  $dest = "assets\flowers\" + $e.key + ".png"
  try {
    Invoke-WebRequest -Uri $url -OutFile $dest -TimeoutSec 15 -UseBasicParsing -ErrorAction Stop
    Write-Host ("OK " + $e.key)
  } catch {
    Write-Host ("FAIL " + $e.key + " - " + $_.Exception.Message)
  }
}
Write-Host "Done"
