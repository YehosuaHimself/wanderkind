/**
 * Static seed hosts — fallback when Supabase returns empty.
 * Real accommodations along major pilgrimage routes.
 */
export const SEED_HOSTS = [
  // Camino Francés
  { id: 'h-001', name: 'Albergue de Peregrinos Roncesvalles', host_type: 'free', lat: 43.009, lng: -1.319, route_id: 'route-camino-frances', route_km: 2, is_available: true, total_hosted: 4500, description: 'Historic pilgrim hostel at the start of the Camino Francés', capacity: 120, country: 'Spain', region: 'Navarra' },
  { id: 'h-002', name: 'Albergue Municipal de Pamplona', host_type: 'donativo', lat: 42.812, lng: -1.645, route_id: 'route-camino-frances', route_km: 65, is_available: true, total_hosted: 3200, description: 'Central municipal hostel in the heart of Pamplona', capacity: 80, country: 'Spain', region: 'Navarra' },
  { id: 'h-003', name: 'Albergue Parroquial de Estella', host_type: 'donativo', lat: 42.671, lng: -2.031, route_id: 'route-camino-frances', route_km: 96, is_available: true, total_hosted: 1800, description: 'Parish albergue with warm community welcome', capacity: 40, country: 'Spain', region: 'Navarra' },
  { id: 'h-004', name: 'Albergue de Peregrinos de Logroño', host_type: 'free', lat: 42.465, lng: -2.450, route_id: 'route-camino-frances', route_km: 153, is_available: true, total_hosted: 2900, description: 'Well-equipped pilgrim hostel in La Rioja capital', capacity: 60, country: 'Spain', region: 'La Rioja' },
  { id: 'h-005', name: 'Albergue Municipal Santo Domingo', host_type: 'donativo', lat: 42.438, lng: -2.952, route_id: 'route-camino-frances', route_km: 191, is_available: true, total_hosted: 2100, description: 'Beautiful old town albergue', capacity: 45, country: 'Spain', region: 'La Rioja' },
  { id: 'h-006', name: 'Albergue Casa del Cubo, Burgos', host_type: 'free', lat: 42.344, lng: -3.697, route_id: 'route-camino-frances', route_km: 282, is_available: true, total_hosted: 3800, description: 'Central Burgos hostel near the cathedral', capacity: 50, country: 'Spain', region: 'Castilla y León' },
  { id: 'h-007', name: 'Albergue Parroquial de Carrión', host_type: 'donativo', lat: 42.338, lng: -4.601, route_id: 'route-camino-frances', route_km: 358, is_available: true, total_hosted: 1500, description: 'Parish-run hostel with communal meals', capacity: 35, country: 'Spain', region: 'Castilla y León' },
  { id: 'h-008', name: 'Albergue de Peregrinos de León', host_type: 'free', lat: 42.599, lng: -5.567, route_id: 'route-camino-frances', route_km: 468, is_available: true, total_hosted: 4200, description: 'Large modern hostel in the historic city', capacity: 100, country: 'Spain', region: 'Castilla y León' },
  { id: 'h-009', name: 'Albergue Hospital de Órbigo', host_type: 'donativo', lat: 42.461, lng: -5.880, route_id: 'route-camino-frances', route_km: 497, is_available: true, total_hosted: 1200, description: 'Charming village hostel by the medieval bridge', capacity: 30, country: 'Spain', region: 'Castilla y León' },
  { id: 'h-010', name: 'Albergue de O Cebreiro', host_type: 'free', lat: 42.694, lng: -7.042, route_id: 'route-camino-frances', route_km: 620, is_available: true, total_hosted: 2600, description: 'Mountain refuge at the legendary pass into Galicia', capacity: 55, country: 'Spain', region: 'Galicia' },
  { id: 'h-011', name: 'Albergue Municipal de Sarria', host_type: 'free', lat: 42.774, lng: -7.414, route_id: 'route-camino-frances', route_km: 666, is_available: true, total_hosted: 5100, description: 'Starting point for the final 100km to Santiago', capacity: 90, country: 'Spain', region: 'Galicia' },
  { id: 'h-012', name: 'Seminario Menor, Santiago', host_type: 'donativo', lat: 42.878, lng: -8.544, route_id: 'route-camino-frances', route_km: 780, is_available: true, total_hosted: 6000, description: 'Final destination hostel near the Cathedral', capacity: 150, country: 'Spain', region: 'Galicia' },

  // Camino Portugués
  { id: 'h-020', name: 'Albergue de Porto', host_type: 'donativo', lat: 41.149, lng: -8.611, route_id: 'route-camino-portugues', route_km: 0, is_available: true, total_hosted: 2800, description: 'Starting point hostel in beautiful Porto', capacity: 60, country: 'Portugal', region: 'Porto' },
  { id: 'h-021', name: 'Albergue de Barcelos', host_type: 'free', lat: 41.532, lng: -8.614, route_id: 'route-camino-portugues', route_km: 44, is_available: true, total_hosted: 1600, description: 'Hostel in the famous market town', capacity: 40, country: 'Portugal', region: 'Braga' },
  { id: 'h-022', name: 'Albergue de Ponte de Lima', host_type: 'donativo', lat: 41.767, lng: -8.584, route_id: 'route-camino-portugues', route_km: 72, is_available: true, total_hosted: 1200, description: 'Beautiful riverside town hostel', capacity: 35, country: 'Portugal', region: 'Viana do Castelo' },
  { id: 'h-023', name: 'Albergue de Valença', host_type: 'free', lat: 42.027, lng: -8.642, route_id: 'route-camino-portugues', route_km: 115, is_available: true, total_hosted: 1800, description: 'Border town hostel with views of Spain', capacity: 45, country: 'Portugal', region: 'Viana do Castelo' },
  { id: 'h-024', name: 'Albergue de Tui', host_type: 'donativo', lat: 42.047, lng: -8.645, route_id: 'route-camino-portugues', route_km: 117, is_available: true, total_hosted: 2100, description: 'Cathedral town on the Spanish side', capacity: 50, country: 'Spain', region: 'Galicia' },

  // Via Francigena
  { id: 'h-030', name: 'Ostello Via Francigena Fidenza', host_type: 'donativo', lat: 44.866, lng: 10.061, route_id: 'route-via-francigena', route_km: 850, is_available: true, total_hosted: 800, description: 'Pilgrim hostel on the Italian section', capacity: 25, country: 'Italy', region: 'Emilia-Romagna' },
  { id: 'h-031', name: 'Ostello San Miniato', host_type: 'donativo', lat: 43.681, lng: 10.851, route_id: 'route-via-francigena', route_km: 1050, is_available: true, total_hosted: 600, description: 'Hilltop town hostel with Tuscan views', capacity: 20, country: 'Italy', region: 'Tuscany' },
  { id: 'h-032', name: 'Ostello di Siena', host_type: 'free', lat: 43.318, lng: 11.331, route_id: 'route-via-francigena', route_km: 1200, is_available: true, total_hosted: 1200, description: 'Beautiful medieval city hostel', capacity: 40, country: 'Italy', region: 'Tuscany' },
  { id: 'h-033', name: 'Ostello San Lorenzo Bolsena', host_type: 'donativo', lat: 42.645, lng: 11.986, route_id: 'route-via-francigena', route_km: 1450, is_available: true, total_hosted: 500, description: 'Lakeside hostel in peaceful Bolsena', capacity: 18, country: 'Italy', region: 'Lazio' },
  { id: 'h-034', name: 'Ospitale del Pellegrino Roma', host_type: 'donativo', lat: 41.898, lng: 12.476, route_id: 'route-via-francigena', route_km: 1900, is_available: true, total_hosted: 2200, description: 'Final destination hostel near St Peter\'s', capacity: 60, country: 'Italy', region: 'Lazio' },

  // Königsweg
  { id: 'h-040', name: 'Pilgerherberge Salzburg', host_type: 'donativo', lat: 47.800, lng: 13.044, route_id: 'route-koenigsweg', route_km: 0, is_available: true, total_hosted: 400, description: 'Starting point in Mozart\'s birthplace', capacity: 20, country: 'Austria', region: 'Salzburg' },
  { id: 'h-041', name: 'Berghütte Lofer', host_type: 'paid', lat: 47.585, lng: 12.692, route_id: 'route-koenigsweg', route_km: 45, is_available: true, total_hosted: 300, description: 'Mountain hut in the Loferer Steinberge', capacity: 15, country: 'Austria', region: 'Salzburg' },
  { id: 'h-042', name: 'Pilgerherberge St Johann', host_type: 'donativo', lat: 47.524, lng: 12.425, route_id: 'route-koenigsweg', route_km: 85, is_available: true, total_hosted: 350, description: 'Charming Tyrolean village pilgrimage hostel', capacity: 18, country: 'Austria', region: 'Tirol' },
  { id: 'h-043', name: 'Gasthof Kitzbühel', host_type: 'paid', lat: 47.449, lng: 12.392, route_id: 'route-koenigsweg', route_km: 120, is_available: true, total_hosted: 250, description: 'Traditional guesthouse in the famous ski town', capacity: 12, country: 'Austria', region: 'Tirol' },

  // Belgium
  { id: 'h-050', name: 'Gîte de Pèlerin Namur', host_type: 'donativo', lat: 50.465, lng: 4.867, route_id: 'route-st-jacques-belgium', route_km: 60, is_available: true, total_hosted: 500, description: 'Pilgrim shelter along the Belgian Camino', capacity: 12, country: 'Belgium', region: 'Wallonia' },
  { id: 'h-051', name: 'Refuge de Dinant', host_type: 'donativo', lat: 50.260, lng: 4.912, route_id: 'route-st-jacques-belgium', route_km: 85, is_available: true, total_hosted: 380, description: 'Riverside shelter in picturesque Dinant', capacity: 10, country: 'Belgium', region: 'Wallonia' },

  // Via Podiensis
  { id: 'h-060', name: 'Gîte Le Puy-en-Velay', host_type: 'donativo', lat: 45.043, lng: 3.885, route_id: 'route-via-podiensis', route_km: 0, is_available: true, total_hosted: 2800, description: 'Starting point of the GR65', capacity: 50, country: 'France', region: 'Auvergne' },
  { id: 'h-061', name: 'Gîte de Conques', host_type: 'donativo', lat: 44.599, lng: 2.398, route_id: 'route-via-podiensis', route_km: 210, is_available: true, total_hosted: 1900, description: 'Medieval village with stunning abbey', capacity: 30, country: 'France', region: 'Aveyron' },
  { id: 'h-062', name: 'Gîte de Cahors', host_type: 'free', lat: 44.449, lng: 1.441, route_id: 'route-via-podiensis', route_km: 380, is_available: true, total_hosted: 1500, description: 'Historic city on the Lot river', capacity: 35, country: 'France', region: 'Lot' },
  { id: 'h-063', name: 'Gîte de Moissac', host_type: 'donativo', lat: 44.105, lng: 1.085, route_id: 'route-via-podiensis', route_km: 480, is_available: true, total_hosted: 1200, description: 'Beautiful cloister town shelter', capacity: 28, country: 'France', region: 'Tarn-et-Garonne' },

  // Camino Primitivo
  { id: 'h-070', name: 'Albergue de Oviedo', host_type: 'free', lat: 43.362, lng: -5.845, route_id: 'route-camino-primitivo', route_km: 0, is_available: true, total_hosted: 1600, description: 'Starting point of the original Way', capacity: 40, country: 'Spain', region: 'Asturias' },
  { id: 'h-071', name: 'Albergue de Tineo', host_type: 'donativo', lat: 43.331, lng: -6.418, route_id: 'route-camino-primitivo', route_km: 55, is_available: true, total_hosted: 800, description: 'Mountain village albergue', capacity: 25, country: 'Spain', region: 'Asturias' },
  { id: 'h-072', name: 'Albergue Grandas de Salime', host_type: 'free', lat: 43.221, lng: -6.870, route_id: 'route-camino-primitivo', route_km: 102, is_available: true, total_hosted: 600, description: 'Remote mountain hostel', capacity: 20, country: 'Spain', region: 'Asturias' },
];
