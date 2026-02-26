import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Create a custom icon that looks like the mobile pulsing marker
const customIcon = L.divIcon({
  className: 'custom-leaflet-marker',
  html: `
    <div style="
      width: 40px; 
      height: 40px; 
      display: flex; 
      align-items: center; 
      justify-content: center;
      position: relative;
    ">
      <div style="
        position: absolute;
        width: 36px;
        height: 36px;
        border-radius: 18px;
        background-color: #ff4d6d;
        opacity: 0.3;
        animation: pulse 2s infinite;
      "></div>
      <div style="
        width: 14px;
        height: 14px;
        border-radius: 7px;
        background-color: #ff4d6d;
        border: 2px solid #fff;
        z-index: 2;
      "></div>
    </div>
    <style>
      @keyframes pulse {
        0% { transform: scale(1); opacity: 0.6; }
        100% { transform: scale(1.2); opacity: 0; }
      }
    </style>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20], // Center the icon on the coordinate
});

type MapPin = {
  id: string;
  title: string;
  subtitle?: string;
  coordinate: { latitude: number; longitude: number };
};

interface MapComponentProps {
  pins: MapPin[];
  initialRegion: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };
  onPinPress: (pin: MapPin) => void;
  onLongPress: (e: any) => void;
  modalVisible: boolean;
  newPinCoords: { latitude: number; longitude: number } | null;
  PulsingMarker: React.ComponentType;
}

// Component to handle map events
function MapEvents({ onLongPress }: { onLongPress: (e: any) => void }) {
  useMapEvents({
    contextmenu: (e) => {
      // Map Leaflet event to look like React Native Maps event
      onLongPress({
        nativeEvent: {
          coordinate: {
            latitude: e.latlng.lat,
            longitude: e.latlng.lng,
          }
        }
      });
    },
  });
  return null;
}

export default function MapComponent({
  pins,
  initialRegion,
  onPinPress,
  onLongPress,
  modalVisible,
  newPinCoords,
}: MapComponentProps) {
  return (
    <View style={styles.mapWrap}>
      <MapContainer 
        center={[initialRegion.latitude, initialRegion.longitude]} 
        zoom={13} 
        style={{ height: '100%', width: '100%', borderRadius: 12 }}
      >
        {/* Minimalistic CartoDB Positron map tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <MapEvents onLongPress={onLongPress} />
        
        {pins.map((p) => (
          <Marker 
            key={p.id} 
            position={[p.coordinate.latitude, p.coordinate.longitude]}
            icon={customIcon}
            eventHandlers={{
              click: () => onPinPress(p),
            }}
          >
            <Popup>
              <strong>{p.title}</strong><br/>
              {p.subtitle}
            </Popup>
          </Marker>
        ))}

        {modalVisible && newPinCoords && (
          <Marker 
            position={[newPinCoords.latitude, newPinCoords.longitude]}
            icon={customIcon}
            opacity={0.6}
          />
        )}
      </MapContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  mapWrap: { flex: 1, borderRadius: 12, overflow: "hidden" },
});
