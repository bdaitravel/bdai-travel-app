
import { Tour } from '../types';

export const STATIC_TOURS: Tour[] = [
  {
    id: 'mad-1',
    city: 'Madrid',
    title: 'Madrid: El Corazón de los Austrias y sus Sombras Imperiales',
    description: 'Recorre el Madrid de los siglos XVI y XVII. De las intrigas del Antiguo Alcázar a los duelos de honor en las calles donde vivieron los genios del Siglo de Oro. Una ruta épica por el centro histórico.',
    duration: '6h',
    distance: '8.5 km',
    difficulty: 'Moderate',
    theme: 'History & Legends',
    isSponsored: false,
    safetyTip: "Mantén tu mochila hacia adelante en Sol y Plaza Mayor.",
    wifiTip: "Puntos 'Madrid-WiFi' disponibles en Sol y Callao.",
    stops: [
      { 
        id: 'm1', 
        name: 'Palacio Real y Plaza de la Armería', 
        description: 'Un coloso de granito que nació de las cenizas de un incendio "estratégico".\n\n[HISTORIA] Tras el fuego que destruyó el Antiguo Alcázar en 1734, los Borbones levantaron este gigante de 3.418 habitaciones, superando en tamaño a Buckingham o Versalles. Es un manifiesto de piedra y mármol diseñado para no volver a arder jamás.\n\n[CURIOSIDAD] Bajo la Plaza de la Armería corre una red de túneles que conectaba a los reyes con el Monasterio de la Encarnación para que pudieran confesarse sin pisar la calle.\n\n[CONSEJO] Entra por los Jardines de Sabatini al atardecer; la luz que rebota en el granito blanco es el mejor filtro natural para tus fotos.', 
        latitude: 40.4180, longitude: -3.7100, type: 'historical', visited: false, isRichInfo: true,
        photoSpot: { angle: "Desde los Jardines de Sabatini", bestTime: "Atardecer", instagramHook: "RoyalPalaceSunset", milesReward: 120 }
      },
      { 
        id: 'm11', 
        name: 'Monasterio de las Descalzas Reales', 
        description: 'El refugio espiritual de las mujeres más poderosas de la dinastía Austria.\n\n[HISTORIA] Este monasterio del siglo XVI fue originalmente el palacio de Carlos I. Su hija, Juana de Austria, lo convirtió en un convento de clarisas descalzas. Durante siglos, las infantas y reinas se retiraron aquí, dotando al lugar de una riqueza artística incalculable.\n\n[CURIOSIDAD] Alberga una serie de tapices diseñados por Rubens. Se dice que la colección de arte es tan vasta que se considera uno de los museos más secretos y valiosos de Europa.\n\n[CONSEJO] Las visitas son estrictamente guiadas. Es obligatorio reservar con antelación para admirar su espectacular escalera renacentista.', 
        latitude: 40.4183, longitude: -3.7058, type: 'historical', visited: false, isRichInfo: true,
        photoSpot: { angle: "Fachada principal desde la plaza", bestTime: "Mañana", instagramHook: "DescalzasReales", milesReward: 100 }
      },
      { 
        id: 'm2', 
        name: 'Plaza de la Villa y Torre de los Lujanes', 
        description: 'El rincón donde el tiempo se detuvo cuando Madrid aún era una villa medieval.\n\n[HISTORIA] Aquí conviven el estilo mudéjar del siglo XV con el barroco del XVII. La Torre de los Lujanes es el edificio civil más antiguo de la ciudad y se dice que aquí estuvo prisionero el rey Francisco I de Francia tras su derrota en Pavía.\n\n[CURIOSIDAD] Los muros de la torre conservan marcas de impactos de la Guerra de la Independencia que los madrileños protegen como cicatrices de orgullo.\n\n[CONSEJO] Camina por el Callejón del Codo; su estrechez extrema servía en el pasado para que los caballeros no pudieran desenvainar sus espadas fácilmente.', 
        latitude: 40.4153, longitude: -3.7103, type: 'historical', visited: false, isRichInfo: true,
        photoSpot: { angle: "Callejón del Codo", bestTime: "Mañana", instagramHook: "MedievalStreet", milesReward: 80 } 
      },
      { 
        id: 'm3', 
        name: 'Mercado de San Miguel', 
        description: 'La última catedral de hierro y cristal dedicada al hedonismo madrileño.\n\n[HISTORIA] Inaugurado en 1916 como mercado de abastos, hoy es el epicentro gastronómico de la capital. Su estructura de hierro original es una joya industrial que ha visto pasar más de un siglo de transformaciones.\n\n[CURIOSIDAD] Los pilares de hierro que sostienen el techo fueron forjados en Bélgica y traídos por mar y ferrocarril hasta el centro de Madrid.\n\n[CONSEJO] Prueba el vermut de grifo con una gilda; es el ritual más auténtico antes de seguir hacia la Plaza Mayor.', 
        latitude: 40.4155, longitude: -3.7090, type: 'food', visited: false, isRichInfo: true,
        photoSpot: { angle: "Esquina noreste interior", bestTime: "Noche", instagramHook: "MarketVibes", milesReward: 60 } 
      },
      { 
        id: 'm13', 
        name: 'Colegiata de San Isidro', 
        description: 'El templo del patrón donde Madrid guarda su fe más castiza.\n\n[HISTORIA] Fue la catedral provisional de Madrid hasta 1993. Este imponente edificio barroco de la Compañía de Jesús custodia los restos de San Isidro Labrador y Santa María de la Cabeza. Es el corazón del fervor religioso de los Austrias.\n\n[CURIOSIDAD] El interior es una reconstrucción fiel, ya que el templo fue devastado por un incendio al inicio de la Guerra Civil, perdiendo frescos de valor incalculable.\n\n[CONSEJO] Fíjate en la cúpula encamonada, una técnica arquitectónica madrileña para crear estructuras ligeras pero visualmente masivas.', 
        latitude: 40.4128, longitude: -3.7072, type: 'historical', visited: false, isRichInfo: true,
        photoSpot: { angle: "Desde la Calle de Toledo", bestTime: "Mediodía", instagramHook: "SanIsidroCollegiate", milesReward: 90 }
      },
      { 
        id: 'm4', 
        name: 'Plaza Mayor y Arco de Cuchilleros', 
        description: 'El gran patio de la Corte, escenario de bodas, toros y juicios inquisitoriales.\n\n[HISTORIA] Diseñada por Juan de Herrera, esta plaza ha sufrido tres incendios devastadores. La Casa de la Panadería, con sus frescos mitológicos, es el edificio más emblemático y servía originalmente como el principal despacho de pan de la villa.\n\n[CURIOSIDAD] El Arco de Cuchilleros es tan alto porque salva el desnivel entre la plaza y la Cava de San Miguel, donde las murallas cristianas hacían de foso.\n\n[CONSEJO] No comas en las terrazas de la plaza; baja al Arco de Cuchilleros para encontrar las tabernas donde el asado de cordero aún se hace en horno de leña.', 
        latitude: 40.4154, longitude: -3.7074, type: 'historical', visited: false, isRichInfo: true,
        photoSpot: { angle: "Encuadre desde el Arco de Cuchilleros", bestTime: "Tarde", instagramHook: "MadridClassic", milesReward: 90 } 
      },
      { 
        id: 'm5', 
        name: 'Puerta del Sol y el Kilómetro Cero', 
        description: 'El lugar donde todos los caminos de España nacen y donde el tiempo se detiene cada año.\n\n[HISTORIA] Hogar del reloj más famoso del país, cuyas campanadas marcan el año nuevo para millones. Aquí también encontrarás el Kilómetro Cero, el punto exacto donde se miden las carreteras radiales de la península.\n\n[CURIOSIDAD] El cartel de Tío Pepe es el único anuncio luminoso que tiene indulto histórico para permanecer en la plaza debido a su estatus iconográfico.\n\n[CONSEJO] Busca la estatua de "El Oso y el Madroño", pero fíjate bien: el madroño es en realidad un símbolo de la lucha entre el ayuntamiento y la iglesia por las tierras de Madrid.', 
        latitude: 40.4169, longitude: -3.7035, type: 'historical', visited: false, isRichInfo: true,
        photoSpot: { angle: "Placa Km 0", bestTime: "Mañana", instagramHook: "MadridKilometerZero", milesReward: 50 } 
      },
      { 
        id: 'm6', 
        name: 'Barrio de las Letras (Cervantes y Lope)', 
        description: 'Donde las letras se grabaron con oro en el suelo y con sangre en los callejones.\n\n[HISTORIA] Aquí vivieron Cervantes y Lope de Vega, vecinos y enemigos íntimos. Las citas literarias pavimentan las calles peatonales, recordándote que caminas sobre el legado del Siglo de Oro español.\n\n[CURIOSIDAD] La casa de Lope de Vega se conserva casi intacta; entrar en su jardín es volver al año 1610 en un abrir y cerrar de ojos.\n\n[CONSEJO] Mira al suelo: los versos de Quevedo y Góngora están grabados en letras doradas. No los pises, léelos mientras caminas hacia la calle Huertas.', 
        imageUrl: 'https://images.unsplash.com/photo-1614704047648-5c742886f45a?auto=format&fit=crop&w=800&q=80',
        latitude: 40.4140, longitude: -3.6980, type: 'culture', visited: false, isRichInfo: true,
        photoSpot: { angle: "Versos dorados en Calle Huertas", bestTime: "Día", instagramHook: "LiteraryWalk", milesReward: 70 } 
      },
      { 
        id: 'm12', 
        name: 'Basílica de San Francisco el Grande', 
        description: 'La cúpula que desafía al cielo y guarda tesoros de Goya.\n\n[HISTORIA] Presume de tener la tercera cúpula circular más grande de la cristiandad. Construida en el siglo XVIII sobre un convento franciscano que, según la leyenda, fundó San Francisco de Asís en su viaje a España.\n\n[CURIOSIDAD] En su interior destaca la capilla de San Bernardino de Siena, pintada por un joven Francisco de Goya que se autorretrató en el lienzo.\n\n[CONSEJO] Visítala por la mañana para que la luz natural resalte la majestuosidad de su cúpula y las ricas decoraciones de mármol y estuco.', 
        latitude: 40.4103, longitude: -3.7144, type: 'historical', visited: false, isRichInfo: true,
        photoSpot: { angle: "Interior mirando hacia la cúpula", bestTime: "Mañana", instagramHook: "SanFranciscoGrande", milesReward: 110 }
      },
      { 
        id: 'm7', 
        name: 'Calle de la Cava Baja', 
        description: 'La calle de las cien tabernas y los mil sabores madrileños.\n\n[HISTORIA] Antiguo foso de la muralla cristiana, esta calle curva era el lugar donde los viajeros que llegaban a Madrid aparcaban sus carruajes y buscaban posada. Hoy es el paraíso del tapeo.\n\n[CURIOSIDAD] La mayoría de estas tabernas tienen cuevas subterráneas que se usaban para conservar el vino a temperatura constante durante los calurosos veranos castellanos.\n\n[CONSEJO] Pide unos huevos rotos en Casa Lucio; han sido el plato favorito de reyes y presidentes durante décadas.', 
        latitude: 40.4125, longitude: -3.7095, type: 'food', visited: false, isRichInfo: true,
        photoSpot: { angle: "Curva de la calle con fachadas de colores", bestTime: "Noche", instagramHook: "TapasCrawl", milesReward: 80 } 
      },
      { 
        id: 'm8', 
        name: 'Templo de Debod', 
        description: 'Un pedazo del Antiguo Egipto que encontró su hogar definitivo frente a la sierra de Madrid.\n\n[HISTORIA] Con 2.200 años de antigüedad, fue un regalo de Egipto a España en 1968. Fue traído piedra a piedra y reconstruido respetando su orientación solar original.\n\n[CURIOSIDAD] En los relieves interiores puedes ver al rey Adikhalamani de Meroe haciendo ofrendas a la diosa Isis.\n\n[CONSEJO] Es el mejor lugar para ver el atardecer en todo Madrid. El reflejo del templo en el estanque crea una simetría perfecta para tu galería.', 
        latitude: 40.4242, longitude: -3.7178, type: 'historical', visited: false, isRichInfo: true,
        photoSpot: { angle: "Reflejo frontal en el estanque", bestTime: "Atardecer", instagramHook: "EgyptianSunset", milesReward: 140 } 
      },
      { 
        id: 'm9', 
        name: 'Gran Vía y Edificio Metrópolis', 
        description: 'La calle que nunca duerme y el escaparate de la modernidad imperial.\n\n[HISTORIA] Construida a principios del XX para oxigenar el centro, supuso la demolición de cientos de casas. Hoy es el "Broadway" madrileño con sus teatros musicales y cines históricos.\n\n[CURIOSIDAD] La cúpula del Edificio Metrópolis está cubierta con más de 30.000 panes de oro auténtico.\n\n[CONSEJO] Sube a la terraza del Círculo de Bellas Artes para la foto icónica de la Gran Vía desde el aire.', 
        latitude: 40.4200, longitude: -3.7058, type: 'art', visited: false, isRichInfo: true,
        photoSpot: { angle: "Desde el cruce con Calle Alcalá", bestTime: "Noche", instagramHook: "GranViaLights", milesReward: 100 } 
      },
      { 
        id: 'm10', 
        name: 'Fuente de Cibeles', 
        description: 'La diosa que protege los tesoros del Reino y celebra las victorias del pueblo.\n\n[HISTORIA] Esculpida en mármol de Toledo, representa a la diosa de la tierra en un carro tirado por leones. Es el epicentro de las celebraciones deportivas y sociales de la ciudad.\n\n[CURIOSIDAD] El agua de la fuente está conectada a la cámara acorazada del Banco de España; en caso de intento de robo, el foso se inundaría automáticamente.\n\n[CONSEJO] Mira al león y la leona: son Hipómenes y Atalanta, castigados a tirar del carro sin poder mirarse jamás por haber profanado un templo.', 
        latitude: 40.4189, longitude: -3.6944, type: 'historical', visited: false, isRichInfo: true,
        photoSpot: { angle: "De frente con el Ayuntamiento de fondo", bestTime: "Noche", instagramHook: "CibelesMajesty", milesReward: 110 } 
      }
    ]
  }
];
