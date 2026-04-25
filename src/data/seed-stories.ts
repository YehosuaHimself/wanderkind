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

const storyTimestamps = [
  new Date(now.getTime() - 0 * 60 * 60 * 1000), // now
  new Date(now.getTime() - 45 * 60 * 1000), // 45 min ago
  new Date(now.getTime() - 1.5 * 60 * 60 * 1000), // 1.5h ago
  new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2h ago
  new Date(now.getTime() - 2.75 * 60 * 60 * 1000), // 2h 45min ago
  new Date(now.getTime() - 3.5 * 60 * 60 * 1000), // 3.5h ago
  new Date(now.getTime() - 4.25 * 60 * 60 * 1000), // 4.25h ago
  new Date(now.getTime() - 5 * 60 * 60 * 1000), // 5h ago
  new Date(now.getTime() - 6.33 * 60 * 60 * 1000), // 6.33h ago
  new Date(now.getTime() - 7 * 60 * 60 * 1000), // 7h ago
  new Date(now.getTime() - 8.5 * 60 * 60 * 1000), // 8.5h ago
  new Date(now.getTime() - 9.5 * 60 * 60 * 1000), // 9.5h ago
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
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=1200&fit=crop&fm=webp&q=60',
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
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=1200&fit=crop&fm=webp&q=60',
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
      'https://images.unsplash.com/photo-1502791081949-d2b7fdf17897?w=800&h=1200&fit=crop&fm=webp&q=60',
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
