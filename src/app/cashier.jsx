import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import ConnectionStatus from '../components/ConnectionStatus';
import DeviceCard from '../components/DeviceCard';
import { ConnectionService } from '../services/connection.service';
import { DeviceService } from '../services/device.service';
import { MessageService } from '../services/message.service';

export default function CashierScreen() {
    const router = useRouter();
    const [isSearching, setIsSearching] = useState(false);
    const [connectingPeerId, setConnectingPeerId] = useState(null);
    const [discoveredPeers, setDiscoveredPeers] = useState([]);
    const connectingPeerRef = useRef(null);

    useEffect(() => {
        let unsubscribeConn = null;
        let unsubscribeMsg = null;

        const setup = async () => {
            try {
                await DeviceService.initialize({
                    name: 'Cashier Terminal',
                    role: 'cashier',
                });
                await MessageService.initialize();

                unsubscribeConn = ConnectionService.subscribe((event, data) => {
                    if (event === 'peerFound') {
                        setDiscoveredPeers((prev) => {
                            if (prev.some((p) => p.peerId === data.peerId)) return prev;
                            return [...prev, { ...data, isAvailable: true }];
                        });
                    } else if (event === 'peerLost') {
                        setDiscoveredPeers((prev) => prev.filter((p) => p.peerId !== data.peerId));
                    } else if (event === 'invitationReceived') {
                        ConnectionService.accept(data.peerId).catch(console.error);
                    } else if (event === 'connected') {
                        setConnectingPeerId(null);
                        const targetPeer = connectingPeerRef.current;
                        router.push({
                            pathname: '/chat',
                            params: {
                                peerId: data.peerId,
                                partnerName: targetPeer?.name || data.name || 'Waiter Peer',
                                partnerRole: 'waiter',
                            },
                        });
                    } else if (event === 'disconnected') {
                        setConnectingPeerId(null);
                    }
                });

                unsubscribeMsg = MessageService.subscribe((event, data) => {
                    if (event === 'deviceIdentified') {
                        setDiscoveredPeers((prev) =>
                            prev.map((p) =>
                                p.peerId === data.peerId
                                    ? { ...p, name: data.device.name, role: data.device.role }
                                    : p
                            )
                        );
                    }
                });
            } catch (err) {
                console.error('Setup error in CashierScreen:', err);
                Alert.alert('Initialization Error', err.message);
            }
        };

        setup();

        return () => {
            unsubscribeConn?.();
            unsubscribeMsg?.();
            ConnectionService.stop().catch(() => { });
        };
    }, []);

    const handleToggleDiscovery = async () => {
        try {
            if (isSearching) {
                await ConnectionService.stop();
                setIsSearching(false);
            } else {
                await ConnectionService.start();
                setIsSearching(true);
            }
        } catch (err) {
            setIsSearching(false);
            Alert.alert('Discovery Error', err.message);
        }
    };

    const handleConnect = async (peer) => {
        try {
            connectingPeerRef.current = peer;
            setConnectingPeerId(peer.peerId);
            await ConnectionService.connect(peer.peerId);
        } catch (err) {
            setConnectingPeerId(null);
            Alert.alert('Connection Failed', err.message);
        }
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
                        <Text style={styles.title}>Cashier Terminal</Text>
                        <Text style={styles.roleSubtext}>Active Role: Cashier</Text>
                    </View>
                </View>

                <View style={styles.statusSection}>
                    <Text style={styles.sectionLabel}>STATUS</Text>
                    <ConnectionStatus
                        status={isSearching ? 'searching' : 'disconnected'}
                        label={isSearching ? 'Searching & Advertising on Nearby...' : 'Discovery Inactive (Offline)'}
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
                        {isSearching ? 'Stop Discovering' : 'Discover Devices'}
                    </Text>
                </TouchableOpacity>

                <View style={styles.listSection}>
                    <Text style={styles.sectionLabel}>NEARBY DEVICES</Text>
                    <FlatList
                        data={discoveredPeers}
                        keyExtractor={(item) => item.peerId}
                        renderItem={({ item }) => (
                            <DeviceCard
                                name={item.name || `Device (${item.peerId.slice(0, 5)})`}
                                role={item.role || 'Waiter'}
                                isAvailable={item.isAvailable && connectingPeerId !== item.peerId}
                                onConnect={() => handleConnect(item)}
                            />
                        )}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                {isSearching ? (
                                    <ActivityIndicator size="large" color="#10B981" style={{ marginBottom: 12 }} />
                                ) : (
                                    <MaterialCommunityIcons name="access-point-network-off" size={48} color="#334155" />
                                )}
                                <Text style={styles.emptyTitle}>
                                    {isSearching ? 'Searching for Waiter Devices...' : 'No Devices Available'}
                                </Text>
                                <Text style={styles.emptySubtitle}>
                                    {isSearching
                                        ? 'Make sure waiters have their discovery turned on.'
                                        : 'Tap "Discover Devices" above to begin looking for waiters.'}
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
    safeArea: { flex: 1, backgroundColor: '#0B132B' },
    container: { flex: 1, padding: 20 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    backButton: { marginRight: 16, padding: 4 },
    title: { fontSize: 22, fontWeight: '700', color: '#F8FAFC' },
    roleSubtext: { color: '#94A3B8', fontSize: 13 },
    statusSection: { marginBottom: 16 },
    sectionLabel: { color: '#64748B', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
    discoveryButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#10B981',
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 24,
    },
    discoveryActiveButton: { backgroundColor: '#F59E0B' },
    discoveryButtonText: { color: '#0F172A', fontWeight: '700', fontSize: 15, marginLeft: 8 },
    listSection: { flex: 1 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
    emptyTitle: { color: '#E2E8F0', fontSize: 16, fontWeight: '600', marginTop: 12 },
    emptySubtitle: { color: '#64748B', fontSize: 13, textAlign: 'center', marginTop: 6, paddingHorizontal: 24 },
});