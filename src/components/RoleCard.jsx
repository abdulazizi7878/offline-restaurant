import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function RoleCard({ title, subtitle, icon, onPress }) {
    return (
        <TouchableOpacity
            activeOpacity={0.85}
            style={styles.card}
            onPress={onPress}
        >
            <View style={styles.iconContainer}>
                <MaterialCommunityIcons name={icon} size={32} color="#10B981" />
            </View>
            <View style={styles.content}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#64748B" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 20,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: '#334155',
        elevation: 3,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 14,
        backgroundColor: '#0F172A',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    content: {
        flex: 1,
    },
    title: {
        color: '#F8FAFC',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    subtitle: {
        color: '#94A3B8',
        fontSize: 13,
        lineHeight: 18,
    },
});