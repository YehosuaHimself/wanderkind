import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions, Switch, ScrollView, FlatList, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, shadows, hostTypeConfig } from '../../../src/lib/theme';
import { toast } from '../../../src/lib/toast';
import { supabase } from '../../../src/lib/supabase';
import { Host } from '../../../src/types/database';
import { SEED_HOSTS } from '../../../src/data/seed-hosts';
import { SEED_PROFILES } from '../../../src/data/seed-profiles';
import { useAuthGuard } from '../../../src/hooks/useAuthGuard';

const { width, height } = Dimensions.get('window');

// Default to central Europe
const INITIAL_REGION = {
  latitude: 47.5,
  longitude: 7.5,
  latitudeDelta: 8,
  longitudeDelta: 8,
};

type FilterMode = 'free' | 'donativo' | 'all';

interface LayerState {
  hosts: boolean;
  wanderkinder: boolean;
  ways: boolean;
  wifi: boolean;
  churches: boolean;
  parishes: boolean;
  mountains: boolean;
}

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

// Get walking seed profiles for map markers
const walkingSeedProfiles = SEED_PROFILES.filter(p => p.is_walking && (p as any).lat && (p as any).lng);

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
  hosts, filter, onHostPress, walkers, onWalkerPress, layers
}: {
  hosts: Host[];
  filter: FilterMode;
  onHostPress: (id: string) => void;
  walkers: typeof walkingSeedProfiles;
  onWalkerPress: (id: string) => void;
  layers: LayerState;
}) {
  const iframeRef = useRef<any>(null);

  // Build filtered hosts list
  const filteredHosts = layers.hosts ? hosts.filter(h => {
    if (filter === 'free') return h.host_type === 'free';
    if (filter === 'donativo') return h.host_type === 'free' || h.host_type === 'donativo';
    return true;
  }) : [];

  const visibleWalkers = layers.wanderkinder ? walkers : [];

  // Map host type to marker color
  const getMarkerColor = (type: string): string => {
    const config = hostTypeConfig[type as keyof typeof hostTypeConfig];
    if (!config) return colors.ink3;
    return config.color;
  };

  const markerColorMap: Record<string, string> = {};
  filteredHosts.forEach(h => {
    markerColorMap[h.id] = getMarkerColor(h.host_type);
  });

  // Build HTML with Leaflet map
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
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
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map').setView([47.5, 7.5], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '\\u00a9 OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // === HOSTS ===
    var hosts = ${JSON.stringify(filteredHosts)};
    var markerColorMap = ${JSON.stringify(markerColorMap)};
    hosts.forEach(function(host) {
      var mc = markerColorMap[host.id] || '#999';
      L.circleMarker([host.lat, host.lng], {
        radius: 7, fillColor: mc, color: '#fff', weight: 2, opacity: 1, fillOpacity: 0.85
      })
      .bindPopup('<div style="font-size:12px;text-align:center;"><strong>' + host.name + '</strong><br/><span style="color:' + mc + ';font-size:10px;text-transform:uppercase;">' + host.host_type + '</span></div>')
      .on('click', function() {
        window.parent.postMessage({ type: 'host-click', hostId: host.id }, '*');
      })
      .addTo(map);
    });

    // === WANDERKINDER (orange circle with rotating W in Helvetica Neue) ===
    var walkers = ${JSON.stringify(visibleWalkers)};
    walkers.forEach(function(w) {
      var isWalking = w.is_walking;
      var walkClass = isWalking ? ' wk-walking' : '';
      var icon = L.divIcon({
        className: '',
        html: '<div class="wk-icon' + walkClass + '" style="width:32px;height:32px;background:#C8762A;border:2.5px solid #fff;position:relative;perspective:200px;">'
          + '<span class="wk-w" style="color:#fff;font-weight:800;font-size:15px;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;letter-spacing:-0.5px;text-transform:uppercase;">W</span>'
          + '</div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      var marker = L.marker([w.lat, w.lng], { icon: icon })
        .bindPopup('<div style="font-size:12px;text-align:center;"><strong>' + w.trail_name + '</strong><br/><span style="color:#C8762A;font-size:10px;">' + (isWalking ? 'Currently walking' : 'Wanderkind') + '</span></div>')
        .on('click', function() {
          window.parent.postMessage({ type: 'walker-click', profileId: w.id }, '*');
        })
        .addTo(map);

      // Simulate realistic walking movement for actively walking users (~5km/h ≈ 0.00001° per update)
      if (isWalking) {
        var baseLat = w.lat;
        var baseLng = w.lng;
        var walkAngle = Math.random() * Math.PI * 2;
        var walkStep = 0;
        var walkInterval = setInterval(function() {
          walkStep++;
          var drift = 0.00003 * walkStep;
          var newLat = baseLat + Math.sin(walkAngle) * drift + (Math.random() - 0.5) * 0.00005;
          var newLng = baseLng + Math.cos(walkAngle) * drift + (Math.random() - 0.5) * 0.00005;
          marker.setLatLng([newLat, newLng]);
          // Occasionally shift direction slightly (simulating path curves)
          if (walkStep % 10 === 0) walkAngle += (Math.random() - 0.5) * 0.3;
          // Reset after 100 steps to prevent drift too far from origin
          if (walkStep > 100) { walkStep = 0; baseLat = newLat; baseLng = newLng; }
        }, 4000);
        // Store for cleanup
        if (!window._wkWalkIntervals) window._wkWalkIntervals = [];
        window._wkWalkIntervals.push(walkInterval);
      }
    });

    // === POI: PARISHES (Pfarreien) ===
    var parishes = ${layers.parishes ? JSON.stringify(POI_DATA.parishes) : '[]'};
    parishes.forEach(function(p) {
      var icon = L.divIcon({
        className: '',
        html: '<div class="poi-icon" style="background:#6B21A8;color:#fff;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"/></svg></div>',
        iconSize: [24, 24], iconAnchor: [12, 12]
      });
      L.marker([p.lat, p.lng], { icon: icon })
        .bindPopup('<div style="font-size:12px;text-align:center;"><strong>' + p.name + '</strong><br/><span style="color:#6B21A8;font-size:10px;">Parish (Pfarrei)</span></div>')
        .addTo(map);
    });

    // === POI: CHURCHES ===
    var churches = ${layers.churches ? JSON.stringify(POI_DATA.churches) : '[]'};
    churches.forEach(function(c) {
      var icon = L.divIcon({
        className: '',
        html: '<div class="poi-icon" style="background:#8B4513;color:#fff;">\\u271D</div>',
        iconSize: [24, 24], iconAnchor: [12, 12]
      });
      L.marker([c.lat, c.lng], { icon: icon })
        .bindPopup('<div style="font-size:12px;text-align:center;"><strong>' + c.name + '</strong><br/><span style="color:#8B4513;font-size:10px;">Church</span></div>')
        .addTo(map);
    });

    // === POI: WIFI ===
    var wifis = ${layers.wifi ? JSON.stringify(POI_DATA.wifi) : '[]'};
    wifis.forEach(function(w) {
      var icon = L.divIcon({
        className: '',
        html: '<div class="poi-icon" style="background:#0ea5e9;color:#fff;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="white"/></svg></div>',
        iconSize: [24, 24], iconAnchor: [12, 12]
      });
      L.marker([w.lat, w.lng], { icon: icon })
        .bindPopup('<div style="font-size:12px;text-align:center;"><strong>' + w.name + '</strong><br/><span style="color:#0ea5e9;font-size:10px;">Free WiFi</span></div>')
        .addTo(map);
    });

    // === POI: MOUNTAINS ===
    var mountains = ${layers.mountains ? JSON.stringify(POI_DATA.mountains) : '[]'};
    mountains.forEach(function(m) {
      var icon = L.divIcon({
        className: '',
        html: '<div class="poi-icon" style="background:#6B7280;color:#fff;"><svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M12 2L2 22h20L12 2zm0 4l7 14H5l7-14z"/></svg></div>',
        iconSize: [24, 24], iconAnchor: [12, 12]
      });
      L.marker([m.lat, m.lng], { icon: icon })
        .bindPopup('<div style="font-size:12px;text-align:center;"><strong>' + m.name + '</strong><br/><span style="color:#6B7280;font-size:10px;">Mountain</span></div>')
        .addTo(map);
    });

    // === ROUTE POLYLINES (The Ways) ===
    var routes = ${layers.ways ? JSON.stringify(ROUTE_LINES) : '[]'};
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
      .addTo(map);
    });

    // Handle messages from parent
    window.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'center-on-location') {
        map.setView([event.data.lat, event.data.lng], 10, { animate: true, duration: 1 });
      }
    });
  </script>
</body>
</html>`;

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'host-click') onHostPress(event.data.hostId);
      if (event.data?.type === 'walker-click') onWalkerPress(event.data.profileId);
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onHostPress, onWalkerPress]);

  return (
    <View style={styles.map}>
      {Platform.OS === 'web' && (
        // @ts-ignore — key forces re-mount when layers change
        <iframe
          ref={iframeRef}
          key={`map-${layers.hosts}-${layers.wanderkinder}-${layers.ways}-${layers.wifi}-${layers.churches}-${layers.parishes}-${layers.mountains}-${filter}`}
          srcDoc={html}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: 'none', width: '100%', height: '100%' }}
          sandbox="allow-scripts allow-same-origin"
        />
      )}
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
          onPress={() => onToggle(key)}
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
  const mapRef = useRef<any>(null);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [nearbyHosts, setNearbyHosts] = useState<Host[]>([]);
  const [activeHostIndex, setActiveHostIndex] = useState(0);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [showLayers, setShowLayers] = useState(false);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [liveWalkers, setLiveWalkers] = useState<typeof walkingSeedProfiles>([]);
  const hostListRef = useRef<FlatList>(null);
  const [layers, setLayers] = useState<LayerState>({
    hosts: true,
    wanderkinder: true,
    ways: true,
    wifi: false,
    churches: false,
    parishes: false,
    mountains: false,
  });

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
      } catch {}
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
    const filtered = sorted.filter(h => {
      if (filter === 'free') return h.host_type === 'free';
      if (filter === 'donativo') return h.host_type === 'free' || h.host_type === 'donativo';
      return true;
    });
    setNearbyHosts(filtered);
    setActiveHostIndex(0);
    setExpandedCardId(null);
  }, [hosts, userLat, userLng, filter]);

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

      // Fallback to seed data
      setHosts(SEED_HOSTS as unknown as Host[]);
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
      const host = viewableItems[0].item as Host;
      if (host) {
        // Center map
        if (Platform.OS === 'web') {
          const iframe = document.querySelector('iframe');
          iframe?.contentWindow?.postMessage({
            type: 'center-on-location',
            lat: host.lat,
            lng: host.lng,
          }, '*');
        }
      }
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

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
              lng: longitude
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
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        }, 800);
      }
    } catch {}
  };

  // Format distance for display
  const formatDistance = (host: Host): string => {
    if (userLat != null && userLng != null) {
      const d = haversineKm(userLat, userLng, host.lat, host.lng);
      if (d < 1) return `${Math.round(d * 1000)} m`;
      if (d < 100) return `${d.toFixed(1)} km`;
      return `${Math.round(d)} km`;
    }
    if (host.route_km) return `km ${host.route_km}`;
    return 'Nearby';
  };

  // Render a single host card
  const renderHostCard = useCallback(({ item, index }: { item: Host; index: number }) => {
    const config = hostTypeConfig[item.host_type as keyof typeof hostTypeConfig];
    const isExpanded = expandedCardId === item.id;
    const dist = formatDistance(item);

    return (
      <TouchableOpacity
        style={styles.hostCard}
        activeOpacity={0.95}
        onPress={() => setExpandedCardId(isExpanded ? null : item.id)}
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

        {/* Name */}
        <Text style={styles.hostCardName} numberOfLines={isExpanded ? 3 : 1}>{item.name}</Text>

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
          <TouchableOpacity
            style={[styles.contactBtn, styles.contactBtnPrimary]}
            onPress={() => router.push(`/(tabs)/map/host/${item.id}`)}
          >
            <Ionicons name="open-outline" size={14} color="#FFF" />
            <Text style={[styles.contactBtnText, { color: '#FFF' }]}>Details</Text>
          </TouchableOpacity>
        </View>

        {/* Expanded section */}
        {isExpanded && (
          <View style={styles.expandedSection}>
            {item.description ? (
              <Text style={styles.expandedDesc}>{item.description}</Text>
            ) : null}
            <View style={styles.expandedMeta}>
              <Text style={styles.expandedMetaItem}>
                <Text style={styles.expandedMetaLabel}>Hosted: </Text>
                {item.total_hosted?.toLocaleString() ?? '—'} wanderkinder
              </Text>
              {(item as any).country && (
                <Text style={styles.expandedMetaItem}>
                  <Text style={styles.expandedMetaLabel}>Country: </Text>
                  {(item as any).country}
                </Text>
              )}
              {item.route_km != null && (
                <Text style={styles.expandedMetaItem}>
                  <Text style={styles.expandedMetaLabel}>Route km: </Text>
                  {item.route_km}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Expand hint */}
        <View style={styles.expandHint}>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={colors.ink3}
          />
        </View>
      </TouchableOpacity>
    );
  }, [expandedCardId, nearbyHosts.length, userLat, userLng, router, centerMapOnHost]);

  return (
    <View style={styles.container}>
      {/* Map */}
      {Platform.OS === 'web' ? (
        <WebMapComponent
          hosts={hosts}
          filter={filter}
          onHostPress={handleHostPress}
          walkers={[...walkingSeedProfiles, ...liveWalkers.filter(lw => !walkingSeedProfiles.some(sp => sp.id === lw.id))]}
          onWalkerPress={(profileId) => router.push(`/(tabs)/me/profile/${profileId}`)}
          layers={layers}
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

      {/* Top controls */}
      <SafeAreaView style={styles.topOverlay} edges={['top']}>
        <View style={styles.filterRow}>
          {(['free', 'donativo', 'all'] as FilterMode[]).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'free' ? 'FREE STAYS' : f === 'donativo' ? 'PAY WHAT YOU CAN' : 'ALL HOSTS'}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowLayers(!showLayers)}
          >
            <Ionicons name="layers" size={18} color={colors.amber} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Layers panel */}
      {showLayers && (
        <LayersPanel
          layers={layers}
          onToggle={toggleLayer}
          onClose={() => setShowLayers(false)}
        />
      )}

      {/* My location button */}
      <TouchableOpacity
        style={styles.locationButton}
        onPress={handleLocationPress}
      >
        <Ionicons name="locate" size={20} color={colors.amber} />
      </TouchableOpacity>

      {/* Swipeable Host Cards */}
      {nearbyHosts.length > 0 && (
        <View style={styles.hostCarousel}>
          <FlatList
            ref={hostListRef}
            data={nearbyHosts.slice(0, 50)}
            renderItem={renderHostCard}
            keyExtractor={item => item.id}
            horizontal
            pagingEnabled
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
    fontSize: 9,
    letterSpacing: 1,
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
    marginLeft: 'auto',
  },
  // Layers panel
  layersPanel: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 56 : 100,
    right: spacing.md,
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
  locationButton: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 220,
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
  hostCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 6,
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
});
