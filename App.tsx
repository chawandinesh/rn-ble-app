import React from 'react';
import Main from './src/Main';
import {NavigationContainer} from '@react-navigation/native';
import StateProvider from './src/StateContext';

const App = () => {
  return (
    <NavigationContainer>
      <StateProvider>
        <Main />
      </StateProvider>
    </NavigationContainer>
  );
};

export default App;
