import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { api } from './api';
import { showAlert, confirmDialog } from './dialogs';
import { colors } from './theme';

const fmt = (n) => Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });

export default function DashboardScreen({ token, onLogout }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', position: '', salary: '' });
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [clusters, setClusters] = useState(null);

  // Any 401 sends the user back to the login screen
  const handleError = useCallback((e) => {
    if (e.status === 401) { onLogout(); return; }
    showAlert('Error', e.message);
  }, [onLogout]);

  const load = useCallback(async () => {
    try {
      setEmployees(await api.getEmployees(token));
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, [token, handleError]);

  useEffect(() => { load(); }, [load]);

  const addEmployee = async () => {
    const name = form.name.trim();
    const position = form.position.trim();
    const salary = form.salary.trim();
    // Client-side validation
    if (!name || !position || !salary) {
      showAlert('Missing fields', 'Name, position and salary are all required.');
      return;
    }
    if (isNaN(Number(salary)) || Number(salary) < 0) {
      showAlert('Invalid salary', 'Salary must be a positive number.');
      return;
    }
    setSaving(true);
    try {
      const created = await api.addEmployee(token, { name, position, salary: Number(salary) });
      setEmployees((prev) => [...prev, created]);
      setForm({ name: '', position: '', salary: '' });
      setClusters(null); // results are stale now
    } catch (e) {
      handleError(e);
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (id) => {
    try {
      const updated = await api.toggleStatus(token, id);
      setEmployees((prev) => prev.map((e) => (e.id === id ? updated : e)));
    } catch (e) {
      handleError(e);
    }
  };

  const remove = (emp) => {
    confirmDialog('Are you sure?', `Delete ${emp.name}? This cannot be undone.`, async () => {
      try {
        await api.deleteEmployee(token, emp.id);
        setEmployees((prev) => prev.filter((e) => e.id !== emp.id));
        setClusters(null);
      } catch (e) {
        handleError(e);
      }
    });
  };

  const analyze = async () => {
    setAnalyzing(true);
    setClusters(null);
    try {
      const data = await api.getSalaryClusters(token);
      setClusters(data.clusters);
    } catch (e) {
      handleError(e);
    } finally {
      setAnalyzing(false);
    }
  };

  const Header = (
    <View>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.h1}>Employees</Text>
          <Text style={styles.muted}>{employees.length} on record</Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.ghostBtn}>
          <Text style={styles.ghostText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Add employee</Text>
        <TextInput style={styles.input} placeholder="Name" placeholderTextColor="#9AABA6" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
        <TextInput style={styles.input} placeholder="Position" placeholderTextColor="#9AABA6" value={form.position} onChangeText={(v) => setForm({ ...form, position: v })} />
        <TextInput style={styles.input} placeholder="Salary" placeholderTextColor="#9AABA6" keyboardType="numeric" value={form.salary} onChangeText={(v) => setForm({ ...form, salary: v })} />
        <TouchableOpacity style={[styles.primaryBtn, saving && { opacity: 0.6 }]} onPress={addEmployee} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Add employee</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Salary structure</Text>
        <TouchableOpacity style={[styles.accentBtn, analyzing && { opacity: 0.6 }]} onPress={analyze} disabled={analyzing}>
          <Text style={styles.accentText}>Analyze Salary Structure</Text>
        </TouchableOpacity>

        {analyzing && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.muted}>Analyzing salaries…</Text>
          </View>
        )}

        {clusters && clusters.map((c) => (
          <View key={c.group} style={styles.tierCard}>
            <Text style={styles.tierName}>{c.group}</Text>
            <View style={styles.tierStats}>
              <View>
                <Text style={styles.statValue}>{c.count}</Text>
                <Text style={styles.muted}>employees</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.statValue}>฿{fmt(c.centroid)}</Text>
                <Text style={styles.muted}>average base salary</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <Text style={[styles.panelTitle, { marginHorizontal: 16, marginTop: 8 }]}>All employees</Text>
    </View>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <FlatList
      data={employees}
      keyExtractor={(e) => e.id}
      ListHeaderComponent={Header}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
      ListEmptyComponent={<Text style={[styles.muted, { textAlign: 'center', margin: 24 }]}>No employees yet. Add the first one above.</Text>}
      contentContainerStyle={{ paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}
      renderItem={({ item }) => {
        const active = item.status === 'Active';
        return (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.muted}>{item.position}</Text>
              <Text style={styles.salary}>฿{fmt(item.salary)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <View style={[styles.badge, { backgroundColor: active ? colors.activeBg : colors.leaveBg }]}>
                <Text style={[styles.badgeText, { color: active ? colors.primary : '#8A5A0B' }]}>{item.status}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.smallBtn} onPress={() => toggle(item.id)}>
                  <Text style={styles.smallText}>Toggle Status</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.smallBtn, styles.deleteBtn]} onPress={() => remove(item)}>
                  <Text style={[styles.smallText, { color: colors.danger }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 20 },
  h1: { fontSize: 28, fontWeight: '800', color: colors.ink },
  muted: { color: colors.muted, fontSize: 13 },
  ghostBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: colors.line },
  ghostText: { color: colors.ink, fontWeight: '600' },
  panel: { backgroundColor: colors.card, marginHorizontal: 16, marginBottom: 14, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.line },
  panelTitle: { fontSize: 16, fontWeight: '700', color: colors.ink, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 11, marginBottom: 10, fontSize: 15, color: colors.ink, backgroundColor: '#FAFBFB' },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 13, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  accentBtn: { backgroundColor: colors.accent, borderRadius: 8, paddingVertical: 13, alignItems: 'center' },
  accentText: { color: '#2B1D00', fontWeight: '700', fontSize: 15 },
  loadingRow: { alignItems: 'center', gap: 8, marginTop: 16 },
  tierCard: { marginTop: 12, padding: 14, borderRadius: 10, backgroundColor: '#F4F9F7', borderLeftWidth: 4, borderLeftColor: colors.primary },
  tierName: { fontSize: 16, fontWeight: '700', color: colors.ink, marginBottom: 8 },
  tierStats: { flexDirection: 'row', justifyContent: 'space-between' },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.ink },
  row: { flexDirection: 'row', backgroundColor: colors.card, marginHorizontal: 16, marginBottom: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.line },
  name: { fontSize: 16, fontWeight: '700', color: colors.ink },
  salary: { marginTop: 6, fontWeight: '700', color: colors.primary },
  badge: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  smallBtn: { paddingVertical: 7, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.line },
  deleteBtn: { borderColor: '#EBC3BF' },
  smallText: { fontSize: 12, fontWeight: '700', color: colors.ink },
});
