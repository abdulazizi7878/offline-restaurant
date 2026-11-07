
import * as SQLite from "expo-sqlite";

const DATABASE_NAME = "restaurant-messenger.db";

let databaseInstance = null;
let initializationPromise = null;

export async function initializeDatabase() {
    if (databaseInstance) return databaseInstance;
    if (initializationPromise) return initializationPromise;

    initializationPromise = (async () => {
        const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

        await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS devices (
        device_id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('cashier', 'waiter')),
        is_online INTEGER NOT NULL DEFAULT 0,
        last_seen TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id TEXT NOT NULL UNIQUE,
        sender_device_id TEXT NOT NULL,
        recipient_device_id TEXT NOT NULL,
        type TEXT NOT NULL,
        text TEXT NOT NULL,
        direction TEXT NOT NULL CHECK(direction IN ('sent', 'received')),
        status TEXT NOT NULL DEFAULT 'queued'
          CHECK(status IN ('queued', 'sent', 'delivered', 'received', 'failed')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_messages_peer_created
      ON messages(sender_device_id, recipient_device_id, created_at);

      CREATE INDEX IF NOT EXISTS idx_messages_status
      ON messages(status);

      CREATE TABLE IF NOT EXISTS app_settings (
        setting_key TEXT PRIMARY KEY NOT NULL,
        setting_value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

        databaseInstance = db;
        return db;
    })();

    try {
        return await initializationPromise;
    } catch (error) {
        initializationPromise = null;
        throw error;
    }
}

export async function getDatabase() {
    if (!databaseInstance) {
        return initializeDatabase();
    }

    return databaseInstance;
}
