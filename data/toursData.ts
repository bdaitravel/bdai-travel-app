
import { Tour } from '../types';

export const STATIC_TOURS: Tour[] = [
  {
    id: 'mad-1',
    city: 'Madrid',
    title: 'Madrid: El Corazón de los Austrias y sus Sombras Imperiales',
    description: 'Sumérgete en un viaje épico a través del tiempo en el que recorrerás el Madrid de los siglos XVI y XVII. Desde las intrigas palaciegas en el Alcázar hasta los duelos de honor en el Barrio de las Letras, esta ruta te desvela por qué Madrid pasó de ser un pueblo manchego a la capital de un imperio global.',
    duration: '5h',
    distance: '6.8 km',
    difficulty: 'Moderate',
    theme: 'History & Legends',
    isSponsored: false,
    safetyTip: "Mantén tu mochila hacia adelante en Sol y Plaza Mayor para evitar descuideros.",
    wifiTip: "Busca los puntos 'Madrid-WiFi' en el mobiliario urbano.",
    stops: [
      { 
        id: 'm1', 
        name: 'Palacio Real y Plaza de la Armería', 
        description: '[HOOK] El gigante de granito que nació de un incendio "oportuno" y una maldición de estatuas.\n\n[STORY] El actual Palacio Real se levanta sobre las cenizas del Antiguo Alcázar, que ardió misteriosamente en la Nochebuena de 1734. Felipe V, el primer Borbón, vio en las llamas la oportunidad de borrar el pasado de los Austrias y construir un "Versalles" madrileño de 3.418 habitaciones.\n\n[SECRET] Mira las estatuas de la Plaza de Oriente. Originalmente iban en la cornisa del Palacio, pero la Reina Isabel de Farnesio tuvo una pesadilla en la que un terremoto las hacía caer sobre su cabeza, ordenando bajarlas de inmediato.', 
        latitude: 40.4180, longitude: -3.7100, type: 'historical', visited: false, isRichInfo: true, curiosity: "Es el palacio real en uso más grande de Europa Occidental.",
        photoSpot: { angle: "Desde los Jardines de Sabatini", bestTime: "Atardecer", instagramHook: "Madrid's Royal Golden Hour", milesReward: 120 }
      },
      { 
        id: 'm2', 
        name: 'Plaza de la Villa y Torre de los Lujanes', 
        description: '[HOOK] El rincón donde un rey francés durmió bajo llave y el tiempo se detuvo en el siglo XV.\n\n[STORY] Esta plaza es el corazón del Madrid medieval. Aquí conviven tres edificios clave: la Casa de la Villa, la Casa de Cisneros y la Torre de los Lujanes, el edificio civil más antiguo de la ciudad.\n\n[SECRET] Tras la Batalla de Pavía en 1525, el Rey Francisco I de Francia fue traído prisionero a Madrid. La leyenda cuenta que estuvo recluido en la Torre de los Lujanes. Su orgullo herido fue tal que al regresar a Francia mandó construir el Castillo de Chambord para superar a Carlos V.', 
        latitude: 40.4153, longitude: -3.7103, type: 'historical', visited: false, isRichInfo: true, curiosity: "La torre tiene una de las pocas portadas mudéjares originales de Madrid.",
        photoSpot: { angle: "Encuadre desde el Callejón del Codo", bestTime: "Mañana", instagramHook: "Madrid Medieval Vibes", milesReward: 80 } 
      },
      { 
        id: 'm3', 
        name: 'Mercado de San Miguel', 
        description: '[HOOK] Una catedral de hierro y cristal erigida sobre la tumba de una iglesia milenaria.\n\n[STORY] Inaugurado en 1916 como mercado de abastos, hoy es el templo gastronómico por excelencia. Su estructura de hierro fundido es la única que sobrevive en Madrid tras el desmantelamiento de otros mercados similares.\n\n[SECRET] El mercado ocupa el solar de la iglesia de San Miguel de los Octoes, donde fue bautizado Lope de Vega. Si entras a las bodegas (privadas), aún se pueden ver restos de la antigua cripta medieval entre botellas de vermut.', 
        latitude: 40.4155, longitude: -3.7090, type: 'food', visited: false, isRichInfo: true, curiosity: "Recibe a más de 10 millones de visitantes al año.",
        photoSpot: { angle: "Cerca de los puestos centrales mirando el techo", bestTime: "Noche", instagramHook: "Gourmet Madrid Cathedral", milesReward: 60 } 
      },
      { 
        id: 'm4', 
        name: 'Plaza Mayor y el Caballo de los Pajaritos', 
        description: '[HOOK] El gran escenario de la Villa, desde ejecuciones de la Inquisición hasta el misterio de los huesos de pájaro.\n\n[STORY] Diseñada por Juan de Herrera y terminada en 1620, ha sido mercado, plaza de toros y lugar de autos de fe. La estatua ecuestre de Felipe III preside el centro.\n\n[SECRET] Durante siglos, la boca del caballo de la estatua estaba abierta. Cientos de gorriones se colaban dentro pero no podían salir por la estrechez del cuello. Al ser derribada en la República, se descubrieron miles de pequeños esqueletos de aves en su vientre. Hoy la boca está sellada.', 
        latitude: 40.4154, longitude: -3.7074, type: 'historical', visited: false, isRichInfo: true, curiosity: "Bajo sus soportales se encuentra Sobrino de Botín, el restaurante más antiguo del mundo.",
        photoSpot: { angle: "Bajo el Arco de Cuchilleros", bestTime: "Tarde", instagramHook: "Plaza Mayor Secrets", milesReward: 90 } 
      },
      { 
        id: 'm5', 
        name: 'Puerta del Sol y el Reloj de las Cuatro "I"', 
        description: '[HOOK] El kilómetro cero de un imperio y el reloj que se "equivoca" por tradición.\n\n[STORY] Aquí se encuentra la placa del Kilómetro Cero y la famosa estatua del Oso y el Madroño. Pero el verdadero protagonista es el reloj de la Casa de Correos.\n\n[SECRET] Si miras el reloj, el número 4 romano está escrito como "IIII" en lugar de "IV". No es un error; era una convención estética de la relojería antigua para equilibrar el peso visual con el "VIII" del lado opuesto. El relojero encargado vive justo encima para no fallar jamás en Nochevieja.', 
        latitude: 40.4169, longitude: -3.7035, type: 'historical', visited: false, isRichInfo: true, curiosity: "En los cimientos de la plaza hay restos de la antigua iglesia del Buen Suceso.",
        photoSpot: { angle: "Frente a la estatua del Oso", bestTime: "Cualquiera", instagramHook: "Madrid's Kilometer Zero", milesReward: 50 } 
      },
      { 
        id: 'm6', 
        name: 'Barrio de las Letras y la Tumba de Cervantes', 
        description: '[HOOK] Donde los poetas se retaban a duelo y las palabras se grabaron con oro en el suelo.\n\n[STORY] Aquí vivieron Lope de Vega, Quevedo y Góngora en una rivalidad feroz. Se dedicaban poemas insultantes y trataban de desahuciarse mutuamente de sus casas por puro odio intelectual.\n\n[SECRET] En la Iglesia de las Trinitarias Descalzas reposan los restos de Miguel de Cervantes. Fueron redescubiertos apenas en 2015 en una cripta olvidada, marcados con las iniciales "M.C." en un ataúd de madera podrida.', 
        latitude: 40.4140, longitude: -3.6980, type: 'culture', visited: false, isRichInfo: true, curiosity: "Es el barrio con más citas literarias por metro cuadrado en el pavimento.",
        photoSpot: { angle: "Detalle de los versos dorados en Calle Huertas", bestTime: "Día", instagramHook: "Literary Gold Madrid", milesReward: 70 } 
      }
    ]
  },
  {
    id: 'par-1',
    city: 'Paris',
    title: 'Paris: Cinematic City (Film & TV Locations)',
    description: 'Explore the iconic sets of Amélie, Inception, and Emily in Paris. Discover why the City of Light is the ultimate backdrop for legendary storytellers.',
    duration: '4.5h',
    distance: '7.2 km',
    difficulty: 'Easy',
    theme: 'Cinema & Arts',
    isSponsored: false,
    stops: [
      { 
        id: 'p1', 
        name: 'Café des Deux Moulins', 
        description: '[HOOK] The corner where Amélie Poulain\'s fate was simmered to perfection.\n\n[STORY] This real Montmartre café became a pilgrimage site after the 2001 film. It still retains the Art Deco interior and the tobacco counter where Georgette worked.\n\n[SECRET] Look for the "Amélie box" in the restroom—a tiny shrine left by fans. Also, the name "Deux Moulins" refers to the nearby Moulin Rouge and Moulin de la Galette, both survivors of the hill\'s once-numerous windmills.', 
        latitude: 48.8833, longitude: 2.3340, type: 'culture', visited: false, isRichInfo: true, 
        photoSpot: { angle: "From the sidewalk catching the red awning", bestTime: "Morning", instagramHook: "Amélie's Real Cafe", milesReward: 80 } 
      },
      { 
        id: 'p2', 
        name: 'Pont de Bir-Hakeim', 
        description: '[HOOK] The dreamlike steel bridge where "Inception" blurred the lines of reality.\n\n[STORY] Famous for its dual-level structure (metro above, cars/bikes below), this bridge offers the most dramatic symmetrical view of the Eiffel Tower. It has appeared in everything from "Last Tango in Paris" to "Mission Impossible".\n\n[SECRET] The central "belvedere" on the bridge features a statue called "France Renaissance" which marks the exact spot where the secret staircase leads down to the Île aux Cygnes, the island where a mini Statue of Liberty hides.', 
        latitude: 48.8557, longitude: 2.2878, type: 'art', visited: false, isRichInfo: true, 
        photoSpot: { angle: "Symmetrical perspective through the steel columns", bestTime: "Sunrise", instagramHook: "Inception Bridge Paris", milesReward: 100 } 
      },
      { 
        id: 'p3', 
        name: 'Shakespeare and Company', 
        description: '[HOOK] A sanctuary for literary wanderers and the star of "Before Sunset".\n\n[STORY] While the current shop opened in 1951, it inherited the spirit of Sylvia Beach\'s original bookstore. Hemingway and Joyce used to haunt these shelves. It remains a "Tumbleweed" hostel where writers sleep for free in exchange for work.\n\n[SECRET] Inside, there is a "hidden" library upstairs and a wishing well in the floorboards where travelers drop coins from all over the world. Also, watch out for "Aggie", the bookstore cat who often sleeps on rare first editions.', 
        latitude: 48.8525, longitude: 2.3471, type: 'culture', visited: false, isRichInfo: true, 
        photoSpot: { angle: "Exterior with the iconic green facade", bestTime: "Afternoon", instagramHook: "Paris Book Heaven", milesReward: 70 } 
      },
      { 
        id: 'p4', 
        name: 'Place de l\'Estrapade', 
        description: '[HOOK] The chic heart of "Emily in Paris" and a dark site of medieval justice.\n\n[STORY] Today, it\'s known as the location of Emily Cooper\'s apartment and Gabriel\'s restaurant (Terra Nera). It’s the epitome of Left Bank charm.\n\n[SECRET] The square\'s name "Estrapade" refers to a brutal form of torture used here in the Middle Ages to punish deserters. The contrast between its dark history and the "Pink City" aesthetic of the show is Paris\'s greatest irony.', 
        latitude: 48.8450, longitude: 2.3451, type: 'culture', visited: false, isRichInfo: true, 
        photoSpot: { angle: "By the fountain looking at the bakery", bestTime: "Morning", instagramHook: "Living like Emily", milesReward: 90 } 
      }
    ]
  },
  {
    id: 'tok-1',
    city: 'Tokyo',
    title: 'Tokyo: Avant-Garde Geometries (Architectural Gems)',
    description: 'Explore Tokyo\'s neon and glass jungle. Discover the future of design through its most daring and "breathing" buildings.',
    duration: '6h',
    distance: '8.5 km',
    difficulty: 'Moderate',
    theme: 'Design & Futurism',
    isSponsored: false,
    stops: [
      { 
        id: 't1', 
        name: 'Prada Aoyama', 
        description: '[HOOK] A breathing crystal shell that deforms and interacts with your eyes.\n\n[STORY] Designed by Herzog & de Meuron, this 6-story building is encased in a grid of rhomboid glass panes. Some are flat, some concave, and some convex, creating a "moving" reflection of the city.\n\n[SECRET] The glass is designed to resemble a quilted fabric. If you stand close to the concave panes, they create a magnifying effect that allows you to see the textures of the items inside as if you were holding them, effectively removing the barrier of the shop window.', 
        latitude: 35.6624, longitude: 139.7135, type: 'art', visited: false, isRichInfo: true, 
        photoSpot: { angle: "Corner shot capturing the diamond grid pattern", bestTime: "Night", instagramHook: "Prada Tokyo Geometry", milesReward: 110 } 
      },
      { 
        id: 't2', 
        name: 'Tokyo International Forum', 
        description: '[HOOK] An immense glass boat hull dry-docked in the heart of Chiyoda.\n\n[STORY] This is Tokyo\'s premier exhibition center. The "Glass Hall" is an architectural marvel—a 210-meter long vessel-shaped atrium made of glass and steel.\n\n[SECRET] The roof structure is supported by only two columns, creating a completely open and airy interior. Look up: the steel trusses are designed to resemble the skeletal remains of a prehistoric whale, a nod to Japan\'s relationship with the sea.', 
        latitude: 35.6769, longitude: 139.7638, type: 'art', visited: false, isRichInfo: true, 
        photoSpot: { angle: "From the upper glass walkways looking down", bestTime: "Midday", instagramHook: "Inside the Tokyo Whale", milesReward: 95 } 
      },
      { 
        id: 't3', 
        name: 'Nakagin Capsule Legacy (Ginza)', 
        description: '[HOOK] The 1970s dream of a city that could grow and shed its rooms like a tree.\n\n[STORY] This was the masterpiece of Kisho Kurokawa and the Metabolism movement. Each capsule was meant to be replaced every 25 years. Although the tower was recently dismantled, its spirit lives on in Ginza.\n\n[SECRET] One of the original capsules has been preserved and is often on display in the nearby museum district. The "future" of the 70s was a 4x2.5 meter room with a built-in calculator, a Sony Trinitron TV, and a reel-to-reel tape deck.', 
        latitude: 35.6682, longitude: 139.7618, type: 'historical', visited: false, isRichInfo: true, 
        photoSpot: { angle: "The preserved capsule at the Museum of Modern Art", bestTime: "Day", instagramHook: "Tokyo Metabolism Lives", milesReward: 130 } 
      }
    ]
  },
  {
    id: 'rom-1',
    city: 'Roma',
    title: 'Rome: Cinematic Beauty & Secret Ruins',
    description: 'Walk in the footsteps of Fellini and Audrey Hepburn. Experience the "Grande Bellezza" of the Eternal City through its hidden corners.',
    duration: '5h',
    distance: '6.5 km',
    difficulty: 'Moderate',
    theme: 'History & Cinema',
    isSponsored: false,
    stops: [
      { 
        id: 'r1', 
        name: 'Trevi Fountain', 
        description: '[HOOK] The stage for cinema\'s most famous midnight bath and a giant piggy bank for the poor.\n\n[STORY] Completed in 1762, it marks the end point of the "Aqua Virgo" aqueduct, which has been supplying water to Rome for over 2,000 years.\n\n[SECRET] Every night, about 3,000€ in coins are sucked up from the fountain floor. By law, this money goes to "Caritas", a charity that helps the city\'s homeless. Stealing coins from the fountain is a serious crime once practiced by a famous local thief named "d\'Artagnan".', 
        latitude: 41.9009, longitude: 12.4833, type: 'historical', visited: false, isRichInfo: true, 
        photoSpot: { angle: "From the far left corner to capture the depth", bestTime: "Dawn", instagramHook: "Trevi without the Crowds", milesReward: 100 } 
      },
      { 
        id: 'r2', 
        name: 'Bocca della Verità', 
        description: '[HOOK] The world\'s oldest lie detector that terrorized Audrey Hepburn.\n\n[STORY] This massive marble mask is likely an ancient Roman drain cover representing the sea god Oceanus. It became a global icon after the "hand-biting" scene in Roman Holiday.\n\n[SECRET] In the Middle Ages, the Mouth was used as a trial of ordeal. An executioner would hide behind the stone with a sharp blade; if the judge decided the person was lying, the "mouth" would indeed bite their hand off.', 
        latitude: 41.8882, longitude: 12.4813, type: 'historical', visited: false, isRichInfo: true, 
        photoSpot: { angle: "Close-up with your hand inside (classic!)", bestTime: "Morning", instagramHook: "Roman Lie Detector", milesReward: 80 } 
      },
      { 
        id: 'r3', 
        name: 'Quartiere Coppedè', 
        description: '[HOOK] A delirious fantasy where Art Nouveau embraces mythology in a hidden neighborhood.\n\n[STORY] Not a ruin, but a "fantasy city" built between 1913 and 1927 by Gino Coppedè. It combines Baroque, Medieval, and Mannerist styles into something otherworldly.\n\n[SECRET] Look for the "Palazzo del Ragno" (Spider Palace). Above its door is a huge golden spider mosaic symbolizing work and persistence. This neighborhood is so strange that the Beatles once jumped into its "Fountain of the Frogs" fully clothed after a concert.', 
        latitude: 41.9189, longitude: 12.5011, type: 'art', visited: false, isRichInfo: true, 
        photoSpot: { angle: "Under the giant chandelier hanging from the main arch", bestTime: "Golden Hour", instagramHook: "Rome's Secret Kingdom", milesReward: 140 } 
      }
    ]
  }
];
