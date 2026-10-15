import { Platform } from 'react-native';

// Physical phone? Replace with your computer's LAN IP, e.g. 'http://192.168.1.20:3000'
const LAN_URL = 'http://119.59.102.161:3061'; // backend on the course server

export const BASE_URL =
  LAN_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000');
