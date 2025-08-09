/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// 創建延遲包裝的App組件來處理原生模塊初始化時序問題
const DelayedApp = () => {
  const [React, useState, useEffect] = [require('react'), require('react').useState, require('react').useEffect];
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 給原生模塊額外的初始化時間
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 1500); // 1.5秒延遲確保所有原生模塊準備好

    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    const { View, ActivityIndicator } = require('react-native');
    return React.createElement(View,
      { style: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1F2937' } },
      React.createElement(ActivityIndicator, { size: 'large', color: '#007AFF' })
    );
  }

  return React.createElement(App);
};

AppRegistry.registerComponent(appName, () => DelayedApp);
