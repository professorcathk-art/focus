/**
 * Creates placeholder assets for development
 * Run with: node scripts/create-placeholder-assets.js
 */

const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');

// Create assets directory if it doesn't exist
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Create a simple SVG that can be used as placeholder
// Note: Expo will need actual PNG files, but this script creates a note
// For now, we'll create a simple text file explaining what's needed

const readmeContent = `# Placeholder Assets

For development, you can temporarily use any image files or create simple colored squares.

Required files:
- icon.png (1024x1024)
- splash.png (1242x2436) 
- adaptive-icon.png (1024x1024)
- favicon.png (48x48)

Quick solution: Use any image editor to create solid color squares with these dimensions.

Or use online tools:
- https://www.appicon.co/
- https://www.favicon-generator.org/

For now, Expo will show warnings but the app should still run.
`;

fs.writeFileSync(path.join(assetsDir, 'README.txt'), readmeContent);

console.log('✅ Assets directory created');
console.log('⚠️  You still need to add actual image files to assets/ folder');
console.log('   The app will run but may show warnings without them.');
console.log('');
console.log('Quick fix: Create simple colored PNG files with the required dimensions.');

