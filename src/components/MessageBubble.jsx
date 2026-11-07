import { StyleSheet, Text, View } from 'react-native';

export default function MessageBubble({ message, isSender, timestamp }) {
    return (
        <View style={[styles.bubbleWrapper, isSender ? styles.senderWrapper : styles.receiverWrapper]}>
            <View style={[styles.bubble, isSender ? styles.senderBubble : styles.receiverBubble]}>
                <Text style={[styles.text, isSender ? styles.senderText : styles.receiverText]}>
                    {message}
                </Text>
                <Text style={[styles.timestamp, isSender ? styles.senderTimestamp : styles.receiverTimestamp]}>
                    {timestamp}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    bubbleWrapper: {
        marginVertical: 4,
        paddingHorizontal: 16,
    },
    senderWrapper: {
        alignItems: 'flex-end',
    },
    receiverWrapper: {
        alignItems: 'flex-start',
    },
    bubble: {
        maxWidth: '80%',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
    },
    senderBubble: {
        backgroundColor: '#10B981',
        borderBottomRightRadius: 2,
    },
    receiverBubble: {
        backgroundColor: '#1E293B',
        borderBottomLeftRadius: 2,
        borderWidth: 1,
        borderColor: '#334155',
    },
    text: {
        fontSize: 15,
        lineHeight: 20,
    },
    senderText: {
        color: '#022C22',
        fontWeight: '500',
    },
    receiverText: {
        color: '#F8FAFC',
    },
    timestamp: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    senderTimestamp: {
        color: '#064E3B',
    },
    receiverTimestamp: {
        color: '#64748B',
    },
});