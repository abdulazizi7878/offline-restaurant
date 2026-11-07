import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function DeviceCard({ name, role, isAvailable, onConnect }) {
    return (
        <View style={styles.card}>
            <View style={styles.deviceInfo}>
                <View style={styles.iconCircle}>
                    <MaterialCommunityIcons
                        name={role?.toLowerCase() === 'cashier' ? 'cash-register' : 'tray-full'}
                        size={22}
                        color="#38BDF8"
                    />
                </View>
                <View style={styles.meta}>
                    <Text style={styles.name}>{name}</Text>
                    <Text style={styles.role}>{role} • {isAvailable ? 'Available' : 'Unavailable'}</Text>
                </View>
            </View>
            <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.connectButton, !isAvailable && styles.disabledButton]}
                onPress={onConnect}
                disabled={!isAvailable}
            >
                <Text style={styles.buttonText}>Connect</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1E293B',
        borderRadius: 14,
        padding: 16,
        marginVertical: 6,
        borderWidth: 1,
        borderColor: '#334155',
    },
    deviceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#0F172A',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    meta: {
        flex: 1,
    },
    name: {
        color: '#F8FAFC',
        fontSize: 15,
        fontWeight: '600',
    },
    role: {
        color: '#94A3B8',
        fontSize: 12,
        marginTop: 2,
    },
    connectButton: {
        backgroundColor: '#10B981',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    disabledButton: {
        backgroundColor: '#334155',
    },
    buttonText: {
        color: '#0F172A',
        fontWeight: '700',
        fontSize: 13,
    },
});