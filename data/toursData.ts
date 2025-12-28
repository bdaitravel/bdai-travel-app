
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
        description: 'Te encuentras ante el coloso de granito y piedra de Colmenar que nació de las cenizas de una tragedia. En la Nochebuena de 1734, un incendio devastador devoró el Antiguo Alcázar, la fortaleza musulmana y cristiana que precedió a este palacio. Los Borbones, recién llegados de Francia, vieron en las llamas la oportunidad de borrar el rastro de los Austrias y erigir una obra que rivalizara con Versalles.\n\n[HISTORIA] Filippo Juvarra diseñó un proyecto tan colosal que no cabía en Madrid, por lo que su discípulo Sachetti tuvo que redimensionarlo. El resultado son 3.418 habitaciones, lo que lo convierte en el palacio real más grande de Europa Occidental. Si observas la fachada, notarás que no hay madera visible; tras el trauma del incendio del Alcázar, el edificio se construyó íntegramente en piedra y ladrillo, con bóvedas sólidas diseñadas para ser eternas.\n\n[CURIOSIDAD] Bajo tus pies en la Plaza de la Armería, corre un laberinto de túneles secretos. Uno de ellos conectaba directamente los aposentos reales con el Monasterio de la Encarnación, permitiendo que la familia real asistiera a misa o se confesara sin ser vista por el pueblo, especialmente en tiempos de revueltas.\n\n[CONSEJO] No te limites a la fachada principal. Dirígete a los Jardines de Sabatini durante la "hora dorada". La luz del atardecer incide lateralmente sobre la piedra blanca, creando un contraste dramático que resalta cada moldura barroca, ideal para capturar la majestuosidad imperial en una sola toma.', 
        latitude: 40.4180, longitude: -3.7100, type: 'historical', visited: false, isRichInfo: true,
        photoSpot: { angle: "Desde los Jardines de Sabatini", bestTime: "Atardecer", instagramHook: "RoyalPalaceSunset", milesReward: 120, secretLocation: "Busca el banco de piedra central alineado con la estatua de Carlos III para el encuadre perfecto." }
      },
      { 
        id: 'm11', 
        name: 'Monasterio de las Descalzas Reales', 
        description: 'A pocos pasos del bullicio comercial, se esconde un oasis de silencio que parece congelado en el siglo XVI. Este edificio fue originalmente el palacio de Carlos I y la emperatriz Isabel de Portugal, pero su destino cambió cuando Juana de Austria decidió convertirlo en un convento de clarisas descalzas de clausura.\n\n[HISTORIA] Durante siglos, este fue el refugio de las infantas y reinas de la Casa de Austria que no contraían matrimonio o quedaban viudas. Al entrar, traían consigo dotes fabulosas: pinturas de Tiziano, Brueghel el Viejo y tapices de Rubens. Lo que ves por fuera como un sobrio edificio de ladrillo plateresco, es por dentro uno de los tesoros artísticos más densos de Europa.\n\n[CURIOSIDAD] El monasterio conserva una de las colecciones de reliquias más extravagantes de la cristiandad. En su "Relicario", se guardan desde fragmentos de la Vera Cruz hasta objetos que pertenecieron a santos fundadores, todo enmarcado en maderas nobles y metales preciosos.\n\n[CONSEJO] La joya absoluta es la Escalera Real, decorada con frescos que engañan al ojo representando a la familia real asomada a balcones. Reserva tu entrada con al menos una semana de antelación; es uno de los museos con el acceso más restringido de la capital.', 
        latitude: 40.4183, longitude: -3.7058, type: 'historical', visited: false, isRichInfo: true,
        photoSpot: { angle: "Fachada principal desde la plaza", bestTime: "Mañana", instagramHook: "DescalzasReales", milesReward: 100, secretLocation: "Esquina noreste de la plaza para captar la torre mudéjar al fondo." }
      },
      { 
        id: 'm2', 
        name: 'Plaza de la Villa y Torre de los Lujanes', 
        description: 'Bienvenidos al Madrid que los Austrias heredaron de la Edad Media. Esta plaza es un catálogo vivo de arquitectura madrileña: aquí conviven el estilo mudéjar del siglo XV, el plateresco del XVI y el barroco del XVII en perfecta armonía.\n\n[HISTORIA] El edificio que domina el costado oriental es la Torre de los Lujanes, la construcción civil más antigua de Madrid. Su portal gótico y su crestería mudéjar son reliquias de una época en la que Madrid era una pequeña ciudad de frontera.\n\n[CURIOSIDAD] La leyenda cuenta que en esta torre estuvo prisionero el rey Francisco I de Francia tras ser capturado por las tropas de Carlos I en la batalla de Pavía. Aunque los historiadores debaten si el cautiverio fue aquí o en el Alcázar, los madrileños siempre han preferido creer que el gran rival del Emperador miró estas mismas piedras con desesperación.\n\n[CONSEJO] Busca el Callejón del Codo, que sale de la plaza. Su trazado es tan estrecho y angulado que se diseñó específicamente para evitar que los caballeros pudieran desenvainar sus largas espadas con facilidad en caso de duelo.', 
        latitude: 40.4153, longitude: -3.7103, type: 'historical', visited: false, isRichInfo: true,
        photoSpot: { angle: "Callejón del Codo", bestTime: "Mañana", instagramHook: "MedievalStreet", milesReward: 80, secretLocation: "Punto medio del callejón mirando hacia la Plaza de la Villa." } 
      },
      { 
        id: 'm3', 
        name: 'Mercado de San Miguel', 
        description: 'Donde hoy ves turistas y degustaciones de lujo, hace un siglo había un mercado de abastos tradicional que apenas sobrevivía a la modernidad. El Mercado de San Miguel es el último gran exponente de la arquitectura de hierro en Madrid.\n\n[HISTORIA] Inaugurado en 1916, su diseño se inspiró en los mercados parisinos de Les Halles. Tras décadas de abandono, fue rescatado y transformado en el primer mercado gastronómico de España. Sus columnas de hierro fundido y sus amplios ventanales permiten que la vida de la calle fluya hacia el interior.\n\n[CURIOSIDAD] Los cimientos del mercado reposan sobre el lugar que ocupaba la antigua iglesia de San Miguel de los Octoes, destruida durante la ocupación napoleónica. Algunos de los puestos centrales conservan la disposición que dictaban las antiguas ordenanzas de comercio del siglo XIX.\n\n[CONSEJO] No intentes almorzar aquí los fines de semana a mediodía; la multitud puede ser abrumadora. Ven a las 11:00 AM o a última hora de la noche para disfrutar de una ostra con cava con espacio para apreciar los detalles del techo de madera original.', 
        latitude: 40.4155, longitude: -3.7090, type: 'food', visited: false, isRichInfo: true,
        photoSpot: { angle: "Esquina noreste interior", bestTime: "Noche", instagramHook: "MarketVibes", milesReward: 60, secretLocation: "Busca el reflejo de las luces de neón en los cristales exteriores." } 
      },
      { 
        id: 'm13', 
        name: 'Colegiata de San Isidro', 
        description: 'Estás ante el corazón espiritual del Madrid más castizo. Este imponente edificio barroco de la Compañía de Jesús no solo es una obra maestra del arquitecto Pedro Sánchez, sino que sirvió como catedral provisional de Madrid durante más de un siglo.\n\n[HISTORIA] Aquí descansan los restos de San Isidro Labrador, patrón de Madrid, y su esposa Santa María de la Cabeza. El templo representa el triunfo de la Contrarreforma en España: un espacio diseñado para impresionar, con naves amplias y una cúpula que parece elevarse hacia el infinito.\n\n[CURIOSIDAD] El edificio que ves hoy es una reconstrucción. En 1936, el templo fue incendiado intencionadamente, provocando el colapso de la cúpula y la pérdida de frescos inestimables. Los madrileños de la posguerra trabajaron durante años para devolverle su esplendor original.\n\n[CONSEJO] Fíjate en el retablo mayor. Es una pieza de una complejidad asombrosa que resume la iconografía jesuítica. Si tienes suerte y hay un ensayo de órgano, el eco de la nave central te transportará directamente al Madrid barroco.', 
        latitude: 40.4128, longitude: -3.7072, type: 'historical', visited: false, isRichInfo: true,
        photoSpot: { angle: "Desde la Calle de Toledo", bestTime: "Mediodía", instagramHook: "SanIsidroCollegiate", milesReward: 90, secretLocation: "Desde la acera de enfrente bajando hacia La Latina." }
      },
      { 
        id: 'm4', 
        name: 'Plaza Mayor y Arco de Cuchilleros', 
        description: 'La Plaza Mayor es el gran patio de butacas de la historia de España. Fue el escenario de autos de fe de la Inquisición, ejecuciones públicas, corridas de toros y bodas reales. Es un espacio que ha sobrevivido a tres incendios catastróficos.\n\n[HISTORIA] Juan de Herrera trazó las líneas maestras, pero fue Juan de Villanueva quien le dio su aspecto actual tras el último gran incendio de 1790. La Casa de la Panadería, con sus frescos mitológicos, era el centro neurálgico desde donde los reyes presidían los eventos.\n\n[CURIOSIDAD] El Arco de Cuchilleros tiene esa altura descomunal debido al desnivel del terreno. La plaza está construida sobre un sistema de bóvedas que "vuelan" sobre la calle de la Cava de San Miguel, donde antiguamente se situaba el mercado de carne.\n\n[CONSEJO] Entra por el Arco de Cuchilleros y baja las escaleras. Allí encontrarás el restaurante Sobrino de Botín, fundado en 1725 y certificado como el más antiguo del mundo. Se dice que Goya trabajó allí como lavaplatos.', 
        latitude: 40.4154, longitude: -3.7074, type: 'historical', visited: false, isRichInfo: true,
        photoSpot: { angle: "Encuadre desde el Arco de Cuchilleros", bestTime: "Tarde", instagramHook: "MadridClassic", milesReward: 90, secretLocation: "Bajo los arcos mirando hacia la estatua de Felipe III." } 
      },
      { 
        id: 'm5', 
        name: 'Puerta del Sol y el Kilómetro Cero', 
        description: 'Si Madrid tiene un latido, se escucha aquí. La Puerta del Sol es el epicentro emocional y geográfico de España. Aquí convergen las seis carreteras radiales del país y aquí es donde se celebra la llegada del nuevo año.\n\n[HISTORIA] La Real Casa de Correos domina la plaza. Su reloj, donado por un relojero leonés, es el más preciso de la ciudad. Bajo sus balcones ocurrieron los levantamientos del 2 de mayo contra Napoleón y se proclamó la Segunda República.\n\n[CURIOSIDAD] El famoso cartel de Tío Pepe es el único anuncio luminoso en España que goza de un "indulto histórico". Cuando se prohibió la publicidad en las azoteas, los madrileños iniciaron una campaña para salvarlo.\n\n[CONSEJO] Busca la placa del Kilómetro Cero frente a la Casa de Correos. La tradición dice que si pisas el centro de la placa, tu destino siempre te traerá de vuelta a Madrid.', 
        latitude: 40.4169, longitude: -3.7035, type: 'historical', visited: false, isRichInfo: true,
        photoSpot: { angle: "Placa Km 0", bestTime: "Mañana", instagramHook: "MadridKilometerZero", milesReward: 50, secretLocation: "Justo en el centro de la placa, encuadre cenital." } 
      },
      { 
        id: 'm6', 
        name: 'Barrio de las Letras (Cervantes y Lope)', 
        description: 'Estás caminando por el barrio con la mayor densidad de genios literarios por metro cuadrado del mundo. En el siglo XVII, en estas mismas calles, vivieron Miguel de Cervantes, Lope de Vega, Quevedo y Góngora.\n\n[HISTORIA] La calle Huertas es el eje central de este barrio. Si bajas la vista, verás fragmentos de las obras maestras del Siglo de Oro grabados en letras doradas sobre el pavimento. El barrio conserva su trazado irregular de callejones donde los duelos eran comunes.\n\n[CURIOSIDAD] Cervantes está enterrado en el Convento de las Trinitarias Descalzas, pero sus restos exactos estuvieron perdidos durante siglos hasta 2015, cuando un equipo científico identificó sus huesos en una cripta olvidada.\n\n[CONSEJO] Visita la Casa-Museo de Lope de Vega en la calle de Cervantes. Es una casa tradicional del siglo XVII con un jardín interior donde el "Fénix de los Ingenios" escribía sus comedias.', 
        imageUrl: 'https://images.unsplash.com/photo-1614704047648-5c742886f45a?auto=format&fit=crop&w=800&q=80',
        latitude: 40.4140, longitude: -3.6980, type: 'culture', visited: false, isRichInfo: true,
        photoSpot: { angle: "Versos dorados en Calle Huertas", bestTime: "Día", instagramHook: "LiteraryWalk", milesReward: 70, secretLocation: "Frente a la casa de Lope de Vega, buscando el ángulo de los versos en el suelo." } 
      },
      { 
        id: 'm12', 
        name: 'Basílica de San Francisco el Grande', 
        description: 'Prepárate para mirar hacia arriba y quedar sin aliento. Esta basílica neoclásica posee la tercera cúpula de planta circular más grande de la cristiandad, superada solo por el Panteón de Roma y San Pedro.\n\n[HISTORIA] El lugar tiene un aura mística: la leyenda afirma que el convento original fue fundado por San Francisco de Asís en 1217. La iglesia actual fue impulsada por Carlos III para demostrar el poderío artístico de su reinado.\n\n[CURIOSIDAD] En una de las capillas laterales se encuentra un cuadro de un joven y ambicioso Francisco de Goya: "San Bernardino de Siena predicando". Goya incluyó su autorretrato en la obra, mirando desafiante al espectador.\n\n[CONSEJO] Entra cuando el sol esté en lo más alto. La luz que entra por los óculos de la cúpula ilumina los mármoles y frescos de las capillas de una forma casi celestial. La acústica es perfecta.', 
        latitude: 40.4103, longitude: -3.7144, type: 'historical', visited: false, isRichInfo: true,
        photoSpot: { angle: "Interior mirando hacia la cúpula", bestTime: "Mañana", instagramHook: "SanFranciscoGrande", milesReward: 110, secretLocation: "Centro de la nave principal, mirando verticalmente." }
      },
      { 
        id: 'm7', 
        name: 'Calle de la Cava Baja', 
        description: 'Si los muros de la Cava Baja hablaran, contarían historias de carromatos y comerciantes. Esta calle curva sigue el trazado del foso de la antigua muralla cristiana de Madrid, protegida por la cavidad defensiva que le da nombre.\n\n[HISTORIA] Durante siglos, esta fue la calle de las posadas. Los viajeros descargaban aquí sus mercancías y buscaban refugio. Hoy, esas antiguas caballerizas se han transformado en las tabernas de tapeo más famosas de la ciudad.\n\n[CURIOSIDAD] La mayoría de las tabernas clásicas conservan cuevas subterráneas excavadas en la arena para mantener el vino a una temperatura fresca constante.\n\n[CONSEJO] Es el lugar perfecto para el "tardeo". Pide un vino de Madrid y una ración de croquetas. La atmósfera cuando se encienden los faroles de hierro es la esencia pura del Madrid castizo.', 
        latitude: 40.4125, longitude: -3.7095, type: 'food', visited: false, isRichInfo: true,
        photoSpot: { angle: "Curva de la calle con fachadas de colores", bestTime: "Noche", instagramHook: "TapasCrawl", milesReward: 80, secretLocation: "Frente a la Posada del León de Oro." } 
      },
      { 
        id: 'm8', 
        name: 'Templo de Debod', 
        description: 'Parece un espejismo de 2.200 años de antigüedad. Este templo egipcio del siglo II a.C. fue un regalo de Egipto a España en gratitud por la ayuda prestada para salvar los templos de Nubia durante la construcción de la presa de Asuán.\n\n[HISTORIA] Originalmente dedicado a los dioses Amón e Isis, el templo se alzaba a orillas del Nilo. En Madrid, se decidió colocarlo en lo alto de la Montaña del Príncipe Pío, respetando su orientación este-oeste.\n\n[CURIOSIDAD] Si observas los relieves de las paredes interiores, verás al rey nubio Adikhalamani ofreciendo regalos a los dioses. Algunos grabados fueron estabilizados por el aire seco de Madrid.\n\n[CONSEJO] El atardecer aquí no es negociable. Es el punto más alto del oeste del centro, y ver el sol ponerse tras el templo con el Palacio Real de fondo es una de las experiencias más bellas que ofrece la ciudad.', 
        latitude: 40.4242, longitude: -3.7178, type: 'historical', visited: false, isRichInfo: true,
        photoSpot: { angle: "Reflejo frontal en el estanque", bestTime: "Atardecer", instagramHook: "EgyptianSunset", milesReward: 140, secretLocation: "Al final del estanque para captar la simetría perfecta." } 
      },
      { 
        id: 'm9', 
        name: 'Gran Vía y Edificio Metrópolis', 
        description: 'Bienvenidos al Broadway español. La Gran Vía fue un proyecto urbanístico faraónico que a principios del siglo XX se llevó por delante cientos de casas medievales para crear una avenida moderna y cosmopolita.\n\n[HISTORIA] Cada edificio de esta calle compite en belleza. El Edificio Metrópolis, con su icónica cúpula de pizarra y oro, marca el inicio de la avenida. Fue diseñado por arquitectos franceses para una compañía de seguros.\n\n[CURIOSIDAD] La estatua que corona la cúpula del Metrópolis no es la original. Antiguamente había un fénix, pero fue sustituida por la actual Victoria Alada que hoy vigila el cielo de Madrid.\n\n[CONSEJO] Camina siempre mirando hacia arriba. Los remates de los edificios están llenos de esculturas de dioses griegos y atletas. Para la mejor vista, sube a la azotea del Círculo de Bellas Artes.', 
        latitude: 40.4200, longitude: -3.7058, type: 'art', visited: false, isRichInfo: true,
        photoSpot: { angle: "Desde el cruce con Calle Alcalá", bestTime: "Noche", instagramHook: "GranViaLights", milesReward: 100, secretLocation: "Isla peatonal frente al edificio Metrópolis." } 
      },
      { 
        id: 'm10', 
        name: 'Fuente de Cibeles', 
        description: 'La diosa que guarda los tesoros de la ciudad. Esculpida en mármol de Toledo, esta fuente es mucho más que un monumento; es el epicentro de la vida social, política y deportiva de Madrid.\n\n[HISTORIA] Originalmente, la fuente servía como suministro de agua potable para los madrileños. A finales del siglo XIX se trasladó a su ubicación actual, convirtiéndose en el corazón del Paseo del Prado.\n\n[CURIOSIDAD] El sistema de seguridad del Banco de España es legendario. Se dice que si alguien intentara robar la cámara del oro, las tuberías de la fuente inundarían el foso de seguridad automáticamente.\n\n[CONSEJO] Ven de noche. El Palacio de Cibeles se ilumina de forma espectacular, creando un fondo de cuento de hadas. Los leones representan a Hipómenes y Atalanta, amantes castigados por la diosa.', 
        latitude: 40.4189, longitude: -3.6944, type: 'historical', visited: false, isRichInfo: true,
        photoSpot: { angle: "De frente con el Ayuntamiento de fondo", bestTime: "Noche", instagramHook: "CibelesMajesty", milesReward: 110, secretLocation: "Desde el inicio del Paseo del Prado mirando hacia la fuente." } 
      }
    ]
  }
];
