
import { MESSAGE_TYPES, PROTOCOL_VERSION } from "./messageTypes";

function createMessageId() {
    return `msg_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 12)}`;
}

function createEnvelope({ type, sender, recipientDeviceId, payload }) {
    return {
        type,
        version: PROTOCOL_VERSION,
        messageId: createMessageId(),
        sender: {
            deviceId: sender.deviceId,
            name: sender.name,
            role: sender.role,
        },
        recipientDeviceId: recipientDeviceId || null,
        payload,
        createdAt: new Date().toISOString(),
    };
}

export const MessageFactory = {
    createHello(device) {
        return createEnvelope({
            type: MESSAGE_TYPES.DEVICE_HELLO,
            sender: device,
            payload: {},
        });
    },

    createChatMessage({ sender, recipientDeviceId, text }) {
        return createEnvelope({
            type: MESSAGE_TYPES.CHAT_MESSAGE,
            sender,
            recipientDeviceId,
            payload: { text },
        });
    },

    createAck({ sender, recipientDeviceId, acknowledgedMessageId }) {
        return createEnvelope({
            type: MESSAGE_TYPES.MESSAGE_ACK,
            sender,
            recipientDeviceId,
            payload: { acknowledgedMessageId },
        });
    },
};
