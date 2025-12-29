import fs from 'fs';
import yaml from 'js-yaml';

const manifest = yaml.load(fs.readFileSync('manifest.yml', 'utf8'));
const result = [];

for (const [groupName, icons] of Object.entries(manifest.icons)) {
  const items = icons.map(icon => ({
    icon: icon.name,
    description: icon.description || icon['added-in'] || ''
  }));
  
  result.push({
    group: groupName,
    items: items
  });
}

fs.writeFileSync('public/icons-grouped.json', JSON.stringify(result, null, 2));
console.log('Converted manifest.yml to public/icons-grouped.json');
console.log(`Total groups: ${result.length}`);
console.log(`Total icons: ${result.reduce((sum, g) => sum + g.items.length, 0)}`);
