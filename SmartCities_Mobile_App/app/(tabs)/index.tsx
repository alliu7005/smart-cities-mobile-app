import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import MapView, { MapPressEvent, Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";

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

const INITIAL_PINS: MapPin[] = [
  {
    id: "1",
    title: "660 Indian Trail Lilburn Rd NW Suite 300, Lilburn, GA 30047",
    subtitle: "Open",
    coordinate: { latitude: 33.7501, longitude: -84.3885 },
  },
];

// --- New Component: Pulsing Marker ---
const PulsingMarker = () => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    ).start();
  }, [anim]);

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2], // Scales to 2.8x
  });

  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0], // Fades out
  });

  return (
    <View style={styles.marker}>
      {/* Animated pulse layer */}
      <Animated.View
        style={[
          styles.markerPulse,
          {
            transform: [{ scale }],
            opacity,
          },
        ]}
      />
      {/* Static center dot */}
      <View style={styles.markerDot} />
    </View>
  );
};

export default function HomeScreen() {
  // --- Animation & Sheet State ---
  const sheetY = useRef(new Animated.Value(SHEET_SNAP_BOTTOM)).current;
  const sheetPan = useRef({ y: SHEET_SNAP_BOTTOM }).current;
  
  // --- Data State ---
  const [pins, setPins] = useState<MapPin[]>(INITIAL_PINS);
  const [activePin, setActivePin] = useState<MapPin | null>(null);

  // --- Modal / Add Pin State ---
  const [modalVisible, setModalVisible] = useState(false);
  const [newPinCoords, setNewPinCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");

  const initialRegion: Region = {
    latitude: 33.7501,
    longitude: -84.3885,
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

  const handleLongPress = (e: MapPressEvent) => {
    const coords = e.nativeEvent.coordinate;
    setNewPinCoords(coords);
    setModalVisible(true);
  };

  const saveNewPin = () => {
    if (!newTitle.trim() || !newPinCoords) return;

    const newPin: MapPin = {
      id: Date.now().toString(),
      title: newTitle,
      subtitle: newSubtitle || "User added location",
      coordinate: newPinCoords,
    };

    setPins([...pins, newPin]);
    closeModal();
  };

  const closeModal = () => {
    setModalVisible(false);
    setNewTitle("");
    setNewSubtitle("");
    setNewPinCoords(null);
  };

  const date = new Date()

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
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={false}
          onLongPress={handleLongPress}
        >
          {pins.map((p) => (
            <Marker
              key={p.id}
              coordinate={p.coordinate}
              onPress={() => openFor(p)}
              title={p.title}
              description={p.subtitle}
            >
              <PulsingMarker />
            </Marker>
          ))}
          
          {modalVisible && newPinCoords && (
             <Marker coordinate={newPinCoords} opacity={0.6}>
               <PulsingMarker />
             </Marker>
          )}
        </MapView>
      </View>

      {/* Instructions Overlay */}
      {!activePin && !modalVisible && (
        <View style={styles.instructionOverlay}>
          <Text style={styles.instructionText}>Long press map to add pin</Text>
        </View>
      )}

      {/* Bottom sheet */}
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
                </TouchableOpacity>
              </View>

              <Text style={styles.sheetSubtitle}>
                {activePin.subtitle ?? "No extra info"}
              </Text>

              <View style={styles.divider} />

              <View style={styles.list}>
                <View style={styles.listItem}>
                  <Text style={styles.listItemTitle}>Last reported</Text>
                  <Text style={styles.listItemValue}>{date.toString()}</Text>
                </View>
                <View style={styles.listItem}>
                  <Text style={styles.listItemTitle}>Severity</Text>
                  <Text style={styles.listItemValue}>Urgent Issue</Text>
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
              </View>
            </>
          )}
        </View>
      </Animated.View>

      {/* Add Pin Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalHeader}>Add New Complaint</Text>
              
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g. Broken streetlight" 
                value={newTitle}
                onChangeText={setNewTitle}
                autoFocus
              />

              <Text style={styles.inputLabel}>Subtitle</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g. There is a broken streetlight" 
                value={newSubtitle}
                onChangeText={setNewSubtitle}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={closeModal} style={[styles.modalBtn, styles.cancelBtn]}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={saveNewPin} style={[styles.modalBtn, styles.saveBtn]}>
                  <Text style={styles.saveBtnText}>Save Pin</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

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

  // --- START OF PULSING FIX STYLES ---
  marker: {
    // Increased size to prevent clipping the circle animation
    width: 40, 
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderColor: 'black',
    borderWidth: 0,
  },
  markerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#ff4d6d",
    borderWidth: 2,
    borderColor: "#fff",
    zIndex: 2, // Keeps dot on top
  },
  markerPulse: {
    position: "absolute",
    width: 36, // Initial size before scale
    height: 36,
    borderRadius: 18, // Perfect circle
    backgroundColor: "#ff4d6d",
    zIndex: 1,
  },
  // --- END OF PULSING FIX STYLES ---

  instructionOverlay: {
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  instructionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600'
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

  // --- Modal Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0b1320',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F0F1F6',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 16,
    color: '#0b1320',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 24,
    justifyContent: 'space-between',
    gap: 12
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F0F1F6',
  },
  cancelBtnText: {
    color: '#64748b',
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: '#2563eb',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
  }
});
