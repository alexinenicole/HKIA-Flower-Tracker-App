const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

const universalPatterns = [
  'ombre',
  'frost',
  'molten',
  'crystal',
  'cosmic',
  'glitter',
  'sunbeam',
  'iridescent',
  'glow'
];

data.flowers.forEach(flower => {
  if (!flower.compatiblePatterns) {
    flower.compatiblePatterns = [];
  }
  
  universalPatterns.forEach(pat => {
    if (!flower.compatiblePatterns.includes(pat)) {
      flower.compatiblePatterns.push(pat);
    }
  });
});

fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
console.log('data.json updated with universal patterns.');
