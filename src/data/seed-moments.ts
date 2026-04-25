/**
 * Seed moments — fallback feed posts when Supabase returns empty.
 * Each moment references an author from seed-profiles.ts.
 */
import { SEED_PROFILES } from './seed-profiles';

// Helper to build a moment with its author embedded
function m(
  id: string,
  authorId: string,
  content: string,
  opts: {
    photo_url?: string;
    location_name?: string;
    likes_count?: number;
    replies_count?: number;
    created_at: string;
  }
) {
  const author = SEED_PROFILES.find(p => p.id === authorId);
  return {
    id,
    author_id: authorId,
    content,
    photo_url: opts.photo_url ?? null,
    location_name: opts.location_name ?? null,
    lat: null,
    lng: null,
    likes_count: opts.likes_count ?? 0,
    replies_count: opts.replies_count ?? 0,
    created_at: opts.created_at,
    author: author ?? undefined,
  };
}

export const SEED_MOMENTS = [
  // ── Sonnenkind (p-001) — the career-changer from Munich ──
  m('m-001', 'p-001', 'Day 12 on the Camino Francés. My feet hurt, my pack is too heavy, and a stranger just shared his last orange with me. I think I understand now.', {
    photo_url: 'https://images.unsplash.com/photo-1533105079903-3e5189c65afe?w=800&h=600&fit=crop',
    location_name: 'Between Estella and Los Arcos',
    likes_count: 34,
    replies_count: 7,
    created_at: '2026-04-25T07:30:00Z',
  }),
  m('m-002', 'p-001', 'Left Munich 47 days ago with a resignation letter in my pocket and no plan. Best decision I ever made. The road provides.', {
    photo_url: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800&h=600&fit=crop',
    location_name: 'Pamplona',
    likes_count: 89,
    replies_count: 12,
    created_at: '2026-04-22T18:45:00Z',
  }),

  // ── Perle du Chemin (p-002) — the hospitalera baker ──
  m('m-003', 'p-002', 'Baked 40 baguettes before sunrise. 28 walkers sleeping in the barn. Coffee is on. This is my cathedral.', {
    photo_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=600&fit=crop',
    location_name: 'Conques, Via Podiensis',
    likes_count: 112,
    replies_count: 18,
    created_at: '2026-04-24T05:15:00Z',
  }),
  m('m-004', 'p-002', 'A walker arrived tonight who hadn\'t eaten in two days. He was too proud to ask. Sometimes the Way breaks you before it heals you. Fed him soup, bread, and silence.', {
    location_name: 'Conques',
    likes_count: 203,
    replies_count: 31,
    created_at: '2026-04-20T21:00:00Z',
  }),

  // ── Caminhante (p-003) — Portuguese photographer ──
  m('m-005', 'p-003', 'Found a forgotten waymarker from the 14th century hidden behind a gas station in Barcelos. The old Way is still here if you look.', {
    photo_url: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800&h=600&fit=crop',
    location_name: 'Barcelos, Camino Portugues',
    likes_count: 67,
    replies_count: 9,
    created_at: '2026-04-24T14:20:00Z',
  }),
  m('m-006', 'p-003', 'The light at 6am on the Douro is unlike anything else. Golden hour lasts two hours here. Portugal doesn\'t rush, even the sun takes its time.', {
    photo_url: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&h=600&fit=crop',
    location_name: 'Porto',
    likes_count: 145,
    replies_count: 14,
    created_at: '2026-04-21T06:30:00Z',
  }),

  // ── Sternenstaub (p-004) — the retired teacher, 67 ──
  m('m-007', 'p-004', 'A young man asked me today why I walk alone at my age. I told him: I walked in groups my whole life. Classrooms, faculty meetings, family dinners. Now I walk for me.', {
    likes_count: 278,
    replies_count: 42,
    created_at: '2026-04-23T16:00:00Z',
  }),
  m('m-008', 'p-004', 'Tuscany in April. The poppies are out. I sketched the Ponte d\'Arbia while my feet dried in the sun. 67 years old and learning to be still for the first time.', {
    photo_url: 'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=800&h=600&fit=crop',
    location_name: 'Ponte d\'Arbia, Via Francigena',
    likes_count: 156,
    replies_count: 19,
    created_at: '2026-04-19T11:00:00Z',
  }),

  // ── El Lento (p-005) — the ultra-slow walker ──
  m('m-009', 'p-005', '12 km today. Watched a beetle cross the path for 20 minutes. He made it. We both made it. What\'s the rush?', {
    photo_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop',
    location_name: 'Somewhere in Navarra',
    likes_count: 198,
    replies_count: 24,
    created_at: '2026-04-24T17:30:00Z',
  }),
  m('m-010', 'p-005', '365 nights on the road. One full year. I own less than ever and I\'ve never been richer. The trail is my address now.', {
    likes_count: 412,
    replies_count: 56,
    created_at: '2026-04-18T20:00:00Z',
  }),
  m('m-011', 'p-005', 'Met a hospitalero who\'s been hosting walkers for 22 years. Free. Every night. No questions asked. He said: "The door is always open. That\'s the only rule." Heroes don\'t need capes, they need open doors.', {
    location_name: 'Hospital de Orbigo',
    likes_count: 324,
    replies_count: 38,
    created_at: '2026-04-15T19:00:00Z',
  }),

  // ── Fireheart (p-006) — Irish nurse turned walker ──
  m('m-012', 'p-006', 'Patched up three blisters today, taught someone how to tape their feet properly, and shared my last ibuprofen. Trail nursing is my calling. The Camino needs more first-aid kits and fewer selfie sticks.', {
    location_name: 'Sarria, Camino Frances',
    likes_count: 187,
    replies_count: 22,
    created_at: '2026-04-23T13:00:00Z',
  }),
  m('m-013', 'p-006', '730 nights. Two full years of walking. From a hospital ward in Dublin to here. The trail didn\'t just heal my body, it gave me a new one.', {
    photo_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop',
    likes_count: 356,
    replies_count: 47,
    created_at: '2026-04-16T08:00:00Z',
  }),

  // ── Waldgeist (p-007) — Black Forest host and trail builder ──
  m('m-014', 'p-007', 'Cleared 2km of fallen trees from the pilgrim path today. Found a 200-year-old boundary stone underneath. The forest remembers what we forget.', {
    photo_url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&h=600&fit=crop',
    location_name: 'Black Forest, Germany',
    likes_count: 134,
    replies_count: 11,
    created_at: '2026-04-22T15:00:00Z',
  }),
  m('m-015', 'p-007', 'Tonight in the barn: a doctor from Berlin, a fisherman from Brittany, and a student from Seoul. All walking. All strangers yesterday. All family tonight. The barn sleeps 8. The door is never locked.', {
    location_name: 'Waldgeist\'s Barn, Schwarzwald',
    likes_count: 267,
    replies_count: 33,
    created_at: '2026-04-20T22:00:00Z',
  }),

  // ── Piccola Stella (p-008) — Italian art student ──
  m('m-016', 'p-008', 'Sketched the Duomo di Siena from the pilgrim hostel rooftop. My thesis advisor says I need more "academic rigor." I say she needs more sunsets.', {
    photo_url: 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800&h=600&fit=crop',
    location_name: 'Siena, Via Francigena',
    likes_count: 89,
    replies_count: 8,
    created_at: '2026-04-24T19:30:00Z',
  }),
  m('m-017', 'p-008', 'Day 2 on the Via Francigena. My art supplies weigh more than my clothes. Priorities. A Franciscan monk let me sketch his hands. They looked like the roots of an old olive tree.', {
    location_name: 'Near San Gimignano',
    likes_count: 123,
    replies_count: 15,
    created_at: '2026-04-23T10:00:00Z',
  }),

  // ── Nordlicht (p-009) — Norwegian long-distance walker ──
  m('m-018', 'p-009', 'People ask if I get lonely walking solo for months. I tell them: you\'re never alone on the Way. The stones talk. The wind talks. And every 20 km, someone offers you coffee.', {
    likes_count: 234,
    replies_count: 28,
    created_at: '2026-04-21T09:00:00Z',
  }),
  m('m-019', 'p-009', '1100 nights. From Trondheim to Santiago and back again. The cathedral at Compostela was beautiful, but the real arrival was somewhere in the Pyrenees, when I stopped counting kilometers.', {
    photo_url: 'https://images.unsplash.com/photo-1520769669658-f07657f5a307?w=800&h=600&fit=crop',
    location_name: 'Somewhere in the Pyrenees',
    likes_count: 467,
    replies_count: 62,
    created_at: '2026-04-17T07:00:00Z',
  }),

  // ── Barfuss (p-010) — barefoot minimalist walker ──
  m('m-020', 'p-010', 'A child pointed at my feet today and asked her mother why I have no shoes. The mother said: "Because he\'s crazy." The child said: "Or maybe he\'s free." Kids get it.', {
    likes_count: 389,
    replies_count: 45,
    created_at: '2026-04-24T12:00:00Z',
  }),
  m('m-021', 'p-010', 'Crossed the Meseta barefoot. 200 km of nothing. Just wheat, sky, and the sound of your own breath. My soles are leather now. The earth is warm.', {
    photo_url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&h=600&fit=crop',
    location_name: 'Meseta, Castilla y Leon',
    likes_count: 278,
    replies_count: 34,
    created_at: '2026-04-19T16:00:00Z',
  }),

  // ── Pellegrina (p-011) — Roman history professor ──
  m('m-022', 'p-011', 'Found Roman road stones beneath the modern path near Bolsena. 2000 years ago, someone walked this exact route to Rome. Different shoes, same questions.', {
    photo_url: 'https://images.unsplash.com/photo-1523464862212-d6631d073571?w=800&h=600&fit=crop',
    location_name: 'Near Bolsena, Via Francigena',
    likes_count: 156,
    replies_count: 19,
    created_at: '2026-04-22T10:30:00Z',
  }),
  m('m-023', 'p-011', 'My students think I\'m on sabbatical. I\'m actually conducting the most important research of my career: what happens when a professor stops lecturing and starts listening.', {
    likes_count: 201,
    replies_count: 26,
    created_at: '2026-04-18T14:00:00Z',
  }),

  // ── Morgenrot (p-012) — family of four walking together ──
  m('m-024', 'p-012', 'Our 6-year-old found a snail today and named it "Professor Slow." She insisted we wait for it to cross the path. Took 8 minutes. Best lesson of the day.', {
    photo_url: 'https://images.unsplash.com/photo-1476362174823-3a23f4aa6d76?w=800&h=600&fit=crop',
    location_name: 'Camino del Norte',
    likes_count: 312,
    replies_count: 41,
    created_at: '2026-04-23T08:30:00Z',
  }),
  m('m-025', 'p-012', 'People said we were crazy to take two kids on the Camino. Our 9-year-old just asked if we can keep walking "forever and ever." The world is our classroom.', {
    likes_count: 445,
    replies_count: 58,
    created_at: '2026-04-20T19:00:00Z',
  }),
  m('m-026', 'p-012', 'Family math lesson today: if we walk 15 km and eat 3 bocadillos each, how many bocadillos is that? Our daughter said "not enough." She\'s not wrong.', {
    location_name: 'Santander',
    likes_count: 234,
    replies_count: 29,
    created_at: '2026-04-17T12:30:00Z',
  }),

  // ── More from El Lento (p-005) ──
  m('m-027', 'p-005', 'An albergue had a guest book with entries going back to 1994. I read them all. Same fears, same joys, same blisters. We are all walking the same walk.', {
    location_name: 'Albergue San Bol, Meseta',
    likes_count: 189,
    replies_count: 21,
    created_at: '2026-04-13T21:00:00Z',
  }),

  // ── More from Perle du Chemin (p-002) ──
  m('m-028', 'p-002', 'A walker left a drawing on the table this morning. A loaf of bread with wings. Underneath it said: "Merci pour les ailes." I\'m keeping this one.', {
    photo_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop',
    location_name: 'Conques',
    likes_count: 267,
    replies_count: 35,
    created_at: '2026-04-14T07:00:00Z',
  }),

  // ── More from Sonnenkind (p-001) ──
  m('m-029', 'p-001', 'My former boss texted asking when I\'m coming back. I sent him a photo of the sunrise over the Meseta. He replied with a thumbs up. I think he gets it now.', {
    photo_url: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&h=600&fit=crop',
    location_name: 'Meseta',
    likes_count: 178,
    replies_count: 23,
    created_at: '2026-04-12T06:45:00Z',
  }),

  // ── More from Fireheart (p-006) ──
  m('m-030', 'p-006', 'Rain for 6 hours straight. Soaked through every layer. Arrived at the albergue looking like a drowned cat. The hospitalera handed me dry socks and said: "Welcome home." That\'s it. That\'s the Camino.', {
    location_name: 'O Cebreiro, Galicia',
    likes_count: 298,
    replies_count: 37,
    created_at: '2026-04-11T18:30:00Z',
  }),

  // ── More from Waldgeist (p-007) ──
  m('m-031', 'p-007', 'Spring maintenance on the pilgrim path complete. 40 km of trail cleared, 12 waymarkers repainted, 3 benches rebuilt. The forest is ready. Come walk.', {
    photo_url: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800&h=600&fit=crop',
    location_name: 'Schwarzwald',
    likes_count: 178,
    replies_count: 15,
    created_at: '2026-04-10T16:00:00Z',
  }),

  // ── More from Caminhante (p-003) ──
  m('m-032', 'p-003', 'Ponte de Lima at dusk. The oldest town in Portugal and the bridge looks exactly like it did 900 years ago. Some things don\'t need updating.', {
    photo_url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop',
    location_name: 'Ponte de Lima',
    likes_count: 167,
    replies_count: 13,
    created_at: '2026-04-09T19:45:00Z',
  }),

  // ── More from Nordlicht (p-009) ──
  m('m-033', 'p-009', 'Quiet mode: on. Phone: off. The mountains don\'t need captions. Sometimes the best post is the one you don\'t write. But here I am writing anyway.', {
    likes_count: 198,
    replies_count: 17,
    created_at: '2026-04-08T07:30:00Z',
  }),

  // ── More from Barfuss (p-010) ──
  m('m-034', 'p-010', 'Pro tip from 2000 km barefoot: morning dew on grass is the best foot massage. Afternoon gravel is the worst. Evening sand is a gift. Plan accordingly.', {
    location_name: 'Somewhere on the Camino',
    likes_count: 245,
    replies_count: 31,
    created_at: '2026-04-07T14:00:00Z',
  }),

  // ── More from Sternenstaub (p-004) ──
  m('m-035', 'p-004', 'The hospitalera in San Miniato is 82. She\'s been hosting walkers since 1998. She knows every crack in the ceiling, every creak in the stairs. She said: "I\'ll stop when they carry me out." I want to be her when I grow up.', {
    location_name: 'San Miniato, Tuscany',
    likes_count: 312,
    replies_count: 39,
    created_at: '2026-04-06T20:00:00Z',
  }),

  // ── More from Piccola Stella (p-008) ──
  m('m-036', 'p-008', 'Ran out of pencils. A shepherd gave me a piece of charcoal. Drew the best sketch of my entire thesis with it. Art school teaches technique. The road teaches truth.', {
    location_name: 'Tuscan hills',
    likes_count: 178,
    replies_count: 22,
    created_at: '2026-04-05T15:30:00Z',
  }),

  // ── More from Morgenrot (p-012) ──
  m('m-037', 'p-012', 'Homeschool report: Geography - walked through 3 regions. Biology - identified 7 bird species. Math - counted 412 steps up the hill. PE - all day, every day. Literature - bedtime stories in the albergue. Grade: A+.', {
    location_name: 'Asturias',
    likes_count: 356,
    replies_count: 44,
    created_at: '2026-04-04T21:00:00Z',
  }),

  // ── More from Pellegrina (p-011) ──
  m('m-038', 'p-011', 'Walked over a Roman aqueduct today that most tourists drive past without noticing. Underneath, the stones still bear mason marks from the 2nd century. The past is not behind us. It\'s beneath our feet.', {
    photo_url: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&h=600&fit=crop',
    location_name: 'Between Viterbo and Rome',
    likes_count: 189,
    replies_count: 24,
    created_at: '2026-04-03T11:00:00Z',
  }),

  // ── More from El Lento (p-005) ──
  m('m-039', 'p-005', 'Sat with an old man on a bench outside a church for an hour. We didn\'t share a language. We shared an orange. Communication doesn\'t require words.', {
    photo_url: 'https://images.unsplash.com/photo-1517483000871-1dbf64a6e1c6?w=800&h=600&fit=crop',
    location_name: 'A village in Galicia',
    likes_count: 412,
    replies_count: 51,
    created_at: '2026-04-02T17:00:00Z',
  }),

  // ── More from Fireheart (p-006) ──
  m('m-040', 'p-006', 'The albergue had no hot water. 14 walkers. One shower. Cold. Everyone laughed about it at dinner. By the third glass of wine, it was the funniest thing that ever happened. Context is everything.', {
    location_name: 'Somewhere in Leon',
    likes_count: 234,
    replies_count: 29,
    created_at: '2026-04-01T20:30:00Z',
  }),
];
