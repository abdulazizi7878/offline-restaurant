
import { MESSAGE_TYPES, PROTOCOL_VERSION } from "./messageTypes";

const VALID_TYPES = Object.values(MESSAGE_TYPES);
const VALID_ROLES = ["cashier", "waiter"];
const MAX_TEXT_LENGTH = 4000;

export function validateEnvelope(message) {
    if (!message || typeof message !== "object") {
        return { valid: false, error: "Invalid message object" };
    }

    if (message.version !== PROTOCOL_VERSION) {
        return { valid: false, error: "Unsupported protocol version" };
    }

    if (!VALID_TYPES.includes(message.type)) {
        return { valid: false, error: "Unknown message type" };
    }

    if (
        typeof message.messageId !== "string" ||
        !message.messageId
    ) {
        return { valid: false, error: "Missing message ID" };
    }

    if (
        !message.sender ||
        typeof message.sender.deviceId !== "string" ||
        !message.sender.deviceId ||
        !VALID_ROLES.includes(message.sender.role)
    ) {
        return { valid: false, error: "Invalid sender" };
    }

    if (!message.payload || typeof message.payload !== "object") {
        return { valid: false, error: "Invalid payload" };
    }

    if (
        message.type === MESSAGE_TYPES.CHAT_MESSAGE &&
        (
            typeof message.payload.text !== "string" ||
            !message.payload.text.trim() ||
            message.payload.text.length > MAX_TEXT_LENGTH
        )
    ) {
        return { valid: false, error: "Invalid chat text" };
    }

    if (
        message.type === MESSAGE_TYPES.MESSAGE_ACK &&
        typeof message.payload.acknowledgedMessageId !== "string"
    ) {
        return { valid: false, error: "Invalid acknowledgement" };
    }

    return { valid: true };
}

export function parseEnvelope(rawText) {
    try {
        const message = JSON.parse(rawText);
        const result = validateEnvelope(message);

        if (!result.valid) {
            return { valid: false, error: result.error };
        }

        return { valid: true, message };
    } catch {
        return { valid: false, error: "Malformed JSON message" };
    }
}
