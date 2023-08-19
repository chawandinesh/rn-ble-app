import React from 'react';
import Main from './src/Main';
import BleMain from './src/BleMain';
import {NavigationContainer} from '@react-navigation/native';
import StateProvider from './src/StateContext';
import {Platform} from 'react-native';
const App = () => {
  const OsVer = Platform.constants?.Release;

  return (
    <NavigationContainer>
      <StateProvider>
        {parseInt(OsVer) < 12 ? <BleMain /> : <Main />}
      </StateProvider>
    </NavigationContainer>
  );
};

export default App;
