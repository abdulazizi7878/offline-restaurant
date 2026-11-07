import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export default function MessageInput({ value, onChangeText, onSend }) {
    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                placeholder="Type an offline message..."
                placeholderTextColor="#64748B"
                value={value}
                onChangeText={onChangeText}
                multiline
            />
            <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.sendButton, !value?.trim() && styles.disabledButton]}
                onPress={onSend}
                disabled={!value?.trim()}
            >
                <MaterialCommunityIcons
                    name="send"
                    size={20}
                    color={value?.trim() ? '#0F172A' : '#64748B'}
                />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#1E293B',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#334155',
    },
    input: {
        flex: 1,
        backgroundColor: '#0F172A',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 10,
        color: '#F8FAFC',
        fontSize: 15,
        maxHeight: 100,
        borderWidth: 1,
        borderColor: '#334155',
    },
    sendButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    disabledButton: {
        backgroundColor: '#334155',
    },
});