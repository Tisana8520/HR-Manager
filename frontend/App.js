import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';
import LoginScreen from './src/LoginScreen';
import DashboardScreen from './src/DashboardScreen';
import { colors } from './src/theme';

export default function App() {
  const [token, setToken] = useState(null);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      {token ? (
        <DashboardScreen token={token} onLogout={() => setToken(null)} />
      ) : (
        <LoginScreen onLoggedIn={setToken} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.bg } });
