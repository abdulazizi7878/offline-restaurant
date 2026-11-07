import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ConnectionStatus from '../components/ConnectionStatus';
import DeviceCard from '../components/DeviceCard';

export default function WaiterScreen() {
    const router = useRouter();
    const [isSearching, setIsSearching] = useState(false);

    // UI Placeholder list
    const sampleDevices = [
        { id: '1', name: "Main Counter Register #1", role: "Cashier", isAvailable: true },
        { id: '2', name: "Express Register #2", role: "Cashier", isAvailable: false },
    ];

    const handleToggleDiscovery = () => {
        setIsSearching(!isSearching);
    };

    const handleConnect = (item) => {
        router.push({
            pathname: '/chat',
            params: { partnerName: item.name, partnerRole: item.role },
        });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#0B132B" />
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#F8FAFC" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.title}>Waiter Device</Text>
                        <Text style={styles.roleSubtext}>Active Role: Waiter</Text>
                    </View>
                </View>

                <View style={styles.statusSection}>
                    <Text style={styles.sectionLabel}>STATUS</Text>
                    <ConnectionStatus
                        status={isSearching ? 'searching' : 'disconnected'}
                        label={isSearching ? 'Broadcasting & searching for cashiers...' : 'Offline (Not visible)'}
                    />
                </View>

                <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.discoveryButton, isSearching && styles.discoveryActiveButton]}
                    onPress={handleToggleDiscovery}
                >
                    <MaterialCommunityIcons
                        name={isSearching ? 'stop-circle-outline' : 'radar'}
                        size={20}
                        color="#0F172A"
                    />
                    <Text style={styles.discoveryButtonText}>
                        {isSearching ? 'Stop Discovery' : 'Discover Devices'}
                    </Text>
                </TouchableOpacity>

                <View style={styles.listSection}>
                    <Text style={styles.sectionLabel}>NEARBY DEVICES</Text>
                    <FlatList
                        data={isSearching ? sampleDevices : []}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <DeviceCard
                                name={item.name}
                                role={item.role}
                                isAvailable={item.isAvailable}
                                onConnect={() => handleConnect(item)}
                            />
                        )}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <MaterialCommunityIcons name="access-point-network-off" size={48} color="#334155" />
                                <Text style={styles.emptyTitle}>No Cashier Found</Text>
                                <Text style={styles.emptySubtitle}>
                                    {isSearching
                                        ? 'Searching for cashier terminals in range...'
                                        : 'Tap "Discover Devices" to connect to a cashier terminal.'}
                                </Text>
                            </View>
                        }
                    />
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
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    backButton: {
        marginRight: 16,
        padding: 4,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#F8FAFC',
    },
    roleSubtext: {
        color: '#94A3B8',
        fontSize: 13,
    },
    statusSection: {
        marginBottom: 16,
    },
    sectionLabel: {
        color: '#64748B',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 8,
    },
    discoveryButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#10B981',
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 24,
    },
    discoveryActiveButton: {
        backgroundColor: '#F59E0B',
    },
    discoveryButtonText: {
        color: '#0F172A',
        fontWeight: '700',
        fontSize: 15,
        marginLeft: 8,
    },
    listSection: {
        flex: 1,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
    },
    emptyTitle: {
        color: '#E2E8F0',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 12,
    },
    emptySubtitle: {
        color: '#64748B',
        fontSize: 13,
        textAlign: 'center',
        marginTop: 6,
        paddingHorizontal: 24,
    },
});