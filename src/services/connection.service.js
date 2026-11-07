
import * as Network from "expo-network";
import { DeviceService } from "./device.service";
import { TCPTransport } from "./tcp-transport.service";

const listeners = new Set();
const peers = new Map();

let started = false;
let serverInfo = null;

function emit(event, data) {
    listeners.forEach((listener) => {
        try {
            listener(event, data);
        } catch (error) {
            console.error("Connection listener error:", error);
        }
    });
}

function isValidIPv4(ip) {
    if (typeof ip !== "string") return false;

    const parts = ip.split(".");
    return (
        parts.length === 4 &&
        parts.every((part) => {
            const number = Number(part);
            return /^\d+$/.test(part) && number >= 0 && number <= 255;
        }) &&
        ip !== "0.0.0.0" &&
        ip !== "127.0.0.1"
    );
}

TCPTransport.on("connection", (connection) => {
    const peer = {
        peerId: connection.peerId,
        name: "Connected device",
        status: "connected",
        address: connection.remoteAddress,
    };

    peers.set(connection.peerId, peer);
    emit("connected", peer);
});

TCPTransport.on("disconnection", ({ peerId }) => {
    const peer = peers.get(peerId);

    if (peer) {
        peers.set(peerId, {
            ...peer,
            status: "disconnected",
        });
    }

    emit("disconnected", { peerId });
});

TCPTransport.on("error", ({ peerId, error }) => {
    emit("transportError", {
        peerId,
        error: error?.message || "TCP network error",
    });
});

export const ConnectionService = {
    subscribe(callback) {
        listeners.add(callback);
        return () => listeners.delete(callback);
    },

    getPeers() {
        return Array.from(peers.values());
    },

    async start() {
        if (started) return serverInfo;

        const device = await DeviceService.getCurrentDevice();

        if (!device) {
            throw new Error("Initialize the device before connecting");
        }

        let ipAddress = null;

        if (device.role === "cashier") {
            await TCPTransport.startServer();

            try {
                const detectedIP = await Network.getIpAddressAsync();

                if (isValidIPv4(detectedIP)) {
                    ipAddress = detectedIP;
                }
            } catch (error) {
                console.warn("Could not detect local IP:", error);
            }
        }

        started = true;

        serverInfo = {
            device,
            ipAddress,
            port: TCPTransport.getPort(),
            address: ipAddress
                ? `${ipAddress}:${TCPTransport.getPort()}`
                : null,
        };

        emit("started", serverInfo);

        return serverInfo;
    },

    async connect(host) {
        const device = await DeviceService.getCurrentDevice();

        if (!device || device.role !== "waiter") {
            throw new Error("Only waiter devices can connect to a cashier");
        }

        return TCPTransport.connect(host);
    },

    async stop() {
        if (!started) return;

        TCPTransport.stopServer();

        started = false;
        serverInfo = null;

        emit("stopped", null);
    },

    async disconnect(peerId) {
        TCPTransport.disconnect(peerId);
        peers.delete(peerId);
    },

    async disconnectAll() {
        TCPTransport.disconnectAll();
        peers.clear();
        started = false;
        serverInfo = null;
    },
};
