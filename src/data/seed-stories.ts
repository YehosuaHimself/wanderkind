// Seed stories for Wanderkind - Stories feature (24-hour ephemeral content)
// Stories are shared moments from walkers on their journeys
// Each story expires 11 hours 11 minutes after creation

import { SEED_PROFILES } from './seed-profiles';

// Helper to add 11 hours 11 minutes to a timestamp
function addStoryExpiry(createdAt: string): string {
  const date = new Date(createdAt);
  date.setHours(date.getHours() + 11);
  date.setMinutes(date.getMinutes() + 11);
  return date.toISOString();
}

// Helper to get profile by ID
function getProfileById(id: string) {
  return SEED_PROFILES.find((p) => p.id === id);
}

// Stories created in the last 10 hours - recent timestamps
const now = new Date('2026-04-25T18:00:00Z');

// Generate timestamp helper — hours ago from now
function hoursAgo(h: number): Date {
  return new Date(now.getTime() - h * 60 * 60 * 1000);
}

const storyTimestamps = [
  hoursAgo(0),      // 0: now
  hoursAgo(0.75),   // 1: 45 min ago
  hoursAgo(1.5),    // 2: 1.5h ago
  hoursAgo(2),      // 3: 2h ago
  hoursAgo(2.75),   // 4: 2h 45min ago
  hoursAgo(3.5),    // 5: 3.5h ago
  hoursAgo(4.25),   // 6: 4.25h ago
  hoursAgo(5),      // 7: 5h ago
  hoursAgo(6.33),   // 8: 6.33h ago
  hoursAgo(7),      // 9: 7h ago
  hoursAgo(8.5),    // 10: 8.5h ago
  hoursAgo(9.5),    // 11: 9.5h ago
  hoursAgo(0.25),   // 12: 15 min ago
  hoursAgo(1),      // 13: 1h ago
  hoursAgo(1.75),   // 14: 1h 45min ago
  hoursAgo(3),      // 15: 3h ago
  hoursAgo(4.75),   // 16: 4h 45min ago
  hoursAgo(5.5),    // 17: 5.5h ago
  hoursAgo(6),      // 18: 6h ago
  hoursAgo(7.5),    // 19: 7.5h ago
  hoursAgo(8),      // 20: 8h ago
  hoursAgo(9),      // 21: 9h ago
  hoursAgo(10),     // 22: 10h ago
  hoursAgo(10.5),   // 23: 10.5h ago
  // New timestamps for stories 25-36
  hoursAgo(0.1),    // 24: 6 min ago
  hoursAgo(0.5),    // 25: 30 min ago
  hoursAgo(1.25),   // 26: 1h 15min ago
  hoursAgo(2.25),   // 27: 2h 15min ago
  hoursAgo(3.25),   // 28: 3h 15min ago
  hoursAgo(4.5),    // 29: 4.5h ago
  hoursAgo(5.75),   // 30: 5h 45min ago
  hoursAgo(6.5),    // 31: 6.5h ago
  hoursAgo(7.25),   // 32: 7h 15min ago
  hoursAgo(8.25),   // 33: 8h 15min ago
  hoursAgo(9.25),   // 34: 9h 15min ago
  hoursAgo(10.25),  // 35: 10h 15min ago
];

export const SEED_STORIES = [
  {
    id: 'story-001',
    author_id: 'p-001',
    author: getProfileById('p-001'),
    photo_url:
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Golden hour on the trail. The path stretches endlessly, and so does hope.',
    location_name: 'Camino Francés - Aquitaine',
    lat: 43.187,
    lng: -1.614,
    created_at: storyTimestamps[0].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[0].toISOString()),
  },
  {
    id: 'story-002',
    author_id: 'p-002',
    author: getProfileById('p-002'),
    photo_url:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: null,
    location_name: 'Near León, Spain',
    lat: 42.556,
    lng: -0.791,
    created_at: storyTimestamps[1].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[1].toISOString()),
  },
  {
    id: 'story-003',
    author_id: 'p-003',
    author: getProfileById('p-003'),
    photo_url:
      'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Sunrise therapy. Better than any medicine. Ready for another 25km today.',
    location_name: 'Rioja region',
    lat: 42.238,
    lng: -1.628,
    created_at: storyTimestamps[2].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[2].toISOString()),
  },
  {
    id: 'story-004',
    author_id: 'p-004',
    author: getProfileById('p-004'),
    photo_url:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Cathedral bells ringing across the valley. Pure magic.',
    location_name: 'Pamplona',
    lat: 42.812,
    lng: -1.646,
    created_at: storyTimestamps[3].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[3].toISOString()),
  },
  {
    id: 'story-005',
    author_id: 'p-005',
    author: getProfileById('p-005'),
    photo_url:
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Mountain air hits different. My lungs are singing. Days like this remind me why I left the city.',
    location_name: 'Pyrenees foothills',
    lat: 43.002,
    lng: -0.348,
    created_at: storyTimestamps[4].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[4].toISOString()),
  },
  {
    id: 'story-006',
    author_id: 'p-008',
    author: getProfileById('p-008'),
    photo_url:
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: null,
    location_name: 'Burgos province',
    lat: 42.345,
    lng: -3.695,
    created_at: storyTimestamps[5].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[5].toISOString()),
  },
  {
    id: 'story-007',
    author_id: 'p-010',
    author: getProfileById('p-010'),
    photo_url:
      'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Found a walker with stories older than time itself. Sitting here for three hours. This is what it means to walk slowly.',
    location_name: 'Small village near Castrojeriz',
    lat: 42.243,
    lng: -3.822,
    created_at: storyTimestamps[6].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[6].toISOString()),
  },
  {
    id: 'story-008',
    author_id: 'p-012',
    author: getProfileById('p-012'),
    photo_url:
      'https://images.unsplash.com/photo-1428908728789-d2de25dbd4e2?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Rain on the trail is different. Feels like blessing, not curse.',
    location_name: 'Entre Castilla y León',
    lat: 41.989,
    lng: -4.256,
    created_at: storyTimestamps[7].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[7].toISOString()),
  },
  {
    id: 'story-009',
    author_id: 'p-015',
    author: getProfileById('p-015'),
    photo_url:
      'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: null,
    location_name: 'Valladolid',
    lat: 41.652,
    lng: -4.724,
    created_at: storyTimestamps[8].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[8].toISOString()),
  },
  {
    id: 'story-010',
    author_id: 'p-018',
    author: getProfileById('p-018'),
    photo_url:
      'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Just finished the hardest day. Feet are screaming but my heart is flying. Almost there.',
    location_name: 'Approaching Galicia',
    lat: 42.445,
    lng: -7.267,
    created_at: storyTimestamps[9].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[9].toISOString()),
  },
  {
    id: 'story-011',
    author_id: 'p-020',
    author: getProfileById('p-020'),
    photo_url:
      'https://images.unsplash.com/photo-1533240332313-0db49b459ad6?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Standing in the footsteps of hundreds of thousands. Humbling. Transformative. Worth every blister.',
    location_name: 'Rural Galicia',
    lat: 42.632,
    lng: -8.382,
    created_at: storyTimestamps[10].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[10].toISOString()),
  },
  {
    id: 'story-012',
    author_id: 'p-023',
    author: getProfileById('p-023'),
    photo_url:
      'https://images.unsplash.com/photo-1543076499-a6133cb932fd?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'The cathedral. Finally. After 784km, I can see it. Tears, joy, exhaustion. All of it.',
    location_name: 'Santiago de Compostela',
    lat: 42.880,
    lng: -8.545,
    created_at: storyTimestamps[11].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[11].toISOString()),
  },
  {
    id: 'story-013',
    author_id: 'p-006',
    author: getProfileById('p-006'),
    photo_url:
      'https://images.unsplash.com/photo-1533240332313-0db49b459ad6?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Year two on the road. Every village has a different bread. Today: sourdough from a 90-year-old baker.',
    location_name: 'Camino Portugues, Tui',
    lat: 42.046,
    lng: -8.643,
    created_at: storyTimestamps[12].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[12].toISOString()),
  },
  {
    id: 'story-014',
    author_id: 'p-007',
    author: getProfileById('p-007'),
    photo_url:
      'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Hosted three wanderkinder tonight. The kitchen smells like home. Their stories fill the room.',
    location_name: 'Black Forest, Germany',
    lat: 48.030,
    lng: 8.210,
    created_at: storyTimestamps[13].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[13].toISOString()),
  },
  {
    id: 'story-015',
    author_id: 'p-009',
    author: getProfileById('p-009'),
    photo_url:
      'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: null,
    location_name: 'Finisterre coastline',
    lat: 42.906,
    lng: -9.263,
    created_at: storyTimestamps[14].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[14].toISOString()),
  },
  {
    id: 'story-016',
    author_id: 'p-011',
    author: getProfileById('p-011'),
    photo_url:
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Stars above the Meseta. No light pollution for 50km in any direction. Just me and the universe.',
    location_name: 'Meseta Central',
    lat: 42.100,
    lng: -4.520,
    created_at: storyTimestamps[15].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[15].toISOString()),
  },
  {
    id: 'story-017',
    author_id: 'p-013',
    author: getProfileById('p-013'),
    photo_url:
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Morning fog lifting over the vineyard paths. This is why I wake up at 5am.',
    location_name: 'La Rioja wine country',
    lat: 42.450,
    lng: -2.450,
    created_at: storyTimestamps[16].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[16].toISOString()),
  },
  {
    id: 'story-018',
    author_id: 'p-014',
    author: getProfileById('p-014'),
    photo_url:
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Wild camping under ancient oaks. The ground is hard but the soul is soft.',
    location_name: 'Near Sahagún',
    lat: 42.370,
    lng: -5.030,
    created_at: storyTimestamps[17].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[17].toISOString()),
  },
  {
    id: 'story-019',
    author_id: 'p-016',
    author: getProfileById('p-016'),
    photo_url:
      'https://images.unsplash.com/photo-1495837174058-628aafc7d610?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Local market day. Fresh cheese, olives, and bread for 3 euros. Walking rich.',
    location_name: 'Estella, Navarra',
    lat: 42.671,
    lng: -2.032,
    created_at: storyTimestamps[18].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[18].toISOString()),
  },
  {
    id: 'story-020',
    author_id: 'p-017',
    author: getProfileById('p-017'),
    photo_url:
      'https://images.unsplash.com/photo-1465189684280-6a8fa9b19a7a?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: null,
    location_name: 'Via de la Plata, Extremadura',
    lat: 39.470,
    lng: -6.370,
    created_at: storyTimestamps[19].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[19].toISOString()),
  },
  {
    id: 'story-021',
    author_id: 'p-019',
    author: getProfileById('p-019'),
    photo_url:
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Bridge crossing at dawn. Every step forward is a step away from who I was.',
    location_name: 'Puente la Reina',
    lat: 42.673,
    lng: -1.811,
    created_at: storyTimestamps[20].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[20].toISOString()),
  },
  {
    id: 'story-022',
    author_id: 'p-021',
    author: getProfileById('p-021'),
    photo_url:
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Found a spring that is not on any map. Cold, clear, perfect. Shared the coordinates with the next walker.',
    location_name: 'Between Astorga and Ponferrada',
    lat: 42.487,
    lng: -6.340,
    created_at: storyTimestamps[21].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[21].toISOString()),
  },
  {
    id: 'story-023',
    author_id: 'p-022',
    author: getProfileById('p-022'),
    photo_url:
      'https://images.unsplash.com/photo-1445363692815-ebcd599f7621?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Stone path worn smooth by a million feet before mine. Humbling.',
    location_name: 'O Cebreiro, Galicia',
    lat: 42.709,
    lng: -7.043,
    created_at: storyTimestamps[22].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[22].toISOString()),
  },
  {
    id: 'story-024',
    author_id: 'p-024',
    author: getProfileById('p-024'),
    photo_url:
      'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Sunset from the hilltop. Took my boots off, sat in the grass, and just breathed.',
    location_name: 'Alto del Perdón',
    lat: 42.778,
    lng: -1.738,
    created_at: storyTimestamps[23].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[23].toISOString()),
  },
  // === STORIES 25-36: More routes, multi-story authors, diverse content ===
  {
    id: 'story-025',
    author_id: 'p-001', // Second story from p-001 → multi-story group
    author: getProfileById('p-001'),
    photo_url:
      'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Second sunrise in a row that stops me in my tracks. Will I ever get used to this?',
    location_name: 'Camino Francés - Navarra',
    lat: 42.812,
    lng: -1.640,
    created_at: storyTimestamps[24].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[24].toISOString()),
  },
  {
    id: 'story-026',
    author_id: 'p-003', // Second story from p-003
    author: getProfileById('p-003'),
    photo_url:
      'https://images.unsplash.com/photo-1473181488821-2d23949a045a?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Walking meditation in the forest. Mind quiet, feet moving, heart open.',
    location_name: 'Camino del Norte, Asturias',
    lat: 43.362,
    lng: -5.850,
    created_at: storyTimestamps[25].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[25].toISOString()),
  },
  {
    id: 'story-027',
    author_id: 'p-010', // Second story from p-010
    author: getProfileById('p-010'),
    photo_url:
      'https://images.unsplash.com/photo-1473181488821-2d23949a045a?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Shared dinner with the host family. Five languages at one table, one bread for all.',
    location_name: 'Near Carrión de los Condes',
    lat: 42.337,
    lng: -4.602,
    created_at: storyTimestamps[26].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[26].toISOString()),
  },
  {
    id: 'story-028',
    author_id: 'p-025',
    author: getProfileById('p-025'),
    photo_url:
      'https://images.unsplash.com/photo-1499363536502-87642509e31b?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Via Francigena through Tuscany. Cypress trees lining the path like old friends waving.',
    location_name: 'San Gimignano, Italy',
    lat: 43.467,
    lng: 11.043,
    created_at: storyTimestamps[27].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[27].toISOString()),
  },
  {
    id: 'story-029',
    author_id: 'p-028',
    author: getProfileById('p-028'),
    photo_url:
      'https://images.unsplash.com/photo-1472396961693-142e6e269027?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: null,
    location_name: 'Königsweg, near Berchtesgaden',
    lat: 47.631,
    lng: 13.001,
    created_at: storyTimestamps[28].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[28].toISOString()),
  },
  {
    id: 'story-030',
    author_id: 'p-030',
    author: getProfileById('p-030'),
    photo_url:
      'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Alpine dawn. The mountains do not care about your schedule. They just are.',
    location_name: 'E5, Austrian Alps',
    lat: 47.074,
    lng: 12.695,
    created_at: storyTimestamps[29].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[29].toISOString()),
  },
  {
    id: 'story-031',
    author_id: 'p-033',
    author: getProfileById('p-033'),
    photo_url:
      'https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Three weeks in. Lighter pack, heavier heart, clearer mind.',
    location_name: 'Camino Portugués, Porto',
    lat: 41.150,
    lng: -8.610,
    created_at: storyTimestamps[30].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[30].toISOString()),
  },
  {
    id: 'story-032',
    author_id: 'p-035',
    author: getProfileById('p-035'),
    photo_url:
      'https://images.unsplash.com/photo-1502791081949-d2b7fdf17897?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'The forest is the real cathedral. No walls needed, only trees.',
    location_name: 'Black Forest, E1 trail',
    lat: 48.030,
    lng: 8.150,
    created_at: storyTimestamps[31].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[31].toISOString()),
  },
  {
    id: 'story-033',
    author_id: 'p-040',
    author: getProfileById('p-040'),
    photo_url:
      'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Sunset from Monte Amiata. The whole valley turns gold.',
    location_name: 'Via Francigena, Tuscany',
    lat: 42.890,
    lng: 11.622,
    created_at: storyTimestamps[32].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[32].toISOString()),
  },
  {
    id: 'story-034',
    author_id: 'p-045',
    author: getProfileById('p-045'),
    photo_url:
      'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Found this tiny chapel open. Nobody around. Just me and the silence.',
    location_name: 'Near Einsiedeln, Switzerland',
    lat: 47.127,
    lng: 8.754,
    created_at: storyTimestamps[33].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[33].toISOString()),
  },
  {
    id: 'story-035',
    author_id: 'p-050',
    author: getProfileById('p-050'),
    photo_url:
      'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Waterfall break. Cold water, hot coffee from the thermos. Perfection.',
    location_name: 'Camino del Norte, Cantabria',
    lat: 43.380,
    lng: -4.450,
    created_at: storyTimestamps[34].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[34].toISOString()),
  },
  {
    id: 'story-036',
    author_id: 'p-001', // Third story from p-001 → 3-story group!
    author: getProfileById('p-001'),
    photo_url:
      'https://images.unsplash.com/photo-1414609245224-afa02bfb3fda?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Night walk under the stars. Only my headlamp and the sound of my steps.',
    location_name: 'Meseta, after dark',
    lat: 42.150,
    lng: -4.100,
    created_at: storyTimestamps[35].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[35].toISOString()),
  },
  {
    id: 'story-037',
    author_id: 'p-249',
    author: getProfileById('p-249'),
    photo_url:
      'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Slow morning. Slow coffee. Slow miles. The point isn\'t speed.',
    location_name: 'Wellington, NZ',
    lat: -41.324,
    lng: 174.7887,
    created_at: storyTimestamps[0].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[0].toISOString()),
  },
  {
    id: 'story-038',
    author_id: 'p-247',
    author: getProfileById('p-247'),
    photo_url:
      'https://images.unsplash.com/photo-1455587734955-081b22074882?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'The town diner gave me a pilgrim discount and I almost wept into my pancakes.',
    location_name: 'Matsuyama, JP',
    lat: 33.8124,
    lng: 132.7371,
    created_at: storyTimestamps[1].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[1].toISOString()),
  },
  {
    id: 'story-039',
    author_id: 'p-215',
    author: getProfileById('p-215'),
    photo_url:
      'https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Crossed into a new state today. New state of mind too, honestly.',
    location_name: 'Monson, ME',
    lat: 45.3565,
    lng: -69.5563,
    created_at: storyTimestamps[2].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[2].toISOString()),
  },
  {
    id: 'story-040',
    author_id: 'p-219',
    author: getProfileById('p-219'),
    photo_url:
      'https://images.unsplash.com/photo-1486915309851-b0cc1f8a0084?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Hostel notebook entry from 1989: \'Don\'t trust the spring at km 47.\' Thank you, ghost-walker.',
    location_name: 'Steamboat Springs, CO',
    lat: 40.5035,
    lng: -106.9051,
    created_at: storyTimestamps[3].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[3].toISOString()),
  },
  {
    id: 'story-041',
    author_id: 'p-214',
    author: getProfileById('p-214'),
    photo_url:
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Met three other walkers at the shelter tonight. Trail family forming.',
    location_name: 'Gorham, NH',
    lat: 44.4482,
    lng: -71.1013,
    created_at: storyTimestamps[4].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[4].toISOString()),
  },
  {
    id: 'story-042',
    author_id: 'p-207',
    author: getProfileById('p-207'),
    photo_url:
      'https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Wrote three pages in my journal at lunch. Best office I\'ve ever had.',
    location_name: 'Manning Park, BC',
    lat: 49.112,
    lng: -120.7271,
    created_at: storyTimestamps[5].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[5].toISOString()),
  },
  {
    id: 'story-043',
    author_id: 'p-245',
    author: getProfileById('p-245'),
    photo_url:
      'https://images.unsplash.com/photo-1486915309851-b0cc1f8a0084?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Sunrise from the ridge. No filter, no caption could do it justice.',
    location_name: 'Guatemala Antigua, GT',
    lat: 14.4826,
    lng: -90.803,
    created_at: storyTimestamps[6].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[6].toISOString()),
  },
  {
    id: 'story-044',
    author_id: 'p-241',
    author: getProfileById('p-241'),
    photo_url:
      'https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Detour for a swimming hole. Best decision of the week.',
    location_name: 'Montréal, QC',
    lat: 45.5003,
    lng: -73.6149,
    created_at: storyTimestamps[7].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[7].toISOString()),
  },
  {
    id: 'story-045',
    author_id: 'p-252',
    author: getProfileById('p-252'),
    photo_url:
      'https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Day 155. The miles add up but so does the calm.',
    location_name: 'Cusco, PE',
    lat: -13.5774,
    lng: -72.0062,
    created_at: storyTimestamps[8].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[8].toISOString()),
  },
  {
    id: 'story-046',
    author_id: 'p-230',
    author: getProfileById('p-230'),
    photo_url:
      'https://images.unsplash.com/photo-1551524559-8af4e6624178?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Trail name finally landed. They called me Wren after the river crossing.',
    location_name: 'Powell River, BC',
    lat: 49.8675,
    lng: -124.567,
    created_at: storyTimestamps[9].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[9].toISOString()),
  },
  {
    id: 'story-047',
    author_id: 'p-238',
    author: getProfileById('p-238'),
    photo_url:
      'https://images.unsplash.com/photo-1517825738774-7de9363ef735?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'First trail magic of the trip — a stranger handed me cold lemonade at the road crossing. I might cry.',
    location_name: 'Asheville, NC',
    lat: 35.5522,
    lng: -82.4838,
    created_at: storyTimestamps[10].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[10].toISOString()),
  },
  {
    id: 'story-048',
    author_id: 'p-213',
    author: getProfileById('p-213'),
    photo_url:
      'https://images.unsplash.com/photo-1529088746738-c4c0a152fb2a?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'First trail magic of the trip — a stranger handed me cold lemonade at the road crossing. I might cry.',
    location_name: 'Hanover, NH',
    lat: 43.6628,
    lng: -72.3237,
    created_at: storyTimestamps[11].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[11].toISOString()),
  },
  {
    id: 'story-049',
    author_id: 'p-203',
    author: getProfileById('p-203'),
    photo_url:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Trail name finally landed. They called me Wren after the river crossing.',
    location_name: 'Ashland, OR',
    lat: 42.1995,
    lng: -122.6914,
    created_at: storyTimestamps[12].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[12].toISOString()),
  },
  {
    id: 'story-050',
    author_id: 'p-197',
    author: getProfileById('p-197'),
    photo_url:
      'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'The wind on the pass tried to take my hat. The hat stayed. So did I.',
    location_name: 'Idyllwild, CA',
    lat: 33.7133,
    lng: -116.7789,
    created_at: storyTimestamps[13].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[13].toISOString()),
  },
  {
    id: 'story-051',
    author_id: 'p-211',
    author: getProfileById('p-211'),
    photo_url:
      'https://images.unsplash.com/photo-1496080174650-637e3f22fa03?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Slept under the stars because the tent fly is somewhere in Idaho. Worth it.',
    location_name: 'Harpers Ferry, WV',
    lat: 39.3672,
    lng: -77.7658,
    created_at: storyTimestamps[14].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[14].toISOString()),
  },
  {
    id: 'story-052',
    author_id: 'p-220',
    author: getProfileById('p-220'),
    photo_url:
      'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Crossed into a new state today. New state of mind too, honestly.',
    location_name: 'Pinedale, WY',
    lat: 42.8293,
    lng: -109.8114,
    created_at: storyTimestamps[15].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[15].toISOString()),
  },
  {
    id: 'story-053',
    author_id: 'p-243',
    author: getProfileById('p-243'),
    photo_url:
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Foot blister update: managed. Spirit blister: also managed.',
    location_name: 'Mexico City, MX',
    lat: 19.3827,
    lng: -99.0633,
    created_at: storyTimestamps[16].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[16].toISOString()),
  },
  {
    id: 'story-054',
    author_id: 'p-222',
    author: getProfileById('p-222'),
    photo_url:
      'https://images.unsplash.com/photo-1496950866446-3253e1470e8e?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Detour for a swimming hole. Best decision of the week.',
    location_name: 'Yosemite Valley, CA',
    lat: 37.8073,
    lng: -119.5617,
    created_at: storyTimestamps[17].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[17].toISOString()),
  },
  {
    id: 'story-055',
    author_id: 'p-212',
    author: getProfileById('p-212'),
    photo_url:
      'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'First trail magic of the trip — a stranger handed me cold lemonade at the road crossing. I might cry.',
    location_name: 'Delaware Water Gap, PA',
    lat: 41.0182,
    lng: -75.1226,
    created_at: storyTimestamps[18].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[18].toISOString()),
  },
  {
    id: 'story-056',
    author_id: 'p-228',
    author: getProfileById('p-228'),
    photo_url:
      'https://images.unsplash.com/photo-1465014849944-13953daaf824?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Met three other walkers at the shelter tonight. Trail family forming.',
    location_name: 'Tobermory, ON',
    lat: 45.3306,
    lng: -81.7291,
    created_at: storyTimestamps[19].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[19].toISOString()),
  },
  {
    id: 'story-057',
    author_id: 'p-216',
    author: getProfileById('p-216'),
    photo_url:
      'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Foot blister update: managed. Spirit blister: also managed.',
    location_name: 'Mount Katahdin, ME',
    lat: 45.8553,
    lng: -68.95,
    created_at: storyTimestamps[20].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[20].toISOString()),
  },
  {
    id: 'story-058',
    author_id: 'p-236',
    author: getProfileById('p-236'),
    photo_url:
      'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Slow morning. Slow coffee. Slow miles. The point isn\'t speed.',
    location_name: 'Seattle, WA',
    lat: 47.5461,
    lng: -122.3305,
    created_at: storyTimestamps[21].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[21].toISOString()),
  },
  {
    id: 'story-059',
    author_id: 'p-221',
    author: getProfileById('p-221'),
    photo_url:
      'https://images.unsplash.com/photo-1551524559-8af4e6624178?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Slow morning. Slow coffee. Slow miles. The point isn\'t speed.',
    location_name: 'East Glacier, MT',
    lat: 48.5212,
    lng: -113.2482,
    created_at: storyTimestamps[22].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[22].toISOString()),
  },
  {
    id: 'story-060',
    author_id: 'p-204',
    author: getProfileById('p-204'),
    photo_url:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Thirty kilometres on a flat day. My legs surprise me.',
    location_name: 'Sisters, OR',
    lat: 44.2286,
    lng: -121.5329,
    created_at: storyTimestamps[23].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[23].toISOString()),
  },
  {
    id: 'story-061',
    author_id: 'p-231',
    author: getProfileById('p-231'),
    photo_url:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Trail name finally landed. They called me Birch after the river crossing.',
    location_name: 'New York, NY',
    lat: 40.7761,
    lng: -73.9377,
    created_at: storyTimestamps[24].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[24].toISOString()),
  },
  {
    id: 'story-062',
    author_id: 'p-199',
    author: getProfileById('p-199'),
    photo_url:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Resupply town. Real coffee. Real shower. Real bed. I\'m a citizen again for 12 hours.',
    location_name: 'Kennedy Meadows, CA',
    lat: 36.0279,
    lng: -118.0899,
    created_at: storyTimestamps[25].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[25].toISOString()),
  },
  {
    id: 'story-063',
    author_id: 'p-259',
    author: getProfileById('p-259'),
    photo_url:
      'https://images.unsplash.com/photo-1517825738774-7de9363ef735?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Crossed into a new state today. New state of mind too, honestly.',
    location_name: 'Bergen, NO',
    lat: 60.3825,
    lng: 5.342,
    created_at: storyTimestamps[26].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[26].toISOString()),
  },
  {
    id: 'story-064',
    author_id: 'p-208',
    author: getProfileById('p-208'),
    photo_url:
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'Saw bear tracks for the first time. Then I saw the bear. We were both fine.',
    location_name: 'Springer Mountain, GA',
    lat: 34.5833,
    lng: -84.2367,
    created_at: storyTimestamps[27].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[27].toISOString()),
  },
  {
    id: 'story-065',
    author_id: 'p-205',
    author: getProfileById('p-205'),
    photo_url:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'The town diner gave me a pilgrim discount and I almost wept into my pancakes.',
    location_name: 'Cascade Locks, OR',
    lat: 45.6095,
    lng: -121.8979,
    created_at: storyTimestamps[28].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[28].toISOString()),
  },
  {
    id: 'story-066',
    author_id: 'p-250',
    author: getProfileById('p-250'),
    photo_url:
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=1200&fit=crop&fm=webp&q=60',
    caption: 'First trail magic of the trip — a stranger handed me cold lemonade at the road crossing. I might cry.',
    location_name: 'Queenstown, NZ',
    lat: -44.9522,
    lng: 168.6632,
    created_at: storyTimestamps[29].toISOString(),
    expires_at: addStoryExpiry(storyTimestamps[29].toISOString()),
  },
];

export const SEED_STORY_HIGHLIGHTS = [
  {
    id: 'highlight-001',
    profile_id: 'p-001',
    name: 'Camino Francés 2026',
    cover_url:
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=1200&fit=crop&fm=webp&q=60',
    story_ids: ['story-001'],
    created_at: '2026-04-10T08:00:00Z',
    updated_at: '2026-04-25T18:00:00Z',
  },
  {
    id: 'highlight-002',
    profile_id: 'p-003',
    name: 'Best Views',
    cover_url:
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=1200&fit=crop&fm=webp&q=60',
    story_ids: ['story-003', 'story-005'],
    created_at: '2026-02-20T10:00:00Z',
    updated_at: '2026-04-25T18:00:00Z',
  },
  {
    id: 'highlight-003',
    profile_id: 'p-023',
    name: 'The Journey',
    cover_url:
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=1200&fit=crop&fm=webp&q=60',
    story_ids: [
      'story-007',
      'story-010',
      'story-011',
      'story-012',
    ],
    created_at: '2026-01-15T14:00:00Z',
    updated_at: '2026-04-25T18:00:00Z',
  },
  {
    id: 'highlight-004',
    profile_id: 'p-010',
    name: 'People I Met',
    cover_url:
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=1200&fit=crop&fm=webp&q=60',
    story_ids: ['story-007'],
    created_at: '2026-03-05T09:30:00Z',
    updated_at: '2026-04-25T18:00:00Z',
  },
];
