import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Clipboard,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import ConnectionStatus from "../components/ConnectionStatus";
import { ConnectionService } from "../services/connection.service";
import { DeviceService } from "../services/device.service";
import { MessageService } from "../services/message.service";

export default function CashierScreen() {
    const router = useRouter();

    const [isHosting, setIsHosting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [serverIP, setServerIP] = useState(null);
    const [copied, setCopied] = useState(false);

    const connectedPeerRef = useRef(null);

    // Animation values for smooth transitions
    const cardAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        let unsubscribeConnection;
        let unsubscribeMessages;
        let mounted = true;

        async function setup() {
            try {
                await DeviceService.initialize({
                    name: "Cashier Terminal",
                    role: "cashier",
                });

                await MessageService.initialize();

                unsubscribeConnection = ConnectionService.subscribe(
                    (event, data) => {
                        if (event === "connected") {
                            connectedPeerRef.current = data.peerId;
                            setIsConnected(true);
                        }

                        if (event === "disconnected") {
                            if (connectedPeerRef.current === data.peerId) {
                                connectedPeerRef.current = null;
                                setIsConnected(false);
                            }
                        }
                    }
                );

                unsubscribeMessages = MessageService.subscribe(
                    (event, data) => {
                        if (
                            event === "deviceIdentified" &&
                            data.device.role === "waiter"
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
            ConnectionService.stop().catch(console.error);
        };
    }, []);

    // Animate connection card in / out smoothly
    useEffect(() => {
        if (isHosting) {
            Animated.spring(cardAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(cardAnim, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }).start();
        }
    }, [isHosting]);

    // Subtle pulsing radar effect while waiting for waiter
    useEffect(() => {
        let pulseLoop;
        if (isHosting && !isConnected) {
            pulseLoop = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.12,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            );
            pulseLoop.start();
        } else {
            pulseAnim.setValue(1);
        }

        return () => pulseLoop?.stop();
    }, [isHosting, isConnected]);

    const handleToggleServer = async () => {
        try {
            if (isHosting) {
                await ConnectionService.stop();
                setIsHosting(false);
                setIsConnected(false);
                setServerIP(null);
            } else {
                const serverInfo = await ConnectionService.start();

                // If service returns an IP use it; otherwise fallback to standard Android Hotspot gateway
                const detectedIP = serverInfo?.ipAddress || "192.168.43.1";

                setServerIP(detectedIP);
                setIsHosting(true);
            }
        } catch (error) {
            setIsHosting(false);
            setServerIP(null);
            Alert.alert("Server Error", error.message);
        }
    };

    const handleCopyIP = () => {
        if (!serverIP) return;
        if (Clipboard && Clipboard.setString) {
            Clipboard.setString(serverIP);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#070D1E" />

            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons
                            name="arrow-left"
                            size={22}
                            color="#F8FAFC"
                        />
                    </TouchableOpacity>

                    <View style={styles.headerTextContainer}>
                        <Text style={styles.title}>Cashier Terminal</Text>
                        <Text style={styles.roleSubtext}>
                            Multi-terminal local gateway
                        </Text>
                    </View>

                    {/* Compact Online / Offline Badge in Header */}
                    <View
                        style={[
                            styles.badge,
                            isHosting ? styles.badgeOnline : styles.badgeOffline,
                        ]}
                    >
                        <View
                            style={[
                                styles.badgeDot,
                                {
                                    backgroundColor: isHosting
                                        ? "#10B981"
                                        : "#64748B",
                                },
                            ]}
                        />
                        <Text
                            style={[
                                styles.badgeText,
                                { color: isHosting ? "#10B981" : "#94A3B8" },
                            ]}
                        >
                            {isHosting ? "Online" : "Offline"}
                        </Text>
                    </View>
                </View>

                {/* Overall Connection Status Section */}
                <View style={styles.statusSection}>
                    <Text style={styles.sectionLabel}>SERVER STATUS</Text>
                    <ConnectionStatus
                        status={
                            isConnected
                                ? "connected"
                                : isHosting
                                    ? "searching"
                                    : "disconnected"
                        }
                        label={
                            isConnected
                                ? "Waiter terminal connected"
                                : isHosting
                                    ? "Server listening • Waiting for waiter..."
                                    : "Server offline • Not accepting connections"
                        }
                    />
                </View>

                {/* Connection Card (Reveals with smooth slide/fade animation) */}
                {isHosting && (
                    <Animated.View
                        style={[
                            styles.connectionCard,
                            {
                                opacity: cardAnim,
                                transform: [
                                    {
                                        translateY: cardAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [-16, 0],
                                        }),
                                    },
                                    {
                                        scale: cardAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.97, 1],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    >
                        {/* Card Header */}
                        <View style={styles.cardTopRow}>
                            <View style={styles.cardHeaderLeft}>
                                <View style={styles.serverIconBg}>
                                    <MaterialCommunityIcons
                                        name="server-network"
                                        size={20}
                                        color="#10B981"
                                    />
                                </View>
                                <View>
                                    <Text style={styles.cardHeaderTitle}>
                                        Active Host Gateway
                                    </Text>
                                    <Text style={styles.cardHeaderSubtitle}>
                                        Broadcasted over local hotspot
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.liveIndicator}>
                                <View style={styles.liveDot} />
                                <Text style={styles.liveText}>HOSTING</Text>
                            </View>
                        </View>

                        {/* Prominent IP & Port Display Area */}
                        <View style={styles.ipContainer}>
                            <Text style={styles.ipLabel}>
                                CASHIER IP ADDRESS
                            </Text>

                            <View style={styles.ipValueRow}>
                                <Text
                                    style={styles.ipValueText}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                >
                                    {serverIP || "Acquiring IP..."}
                                </Text>

                                {serverIP && (
                                    <TouchableOpacity
                                        style={[
                                            styles.copyIconButton,
                                            copied && styles.copyIconButtonSuccess,
                                        ]}
                                        onPress={handleCopyIP}
                                        activeOpacity={0.7}
                                    >
                                        <MaterialCommunityIcons
                                            name={
                                                copied
                                                    ? "check"
                                                    : "content-copy"
                                            }
                                            size={18}
                                            color={
                                                copied ? "#10B981" : "#F8FAFC"
                                            }
                                        />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Port & Protocol Details */}
                            <View style={styles.specsRow}>
                                <View style={styles.specItem}>
                                    <MaterialCommunityIcons
                                        name="lan"
                                        size={14}
                                        color="#10B981"
                                    />
                                    <Text style={styles.specLabel}>
                                        PORT:{" "}
                                        <Text style={styles.specValue}>
                                            8765
                                        </Text>
                                    </Text>
                                </View>

                                <View style={styles.specDivider} />

                                <View style={styles.specItem}>
                                    <MaterialCommunityIcons
                                        name="shield-check-outline"
                                        size={14}
                                        color="#10B981"
                                    />
                                    <Text style={styles.specLabel}>
                                        PROTOCOL:{" "}
                                        <Text style={styles.specValue}>
                                            TCP
                                        </Text>
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Waiting status section */}
                        <View style={styles.waitingContainer}>
                            <Animated.View
                                style={[
                                    styles.pulsingRadar,
                                    { transform: [{ scale: pulseAnim }] },
                                ]}
                            >
                                <ActivityIndicator
                                    size="small"
                                    color="#10B981"
                                />
                            </Animated.View>
                            <View style={styles.waitingTextContainer}>
                                <Text style={styles.waitingTitle}>
                                    Waiting for waiter to connect...
                                </Text>
                                <Text style={styles.waitingHelpText}>
                                    Open the Waiter app and connect to this IP
                                </Text>
                            </View>
                        </View>
                    </Animated.View>
                )}

                {/* Information Card (When server is offline) */}
                {!isHosting && (
                    <View style={styles.infoCard}>
                        <View style={styles.wifiIconContainer}>
                            <MaterialCommunityIcons
                                name="wifi"
                                size={28}
                                color="#10B981"
                            />
                        </View>

                        <Text style={styles.infoTitle}>Local Wi-Fi Server</Text>
                        <Text style={styles.infoText}>
                            Ensure this device has Wi-Fi or Personal Hotspot
                            enabled. When started, this terminal hosts the
                            central TCP bridge for all floor staff.
                        </Text>

                        <View style={styles.portPill}>
                            <MaterialCommunityIcons
                                name="lan-connect"
                                size={15}
                                color="#10B981"
                            />
                            <Text style={styles.portPillText}>
                                TCP PORT 8765
                            </Text>
                        </View>
                    </View>
                )}

                {/* Primary Server Action Button */}
                <TouchableOpacity
                    activeOpacity={0.85}
                    style={[
                        styles.actionButton,
                        isHosting
                            ? styles.stopActionButton
                            : styles.startActionButton,
                    ]}
                    onPress={handleToggleServer}
                >
                    <MaterialCommunityIcons
                        name={isHosting ? "power" : "play-circle-outline"}
                        size={22}
                        color={isHosting ? "#FEF2F2" : "#022C22"}
                    />
                    <Text
                        style={[
                            styles.actionButtonText,
                            isHosting
                                ? styles.stopActionButtonText
                                : styles.startActionButtonText,
                        ]}
                    >
                        {isHosting ? "Stop Cashier Server" : "Start Cashier Server"}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#070D1E",
    },
    scrollContainer: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 32,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 24,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "#131C31",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#1E293B",
        marginRight: 12,
    },
    headerTextContainer: {
        flex: 1,
    },
    title: {
        fontSize: 21,
        fontWeight: "700",
        color: "#F8FAFC",
        letterSpacing: 0.3,
    },
    roleSubtext: {
        color: "#94A3B8",
        fontSize: 12,
        marginTop: 2,
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
    },
    badgeOnline: {
        backgroundColor: "rgba(16, 185, 129, 0.12)",
        borderColor: "rgba(16, 185, 129, 0.3)",
    },
    badgeOffline: {
        backgroundColor: "rgba(100, 116, 139, 0.12)",
        borderColor: "rgba(100, 116, 139, 0.25)",
    },
    badgeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    statusSection: {
        marginBottom: 20,
    },
    sectionLabel: {
        color: "#64748B",
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 1.2,
        marginBottom: 8,
    },

    /* Prominent Connection Card */
    connectionCard: {
        backgroundColor: "#0F1A30",
        borderRadius: 20,
        padding: 20,
        marginBottom: 22,
        borderWidth: 1,
        borderColor: "rgba(16, 185, 129, 0.35)",
        elevation: 6,
        shadowColor: "#10B981",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
    cardTopRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    cardHeaderLeft: {
        flexDirection: "row",
        alignItems: "center",
    },
    serverIconBg: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: "rgba(16, 185, 129, 0.15)",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
        borderWidth: 1,
        borderColor: "rgba(16, 185, 129, 0.3)",
    },
    cardHeaderTitle: {
        color: "#F8FAFC",
        fontSize: 15,
        fontWeight: "700",
    },
    cardHeaderSubtitle: {
        color: "#64748B",
        fontSize: 11,
        marginTop: 1,
    },
    liveIndicator: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#10B981",
        marginRight: 5,
    },
    liveText: {
        color: "#10B981",
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 0.8,
    },
    ipContainer: {
        backgroundColor: "#091224",
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: "#1E2B45",
    },
    ipLabel: {
        color: "#10B981",
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 1.2,
        marginBottom: 6,
    },
    ipValueRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    ipValueText: {
        color: "#FFFFFF",
        fontSize: 26,
        fontWeight: "800",
        fontFamily: Platform.OS === "android" ? "monospace" : "Menlo",
        letterSpacing: 1,
        flex: 1,
        marginRight: 8,
    },
    copyIconButton: {
        width: 42,
        height: 42,
        borderRadius: 10,
        backgroundColor: "#16233B",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#2B3C5E",
    },
    copyIconButtonSuccess: {
        backgroundColor: "rgba(16, 185, 129, 0.15)",
        borderColor: "#10B981",
    },
    specsRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "rgba(255, 255, 255, 0.05)",
    },
    specItem: {
        flexDirection: "row",
        alignItems: "center",
    },
    specLabel: {
        color: "#94A3B8",
        fontSize: 11,
        fontWeight: "600",
        marginLeft: 6,
    },
    specValue: {
        color: "#F8FAFC",
        fontWeight: "700",
    },
    specDivider: {
        width: 1,
        height: 12,
        backgroundColor: "#2B3C5E",
        marginHorizontal: 16,
    },
    waitingContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 16,
        backgroundColor: "rgba(16, 185, 129, 0.06)",
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(16, 185, 129, 0.15)",
    },
    pulsingRadar: {
        marginRight: 12,
        marginLeft: 4,
    },
    waitingTextContainer: {
        flex: 1,
    },
    waitingTitle: {
        color: "#E2E8F0",
        fontSize: 13,
        fontWeight: "600",
    },
    waitingHelpText: {
        color: "#64748B",
        fontSize: 11,
        marginTop: 1,
    },

    /* Offline Info Card */
    infoCard: {
        backgroundColor: "#0F1A30",
        borderRadius: 18,
        padding: 24,
        alignItems: "center",
        marginBottom: 22,
        borderWidth: 1,
        borderColor: "#1B2A47",
    },
    wifiIconContainer: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(16, 185, 129, 0.2)",
        marginBottom: 12,
    },
    infoTitle: {
        color: "#F8FAFC",
        fontSize: 17,
        fontWeight: "700",
    },
    infoText: {
        color: "#94A3B8",
        textAlign: "center",
        lineHeight: 20,
        fontSize: 13,
        marginTop: 8,
        paddingHorizontal: 8,
    },
    portPill: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#091224",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 16,
        borderWidth: 1,
        borderColor: "#1E2B45",
    },
    portPillText: {
        color: "#10B981",
        fontSize: 11,
        fontWeight: "700",
        marginLeft: 6,
        letterSpacing: 0.5,
    },

    /* Start / Stop Button */
    actionButton: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 16,
        borderRadius: 14,
        elevation: 3,
    },
    startActionButton: {
        backgroundColor: "#10B981",
    },
    stopActionButton: {
        backgroundColor: "#DC2626",
    },
    actionButtonText: {
        fontSize: 15,
        fontWeight: "700",
        marginLeft: 8,
    },
    startActionButtonText: {
        color: "#022C22",
    },
    stopActionButtonText: {
        color: "#FEF2F2",
    },
});