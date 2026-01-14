
import { Tour } from '../types';

export const STATIC_TOURS: Tour[] = [
  {
    id: "sev_masterclass_03",
    city: "Sevilla",
    title: "Sevilla: El Laberinto de Santa Cruz e Ingeniería del Siglo de Oro",
    description: "Una disección técnica del corazón de Sevilla. Analizamos la termodinámica pasiva de sus callejones, la ingeniería hidráulica de los antiguos viajes de agua, la estereotomía de la piedra de Tarifa en la Catedral y la evolución del urbanismo defensivo almohade. Un tour para entender cómo Sevilla se convirtió en el puerto de Indias y centro logístico del mundo.",
    duration: "10h", distance: "12 km", difficulty: "Hard", theme: "Masterclass Ingeniería e Historia", isEssential: true,
    stops: [
      { 
        id: "s1", 
        name: "La Giralda: Estabilidad Dinámica y Rampas de Carga", 
        description: "La Giralda es una proeza de la ingeniería almohade. Su estructura interna no utiliza escaleras, sino 35 rampas diseñadas con una pendiente calculada para permitir el ascenso de dos jinetes a caballo simultáneamente. Esta solución técnica reduce el esfuerzo cortante en los muros maestros al distribuir el peso de forma helicoidal. Analizamos también el sistema de cimentación, que debió lidiar con el terreno aluvial del Guadalquivir, utilizando una losa masiva de argamasa y restos romanos para estabilizar la torre ante las crecidas del río y los sismos históricos de la región.", 
        latitude: 37.3862, longitude: -5.9925, type: "historical", visited: false, 
        photoSpot: { angle: "Desde la Plaza de la Virgen de los Reyes", milesReward: 50, secretLocation: "Plaza de la Virgen de los Reyes", bestTime: "Atardecer", instagramHook: "GiraldaTech" } 
      },
      { 
        id: "s2", 
        name: "Callejón del Agua: Termodinámica y Microclima", 
        description: "El Callejón del Agua es el ejemplo supremo de climatización pasiva medieval. Sus muros están diseñados para aprovechar el efecto Venturi: la estrechez de la vía acelera el aire, reduciendo la temperatura por convección. Además, el muro del Alcázar contenía los canales de agua que abastecían a la ciudad, actuando como un disipador de calor natural que humedecía el ambiente. Estudiamos cómo la vegetación colgante y el color de la cal en los paramentos minimizan la absorción de la radiación infrarroja, manteniendo el callejón hasta 10 grados más fresco que las avenidas exteriores en pleno verano sevillano.", 
        latitude: 37.3855, longitude: -5.9902, type: "architecture", visited: false, 
        photoSpot: { angle: "Vista lineal del callejón con flores colgantes", milesReward: 60, secretLocation: "Muro del Alcázar", bestTime: "Mañana", instagramHook: "CoolSevilla" } 
      },
      { 
        id: "s3", 
        name: "Plaza de Doña Elvira: Ingeniería de Patios e Inercia Térmica", 
        description: "Esta plaza, antiguo corral de comedias, funciona como un pulmón térmico. El diseño de sus patios circundantes utiliza el 'efecto chimenea': el aire caliente sube por los huecos centrales, forzando la entrada de aire fresco desde el nivel del suelo. Las fuentes centrales de cerámica vidriada no solo son decorativas; mediante la evaporación superficial, generan un enfriamiento adiabático que humidifica el aire seco. Analizamos el uso de la baldosa hidráulica y el mármol, materiales con alta inercia térmica que absorben el calor del día y lo liberan lentamente durante la noche sevillana.", 
        latitude: 37.3850, longitude: -5.9912, type: "culture", visited: false, 
        photoSpot: { angle: "Desde los bancos de cerámica mirando a la fuente", milesReward: 40, secretLocation: "Bancos de la plaza", bestTime: "Tarde", instagramHook: "ElviraMaster" } 
      },
      { 
        id: "s4", 
        name: "Hospital de los Venerables: Barroco e Ingeniería Acústica", 
        description: "Diseñado por Leonardo de Figueroa, este edificio es un catálogo de soluciones barrocas aplicadas. Analizamos la escalera principal, una obra maestra de la estereotomía que utiliza una bóveda elíptica para repartir cargas sin columnas intermedias. El patio hundido es una innovación técnica para captar aire fresco del subsuelo. Estudiamos la acústica de la iglesia, donde las molduras de yeserías actúan como difusores sonoros, controlando el tiempo de reverberación para maximizar la inteligibilidad del discurso sacro y la música de órgano, un logro de la ingeniería electroacústica analógica del siglo XVII.", 
        latitude: 37.3853, longitude: -5.9908, type: "architecture", visited: false, 
        photoSpot: { angle: "Patio central hundido", milesReward: 80, secretLocation: "Cisterna del patio", bestTime: "Mañana", instagramHook: "VenerablesTech" } 
      },
      { 
        id: "s5", 
        name: "Calle Cruces: Geometría Defensiva y Sombras Arrojadas", 
        description: "La Calle de las Cruces es un estudio de geometría urbana fractal. Sus recovecos y ángulos están diseñados para romper la visión lineal de un posible atacante y, simultáneamente, maximizar las sombras arrojadas sobre el pavimento. Analizamos cómo el diseño de los voladizos de madera y los balcones de forja permite que el sol nunca llegue a calentar el suelo, evitando que la calle actúe como un radiador de calor. El sistema de drenaje central utiliza la pendiente natural del terreno para dirigir las aguas pluviales hacia los colectores antiguos, una solución de ingeniería civil que ha evitado inundaciones durante siglos.", 
        latitude: 37.3845, longitude: -5.9900, type: "historical", visited: false, 
        photoSpot: { angle: "Contrapicado de las cruces de forja", milesReward: 50, secretLocation: "Cruce de calles", bestTime: "Noche", instagramHook: "HiddenSevilla" } 
      }
    ]
  },
  {
    id: "mad_masterclass_01",
    city: "Madrid",
    title: "Madrid: Ingeniería del Imperio y la Verticalidad Borbónica",
    description: "Una disección técnica exhaustiva de la capital de España. Analizamos la mecánica de suelos de la Meseta, la estereotomía del granito del Guadarrama, la física de cargas de los monumentos herrerianos y la evolución del urbanismo táctico desde los qanats árabes hasta el rascacielos de hormigón armado.",
    duration: "12h", distance: "18 km", difficulty: "Hard", theme: "Masterclass Ingeniería e Historia", isEssential: true,
    stops: [
      { 
        id: "m1", 
        name: "Puerta del Sol: Cronometría y Cavernas EPB", 
        description: "La Puerta del Sol no es solo el kilómetro cero, es un nexo de complejidad geotécnica. Bajo el pavimento se encuentra la estación de Sol, una de las cavernas más grandes del mundo excavada en un entorno urbano densamente consolidado. Se utilizó tecnología de tuneladoras EPB (Earth Pressure Balance) para excavar en un terreno compuesto por arenas y arcillas de la cuenca del Manzanares, manteniendo una presión constante para evitar el colapso de los cimientos de los edificios circundantes del siglo XIX.", 
        latitude: 40.4168, longitude: -3.7038, type: "historical", visited: false, 
        photoSpot: { angle: "Frente al Km 0 apuntando al Reloj de Losada", milesReward: 50, secretLocation: "Placa del Km 0", bestTime: "12:00", instagramHook: "SolTech" } 
      }
    ]
  },
  {
    id: "bcn_masterclass_02",
    city: "Barcelona",
    title: "Barcelona: La Psicosis de Gaudí y la Ingeniería de la Luz",
    description: "Un laboratorio de física aplicada, geometría descriptiva y algoritmos constructivos a escala urbana. Analizamos la catenaria, la estereotomía orgánica y la computación lítica en el corazón del Eixample.",
    duration: "12h", distance: "20 km", difficulty: "Hard", theme: "Masterclass Modernismo e Ingeniería",
    stops: [
      { 
        id: "b1", 
        name: "Casa Batlló: Algoritmos de Ventilación y Óptica Cromática", 
        description: "Antoni Gaudí aplicó principios de mecánica de fluidos y efecto Venturi en la Casa Batlló para crear un sistema de climatización pasiva. El patio de luces central utiliza una gradación cromática de cinco tonos de azul para compensar la dispersión de la luz natural, logrando una iluminación uniforme.", 
        latitude: 41.3916, longitude: 2.1647, type: "architecture", visited: false, 
        photoSpot: { angle: "Fachada azul desde la acera de enfrente", milesReward: 150, secretLocation: "Paseo de Gracia", bestTime: "Atardecer", instagramHook: "GaudiOptics" } 
      }
    ]
  }
];
