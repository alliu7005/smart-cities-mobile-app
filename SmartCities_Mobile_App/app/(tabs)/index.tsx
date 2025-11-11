import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";

const { height: H, width: W } = Dimensions.get("window");
const BOTTOM_SHEET_HEIGHT = Math.max(H * 0.48, 320);
const SHEET_SNAP_TOP = H - BOTTOM_SHEET_HEIGHT;
const SHEET_SNAP_BOTTOM = H - 88;

type MapPin = {
  id: string;
  title: string;
  subtitle?: string;
  coordinate: { latitude: number; longitude: number };
};

const PINS: MapPin[] = [
  {
    id: "1",
    title: "660 Indian Trail Lilburn Rd NW Suite 300, Lilburn, GA 30047",
    subtitle: "Open",
    coordinate: { latitude: 37.78825, longitude: -122.4324 },
  },
];

export default function HomeScreen() {
  const sheetY = useRef(new Animated.Value(SHEET_SNAP_BOTTOM)).current;
  const sheetPan = useRef({ y: SHEET_SNAP_BOTTOM }).current;
  const [activePin, setActivePin] = useState<MapPin | null>(null);

  // Map region (centered around pins)
  const initialRegion: Region = {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6,
      onPanResponderGrant: () => {
        sheetY.stopAnimation((v: number) => {
          sheetPan.y = v;
        });
      },
      onPanResponderMove: (_, gesture) => {
        const newY = sheetPan.y + gesture.dy;
        if (newY >= SHEET_SNAP_TOP && newY <= SHEET_SNAP_BOTTOM) {
          sheetY.setValue(newY);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        const vy = gesture.vy;
        const current = sheetPan.y + gesture.dy;
        if (vy < -0.35 || current < (SHEET_SNAP_TOP + SHEET_SNAP_BOTTOM) / 2) {
          Animated.spring(sheetY, {
            toValue: SHEET_SNAP_TOP,
            useNativeDriver: false,
            bounciness: 6,
          }).start(() => (sheetPan.y = SHEET_SNAP_TOP));
        } else {
          Animated.spring(sheetY, {
            toValue: SHEET_SNAP_BOTTOM,
            useNativeDriver: false,
            bounciness: 6,
          }).start(() => {
            sheetPan.y = SHEET_SNAP_BOTTOM;
            setActivePin(null);
          });
        }
      },
    })
  ).current;

  const openFor = (pin: MapPin) => {
    setActivePin(pin);
    Animated.spring(sheetY, {
      toValue: SHEET_SNAP_TOP,
      useNativeDriver: false,
      bounciness: 6,
    }).start(() => {
      sheetPan.y = SHEET_SNAP_TOP;
    });
  };

  const closeSheet = () => {
    Animated.spring(sheetY, {
      toValue: SHEET_SNAP_BOTTOM,
      useNativeDriver: false,
      bounciness: 6,
    }).start(() => {
      sheetPan.y = SHEET_SNAP_BOTTOM;
      setActivePin(null);
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerCaption}>Map & reports</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn}>
          <Image
            source={{
              uri: "https://api.adorable.io/avatars/80/placeholder.png",
            }}
            style={styles.profileImage}
          />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapWrap}>
        <MapView
          provider={PROVIDER_GOOGLE} // optional: remove if you prefer Apple Maps on iOS
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={false}
        >
          {PINS.map((p) => (
            <Marker
              key={p.id}
              coordinate={p.coordinate}
              onPress={() => openFor(p)}
              title={p.title}
              description={p.subtitle}
            >
              {/* Custom small marker: circle + pulse */}
              <View style={styles.marker}>
                <View style={styles.markerDot} />
                <View style={styles.markerPulse} />
              </View>
            </Marker>
          ))}
        </MapView>
      </View>

      {/* Bottom sheet (animated) */}
      <Animated.View style={[styles.sheet, { top: sheetY }]}>
        <View {...panResponder.panHandlers} style={styles.sheetHandleContainer}>
          <View style={styles.handle} />
        </View>

        <View style={styles.sheetContent}>
          {activePin ? (
            <>
              <View style={styles.sheetHeaderRow}>
                <Text style={styles.sheetTitle}>{activePin.title}</Text>
                <TouchableOpacity onPress={closeSheet} style={styles.closeBtn}>
                  {/* <Text style={styles.closeText}>Close</Text> */}
                </TouchableOpacity>
              </View>

              <Text style={styles.sheetSubtitle}>
                {activePin.subtitle ?? "No extra info"}
              </Text>

              <View style={styles.divider} />

              <View style={styles.list}>
                <View style={styles.listItem}>
                  <Text style={styles.listItemTitle}>Last reported</Text>
                  <Text style={styles.listItemValue}>4/14/2025, 5:31:34 PM</Text>
                </View>
                <View style={styles.listItem}>
                  <Text style={styles.listItemTitle}>Severity</Text>
                  <Text style={styles.listItemValue}>Urgent Issue</Text>
                </View>
                <View style={styles.listItem}>
                  <Text style={styles.listItemTitle}>Open complaints</Text>
                  <Text style={styles.badge}>3</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Report complaint</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.sheetTitle}>Tap a marker</Text>
              <Text style={styles.sheetSubtitle}>
                or drag up to see recent reports
              </Text>

              <View style={styles.divider} />

              <View style={styles.recentList}>
                <Text style={styles.recentHeader}>Recent reports</Text>

                <View style={styles.reportRow}>
                  <View style={styles.smallDot} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.reportTitle}>Late pickup</Text>
                    <Text style={styles.reportTime}>3h ago • Stall B</Text>
                  </View>
                </View>

                <View style={styles.reportRow}>
                  <View style={styles.smallDot} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.reportTitle}>Damaged box</Text>
                    <Text style={styles.reportTime}>1d ago • Stall A</Text>
                  </View>
                </View>

                <View style={styles.reportRow}>
                  <View style={styles.smallDot} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.reportTitle}>Missing items</Text>
                    <Text style={styles.reportTime}>2d ago • Stall C</Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F1F6" },
  header: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { color: "#4A7ECC", fontWeight: "700", fontSize: 20 },
  headerCaption: { color: "#a8b0c0", fontSize: 12 },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#4A7ECC",
    justifyContent: "center",
    alignItems: "center",
  },
  profileImage: { width: 40, height: 40 },

  mapWrap: { paddingHorizontal: 0, height: H },
  map: { flex: 1, borderRadius: 12, overflow: "hidden" },

  marker: {
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
  },
  markerDot: {
    width: 14,
    height: 14,
    borderRadius: 8,
    backgroundColor: "#ff4d6d",
    borderWidth: 2,
    borderColor: "#fff",
    zIndex: 2,
  },
  markerPulse: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,77,109,0.18)",
  },

  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    height: BOTTOM_SHEET_HEIGHT + 40,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: -6 },
    shadowRadius: 12,
    elevation: 12,
  },
  sheetHandleContainer: { alignItems: "center", paddingVertical: 8 },
  handle: { width: 54, height: 6, borderRadius: 6, backgroundColor: "#e0e6ef" },
  sheetContent: { paddingHorizontal: 18, paddingBottom: 24 },

  sheetHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: { fontSize: 18, fontWeight: "700", color: "#0b1320" },
  sheetSubtitle: { marginTop: 6, color: "#64748b" },
  closeBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  closeText: { color: "#2563eb", fontWeight: "600" },

  divider: { height: 1, backgroundColor: "#eef2f7", marginVertical: 12, borderRadius: 1 },
  list: { marginTop: 6 },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    alignItems: "center",
  },
  listItemTitle: { color: "#475569" },
  listItemValue: { color: "#0b1320", fontWeight: "700" },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: "#ffd9e0",
    borderRadius: 12,
    color: "#ff2e63",
    fontWeight: "700",
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  recentList: { marginTop: 6 },
  recentHeader: { fontWeight: "600", color: "#0b1320", marginBottom: 8 },
  reportRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  smallDot: { width: 10, height: 10, borderRadius: 6, backgroundColor: "#ff4d6d" },
  reportTitle: { fontWeight: "600", color: "#0b1320" },
  reportTime: { color: "#64748b", fontSize: 12 },
});
