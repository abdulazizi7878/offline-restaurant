
import { DeviceRepository } from "../database/device.repository";
import { MessageRepository } from "../database/message.repository";
import { NearbyClient } from "../lib/nearby/nearbyClient";
import { MessageFactory } from "../protocol/messageFactory";
import { MESSAGE_TYPES } from "../protocol/messageTypes";
import { parseEnvelope } from "../protocol/messageValidator";
import { ConnectionService } from "./connection.service";
import { DeviceService } from "./device.service";

const listeners = new Set();
const peerDevices = new Map();

let initialized = false;
let unsubscribeConnection = null;
let unsubscribeMessages = null;
let localDevice = null;

function emit(event, data) {
    listeners.forEach((listener) => {
        try {
            listener(event, data);
        } catch (error) {
            console.error("Message listener error:", error);
        }
    });
}

async function transmit(peerId, envelope) {
    await NearbyClient.send(peerId, JSON.stringify(envelope));
}

async function handleIncoming({ peerId, text }) {
    const result = parseEnvelope(text);

    if (!result.valid) {
        console.warn("Rejected incoming message:", result.error);
        emit("invalidMessage", { peerId, error: result.error });
        return;
    }

    const message = result.message;

    if (message.sender.deviceId === localDevice.deviceId) {
        return;
    }

    if (message.type === MESSAGE_TYPES.DEVICE_HELLO) {
        peerDevices.set(peerId, message.sender);

        await DeviceRepository.saveDevice({
            deviceId: message.sender.deviceId,
            name: message.sender.name,
            role: message.sender.role,
            isOnline: true,
        });

        emit("deviceIdentified", {
            peerId,
            device: message.sender,
        });

        return;
    }

    const remoteDevice = peerDevices.get(peerId);

    if (!remoteDevice) {
        emit("invalidMessage", {
            peerId,
            error: "Sender identity has not been established",
        });
        return;
    }

    if (remoteDevice.deviceId !== message.sender.deviceId) {
        emit("invalidMessage", {
            peerId,
            error: "Sender identity does not match handshake",
        });
        return;
    }

    if (
        message.recipientDeviceId &&
        message.recipientDeviceId !== localDevice.deviceId
    ) {
        return;
    }

    if (message.type === MESSAGE_TYPES.CHAT_MESSAGE) {
        const saved = await MessageRepository.saveMessage({
            messageId: message.messageId,
            senderDeviceId: message.sender.deviceId,
            recipientDeviceId: localDevice.deviceId,
            type: message.type,
            text: message.payload.text,
            direction: "received",
            status: "received",
            createdAt: message.createdAt,
        });

        if (saved.inserted) {
            emit("messageReceived", {
                ...message,
                direction: "received",
                status: "received",
            });
        }

        const ack = MessageFactory.createAck({
            sender: localDevice,
            recipientDeviceId: message.sender.deviceId,
            acknowledgedMessageId: message.messageId,
        });

        await transmit(peerId, ack);
        return;
    }

    if (message.type === MESSAGE_TYPES.MESSAGE_ACK) {
        await MessageRepository.updateStatus(
            message.payload.acknowledgedMessageId,
            "delivered"
        );

        emit("messageDelivered", {
            messageId: message.payload.acknowledgedMessageId,
        });
    }
}

export const MessageService = {
    subscribe(callback) {
        listeners.add(callback);

        return () => {
            listeners.delete(callback);
        };
    },

    async initialize() {
        if (initialized) return;

        localDevice = await DeviceService.getCurrentDevice();

        if (!localDevice) {
            throw new Error("Initialize the device before MessageService");
        }

        unsubscribeConnection = ConnectionService.subscribe(
            async (event, peer) => {
                if (event === "connected") {
                    try {
                        const hello = MessageFactory.createHello(localDevice);
                        await transmit(peer.peerId, hello);
                    } catch (error) {
                        emit("transportError", {
                            peerId: peer.peerId,
                            error: error.message,
                        });
                    }
                }

                if (event === "disconnected") {
                    const device = peerDevices.get(peer.peerId);

                    if (device) {
                        await DeviceRepository.setOnlineStatus(
                            device.deviceId,
                            false
                        );
                    }

                    peerDevices.delete(peer.peerId);
                }
            }
        );

        unsubscribeMessages = NearbyClient.onTextReceived(
            (event) => {
                handleIncoming(event).catch((error) => {
                    console.error("Incoming message processing failed:", error);
                    emit("transportError", {
                        peerId: event.peerId,
                        error: error.message,
                    });
                });
            }
        );

        initialized = true;
    },

    async sendChat(peerId, text) {
        if (!initialized || !localDevice) {
            throw new Error("MessageService is not initialized");
        }

        const cleanText = text.trim();

        if (!cleanText) {
            throw new Error("Message cannot be empty");
        }

        if (cleanText.length > 4000) {
            throw new Error("Message is too long");
        }

        const recipient = peerDevices.get(peerId);

        if (!recipient) {
            throw new Error("Peer identity has not been established yet");
        }

        const envelope = MessageFactory.createChatMessage({
            sender: localDevice,
            recipientDeviceId: recipient.deviceId,
            text: cleanText,
        });

        await MessageRepository.saveMessage({
            messageId: envelope.messageId,
            senderDeviceId: localDevice.deviceId,
            recipientDeviceId: recipient.deviceId,
            type: envelope.type,
            text: cleanText,
            direction: "sent",
            status: "queued",
            createdAt: envelope.createdAt,
        });

        try {
            await transmit(peerId, envelope);

            await MessageRepository.updateStatus(
                envelope.messageId,
                "sent"
            );

            emit("messageSent", {
                ...envelope,
                direction: "sent",
                status: "sent",
            });

            return envelope;
        } catch (error) {
            emit("transportError", {
                peerId,
                error: error.message,
            });

            throw error;
        }
    },

    getDeviceForPeer(peerId) {
        return peerDevices.get(peerId) || null;
    },

    async getConversation(peerId) {
        const recipient = peerDevices.get(peerId);

        if (!recipient) {
            throw new Error("Peer identity is not known");
        }

        return MessageRepository.getConversation(
            recipient.deviceId,
            localDevice.deviceId
        );
    },

    async destroy() {
        unsubscribeConnection?.();
        unsubscribeMessages?.();

        unsubscribeConnection = null;
        unsubscribeMessages = null;

        peerDevices.clear();
        initialized = false;
        localDevice = null;
    },
};
