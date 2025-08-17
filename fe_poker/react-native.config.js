module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./src/assets/fonts/'],
  dependencies: {
    'react-native-sqlite-storage': {
      platforms: {
        android: {
          sourceDir: '../node_modules/react-native-sqlite-storage/platforms/android',
          packageImportPath: 'import org.pgsqlite.SQLitePluginPackage;',
        },
        // iOS 配置被省略，讓 React Native 自動處理
      },
    },
  },
  // CI/CD 環境特定配置
  ...(process.env.CI === 'true' || process.env.XCODE_CLOUD === 'true' ? {
    commands: [
      {
        name: 'verify-yoga-paths',
        description: '驗證 Yoga 路徑在 CI 環境中是否正確',
        func: () => {
          const fs = require('fs');
          const path = require('path');
          
          const yogaPath = path.join(__dirname, 'node_modules/react-native/ReactCommon/yoga');
          const yogaSourcePath = path.join(yogaPath, 'yoga');
          
          console.log('🔍 驗證 Yoga 路徑...');
          console.log(`Yoga 基礎路徑: ${yogaPath}`);
          console.log(`Yoga 存在: ${fs.existsSync(yogaPath) ? '是' : '否'}`);
          console.log(`Yoga 源路徑: ${yogaSourcePath}`);
          console.log(`Yoga 源存在: ${fs.existsSync(yogaSourcePath) ? '是' : '否'}`);
          
          const requiredFiles = [
            'YGNodeStyle.cpp',
            'YGNodeLayout.cpp', 
            'YGValue.cpp',
            'YGPixelGrid.cpp',
            'event/event.cpp'
          ];
          
          let allFilesExist = true;
          requiredFiles.forEach(file => {
            const filePath = path.join(yogaSourcePath, file);
            const exists = fs.existsSync(filePath);
            console.log(`  ${exists ? '✅' : '❌'} ${file}: ${exists ? '存在' : '缺失'}`);
            if (!exists) allFilesExist = false;
          });
          
          if (allFilesExist) {
            console.log('✅ 所有必需的 Yoga 文件都存在');
          } else {
            console.log('❌ 部分 Yoga 文件缺失，可能導致構建失敗');
          }
          
          return allFilesExist;
        }
      }
    ]
  } : {})
};
