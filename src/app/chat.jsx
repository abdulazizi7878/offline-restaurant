import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import ConnectionStatus from '../components/ConnectionStatus';
import MessageBubble from '../components/MessageBubble';
import MessageInput from '../components/MessageInput';

export default function ChatScreen() {
    const router = useRouter();
    const { partnerName = 'Nearby Peer', partnerRole = 'Staff' } = useLocalSearchParams();
    const [inputText, setInputText] = useState('');

    // UI Placeholder messages
    const [messages, setMessages] = useState([
        {
            id: '1',
            text: 'Connected via offline channel. (UI Demo)',
            isSender: false,
            timestamp: '12:00 PM',
        },
        {
            id: '2',
            text: 'Order 42 ready for pickup at station 1.',
            isSender: false,
            timestamp: '12:01 PM',
        },
    ]);

    const handleSend = () => {
        if (!inputText.trim()) return;

        const newMessage = {
            id: Date.now().toString(),
            text: inputText.trim(),
            isSender: true,
            timestamp: 'Just now',
        };

        setMessages((prev) => [...prev, newMessage]);
        setInputText('');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#0B132B" />
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#F8FAFC" />
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <Text style={styles.partnerName} numberOfLines={1}>
                            {partnerName}
                        </Text>
                        <Text style={styles.partnerRole}>{partnerRole}</Text>
                    </View>
                    <ConnectionStatus status="connected" label="Connected" />
                </View>

                <FlatList
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <MessageBubble
                            message={item.text}
                            isSender={item.isSender}
                            timestamp={item.timestamp}
                        />
                    )}
                    contentContainerStyle={styles.messageList}
                />

                <MessageInput
                    value={inputText}
                    onChangeText={setInputText}
                    onSend={handleSend}
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#0B132B',
    },
    keyboardView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#1E293B',
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    backButton: {
        padding: 4,
        marginRight: 8,
    },
    headerInfo: {
        flex: 1,
        marginRight: 8,
    },
    partnerName: {
        color: '#F8FAFC',
        fontSize: 16,
        fontWeight: '700',
    },
    partnerRole: {
        color: '#94A3B8',
        fontSize: 12,
    },
    messageList: {
        paddingVertical: 12,
    },
});