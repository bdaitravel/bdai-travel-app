
import { Tour } from '../types';

export const STATIC_TOURS: Tour[] = [
  {
    id: "mad_essential_1day",
    city: "Madrid",
    title: "Madrid: Essential 1-Day Masterclass",
    description: "La ruta definitiva para descodificar la capital en 24 horas. Desde el Kilómetro Cero hasta la magnitud del Palacio Real. Un análisis forense del poder, la estática de la meseta y la ingeniería borbónica.",
    duration: "4h", distance: "4.5 km", difficulty: "Moderate", theme: "Bidaer Essential", isEssential: true,
    stops: [
      { 
        id: "mad_1", 
        name: "Puerta del Sol: El Centro de Presiones", 
        description: "Analista, estás en el centro de masas de la península. La Puerta del Sol no es solo un espacio público, es un nodo de tensiones logísticas. El edificio de la Real Casa de Correos (1768) utiliza granito de la Sierra de Guadarrama, un material con una resistencia a la compresión de hasta 1200 kg/cm². Observa el reloj: su maquinaria es un prodigio de la mecánica de precisión de 1866. Bajo el pavimento, la ingeniería civil moderna ha creado un vacío estructural masivo para albergar el intercambiador de transportes más denso de España, una balsa de hormigón armado que flota sobre un sustrato de arenas y arcillas inestables. Este es el punto donde la geografía se convierte en política.", 
        latitude: 40.4168, longitude: -3.7038, 
        type: "architecture", visited: false, 
        photoSpot: { angle: "Desde la placa del KM 0 buscando la fuga hacia el Reloj de Gobernación", milesReward: 120, secretLocation: "Placa KM 0" } 
      },
      { 
        id: "mad_2", 
        name: "Plaza Mayor: Ingeniería del Encierro", 
        description: "La Plaza Mayor es un ejercicio de estática barroca. Sus muros de carga de ladrillo macizo soportan una estructura isostática diseñada para resistir grandes concentraciones de masa humana. Los soportales de granito actúan como nervios estructurales que redirigen el peso de cinco plantas de viviendas. Tras el incendio de 1790, Juan de Villanueva implementó aquí los primeros protocolos de seguridad contra incendios en Europa, cerrando la plaza y utilizando bóvedas de ladrillo ignífugas. Analiza la estatua de Felipe III: es una carga puntual de bronce fundido en 1616 que requiere un refuerzo oculto en el forjado de la plaza para no hundirse en los sótanos medievales que subyacen en todo el recinto.", 
        latitude: 40.4154, longitude: -3.7074, 
        type: "historical", visited: false, 
        photoSpot: { angle: "Bajo el Arco de Cuchilleros buscando el desnivel", milesReward: 150, secretLocation: "Arco de Cuchilleros" } 
      },
      { 
        id: "mad_3", 
        name: "Mercado San Miguel: Esqueleto de Hierro", 
        description: "Observa la transición tecnológica. Construido en 1916, es el único mercado de hierro que sobrevive en Madrid. Sus pilares de fundición permiten luces de techo mucho más amplias que la mampostería, optimizando el flujo de aire y luz para la conservación de alimentos. La ingeniería del hierro permitió aquí una fachada de vidrio casi total, una revolución en la eficiencia térmica de la época. Analiza las uniones de roblonado: son la firma de una era donde la metalurgia empezó a dominar el paisaje urbano madrileño, antes de la llegada del hormigón postensado.", 
        latitude: 40.4153, longitude: -3.7089, 
        type: "architecture", visited: false, 
        photoSpot: { angle: "Detalle de los pilares de fundición con el Palacio al fondo", milesReward: 100, secretLocation: "Fachada Este" } 
      },
      { 
        id: "mad_4", 
        name: "Catedral de la Almudena: Análisis de Estilos", 
        description: "Un caso de estudio forense sobre la cronología constructiva. Su construcción abarcó más de un siglo, resultando en un híbrido técnico: una cripta neorrománica de muros masivos que soporta una nave neogótica rematada por una cúpula de estética neoclásica. La cúpula utiliza un sistema de doble casco para gestionar las dilataciones térmicas extremas de Madrid. El interior, con su decoración pop-art contemporánea, rompe la estática visual del gótico tradicional. Es un edificio de 'máscaras' estructurales, diseñado para integrarse visualmente con el Palacio Real mediante el uso de la misma piedra de Colmenar.", 
        latitude: 40.4158, longitude: -3.7145, 
        type: "historical", visited: false, 
        photoSpot: { angle: "Desde la Plaza de la Armería buscando la simetría con el Palacio", milesReward: 130, secretLocation: "Plaza de la Armería" } 
      },
      { 
        id: "mad_5", 
        name: "Palacio Real: Búnker de Granito", 
        description: "Con 135.000 metros cuadrados, es el palacio real más grande de Europa Occidental. Tras el incendio del Alcázar en 1734, se ordenó su reconstrucción total en piedra y ladrillo, prohibiendo el uso de madera en la estructura principal para hacerlo ignífugo. Se asienta sobre un sistema de bóvedas colosales que salvan el desnivel hacia el río Manzanares, actuando como un contrafuerte habitado de proporciones ciclópeas. La fachada utiliza el 'orden gigante' de pilastras que recorren dos plantas, ocultando la densidad masiva de muros internos que llegan a superar los 3 metros de espesor. Es la máxima expresión de la estática imperial borbónica.", 
        latitude: 40.4173, longitude: -3.7143, 
        type: "architecture", visited: false, 
        photoSpot: { angle: "Gran angular desde los Jardines de Sabatini", milesReward: 160, secretLocation: "Jardines de Sabatini" } 
      }
    ]
  },
  {
    id: "bcn_essential_1day",
    city: "Barcelona",
    title: "Barcelona: Essential 1-Day Masterclass",
    description: "Del Gótico medieval a la locura orgánica de Gaudí. Un análisis técnico de cómo Barcelona se expandió rompiendo sus murallas y desafiando las leyes de la geometría.",
    duration: "5h", distance: "5.8 km", difficulty: "Moderate", theme: "Bidaer Essential", isEssential: true,
    stops: [
      { 
        id: "bcn_1", 
        name: "Sagrada Familia: Laboratorio Dinámico", 
        description: "Analista, olvida la religión; observa la física. Gaudí diseñó este templo como un organismo vivo. Las columnas no son pilares estáticos, sino estructuras ramificadas que siguen la geometría de los árboles para distribuir las cargas de forma natural. Utiliza superficies regladas como paraboloides e hiperboloides para maximizar la resistencia con el mínimo material. La construcción actual emplea hormigón postensado y escaneado 3D para completar la visión de un hombre que determinaba la forma mediante maquetas funiculares invertidas. Es, sin duda, la estructura más compleja y monitorizada del planeta.", 
        latitude: 41.4036, longitude: 2.1744, 
        type: "architecture", visited: false, 
        photoSpot: { angle: "Contrapicado desde el estanque del Parque Gaudí", milesReward: 180, secretLocation: "Estanque" } 
      },
      { 
        id: "bcn_2", 
        name: "Casa Batlló: Fachada Ósea", 
        description: "Análisis de una rehabilitación radical. Gaudí transformó un edificio convencional en una estructura orgánica. La fachada de piedra arenisca de Montjuïc fue tallada para evocar formas óseas, eliminando cualquier ángulo recto que pudiera generar tensiones visuales. El sistema de ventilación del patio de luces es un ejemplo temprano de climatización pasiva, utilizando el efecto chimenea para renovar el aire. El tejado, recubierto de cerámica vidriada (trencadís), actúa como una piel reflectante que protege la estructura de la radiación solar mediterránea. Es ingeniería disfrazada de leyenda.", 
        latitude: 41.3916, longitude: 2.1647, 
        type: "architecture", visited: false, 
        photoSpot: { angle: "Detalle de los balcones de hierro fundido", milesReward: 130, secretLocation: "Passeig de Gràcia" } 
      },
      { 
        id: "bcn_3", 
        name: "La Pedrera: Estructura de Viga y Pilar", 
        description: "Aquí Gaudí rompió con la tradición: La Pedrera no tiene muros de carga interiores. Se apoya en una estructura de pilares de hierro, ladrillo y piedra que permite que la fachada sea autoportante (curtain wall primitivo). Esto permitió que cada planta tuviera una distribución libre. El desván está formado por 270 arcos catenarios de ladrillo que soportan el peso de la azotea y sus famosas chimeneas-guerrero. Es un ejercicio de vanguardia estructural que se adelantó 50 años a su tiempo, permitiendo espacios diáfanos imposibles para la mampostería clásica.", 
        latitude: 41.3954, longitude: 2.1619, 
        type: "architecture", visited: false, 
        photoSpot: { angle: "Desde la azotea buscando la silueta de la Sagrada Familia", milesReward: 150, secretLocation: "Azotea" } 
      },
      { 
        id: "bcn_4", 
        name: "Barrio Gótico: Estratigrafía Urbana", 
        description: "Analiza la superposición de capas. Aquí la Barcelona romana del siglo I (Barcino) sirve de cimiento a la ciudad medieval. La Catedral de Barcelona es un palimpsesto: su núcleo es gótico del siglo XIV, pero su fachada es una reconstrucción neogótica de finales del XIX diseñada para atraer al turismo de la Exposición Universal. Observa las grietas y desplomes en las calles estrechas: son el resultado de siglos de presión estructural sobre un subsuelo saturado de restos arqueológicos. Los arcos que cruzan las calles no son decorativos, son puntales de emergencia medievales para evitar el colapso de fachadas.", 
        latitude: 41.3840, longitude: 2.1762, 
        type: "historical", visited: false, 
        photoSpot: { angle: "Bajo el Puente del Obispo buscando la fuga gótica", milesReward: 110, secretLocation: "Carrer del Bisbe" } 
      },
      { 
        id: "bcn_5", 
        name: "Las Ramblas: El Flujo Ininterrumpido", 
        description: "Antiguo cauce de una riera (arroyo) que marcaba el límite de la muralla medieval. Las Ramblas son hoy un corredor logístico de personas. Su diseño responde a la necesidad de ventilación de la ciudad intramuros. La Boquería, a mitad de camino, es una joya de la arquitectura del hierro industrial del XIX. Analiza cómo el espacio se dilata y contrae, guiando el flujo de masas hacia el puerto. Es el sistema circulatorio de Barcelona, el nodo donde la densidad social alcanza su pico máximo de fricción.", 
        latitude: 41.3817, longitude: 2.1716, 
        type: "culture", visited: false, 
        photoSpot: { angle: "Desde el mosaico de Miró mirando hacia Canaletas", milesReward: 90, secretLocation: "Mosaico Miró" } 
      }
    ]
  },
  {
    id: "svq_essential_1day",
    city: "Sevilla",
    title: "Sevilla: Essential 1-Day Masterclass",
    description: "El corazón del Imperio de Indias. Análisis técnico de la Giralda, el gótico masivo de la Catedral y la logística fluvial del Guadalquivir. Una clase magistral de resistencia almohade y esplendor barroco.",
    duration: "4h", distance: "4.2 km", difficulty: "Moderate", theme: "Bidaer Essential", isEssential: true,
    stops: [
      { 
        id: "svq_1", 
        name: "La Giralda: Análisis de Torsión", 
        description: "Analista, observa la torre que sobrevivió a los terremotos que derribaron ciudades. La Giralda utiliza un sistema de dos prismas concéntricos de ladrillo unidos por rampas. Esta configuración le otorga una rigidez torsional asombrosa para su altura. Las rampas no solo permitían subir a caballo, sino que actúan como nervios de refuerzo que disipan las ondas sísmicas. Su cimentación es una balsa isostática de sillería sobre el lecho aluvial del río. El Giraldillo, en la cima, es un veleta de bronce de 1.2 toneladas que actúa como un estabilizador pasivo ante los empujes del viento predominante del suroeste.", 
        latitude: 37.3861, longitude: -5.9925, 
        type: "architecture", visited: false, 
        photoSpot: { angle: "Contrapicado desde la Plaza de la Virgen de los Reyes", milesReward: 140, secretLocation: "Plaza Virgen Reyes" } 
      },
      { 
        id: "svq_2", 
        name: "Catedral: El Gótico de Volumen Máximo", 
        description: "Es la catedral gótica con mayor volumen de aire confinado del mundo. Su construcción sobre la planta de la mezquita mayor obligó a los ingenieros a adaptar los empujes de las bóvedas a una planta rectangular, no de cruz latina. Los pilares fasciculados soportan cargas masivas a 42 metros de altura mediante un complejo sistema de arbotantes ocultos tras las balaustradas exteriores. El 'mal de la piedra' (erosión química) es un problema constante aquí debido a la porosidad de la piedra caliza traída de la Sierra de San Cristóbal, que reacciona con la humedad del cercano Guadalquivir.", 
        latitude: 37.3858, longitude: -5.9931, 
        type: "historical", visited: false, 
        photoSpot: { angle: "Desde el Patio de los Naranjos buscando el arco de herradura", milesReward: 130, secretLocation: "Patio de los Naranjos" } 
      },
      { 
        id: "svq_3", 
        name: "Real Alcázar: Mudéjar Forense", 
        description: "Análisis de la arquitectura de la fragilidad aparente. El Alcázar utiliza yeserías (ataurique) que ocultan muros de carga masivos. Los patios actúan como reguladores térmicos naturales: el agua y la sombra generan microclimas que bajan la temperatura hasta 10 grados respecto al exterior. El Palacio de Pedro I es una obra maestra de la propaganda política a través de la arquitectura, utilizando artesanos mudéjares para imitar el lujo califal. Analiza el sistema de recogida de aguas pluviales: una red de aljibes subterráneos que garantizaba la autonomía del recinto ante asedios.", 
        latitude: 37.3831, longitude: -5.9902, 
        type: "architecture", visited: false, 
        photoSpot: { angle: "Simetría axial en el Patio de las Doncellas", milesReward: 150, secretLocation: "Patio Doncellas" } 
      },
      { 
        id: "svq_4", 
        name: "Torre del Oro: Control Logístico Fluvial", 
        description: "Esta torre dodecagonal era el nodo de control del Puerto de Indias. Originalmente estaba conectada a una torre gemela en la otra orilla por una cadena masiva que impedía el paso de barcos no autorizados. Su cimentación sobre pilotes de madera de roble hincados en el fango es similar a la técnica veneciana. El revestimiento de azulejos dorados (de ahí su nombre) servía como un faro visual reflectante para los galeones que regresaban de América cargados de plata. Es un búnker militar diseñado para la resistencia estática extrema ante el empuje de las crecidas del río.", 
        latitude: 37.3824, longitude: -5.9964, 
        type: "historical", visited: false, 
        photoSpot: { angle: "Desde el Puente de San Telmo con el reflejo en el agua", milesReward: 100, secretLocation: "Puente San Telmo" } 
      },
      { 
        id: "svq_5", 
        name: "Plaza de España: Escenografía Regionalista", 
        description: "Construida para la Exposición de 1929, es una estructura semicircular de 200 metros de diámetro que abraza el parque de María Luisa. Utiliza ladrillo de alta densidad y una cantidad masiva de cerámica de Triana, que actúa como aislante térmico y decorativo. El canal central es un circuito cerrado con un sistema de bombeo oculto bajo los puentes. Las dos torres laterales de 74 metros equilibran visualmente la horizontalidad del edificio. Analiza el uso del ladrillo visto: es una vuelta a la tradición constructiva sevillana elevada a escala monumental, uniendo ingeniería civil con artes aplicadas de primer nivel.", 
        latitude: 37.3772, longitude: -5.9869, 
        type: "architecture", visited: false, 
        photoSpot: { angle: "Panorámica desde el centro de la plaza", milesReward: 120, secretLocation: "Puente Central" } 
      }
    ]
  }
];
