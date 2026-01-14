
import { Tour } from '../types';

export const STATIC_TOURS: Tour[] = [
  {
    id: "mad_masterclass_01",
    city: "Madrid",
    title: "Madrid: Ingeniería del Imperio y la Verticalidad Borbónica",
    description: "Una disección técnica exhaustiva de la capital de España. Analizamos la mecánica de suelos de la Meseta, la estereotomía del granito del Guadarrama, la física de cargas de los monumentos herrerianos y la evolución del urbanismo táctico desde los qanats árabes hasta el rascacielos de hormigón armado. Un tour diseñado para quienes buscan entender la maquinaria invisible que sostiene la historia de la Villa y Corte.",
    duration: "12h", distance: "18 km", difficulty: "Hard", theme: "Masterclass Ingeniería e Historia", isEssential: true,
    stops: [
      { 
        id: "m1", 
        name: "Puerta del Sol: Cronometría y Cavernas EPB", 
        description: "La Puerta del Sol no es solo el kilómetro cero, es un nexo de complejidad geotécnica. Bajo el pavimento se encuentra la estación de Sol, una de las cavernas más grandes del mundo excavada en un entorno urbano densamente consolidado. Se utilizó tecnología de tuneladoras EPB (Earth Pressure Balance) para excavar en un terreno compuesto por arenas y arcillas de la cuenca del Manzanares, manteniendo una presión constante para evitar el colapso de los cimientos de los edificios circundantes del siglo XIX. El Reloj de Losada, que corona la Real Casa de Correos, es una obra maestra de la horología que utiliza un escape de áncora y un péndulo de compensación térmica para neutralizar las dilataciones del metal debidas a las fluctuaciones de temperatura extremas de Madrid. El diseño de Losada permitió que el mecanismo no variara su precisión ni un segundo al mes, superando a los estándares suizos de la época.", 
        latitude: 40.4168, longitude: -3.7038, type: "historical", visited: false, 
        photoSpot: { angle: "Frente al Km 0 apuntando al Reloj de Losada", milesReward: 50, secretLocation: "Placa del Km 0", bestTime: "12:00", instagramHook: "SolTech" } 
      },
      { 
        id: "m2", 
        name: "Plaza Mayor: Resistencia Térmica y Bóvedas de Ladrillo", 
        description: "Tras el devastador incendio de 1790, Juan de Villanueva rediseñó la Plaza Mayor bajo criterios de ingeniería ignífuga radicalmente modernos. El objetivo era eliminar sistemáticamente la madera estructural, sustituyéndola por piedra de granito y bóvedas de ladrillo macizo. La plaza funciona estructuralmente como una gran losa de transferencia que reparte las cargas gravitatorias de las cinco plantas superiores hacia una red de soportales de arco de medio punto. Estos arcos están calculados aritméticamente para resistir asientos diferenciales en un terreno que, históricamente, era una laguna (la Laguna de Luján). Bajo el suelo, se oculta una red de vigas pretensadas de los años 60 que permite la existencia de un aparcamiento subterráneo masivo sin comprometer la estabilidad secular de las fachadas de sillería.", 
        latitude: 40.4154, longitude: -3.7074, type: "architecture", visited: false, 
        photoSpot: { angle: "Bajo los arcos de Cuchilleros mirando a la plaza", milesReward: 50, secretLocation: "Arco de Cuchilleros", bestTime: "Noche", instagramHook: "PlazaMayorMaster" } 
      },
      { 
        id: "m3", 
        name: "Mercado de San Miguel: Metalurgia y Coeficientes de Dilatación", 
        description: "Inaugurado en 1916, este mercado es el mejor ejemplo de la arquitectura de hierro en Madrid. A diferencia de las estructuras pétreas, el hierro exige el cálculo preciso de los coeficientes de dilatación térmica. Sus finos soportes de fundición y jácenas de celosía remachadas permiten una transparencia estructural que la mampostería no podría alcanzar, reduciendo la sección de apoyo al mínimo para maximizar el espacio comercial. El sistema de cubierta utiliza piezas cerámicas que actúan como aislante térmico pasivo, protegiendo el interior de la radiación solar directa. La envolvente de vidrio fue una innovación radical que permitió integrar la luz natural como un elemento de diseño funcional, facilitando la conservación y exposición de productos frescos mediante corrientes de convección natural generadas por la diferencia de altura en los lucernarios.", 
        latitude: 40.4155, longitude: -3.7088, type: "architecture", visited: false, 
        photoSpot: { angle: "Fachada de hierro iluminada", milesReward: 50, secretLocation: "Esquina del mercado", bestTime: "Tarde", instagramHook: "IronMadrid" } 
      },
      { 
        id: "m4", 
        name: "Plaza de la Villa: Estereotomía y Aparejos Mudéjares", 
        description: "Esta plaza es un catálogo vivo de la evolución de la cantería española. La Torre de los Lujanes (siglo XV) presenta un aparejo de ladrillo mudéjar dispuesto en soga y tizón que optimiza la resistencia a flexión de los muros. Por otro lado, la Casa de la Villa representa el estilo herreriano madrileño, donde el granito de la Sierra de Guadarrama se corta en grandes bloques (estereotomía) con una precisión milimétrica, utilizando juntas de mortero de cal mínimas para que la estructura trabaje casi exclusivamente a compresión pura. Analizamos también el uso del pedernal en las bases de los edificios más antiguos, una piedra de extrema dureza capaz de resistir la humedad por capilaridad generada por los antiguos arroyos subterráneos que atraviesan esta zona de Madrid, como el arroyo de San Pedro.", 
        latitude: 40.4153, longitude: -3.7101, type: "historical", visited: false, 
        photoSpot: { angle: "Desde el centro mirando a la Torre de los Lujanes", milesReward: 40, secretLocation: "Plaza de la Villa", bestTime: "Mañana", instagramHook: "OldMadrid" } 
      },
      { 
        id: "m5", 
        name: "Catedral de la Almudena: Hibridación de Cargas y Cúpula de Doble Casco", 
        description: "La Almudena es un híbrido estructural único en el mundo. Aunque su estética exterior es neoclásica para armonizar con el Palacio Real, su esqueleto es de corte neogótico. El desafío técnico fue construir una cúpula de doble casco (interior de piedra, exterior de metal) que no generara empujes laterales excesivos sobre los muros de la nave. Se utilizaron arbotantes ocultos y un sistema de pilares fasciculados que transmiten las cargas gravitatorias directamente al terreno granítico de la cornisa de Madrid. La cripta neogótica es una proeza de la cantería fina, con más de 400 columnas cada una tallada en un bloque monolítico de caliza de Colmenar, diseñadas para soportar el peso masivo del crucero superior mediante una red de bóvedas de crucería de alta precisión geométrica.", 
        latitude: 40.4158, longitude: -3.7145, type: "architecture", visited: false, 
        photoSpot: { angle: "Desde la plaza entre Palacio y Catedral", milesReward: 50, secretLocation: "Cúpula", bestTime: "Atardecer", instagramHook: "AlmudenaTech" } 
      },
      { 
        id: "m6", 
        name: "Palacio Real: Inercia Térmica y Estructura Monolítica", 
        description: "Con 135,000 metros cuadrados, es el palacio real más grande de Europa Occidental. Su construcción en piedra caliza de Colmenar y granito responde a la necesidad de evitar incendios tras la destrucción del antiguo Alcázar. Los muros maestros superan los 3 metros de espesor en su base, proporcionando una inercia térmica masiva que permite que el edificio mantenga una temperatura interna constante de unos 20 grados durante todo el año de forma pasiva. La estructura se apoya sobre la cornisa del Manzanares mediante una cimentación escalonada que debió lidiar con las arenas inestables del terreno. El sistema de bóvedas del palacio elimina la necesidad de vigas de madera, convirtiéndolo en un bloque de piedra y ladrillo casi indestructible ante los agentes atmosféricos y el fuego.", 
        latitude: 40.4173, longitude: -3.7143, type: "historical", visited: false, 
        photoSpot: { angle: "Desde la Plaza de la Armería enfocando la fachada", milesReward: 100, secretLocation: "Patio de Armas", bestTime: "Mañana", instagramHook: "RoyalPalaceMaster" } 
      },
      { 
        id: "m7", 
        name: "Plaza de Oriente: Equilibrio Dinámico de Galileo", 
        description: "La estatua ecuestre de Felipe IV es un hito de la física aplicada al arte. Fue la primera en el mundo en sostenerse únicamente sobre sus patas traseras. Para lograr este equilibrio dinámico, el escultor Pietro Tacca recurrió a los cálculos de Galileo Galilei. La física detrás del bronce es fascinante: la parte trasera del caballo es de bronce macizo para desplazar el centro de gravedad hacia atrás y hacia abajo, mientras que la parte delantera es hueca y de espesor mínimo para reducir el momento de vuelco. Las patas traseras actúan como un fulcro estructural capaz de soportar toneladas de metal en un ángulo oblicuo, transmitiendo el esfuerzo de torsión directamente al pedestal de granito.", 
        latitude: 40.4173, longitude: -3.7126, type: "historical", visited: false, 
        photoSpot: { angle: "Alineación de la estatua con el Palacio Real al fondo", milesReward: 60, secretLocation: "Estatua", bestTime: "Atardecer", instagramHook: "GalileoPhysics" } 
      },
      { 
        id: "m8", 
        name: "Teatro Real: Maquinaria Escénica y Losa de Estanqueidad", 
        description: "El Teatro Real es una proeza de la ingeniería electroacústica y mecánica. Su caja escénica permite el movimiento vertical y horizontal de plataformas de hasta 60 toneladas mediante hidráulicos de alta precisión. Pero su mayor secreto está bajo tierra: debido a que se asienta sobre el antiguo cauce del arroyo de Leganitos, el edificio se construyó sobre una 'cubeta' o losa impermeable de hormigón reforzado para evitar inundaciones freáticas. El foso de la orquesta cuenta con paneles acústicos móviles de madera de cedro que pueden sintonizarse para variar el tiempo de reverberación según la ópera que se represente, un logro de la ingeniería que permite una claridad sonora impecable en todas las plantas del auditorio.", 
        latitude: 40.4181, longitude: -3.7104, type: "architecture", visited: false, 
        photoSpot: { angle: "Fachada desde la Plaza de Isabel II", milesReward: 50, secretLocation: "Plaza de Isabel II", bestTime: "Noche", instagramHook: "OperaTech" } 
      },
      { 
        id: "m9", 
        name: "Monasterio de las Descalzas Reales: Hidráulica de los Qanats", 
        description: "Bajo este monasterio se encuentra uno de los puntos clave de los 'Viajes de Agua' árabes. Madrid es la única capital europea que no nació junto a un gran río, sino que basó su supervivencia en una red de minas de captación de agua freática. Analizamos la ingeniería hidráulica islámica (qanats) que utilizaba la gravedad y decantadores de arena para abastecer a la ciudad. El monasterio, construido sobre el antiguo palacio de Carlos I, mantiene muros de mampostería toledana que protegen tesoros artísticos mediante una regulación natural de la humedad capilar. El diseño de sus patios internos permite una ventilación por convección que mantiene frescos los espacios de clausura en el seco verano madrileño.", 
        latitude: 40.4185, longitude: -3.7056, type: "historical", visited: false, 
        photoSpot: { angle: "Entrada principal", milesReward: 70, secretLocation: "Puerta", bestTime: "Mañana", instagramHook: "ArabWater" } 
      },
      { 
        id: "m10", 
        name: "Jardines de Sabatini: Estabilidad Gravitatoria y Neoclasicismo", 
        description: "Estos jardines fueron diseñados en los años 30 tras la demolición de las antiguas caballerizas reales. El reto técnico fue salvar el desnivel de casi 20 metros hacia la Cuesta de San Vicente. Se utilizaron muros de contención masivos de granito y un diseño de terrazas que garantizan la estabilidad del terreno frente a empujes laterales. El eje de simetría matemática que alinea las fuentes con la fachada norte del Palacio Real no es solo estético; responde a una planificación racionalista del espacio urbano que busca la armonía visual mediante la repetición de patrones geométricos en el seto de tejo, que además actúa como una barrera acústica natural contra el ruido del tráfico inferior.", 
        latitude: 40.4194, longitude: -3.7142, type: "nature", visited: false, 
        photoSpot: { angle: "Desde la barandilla superior mirando al palacio", milesReward: 50, secretLocation: "Escalinatas", bestTime: "Noche", instagramHook: "SabatiniTech" } 
      },
      { 
        id: "m11", 
        name: "Templo de Debod: Anastilosis y Orientación Solar", 
        description: "El Templo de Debod es una proeza de la logística arqueológica moderna. Fue trasladado piedra a piedra (anastilosis) desde Egipto como regalo a España. Analizamos la técnica de numeración y reconstrucción de las 2,200 piezas de arenisca nubia, un material extremadamente poroso que debió ser tratado químicamente para resistir las heladas de Madrid. Se calculó la orientación astronómica original para que la luz de los solsticios penetrara en el naos, replicando la función litúrgica original. El estanque que rodea el templo no es solo decorativo; funciona como un regulador de humedad ambiental para evitar que la piedra se agriete debido a la baja humedad relativa de la meseta castellana.", 
        latitude: 40.4241, longitude: -3.7177, type: "historical", visited: false, 
        photoSpot: { angle: "Reflejo del templo en el agua al atardecer", milesReward: 100, secretLocation: "Borde del estanque", bestTime: "Atardecer", instagramHook: "DebodMaster" } 
      },
      { 
        id: "m12", 
        name: "Viaducto de Segovia: Curva de Presiones y Mecánica Racional", 
        description: "El viaducto actual, terminado en 1934, es una obra maestra de la ingeniería civil de hormigón armado de entreguerras. Sustituyó a una estructura de hierro para soportar las nuevas cargas del tráfico rodado pesado. Analizamos la geometría de sus tres arcos de 35 metros de luz, diseñados siguiendo la curva de presiones óptima para reducir los momentos flectores al mínimo. El hormigón utilizado fue de una resistencia excepcional para la época, permitiendo una esbeltez en los pilares que desafía la percepción visual. El pretil aerodinámico está diseñado no solo por estética, sino para reducir la carga de viento lateral que azota el corredor natural de la calle Segovia hacia el río Manzanares.", 
        latitude: 40.4135, longitude: -3.7142, type: "architecture", visited: false, 
        photoSpot: { angle: "Desde la calle Segovia mirando hacia arriba", milesReward: 90, secretLocation: "Calle Segovia", bestTime: "Tarde", instagramHook: "BridgeMaster" } 
      },
      { 
        id: "m13", 
        name: "Plaza de España: Rascacielos y Cimentación Profunda", 
        description: "La Plaza de España alberga los primeros rascacielos de Madrid: el Edificio España y la Torre de Madrid. Analizamos el uso pionero del hormigón armado en altura en Europa (1953). El Edificio España requirió una cimentación por pozos profundos de hasta 15 metros para alcanzar el sustrato firme de arenas compactas y toscas madrileñas. Su estructura de pórticos rígidos de hormigón permitió crear plantas diáfanas y una fachada de ladrillo visto con un sistema de anclajes metálicos ocultos. La reciente reforma de la plaza integra un sistema de drenaje sostenible (SUDs) que capta el agua de lluvia para recargar los acuíferos locales, una innovación técnica que mejora la resiliencia urbana ante el cambio climático.", 
        latitude: 40.4231, longitude: -3.7121, type: "architecture", visited: false, 
        photoSpot: { angle: "Panorámica de los rascacielos desde el monumento a Cervantes", milesReward: 60, secretLocation: "Centro de la plaza", bestTime: "Mañana", instagramHook: "SkylineTech" } 
      },
      { 
        id: "m14", 
        name: "Gran Vía: Ingeniería de la Reforma Urbana Radial", 
        description: "La construcción de la Gran Vía fue la mayor obra de ingeniería civil urbana en Madrid de principios del siglo XX. Analizamos la demolición de más de 300 casas y la excavación masiva para soterrar infraestructuras de gas, agua y electricidad siguiendo modelos de ciudades como Chicago o París. Los edificios, como el Metrópolis o el Carrion (Capitol), introdujeron estructuras mixtas de acero y hormigón. El Capitol es especialmente relevante por su estructura de vigas Vierendeel de acero que permiten grandes luces en las salas de cine inferiores sin columnas intermedias, un alarde técnico de la arquitectura racionalista que cambió la escala vertical de la ciudad.", 
        latitude: 40.4196, longitude: -3.7042, type: "architecture", visited: false, 
        photoSpot: { angle: "Edificio Metrópolis desde el cruce de Alcalá", milesReward: 50, secretLocation: "Acera de Alcalá", bestTime: "Noche", instagramHook: "GranViaTech" } 
      },
      { 
        id: "m15", 
        name: "Círculo de Bellas Artes: Art Déco Estructural y Lucernarios", 
        description: "Obra cumbre de Antonio Palacios, el Círculo de Bellas Artes es una lección de composición estructural escalonada. Analizamos la torre principal, construida con una estructura de acero que sostiene la estatua de Minerva de casi 3,000 kg. El diseño interior utiliza lucernarios de hormigón translúcido y techos de gran altura para inundar de luz natural los salones de arte de forma indirecta, evitando sombras duras. La terraza funciona como una losa de compresión masiva que estabiliza el edificio ante vientos fuertes procedentes de la Sierra de Guadarrama, ofreciendo una de las plataformas de observación técnica más privilegiadas para estudiar el skyline de la ciudad.", 
        latitude: 40.4189, longitude: -3.6966, type: "architecture", visited: false, 
        photoSpot: { angle: "Desde la azotea mirando a la Gran Vía", milesReward: 150, secretLocation: "Terraza del CBA", bestTime: "Atardecer", instagramHook: "CircleMaster" } 
      }
    ]
  },
  {
    id: "bcn_masterclass_02",
    city: "Barcelona",
    title: "Barcelona: La Psicosis de Gaudí y la Ingeniería de la Luz",
    description: "Un laboratorio de física aplicada, geometría descriptiva y algoritmos constructivos a escala urbana. Analizamos la catenaria, la estereotomía orgánica, la mecánica de fluidos y la computación lítica en el corazón del Eixample de Ildefons Cerdà.",
    duration: "12h", distance: "20 km", difficulty: "Hard", theme: "Masterclass Modernismo e Ingeniería",
    stops: [
      { 
        id: "b1", 
        name: "Casa Batlló: Algoritmos de Ventilación y Óptica Cromática", 
        description: "Antoni Gaudí aplicó principios de mecánica de fluidos y efecto Venturi en la Casa Batlló para crear un sistema de climatización pasiva. El patio de luces central utiliza una gradación cromática de cinco tonos de azul (más oscuro arriba, más claro abajo) para compensar la dispersión de la luz natural, logrando una iluminación uniforme en todas las plantas. Las ventanas inferiores son mayores que las superiores para equilibrar la ventilación cruzada. Analizamos el trencadís de la fachada, que actúa como una 'piel elástica' que absorbe las dilataciones térmicas del mortero sin fracturarse, mientras que el tejado en forma de lomo de dragón oculta una estructura de arcos de ladrillo tabicado de extrema ligereza.", 
        latitude: 41.3916, longitude: 2.1647, type: "architecture", visited: false, 
        photoSpot: { angle: "Fachada azul desde la acera de enfrente", milesReward: 150, secretLocation: "Paseo de Gracia", bestTime: "Atardecer", instagramHook: "GaudiOptics" } 
      },
      { 
        id: "b2", 
        name: "Casa Milà: Estructura de Planta Libre y Arcos Catenarios", 
        description: "La Pedrera eliminó los muros de carga tradicionales, sustituyéndolos por una retícula de pilares de piedra, ladrillo y hierro. Esta 'estructura de planta libre' permite que cada propietario modifique la distribución interna sin afectar la estabilidad del edificio. El desván es una joya de la ingeniería: está formado por 270 arcos catenarios de ladrillo plano que soportan la azotea. La curva catenaria es la forma física perfecta donde no existen empujes laterales, solo compresión pura, lo que permitió a Gaudí crear una estructura extremadamente ligera y resistente. Las chimeneas de la azotea están diseñadas aerodinámicamente para mejorar el tiro de ventilación mediante el aprovechamiento de los vientos dominantes de la costa.", 
        latitude: 41.3952, longitude: 2.1619, type: "architecture", visited: false, 
        photoSpot: { angle: "Desde la azotea entre las chimeneas guerreras", milesReward: 100, secretLocation: "Terraza de la Pedrera", bestTime: "Atardecer", instagramHook: "PedreraTech" } 
      },
      { 
        id: "b3", 
        name: "Sagrada Família: Computación Lítica y Piedra Postensada", 
        description: "El templo expiatorio es hoy el laboratorio de ingeniería 4.0 más importante del mundo. Se utiliza software de diseño paramétrico aeroespacial para calcular las complejas formas de las columnas arborescentes hiperboloides. Las torres centrales se construyen mediante piedra postensada: bloques de pórfido y granito perforados y atravesados por cables de acero tensados hidráulicamente. Esto convierte a las torres en elementos monolíticos capaces de resistir vientos huracanados y sismos sin necesidad de gruesos muros de contención. Analizamos la geometría fractal de las vidrieras, diseñadas por Joan Vila-Grau, que filtran la luz según un algoritmo cromático que varía según la hora del día y la estación del año.", 
        latitude: 41.4036, longitude: 2.1744, type: "architecture", visited: false, 
        photoSpot: { angle: "Torre de Jesús reflejada en el estanque", milesReward: 250, secretLocation: "Plaza de Gaudí", bestTime: "Mañana", instagramHook: "HolyTech" } 
      },
      { 
        id: "b4", 
        name: "Park Güell: Hidráulica de Recogida y Columnas Inclinadas", 
        description: "Lo que parece un jardín decorativo es en realidad una obra maestra de ingeniería hidráulica. Gaudí diseñó el parque para recoger el agua de lluvia mediante un sistema de drenaje oculto en los viaductos de piedra. El agua se filtra por capas de arena en la Plaza de la Naturaleza y se almacena en una cisterna subterránea de 1,200 metros cúbicos situada bajo la sala hipóstila. Las 86 columnas dóricas de la sala no son solo estéticas; funcionan como un bosque estructural que sostiene el peso de la plaza superior. Las columnas exteriores de los viaductos están inclinadas siguiendo exactamente la línea de empuje del terreno, evitando así muros de contención masivos y permitiendo una integración total con la geología del monte Carmelo.", 
        latitude: 41.4144, longitude: 2.1527, type: "architecture", visited: false, 
        photoSpot: { angle: "Banco de trencadís con vistas panorámicas", milesReward: 100, secretLocation: "Plaza de la Naturaleza", bestTime: "Mañana", instagramHook: "HydraulicGaudi" } 
      },
      { 
        id: "b5", 
        name: "Hospital de Sant Pau: Urbanismo Higienista y Ventilación Forzada", 
        description: "Lluís Domènech i Montaner diseñó una ciudad-hospital basada en los principios del higienismo del siglo XIX. Analizamos la red de 2 km de túneles subterráneos que conectan los pabellones, permitiendo el traslado de pacientes sin contacto exterior. Cada pabellón cuenta con su propio sistema de ventilación cruzada forzada mediante el diseño de ventanas enfrentadas y techos altos que facilitan el movimiento del aire por termodinámica pasiva. El uso extensivo de la cerámica vidriada no era solo decorativo; los azulejos permitían una desinfección total de los muros mediante baldeo, algo crucial en una era donde la asepsia era la mayor arma contra las epidemias industriales de Barcelona.", 
        latitude: 41.4114, longitude: 2.1744, type: "architecture", visited: false, 
        photoSpot: { angle: "Eje central mirando al pabellón de administración", milesReward: 100, secretLocation: "Entrada principal", bestTime: "Tarde", instagramHook: "HealthyModernism" } 
      },
      { 
        id: "b6", 
        name: "Palau de la Música: Membrana Acústica y Vidrio Estructural", 
        description: "Este auditorio es el único declarado Patrimonio de la Humanidad por la UNESCO que es una 'caja de cristal'. Analizamos cómo Domènech i Montaner utilizó el acero y el vidrio como elementos de resonancia acústica. La claraboya central de cristal soplado actúa como una membrana que proyecta el sonido hacia las plantas superiores. Para evitar ecos indeseados, las ninfas de la pared y las molduras cerámicas funcionan como difusores acústicos, rompiendo las ondas sonoras en las frecuencias medias para garantizar una claridad vocal perfecta. La estructura de hierro permite muros cortina de vidrio que inundan la sala de luz natural, una innovación radical en 1908 que eliminó la necesidad de iluminación artificial durante los conciertos diurnos.", 
        latitude: 41.3875, longitude: 2.1753, type: "architecture", visited: false, 
        photoSpot: { angle: "Bajo la gran claraboya central", milesReward: 120, secretLocation: "Platea", bestTime: "Mañana", instagramHook: "AcousticGlass" } 
      },
      { 
        id: "b7", 
        name: "Arc de Triomf: Ingeniería del Ladrillo Visto de la Expo de 1888", 
        description: "Diseñado por Josep Vilaseca, este arco rompió con la tradición de los arcos de triunfo de piedra caliza. Analizamos el uso del ladrillo visto dispuesto en aparejo flamenco, una técnica que resalta la calidad de la arcilla roja local. La cimentación debió ser calculada para soportar las vibraciones del subsuelo aluvial y pantanoso de esta zona cercana a la costa. Los relieves escultóricos, realizados en cemento Portland (material de alta tecnología en 1888), demuestran la voluntad de Barcelona de abrazar nuevos aglomerantes hidráulicos industriales para acelerar la construcción de sus monumentos. El arco no es solo una puerta; es un símbolo de la transición de la ciudad medieval a la metrópolis industrial.", 
        latitude: 41.3911, longitude: 2.1806, type: "historical", visited: false, 
        photoSpot: { angle: "Contrapicado bajo el arco central", milesReward: 40, secretLocation: "Base del arco", bestTime: "Mañana", instagramHook: "BarcelonaArc" } 
      },
      { 
        id: "b8", 
        name: "Port Vell: Ingeniería Marítima y Puente Basculante", 
        description: "Analizamos la infraestructura del puerto viejo y el puente basculante de la Rambla de Mar. Estudiamos los mecanismos hidráulicos de apertura que permiten el paso de veleros hacia la marina, y el diseño de los muelles para resistir la corrosión salina extrema mediante el uso de hormigones de alta densidad con aditivos inhibidores de corrosión. La pasarela ondulada no es solo estética; su geometría está calculada para resistir las cargas dinámicas de miles de peatones diarios, utilizando un sistema de vigas cajón de acero que proporciona rigidez torsional ante los vientos marinos racheados que azotan la zona del World Trade Center.", 
        latitude: 41.3768, longitude: 2.1806, type: "nature", visited: false, 
        photoSpot: { angle: "Desde el puente mirando al Maremagnum", milesReward: 50, secretLocation: "Puente basculante", bestTime: "Noche", instagramHook: "SeaTech" } 
      },
      { 
        id: "b9", 
        name: "Santa Maria del Mar: Gótico de Tensión Óptima", 
        description: "Considerada el mejor ejemplo del gótico catalán puro. Analizamos cómo los maestros de obra del siglo XIV lograron naves de 13 metros de luz apoyadas sobre columnas octogonales de solo 1.6 metros de diámetro. El secreto reside en la tensión óptima de las bóvedas, que traslada los empujes hacia contrafuertes internos masivos ocultos entre las capillas laterales, eliminando la necesidad de arbotantes externos. Esto crea un espacio interior diáfano y continuo, una proeza de la mecánica racional que maximiza la sección de apoyo. Estudiamos también la estereotomía de la piedra de Montjuïc, capaz de soportar esfuerzos de compresión masivos sin fractura mecánica secular.", 
        latitude: 41.3837, longitude: 2.1819, type: "historical", visited: false, 
        photoSpot: { angle: "Nave central hacia el altar", milesReward: 60, secretLocation: "Entrada principal", bestTime: "Mañana", instagramHook: "GothicTech" } 
      },
      { 
        id: "b10", 
        name: "Torre Glòries: Fachada Bioclimática y Doble Piel", 
        description: "Diseñada por Jean Nouvel, la torre Glòries es un hito de la arquitectura bioclimática contemporánea. Analizamos su fachada compuesta por dos capas: una piel interior de hormigón pintado y una piel exterior de lamas de vidrio móvil controladas por un algoritmo informático. Estas lamas se orientan automáticamente según la incidencia solar y la dirección del viento para reducir el consumo energético de climatización. La estructura de hormigón armado utiliza un núcleo central de servicios que estabiliza la torre ante empujes horizontales, mientras que los colores de los paneles de aluminio (que van del rojo en la base al azul en la cima) responden a un estudio de la absorción térmica y la mimetización con el horizonte barcelonés.", 
        latitude: 41.4035, longitude: 2.1894, type: "architecture", visited: false, 
        photoSpot: { angle: "Vista nocturna iluminada desde la Diagonal", milesReward: 70, secretLocation: "Cruce Diagonal/Castillejos", bestTime: "Noche", instagramHook: "AgbarTech" } 
      },
      { 
        id: "b11", 
        name: "Bunkers del Carmel: Logística Defensiva y Hormigón Armado", 
        description: "Antiguas baterías antiaéreas construidas durante la Guerra Civil Española. Analizamos la plataforma de hormigón armado diseñada para absorber el retroceso de los cañones Vickers de 105 mm. La ubicación estratégica en la cima del Turó de la Rovira fue calculada para ofrecer una visibilidad de 360 grados, optimizando el alcance balístico defensivo. Hoy, estas ruinas industriales son un mirador privilegiado para entender el urbanismo de Barcelona de un solo vistazo. Estudiamos cómo la degradación del hormigón expuesto a la intemperie ha sido tratada recientemente para estabilizar la estructura sin perder su carácter histórico de 'búnker de cemento' que domina la ciudad.", 
        latitude: 41.4172, longitude: 2.1620, type: "historical", visited: false, 
        photoSpot: { angle: "Barcelona 360 desde la plataforma superior", milesReward: 100, secretLocation: "Plataforma de cañones", bestTime: "Atardecer", instagramHook: "BunkersTech" } 
      },
      { 
        id: "b12", 
        name: "Funicular del Tibidabo: Mecánica de Tracción y Freno de Seguridad", 
        description: "Inaugurado en 1901, fue el primer funicular de España. Analizamos el sistema de tracción por cable de acero accionado por poleas masivas situadas en la estación superior. Estudiamos la física del plano inclinado con una pendiente del 25% y el sistema de contrapesos que minimiza el esfuerzo del motor eléctrico. Un detalle técnico crucial es el freno de emergencia por zapata, que actúa automáticamente sobre el raíl si la tensión del cable disminuye, una innovación mecánica que garantizó la seguridad en una época de transición tecnológica. El trazado fue calculado para salvar el desnivel de la montaña minimizando los movimientos de tierra mediante viaductos de sillería y túneles cortos excavados en roca metamórfica.", 
        latitude: 41.4116, longitude: 2.1383, type: "historical", visited: false, 
        photoSpot: { angle: "Desde el vagón mirando hacia abajo", milesReward: 50, secretLocation: "Estación inferior", bestTime: "Mañana", instagramHook: "FunicularTech" } 
      },
      { 
        id: "b13", 
        name: "Casa Vicens: Cerámica e Inercia Térmica Bioclimática", 
        description: "En su primera gran obra, Antoni Gaudí exploró el uso de la cerámica como aislante térmico natural. Analizamos la fachada de azulejos (inspirados en la flor de muerto o tagetes) que reflejan la radiación infrarroja, manteniendo frescos los muros de mampostería. El diseño incluye un ingenioso sistema de ventilación pasiva basado en la orientación de las estancias para captar la brisa marina (el Garbí). Estudiamos la estructura mixta de vigas de hierro forjado y bóvedas de ladrillo plano que permitieron a Gaudí crear espacios interiores sin muros de carga masivos, anticipando las soluciones que luego llevaría a la máxima expresión en sus obras de madurez.", 
        latitude: 41.4035, longitude: 2.1507, type: "architecture", visited: false, 
        photoSpot: { angle: "Fachada de azulejos verdes y rojos desde el jardín", milesReward: 80, secretLocation: "Jardín de la casa", bestTime: "Mediodía", instagramHook: "VicensTech" } 
      },
      { 
        id: "b14", 
        name: "Mercado de la Boqueria: Estructura de Acero y Ventilación Cenital", 
        description: "El mercado actual destaca por su cubierta metálica de 1914. Analizamos el uso de pilares de fundición que permiten un espacio diáfano masivo para el flujo de miles de compradores. El diseño de la cubierta incluye una lucernaria central que facilita la salida de aire caliente por convección natural, evitando la condensación de olores y manteniendo una temperatura aceptable para la conservación de alimentos. El cerramiento perimetral de hierro y cristal fue un avance en la ingeniería sanitaria de mercados públicos, protegiendo el recinto de la intemperie mientras mantenía la visibilidad desde las Ramblas, integrando la estructura industrial con la vida social de la ciudad.", 
        latitude: 41.3817, longitude: 2.1716, type: "historical", visited: false, 
        photoSpot: { angle: "Entrada principal desde las Ramblas", milesReward: 40, secretLocation: "Arcada de entrada", bestTime: "Mañana", instagramHook: "BoqueriaTech" } 
      },
      { 
        id: "b15", 
        name: "Catedral de Barcelona: Estereotomía de la Piedra de Montjuïc", 
        description: "La sede de la archidiócesis es un ejemplo magnífico del gótico catalán con adiciones neogóticas. Analizamos la respuesta mecánica de la piedra arenisca de la montaña de Montjuïc ante la erosión salina del ambiente marítimo. El cimborrio y la fachada actual son de finales del siglo XIX, construidos con técnicas de cantería de alta precisión que permitieron culminar el templo medieval. Estudiamos el claustro gótico, donde los arcos apuntados transmiten las cargas hacia contrafuertes robustos que encierran las capillas. El diseño de las gárgolas no es solo artístico; responde a un cálculo de evacuación de aguas pluviales para evitar la humedad por escorrentía en los paramentos de sillería.", 
        latitude: 41.3839, longitude: 2.1764, type: "culture", visited: false, 
        photoSpot: { angle: "Fachada principal desde la Plaza Nova", milesReward: 60, secretLocation: "Plaza de la Catedral", bestTime: "Mañana", instagramHook: "CathedralMaster" } 
      }
    ]
  }
];
