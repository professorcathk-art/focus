/**
 * Postinstall script to create react-native-worklets package
 * This is needed because:
 * 1. babel-preset-expo expects react-native-worklets/plugin
 * 2. react-native-reanimated imports from 'react-native-worklets'
 * But the actual package is react-native-worklets-core
 */

const fs = require('fs');
const path = require('path');

const workletsCorePath = path.join(__dirname, '..', 'node_modules', 'react-native-worklets-core');
const workletsPath = path.join(__dirname, '..', 'node_modules', 'react-native-worklets');

if (fs.existsSync(workletsCorePath)) {
  try {
    // Remove old package if it exists
    if (fs.existsSync(workletsPath)) {
      fs.rmSync(workletsPath, { recursive: true, force: true });
    }
    
    // Create directory
    fs.mkdirSync(workletsPath, { recursive: true });
    
    // 1. Create plugin.js for Babel (CRITICAL - must exist for babel-preset-expo)
    const pluginContent = "module.exports = require('react-native-worklets-core/lib/commonjs/plugin');";
    fs.writeFileSync(path.join(workletsPath, 'plugin.js'), pluginContent);
    
    // 2. Create index.js that re-exports everything from react-native-worklets-core
    const indexContent = "// Re-export from react-native-worklets-core\nmodule.exports = require('react-native-worklets-core/lib/commonjs/index');";
    fs.writeFileSync(path.join(workletsPath, 'index.js'), indexContent);
    
    // 3. Create package.json
    const pkgContent = {
      name: 'react-native-worklets',
      version: '1.0.0',
      main: './index.js',
      types: '../react-native-worklets-core/lib/typescript/index.d.ts',
      'react-native': './index.js'
    };
    fs.writeFileSync(
      path.join(workletsPath, 'package.json'),
      JSON.stringify(pkgContent, null, 2)
    );
    
    console.log('✅ Created react-native-worklets package (plugin + module exports)');
  } catch (error) {
    console.warn('⚠️  Could not create react-native-worklets package:', error.message);
  }
}

