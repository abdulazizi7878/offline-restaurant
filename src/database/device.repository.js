
import { getDatabase } from "./database";

export const DeviceRepository = {
    async saveDevice(device) {
        const db = await getDatabase();
        const now = new Date().toISOString();

        await db.runAsync(
            `INSERT INTO devices (
        device_id,
        name,
        role,
        is_online,
        last_seen,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(device_id) DO UPDATE SET
        name = excluded.name,
        role = excluded.role,
        is_online = excluded.is_online,
        last_seen = excluded.last_seen,
        updated_at = excluded.updated_at`,
            device.deviceId,
            device.name,
            device.role,
            device.isOnline ? 1 : 0,
            device.lastSeen || now,
            now,
            now
        );

        return this.getDeviceById(device.deviceId);
    },

    async getDeviceById(deviceId) {
        const db = await getDatabase();

        return db.getFirstAsync(
            `SELECT * FROM devices WHERE device_id = ?`,
            deviceId
        );
    },

    async getAllDevices() {
        const db = await getDatabase();

        return db.getAllAsync(
            `SELECT *
       FROM devices
       ORDER BY last_seen DESC`
        );
    },

    async getDevicesByRole(role) {
        const db = await getDatabase();

        return db.getAllAsync(
            `SELECT *
       FROM devices
       WHERE role = ?
       ORDER BY last_seen DESC`,
            role
        );
    },

    async setOnlineStatus(deviceId, isOnline) {
        const db = await getDatabase();
        const now = new Date().toISOString();

        return db.runAsync(
            `UPDATE devices
       SET is_online = ?,
           last_seen = ?,
           updated_at = ?
       WHERE device_id = ?`,
            isOnline ? 1 : 0,
            now,
            now,
            deviceId
        );
    },

    async deleteDevice(deviceId) {
        const db = await getDatabase();

        return db.runAsync(
            `DELETE FROM devices WHERE device_id = ?`,
            deviceId
        );
    },
};
