
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import ConnectionStatus from "../components/ConnectionStatus";
import { ConnectionService } from "../services/connection.service";
import { DeviceService } from "../services/device.service";
import { MessageService } from "../services/message.service";

export default function WaiterScreen() {
    const router = useRouter();

    const [cashierIp, setCashierIp] = useState("");
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        let unsubscribeConnection;
        let unsubscribeMessages;
        let mounted = true;

        async function setup() {
            try {
                await DeviceService.initialize({
                    name: "Waiter Terminal",
                    role: "waiter",
                });

                await MessageService.initialize();

                unsubscribeConnection = ConnectionService.subscribe(
                    (event) => {
                        if (event === "connected") {
                            setIsConnected(true);
                            setIsConnecting(false);
                        }

                        if (event === "disconnected") {
                            setIsConnected(false);
                            setIsConnecting(false);
                        }
                    }
                );

                unsubscribeMessages = MessageService.subscribe(
                    (event, data) => {
                        if (
                            event === "deviceIdentified" &&
                            data.device.role === "cashier"
                        ) {
                            router.push({
                                pathname: "/chat",
                                params: {
                                    peerId: data.peerId,
                                    partnerName: data.device.name,
                                    partnerRole: data.device.role,
                                },
                            });
                        }
                    }
                );
            } catch (error) {
                if (mounted) {
                    Alert.alert("Initialization Error", error.message);
                }
            }
        }

        setup();

        return () => {
            mounted = false;
            unsubscribeConnection?.();
            unsubscribeMessages?.();
        };
    }, []);

    const handleConnect = async () => {
        const ip = cashierIp.trim();

        if (!ip) {
            Alert.alert("Missing IP address", "Enter the cashier's hotspot IP.");
            return;
        }

        try {
            setIsConnecting(true);
            await ConnectionService.connect(ip);
        } catch (error) {
            setIsConnecting(false);
            Alert.alert(
                "Connection Failed",
                `${error.message}\n\nCheck that the cashier server is running and both devices are on the same hotspot.`
            );
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#0B132B" />

            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <MaterialCommunityIcons
                            name="arrow-left"
                            size={24}
                            color="#F8FAFC"
                        />
                    </TouchableOpacity>

                    <View>
                        <Text style={styles.title}>Waiter Device</Text>
                        <Text style={styles.roleSubtext}>
                            Active Role: Waiter
                        </Text>
                    </View>
                </View>

                <View style={styles.statusSection}>
                    <Text style={styles.sectionLabel}>CONNECTION STATUS</Text>

                    <ConnectionStatus
                        status={
                            isConnected
                                ? "connected"
                                : isConnecting
                                    ? "searching"
                                    : "disconnected"
                        }
                        label={
                            isConnected
                                ? "Connected to cashier"
                                : isConnecting
                                    ? "Connecting to cashier..."
                                    : "Not connected"
                        }
                    />
                </View>

                <View style={styles.infoCard}>
                    <MaterialCommunityIcons
                        name="access-point-network"
                        size={36}
                        color="#10B981"
                    />

                    <Text style={styles.infoTitle}>
                        Connect to Cashier
                    </Text>

                    <Text style={styles.infoText}>
                        Enter the IP address of the Samsung phone hosting
                        the cashier server.
                    </Text>

                    <TextInput
                        value={cashierIp}
                        onChangeText={setCashierIp}
                        placeholder="e.g. 192.168.43.1"
                        placeholderTextColor="#64748B"
                        keyboardType="numeric"
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!isConnecting}
                        style={styles.input}
                    />

                    <Text style={styles.portText}>
                        TCP PORT: 8765
                    </Text>
                </View>

                <TouchableOpacity
                    activeOpacity={0.8}
                    style={[
                        styles.connectButton,
                        isConnecting && styles.disabledButton,
                    ]}
                    onPress={handleConnect}
                    disabled={isConnecting}
                >
                    {isConnecting ? (
                        <ActivityIndicator color="#0F172A" />
                    ) : (
                        <MaterialCommunityIcons
                            name="lan-connect"
                            size={20}
                            color="#0F172A"
                        />
                    )}

                    <Text style={styles.buttonText}>
                        {isConnecting ? "Connecting..." : "Connect to Cashier"}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#0B132B",
    },
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 24,
    },
    backButton: {
        marginRight: 16,
        padding: 4,
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        color: "#F8FAFC",
    },
    roleSubtext: {
        color: "#94A3B8",
        fontSize: 13,
    },
    statusSection: {
        marginBottom: 24,
    },
    sectionLabel: {
        color: "#64748B",
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 1,
        marginBottom: 8,
    },
    infoCard: {
        backgroundColor: "#16213E",
        borderRadius: 16,
        padding: 24,
        alignItems: "center",
        marginBottom: 24,
    },
    infoTitle: {
        color: "#F8FAFC",
        fontSize: 18,
        fontWeight: "700",
        marginTop: 12,
    },
    infoText: {
        color: "#94A3B8",
        textAlign: "center",
        lineHeight: 21,
        marginTop: 8,
        marginBottom: 20,
    },
    input: {
        width: "100%",
        backgroundColor: "#0B132B",
        borderWidth: 1,
        borderColor: "#334155",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 13,
        color: "#F8FAFC",
        fontSize: 16,
        textAlign: "center",
    },
    portText: {
        color: "#10B981",
        fontWeight: "700",
        marginTop: 16,
    },
    connectButton: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#10B981",
        paddingVertical: 15,
        borderRadius: 12,
    },
    disabledButton: {
        opacity: 0.6,
    },
    buttonText: {
        color: "#0F172A",
        fontWeight: "700",
        fontSize: 15,
        marginLeft: 8,
    },
});
