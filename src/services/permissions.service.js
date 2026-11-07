
import {
    PermissionsAndroid,
    Platform,
} from "react-native";

export const PermissionsService = {
    async requestNearbyPermissions() {
        if (Platform.OS !== "android") {
            throw new Error("This app currently supports Android only");
        }

        const apiLevel = Number(Platform.Version);

        const permissions = [];

        if (apiLevel >= 31) {
            permissions.push(
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE
            );
        } else {
            permissions.push(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            );
        }

        if (apiLevel >= 33) {
            permissions.push(
                PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES
            );
        }

        const results = await PermissionsAndroid.requestMultiple(
            permissions
        );

        const denied = Object.entries(results)
            .filter(([, status]) =>
                status !== PermissionsAndroid.RESULTS.GRANTED
            )
            .map(([permission]) => permission);

        if (denied.length > 0) {
            throw new Error(
                `Nearby permissions denied: ${denied.join(", ")}`
            );
        }

        return true;
    },
};
