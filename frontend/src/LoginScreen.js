import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { api } from './api';
import { showAlert } from './dialogs';
import { colors } from './theme';

export default function LoginScreen({ onLoggedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!username.trim() || !password) {
      showAlert('Missing details', 'Enter both username and password.');
      return;
    }
    setBusy(true);
    try {
      const data = await api.login(username.trim(), password);
      onLoggedIn(data.token);
    } catch (e) {
      showAlert('Login failed', e.status === 401 ? 'Invalid username or password.' : e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.wrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <Text style={styles.title}>HR Manager</Text>
        <Text style={styles.sub}>Sign in to manage employees and salaries</Text>

        <Text style={styles.label}>Username</Text>
        <TextInput style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} placeholder="admin" placeholderTextColor="#9AABA6" />

        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" placeholderTextColor="#9AABA6" onSubmitEditing={submit} />

        <TouchableOpacity style={[styles.btn, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign in</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', padding: 20 },
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 24, borderWidth: 1, borderColor: colors.line, maxWidth: 440, width: '100%', alignSelf: 'center' },
  title: { fontSize: 30, fontWeight: '800', color: colors.ink },
  sub: { color: colors.muted, marginTop: 4, marginBottom: 22 },
  label: { color: colors.ink, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16, color: colors.ink, backgroundColor: '#FAFBFB' },
  btn: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
