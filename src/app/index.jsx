import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import RoleCard from '../components/RoleCard';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0B132B" />
      <View style={styles.container}>
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons name="broadcast" size={36} color="#10B981" />
          </View>
          <Text style={styles.brandTitle}>Restaurant Messenger</Text>
          <Text style={styles.brandTagline}>Your restaurant, connected. Even offline.</Text>
        </View>

        <View style={styles.roleSection}>
          <Text style={styles.sectionHeader}>SELECT YOUR ROLE</Text>

          <RoleCard
            title="Cashier"
            subtitle="Manage POS, send tickets, and coordinate orders"
            icon="cash-register"
            onPress={() => router.push('/cashier')}
          />

          <RoleCard
            title="Waiter"
            subtitle="Send table orders and communicate with the counter"
            icon="tray-full"
            onPress={() => router.push('/waiter')}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerNote}>Placeholder UI • Google Nearby Connections disabled</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B132B',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingVertical: 24,
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
  },
  roleSection: {
    flex: 1,
    justifyContent: 'center',
  },
  sectionHeader: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 12,
    marginLeft: 4,
  },
  footer: {
    alignItems: 'center',
  },
  footerNote: {
    color: '#475569',
    fontSize: 12,
  },
});