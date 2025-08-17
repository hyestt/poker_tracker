const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {};

// CI 環境特定配置
if (process.env.CI === 'true' || process.env.XCODE_CLOUD === 'true') {
  console.log('🔧 應用 CI 環境 Metro 配置');
  
  // 為 CI 環境添加額外的解析器配置
  config.resolver = {
    platforms: ['ios', 'android', 'native', 'web'],
    // 確保 Metro 可以正確解析 node_modules 中的依賴
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(__dirname, '../node_modules'), // 備用路徑
    ],
  };
  
  // 為 CI 環境添加額外的監視器配置
  config.watchFolders = [
    path.resolve(__dirname, 'node_modules/react-native'),
    path.resolve(__dirname, 'node_modules/react-native/ReactCommon'),
  ];
  
  console.log('✅ CI 環境 Metro 配置已應用');
}

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
