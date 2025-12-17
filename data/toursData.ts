
import { Tour } from '../types';

export const STATIC_TOURS: Tour[] = [
  // ==========================================
  // MADRID (ENRICHED TO 8 STOPS)
  // ==========================================
  {
    id: 'mad-1',
    city: 'Madrid',
    title: 'Madrid: Leyendas, Crímenes y Secretos Reales',
    description: 'Olvídate de las guías aburridas. Este es el Madrid que no te cuentan en el colegio: pasadizos secretos, palacios malditos y el rastro de la Inquisición.',
    duration: '3.5h',
    distance: '5.5 km',
    difficulty: 'Moderate',
    theme: 'History',
    isSponsored: false,
    isRichDescription: true,
    safetyTip: "Ojo con los carteristas en la Puerta del Sol.",
    wifiTip: "La Biblioteca de la calle Conde Duque tiene el mejor wifi gratis de la zona.",
    stops: [
      { 
        id: 'm1', 
        name: 'Palacio Real', 
        description: '[HOOK] El palacio que nació de las cenizas de un misterioso fuego.\n[STORY] En la Nochebuena de 1734, el antiguo Alcázar ardió por completo. Las malas lenguas dicen que Felipe V, que odiaba el viejo castillo oscuro, "se olvidó" de avisar a los bomberos para construir este Versalles madrileño.\n[SECRET] Hay un túnel secreto que conecta el palacio con la cercana estación de Príncipe Pío para huidas de emergencia.\n[SMART_TIP] Ve al mirador de la Catedral de la Almudena (justo enfrente) para la mejor foto aérea sin pagar la entrada al palacio.', 
        latitude: 40.4180, longitude: -3.7100, type: 'historical', visited: false, isRichInfo: true, curiosity: "Es el palacio real más grande de Europa Occidental.",
        photoShot: {
            angle: "Sitúate en la Plaza de la Armería, agáchate y usa un gran angular para capturar toda la fachada simétrica.",
            bestTime: "Atardecer (Hora Dorada)",
            instagramHook: "Viviendo mi propio cuento real en Madrid 👑🏰 #MadridSecrets #RoyalPalace",
            milesReward: 100
        }
      },
      { 
        id: 'm2', name: 'Plaza de la Villa', description: '[HOOK] El último rincón del Madrid medieval.\n[STORY] Aquí el tiempo se detuvo en el siglo XV. Verás tres edificios de tres siglos distintos conviviendo en perfecta armonía.\n[SECRET] En la Torre de los Lujanes estuvo prisionero el mismísimo Rey de Francia, Francisco I, tras ser capturado en Pavía.\n[SMART_TIP] Fíjate en el suelo: los adoquines guardan el diseño original de la villa.', latitude: 40.4153, longitude: -3.7103, type: 'historical', visited: false, isRichInfo: true, curiosity: "Era el antiguo ayuntamiento de la ciudad.",
        photoShot: {
            angle: "Desde la entrada de la calle del Codo, encuadrando la Torre de los Lujanes.",
            bestTime: "Mañana temprano",
            instagramHook: "Donde el tiempo se detuvo en Madrid ⏳🛡️ #OldMadrid #MedievalVibes",
            milesReward: 75
        }
      },
      { 
        id: 'm3', name: 'Plaza de San Ginés', description: '[HOOK] Churros con historia y pasadizos bajo la iglesia.\n[STORY] No es solo chocolate; es una institución desde 1894. Escritores como Valle-Inclán se inspiraron en este callejón oscuro.\n[SECRET] Se dice que bajo la iglesia de San Ginés hay una red de catacumbas que conectaban con el Palacio.\n[SMART_TIP] Evita las horas punta (6 PM - 8 PM) o prepárate para una cola legendaria.', latitude: 40.4167, longitude: -3.7063, type: 'food', visited: false, isRichInfo: true, curiosity: "Vende más de 5,000 churros al día.",
        photoShot: {
            angle: "Primer plano de los churros con el fondo desenfocado del icónico mostrador verde.",
            bestTime: "Cualquier hora (interior acogedor)",
            instagramHook: "El desayuno de los campeones (y de los literatos) ☕️🥖 #SanGines #ChurrosTime",
            milesReward: 120
        }
      },
      { id: 'm4', name: 'Plaza Mayor', description: '[HOOK] De mercado de pan a centro de ejecuciones públicas.\n[STORY] Lo que hoy es alegría y calamares, antes era el escenario de los Autos de Fe de la Inquisición y corridas de toros reales.\n[SECRET] El Arco de Cuchilleros tiene esa forma porque sirve para salvar el enorme desnivel entre la plaza y el mercado exterior.\n[SMART_TIP] Fíjate en la Casa de la Panadería: los frescos de la fachada tienen figuras mitológicas escondidas.', latitude: 40.4155, longitude: -3.7074, type: 'historical', visited: false, isRichInfo: true, curiosity: "Se ha quemado tres veces a lo largo de su historia.",
        photoShot: {
            angle: "Bajo los arcos de la Casa de la Panadería, buscando la estatua de Felipe III en el centro.",
            bestTime: "Anochecer con las luces encendidas",
            instagramHook: "Bajo los arcos de la historia madrileña 🥨🇪🇸 #PlazaMayor #MadridCity",
            milesReward: 80
        }
      },
      { id: 'm5', name: 'Calle del Codo', description: '[HOOK] El callejón más estrecho y silencioso de Madrid.\n[STORY] Un recodo que parece sacado de una película de espadachines del Siglo de Oro.\n[SECRET] En el convento adyacente, las monjas jerónimas venden dulces artesanos a través de un torno.\n[SMART_TIP] Es el sitio perfecto para una foto "vintage" sin gente de fondo.', latitude: 40.4156, longitude: -3.7110, type: 'photo', visited: false, isRichInfo: true, curiosity: "Se llama así por su forma de ángulo recto.",
        photoShot: {
            angle: "Justo en el codo de la calle, capturando la estrechez de los muros de piedra.",
            bestTime: "Día (luz suave)",
            instagramHook: "Perdido en el laberinto del Siglo de Oro 🕯️🗡️ #SecretMadrid #HiddenGems",
            milesReward: 150
        }
      },
      { id: 'm6', name: 'Restaurante Botín', description: '[HOOK] El restaurante más antiguo del mundo según el Guinness.\n[KEY INSIGHT] Goya trabajó aquí fregando platos antes de ser famoso. Hemingway tenía su propia mesa.\n[SECRET] El horno de leña no se ha apagado ni una sola vez desde 1725, ni siquiera durante la Guerra Civil.\n[SMART_TIP] Puedes asomarte a la ventana para ver los cochinillos asándose en directo.', latitude: 40.4135, longitude: -3.7075, type: 'historical', visited: false, isRichInfo: true, curiosity: "Hemingway escribió sobre este sitio en 'Fiesta'.",
        photoShot: {
            angle: "Fachada exterior mostrando el letrero de 'Casa Botín' y la placa del Guinness.",
            bestTime: "Noche",
            instagramHook: "Cenando con la historia desde 1725 🍽️🍷 #RestauranteBotin #HistoryLovers",
            milesReward: 90
        }
      },
      { id: 'm7', name: 'Plaza de Santa Cruz', description: '[HOOK] La antigua cárcel de la Corte.\n[STORY] Donde hoy está el Ministerio de Asuntos Exteriores, antes se oían los gritos de los presos más famosos de la villa.\n[SECRET] El reloj de la fachada es uno de los más precisos y antiguos del centro.\n[SMART_TIP] Busca la estatua de Carlos III en Sol, está a solo 2 minutos a pie.', latitude: 40.4145, longitude: -3.7055, type: 'historical', visited: false, isRichInfo: true, curiosity: "Era la sede del tribunal de justicia.",
        photoShot: {
            angle: "Plano medio de la fuente con el palacio rojo de fondo.",
            bestTime: "Tarde",
            instagramHook: "Rincones con alma en el centro de Madrid ⛲️🚩 #SantaCruz #TravelMadrid",
            milesReward: 70
        }
      },
      { id: 'm8', name: 'Puerta del Sol', description: '[HOOK] El kilómetro cero de todas las carreteras españolas.\n[STORY] Epicentro de revoluciones y uvas de fin de año. Aquí ocurrió el levantamiento contra Napoleón el 2 de mayo.\n[SECRET] El Oso y el Madroño cambiaron de sitio varias veces por las obras interminables de la plaza.\n[SMART_TIP] Busca la placa del KM 0 en el suelo frente a la Casa de Correos; ¡pisa encima para volver a Madrid!', latitude: 40.4169, longitude: -3.7035, type: 'historical', visited: false, isRichInfo: true, curiosity: "El reloj de Sol es el más famoso de toda España.",
        photoShot: {
            angle: "A la altura del suelo enfocando la placa del KM 0 con tus pies sobre ella.",
            bestTime: "Mediodía (para ver bien la placa)",
            instagramHook: "Donde todos los caminos comienzan 👣📍 #KM0 #PuertaDelSol",
            milesReward: 100
        }
      }
    ]
  },

  // ==========================================
  // MIAMI (ENRICHED TO 8 STOPS)
  // ==========================================
  {
    id: 'mia-1',
    city: 'Miami',
    title: 'Miami: Narcos, Neon & The Real Art Deco',
    description: 'Beyond the palm trees and parties, Miami hides a gritty history of mafia, revolution, and the birth of cool.',
    duration: '3h',
    distance: '6 km',
    difficulty: 'Moderate',
    theme: 'History',
    isSponsored: false,
    isRichDescription: true,
    safetyTip: "Stay on the main streets of South Beach after midnight.",
    wifiTip: "Lincoln Road Mall has multiple public high-speed hotspots.",
    stops: [
      { id: 'mia1', name: 'The Versace Mansion', description: '[HOOK] The steps where high fashion and dark fate met.\n[STORY] Gianni Versace was shot here in 1997. The mansion is a temple to excess, with gold-lined pools and secret symbols.\n[SECRET] Look closely at the gates: the Medusa head is designed to "ward off evil" (ironically).\n[SMART_TIP] Best photo angle is from across the street at the park entrance to get the whole facade.', latitude: 25.7830, longitude: -80.1300, type: 'historical', visited: false, isRichInfo: true, curiosity: "The pool tiles are 24k gold.",
        photoShot: {
            angle: "From across Ocean Drive, perfectly centered with the front gates.",
            bestTime: "Morning (avoiding the crowds)",
            instagramHook: "Glamour, tragedy, and gold 🔱🖤 #VersaceMansion #MiamiBeach",
            milesReward: 150
        }
      },
      { id: 'mia2', name: 'Colony Hotel', description: '[HOOK] The neon heartbeat of Ocean Drive.\n[STORY] Built in 1935, this is the most photographed Art Deco hotel in the world.\n[SECRET] During WWII, the hotel was used as a barracks for soldiers training on the beach.\n[SMART_TIP] Come back at night when the blue neon is lit for the iconic "Miami Vice" shot.', latitude: 25.7790, longitude: -80.1310, type: 'photo', visited: false, isRichInfo: true, curiosity: "It was one of the first to use neon signage.",
        photoShot: {
            angle: "Low angle from the sidewalk looking up at the neon sign.",
            bestTime: "Blue Hour (just after sunset)",
            instagramHook: "Neon dreams on Ocean Drive 💎🌃 #ArtDeco #MiamiNights",
            milesReward: 120
        }
      },
      { id: 'mia3', name: 'Espanola Way', description: '[HOOK] A slice of old-world Europe in the Caribbean.\n[STORY] Designed as an artists\' colony in the 20s. Al Capone spent a lot of time gambling here.\n[SECRET] The Clay Hotel here used to be a hub for underground poker games during Prohibition.\n[SMART_TIP] Great spot for a hidden lunch; try the sangria at any corner cafe.', latitude: 25.7865, longitude: -80.1330, type: 'culture', visited: false, isRichInfo: true, curiosity: "Modeled after Mediterranean villages.",
        photoShot: {
            angle: "Middle of the street looking down the string-light alley.",
            bestTime: "Afternoon",
            instagramHook: "Finding a little bit of Europe in the 305 🇪🇸🌴 #EspanolaWay #MiamiGems",
            milesReward: 100
        }
      },
      { id: 'mia4', name: 'The Carlyle', description: '[HOOK] Hollywood\'s favorite backdrop.\n[STORY] You might recognize this from "The Birdcage" or "Bad Boys". It\'s a true Deco masterpiece.\n[SECRET] It has remained virtually unchanged since 1939.\n[SMART_TIP] The terrace is expensive, but you can snap a pic of the lobby for free.', latitude: 25.7825, longitude: -80.1305, type: 'art', visited: false, isRichInfo: true, curiosity: "Featured in over 50 movies.",
        photoShot: {
            angle: "Sideways angle capturing the vertical neon nameplate.",
            bestTime: "Sunset",
            instagramHook: "The Birdcage vibe is real 🦜🎬 #TheCarlyle #MovieMagic",
            milesReward: 110
        }
      },
      { id: 'mia5', name: 'Lummus Park', description: '[HOOK] Where the city meets the ocean.\n[STORY] This park saved the beach from becoming a wall of high-rises.\n[SECRET] There are hidden vintage gym machines from the 70s still tucked away in the trees.\n[SMART_TIP] Use the bike path for a faster transition between stops.', latitude: 25.7795, longitude: -80.1300, type: 'nature', visited: false, isRichInfo: true, curiosity: "Host of the famous volleyball tournaments.",
        photoShot: {
            angle: "Sitting on a lifeguard stand (if available) or by the winding pathway.",
            bestTime: "Midday (bright colors)",
            instagramHook: "Ocean air, salty hair 🌊🌴 #SouthBeach #LummusPark",
            milesReward: 80
        }
      },
      { id: 'mia6', name: 'Wolfsonian-FIU', description: '[HOOK] Propaganda and the power of design.\n[STORY] A museum inside an old storage warehouse with incredible artifacts from the industrial era.\n[SECRET] The massive fountain in the lobby was moved here from an old hotel in Pennsylvania.\n[SMART_TIP] They have an amazing design bookstore that is free to visit.', latitude: 25.7800, longitude: -80.1330, type: 'culture', visited: false, isRichInfo: true, curiosity: "Houses over 200,000 objects.",
        photoShot: {
            angle: "Front facade showing the massive industrial doors.",
            bestTime: "Cloudy day (better for stone textures)",
            instagramHook: "Design matters 📐⚙️ #Wolfsonian #MiamiHistory",
            milesReward: 90
        }
      },
      { id: 'mia7', name: 'Clevelander Hotel', description: '[HOOK] The party that never stopped since the 30s.\n[STORY] An icon of Streamline Moderne architecture with its pool-centric courtyard.\n[SECRET] They were one of the first hotels to offer "air conditioning" in Miami.\n[SMART_TIP] Go to the rooftop bar (C-Level) for the best views of the Atlantic.', latitude: 25.7815, longitude: -80.1308, type: 'culture', visited: false, isRichInfo: true, curiosity: "Renovated in 2009 for $15 million.",
        photoShot: {
            angle: "From the second-floor balcony looking down at the pool crowd.",
            bestTime: "Night",
            instagramHook: "The pulse of Ocean Drive 🍹🏊‍♂️ #Clevelander #MiamiLife",
            milesReward: 100
        }
      },
      { id: 'mia8', name: 'Art Deco Welcome Center', description: '[HOOK] Where the past is protected.\n[STORY] The hub of the preservation league that saved South Beach from demolition in the 70s.\n[SECRET] Check the map inside for the "ghost hotels" that were torn down before the laws changed.\n[SMART_TIP] Grab the free Art Deco walking map here to supplement your Bdai experience.', latitude: 25.7810, longitude: -80.1302, type: 'historical', visited: false, isRichInfo: true, curiosity: "Located in a 1950s public restroom building!",
        photoShot: {
            angle: "Close-up of the vintage maps inside or the building's circular entrance.",
            bestTime: "Anytime",
            instagramHook: "Saving the skyline one neon sign at a time 🏙️✨ #ArtDecoDistrict #MiamiHistory",
            milesReward: 130
        }
      }
    ]
  }
];
