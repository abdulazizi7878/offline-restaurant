import {
    Strategy,
    acceptConnection,
    disconnect,
    onConnected,
    onDisconnected,
    onInvitationReceived,
    onPeerFound,
    onPeerLost,
    onTextReceived,
    rejectConnection,
    requestConnection,
    sendText,
    startAdvertise,
    startDiscovery,
    stopAdvertise,
    stopDiscovery,
} from "expo-nearby-connections";

const CONNECTION_STRATEGY = Strategy.P2P_CLUSTER;

export const NearbyClient = {
    startAdvertising(deviceName) {
        return startAdvertise(deviceName, CONNECTION_STRATEGY);
    },

    stopAdvertising() {
        return stopAdvertise();
    },

    startDiscovering(deviceName) {
        return startDiscovery(deviceName, CONNECTION_STRATEGY);
    },

    stopDiscovering() {
        return stopDiscovery();
    },

    requestConnection(peerId) {
        return requestConnection(peerId);
    },

    acceptConnection(peerId) {
        return acceptConnection(peerId);
    },

    rejectConnection(peerId) {
        return rejectConnection(peerId);
    },

    disconnect(peerId) {
        return disconnect(peerId);
    },

    disconnectAll() {
        return disconnect();
    },

    send(peerId, text) {
        return sendText(peerId, text);
    },

    onPeerFound(callback) {
        return onPeerFound(callback);
    },

    onPeerLost(callback) {
        return onPeerLost(callback);
    },

    onInvitationReceived(callback) {
        return onInvitationReceived(callback);
    },

    onConnected(callback) {
        return onConnected(callback);
    },

    onDisconnected(callback) {
        return onDisconnected(callback);
    },

    onTextReceived(callback) {
        return onTextReceived(callback);
    },
};