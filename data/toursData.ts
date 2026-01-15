
import { Tour } from '../types';

export const STATIC_TOURS: Tour[] = [
  {
    id: "svq_essential_masterclass",
    city: "Sevilla",
    title: "Sevilla: Ingeniería Mudéjar y Crónica Forense de Indias",
    description: "Análisis técnico de alta densidad. Patología de la piedra, estática almohade y crónica negra de Indias. Un informe forense de 10 paradas obligatorias.",
    duration: "4h", distance: "4.8 km", difficulty: "Hard", theme: "Bidaer Essential", isEssential: true,
    stops: [
      { 
        id: "s1", 
        name: "La Giralda: Análisis Sísmico y Torsión Almohade", 
        description: "Analista, detente frente a este prodigio de la ingeniería almohade del siglo XII. La Giralda no es un campanario; es un búnker vertical diseñado para resistir la torsión mecánica más extrema. Su estructura interna se basa en dos prismas concéntricos de ladrillo, separados por un espacio de 2.5 metros donde se despliegan 34 rampas helicoidales. Esta configuración no es solo para el ascenso de jinetes; técnicamente, las rampas actúan como nervios de refuerzo que confieren a la torre una rigidez torsional asombrosa, permitiéndole sobrevivir al devastador terremoto de Lisboa de 1755 mientras las torres europeas de diseño lineal colapsaban por resonancia armónica. La cimentación es una balsa isostática de sillería que flota sobre el estrato aluvial del Guadalquivir. Cada ladrillo de la decoración de 'sebka' cumple una función de transpiración del núcleo, evitando la humedad intersticial que degradaría el mortero de cal milenario. El Giraldillo, una masa de bronce de 1.2 toneladas, no es solo arte; es una veleta técnica con un centro de gravedad desplazado que actúa como un disipador de energía eólica pasivo. Observa la patología del ladrillo: la pátina del tiempo oculta una resistencia a la compresión que supera con creces los estándares modernos.", 
        latitude: 37.3861, longitude: -5.9925, 
        type: "architecture", visited: false, 
        photoSpot: { angle: "Contrapicado absoluto buscando la verticalidad del fuste", milesReward: 150, secretLocation: "Base de la Giralda" } 
      },
      { 
        id: "s2", 
        name: "Catedral: La Patología del Gótico Masivo", 
        description: "Informe de materiales: Detente y observa la estructura gótica con mayor volumen de aire confinado del planeta. Sus pilares fasciculados, de 3 metros de diámetro, son núcleos de mampostería revestidos de sillería de piedra de Estepa, diseñados para soportar los empujes laterales de bóvedas de crucería a 42 metros de altura. La patología del edificio es fascinante: debido a que se asienta sobre la planta de la antigua mezquita mayor, los empujes no son perfectamente simétricos, lo que genera deformaciones estructurales monitorizadas hoy con precisión láser. El 'mal de la piedra' es evidente en las fachadas, causado por la humedad capilar que asciende desde el antiguo cauce fluvial. El Monumento a Colón es una pieza de fundición de acero y bronce que transmite toneladas de peso directamente a los cimientos romanos reutilizados. Las vidrieras actúan como juntas de dilatación térmica frente al calor extremo, utilizando nervios de plomo flexibles. Analiza este edificio: no se construyó para el rezo, sino para demostrar un poder estático absoluto sobre la gravedad.", 
        latitude: 37.3858, longitude: -5.9931, 
        type: "historical", visited: false, 
        photoSpot: { angle: "Desde el Patio de los Naranjos buscando la fuga de arcos", milesReward: 120, secretLocation: "Puerta del Lagarto" } 
      },
      { 
        id: "s3", 
        name: "Real Alcázar: El Búnker del Poder y la Hidráulica", 
        description: "Análisis de inteligencia urbana: Detente aquí. El Alcázar es un puzzle de capas defensivas y climáticas. El Palacio Mudéjar de Pedro I utiliza el yeso y la madera de cedro en sus artesonados por ligereza técnica. Son estructuras de armadura que cubren luces inmensas sin vigas intermedias. El Salón de Embajadores posee una cúpula semiesférica autoportante que proyecta la acústica de forma omnidireccional. Crónica negra: Aquí se firmaron las rutas de la plata y se gestaron ejecuciones de estado. Bajo tus pies, los baños de Doña María de Padilla funcionan como un búnker térmico subterráneo; la inercia del terreno mantiene la temperatura constante, regulando el clima de forma pasiva. La red hidráulica es almohade, basada en la gravedad pura y el control de presiones, una ingeniería de fluidos que lleva 800 años operativa sin una sola bomba eléctrica. Observa cómo el agua fluye por canales de ladrillo que actúan como radiadores naturales.", 
        latitude: 37.3839, longitude: -5.9914, 
        type: "architecture", visited: false, 
        photoSpot: { angle: "Reflejo en el estanque de los baños", milesReward: 130, secretLocation: "Cenador" } 
      },
      { 
        id: "s4", 
        name: "Archivo de Indias: Ingeniería de Datos Imperial", 
        description: "Logística y diseño herreriano: Detente ante este cubo de proporciones áureas. Juan de Herrera diseñó este edificio como Lonja de Mercaderes bajo un concepto de austeridad estática máxima. Es una estructura construida en piedra de Estepa incombustible. Su misión técnica hoy es albergar 43.000 legajos: toneladas de papel que ejercen una carga masiva sobre los forjados de piedra. El edificio utiliza una red de ventilación natural cruzada oculta en los gruesos muros, una ingeniería de climatización pasiva del siglo XVI que evita la putrefacción de los documentos originales de Magallanes. La escalera principal es un vector de fuerza imponente que distribuye el peso de forma uniforme. Todo aquí es bóveda de piedra, un búnker de datos diseñado para resistir siglos de erosión y fuego. Analiza la simetría: cada estante de madera está alineado con los ejes de carga del edificio.", 
        latitude: 37.3847, longitude: -5.9933, 
        type: "historical", visited: false, 
        photoSpot: { angle: "Fuga de pasillos con estanterías infinitas", milesReward: 80, secretLocation: "Escalera" } 
      },
      { 
        id: "s5", 
        name: "Torre del Oro: Hidráulica y Defensa de Ribera", 
        description: "Análisis fluvial: Observa esta torre albarrana de tres cuerpos cuya cimentación se adentra en el lecho arenoso del Guadalquivir. Detente en el muelle. Utiliza una balsa de pilotes de madera de encina que actúan como amortiguador hidráulico frente a las crecidas. Su función era ser el anclaje de una cadena masiva que cerraba el puerto; la torre resistía tensiones de tracción lateral de varias toneladas mediante muros de 2.5 metros de espesor. El revestimiento de cal original servía para impermeabilizar el núcleo contra la humedad capilar y el salitre. Crónica forense: El tercer cuerpo es una adición del siglo XVIII tras el terremoto de Lisboa, diseñada para coronar el monumento sin añadir una carga que comprometiera la estabilidad de la cimentación original. Es un ejemplo de refuerzo estructural adaptativo.", 
        latitude: 37.3824, longitude: -5.9964, 
        type: "architecture", visited: false, 
        photoSpot: { angle: "Desde el Puente San Telmo al atardecer", milesReward: 100, secretLocation: "Muelle" } 
      },
      { 
        id: "s6", 
        name: "Plaza de España: Escenografía del Ladrillo", 
        description: "Ingeniería de la Exposición del 29: Detente en el centro de este semicírculo de 200 metros de diámetro. Obra de Aníbal González, simboliza el abrazo de España a sus colonias. Utiliza el ladrillo visto y la cerámica trianera, materiales de alta resistencia térmica. El canal requiere una impermeabilización constante mediante láminas bituminosas para evitar filtraciones en los sótanos que albergan archivos militares. Su diseño es tan perfecto que ha servido de escenario para Naboo en Star Wars, demostrando que la arquitectura puede generar mundos alternativos mediante la pura proporción y el color. Observa los puentes: cada arco es un ejercicio de carga distribuida en cerámica vidriada. Analiza los 48 bancos provinciales: cada uno es un nodo de información histórica y heráldica codificada en azulejo.", 
        latitude: 37.3772, longitude: -5.9869, 
        type: "culture", visited: false, 
        photoSpot: { angle: "Puente central buscando la simetría", milesReward: 140, secretLocation: "Banco Madrid" } 
      },
      { 
        id: "s7", 
        name: "Parque María Luisa: Pulmón Térmico", 
        description: "Ingeniería botánica: Detente bajo la sombra de estos cipreses. El diseño de este parque actúa como un pulmón que reduce la temperatura ambiente de Sevilla en 5 grados durante el verano mediante la evapotranspiración. La red de estanques y fuentes utiliza el ciclo del agua para generar microclimas constantes. Las raíces de los árboles monumentales son monitorizadas para no dañar el alcantarillado histórico. Es una infraestructura verde diseñada para la resiliencia climática del casco histórico. Observa la Glorieta de Bécquer: las estatuas de mármol sufren patologías por la lluvia ácida urbana, un proceso de degradación química que los analistas de Bidaer seguimos de cerca.", 
        latitude: 37.3752, longitude: -5.9886, 
        type: "nature", visited: false, 
        photoSpot: { angle: "Glorieta de Bécquer bajo los cipreses", milesReward: 60, secretLocation: "Estanque" } 
      },
      { 
        id: "s8", 
        name: "Triana: Ingeniería de Barro y Castillo San Jorge", 
        description: "Arquitectura aluvial: Cruza el puente y detente en el Altozano. Este barrio está asentado sobre sedimentos fluviales inestables. Sus casas son ejemplos de resiliencia a inundaciones. El Puente de Triana es la estructura de hierro más antigua de España, utilizando arcos de fundición que permiten el paso del tráfico fluvial. Crónica negra: El Castillo de San Jorge, sede de la Inquisición, ocultaba calabozos bajo el nivel freático. La humedad aquí no es solo ambiental, es histórica; el barro de Triana ha construido la ciudad entera desde sus hornos cerámicos medievales. Analiza la cerámica de los zaguanes: cada patrón geométrico oculta la identidad de los maestros alfareros que desafiaron los decretos reales.", 
        latitude: 37.3852, longitude: -6.0001, 
        type: "culture", visited: false, 
        photoSpot: { angle: "Calle Betis desde la otra orilla", milesReward: 70, secretLocation: "Mercado" } 
      },
      { 
        id: "s9", 
        name: "Metropol Parasol: Madera Hi-Tech", 
        description: "Ingeniería contemporánea: Detente bajo las 'Setas', la mayor estructura de madera del mundo. Paneles de pino laminado unidos por resinas de alta resistencia. Protege las ruinas romanas del subsuelo mediante micropilotes que evitan el contacto con los estratos arqueológicos. Es un desafío a la dilatación térmica de la madera en climas extremos. Su estructura de celosía fractal disipa el calor y proporciona una sombra técnica necesaria en la Plaza de la Encarnación. Analiza el Mirador: la pasarela helicoidal compensa las oscilaciones producidas por el viento mediante amortiguadores de masa sintonizados.", 
        latitude: 37.3932, longitude: -5.9918, 
        type: "architecture", visited: false, 
        photoSpot: { angle: "Pasarela superior con vistas 360", milesReward: 120, secretLocation: "Mirador" } 
      },
      { 
        id: "s10", 
        name: "Fábrica de Tabacos: Nodo Logístico e Industrial", 
        description: "Ingeniería industrial del siglo XVIII: Detente ante el segundo edificio más grande de España. Es un recinto fortificado con foso propio para proteger el monopolio del tabaco. Su diseño incluye patios de ventilación masiva para secar las hojas de tabaco de las Indias. Fue el epicentro de la logística mundial. Crónica: Aquí trabajaba Carmen, la de la ópera. Hoy es sede universitaria, pero sus muros de piedra ostentan marcas de cantería y sistemas de desagüe pluvial que aún funcionan perfectamente. Observa la piedra de Tarifa: su porosidad permite que el edificio 'respire', manteniendo una temperatura interior constante sin necesidad de maquinaria.", 
        latitude: 37.3802, longitude: -5.9916, 
        type: "historical", visited: false, 
        photoSpot: { angle: "Foso lateral buscando la perspectiva defensiva", milesReward: 90, secretLocation: "Puerta Principal" } 
      }
    ]
  },
  {
    id: "mad_essential_masterclass",
    city: "Madrid",
    title: "Madrid: El Nodo Central de la Estática Imperial",
    description: "Análisis forense de la Puerta del Sol y el Madrid de los rascacielos. Densidad Masterclass.",
    duration: "4h", distance: "5.2 km", difficulty: "Hard", theme: "Bidaer Essential", isEssential: true,
    stops: [
      { id: "m1", name: "Puerta del Sol", description: "Analista, detente en el Kilómetro Cero. Plaza flotante sobre tres líneas de metro excavadas en terreno arenoso...", latitude: 40.4168, longitude: -3.7038, type: "architecture", visited: false, photoSpot: { angle: "KM 0", milesReward: 80, secretLocation: "Placa" } }
    ]
  }
];
