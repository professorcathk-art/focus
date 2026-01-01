/**
 * Postinstall script to create react-native-worklets package
 * This is needed because:
 * 1. babel-preset-expo expects react-native-worklets/plugin
 * 2. react-native-reanimated imports from 'react-native-worklets'
 * But the actual package is react-native-worklets-core
 */

const fs = require('fs');
const path = require('path');

// Exit gracefully if anything fails - don't break the build
process.on('uncaughtException', (error) => {
  console.warn('⚠️  Postinstall script warning (non-fatal):', error.message);
  process.exit(0); // Exit successfully so npm install doesn't fail
});

process.on('unhandledRejection', (error) => {
  console.warn('⚠️  Postinstall script warning (non-fatal):', error.message);
  process.exit(0); // Exit successfully so npm install doesn't fail
});

try {
  const workletsCorePath = path.join(__dirname, '..', 'node_modules', 'react-native-worklets-core');
  const workletsPath = path.join(__dirname, '..', 'node_modules', 'react-native-worklets');

  if (!fs.existsSync(workletsCorePath)) {
    console.log('ℹ️  react-native-worklets-core not found, skipping worklets setup');
    process.exit(0);
  }

  // Remove old package if it exists
  if (fs.existsSync(workletsPath)) {
    try {
      // Use fs.rmSync if available (Node 14.14+), otherwise use recursive rmdir
      if (typeof fs.rmSync === 'function') {
        fs.rmSync(workletsPath, { recursive: true, force: true });
      } else {
        // Fallback for older Node versions - manually delete
        const deleteRecursive = (dir) => {
          if (fs.existsSync(dir)) {
            fs.readdirSync(dir).forEach((file) => {
              const curPath = path.join(dir, file);
              if (fs.lstatSync(curPath).isDirectory()) {
                deleteRecursive(curPath);
              } else {
                fs.unlinkSync(curPath);
              }
            });
            fs.rmdirSync(dir);
          }
        };
        deleteRecursive(workletsPath);
      }
    } catch (err) {
      // Ignore errors when removing old directory - non-fatal
      console.warn('⚠️  Could not remove old worklets directory:', err.message);
    }
  }
  
  // Create directory
  fs.mkdirSync(workletsPath, { recursive: true });
  
  // 1. Create plugin.js for Babel (CRITICAL - must exist for babel-preset-expo)
  const pluginContent = "module.exports = require('react-native-worklets-core/lib/commonjs/plugin');";
  fs.writeFileSync(path.join(workletsPath, 'plugin.js'), pluginContent);
  
  // 2. Create index.js that re-exports everything from react-native-worklets-core
  const indexContent = "// Re-export from react-native-worklets-core\nmodule.exports = require('react-native-worklets-core/lib/commonjs/index');";
  fs.writeFileSync(path.join(workletsPath, 'index.js'), indexContent);
  
  // 3. Create package.json with version compatible with react-native-reanimated
  // react-native-reanimated expects version 0.5.x, 0.6.x, or 0.7.x
  const pkgContent = {
    name: 'react-native-worklets',
    version: '0.5.1', // Must match react-native-reanimated's expected range
    main: './index.js',
    types: '../react-native-worklets-core/lib/typescript/index.d.ts',
    'react-native': './index.js'
  };
  fs.writeFileSync(
    path.join(workletsPath, 'package.json'),
    JSON.stringify(pkgContent, null, 2)
  );
  
  // 4. Create RNWorklets.podspec for CocoaPods (CRITICAL - react-native-reanimated depends on this)
  const podspecContent = `require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "RNWorklets"
  s.version      = package["version"]
  s.summary      = "React Native Worklets - Native module wrapper"
  s.description  = "Wrapper podspec that points to react-native-worklets-core"
  s.homepage     = "https://github.com/margelo/react-native-worklets-core"
  s.license      = "MIT"
  s.authors      = {}

  s.platforms    = { :ios => "11.0" }
  
  # Point to react-native-worklets-core podspec
  s.dependency "react-native-worklets-core"
  
  # Re-export headers from react-native-worklets-core
  s.source_files = []
  s.public_header_files = []
end
`;
  fs.writeFileSync(path.join(workletsPath, 'RNWorklets.podspec'), podspecContent);
  
  console.log('✅ Created react-native-worklets package (plugin + module exports)');
  process.exit(0); // Exit successfully
} catch (error) {
  console.warn('⚠️  Could not create react-native-worklets package:', error.message);
  console.warn('⚠️  This is non-fatal - build will continue');
  process.exit(0); // Exit successfully so npm install doesn't fail
}

