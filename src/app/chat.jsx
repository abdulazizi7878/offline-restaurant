import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
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
import { ConnectionService } from '../services/connection.service';
import { MessageService } from '../services/message.service';

export default function ChatScreen() {
    const router = useRouter();
    const { peerId, partnerName = 'Nearby Peer', partnerRole = 'Staff' } = useLocalSearchParams();
    const [inputText, setInputText] = useState('');
    const [isConnected, setIsConnected] = useState(true);
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        // 1. Load persisted conversation history
        if (peerId) {
            MessageService.getConversation(peerId)
                .then((history) => {
                    if (history) {
                        setMessages(
                            history.map((m) => ({
                                id: m.message_id,
                                text: m.text,
                                isSender: m.direction === 'sent',
                                timestamp: new Date(m.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                }),
                            }))
                        );
                    }
                })
                .catch((err) => {
                    console.warn('Could not load historical chat conversation yet:', err.message);
                });
        }

        // 2. Listen to real-time incoming messages & ACKs
        const unsubscribeMessage = MessageService.subscribe((event, data) => {
            if (event === 'messageReceived') {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: data.messageId,
                        text: data.payload.text,
                        isSender: false,
                        timestamp: new Date(data.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                        }),
                    },
                ]);
            }
        });

        // 3. Listen to connection lifecycle events
        const unsubscribeConnection = ConnectionService.subscribe((event, data) => {
            if (event === 'disconnected' && data.peerId === peerId) {
                setIsConnected(false);
            }
        });

        return () => {
            unsubscribeMessage();
            unsubscribeConnection();
        };
    }, [peerId]);

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const text = inputText.trim();
        setInputText('');

        try {
            if (!peerId) {
                throw new Error('No peer ID connected');
            }

            const sentEnvelope = await MessageService.sendChat(peerId, text);
            setMessages((prev) => [
                ...prev,
                {
                    id: sentEnvelope.messageId,
                    text: text,
                    isSender: true,
                    timestamp: new Date().toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                    }),
                },
            ]);
        } catch (err) {
            Alert.alert('Send Failed', err.message);
        }
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
                    <ConnectionStatus
                        status={isConnected ? 'connected' : 'disconnected'}
                        label={isConnected ? 'Connected' : 'Disconnected'}
                    />
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
    safeArea: { flex: 1, backgroundColor: '#0B132B' },
    keyboardView: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#1E293B',
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    backButton: { padding: 4, marginRight: 8 },
    headerInfo: { flex: 1, marginRight: 8 },
    partnerName: { color: '#F8FAFC', fontSize: 16, fontWeight: '700' },
    partnerRole: { color: '#94A3B8', fontSize: 12 },
    messageList: { paddingVertical: 12 },
});