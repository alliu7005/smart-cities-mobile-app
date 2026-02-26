import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region, MapPressEvent } from 'react-native-maps';

type MapPin = {
  id: string;
  title: string;
  subtitle?: string;
  coordinate: { latitude: number; longitude: number };
};

interface MapComponentProps {
  pins: MapPin[];
  initialRegion: Region;
  onPinPress: (pin: MapPin) => void;
  onLongPress: (e: MapPressEvent) => void;
  modalVisible: boolean;
  newPinCoords: { latitude: number; longitude: number } | null;
  PulsingMarker: React.ComponentType;
}

export default function MapComponent({
  pins,
  initialRegion,
  onPinPress,
  onLongPress,
  modalVisible,
  newPinCoords,
  PulsingMarker,
}: MapComponentProps) {
  return (
    <View style={styles.mapWrap}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={false}
        onLongPress={onLongPress}
      >
        {pins.map((p) => (
          <Marker
            key={p.id}
            coordinate={p.coordinate}
            onPress={() => onPinPress(p)}
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
  );
}

const styles = StyleSheet.create({
  mapWrap: { flex: 1 },
  map: { flex: 1, borderRadius: 12, overflow: "hidden" },
});
