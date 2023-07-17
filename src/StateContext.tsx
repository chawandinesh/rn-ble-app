import React, {useReducer} from 'react';

interface IInitialState {
  connectedDevice: any;
}

export const StateContext = React.createContext<any>(null);
const intialValue: IInitialState = {
  connectedDevice: null,
};

const reducer = (state: IInitialState, action: any) => {
  switch (action.type) {
    case 'SET_CONNECTED_DEVICE':
      return {...state, connectedDevice: action.payload};
    default:
      return state;
  }
};

const StateProvider = ({children}: any) => {
  const [state, dispatch] = useReducer(reducer, intialValue);
  console.log(state);

  const value = {
    connectedDevice: state.connectedDevice,
    setConnectedDevice: (data: any) =>
      dispatch({type: 'SET_CONNECTED_DEVICE', payload: data}),
  };

  return (
    <StateContext.Provider value={value}>{children}</StateContext.Provider>
  );
};

export default StateProvider;
