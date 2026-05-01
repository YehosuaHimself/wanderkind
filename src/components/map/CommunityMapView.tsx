import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { colors, spacing, typography } from '../../lib/theme';
import { haptic } from '../../lib/haptics';
import { useAuth } from '../../stores/auth';

// ─── Types ─────────────────────────────────────────────────────────────────

interface CommunityMember {
  id: string;
  trail_name: string;
  avatar_url: string | null;
  tier: string;
  is_hosting: boolean;
  hosting_project_title: string | null;
  lat: number;
  lng: number;
  // fuzzy offset applied client-side (deterministic per id)
  fuzzy_lat?: number;
  fuzzy_lng?: number;
}

// ─── Fuzzy location ────────────────────────────────────────────────────────
// Deterministic ±500m offset from user ID — stable across renders,
// unique per user, never reveals real GPS position.
function fuzzyOffset(userId: string): [number, number] {
  let h = 2166136261;
  for (let i = 0; i < userId.length; i++) {
    h ^= userId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // ±0.0045° ≈ ±500m at mid-latitudes
  const dlat = ((h & 0xFFF) / 0xFFF - 0.5) * 0.009;
  const dlng = (((h >> 12) & 0xFFF) / 0xFFF - 0.5) * 0.009;
  return [dlat, dlng];
}

function applyFuzzy(m: CommunityMember): CommunityMember {
  const [dlat, dlng] = fuzzyOffset(m.id);
  return { ...m, fuzzy_lat: m.lat + dlat, fuzzy_lng: m.lng + dlng };
}

// ─── Web map (Leaflet iframe) ───────────────────────────────────────────────

function buildMapHTML(members: CommunityMember[], selfId?: string): string {
  const membersJson = JSON.stringify(members.map(m => ({
    id: m.id,
    name: m.trail_name,
    lat: m.fuzzy_lat ?? m.lat,
    lng: m.fuzzy_lng ?? m.lng,
    isHost: m.is_hosting,
    title: m.hosting_project_title,
    isSelf: m.id === selfId,
    tier: m.tier,
  })));

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#FAFAF5}
    #map{width:100%;height:100vh}
    .leaflet-container{background:#FAFAF5}
    .leaflet-control-attribution{font-size:7px!important;opacity:0.4;background:transparent!important}
    .leaflet-control-attribution a{color:#9A8B73!important}
    /* W-marker */
    .wk-pin{
      display:flex;align-items:center;justify-content:center;
      border-radius:50%;
      font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;
      font-weight:900;font-size:11px;
      box-shadow:0 2px 8px rgba(26,18,10,0.18);
      border:2px solid rgba(255,255,255,0.7);
    }
    .wk-pin-host{background:#C8762A;color:#FAF6EF}
    .wk-pin-walker{background:#FAF6EF;color:#C8762A;border-color:#C8762A}
    .wk-pin-self{background:#1A120A;color:#FAF6EF;border-color:#C8762A}
    @keyframes wk-pulse{
      0%{box-shadow:0 0 0 0 rgba(200,118,42,0.4)}
      70%{box-shadow:0 0 0 10px rgba(200,118,42,0)}
      100%{box-shadow:0 0 0 0 rgba(200,118,42,0)}
    }
    .wk-pin-host{animation:wk-pulse 2.4s ease-out infinite}
    /* Popup */
    .leaflet-popup-content-wrapper{
      background:#FAF6EF;border:1px solid rgba(200,118,42,0.2);
      border-radius:10px;box-shadow:0 4px 16px rgba(26,18,10,0.12);
    }
    .leaflet-popup-tip{background:#FAF6EF}
    .leaflet-popup-content{margin:10px 14px;min-width:140px}
    .pop-name{font-family:'Helvetica Neue',Helvetica,sans-serif;font-weight:700;font-size:14px;color:#1A120A;margin-bottom:2px}
    .pop-label{font-family:'Courier New',monospace;font-size:9px;letter-spacing:2px;color:#C8762A;text-transform:uppercase;margin-bottom:6px}
    .pop-title{font-size:12px;color:#6B5A3E;line-height:1.4;margin-bottom:8px}
    .pop-btn{
      display:inline-block;padding:6px 14px;background:#C8762A;color:#FAF6EF;
      border-radius:20px;font-size:11px;font-weight:600;letter-spacing:0.5px;
      cursor:pointer;border:none;font-family:'Helvetica Neue',sans-serif;
    }
    .pop-self{font-size:12px;color:#9A8B73;font-style:italic}
    /* Fuzzy radius ring */
    .leaflet-interactive.fuzz-ring{opacity:0.08;pointer-events:none}
  </style>
</head>
<body>
<div id="map"></div>
<script>
var map = L.map('map',{
  zoomControl:false,
  attributionControl:true,
});

// Parchment-warm CartoDB tiles
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{
  attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  subdomains:'abcd',
  maxZoom:19,
}).addTo(map);

L.control.zoom({position:'bottomright'}).addTo(map);

var members = ${membersJson};
var markers = L.layerGroup().addTo(map);
var bounds = [];

members.forEach(function(m){
  var isSelf = m.isSelf;
  var isHost = m.isHost && !isSelf;
  var cls = isSelf ? 'wk-pin wk-pin-self' : (isHost ? 'wk-pin wk-pin-host' : 'wk-pin wk-pin-walker');
  var size = isSelf ? 34 : 30;

  var icon = L.divIcon({
    className:'',
    html:'<div class="'+cls+'" style="width:'+size+'px;height:'+size+'px">W</div>',
    iconSize:[size,size],
    iconAnchor:[size/2,size/2],
    popupAnchor:[0,-(size/2+4)],
  });

  var marker = L.marker([m.lat,m.lng],{icon:icon,title:m.name});

  // Fuzzy radius ring (500m circle)
  if(!isSelf){
    L.circle([m.lat,m.lng],{
      radius:500,
      color:'#C8762A',
      fillColor:'#C8762A',
      fillOpacity:0.06,
      weight:1,
      opacity:0.15,
      interactive:false,
      className:'fuzz-ring',
    }).addTo(markers);
  }

  var popContent = isSelf
    ? '<div class="pop-name">'+m.name+'</div><p class="pop-self">Your fuzzy location</p>'
    : '<div class="pop-name">'+m.name+'</div>'
      +(isHost ? '<div class="pop-label">— WANDERHOST —</div>' : '<div class="pop-label">— WANDERKIND —</div>')
      +(m.title ? '<div class="pop-title">'+m.title+'</div>' : '')
      +'<button class="pop-btn" onclick="window.parent.postMessage({type:\\'member-tap\\',id:\\''+m.id+'\\'},'*')">Open Profile</button>';

  marker.bindPopup(popContent,{maxWidth:220});
  marker.on('click',function(){ window.parent.postMessage({type:'marker-tap',id:m.id},'*'); });
  markers.addLayer(marker);
  bounds.push([m.lat,m.lng]);
});

if(bounds.length>0){
  map.fitBounds(bounds,{padding:[40,40],maxZoom:10});
} else {
  map.setView([46.5,8.0],5);
}

window.addEventListener('message',function(e){
  if(!e.data) return;
  if(e.data.type==='locate'){
    map.setView([e.data.lat,e.data.lng],13,{animate:true});
  }
  if(e.data.type==='update-members'){
    members = e.data.members;
    markers.clearLayers();
    // re-render (same logic)
    members.forEach(function(m){
      var isSelf=m.isSelf,isHost=m.isHost&&!isSelf;
      var cls=isSelf?'wk-pin wk-pin-self':(isHost?'wk-pin wk-pin-host':'wk-pin wk-pin-walker');
      var size=isSelf?34:30;
      var icon=L.divIcon({className:'',html:'<div class="'+cls+'" style="width:'+size+'px;height:'+size+'px">W</div>',iconSize:[size,size],iconAnchor:[size/2,size/2],popupAnchor:[0,-(size/2+4)]});
      var mk=L.marker([m.lat,m.lng],{icon:icon,title:m.name});
      if(!isSelf){L.circle([m.lat,m.lng],{radius:500,color:'#C8762A',fillColor:'#C8762A',fillOpacity:0.06,weight:1,opacity:0.15,interactive:false}).addTo(markers);}
      mk.bindPopup(m.isSelf?'<div class="pop-name">'+m.name+'</div><p class="pop-self">Your fuzzy location</p>':'<div class="pop-name">'+m.name+'</div>'+(m.isHost?'<div class="pop-label">— WANDERHOST —</div>':'<div class="pop-label">— WANDERKIND —</div>')+(m.title?'<div class="pop-title">'+m.title+'</div>':'')+'<button class="pop-btn" onclick="window.parent.postMessage({type:\\'member-tap\\',id:\\''+m.id+'\\'},'*')">Open Profile</button>',{maxWidth:220});
      mk.on('click',function(){window.parent.postMessage({type:'marker-tap',id:m.id},'*');});
      markers.addLayer(mk);
    });
  }
});

// Tell RN the map is ready
window.parent.postMessage({type:'map-ready'},'*');
<\/script>
</body>
</html>`;
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function CommunityMapView() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [count, setCount] = useState(0);
  const mapHTML = useRef<string>('');

  // ── Fetch visible Wanderkinder ─────────────────────────────────────────
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('profiles')
        .select('id,trail_name,avatar_url,tier,is_hosting,hosting_project_title,lat,lng')
        .eq('verification_level', 'biometric')   // biometric gate
        .eq('is_walking', false)                  // not currently walking
        .eq('show_on_map', true)                  // opted in
        .eq('show_profile_public', true)
        .not('lat', 'is', null)
        .not('lng', 'is', null)
        .or(`hosting_snoozed.eq.false,hosting_snoozed_until.lt.${now}`);  // not snoozed

      if (error) throw error;

      const fuzzy = (data ?? []).map(applyFuzzy);
      setMembers(fuzzy);
      setCount(fuzzy.length);

      // Push update to iframe if already mounted
      if (mapReady && iframeRef.current?.contentWindow) {
        const payload = fuzzy.map(m => ({
          id: m.id, name: m.trail_name,
          lat: m.fuzzy_lat!, lng: m.fuzzy_lng!,
          isHost: m.is_hosting, title: m.hosting_project_title,
          isSelf: m.id === user?.id, tier: m.tier,
        }));
        iframeRef.current.contentWindow.postMessage({ type: 'update-members', members: payload }, '*');
      }
    } catch (e) {
      // On error keep whatever we had
    } finally {
      setLoading(false);
    }
  }, [mapReady, user?.id]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  // ── Listen for iframe messages ────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = (e: MessageEvent) => {
      if (!e.data?.type) return;
      if (e.data.type === 'map-ready') {
        setMapReady(true);
      }
      if (e.data.type === 'member-tap' || e.data.type === 'marker-tap') {
        haptic.light();
        router.push(`/profile/${e.data.id}` as any);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [router]);

  // ── Build HTML once members loaded ────────────────────────────────────
  useEffect(() => {
    if (members.length > 0 || !loading) {
      mapHTML.current = buildMapHTML(members, user?.id);
    }
  }, [members, loading, user?.id]);

  // ── Locate self ───────────────────────────────────────────────────────
  const locateSelf = useCallback(() => {
    haptic.light();
    if (!iframeRef.current?.contentWindow) return;
    if (Platform.OS === 'web' && navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        iframeRef.current?.contentWindow?.postMessage({
          type: 'locate',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }, '*');
      });
    }
  }, []);

  // ── Web render ────────────────────────────────────────────────────────
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        {/* Status bar */}
        <View style={styles.statusBar}>
          <View style={styles.statusLeft}>
            <View style={styles.statusDot} />
            <Text style={styles.statusLabel}>
              {loading ? 'LOADING…' : `${count} WANDERKIND${count !== 1 ? 'ER' : ''} NEARBY`}
            </Text>
          </View>
          <View style={styles.statusRight}>
            <TouchableOpacity style={styles.iconBtn} onPress={locateSelf} activeOpacity={0.7}>
              <Ionicons name="locate-outline" size={18} color={colors.ink2} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={fetchMembers} activeOpacity={0.7}>
              <Ionicons name="refresh-outline" size={18} color={colors.ink2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Map iframe */}
        <View style={styles.mapWrap}>
          {loading && (
            <View style={styles.loadOverlay}>
              <ActivityIndicator size="small" color={colors.amber} />
              <Text style={styles.loadText}>Finding Wanderkinder…</Text>
            </View>
          )}
          <iframe
            ref={iframeRef}
            srcDoc={mapHTML.current || buildMapHTML([], user?.id)}
            style={{ width: '100%', height: '100%', border: 'none' } as any}
            sandbox="allow-scripts allow-same-origin"
            title="Wanderkind Community Map"
          />
        </View>

        {/* Privacy note */}
        <View style={styles.privacyBar}>
          <Ionicons name="shield-checkmark-outline" size={12} color={colors.ink3} />
          <Text style={styles.privacyText}>Locations are approximate · 500m radius · Exact address only after acceptance</Text>
        </View>
      </View>
    );
  }

  // ── Native placeholder (react-native-maps in US-02b) ──────────────────
  return (
    <View style={[styles.container, styles.nativePlaceholder]}>
      <Ionicons name="map-outline" size={48} color={colors.amberLine} />
      <Text style={styles.nativeTitle}>Community Map</Text>
      <Text style={styles.nativeMsg}>
        {count > 0
          ? `${count} Wanderkinder visible nearby`
          : 'No Wanderkinder visible right now'}
      </Text>
      <Text style={[styles.nativeMsg, { fontSize: 12, marginTop: 4 }]}>
        Native map coming in next build
      </Text>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLt,
    backgroundColor: colors.bg,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: colors.amber,
  },
  statusLabel: {
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
    fontSize: 10,
    letterSpacing: 2,
    color: colors.amber,
    fontWeight: '600',
  },
  statusRight: { flexDirection: 'row', gap: 4 },
  iconBtn: {
    width: 34, height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 17,
  },

  mapWrap: { flex: 1, position: 'relative' },

  loadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    gap: 10,
  },
  loadText: {
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.ink2,
  },

  privacyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: colors.borderLt,
    backgroundColor: colors.bg,
  },
  privacyText: {
    fontSize: 10,
    color: colors.ink3,
    letterSpacing: 0.2,
  },

  nativePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 48,
  },
  nativeTitle: { ...typography.h3, color: colors.ink, textAlign: 'center' },
  nativeMsg: { ...typography.bodySm, color: colors.ink2, textAlign: 'center' },
});
