import {
  NativeEventEmitter,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Linking,
  ActivityIndicator,
  FlatList,
  TextInput,
  Dimensions,
} from 'react-native';
import React, {useContext, useEffect, useState} from 'react';
import {BleManager} from 'react-native-ble-plx';
import {check, PERMISSIONS, request} from 'react-native-permissions';
import BleManagerTx from 'react-native-ble-manager';
import Toast from 'react-native-simple-toast';
import {StateContext} from './StateContext';
import base64 from 'base-64';

let BlePlxManager = new BleManager();
const eventEmitter = new NativeEventEmitter();
const {width} = Dimensions.get('window');
const showToast = (message: string) => {
  Toast.show(message, 1000, {textColor: '#fff', backgroundColor: '#000'});
};
const devicesList = new Map();
const serviceUUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const characteristicUUIDWrite = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const characteristicUUIDNotify = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

const Main = () => {
  const state = useContext<any>(StateContext);
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');

  const writeCommand = () => {
    BlePlxManager.writeCharacteristicWithResponseForDevice(
      state.connectedDevice?.id,
      serviceUUID,
      characteristicUUIDWrite,
      base64.encode(text),
    )
      .then(res => {
        console.log(res);
        setText('');
      })
      .catch(err => {
        console.log(err);
      });
  };

  const onClickOnDevice = (device: any) => {
    if (device) {
      BlePlxManager.connectToDevice(device.id)
        .then(res => {
          state.setConnectedDevice(device);
          return res.discoverAllServicesAndCharacteristics();
        })
        .then(response => {
          console.log({response});
          response.onDisconnected(() => {
            state.setConnectedDevice(null);
            setDevices([]);
          });
          response.monitorCharacteristicForService(
            serviceUUID,
            characteristicUUIDNotify,
            (error, char: any) => {
              console.log(error, char?.value, base64.decode(char?.value));
              showToast(`response: ${base64.decode(char?.value)}`);
            },
          );
        })
        .catch(err => {
          console.log(err);
        });
    }
  };

  const enableBlueooth = () => {
    check(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT).then(async res => {
      console.log(res);
      switch (res) {
        case 'blocked':
          Alert.alert(
            'Bluetooth permission',
            'Bluetooth enable permission is blocked in the device ' +
              'settings. Allow the app to turn on blueooth to ' +
              'connect.',
            [
              {
                text: 'OK',
                onPress: () => {
                  Linking.sendIntent('android.settings.BLUETOOTH_SETTINGS');
                },
              },
            ],
          );
          break;
        case 'denied':
          request(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT).then(async result => {
            switch (result) {
              case 'blocked':
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
                break;
              case 'denied':
                showToast('blueooth connect permission request denied');
                break;
              case 'granted':
                await BleManagerTx.enableBluetooth()
                  .then(() => {
                    locationPermission();
                  })
                  .catch(err => {
                    console.log('fail T', err);
                  });
                break;
              case 'limited':
                showToast('blueooth connect permission request limited');
                break;
              case 'unavailable':
                showToast('blueooth connect permission request unavailable');
                break;
            }
          });
          break;
        case 'granted':
          await BleManagerTx.enableBluetooth()
            .then(() => {
              locationPermission();
            })
            .catch(() => {
              showToast('Failed to enable blueooth');
            });
          break;
        case 'limited':
          showToast('blueooth connect permission request limited');
          break;
        case 'unavailable':
          showToast('blueooth connect permission request unavailable');
          break;
      }
    });
  };

  const bluetoothScanPermissionSuccess = () => {
    setLoading(true);
    setDevices([]);
    BlePlxManager.startDeviceScan(null, null, (error, device) => {
      console.log(error, device);
      if (error) {
        setLoading(false);
        // Handle error (scanning will be stopped automatically)
        return;
      }
      if (device?.localName || device?.name) {
        devicesList.set(device?.id, device);
      }
    });
    setTimeout(() => {
      setLoading(false);
      setDevices(Array.from(devicesList.values()));
      BlePlxManager.stopDeviceScan();
    }, 5000);
  };

  const bluetoothScanPermission = () => {
    check(PERMISSIONS.ANDROID.BLUETOOTH_SCAN).then(res => {
      switch (res) {
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
                showToast('denied to provide permission to scan permission');
                // bluetoothScanPermission();
                break;
              case 'limited':
                showToast('scan permission is limited');
                break;
              case 'unavailable':
                showToast('scan permission is unavailable');
                break;
            }
          });
          break;
        case 'granted':
          bluetoothScanPermissionSuccess();
          break;
        case 'limited':
          showToast('limited ble');
          break;
        case 'unavailable':
          showToast('unavailable ble');
          break;
      }
    });
  };

  const locationPermission = () => {
    check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION).then(response => {
      switch (response) {
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
                bluetoothScanPermission();
                break;
              case 'limited':
                showToast('location request limited');
                break;
              case 'unavailable':
                showToast('location request unavailable');
                break;
            }
          });
          break;
        case 'granted':
          bluetoothScanPermission();
          break;
        case 'limited':
          showToast('location limited');
          break;
        case 'unavailable':
          showToast('location unavailable');
          break;
      }
    });
  };

  useEffect(() => {
    const subscription = BlePlxManager.onStateChange((state: any) => {
      if (state === 'PoweredOn') {
      }
    }, true);
    const subscriptionA = eventEmitter.addListener('eventname', () => {});
    return () => {
      subscription.remove();
      subscriptionA.remove();
    };
  }, []);

  const onScan = async () => {
    // check blueooth permission
    enableBlueooth();
  };

  const renderDevice = ({item}: any) => {
    return (
      <View style={styles.deviceContainer}>
        <Text style={styles.deviceNameText}>{item?.name}</Text>
        <TouchableOpacity
          style={styles.deviceConnectButtonContainer}
          onPress={() => onClickOnDevice(item)}>
          <Text style={styles.connectText}>Connect</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        {state.connectedDevice ? (
          <Text style={styles.connectedDeviceText}>
            Connected to :{' '}
            {state.connectedDevice?.localName || state.connectedDevice?.name}
          </Text>
        ) : (
          <Text style={styles.connectedDeviceText}>Scan the devices</Text>
        )}
        {state.connectedDevice ? (
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Enter command"
              onChangeText={value => setText(value)}
              value={text}
            />
            <TouchableOpacity
              style={styles.buttonContainer}
              onPress={writeCommand}>
              <Text style={styles.buttonText}>Run</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <TouchableOpacity
              style={styles.scanNowButtonContainer}
              onPress={onScan}>
              {loading ? (
                <ActivityIndicator color={'#fff'} />
              ) : (
                <Text style={styles.scanNowButton}>Scan Now</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
      {!state.connectedDevice && devices.length ? (
        <View style={styles.bottom}>
          <View style={styles.divider} />
          <Text style={styles.connectedDeviceText}>Devices</Text>
          <FlatList
            data={devices}
            renderItem={renderDevice}
            keyExtractor={(item, index) => index.toString()}
          />
        </View>
      ) : null}
    </View>
  );
};

export default Main;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    minWidth: 100,
  },
  scanNowButton: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  top: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottom: {
    flex: 2,
    marginHorizontal: 40,
  },
  deviceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deviceNameText: {
    color: '#000',
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#dadada',
  },
  deviceConnectButtonContainer: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: '#782345',
    borderRadius: 5,
  },
  connectText: {
    textAlign: 'center',
    color: '#fff',
  },
  textInputContainer: {
    flexDirection: 'row',
    gap: 3,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#adadad',
    borderRadius: 10,
    minWidth: width * 0.4,
    color: '#000',
    fontSize: 16,
  },
  buttonContainer: {
    backgroundColor: '#000',
    paddingHorizontal: 5,
    paddingVertical: 2,
    minWidth: width * 0.2,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});
