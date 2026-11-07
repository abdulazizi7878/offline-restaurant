
import TcpSocket from "react-native-tcp-socket";

const PORT = 8765;

const listeners = {
    connection: new Set(),
    disconnection: new Set(),
    data: new Set(),
    error: new Set(),
};

const sockets = new Map();
const buffers = new Map();

let server = null;
let peerCounter = 0;

function emit(event, data) {
    listeners[event]?.forEach((callback) => {
        try {
            callback(data);
        } catch (error) {
            console.error(`TCP ${event} listener error:`, error);
        }
    });
}

function attachSocket(socket, peerId) {
    sockets.set(peerId, socket);
    buffers.set(peerId, "");

    socket.on("data", (chunk) => {
        let buffer = buffers.get(peerId) || "";
        buffer += chunk.toString();

        let newlineIndex;

        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, newlineIndex).trim();
            buffer = buffer.slice(newlineIndex + 1);

            if (line) {
                emit("data", { peerId, text: line });
            }
        }

        buffers.set(peerId, buffer);
    });

    socket.on("error", (error) => {
        emit("error", { peerId, error });
    });

    socket.on("close", () => {
        sockets.delete(peerId);
        buffers.delete(peerId);
        emit("disconnection", { peerId });
    });
}

export const TCPTransport = {
    on(event, callback) {
        if (!listeners[event]) {
            throw new Error(`Unknown TCP event: ${event}`);
        }

        listeners[event].add(callback);

        return () => listeners[event].delete(callback);
    },

    startServer() {
        if (server?.listening) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            server = TcpSocket.createServer((socket) => {
                peerCounter += 1;

                const peerId = `tcp-peer-${Date.now()}-${peerCounter}`;

                attachSocket(socket, peerId);

                emit("connection", {
                    peerId,
                    remoteAddress: socket.remoteAddress || null,
                });
            });

            const handleListening = () => {
                server.removeListener("error", handleError);
                resolve();
            };

            const handleError = (error) => {
                server.removeListener("listening", handleListening);
                emit("error", { peerId: null, error });
                reject(error);
            };

            server.once("listening", handleListening);
            server.once("error", handleError);

            server.listen({
                port: PORT,
                host: "0.0.0.0",
                reuseAddress: true,
            });
        });
    },

    stopServer() {
        if (!server) return;

        try {
            server.close();
        } catch (error) {
            console.warn("TCP server close warning:", error);
        }

        server = null;
    },

    connect(host) {
        const cleanHost = String(host || "").trim();

        if (!cleanHost) {
            return Promise.reject(new Error("Enter the cashier IP address"));
        }

        const peerId = `cashier-${cleanHost}:${PORT}`;

        if (sockets.has(peerId)) {
            return Promise.resolve(peerId);
        }

        return new Promise((resolve, reject) => {
            let settled = false;

            const socket = TcpSocket.createConnection(
                {
                    host: cleanHost,
                    port: PORT,
                    connectTimeout: 8000,
                    reuseAddress: true,
                    interface: "wifi",
                },
                () => {
                    if (settled) return;
                    settled = true;

                    attachSocket(socket, peerId);

                    emit("connection", {
                        peerId,
                        remoteAddress: cleanHost,
                    });

                    resolve(peerId);
                }
            );

            socket.on("error", (error) => {
                emit("error", { peerId, error });

                if (!settled) {
                    settled = true;
                    reject(error);
                }
            });
        });
    },

    send(peerId, text) {
        const socket = sockets.get(peerId);

        if (!socket) {
            return Promise.reject(
                new Error("TCP connection is not available")
            );
        }

        return new Promise((resolve, reject) => {
            try {
                socket.write(`${text}\n`, "utf8", () => resolve());
            } catch (error) {
                reject(error);
            }
        });
    },

    disconnect(peerId) {
        const socket = sockets.get(peerId);

        if (socket) {
            socket.destroy();
        }
    },

    disconnectAll() {
        for (const socket of sockets.values()) {
            socket.destroy();
        }

        sockets.clear();
        buffers.clear();
        this.stopServer();
    },

    getPort() {
        return PORT;
    },
};
