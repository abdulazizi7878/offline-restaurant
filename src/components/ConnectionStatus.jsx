import { StyleSheet, Text, View } from 'react-native';

export default function ConnectionStatus({ status = 'disconnected', label }) {
    const isConnected = status === 'connected';
    const isSearching = status === 'searching';

    const dotColor = isConnected ? '#10B981' : isSearching ? '#F59E0B' : '#64748B';
    const textLabel = label || (isConnected ? 'Connected' : isSearching ? 'Searching...' : 'Offline (Disconnected)');

    return (
        <View style={styles.container}>
            <View style={[styles.dot, { backgroundColor: dotColor }]} />
            <Text style={styles.statusText}>{textLabel}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0F172A',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#334155',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    statusText: {
        color: '#CBD5E1',
        fontSize: 12,
        fontWeight: '600',
    },
});