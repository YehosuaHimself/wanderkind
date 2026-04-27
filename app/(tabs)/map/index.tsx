import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions, Switch, ScrollView, FlatList, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, shadows, hostTypeConfig, getFreshnessBadge, getResponseTimeBadge, dataSourceConfig } from '../../../src/lib/theme';
import { toast } from '../../../src/lib/toast';
import { haptic } from '../../../src/lib/haptics';
import { supabase } from '../../../src/lib/supabase';
import { Host } from '../../../src/types/database';
import { SEED_PROFILES } from '../../../src/data/seed-profiles';

type SeedProfile = (typeof SEED_PROFILES)[number];
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';
import { useFavoritesStore } from '../../../src/stores/favorites';
import { useAuthStore } from '../../../src/stores/auth';
import { getRouteRelativeDistance } from '../../../src/lib/route-distance';
import { RouteErrorBoundary } from '../../../src/components/RouteErrorBoundary';

const { width, height } = Dimensions.get('window');

// Default to wide Europe overview — user zooms in via locate button
const INITIAL_REGION = {
  latitude: 47.0,
  longitude: 4.0,
  latitudeDelta: 22,
  longitudeDelta: 22,
};

type HostFilter = 'free' | 'donativo' | 'budget';

interface LayerState {
  hosts: boolean;
  wanderkinder: boolean;
  ways: boolean;
  wifi: boolean;
  churches: boolean;
  parishes: boolean;
  mountains: boolean;
  camping: boolean;
  community: boolean;
}

// Community contribution types
type CommunityPinType = 'campsite' | 'private_host' | 'parking' | 'accommodation' | 'water' | 'other';

interface CommunityPin {
  id: string;
  type: CommunityPinType;
  name: string;
  lat: number;
  lng: number;
  note?: string;
  addedBy?: string;
}

const COMMUNITY_PIN_CONFIG: Record<CommunityPinType, { label: string; icon: string; color: string; description: string }> = {
  campsite: { label: 'Free Camp Spot', icon: 'bonfire', color: '#059669', description: 'Community recommended wild/free camping' },
  private_host: { label: 'Private Host', icon: 'person', color: '#C8762A', description: 'Non-digital host who would welcome walkers' },
  parking: { label: 'Van Parking', icon: 'car', color: '#6366F1', description: 'Overnight parking for vans (park4night style)' },
  accommodation: { label: 'Accommodation', icon: 'bed', color: '#0ea5e9', description: 'Budget accommodation tip' },
  water: { label: 'Water Source', icon: 'water', color: '#2563EB', description: 'Drinkable water fountain or tap' },
  other: { label: 'Other', icon: 'flag', color: '#6B7280', description: 'Anything useful for walkers' },
};

// Seed community pins — defined at module level so WebMapComponent can access them
const SEED_COMMUNITY_PINS: CommunityPin[] = [
  { id: 'cm-01', type: 'campsite', name: 'Free camp near river Arga', lat: 42.7950, lng: -1.6100, note: 'Flat ground, sheltered by trees. 200m from the Camino.' },
  { id: 'cm-02', type: 'private_host', name: 'Señora Maria (ask at bar)', lat: 42.5200, lng: -2.8500, note: 'Elderly lady who hosts walkers. Ask at Bar El Camino.' },
  { id: 'cm-03', type: 'parking', name: 'Van parking behind church', lat: 42.3500, lng: -3.7100, note: 'Quiet, no signs prohibiting. 3-4 vans fit.' },
  { id: 'cm-04', type: 'water', name: 'Spring water fountain', lat: 42.4600, lng: -6.0600, note: 'Clean spring, locals drink from it.' },
  { id: 'cm-05', type: 'campsite', name: 'Wild camp Alto del Perdon', lat: 42.7750, lng: -1.7350, note: 'Amazing sunset spot. Wind can be strong.' },
  { id: 'cm-06', type: 'accommodation', name: 'Cheap room above bakery', lat: 43.8500, lng: 10.5100, note: '10 EUR/night, basic but clean. Via Francigena.' },
  { id: 'cm-07', type: 'parking', name: 'Free van spot lakeside', lat: 47.1300, lng: 8.7600, note: 'Near Einsiedeln. Quiet at night.' },
  { id: 'cm-08', type: 'private_host', name: 'Farmer Hans (organic farm)', lat: 47.4800, lng: 11.0800, note: 'Hosts walkers in barn. Fresh milk. Königsweg.' },
  { id: 'cm-09', type: 'water', name: 'Mountain spring Arlberg', lat: 47.1300, lng: 10.2200, note: 'Crystal clear alpine water.' },
  { id: 'cm-10', type: 'campsite', name: 'Forest clearing near Vézelay', lat: 47.4700, lng: 3.7500, note: 'Quiet, pine forest floor. Via Lemovicensis.' },
];

type MapMode = 'normal' | 'greyscale' | 'explorer';

// Dynamically import native-only modules (these crash on web)
let MapView: any, Marker: any, PROVIDER_GOOGLE: any, Location: any;
if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
  Location = require('expo-location');
}

// Haversine distance (km)
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const HOST_CARD_WIDTH = width - 48;

// Sample POI data — churches, parishes, wifi hotspots, mountains along major routes
const POI_DATA = {
  parishes: [
    // Catholic parishes (Pfarreien) along major walking routes — offering pilgrim blessing, community meals, or rest
    { id: 'pf-01', name: 'Pfarrei St. Jakob, Zürich', lat: 47.3711, lng: 8.5389 },
    { id: 'pf-02', name: 'Pfarrei Maria Himmelfahrt, Berchtesgaden', lat: 47.6316, lng: 13.0011 },
    { id: 'pf-03', name: 'Pfarrei St. Nikolaus, Innsbruck', lat: 47.2620, lng: 11.3960 },
    { id: 'pf-04', name: 'Pfarrei Unsere Liebe Frau, Salzburg', lat: 47.7990, lng: 13.0440 },
    { id: 'pf-05', name: 'Pfarrei St. Martin, Freiburg', lat: 47.9959, lng: 7.8529 },
    { id: 'pf-06', name: 'Pfarrei St. Peter, München', lat: 48.1363, lng: 11.5761 },
    { id: 'pf-07', name: 'Pfarrei Maria Geburt, Aschaffenburg', lat: 49.9769, lng: 9.1510 },
    { id: 'pf-08', name: 'Parroquia de Santiago, Pamplona', lat: 42.8188, lng: -1.6432 },
    { id: 'pf-09', name: 'Parroquia San Nicolás, Burgos', lat: 42.3430, lng: -3.6960 },
    { id: 'pf-10', name: 'Parrocchia San Pietro, Lucca', lat: 43.8440, lng: 10.5050 },
    { id: 'pf-11', name: 'Parrocchia Santa Maria, Siena', lat: 43.3190, lng: 11.3310 },
    { id: 'pf-12', name: 'Paroisse Saint-Jacques, Le Puy-en-Velay', lat: 45.0430, lng: 3.8850 },
    { id: 'pf-13', name: 'Paroisse Notre-Dame, Vézelay', lat: 47.4650, lng: 3.7470 },
    { id: 'pf-14', name: 'Pfarrei St. Jakobus, Köln', lat: 50.9370, lng: 6.9600 },
    { id: 'pf-15', name: 'Pfarrei Heilig Kreuz, Einsiedeln', lat: 47.1270, lng: 8.7520 },
    { id: 'pf-16', name: 'Pfarrei St. Johannes, Konstanz', lat: 47.6588, lng: 9.1753 },
    { id: 'pf-17', name: 'Parroquia San Martín, León', lat: 42.5990, lng: -5.5690 },
    { id: 'pf-18', name: 'Parroquia Santa María, Astorga', lat: 42.4570, lng: -6.0540 },
    { id: 'pf-19', name: 'Pfarrei St. Stephanus, Wien', lat: 48.2082, lng: 16.3738 },
    { id: 'pf-20', name: 'Parrocchia San Francesco, Assisi', lat: 43.0707, lng: 12.6166 },
    { id: 'pf-21', name: 'Pfarrei Maria Himmelfahrt, Garmisch', lat: 47.4917, lng: 11.0958 },
    { id: 'pf-22', name: 'Parroquia Santiago, Compostela', lat: 42.8810, lng: -8.5450 },
    { id: 'pf-23', name: 'Pfarrei St. Peter und Paul, Bern', lat: 46.9480, lng: 7.4474 },
    { id: 'pf-24', name: 'Paroisse Saint-Jean, Genève', lat: 46.2044, lng: 6.1432 },
    { id: 'pf-25', name: 'Pfarrei Heiliger Geist, Heidelberg', lat: 49.4094, lng: 8.7100 },
  ],
  churches: [
    { id: 'ch-01', name: 'Cathedral of Santiago', lat: 42.8805, lng: -8.5449 },
    { id: 'ch-02', name: 'Burgos Cathedral', lat: 42.3408, lng: -3.7044 },
    { id: 'ch-03', name: 'Leon Cathedral', lat: 42.5994, lng: -5.567 },
    { id: 'ch-04', name: 'Astorga Cathedral', lat: 42.4559, lng: -6.0521 },
    { id: 'ch-05', name: "St. Peter's Basilica", lat: 41.9022, lng: 12.4539 },
    { id: 'ch-06', name: 'Siena Cathedral', lat: 43.3175, lng: 11.3292 },
    { id: 'ch-07', name: 'Canterbury Cathedral', lat: 51.2798, lng: 1.083 },
    { id: 'ch-08', name: 'Notre-Dame du Puy', lat: 45.0444, lng: 3.885 },
    { id: 'ch-09', name: 'Vezelay Basilica', lat: 47.4661, lng: 3.7487 },
    { id: 'ch-10', name: 'Roncesvaux Collegiate', lat: 43.0092, lng: -1.3191 },
    { id: 'ch-11', name: 'Salzburg Cathedral', lat: 47.7954, lng: 13.0462 },
    { id: 'ch-12', name: 'Berchtesgaden Stiftskirche', lat: 47.6322, lng: 13.0028 },
    { id: 'ch-13', name: 'Cologne Cathedral', lat: 50.9413, lng: 6.958 },
    { id: 'ch-14', name: 'Einsiedeln Abbey', lat: 47.1265, lng: 8.7543 },
    { id: 'ch-15', name: 'San Isidoro Leon', lat: 42.5988, lng: -5.5718 },
  ],
  wifi: [
    { id: 'wf-01', name: 'Pamplona Library WiFi', lat: 42.8169, lng: -1.6436 },
    { id: 'wf-02', name: 'Burgos Municipal WiFi', lat: 42.344, lng: -3.697 },
    { id: 'wf-03', name: 'Leon Plaza WiFi', lat: 42.599, lng: -5.57 },
    { id: 'wf-04', name: 'Santiago City WiFi', lat: 42.878, lng: -8.544 },
    { id: 'wf-05', name: 'Porto Center WiFi', lat: 41.15, lng: -8.61 },
    { id: 'wf-06', name: 'Lucca City WiFi', lat: 43.843, lng: 10.505 },
    { id: 'wf-07', name: 'Siena Piazza WiFi', lat: 43.318, lng: 11.332 },
    { id: 'wf-08', name: 'Salzburg Station WiFi', lat: 47.8132, lng: 13.0463 },
    { id: 'wf-09', name: 'Innsbruck Free WiFi', lat: 47.2654, lng: 11.3927 },
    { id: 'wf-10', name: 'Cologne Station WiFi', lat: 50.943, lng: 6.959 },
  ],
  camping: [
    // Official and well-known camping/overnight spots along major walking routes
    { id: 'cp-01', name: 'Camping Zariquiegui', lat: 42.7812, lng: -1.6891 },
    { id: 'cp-02', name: 'Camping El Raso (Estella)', lat: 42.6722, lng: -2.0289 },
    { id: 'cp-03', name: 'Area de Peregrinos Burgos', lat: 42.3422, lng: -3.6967 },
    { id: 'cp-04', name: 'Camping Ciudad de Leon', lat: 42.6051, lng: -5.5711 },
    { id: 'cp-05', name: 'Bivouac O Cebreiro', lat: 42.7088, lng: -7.0425 },
    { id: 'cp-06', name: 'Camping As Cancelas (Santiago)', lat: 42.8744, lng: -8.5322 },
    { id: 'cp-07', name: 'Camping Orbitur (Porto)', lat: 41.1577, lng: -8.6703 },
    { id: 'cp-08', name: 'Camping Internazionale Firenze', lat: 43.7833, lng: 11.2500 },
    { id: 'cp-09', name: 'Camping Siena Colleverde', lat: 43.3267, lng: 11.3417 },
    { id: 'cp-10', name: 'Camping Tiber (Rome)', lat: 41.9539, lng: 12.4892 },
    { id: 'cp-11', name: 'Camping Einsiedeln', lat: 47.1308, lng: 8.7489 },
    { id: 'cp-12', name: 'Camping Salzburg Nord', lat: 47.8167, lng: 13.0500 },
    { id: 'cp-13', name: 'Campingplatz Berchtesgaden', lat: 47.6367, lng: 12.9989 },
    { id: 'cp-14', name: 'Camping Innsbruck Kranebitter', lat: 47.2594, lng: 11.3561 },
    { id: 'cp-15', name: 'Camping Genève Pointe-a-la-Bise', lat: 46.2333, lng: 6.1833 },
    { id: 'cp-16', name: 'Camping Bern Eymatt', lat: 46.9583, lng: 7.4000 },
    { id: 'cp-17', name: 'Camping Canterbury', lat: 51.2833, lng: 1.0833 },
    { id: 'cp-18', name: 'Camping Le Puy-en-Velay', lat: 45.0436, lng: 3.8978 },
    { id: 'cp-19', name: 'Camping Konstanz Klausenhorn', lat: 47.6500, lng: 9.1833 },
    { id: 'cp-20', name: 'Camping Freiburg Hirzberg', lat: 47.9833, lng: 7.8500 },
    { id: 'cp-21', name: 'Camping Garmisch-Partenkirchen', lat: 47.4917, lng: 11.1000 },
    { id: 'cp-22', name: 'Camping Köln Poll', lat: 50.9167, lng: 6.9833 },
    { id: 'cp-23', name: 'Camping La Cite (Carcassonne)', lat: 43.2067, lng: 2.3667 },
    { id: 'cp-24', name: 'Camping Assisi', lat: 43.0750, lng: 12.6083 },
    { id: 'cp-25', name: 'Camping Lucca Il Serchio', lat: 43.8500, lng: 10.5000 },
    { id: 'cp-26', name: 'Camping Roncesvaux', lat: 43.0094, lng: -1.3178 },
    { id: 'cp-27', name: 'Bivouac Cruz de Ferro', lat: 42.4633, lng: -6.3733 },
    { id: 'cp-28', name: 'Camping Astorga', lat: 42.4567, lng: -6.0567 },
    { id: 'cp-29', name: 'Camping Sarria', lat: 42.7783, lng: -7.4150 },
    { id: 'cp-30', name: 'Camping Finisterre', lat: 42.9083, lng: -9.2617 },
  ],
  mountains: [
    { id: 'mt-01', name: 'Cruz de Ferro', lat: 42.4646, lng: -6.3714 },
    { id: 'mt-02', name: 'Alto del Perdon', lat: 42.7797, lng: -1.7281 },
    { id: 'mt-03', name: 'O Cebreiro Pass', lat: 42.7101, lng: -7.0408 },
    { id: 'mt-04', name: 'Col de Roncevaux', lat: 43.0189, lng: -1.3252 },
    { id: 'mt-05', name: 'Gran Sasso', lat: 42.4684, lng: 13.5656 },
    { id: 'mt-06', name: 'Monte Amiata', lat: 42.89, lng: 11.622 },
    { id: 'mt-07', name: 'Hochkoenig', lat: 47.42, lng: 13.07 },
    { id: 'mt-08', name: 'Grossglockner', lat: 47.0742, lng: 12.6947 },
    { id: 'mt-09', name: 'Pic du Midi', lat: 42.937, lng: 0.1424 },
    { id: 'mt-10', name: 'Sierra Nevada', lat: 37.065, lng: -3.393 },
    { id: 'mt-11', name: 'Rigi', lat: 47.0567, lng: 8.4856 },
    { id: 'mt-12', name: 'Arlberg Pass', lat: 47.1297, lng: 10.2129 },
  ],
};

// Simplified route waypoints for polylines on the map
const ROUTE_LINES: { id: string; name: string; color: string; coords: [number, number][] }[] = [
  { id: 'koenigsweg', name: "The King's Way", color: '#D4A017', coords: [
    [47.63, 13.00], [47.42, 13.07], [47.27, 12.39], [47.26, 11.39], [47.17, 10.21],
    [47.37, 9.75], [47.43, 9.38], [47.13, 8.75], [47.00, 8.00], [46.95, 7.44],
    [46.52, 6.63], [46.20, 6.14], [45.90, 5.77], [45.44, 4.39], [45.05, 3.89],
    [44.84, 3.18], [44.37, 2.58], [43.93, 2.15], [43.60, 1.44], [43.30, 0.50],
    [42.88, -0.30], [42.82, -1.64], [42.47, -2.33], [42.34, -3.70], [42.60, -5.57],
    [42.46, -6.05], [42.44, -7.01], [42.88, -8.54], [42.23, -8.71], [41.65, -8.14],
    [40.96, -8.54], [39.74, -8.24], [38.72, -9.14], [38.08, -7.90], [37.39, -5.99],
    [36.72, -4.42], [36.01, -5.60],
  ]},
  { id: 'camino-frances', name: 'Camino Francés', color: '#C8762A', coords: [
    [43.01, -1.32], [42.97, -1.39], [42.82, -1.64], [42.67, -2.03], [42.47, -2.33],
    [42.34, -3.70], [42.27, -4.54], [42.60, -5.57], [42.46, -6.05], [42.44, -7.01],
    [42.88, -8.54],
  ]},
  { id: 'via-francigena', name: 'Via Francigena', color: '#8B4513', coords: [
    [51.28, 1.08], [50.94, 1.86], [49.90, 2.30], [49.25, 4.03], [48.30, 5.38],
    [47.47, 7.35], [46.95, 7.44], [46.52, 6.63], [46.00, 8.95], [45.46, 9.19],
    [44.72, 10.35], [43.77, 11.25], [43.32, 11.33], [42.73, 11.79], [42.29, 12.24],
    [41.90, 12.45],
  ]},
  { id: 'camino-portugues', name: 'Camino Portugués', color: '#2E6DA4', coords: [
    [41.15, -8.61], [41.37, -8.76], [41.69, -8.83], [42.05, -8.63], [42.43, -8.64],
    [42.63, -8.62], [42.88, -8.54],
  ]},
  { id: 'camino-del-norte', name: 'Camino del Norte', color: '#27864A', coords: [
    [43.19, -3.00], [43.26, -2.93], [43.32, -3.01], [43.39, -3.44], [43.46, -3.80],
    [43.38, -4.45], [43.37, -5.85], [43.27, -6.55], [43.23, -7.56], [43.01, -7.56],
    [42.88, -8.54],
  ]},
  { id: 'e1', name: 'E1 (North Cape — Sicily)', color: '#6366F1', coords: [
    [71.17, 25.78], [69.65, 18.96], [63.43, 10.40], [59.91, 10.75], [57.71, 11.97],
    [55.68, 12.57], [54.32, 10.14], [53.55, 9.99], [51.51, 7.47], [50.11, 8.68],
    [48.78, 9.18], [47.37, 9.75], [46.95, 7.44], [46.00, 8.95], [45.07, 7.69],
    [43.77, 11.25], [41.90, 12.45], [38.11, 13.36],
  ]},
  { id: 'e5', name: 'E5 (Pointe du Raz — Verona)', color: '#EC4899', coords: [
    [48.04, -4.73], [47.66, -2.76], [47.22, -1.55], [46.16, -1.15], [45.18, 0.72],
    [44.84, 0.58], [43.30, 0.50], [43.00, -0.05], [42.76, 0.17], [42.68, 0.73],
    [42.44, 1.47], [42.53, 2.43], [43.30, 5.37], [44.06, 6.24], [44.90, 6.87],
    [45.92, 7.87], [46.07, 11.12], [45.44, 11.00],
  ]},
];

function WebMapComponent({
  hosts, activeFilters, onHostPress, walkers, onWalkerPress, layers, mapMode, onMapModeChange
}: {
  hosts: Host[];
  activeFilters: Set<HostFilter>;
  onHostPress: (id: string) => void;
  walkers: SeedProfile[];
  onWalkerPress: (id: string) => void;
  layers: LayerState;
  mapMode: MapMode;
  onMapModeChange: (mode: MapMode) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const prevDataRef = useRef<string>('');

  // Map host type to marker color
  const getMarkerColor = (type: string): string => {
    const config = hostTypeConfig[type as keyof typeof hostTypeConfig];
    if (!config) return colors.ink3;
    return config.color;
  };

  // Send layer visibility updates to iframe via postMessage (no re-mount!)
  useEffect(() => {
    if (!mapReady || !iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage({
      type: 'update-layers',
      layers,
    }, '*');
  }, [layers, mapReady]);

  // Send filter updates via postMessage
  useEffect(() => {
    if (!mapReady || !iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage({
      type: 'update-filter',
      activeFilters: Array.from(activeFilters),
    }, '*');
  }, [activeFilters, mapReady]);

  // Send host data updates via postMessage when hosts change
  useEffect(() => {
    if (!mapReady || !iframeRef.current?.contentWindow) return;
    const hostData = hosts.map(h => ({
      id: h.id, name: h.name, lat: h.lat, lng: h.lng,
      host_type: h.host_type, color: getMarkerColor(h.host_type),
    }));
    const dataKey = JSON.stringify(hostData.map(h => h.id));
    if (dataKey === prevDataRef.current) return;
    prevDataRef.current = dataKey;
    iframeRef.current.contentWindow.postMessage({
      type: 'update-hosts',
      hosts: hostData,
    }, '*');
  }, [hosts, mapReady]);

  // Send walker data updates via postMessage
  useEffect(() => {
    if (!mapReady || !iframeRef.current?.contentWindow) return;
    const walkerData = walkers.map(w => ({
      id: w.id, trail_name: w.trail_name,
      lat: (w as any).lat, lng: (w as any).lng,
      is_walking: w.is_walking,
    }));
    iframeRef.current.contentWindow.postMessage({
      type: 'update-walkers',
      walkers: walkerData,
    }, '*');
  }, [walkers, mapReady]);

  // Send map mode (tile layer) updates via postMessage
  useEffect(() => {
    if (!mapReady || !iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage({
      type: 'update-tiles',
      mode: mapMode,
    }, '*');
  }, [mapMode, mapReady]);

  // Build stable HTML — all layer toggling happens via postMessage
  const html = React.useMemo(() => {
    // Pre-compute initial data for embedding
    const initialHosts = hosts.map(h => ({
      id: h.id, name: h.name, lat: h.lat, lng: h.lng,
      host_type: h.host_type, color: getMarkerColor(h.host_type),
    }));
    const initialWalkers = walkers.map(w => ({
      id: w.id, trail_name: w.trail_name,
      lat: (w as any).lat, lng: (w as any).lng,
      is_walking: w.is_walking,
    }));

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    #map { width: 100%; height: 100vh; }
    .leaflet-container { background: #f5f5f0; }
    .wk-icon { display:flex;align-items:center;justify-content:center;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3); }
    @keyframes wk-rotate { 0%{transform:rotateY(0deg)} 100%{transform:rotateY(360deg)} }
    @keyframes wk-walk { 0%{transform:translate(0,0)} 25%{transform:translate(0.3px,-0.2px)} 50%{transform:translate(0.6px,0)} 75%{transform:translate(0.3px,0.2px)} 100%{transform:translate(0,0)} }
    .wk-w { animation: wk-rotate 4s linear infinite; display:inline-block; perspective: 200px; }
    .wk-walking { animation: wk-walk 3s ease-in-out infinite; }
    .poi-icon { display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,0.2);font-size:12px; }
    .leaflet-control-attribution { font-size:8px!important; opacity:0.5; background:transparent!important; }
    .leaflet-control-attribution a { color:#999!important; }
    .leaflet-bottom.leaflet-right .leaflet-control-attribution { right:auto; left:0; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomSnap: 1,
      zoomDelta: 1,
      wheelPxPerZoomLevel: 120,
      fadeAnimation: true,
      zoomAnimation: true,
      markerZoomAnimation: true,
      zoomControl: false,
    }).setView([50.0, 10.0], 4);

    // Tile layer URLs for each mode
    var tileUrls = {
      normal: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      greyscale: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      explorer: 'https://tile.opentopomap.org/{z}/{x}/{y}.png'
    };

    var currentTileLayer = null;

    function setTileLayer(mode) {
      if (currentTileLayer) {
        map.removeLayer(currentTileLayer);
      }
      currentTileLayer = L.tileLayer(tileUrls[mode], {
        attribution: '\\u00a9 OSM',
        attributionControl: true,
        maxZoom: 19
      }).addTo(map);
    }

    // Initialize with normal mode
    setTileLayer('normal');

    // === LAYER GROUPS (toggled via postMessage — no iframe re-mount) ===
    var hostGroup = L.layerGroup().addTo(map);
    var walkerGroup = L.layerGroup().addTo(map);
    var routeGroup = L.layerGroup().addTo(map);
    var parishGroup = L.layerGroup();
    var churchGroup = L.layerGroup();
    var wifiGroup = L.layerGroup();
    var mountainGroup = L.layerGroup();
    var campingGroup = L.layerGroup();
    var communityGroup = L.layerGroup();

    var currentFilter = '${Array.from(activeFilters).join(",")}';
    var currentLayers = ${JSON.stringify(layers)};
    var walkIntervals = [];

    // === HOST RENDERING ===
    var allHosts = ${JSON.stringify(initialHosts)};

    function renderHosts() {
      hostGroup.clearLayers();
      if (!currentLayers.hosts) return;
      allHosts.forEach(function(host) {
        var activeTypes = currentFilter.split(',');
        if (activeTypes.length > 0 && !activeTypes.includes(host.host_type)) return;
        var mc = host.color || '#999';
        L.circleMarker([host.lat, host.lng], {
          radius: 7, fillColor: mc, color: '#fff', weight: 2, opacity: 1, fillOpacity: 0.85
        })
        .bindPopup('<div style="font-size:12px;text-align:center;"><strong>' + host.name + '</strong><br/><span style="color:' + mc + ';font-size:10px;text-transform:uppercase;">' + host.host_type + '</span></div>')
        .on('click', function() {
          window.parent.postMessage({ type: 'host-click', hostId: host.id }, '*');
        })
        .addTo(hostGroup);
      });
    }

    // === WANDERKINDER RENDERING ===
    var allWalkers = ${JSON.stringify(initialWalkers)};

    function clearWalkIntervals() {
      walkIntervals.forEach(function(iv) { clearInterval(iv); });
      walkIntervals = [];
    }

    function renderWalkers() {
      walkerGroup.clearLayers();
      clearWalkIntervals();
      if (!currentLayers.wanderkinder) return;
      allWalkers.forEach(function(w) {
        if (!w.lat || !w.lng) return;
        var isWalking = w.is_walking;
        var walkClass = isWalking ? ' wk-walking' : '';
        var icon = L.divIcon({
          className: '',
          html: '<div class="wk-icon' + walkClass + '" style="width:32px;height:32px;background:#C8762A;border:2.5px solid #fff;position:relative;perspective:200px;">'
            + '<span class="wk-w" style="color:#fff;font-weight:800;font-size:15px;font-family:\\'Helvetica Neue\\',Helvetica,Arial,sans-serif;letter-spacing:-0.5px;text-transform:uppercase;">W</span>'
            + '</div>',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });
        var marker = L.marker([w.lat, w.lng], { icon: icon })
          .bindPopup('<div style="font-size:12px;text-align:center;"><strong>' + w.trail_name + '</strong><br/><span style="color:#C8762A;font-size:10px;">' + (isWalking ? 'Currently walking' : 'Wanderkind') + '</span></div>')
          .on('click', function() {
            window.parent.postMessage({ type: 'walker-click', profileId: w.id }, '*');
          })
          .addTo(walkerGroup);

        if (isWalking) {
          var baseLat = w.lat;
          var baseLng = w.lng;
          var walkAngle = Math.random() * Math.PI * 2;
          var walkStep = 0;
          var iv = setInterval(function() {
            walkStep++;
            var drift = 0.00003 * walkStep;
            var newLat = baseLat + Math.sin(walkAngle) * drift + (Math.random() - 0.5) * 0.00005;
            var newLng = baseLng + Math.cos(walkAngle) * drift + (Math.random() - 0.5) * 0.00005;
            marker.setLatLng([newLat, newLng]);
            if (walkStep % 10 === 0) walkAngle += (Math.random() - 0.5) * 0.3;
            if (walkStep > 100) { walkStep = 0; baseLat = newLat; baseLng = newLng; }
          }, 4000);
          walkIntervals.push(iv);
        }
      });
    }

    // === POI RENDERING (static data, toggled via layer groups) ===
    var parishes = ${JSON.stringify(POI_DATA.parishes)};
    parishes.forEach(function(p) {
      var icon = L.divIcon({
        className: '',
        html: '<div class="poi-icon" style="background:#6B21A8;color:#fff;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"/></svg></div>',
        iconSize: [24, 24], iconAnchor: [12, 12]
      });
      L.marker([p.lat, p.lng], { icon: icon })
        .bindPopup('<div style="font-size:12px;text-align:center;"><strong>' + p.name + '</strong><br/><span style="color:#6B21A8;font-size:10px;">Parish (Pfarrei)</span></div>')
        .addTo(parishGroup);
    });

    var churches = ${JSON.stringify(POI_DATA.churches)};
    churches.forEach(function(c) {
      var icon = L.divIcon({
        className: '',
        html: '<div class="poi-icon" style="background:#8B4513;color:#fff;">\\u271D</div>',
        iconSize: [24, 24], iconAnchor: [12, 12]
      });
      L.marker([c.lat, c.lng], { icon: icon })
        .bindPopup('<div style="font-size:12px;text-align:center;"><strong>' + c.name + '</strong><br/><span style="color:#8B4513;font-size:10px;">Church</span></div>')
        .addTo(churchGroup);
    });

    var wifis = ${JSON.stringify(POI_DATA.wifi)};
    wifis.forEach(function(w) {
      var icon = L.divIcon({
        className: '',
        html: '<div class="poi-icon" style="background:#0ea5e9;color:#fff;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="white"/></svg></div>',
        iconSize: [24, 24], iconAnchor: [12, 12]
      });
      L.marker([w.lat, w.lng], { icon: icon })
        .bindPopup('<div style="font-size:12px;text-align:center;"><strong>' + w.name + '</strong><br/><span style="color:#0ea5e9;font-size:10px;">Free WiFi</span></div>')
        .addTo(wifiGroup);
    });

    var mountains = ${JSON.stringify(POI_DATA.mountains)};
    mountains.forEach(function(m) {
      var icon = L.divIcon({
        className: '',
        html: '<div class="poi-icon" style="background:#6B7280;color:#fff;"><svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M12 2L2 22h20L12 2zm0 4l7 14H5l7-14z"/></svg></div>',
        iconSize: [24, 24], iconAnchor: [12, 12]
      });
      L.marker([m.lat, m.lng], { icon: icon })
        .bindPopup('<div style="font-size:12px;text-align:center;"><strong>' + m.name + '</strong><br/><span style="color:#6B7280;font-size:10px;">Mountain</span></div>')
        .addTo(mountainGroup);
    });

    // === CAMPING RENDERING ===
    var campingSpots = ${JSON.stringify(POI_DATA.camping)};
    campingSpots.forEach(function(c) {
      var icon = L.divIcon({
        className: '',
        html: '<div class="poi-icon" style="background:#059669;color:#fff;"><svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M12 2L3 20h18L12 2zm0 5l5.5 11h-11L12 7z"/><rect x="8" y="18" width="8" height="2" rx="1"/></svg></div>',
        iconSize: [24, 24], iconAnchor: [12, 12]
      });
      L.marker([c.lat, c.lng], { icon: icon })
        .bindPopup('<div style="font-size:12px;text-align:center;"><strong>' + c.name + '</strong><br/><span style="color:#059669;font-size:10px;">Camping</span></div>')
        .on('click', function() {
          window.parent.postMessage({ type: 'camping-click', campingId: c.id }, '*');
        })
        .addTo(campingGroup);
    });

    // === COMMUNITY RENDERING ===
    var communityPins = ${JSON.stringify(SEED_COMMUNITY_PINS)};
    var communityColors = { campsite: '#059669', private_host: '#C8762A', parking: '#6366F1', accommodation: '#0ea5e9', water: '#2563EB', other: '#6B7280' };
    var communityIcons = { campsite: 'M12 2L3 20h18L12 2z', private_host: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z', parking: 'M13 3H6v18h4v-6h3c3.31 0 6-2.69 6-6s-2.69-6-6-6zm.2 8H10V7h3.2c1.1 0 2 .9 2 2s-.9 2-2 2z', accommodation: 'M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V7H1v10h2v-3h18v3h2V10c0-2.21-1.79-4-4-4z', water: 'M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2C20 10.48 17.33 6.55 12 2z', other: 'M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z' };
    communityPins.forEach(function(pin) {
      var col = communityColors[pin.type] || '#6B7280';
      var pathD = communityIcons[pin.type] || communityIcons.other;
      var icon = L.divIcon({
        className: '',
        html: '<div style="width:28px;height:28px;border-radius:50%;background:' + col + ';border:2px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);"><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="' + pathD + '"/></svg></div>',
        iconSize: [28, 28], iconAnchor: [14, 14]
      });
      var popupHtml = '<div style="font-size:12px;max-width:180px;"><strong>' + pin.name + '</strong><br/><span style="color:' + col + ';font-size:10px;text-transform:uppercase;">COMMUNITY</span>';
      if (pin.note) popupHtml += '<br/><span style="font-size:11px;color:#666;margin-top:4px;display:block;">' + pin.note + '</span>';
      popupHtml += '</div>';
      L.marker([pin.lat, pin.lng], { icon: icon })
        .bindPopup(popupHtml)
        .addTo(communityGroup);
    });

    // === ISRAEL BLANK OVERLAY ===
    // Grey polygon covering Israel — no names, no features, just blank
    var israelCoords = [
      [33.35, 34.25], [33.10, 35.65], [33.00, 35.85], [32.75, 35.80],
      [32.55, 35.55], [32.35, 35.56], [32.10, 35.55], [31.80, 35.50],
      [31.50, 35.47], [31.35, 35.40], [31.25, 35.20], [31.10, 35.00],
      [30.90, 35.15], [30.50, 35.00], [30.30, 35.15], [29.95, 35.00],
      [29.55, 34.95], [29.50, 34.90], [29.49, 34.27], [30.10, 34.30],
      [30.50, 34.35], [31.00, 34.20], [31.50, 34.25], [31.80, 34.40],
      [32.00, 34.45], [32.30, 34.55], [32.50, 34.65], [32.80, 34.70],
      [32.95, 35.05], [33.10, 35.10], [33.28, 35.20], [33.35, 34.25],
    ];
    L.polygon(israelCoords, {
      color: '#d5d5d0',
      fillColor: '#e8e8e3',
      fillOpacity: 1,
      weight: 1,
      opacity: 0.6,
      interactive: false,
    }).addTo(map);

    // === ROUTE POLYLINES ===
    var routes = ${JSON.stringify(ROUTE_LINES)};
    routes.forEach(function(route) {
      var latlngs = route.coords.map(function(c) { return [c[0], c[1]]; });
      L.polyline(latlngs, {
        color: route.color,
        weight: 3,
        opacity: 0.7,
        dashArray: route.id === 'koenigsweg' ? null : '8 4',
        lineCap: 'round',
        lineJoin: 'round'
      })
      .bindPopup('<div style="font-size:13px;text-align:center;font-weight:600;color:' + route.color + ';">' + route.name + '</div>')
      .addTo(routeGroup);
    });

    // === LAYER TOGGLE HANDLER (instant, no reload) ===
    function applyLayers(ly) {
      currentLayers = ly;
      // Hosts and walkers re-render (they respect currentLayers internally)
      renderHosts();
      renderWalkers();
      // POI layers: add/remove from map
      if (ly.ways && !map.hasLayer(routeGroup)) map.addLayer(routeGroup);
      if (!ly.ways && map.hasLayer(routeGroup)) map.removeLayer(routeGroup);
      if (ly.parishes && !map.hasLayer(parishGroup)) map.addLayer(parishGroup);
      if (!ly.parishes && map.hasLayer(parishGroup)) map.removeLayer(parishGroup);
      if (ly.churches && !map.hasLayer(churchGroup)) map.addLayer(churchGroup);
      if (!ly.churches && map.hasLayer(churchGroup)) map.removeLayer(churchGroup);
      if (ly.wifi && !map.hasLayer(wifiGroup)) map.addLayer(wifiGroup);
      if (!ly.wifi && map.hasLayer(wifiGroup)) map.removeLayer(wifiGroup);
      if (ly.mountains && !map.hasLayer(mountainGroup)) map.addLayer(mountainGroup);
      if (!ly.mountains && map.hasLayer(mountainGroup)) map.removeLayer(mountainGroup);
      if (ly.camping && !map.hasLayer(campingGroup)) map.addLayer(campingGroup);
      if (!ly.camping && map.hasLayer(campingGroup)) map.removeLayer(campingGroup);
      if (ly.community && !map.hasLayer(communityGroup)) map.addLayer(communityGroup);
      if (!ly.community && map.hasLayer(communityGroup)) map.removeLayer(communityGroup);
    }

    // Initial render
    renderHosts();
    renderWalkers();
    applyLayers(currentLayers);

    // Handle messages from parent
    window.addEventListener('message', function(event) {
      if (!event.data || !event.data.type) return;
      switch (event.data.type) {
        case 'center-on-location':
          map.flyTo([event.data.lat, event.data.lng], event.data.zoom || 13, { animate: true, duration: 1.2 });
          break;
        case 'flyTo':
          map.flyTo([event.data.lat, event.data.lng], event.data.zoom || 14, { animate: true, duration: 1.2 });
          break;
        case 'update-layers':
          applyLayers(event.data.layers);
          break;
        case 'update-filter':
          currentFilter = Array.isArray(event.data.activeFilters) ? event.data.activeFilters.join(',') : currentFilter;
          renderHosts();
          break;
        case 'update-hosts':
          allHosts = event.data.hosts;
          renderHosts();
          break;
        case 'update-walkers':
          allWalkers = event.data.walkers;
          renderWalkers();
          break;
        case 'update-tiles':
          setTileLayer(event.data.mode);
          break;
      }
    });

    // Signal ready to parent
    window.parent.postMessage({ type: 'map-ready' }, '*');
  <\/script>
</body>
</html>`;
  }, []); // Stable — never re-generates HTML

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'host-click') onHostPress(event.data.hostId);
      if (event.data?.type === 'walker-click') onWalkerPress(event.data.profileId);
      if (event.data?.type === 'map-ready') setMapReady(true);
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onHostPress, onWalkerPress]);

  return (
    <View style={styles.map}>
      {Platform.OS === 'web' && (
        <>
          {!mapReady && (
            <View style={styles.mapLoading}>
              <Text style={styles.mapLoadingText}>Loading map...</Text>
            </View>
          )}
          {/* @ts-ignore — stable iframe, no key-based re-mount */}
          <iframe
            ref={iframeRef}
            srcDoc={html}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: 'none', width: '100%', height: '100%' }}
            sandbox="allow-scripts allow-same-origin"
          />
        </>
      )}
    </View>
  );
}

// Map modes panel overlay
function MapModesPanel({ mapMode, onModeChange, onClose }: {
  mapMode: MapMode;
  onModeChange: (mode: MapMode) => void;
  onClose: () => void;
}) {
  const modes: { id: MapMode; label: string; description: string; icon: string }[] = [
    { id: 'normal', label: 'Normal', description: 'OpenStreetMap (Default)', icon: 'map' },
    { id: 'greyscale', label: 'Grey/Orange', description: 'CartoDB Positron - Clean', icon: 'contrast' },
    { id: 'explorer', label: 'Terrain', description: 'OpenTopoMap - Topographic', icon: 'mountain' },
  ];

  return (
    <View style={styles.mapModesPanel}>
      <View style={styles.mapModesPanelHeader}>
        <Text style={styles.mapModesPanelTitle}>MAP STYLE</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="close" size={20} color={colors.ink} />
        </TouchableOpacity>
      </View>
      {modes.map(({ id, label, description, icon }) => (
        <TouchableOpacity
          key={id}
          style={[styles.mapModeRow, mapMode === id && styles.mapModeRowActive]}
          onPress={() => {
            onModeChange(id);
            onClose();
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.mapModeIcon, mapMode === id && { backgroundColor: colors.amberBg }]}>
            <Ionicons name={icon as any} size={16} color={mapMode === id ? colors.amber : colors.ink3} />
          </View>
          <View style={styles.mapModeInfo}>
            <Text style={[styles.mapModeLabel, mapMode !== id && { color: colors.ink3 }]}>{label}</Text>
            <Text style={styles.mapModeDescription}>{description}</Text>
          </View>
          {mapMode === id && (
            <Ionicons name="checkmark-circle" size={20} color={colors.amber} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

// Layers panel overlay
function LayersPanel({ layers, onToggle, onClose }: {
  layers: LayerState;
  onToggle: (key: keyof LayerState) => void;
  onClose: () => void;
}) {
  const layerConfig: { key: keyof LayerState; label: string; icon: string; color: string }[] = [
    { key: 'hosts', label: 'Wanderhosts', icon: 'home', color: colors.amber },
    { key: 'wanderkinder', label: 'Wanderkinder', icon: 'people', color: '#C8762A' },
    { key: 'ways', label: 'The Ways', icon: 'map', color: colors.green },
    { key: 'wifi', label: 'Public WiFi', icon: 'wifi', color: '#0ea5e9' },
    { key: 'churches', label: 'Churches', icon: 'business', color: '#8B4513' },
    { key: 'parishes', label: 'Parishes', icon: 'home', color: '#6B21A8' },
    { key: 'mountains', label: 'Mountains', icon: 'triangle', color: '#6B7280' },
    { key: 'camping', label: 'Camping', icon: 'bonfire', color: '#059669' },
    { key: 'community', label: 'Community', icon: 'people-circle', color: '#C8762A' },
  ];

  return (
    <View style={styles.layersPanel}>
      <View style={styles.layersPanelHeader}>
        <Text style={styles.layersPanelTitle}>MAP LAYERS</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="close" size={20} color={colors.ink} />
        </TouchableOpacity>
      </View>
      {layerConfig.map(({ key, label, icon, color }) => (
        <TouchableOpacity
          key={key}
          style={styles.layerRow}
          onPress={() => { haptic.selection(); onToggle(key); }}
          activeOpacity={0.7}
        >
          <View style={[styles.layerIcon, { backgroundColor: `${color}20` }]}>
            <Ionicons name={icon as any} size={16} color={color} />
          </View>
          <Text style={[styles.layerLabel, !layers[key] && { color: colors.ink3 }]}>{label}</Text>
          <Switch
            value={layers[key]}
            onValueChange={() => onToggle(key)}
            trackColor={{ false: colors.borderLt, true: `${color}40` }}
            thumbColor={layers[key] ? color : '#ccc'}
            style={{ transform: [{ scale: 0.8 }] }}
          />
        </TouchableOpacity>
      ))}
      {/* Legend */}
      <View style={styles.layersLegend}>
        <Text style={styles.legendTitle}>HOST COLORS</Text>
        <View style={styles.legendRow}>
          {(['free', 'donativo', 'budget', 'paid'] as const).map(t => (
            <View key={t} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: hostTypeConfig[t].color }]} />
              <Text style={styles.legendLabel}>{hostTypeConfig[t].label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

export default function MapHome() {
  useAuthGuard(); // Track auth but don't block map rendering
  const router = useRouter();
  const { profile } = useAuthStore();
  const mapRef = useRef<any>(null);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [activeFilters, setActiveFilters] = useState<Set<HostFilter>>(new Set(['free','donativo','budget']));
  const toggleFilter = (f: HostFilter) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(f) && next.size > 1) next.delete(f); else next.add(f);
      return next;
    });
  };
  const [nearbyHosts, setNearbyHosts] = useState<Host[]>([]);
  const [activeHostIndex, setActiveHostIndex] = useState(0);
  const [showLayers, setShowLayers] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showPastStays, setShowPastStays] = useState(false);
  const [showMapModes, setShowMapModes] = useState(false);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [liveWalkers, setLiveWalkers] = useState<SeedProfile[]>([]);
  const [mapMode, setMapMode] = useState<MapMode>('normal');
  const hostListRef = useRef<FlatList>(null);
  const [layers, setLayers] = useState<LayerState>({
    hosts: true,
    wanderkinder: true,
    ways: true,
    wifi: false,
    churches: false,
    parishes: false,
    mountains: false,
    camping: false,
    community: false,
  });
  const [showCommunityFAB, setShowCommunityFAB] = useState(false);
  const [showCommunityInfo, setShowCommunityInfo] = useState(false);
  const [communityPins, setCommunityPins] = useState<CommunityPin[]>(SEED_COMMUNITY_PINS);

  // Memoize walking seed profiles for efficient filtering
  const walkingSeedProfiles = useMemo(
    () => SEED_PROFILES.filter(p => p.is_walking && (p as any).lat && (p as any).lng),
    []
  );

  // Roof Tonight — emergency accommodation request
  const [showRoofTonight, setShowRoofTonight] = useState(false);
  const [roofSentCount, setRoofSentCount] = useState(0); // 0 = not sent, 1 = 5km sent, 2 = 10km sent
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  // Update hour every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentHour(new Date().getHours()), 60000);
    return () => clearInterval(interval);
  }, []);

  const isRoofActive = currentHour >= 18; // Active after 6pm
  const canSendFirst = isRoofActive && roofSentCount === 0;
  const canSendSecond = isRoofActive && currentHour >= 19 && roofSentCount === 1;

  const handleRoofTonight = useCallback(() => {
    if (!isRoofActive) {
      toast.info('Roof Tonight activates at 6:00 PM');
      return;
    }
    if (roofSentCount >= 2) {
      toast.info('You have already sent both requests tonight');
      return;
    }
    setShowRoofTonight(true);
  }, [isRoofActive, roofSentCount]);

  const sendRoofRequest = useCallback(async () => {
    const radius = roofSentCount === 0 ? 5 : 10;
    haptic.medium();
    setShowRoofTonight(false);
    setRoofSentCount(prev => prev + 1);

    // In production: send push notification via Supabase Edge Function to nearby users
    // For now: show success feedback
    toast.success(
      roofSentCount === 0
        ? `Help request sent to wanderkinder & hosts within ${radius} km`
        : `Extended request sent within ${radius} km radius`
    );
  }, [roofSentCount]);

  // Get user location on mount
  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS === 'web') {
          if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
              (pos) => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude); },
              () => { /* fallback: no location */ }
            );
          }
        } else {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            setUserLat(loc.coords.latitude);
            setUserLng(loc.coords.longitude);
          }
        }
      } catch (err) {
        console.warn('Location permission or fetch failed:', err);
      }
    })();
  }, []);

  useEffect(() => {
    fetchHosts();
    fetchLiveWalkers();
  }, []);

  // Fetch real profiles from Supabase and merge with seed data
  const fetchLiveWalkers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, trail_name, avatar_url, is_walking, lat, lng, tier, searchable, show_on_map')
        .or('is_walking.eq.true,searchable.eq.true');

      if (!error && data && data.length > 0) {
        const liveProfiles = data
          .filter((p: any) => p.lat != null && p.lng != null && p.show_on_map !== false)
          .map((p: any) => ({
            id: p.id,
            trail_name: p.trail_name || 'Wanderkind',
            avatar_url: p.avatar_url,
            is_walking: p.is_walking ?? false,
            lat: p.lat,
            lng: p.lng,
            tier: p.tier || 'wanderkind',
          }));
        setLiveWalkers(liveProfiles as any);
      }
    } catch (err) {
      console.error('Failed to fetch live walkers:', err);
    }
  };

  // Sort hosts by distance whenever hosts or user location changes
  useEffect(() => {
    if (hosts.length === 0) return;
    let sorted: Host[];
    if (userLat != null && userLng != null) {
      sorted = [...hosts].sort((a, b) =>
        haversineKm(userLat, userLng, a.lat, a.lng) - haversineKm(userLat, userLng, b.lat, b.lng)
      );
    } else {
      // No user location — sort by popularity
      sorted = [...hosts].sort((a, b) => (b.total_hosted ?? 0) - (a.total_hosted ?? 0));
    }
    // Apply filter
    const filtered = sorted.filter(h => activeFilters.has(h.host_type as HostFilter));
    setNearbyHosts(filtered);
    setActiveHostIndex(0);
  }, [hosts, userLat, userLng, activeFilters]);

  const fetchHosts = async () => {
    try {
      try {
        const { data } = await supabase
          .from('hosts')
          .select('*')
          .eq('is_available', true)
          .order('total_hosted', { ascending: false });

        if (data && data.length > 0) {
          setHosts(data as Host[]);
          return;
        }
      } catch (err) {
        console.error('Failed to fetch hosts from Supabase:', err);
      }

      // Fallback to seed data — dynamically imported for bundle optimization
      const { default: seedHosts } = await import('../../../src/data/seed-hosts.json');
      setHosts(seedHosts as unknown as Host[]);
    } catch (err) {
      console.error('Failed to load hosts:', err);
      toast.error('Could not load hosts');
    }
  };

  const toggleLayer = (key: keyof LayerState) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleHostPress = (hostId: string) => {
    router.push(`/(tabs)/map/host/${hostId}`);
  };

  // Center map on a specific host
  const centerMapOnHost = useCallback((host: Host) => {
    if (Platform.OS === 'web') {
      const iframe = document.querySelector('iframe');
      iframe?.contentWindow?.postMessage({
        type: 'center-on-location',
        lat: host.lat,
        lng: host.lng,
      }, '*');
    } else {
      mapRef.current?.animateToRegion({
        latitude: host.lat,
        longitude: host.lng,
        latitudeDelta: 0.15,
        longitudeDelta: 0.15,
      }, 800);
    }
  }, []);

  // On card swipe — center map on the newly visible host
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
    if (viewableItems.length > 0) {
      const idx = viewableItems[0].index ?? 0;
      setActiveHostIndex(idx);
      haptic.light();
      const host = viewableItems[0].item as Host;
      if (host && host.lat && host.lng) {
        // Fly map to this host's location
        if (Platform.OS === 'web') {
          // Find all iframes and post to each — ensures we hit the map iframe
          const iframes = document.querySelectorAll('iframe');
          iframes.forEach((iframe: HTMLIFrameElement) => {
            try {
              iframe.contentWindow?.postMessage({
                type: 'flyTo',
                lat: host.lat,
                lng: host.lng,
                zoom: 14,
              }, '*');
            } catch (e) {
              // cross-origin iframe, skip
            }
          });
        }
      }
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const handleLocationPress = async () => {
    try {
      if (Platform.OS === 'web') {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            setUserLat(latitude);
            setUserLng(longitude);
            const iframe = document.querySelector('iframe');
            iframe?.contentWindow?.postMessage({
              type: 'center-on-location',
              lat: latitude,
              lng: longitude,
              zoom: 14,
            }, '*');
          }, () => {});
        }
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLat(loc.coords.latitude);
        setUserLng(loc.coords.longitude);
        mapRef.current?.animateToRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }, 800);
      }
    } catch (err) {
      console.warn('[Map] Relocate failed:', err);
    }
  };

  // Find route coords for user's active way
  const activeRouteCoords = React.useMemo(() => {
    if (!profile?.current_way) return null;
    const route = ROUTE_LINES.find(r => r.id === profile.current_way);
    return route?.coords ?? null;
  }, [profile?.current_way]);

  // Format distance for display — prefer route-relative when available
  const formatDistance = (host: Host): string => {
    if (userLat != null && userLng != null) {
      // Try route-relative distance first
      if (activeRouteCoords) {
        const rel = getRouteRelativeDistance(userLat, userLng, host.lat, host.lng, activeRouteCoords);
        if (rel) {
          const d = rel.distanceKm;
          const label = rel.ahead ? 'ahead' : 'behind';
          if (d < 1) return `${Math.round(d * 1000)} m ${label}`;
          if (d < 100) return `${d.toFixed(1)} km ${label}`;
          return `${Math.round(d)} km ${label}`;
        }
      }
      // Fallback to straight-line distance
      const d = haversineKm(userLat, userLng, host.lat, host.lng);
      if (d < 1) return `${Math.round(d * 1000)} m`;
      if (d < 100) return `${d.toFixed(1)} km`;
      return `${Math.round(d)} km`;
    }
    if (host.route_km) return `km ${host.route_km}`;
    return 'Nearby';
  };

  // Favorite Button Component
  const FavoriteButton = useCallback(({ hostId }: { hostId: string }) => {
    const { toggleFavorite, isFavorite } = useFavoritesStore();
    const isFav = isFavorite(hostId);

    return (
      <TouchableOpacity
        onPress={() => toggleFavorite(hostId)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name={isFav ? 'heart' : 'heart-outline'}
          size={20}
          color={isFav ? colors.red : colors.ink3}
        />
      </TouchableOpacity>
    );
  }, []);

  // Render a single host card
  const renderHostCard = useCallback(({ item, index }: { item: Host; index: number }) => {
    const config = hostTypeConfig[item.host_type as keyof typeof hostTypeConfig];
    const dist = formatDistance(item);

    return (
      <TouchableOpacity
        style={styles.hostCard}
        activeOpacity={0.95}
        onPress={() => haptic.light()}
      >
        {/* Top label row */}
        <View style={styles.hostCardHeader}>
          <View style={[styles.hostTypeBadge, { backgroundColor: config?.bg ?? colors.amberBg }]}>
            <Text style={[styles.hostTypeBadgeText, { color: config?.color ?? colors.amber }]}>
              {config?.label ?? 'HOST'}
            </Text>
          </View>
          <Text style={styles.hostCardDistance}>{dist}</Text>
          <Text style={styles.hostCardIndex}>{index + 1}/{nearbyHosts.length}</Text>
        </View>

        {/* Name + Favorite Button */}
        <View style={styles.nameRow}>
          <Text style={styles.hostCardName} numberOfLines={3}>{item.name}</Text>
          <FavoriteButton hostId={item.id} />
        </View>

        {/* Address / Region */}
        <View style={styles.hostCardRow}>
          <Ionicons name="location-outline" size={13} color={colors.ink3} />
          <Text style={styles.hostCardDetail} numberOfLines={1}>
            {(item as any).region ? `${(item as any).region}, ${(item as any).country}` : 'Along the Way'}
          </Text>
        </View>

        {/* Capacity */}
        <View style={styles.hostCardRow}>
          <Ionicons name="bed-outline" size={13} color={colors.ink3} />
          <Text style={styles.hostCardDetail}>
            {item.capacity ? `${item.capacity} beds` : 'Beds available'}
          </Text>
        </View>

        {/* Description — always shown, first 2 lines */}
        {item.description && (
          <View style={styles.hostCardRow}>
            <Text style={styles.hostCardDetail} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
        )}

        {/* Hosted count */}
        <View style={styles.hostCardRow}>
          <Ionicons name="people-outline" size={13} color={colors.ink3} />
          <Text style={styles.hostCardDetail}>
            {item.total_hosted?.toLocaleString() ?? '0'} wanderkinder hosted
          </Text>
        </View>

        {/* Country */}
        {(item as any).country && (
          <View style={styles.hostCardRow}>
            <Ionicons name="flag-outline" size={13} color={colors.ink3} />
            <Text style={styles.hostCardDetail}>{(item as any).country}</Text>
          </View>
        )}

        {/* Route km */}
        {item.route_km != null && (
          <View style={styles.hostCardRow}>
            <Ionicons name="compass-outline" size={13} color={colors.ink3} />
            <Text style={styles.hostCardDetail}>Route km {item.route_km}</Text>
          </View>
        )}

        {/* Price range */}
        {(item as any).price_range && (
          <View style={styles.hostCardRow}>
            <Ionicons name="pricetag-outline" size={13} color={colors.ink3} />
            <Text style={styles.hostCardDetail}>{(item as any).price_range}</Text>
          </View>
        )}

        {/* Trust badges — freshness + data source + response time */}
        <View style={styles.trustBadgeRow}>
          {(() => {
            const fresh = getFreshnessBadge((item as any).last_confirmed);
            return (
              <View style={[styles.trustBadge, { backgroundColor: fresh.bg }]}>
                <Ionicons name={fresh.icon as any} size={10} color={fresh.color} />
                <Text style={[styles.trustBadgeText, { color: fresh.color }]}>{fresh.label}</Text>
              </View>
            );
          })()}
          {(() => {
            const src = dataSourceConfig[(item as any).data_source] || dataSourceConfig.community_report;
            return (
              <View style={[styles.trustBadge, { backgroundColor: 'rgba(155,142,126,0.06)' }]}>
                <Ionicons name="shield-checkmark-outline" size={10} color={src.color} />
                <Text style={[styles.trustBadgeText, { color: src.color }]}>{src.label}</Text>
              </View>
            );
          })()}
          {(() => {
            const resp = getResponseTimeBadge((item as any).avg_response_minutes);
            return (
              <View style={[styles.trustBadge, { backgroundColor: resp.bg }]}>
                <Ionicons name={resp.icon as any} size={10} color={resp.color} />
                <Text style={[styles.trustBadgeText, { color: resp.color }]}>{resp.label}</Text>
              </View>
            );
          })()}
          {(item as any).amenities && (item as any).amenities.length > 0 && (
            <View style={[styles.trustBadge, { backgroundColor: colors.amberBg }]}>
              <Ionicons name="pricetag-outline" size={10} color={colors.amber} />
              <Text style={[styles.trustBadgeText, { color: colors.amber }]}>{(item as any).amenities.length} features</Text>
            </View>
          )}
        </View>

        {/* Features */}
        {(item as any).amenities && (item as any).amenities.length > 0 && (
          <View style={styles.amenitiesRow}>
            {(item as any).amenities.map((a: string, i: number) => (
              <View key={i} style={styles.amenityPill}>
                <Text style={styles.amenityText}>{a}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Contact row — phone & email */}
        <View style={styles.hostContactRow}>
          {(item as any).phone ? (
            <TouchableOpacity
              style={styles.contactBtn}
              onPress={() => Linking.openURL(`tel:${(item as any).phone}`)}
            >
              <Ionicons name="call" size={14} color={colors.green} />
              <Text style={styles.contactBtnText}>Call</Text>
            </TouchableOpacity>
          ) : null}
          {(item as any).email ? (
            <TouchableOpacity
              style={styles.contactBtn}
              onPress={() => Linking.openURL(`mailto:${(item as any).email}`)}
            >
              <Ionicons name="mail" size={14} color={colors.amber} />
              <Text style={styles.contactBtnText}>Email</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() => {
              centerMapOnHost(item);
            }}
          >
            <Ionicons name="navigate" size={14} color={colors.ink2} />
            <Text style={styles.contactBtnText}>Focus</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }, [nearbyHosts.length, userLat, userLng, router, centerMapOnHost]);

  return (
    <RouteErrorBoundary routeName="Map">
      <View style={styles.container}>
      {/* Map */}
      {Platform.OS === 'web' ? (
        <WebMapComponent
          hosts={hosts}
          activeFilters={activeFilters}
          onHostPress={handleHostPress}
          walkers={[...walkingSeedProfiles, ...liveWalkers.filter(lw => !walkingSeedProfiles.some(sp => sp.id === lw.id))]}
          onWalkerPress={(profileId) => router.push(`/(tabs)/me/profile/${profileId}`)}
          layers={layers}
          mapMode={mapMode}
          onMapModeChange={setMapMode}
        />
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={INITIAL_REGION}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          showsUserLocation
          showsMyLocationButton={false}
          mapType="standard"
        >
          {layers.hosts && hosts.map(host => (
            <Marker
              key={host.id}
              coordinate={{ latitude: host.lat, longitude: host.lng }}
              pinColor={hostTypeConfig[host.host_type as keyof typeof hostTypeConfig]?.color ?? colors.ink3}
              onPress={() => handleHostPress(host.id)}
            />
          ))}
        </MapView>
      )}

      {/* Top controls — filter tags only */}
      <SafeAreaView style={styles.topOverlay} edges={['top']}>
        <View style={styles.filterRow}>
          {(['free','donativo','budget'] as HostFilter[]).map(f => {
            const active = activeFilters.has(f);
            const label = f === 'free' ? 'FREE' : f === 'donativo' ? 'DONATIVO' : 'BUDGET';
            return (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => { haptic.selection(); toggleFilter(f); }}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>

      {/* Right side — layers, map style, locate/center */}
      <View style={styles.rightActionStrip}>
        <TouchableOpacity
          style={styles.rightActionBtn}
          onPress={() => { haptic.selection(); setShowLayers(!showLayers); }}
        >
          <Ionicons name="layers" size={20} color={colors.amber} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rightActionBtn}
          onPress={() => { haptic.selection(); setShowMapModes(!showMapModes); }}
        >
          <Ionicons name="map" size={20} color={colors.amber} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rightActionBtn}
          onPress={() => { haptic.light(); handleLocationPress(); }}
        >
          <Ionicons name="locate" size={20} color={colors.amber} />
        </TouchableOpacity>
      </View>

      {/* Map modes panel */}
      {showMapModes && (
        <MapModesPanel
          mapMode={mapMode}
          onModeChange={setMapMode}
          onClose={() => setShowMapModes(false)}
        />
      )}

      {/* Layers panel */}
      {showLayers && (
        <LayersPanel
          layers={layers}
          onToggle={toggleLayer}
          onClose={() => setShowLayers(false)}
        />
      )}

      {/* Left side — heart (favorites), past stays, shuffle */}
      <View style={styles.leftActionStrip}>
        <TouchableOpacity
          style={[styles.leftActionBtn, showFavorites && styles.leftActionBtnActive]}
          onPress={() => { setShowFavorites(!showFavorites); setShowPastStays(false); }}
        >
          <Ionicons
            name={showFavorites ? 'heart' : 'heart-outline'}
            size={20}
            color={showFavorites ? '#E25555' : colors.amber}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.leftActionBtn, showPastStays && styles.leftActionBtnActive]}
          onPress={() => { setShowPastStays(!showPastStays); setShowFavorites(false); }}
        >
          <Ionicons
            name={showPastStays ? 'home' : 'home-outline'}
            size={20}
            color={showPastStays ? colors.amber : colors.ink2}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.leftActionBtn}
          onPress={() => { haptic.medium(); router.push('/(tabs)/more/shuffle'); }}
        >
          <Ionicons name="shuffle" size={20} color={colors.amber} />
        </TouchableOpacity>
      </View>



      {/* Community contribution FAB — orange circle with + */}
      <TouchableOpacity
        style={styles.communityFab}
        onPress={() => { haptic.medium(); setShowCommunityFAB(!showCommunityFAB); }}
        activeOpacity={0.8}
      >
        <Ionicons name={showCommunityFAB ? 'close' : 'add'} size={22} color="#fff" />
      </TouchableOpacity>

      {/* Community contribution menu */}
      {showCommunityFAB && (
        <View style={styles.communityMenu}>
          <View style={styles.communityMenuHeader}>
            <Text style={styles.communityMenuTitle}>ADD TO MAP</Text>
            <TouchableOpacity onPress={() => setShowCommunityInfo(!showCommunityInfo)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="information-circle-outline" size={18} color={colors.ink2} />
            </TouchableOpacity>
          </View>
          {showCommunityInfo && (
            <View style={styles.communityInfoBox}>
              <Text style={styles.communityInfoText}>
                Help fellow wanderkinder by adding useful places to the map. Your contributions appear on the COMMUNITY layer and help others find free camps, private hosts, parking, and more.
              </Text>
            </View>
          )}
          {(Object.entries(COMMUNITY_PIN_CONFIG) as [CommunityPinType, typeof COMMUNITY_PIN_CONFIG[CommunityPinType]][]).map(([type, config]) => (
            <TouchableOpacity
              key={type}
              style={styles.communityMenuItem}
              onPress={() => {
                haptic.selection();
                setShowCommunityFAB(false);
                toast.info(`Tap the map to place your ${config.label}`);
                // Enable community layer automatically when adding
                if (!layers.community) {
                  setLayers(prev => ({ ...prev, community: true }));
                }
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.communityMenuIcon, { backgroundColor: `${config.color}20` }]}>
                <Ionicons name={config.icon as any} size={16} color={config.color} />
              </View>
              <View style={styles.communityMenuInfo}>
                <Text style={styles.communityMenuLabel}>{config.label}</Text>
                <Text style={styles.communityMenuDesc} numberOfLines={1}>{config.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Favorites panel */}
      {showFavorites && (
        <View style={styles.favoritesPanel}>
          <View style={styles.favoritesPanelHeader}>
            <Ionicons name="heart" size={16} color="#E25555" />
            <Text style={styles.favoritesPanelTitle}>Saved Places</Text>
            <TouchableOpacity onPress={() => setShowFavorites(false)}>
              <Ionicons name="close" size={18} color={colors.ink3} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
            {hosts.filter(h => useFavoritesStore.getState().isFavorite(h.id)).length === 0 ? (
              <View style={styles.favoritesEmpty}>
                <Ionicons name="heart-outline" size={28} color={colors.ink3} />
                <Text style={styles.favoritesEmptyText}>No saved places yet</Text>
                <Text style={styles.favoritesEmptyHint}>Tap the heart on any host card to save it here</Text>
              </View>
            ) : (
              hosts.filter(h => useFavoritesStore.getState().isFavorite(h.id)).map(host => (
                <TouchableOpacity
                  key={host.id}
                  style={styles.favoriteItem}
                  onPress={() => {
                    setShowFavorites(false);
                    // Focus map on this host
                    if (Platform.OS === 'web') {
                      const iframe = document.querySelector('iframe');
                      if (iframe?.contentWindow) {
                        iframe.contentWindow.postMessage({
                          type: 'flyTo',
                          lat: host.lat,
                          lng: host.lng,
                          zoom: 14,
                        }, '*');
                      }
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.favoriteItemIcon}>
                    <Ionicons name="home" size={14} color={colors.amber} />
                  </View>
                  <View style={styles.favoriteItemInfo}>
                    <Text style={styles.favoriteItemName} numberOfLines={1}>{host.name}</Text>
                    <Text style={styles.favoriteItemLocation} numberOfLines={1}>
                      {host.address || 'Saved place'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={colors.ink3} />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      )}

      {/* Past Stays panel */}
      {showPastStays && (
        <View style={styles.favoritesPanel}>
          <View style={styles.favoritesPanelHeader}>
            <Ionicons name="home" size={16} color={colors.amber} />
            <Text style={styles.favoritesPanelTitle}>Past Stays</Text>
            <TouchableOpacity onPress={() => setShowPastStays(false)}>
              <Ionicons name="close" size={18} color={colors.ink3} />
            </TouchableOpacity>
          </View>
          <View style={styles.favoritesEmpty}>
            <Ionicons name="bed-outline" size={28} color={colors.ink3} />
            <Text style={styles.favoritesEmptyText}>No past stays yet</Text>
            <Text style={styles.favoritesEmptyHint}>Places you have stayed at will appear here for quick access</Text>
          </View>
        </View>
      )}

      {/* Roof Tonight — emergency accommodation button */}
      <TouchableOpacity
        style={[
          styles.roofTonightBtn,
          !isRoofActive && styles.roofTonightBtnDisabled,
          roofSentCount >= 2 && styles.roofTonightBtnDone,
        ]}
        onPress={handleRoofTonight}
        activeOpacity={isRoofActive ? 0.8 : 1}
      >
        <Ionicons
          name="bed-outline"
          size={18}
          color={isRoofActive ? '#FFFFFF' : colors.ink3}
        />
        <Text style={[
          styles.roofTonightLabel,
          !isRoofActive && styles.roofTonightLabelDisabled,
        ]}>
          {roofSentCount >= 2 ? 'SENT' : 'ROOF'}
        </Text>
      </TouchableOpacity>

      {/* Roof Tonight modal */}
      {showRoofTonight && (
        <View style={styles.roofModal}>
          <View style={styles.roofModalHeader}>
            <Ionicons name="bed" size={24} color={colors.amber} />
            <Text style={styles.roofModalTitle}>Roof Tonight</Text>
            <TouchableOpacity onPress={() => setShowRoofTonight(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={20} color={colors.ink3} />
            </TouchableOpacity>
          </View>

          <Text style={styles.roofModalDesc}>
            {roofSentCount === 0
              ? 'Send a help request to all wanderkinder and hosts within 5 km asking for accommodation tonight.'
              : 'Send an extended request to all wanderkinder and hosts within 10 km radius.'}
          </Text>

          {roofSentCount === 0 && currentHour >= 19 && (
            <Text style={styles.roofModalHint}>
              After this first request, you can send a second at extended 10 km radius.
            </Text>
          )}

          {roofSentCount === 1 && currentHour < 19 && (
            <Text style={styles.roofModalHint}>
              Your second request (10 km) becomes available at 7:00 PM.
            </Text>
          )}

          <View style={styles.roofModalActions}>
            <TouchableOpacity
              style={[
                styles.roofSendBtn,
                (roofSentCount === 1 && currentHour < 19) && styles.roofSendBtnDisabled,
              ]}
              onPress={() => {
                if (roofSentCount === 1 && currentHour < 19) return;
                sendRoofRequest();
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="paper-plane" size={16} color="#FFFFFF" />
              <Text style={styles.roofSendBtnText}>
                {roofSentCount === 0
                  ? 'Send to 5 km'
                  : 'Send to 10 km'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Swipeable Host Cards */}
      {nearbyHosts.length > 0 && (
        <View style={styles.hostCarousel}>
          <FlatList
            ref={hostListRef}
            data={nearbyHosts.slice(0, 50)}
            renderItem={renderHostCard}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={HOST_CARD_WIDTH + 12}
            snapToAlignment="start"
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: 20 }}
            ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            initialNumToRender={3}
            maxToRenderPerBatch={5}
            windowSize={5}
          />
        </View>
      )}
      </View>
    </RouteErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  map: {
    flex: 1,
  },
  mapLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
    zIndex: 5,
  },
  mapLoadingText: {
    fontFamily: 'Courier New',
    fontSize: 12,
    letterSpacing: 1,
    color: colors.ink3,
    fontWeight: '600',
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingTop: 8,
    alignItems: 'center',
    position: 'absolute',
    top: Platform.OS === 'web' ? 8 : 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  filterChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.amber,
    borderColor: colors.amber,
  },
  filterText: {
    fontFamily: 'Courier New',
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.ink2,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Layers panel
  layersPanel: {
    position: 'absolute',
    top: '35%',
    right: 60,
    width: 260,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.md,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.borderLt,
    zIndex: 100,
  },
  layersPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  layersPanelTitle: {
    fontFamily: 'Courier New',
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '700',
    color: colors.ink,
  },
  layerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: spacing.sm,
  },
  layerIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  layerLabel: {
    ...typography.bodySm,
    color: colors.ink,
    fontWeight: '600',
    flex: 1,
  },
  layersLegend: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLt,
  },
  legendTitle: {
    fontFamily: 'Courier New',
    fontSize: 8,
    letterSpacing: 1,
    fontWeight: '600',
    color: colors.ink3,
    marginBottom: 6,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontFamily: 'Courier New',
    fontSize: 8,
    letterSpacing: 0.5,
    fontWeight: '600',
    color: colors.ink3,
  },
  rightActionStrip: {
    position: 'absolute',
    right: 12,
    top: '35%',
    gap: 8,
    zIndex: 20,
  },
  rightActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  leftActionStrip: {
    position: 'absolute',
    left: 12,
    top: '35%',
    gap: 8,
    zIndex: 20,
  },
  leftActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  leftActionBtnActive: {
    borderColor: colors.amber,
    backgroundColor: colors.amberBg,
  },
  locateBtn: {
    position: 'absolute',
    right: 12,
    bottom: Platform.OS === 'ios' ? 210 : Platform.OS === 'web' ? 195 : 195,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
    zIndex: 20,
  },
  communityFab: {
    position: 'absolute',
    right: 12,
    bottom: Platform.OS === 'ios' ? 260 : Platform.OS === 'web' ? 245 : 245,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#C8762A',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
    zIndex: 20,
  },
  communityMenu: {
    position: 'absolute',
    right: 12,
    bottom: Platform.OS === 'ios' ? 316 : Platform.OS === 'web' ? 300 : 300,
    width: 260,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.borderLt,
    zIndex: 100,
  },
  communityMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  communityMenuTitle: {
    ...typography.bodySm,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.ink,
  },
  communityInfoBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  communityInfoText: {
    ...typography.bodySm,
    color: colors.ink2,
    lineHeight: 18,
    fontSize: 11,
  },
  communityMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 8,
  },
  communityMenuIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  communityMenuInfo: {
    flex: 1,
  },
  communityMenuLabel: {
    ...typography.bodySm,
    color: colors.ink,
    fontWeight: '600',
    fontSize: 13,
  },
  communityMenuDesc: {
    ...typography.bodySm,
    color: colors.ink3,
    fontSize: 10,
  },
  favoritesPanel: {
    position: 'absolute',
    left: 64,
    top: '30%',
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.borderLt,
    zIndex: 100,
  },
  favoritesPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
    marginBottom: 8,
  },
  favoritesPanelTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
  },
  favoritesEmpty: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  favoritesEmptyText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink3,
  },
  favoritesEmptyHint: {
    fontSize: 11,
    color: colors.ink3,
    textAlign: 'center',
    maxWidth: 200,
    lineHeight: 16,
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  favoriteItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.amberBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteItemInfo: {
    flex: 1,
  },
  favoriteItemName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink,
  },
  favoriteItemLocation: {
    fontSize: 10,
    color: colors.ink3,
    marginTop: 1,
  },
  // Host card carousel
  hostCarousel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.OS === 'ios' ? 16 : Platform.OS === 'web' ? 8 : 8,
    zIndex: 10,
  },
  hostCard: {
    width: HOST_CARD_WIDTH,
    maxHeight: Math.round(height * 0.28),
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    ...shadows.lg,
  },
  hostCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  hostTypeBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  hostTypeBadgeText: {
    fontFamily: 'Courier New',
    fontSize: 8,
    letterSpacing: 1,
    fontWeight: '700',
  },
  hostCardDistance: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.amber,
    flex: 1,
  },
  hostCardIndex: {
    fontSize: 10,
    color: colors.ink3,
    fontFamily: 'Courier New',
    letterSpacing: 0.5,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  hostCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    flex: 1,
  },
  hostCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  hostCardDetail: {
    fontSize: 12,
    color: colors.ink2,
    flex: 1,
  },
  trustBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  trustBadgeText: {
    fontFamily: 'Courier New',
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  hostContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderLt,
  },
  contactBtnPrimary: {
    backgroundColor: colors.amber,
    borderColor: colors.amber,
  },
  contactBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.ink2,
  },
  expandHint: {
    alignItems: 'center',
    marginTop: 4,
  },
  expandedSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLt,
  },
  expandedDesc: {
    fontSize: 13,
    color: colors.ink2,
    lineHeight: 18,
    marginBottom: 8,
  },
  expandedMeta: {
    gap: 4,
  },
  expandedMetaItem: {
    fontSize: 12,
    color: colors.ink2,
  },
  expandedMetaLabel: {
    fontWeight: '700',
    color: colors.ink,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  amenityPill: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderLt,
  },
  amenityText: {
    fontSize: 10,
    color: colors.ink2,
    fontWeight: '500',
  },
  // Map modes panel
  mapModesPanel: {
    position: 'absolute',
    top: '45%',
    right: 60,
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.md,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.borderLt,
    zIndex: 100,
  },
  mapModesPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
  },
  mapModesPanelTitle: {
    fontFamily: 'Courier New',
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '700',
    color: colors.ink,
  },
  mapModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: spacing.sm,
    borderRadius: 8,
    marginBottom: 4,
  },
  mapModeRowActive: {
    backgroundColor: colors.amberBg,
  },
  mapModeIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(200,118,42,0.06)',
  },
  mapModeInfo: {
    flex: 1,
  },
  mapModeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 2,
  },
  mapModeDescription: {
    fontSize: 10,
    color: colors.ink3,
    fontFamily: 'Courier New',
    letterSpacing: 0.5,
  },
  // Roof Tonight styles
  roofTonightBtn: {
    position: 'absolute',
    left: 12,
    bottom: Platform.OS === 'ios' ? 210 : Platform.OS === 'web' ? 195 : 195,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
    zIndex: 20,
  },
  roofTonightBtnDisabled: {
    backgroundColor: 'rgba(200,200,200,0.7)',
  },
  roofTonightBtnDone: {
    backgroundColor: colors.green,
  },
  roofTonightLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginTop: -2,
  },
  roofTonightLabelDisabled: {
    color: colors.ink3,
  },
  roofModal: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: Platform.OS === 'ios' ? 270 : Platform.OS === 'web' ? 255 : 255,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.lg,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.borderLt,
    zIndex: 100,
  },
  roofModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  roofModalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
  },
  roofModalDesc: {
    fontSize: 14,
    color: colors.ink2,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  roofModalHint: {
    fontSize: 12,
    color: colors.ink3,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  roofModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  roofSendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.amber,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  roofSendBtnDisabled: {
    backgroundColor: colors.border,
  },
  roofSendBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
