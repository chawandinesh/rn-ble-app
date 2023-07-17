import {
    NativeEventEmitter,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert,
    Linking,
  } from 'react-native';
  import React, {useEffect} from 'react';
  import {BleManager} from 'react-native-ble-plx';
  import {useIsFocused} from '@react-navigation/native';
  import {check, PERMISSIONS, request} from 'react-native-permissions';
  import BluetoothStateManager from 'react-native-bluetooth-state-manager';
  import BleManagerTx from 'react-native-ble-manager';
  
  let BlePlxManager = new BleManager();
  const eventEmitter = new NativeEventEmitter();
  const Main = () => {
    const isFocused = useIsFocused();
  
    const enableBlueooth = () => {
      Alert.alert(
        'Bluetooth turned off',
        'Please turn on bluetooth to connect the device',
        [
          {
            text: 'Cancel',
            onPress: () => {},
            style: 'cancel',
          },
          {
            text: 'OK',
            onPress: async () => {
              check(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT).then(async res => {
                console.log(res);
                if (res === 'blocked') {
                  Linking.openSettings();
                } else if (res === 'denied') {
                  request(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT).then(res => {
                    console.log(res, 'res...');
                    if (res === 'blocked') {
                      Alert.alert(
                        'Bluetooth permission',
                        'Bluetooth enable permission is blocked in the device ' +
                          'settings. Allow the app to turn on blueooth to ' +
                          'connect.',
                        [
                          {
                            text: 'OK',
                            onPress: () => {
                              Linking.sendIntent(
                                'android.settings.BLUETOOTH_SETTINGS',
                              );
                            },
                          },
                        ],
                      );
                    } else if (res === 'granted') {
                      enableBlueooth();
                    }
                  });
                } else if (res === 'granted' || res === 'limited') {
                  await BleManagerTx.enableBluetooth()
                    .then(() => {
                      onScan();
                    })
                    .catch(err => {
                      console.log('fail T', err);
                    });
                }
              });
            },
          },
        ],
      );
    };
  
    const bluetoothScanPermissionSuccess = () => {
      console.log('Success....');
      BlePlxManager.startDeviceScan(null, null, (error: any, device: any) => {
        console.log(error, device);
        if (error) {
          // Handle error (scanning will be stopped automatically)
          return;
        }
  
        // Check if it is a device you are looking for based on advertisement data
        // or other criteria.
        if (device.name === 'TI BLE Sensor Tag' || device.name === 'SensorTag') {
          // Stop scanning as it's not necessary if you are scanning for one device.
          // Proceed with connection.
        }
      });
    };
  
    const bluetoothScanPermission = () => {
      check(PERMISSIONS.ANDROID.BLUETOOTH_SCAN).then(res => {
        switch (res) {
          case 'blocked':
            console.log('blocked ble');
            Alert.alert(
              'Bluetooth scan permission',
              'Bluetooth scan permission is blocked in the device ' +
                'settings. Allow the app to scan bluetooth devices ',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    Linking.openSettings();
                  },
                },
              ],
            );
            break;
          case 'denied':
            request(PERMISSIONS.ANDROID.BLUETOOTH_SCAN).then(response => {
              switch (response) {
                case 'blocked':
                  Alert.alert(
                    'Bluetooth scan permission',
                    'Bluetooth scan permission is blocked in the device ' +
                      'settings. Allow the app to scan bluetooth devices ',
                    [
                      {
                        text: 'OK',
                        onPress: () => {
                          Linking.openSettings();
                        },
                      },
                    ],
                  );
                  break;
                case 'granted':
                  bluetoothScanPermissionSuccess();
                  break;
                case 'denied':
                  console.log('denied to provide permission to scan permission');
                  bluetoothScanPermission();
                  break;
                case 'limited':
                  console.log('scan permission is limited');
                  break;
                case 'unavailable':
                  console.log('scan permission is unavailable');
                  break;
              }
            });
            break;
          case 'granted':
            bluetoothScanPermissionSuccess();
            break;
          case 'limited':
            console.log('limited ble');
            break;
          case 'unavailable':
            console.log('unavailable ble');
            break;
        }
      });
    };
  
    const locationPermission = () => {
      check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION).then(response => {
        switch (response) {
          case 'blocked':
            console.log('location block');
            Alert.alert(
              'Location permission',
              'Location permission is blocked in the device ' +
                'settings. Allow the app to access location to ' +
                'connect.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    Linking.openSettings();
                  },
                },
              ],
            );
            break;
          case 'denied':
            console.log('location denied');
            request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION).then(res => {
              switch (res) {
                case 'blocked':
                  Alert.alert(
                    'Location permission',
                    'Location permission is blocked in the device ' +
                      'settings. Allow the app to access location to ' +
                      'connect.',
                    [
                      {
                        text: 'OK',
                        onPress: () => {
                          Linking.openSettings();
                        },
                      },
                    ],
                  );
                  break;
                case 'denied':
                  locationPermission();
                  break;
                case 'granted':
                  console.log('location after request granted');
                  // bluetoothScanPermission();
                  break;
                case 'limited':
                  console.log('location after request limited');
                  break;
                case 'unavailable':
                  console.log('location after request unavailable');
                  break;
              }
            });
            break;
          case 'granted':
            console.log('location granted');
            // bluetoothScanPermission();
            break;
          case 'limited':
            console.log('location limited');
            break;
          case 'unavailable':
            console.log('location unavailable');
            break;
        }
      });
    };
  
    useEffect(() => {
      const subscription = BlePlxManager.onStateChange((state: any) => {
        console.log(state, 'State');
        if (state === 'PoweredOn') {
        }
      }, true);
      const subscriptionA = eventEmitter.addListener('eventname', () => {});
      return () => {
        subscription.remove();
        subscriptionA.remove();
      };
    }, [isFocused]);
  
    const onScan = async () => {
      const bluetoothState = await BlePlxManager.state();
      // bluetoothScanPermissionSuccess();
      if (bluetoothState === 'PoweredOff') {
        enableBlueooth();
      } else {
        //Android permissions
        locationPermission();
        bluetoothScanPermission();
      }
    };
  
    return (
      <View style={styles.container}>
        <Text style={styles.connectedDeviceText}>Connect to device</Text>
        <View>
          <TouchableOpacity
            style={styles.scanNowButtonContainer}
            onPress={onScan}>
            <Text style={styles.scanNowButton}>Scan Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  export default Main;
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
    },
    connectedDeviceText: {
      color: '#000',
      fontSize: 20,
      fontWeight: 'bold',
      marginVertical: 30,
    },
    scanNowButtonContainer: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      backgroundColor: '#1426a9',
      borderRadius: 5,
    },
    scanNowButton: {
      color: '#fff',
      fontSize: 16,
      textAlign: 'center',
    },
  });
  