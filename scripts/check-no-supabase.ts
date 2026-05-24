import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
function getFiles(dir: string, fileList: string[] = []): string[] {
  try {
    const files = readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
      if (file.name === 'node_modules' || file.name === 'dist' || file.name === '.next' || file.name === '.turbo') continue;
      const path = join(dir, file.name);
      if (file.isDirectory()) {
        getFiles(path, fileList);
      } else {
        if (/\.(ts|tsx|js|jsx|json|md)$/.test(file.name)) {
          fileList.push(path);
        }
      }
    }
  } catch(e) {}
  return fileList;
}

const files = [...getFiles('apps'), ...getFiles('packages')];

let found = false;

for (const file of files) {
  // skip this script itself
  if (file.includes('check-no-supabase.ts')) continue;
  
  const content = readFileSync(file, 'utf-8');
  if (content.toLowerCase().includes('supabase')) {
    console.error(`🚨 Error: Found Supabase reference in ${file}`);
    found = true;
  }
}

if (found) {
  console.error('\n❌ Build failed. Supabase is prohibited in this repository.');
  process.exit(1);
}

console.log('✅ No Supabase references found.');
