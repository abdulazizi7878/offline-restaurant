
import { getDatabase } from "./database";

export const MessageRepository = {
    async saveMessage(message) {
        const db = await getDatabase();
        const now = new Date().toISOString();

        const result = await db.runAsync(
            `INSERT OR IGNORE INTO messages (
        message_id,
        sender_device_id,
        recipient_device_id,
        type,
        text,
        direction,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            message.messageId,
            message.senderDeviceId,
            message.recipientDeviceId,
            message.type || "chat.message",
            message.text,
            message.direction,
            message.status || (
                message.direction === "received" ? "received" : "queued"
            ),
            message.createdAt || now,
            now
        );

        return {
            inserted: result.changes > 0,
            messageId: message.messageId,
        };
    },

    async getMessagesWithDevice(deviceId, limit = 100) {
        const db = await getDatabase();

        return db.getAllAsync(
            `SELECT *
       FROM messages
       WHERE sender_device_id = ?
          OR recipient_device_id = ?
       ORDER BY created_at ASC
       LIMIT ?`,
            deviceId,
            deviceId,
            limit
        );
    },

    async getMessageById(messageId) {
        const db = await getDatabase();

        return db.getFirstAsync(
            `SELECT * FROM messages WHERE message_id = ?`,
            messageId
        );
    },

    async updateStatus(messageId, status) {
        const db = await getDatabase();

        const allowedStatuses = [
            "queued",
            "sent",
            "delivered",
            "received",
            "failed",
        ];

        if (!allowedStatuses.includes(status)) {
            throw new Error(`Invalid message status: ${status}`);
        }

        return db.runAsync(
            `UPDATE messages
       SET status = ?, updated_at = ?
       WHERE message_id = ?`,
            status,
            new Date().toISOString(),
            messageId
        );
    },

    async getPendingMessages() {
        const db = await getDatabase();

        return db.getAllAsync(
            `SELECT *
       FROM messages
       WHERE direction = 'sent'
         AND status IN ('queued', 'failed')
       ORDER BY created_at ASC`
        );
    },

    async getConversation(deviceId, localDeviceId, limit = 100) {
        const db = await getDatabase();

        return db.getAllAsync(
            `SELECT *
       FROM messages
       WHERE (
         sender_device_id = ? AND recipient_device_id = ?
       ) OR (
         sender_device_id = ? AND recipient_device_id = ?
       )
       ORDER BY created_at ASC
       LIMIT ?`,
            localDeviceId,
            deviceId,
            deviceId,
            localDeviceId,
            limit
        );
    },

    async deleteConversation(deviceId, localDeviceId) {
        const db = await getDatabase();

        return db.runAsync(
            `DELETE FROM messages
       WHERE (
         sender_device_id = ? AND recipient_device_id = ?
       ) OR (
         sender_device_id = ? AND recipient_device_id = ?
       )`,
            localDeviceId,
            deviceId,
            deviceId,
            localDeviceId
        );
    },
};
