
import { getDatabase } from "../database/database";
import { DeviceRepository } from "../database/device.repository";

const SETTINGS = {
    DEVICE_ID: "device_id",
    DEVICE_NAME: "device_name",
    DEVICE_ROLE: "device_role",
};

let currentDevice = null;

function generateDeviceId() {
    return `device_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 12)}`;
}

async function getSetting(key) {
    const db = await getDatabase();

    const row = await db.getFirstAsync(
        "SELECT setting_value FROM app_settings WHERE setting_key = ?",
        key
    );

    return row?.setting_value ?? null;
}

async function saveSetting(key, value) {
    const db = await getDatabase();

    await db.runAsync(
        `INSERT INTO app_settings (setting_key, setting_value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(setting_key) DO UPDATE SET
       setting_value = excluded.setting_value,
       updated_at = excluded.updated_at`,
        key,
        value,
        new Date().toISOString()
    );
}

export const DeviceService = {
    async initialize({ name, role }) {
        if (!["cashier", "waiter"].includes(role)) {
            throw new Error("Role must be cashier or waiter");
        }

        const savedId = await getSetting(SETTINGS.DEVICE_ID);
        const savedName = await getSetting(SETTINGS.DEVICE_NAME);
        const savedRole = await getSetting(SETTINGS.DEVICE_ROLE);

        const device = {
            deviceId: savedId || generateDeviceId(),
            name: name || savedName || "Restaurant Device",
            role: role || savedRole,
            isOnline: true,
        };

        await saveSetting(SETTINGS.DEVICE_ID, device.deviceId);
        await saveSetting(SETTINGS.DEVICE_NAME, device.name);
        await saveSetting(SETTINGS.DEVICE_ROLE, device.role);

        await DeviceRepository.saveDevice(device);

        currentDevice = device;
        return device;
    },

    async getCurrentDevice() {
        if (currentDevice) return currentDevice;

        const deviceId = await getSetting(SETTINGS.DEVICE_ID);
        const name = await getSetting(SETTINGS.DEVICE_NAME);
        const role = await getSetting(SETTINGS.DEVICE_ROLE);

        if (!deviceId || !name || !role) return null;

        currentDevice = {
            deviceId,
            name,
            role,
            isOnline: true,
        };

        return currentDevice;
    },

    async updateProfile({ name, role }) {
        const current = await this.getCurrentDevice();

        if (!current) {
            throw new Error("Device has not been initialized");
        }

        if (role && !["cashier", "waiter"].includes(role)) {
            throw new Error("Invalid device role");
        }

        currentDevice = {
            ...current,
            name: name || current.name,
            role: role || current.role,
        };

        await saveSetting(SETTINGS.DEVICE_NAME, currentDevice.name);
        await saveSetting(SETTINGS.DEVICE_ROLE, currentDevice.role);
        await DeviceRepository.saveDevice(currentDevice);

        return currentDevice;
    },
};
