import { Alert, Platform } from 'react-native';

// Alert.alert with buttons does not work on react-native-web, so fall back to window.*
export function showAlert(title, message) {
  if (Platform.OS === 'web') window.alert(`${title}\n${message || ''}`);
  else Alert.alert(title, message);
}

export function confirmDialog(title, message, onConfirm) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: onConfirm },
  ]);
}
