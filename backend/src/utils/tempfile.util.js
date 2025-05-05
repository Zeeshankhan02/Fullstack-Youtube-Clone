import fs from 'fs';
import path from 'path';

export function ensureTempDirExists() {
  const tempDir = path.join(process.cwd(), 'public', 'temp');

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    console.log('✅ Created /public/temp folder');
  }
}
