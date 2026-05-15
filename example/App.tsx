/**
 * ChuckTS — Example App
 *
 * Demonstrates all ChuckTS features: fetch, axios, and the Devtools UI.
 */
import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import axios from 'axios';
import { ChuckTS, Devtools } from 'chuckts';

// ─── Setup ────────────────────────────────────────────────────────────────────
ChuckTS.start({
  maxRequests: 100,
  maxPayloadSize: 64 * 1024, // 64KB
});

ChuckTS.attachFetch();

const api = axios.create({ baseURL: 'https://jsonplaceholder.typicode.com' });
ChuckTS.attachAxios(api);

// ─── Demo Component ───────────────────────────────────────────────────────────
export default function App() {
  const fireGet = useCallback(async () => {
    await fetch('https://jsonplaceholder.typicode.com/todos/1');
  }, []);

  const firePost = useCallback(async () => {
    await api.post('/posts', {
      title: 'ChuckTS demo',
      body: 'Hello from ChuckTS!',
      userId: 1,
    });
  }, []);

  const fire404 = useCallback(async () => {
    await fetch('https://jsonplaceholder.typicode.com/unknown/9999').catch(() => {});
  }, []);

  const fireAbort = useCallback(async () => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 10);
    await fetch('https://jsonplaceholder.typicode.com/photos', {
      signal: controller.signal,
    }).catch(() => {});
  }, []);

  const openInspector = useCallback(() => ChuckTS.open(), []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>⚡ ChuckTS Demo</Text>
        <Text style={styles.subtitle}>Tap a button to fire a request, then open the inspector.</Text>

        <Btn label="GET /todos/1" onPress={fireGet} color="#3fb950" />
        <Btn label="POST /posts (axios)" onPress={firePost} color="#388bfd" />
        <Btn label="GET /unknown/9999 → 404" onPress={fire404} color="#f85149" />
        <Btn label="Abort signal" onPress={fireAbort} color="#d29922" />

        <View style={styles.divider} />
        <Btn label="Open Inspector" onPress={openInspector} color="#a371f7" />
      </ScrollView>

      {/* ChuckTS Devtools — renders the modal + floating button */}
      <Devtools showFloatingButton />
    </SafeAreaView>
  );
}

function Btn({ label, onPress, color }: { label: string; onPress: () => void; color: string }) {
  return (
    <TouchableOpacity
      style={[styles.btn, { borderColor: color }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.btnText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0d1117' },
  container: { padding: 24, gap: 12 },
  title: { color: '#e6edf3', fontSize: 24, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: '#8b949e', fontSize: 14, marginBottom: 8 },
  btn: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  btnText: { fontSize: 15, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#30363d', marginVertical: 8 },
});
