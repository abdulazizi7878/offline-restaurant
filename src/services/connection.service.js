
import { NearbyClient } from "../lib/nearby/nearbyClient";
import { DeviceService } from "./device.service";
import { PermissionsService } from "./permissions.service";

const listeners = new Set();
const peers = new Map();

let subscriptions = [];
let started = false;

function emit(event, data) {
    listeners.forEach((listener) => {
        try {
            listener(event, data);
        } catch (error) {
            console.error("Connection listener error:", error);
        }
    });
}

function subscribeNearbyEvents() {
    subscriptions = [
        NearbyClient.onPeerFound((peer) => {
            peers.set(peer.peerId, {
                peerId: peer.peerId,
                name: peer.name,
                status: "discovered",
            });

            emit("peerFound", peer);
        }),

        NearbyClient.onPeerLost(({ peerId }) => {
            peers.delete(peerId);
            emit("peerLost", { peerId });
        }),

        NearbyClient.onInvitationReceived((peer) => {
            emit("invitationReceived", peer);
        }),

        NearbyClient.onConnected((peer) => {
            peers.set(peer.peerId, {
                ...peers.get(peer.peerId),
                ...peer,
                status: "connected",
            });

            emit("connected", peer);
        }),

        NearbyClient.onDisconnected(({ peerId }) => {
            const peer = peers.get(peerId);

            if (peer) {
                peers.set(peerId, {
                    ...peer,
                    status: "disconnected",
                });
            }

            emit("disconnected", { peerId });
        }),
    ];
}

export const ConnectionService = {
    subscribe(callback) {
        listeners.add(callback);

        return () => {
            listeners.delete(callback);
        };
    },

    getPeers() {
        return Array.from(peers.values());
    },

    async start() {
        if (started) return;

        const device = await DeviceService.getCurrentDevice();

        if (!device) {
            throw new Error("Initialize the device before connecting");
        }

        await PermissionsService.requestNearbyPermissions();

        subscribeNearbyEvents();

        try {
            await NearbyClient.startAdvertising("RestaurantMessenger");
            await NearbyClient.startDiscovering("RestaurantMessenger");

            started = true;
            emit("started", device);
        } catch (error) {
            subscriptions.forEach((unsubscribe) => unsubscribe?.());
            subscriptions = [];
            throw error;
        }
    },

    async stop() {
        if (!started) return;

        await Promise.allSettled([
            NearbyClient.stopAdvertising(),
            NearbyClient.stopDiscovering(),
        ]);

        subscriptions.forEach((unsubscribe) => unsubscribe?.());
        subscriptions = [];

        started = false;
        emit("stopped", null);
    },

    async connect(peerId) {
        return NearbyClient.requestConnection(peerId);
    },

    async accept(peerId) {
        return NearbyClient.acceptConnection(peerId);
    },

    async reject(peerId) {
        return NearbyClient.rejectConnection(peerId);
    },

    async disconnect(peerId) {
        return NearbyClient.disconnect(peerId);
    },

    async disconnectAll() {
        await NearbyClient.disconnectAll();
    },
};
