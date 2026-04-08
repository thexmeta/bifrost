const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'out');
const destDir = path.join(__dirname, '..', 'transports', 'bifrost-http', 'ui');

// Remove destination if it exists
if (fs.existsSync(destDir)) {
  fs.rmSync(destDir, { recursive: true, force: true });
  console.log(`Removed existing UI at ${destDir}`);
}

// Copy source to destination
fs.cpSync(srcDir, destDir, { recursive: true });
console.log(`Copied UI from ${srcDir} to ${destDir}`);
console.log(`Files copied: ${fs.readdirSync(destDir).length}`);
