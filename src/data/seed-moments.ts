import { SEED_PROFILES } from './seed-profiles';

function m(
  id: string,
  authorId: string,
  content: string,
  opts: {
    photo_url?: string;
    location_name?: string;
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
    created_at: opts.created_at,
    author: author ?? undefined,
  };
}

export const SEED_MOMENTS = [
  m('m-001', 'p-001', 'Day 47. Feet still angry but my heart is singing. The Meseta just keeps giving.', {
    location_name: 'El Burgo Ranero, Spain',
    created_at: '2026-04-25T09:23:00Z',
  }),
  m('m-002', 'p-002', 'Made 200 pain au chocolat for pilgrims this morning. This is why I left Paris. 🥐', {
    photo_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561280?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'Le Puy-en-Velay, France',
    created_at: '2026-04-24T16:45:00Z',
  }),
  m('m-003', 'p-003', 'Three weeks in and my camera has more dirt than my hiking boots. Worth it.', {
    photo_url: 'https://images.unsplash.com/photo-1502791081949-d2b7fdf17897?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'Vilarinho, Portugal',
    created_at: '2026-04-24T14:12:00Z',
  }),
  m('m-004', 'p-004', 'At 67, everyone told me I was crazy. Two months in, they can be quiet now. Every day is a miracle.', {
    location_name: 'Via Francigena, Switzerland',
    created_at: '2026-04-24T11:03:00Z',
  }),
  m('m-005', 'p-005', 'Day 89. No timeline. No rush. Just walking and existing. This is what freedom tastes like.', {
    photo_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'La Rioja, Spain',
    created_at: '2026-04-24T08:30:00Z',
  }),
  m('m-006', 'p-006', 'Year 2 on the road. The blisters are smaller now but the conversations are deeper.', {
    location_name: 'Camino Portugues, Spain',
    created_at: '2026-04-23T18:45:00Z',
  }),
  m('m-007', 'p-007', 'Hosted 47 pilgrims this month. Still in love with this life.', {
    photo_url: 'https://images.unsplash.com/photo-1566486749834-f913b3e2e1be?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'Black Forest, Germany',
    created_at: '2026-04-23T15:22:00Z',
  }),
  m('m-008', 'p-008', 'My sketchbook is filling up faster than my feet are hurting. Every town has a story to draw.', {
    photo_url: 'https://images.unsplash.com/photo-1579783902614-e3fb5141b0cb?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'Tuscany, Italy',
    created_at: '2026-04-23T12:08:00Z',
  }),
  m('m-009', 'p-009', '1100 nights later and I still wake up wondering what the road will bring. Never gets old.', {
    location_name: 'Finisterre, Spain',
    created_at: '2026-04-23T09:44:00Z',
  }),
  m('m-010', 'p-010', 'Barefoot for 52 days straight. My soles are leather now. My soul is free.', {
    photo_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'Alsace, France',
    created_at: '2026-04-22T16:30:00Z',
  }),
  m('m-011', 'p-011', 'Teaching my students about Via Francigena while walking it. They\'re jealous. I don\'t blame them.', {
    location_name: 'Rome, Italy',
    created_at: '2026-04-22T14:17:00Z',
  }),
  m('m-012', 'p-012', 'Family moment: Kids spotted 6 different birds today. This is better than any screen time.', {
    photo_url: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'Stuttgart, Germany',
    created_at: '2026-04-22T11:52:00Z',
  }),
  m('m-013', 'p-013', 'Cooking for 30 pilgrims tonight. One person\'s leftovers become another person\'s feast. Love that.', {
    photo_url: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'Namur, Belgium',
    created_at: '2026-04-21T17:45:00Z',
  }),
  m('m-014', 'p-014', 'Tercera vez es la vencida. The Camino keeps teaching me something different each time.', {
    location_name: 'Logroño, Spain',
    created_at: '2026-04-21T15:20:00Z',
  }),
  m('m-015', 'p-015', 'As a physio, I\'m doing an unplanned study on how the Camino heals bodies and minds.', {
    photo_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'Bilbao, Spain',
    created_at: '2026-04-21T13:05:00Z',
  }),
  m('m-016', 'p-016', 'Took sabbatical from code. Writing on paper now. Mind is clearer. Life is slower. Perfection.', {
    location_name: 'Geneva, Switzerland',
    created_at: '2026-04-21T10:30:00Z',
  }),
  m('m-017', 'p-017', 'Every interview is a treasure. These stories deserve to be told. Book is becoming real.', {
    photo_url: 'https://images.unsplash.com/photo-1507842072343-583f20270319?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'Warsaw, Poland',
    created_at: '2026-04-20T16:12:00Z',
  }),
  m('m-018', 'p-018', 'Former fisherman here. The rhythms are the same. Just different currents now.', {
    location_name: 'Copenhagen, Denmark',
    created_at: '2026-04-20T14:48:00Z',
  }),
  m('m-019', 'p-019', 'My Year 9 class is following my trail updates. They\'re learning more history from this than textbooks.', {
    photo_url: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'London, United Kingdom',
    created_at: '2026-04-20T11:35:00Z',
  }),
  m('m-020', 'p-020', 'Luna and I just hiked through rain for 8 hours. She didn\'t complain once. Better friend than most humans.', {
    location_name: 'Prague, Czech Republic',
    created_at: '2026-04-20T09:22:00Z',
  }),
  m('m-021', 'p-021', 'My backpack is 40% spices by weight. No regrets. Making coq au vin on a camp stove tonight.', {
    photo_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'Provence, France',
    created_at: '2026-04-19T17:50:00Z',
  }),
  m('m-022', 'p-022', 'Finding my yoga mat replaced by walking sticks. Finding my practice anyway. The trail teaches.', {
    location_name: 'Stockholm, Sweden',
    created_at: '2026-04-19T15:14:00Z',
  }),
  m('m-023', 'p-023', 'Route number 5. Still discovering new things at 71. Still walking farther than people expect.', {
    photo_url: 'https://images.unsplash.com/photo-1465056836342-2b862c2511c2?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'Munich, Germany',
    created_at: '2026-04-19T13:40:00Z',
  }),
  m('m-024', 'p-024', 'Hosted 6 pilgrims today. Served them my olive oil. It\'s an honor to feed wanderers.', {
    location_name: 'Siena, Italy',
    created_at: '2026-04-19T11:25:00Z',
  }),
  m('m-025', 'p-025', 'Exchange student to long-term wanderer. Nobody back in Seoul understands but that\'s okay.', {
    photo_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'Seoul, South Korea',
    created_at: '2026-04-18T16:58:00Z',
  }),
  m('m-026', 'p-026', 'Mountain guide leading pilgrims now. Different peaks. Same sense of awe every single day.', {
    location_name: 'Koenigsweg, Austria',
    created_at: '2026-04-18T14:33:00Z',
  }),
  m('m-027', 'p-027', 'One-way ticket from Rio to Porto. Day 3. Already understand why people don\'t go back.', {
    photo_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'Porto, Portugal',
    created_at: '2026-04-18T12:10:00Z',
  }),
  m('m-028', 'p-028', 'Carpenter here. Fixing broken things on the trail, one person at a time. Purpose found.', {
    location_name: 'Helsinki, Finland',
    created_at: '2026-04-18T09:47:00Z',
  }),
  m('m-029', 'p-029', 'Running this albergue for 15 years. Every pilgrim is my grandchild. Every goodbye hurts beautiful.', {
    photo_url: 'https://images.unsplash.com/photo-1506704720897-c6b0b8ef6dba?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'Logroño, Spain',
    created_at: '2026-04-17T18:22:00Z',
  }),
  m('m-030', 'p-030', 'Firefighter on leave. Trading 24-hour shifts for infinite sunrises. This is what I needed.', {
    location_name: 'Vancouver, Canada',
    created_at: '2026-04-17T15:58:00Z',
  }),
  m('m-031', 'p-001', 'Blister on my right heel looks like it has its own blister now. Peak Camino life.', {
    photo_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'Castrojeriz, Spain',
    created_at: '2026-04-17T13:35:00Z',
  }),
  m('m-032', 'p-002', 'Found fresh morels today. Made a butter sauce. The pilgrims wept. This is my religion now.', {
    location_name: 'Conques, France',
    created_at: '2026-04-17T11:09:00Z',
  }),
  m('m-033', 'p-003', 'Light turned golden at 5:47 AM. Camera out immediately. Forgot to eat. No regrets.', {
    photo_url: 'https://images.unsplash.com/photo-1495567720989-cebfbb6ae69e?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'Barcelos, Portugal',
    created_at: '2026-04-16T17:44:00Z',
  }),
  m('m-034', 'p-004', 'Met a 72-year-old today walking her third route. Comparison is a thief of joy but inspiration is free.', {
    location_name: 'Interlaken, Switzerland',
    created_at: '2026-04-16T15:21:00Z',
  }),
  m('m-035', 'p-005', 'Day 93. Still haven\'t checked email. The world is fine without me. Revolutionary.', {
    photo_url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'Burgos, Spain',
    created_at: '2026-04-16T13:08:00Z',
  }),
  m('m-036', 'p-006', 'Nights 452-458. Still finding people worth staying up late to talk to. Trail magic is real.', {
    location_name: 'Santiago de Compostela, Spain',
    created_at: '2026-04-16T10:45:00Z',
  }),
  m('m-037', 'p-007', 'Someone left a handwritten note in the guestbook saying my breakfast changed their day. Worth every sunrise.', {
    photo_url: 'https://images.unsplash.com/photo-1495699810108-5294db051f31?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'Freiburg, Germany',
    created_at: '2026-04-15T17:32:00Z',
  }),
  m('m-038', 'p-008', 'Filled 73 pages in my sketchbook. Every single town gets a drawing. Art is my trail journal.', {
    location_name: 'Florence, Italy',
    created_at: '2026-04-15T15:09:00Z',
  }),
  m('m-039', 'p-009', 'Rain today but the soul still sunny. 1100 nights of practice paying off.', {
    photo_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'O Cebreiro, Spain',
    created_at: '2026-04-15T12:46:00Z',
  }),
  m('m-040', 'p-010', 'Woman at the cafe asked why I don\'t wear shoes. Said my feet look happier. She gets it.', {
    location_name: 'Strasbourg, France',
    created_at: '2026-04-15T10:23:00Z',
  }),
  m('m-041', 'p-011', 'Roman roads under my feet. Roman stones in my mind. History is not past. It\'s now.', {
    photo_url: 'https://images.unsplash.com/photo-1514306688683-266d5d7d6a77?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'Vatican City, Italy',
    created_at: '2026-04-14T17:50:00Z',
  }),
  m('m-042', 'p-012', 'Youngest walked 18km today. Oldest walked 14km. Everyone slept immediately after. Perfect family day.', {
    location_name: 'Nuremberg, Germany',
    created_at: '2026-04-14T15:27:00Z',
  }),
  m('m-043', 'p-013', 'Vegetable garden provided 80% of tonight\'s dinner. Pilgrims ate gratefully. Circle complete.', {
    photo_url: 'https://images.unsplash.com/photo-1464226184679-280f82a809ff?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'Liege, Belgium',
    created_at: '2026-04-14T13:04:00Z',
  }),
  m('m-044', 'p-014', 'First time I was running from something. Second time searching for something. Third time: just walking.', {
    location_name: 'Pamplona, Spain',
    created_at: '2026-04-14T10:41:00Z',
  }),
  m('m-045', 'p-015', 'Physical therapy note: the Camino is 70% mental. Feet are just the excuse to move the mind.', {
    photo_url: 'https://images.unsplash.com/photo-1452626212552-c4b80b537697?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'San Sebastian, Spain',
    created_at: '2026-04-13T16:58:00Z',
  }),
  m('m-046', 'p-016', 'Watched sunrise from a peak after 4-hour climb. No notifications. No distractions. Just me and the horizon.', {
    location_name: 'Zurich, Switzerland',
    created_at: '2026-04-13T14:35:00Z',
  }),
  m('m-047', 'p-017', 'Interviewed a 64-year-old who left everything. Best chapter yet. Real courage in this book.', {
    photo_url: 'https://images.unsplash.com/photo-1483389127117-b6a2102724ae?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'Krakow, Poland',
    created_at: '2026-04-13T12:12:00Z',
  }),
  m('m-048', 'p-018', 'Taught young pilgrims how to read clouds. They actually listened. Sea wisdom still matters.', {
    location_name: 'Aalborg, Denmark',
    created_at: '2026-04-13T09:49:00Z',
  }),
  m('m-049', 'p-019', 'Student texted me asking about medieval economics after seeing my trail photos. This is teaching.', {
    photo_url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'Oxford, United Kingdom',
    created_at: '2026-04-12T17:26:00Z',
  }),
  m('m-050', 'p-020', 'Luna caught a rabbit. Let it go. So did I. We both got the lesson.', {
    location_name: 'Brno, Czech Republic',
    created_at: '2026-04-12T15:03:00Z',
  }),
  m('m-051', 'p-021', 'Running low on nutmeg. Might have to improvise. Disaster averted. Still have paprika and thyme.', {
    photo_url: 'https://images.unsplash.com/photo-1543255785-37d7995686ec?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'Montpellier, France',
    created_at: '2026-04-12T12:40:00Z',
  }),
  m('m-052', 'p-022', 'Morning meditation with 47 pilgrims. The trail is the teacher. The road is the studio. Perfect alignment.', {
    location_name: 'Gothenburg, Sweden',
    created_at: '2026-04-12T10:17:00Z',
  }),
  m('m-053', 'p-023', 'Knees are good. Heart is stronger. Mind is clearer. I\'m just getting started on route 6.', {
    photo_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'Augsburg, Germany',
    created_at: '2026-04-11T17:54:00Z',
  }),
  m('m-054', 'p-024', 'Olive harvest was good. Pressing will be good. Feeding pilgrims will be good. Life cycle beautiful.', {
    location_name: 'Val d\'Orcia, Italy',
    created_at: '2026-04-11T15:31:00Z',
  }),
  m('m-055', 'p-025', 'Video called my parents. They asked if I was coming home. I don\'t know. This feels like home now.', {
    photo_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'Guarda, Portugal',
    created_at: '2026-04-11T13:08:00Z',
  }),
  m('m-056', 'p-026', 'Led a group up Koenigsweg in fog. Couldn\'t see 10 feet. Still the best view of the day.', {
    location_name: 'Salzburg, Austria',
    created_at: '2026-04-11T10:45:00Z',
  }),
  m('m-057', 'p-027', 'Someone asked if the trail is lonely. No. It\'s the opposite of lonely. Full of strangers becoming friends.', {
    photo_url: 'https://images.unsplash.com/photo-1495567720989-cebfbb6ae69e?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'Ponte da Barca, Portugal',
    created_at: '2026-04-10T17:22:00Z',
  }),
  m('m-058', 'p-028', 'Fixed a broken stove at the albergue. Fixed a broken heart with coffee after. Carpenter\'s hands. Healing.', {
    location_name: 'Turku, Finland',
    created_at: '2026-04-10T14:59:00Z',
  }),
  m('m-059', 'p-029', 'Teenage pilgrims from Brazil tonight. Tomorrow they\'ll be somebody else\'s memory. I\'ll hold them anyway.', {
    photo_url: 'https://images.unsplash.com/photo-1495436694665-f32255b98328?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'Santo Domingo de la Calzada, Spain',
    created_at: '2026-04-10T12:36:00Z',
  }),
  m('m-060', 'p-030', 'Training people to fight fires was routine. This is raw. This is real. This is alive.', {
    location_name: 'Calgary, Canada',
    created_at: '2026-04-10T10:13:00Z',
  }),
  m('m-061', 'p-002', 'Breakfast shift: croissants, pain complet, and benedictions. Some pilgrims cry. I understand why now.', {
    location_name: 'Alencon, France',
    created_at: '2026-04-09T17:50:00Z',
  }),
  m('m-062', 'p-004', 'My walking poles are older than some pilgrims. We understand each other now.', {
    photo_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'Bern, Switzerland',
    created_at: '2026-04-09T15:27:00Z',
  }),
  m('m-063', 'p-006', 'Year 2. Everything hurts less. Everything matters more. Perfect equation.', {
    location_name: 'Caldas de Reis, Spain',
    created_at: '2026-04-09T13:04:00Z',
  }),
  m('m-064', 'p-008', 'Drew a portrait of a 79-year-old pilgrim. She cried. I cried. Art is witness to the sacred.', {
    photo_url: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'Siena, Italy',
    created_at: '2026-04-09T10:41:00Z',
  }),
  m('m-065', 'p-010', 'Feet as leather. Soul as silk. Walking without shoes is walking without armor. Love it.', {
    location_name: 'Colmar, France',
    created_at: '2026-04-08T17:58:00Z',
  }),
  m('m-066', 'p-012', 'Eight-year-old asked why walking is better than driving. Spent the next hour trying to explain magic.', {
    photo_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'Bamberg, Germany',
    created_at: '2026-04-08T15:35:00Z',
  }),
  m('m-067', 'p-014', 'Met someone on their first Camino who said they felt lost. Walked with them 6 km. Found each other.', {
    location_name: 'Estella, Spain',
    created_at: '2026-04-08T13:12:00Z',
  }),
  m('m-068', 'p-016', 'No laptop. No wifi. Writing by hand feels revolutionary. Thoughts move slower. They matter more.', {
    photo_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'Lucerne, Switzerland',
    created_at: '2026-04-08T10:49:00Z',
  }),
  m('m-069', 'p-018', 'Organized a sunrise walk for pilgrims. They all showed up. We watched light paint the sky. No words needed.', {
    location_name: 'Randers, Denmark',
    created_at: '2026-04-07T17:26:00Z',
  }),
  m('m-070', 'p-021', 'Tonight: bouillabaisse with white wine and dreams. Tomorrow: feet and horizons. Perfection in backpack form.', {
    photo_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'Avignon, France',
    created_at: '2026-04-07T15:03:00Z',
  }),
  m('m-071', 'p-023', 'Completed route 5. Already planning route 6. Life has direction again.', {
    location_name: 'Konstanz, Germany',
    created_at: '2026-04-07T12:40:00Z',
  }),
  m('m-072', 'p-027', 'Day 28. Wrote in my journal: "The Camino is a permission slip to become yourself."', {
    photo_url: 'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'Viana do Castelo, Portugal',
    created_at: '2026-04-07T10:17:00Z',
  }),
  m('m-073', 'p-029', 'Seventeen years running this place. Every pilgrim writes themselves into the walls. I\'m just the witness.', {
    location_name: 'Nájera, Spain',
    created_at: '2026-04-06T17:54:00Z',
  }),
  m('m-074', 'p-005', 'Day 111. People ask when it ends. I don\'t know. Maybe it doesn\'t. Maybe that\'s the point.', {
    photo_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'Palencia, Spain',
    created_at: '2026-04-06T15:31:00Z',
  }),
  m('m-075', 'p-003', 'Sunset over vineyards. Camera loaded. Memory card full. Heart fuller.', {
    photo_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&fm=webp&q=60',
    location_name: 'Douro Valley, Portugal',
    created_at: '2026-04-06T13:08:00Z',
  }),
];
