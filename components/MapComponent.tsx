'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface PatrolRecord {
  id: string;
  guardName: string;
  locationName: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  distanceFromCheckpoint: number;
}

interface MapComponentProps {
  patrols: PatrolRecord[];
  locations: Location[];
}

// Fix for default marker icons in React-Leaflet
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const checkpointIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAzMCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTUgMEMxMC44NTc4NiAwIDcuNSAzLjM1Nzg2IDcuNSA3LjVDNy41IDEzLjEyNSAxNSAyNCAxNSAyNEMxNSAyNCAyMi41IDEzLjEyNSAyMi41IDcuNUMyMi41IDMuMzU3ODYgMTkuMTQyMTQgMCAxNSAwWiIgZmlsbD0iIzI3YWU2MCIvPjxjaXJjbGUgY3g9IjE1IiBjeT0iNy41IiByPSIzIiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==',
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -40],
});

L.Marker.prototype.options.icon = defaultIcon;

export default function MapComponent({ patrols, locations }: MapComponentProps) {
  useEffect(() => {
    // Ensure Leaflet is only initialized on client side
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  // Calculate center of map based on all markers
  const allLats = [...patrols.map(p => p.latitude), ...locations.map(l => l.latitude)];
  const allLngs = [...patrols.map(p => p.longitude), ...locations.map(l => l.longitude)];

  const centerLat = allLats.length > 0 ? allLats.reduce((a, b) => a + b, 0) / allLats.length : 40.7128;
  const centerLng = allLngs.length > 0 ? allLngs.reduce((a, b) => a + b, 0) / allLngs.length : -74.0060;

  return (
    <div className="map-container">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Render checkpoint locations with circles */}
        {locations.map(location => (
          <div key={`location-${location.id}`}>
            <Marker
              position={[location.latitude, location.longitude]}
              icon={checkpointIcon}
            >
              <Popup>
                <strong>{location.name}</strong><br />
                Checkpoint Location<br />
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </Popup>
            </Marker>
            <Circle
              center={[location.latitude, location.longitude]}
              radius={50}
              pathOptions={{ color: '#27ae60', fillColor: '#27ae60', fillOpacity: 0.1 }}
            />
          </div>
        ))}

        {/* Render patrol records */}
        {patrols.map(patrol => (
          <Marker
            key={patrol.id}
            position={[patrol.latitude, patrol.longitude]}
            icon={defaultIcon}
          >
            <Popup>
              <strong>{patrol.locationName}</strong><br />
              Guard: {patrol.guardName}<br />
              Time: {new Date(patrol.timestamp).toLocaleString()}<br />
              Distance: {Math.round(patrol.distanceFromCheckpoint)}m from checkpoint
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
