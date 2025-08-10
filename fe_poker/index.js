/**
 * @format
 */

import {AppRegistry, LogBox} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// 在應用程式最早期就關閉警告，確保用戶不會看到任何開發相關提示
LogBox.ignoreAllLogs(true);

AppRegistry.registerComponent(appName, () => App);
