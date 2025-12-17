
import { Tour } from '../types';

export const STATIC_TOURS: Tour[] = [
  {
    id: 'mad-1',
    city: 'Madrid',
    title: 'Madrid: Fantasmas, Amantes y Cañas',
    description: '¿Cansado de fechas? Te cuento quién se acostaba con quién, por qué el Palacio Real se quemó "por accidente" y dónde están los fantasmas más pesados de la Villa.',
    duration: '2.5h',
    distance: '3.8 km',
    difficulty: 'Easy',
    theme: 'History',
    isSponsored: false,
    isRichDescription: true,
    stops: [
      { 
        id: 'm1', 
        name: 'Palacio Real', 
        description: '[HOOK] El palacio que nació de las cenizas de un odio real.\n[STORY] En 1734 el antiguo Alcázar ardió. ¿Accidente? Felipe V odiaba ese edificio oscuro. Dicen que cuando le avisaron del fuego, pidió un café y dijo: "que arda". Construyó este Versalles blanco sobre las cenizas.\n[GOSSIP] El fantasma de Felipe V todavía odia el ruido de los turistas.', 
        latitude: 40.4180, longitude: -3.7100, type: 'historical', visited: false, isRichInfo: true,
        curiosity: "Es el palacio más grande de Europa Occidental, pero la familia real no vive aquí. ¡Les da miedo!",
        gossip: "Se dice que hay un túnel secreto que conecta el palacio con la cercana estación de tren para huidas de emergencia de los reyes."
      },
      { 
        id: 'm2', 
        name: 'Plaza Mayor', 
        description: '[HOOK] De patíbulos a calamares.\n[STORY] Antes de los selfies, aquí se quemaban "herejes". La Inquisición hacía sus shows aquí. Los balcones de los vecinos se alquilaban como palcos de ópera para ver ejecuciones.\n[SECRET] El Arco de Cuchilleros tiene esa forma para aguantar el peso de la plaza que está a una altura distinta del mercado.', 
        latitude: 40.4155, longitude: -3.7074, type: 'historical', visited: false, isRichInfo: true,
        curiosity: "La estatua de Felipe III estuvo llena de huesos de pájaros durante décadas. ¡Se metían por la boca del caballo y no podían salir!",
        gossip: "Si buscas bien, todavía hay marcas de los antiguos gremios en las piedras del suelo."
      },
      { 
        id: 'm3', 
        name: 'Restaurante Botín', 
        description: '[HOOK] Donde Goya fregaba platos.\n[STORY] El restaurante más antiguo del mundo según el Guinness. Hemingway venía aquí a ponerse hasta arriba de cochinillo.\n[SECRET] El horno no se ha apagado NI UN DÍA desde 1725. Ni en guerras ni en pandemias.', 
        latitude: 40.4135, longitude: -3.7075, type: 'historical', visited: false, isRichInfo: true,
        curiosity: "Goya trabajó aquí de friegaplatos antes de ser el pintor de los reyes.",
        gossip: "Hemingway intentó cocinar su propio cochinillo una vez y casi quema el local."
      }
    ]
  },
  {
    id: 'mia-1',
    city: 'Miami',
    title: 'Miami: Cocaína, Neón y Tragedia Versace',
    description: 'Más allá de la fiesta, te llevo por el Miami de los "Cocaine Cowboys" y el glamour fatal de Ocean Drive.',
    duration: '2.5h',
    distance: '4.2 km',
    difficulty: 'Easy',
    theme: 'History',
    isSponsored: false,
    isRichDescription: true,
    stops: [
      { 
        id: 'mia1', 
        name: 'Casa Casuarina (Mansion Versace)', 
        description: '[HOOK] El escalón donde murió un imperio.\n[STORY] Gianni fue disparado aquí mismo. Su asesino era un fan obsesionado. La mansión es un templo al exceso con piscinas forradas de oro de 24k.\n[SECRET] Hay símbolos masónicos escondidos en los mosaicos del suelo.', 
        latitude: 25.7830, longitude: -80.1300, type: 'historical', visited: false, isRichInfo: true,
        curiosity: "El baño principal tiene un inodoro de oro sólido (dicen).",
        gossip: "Muchos famosos intentaron comprarla después de la muerte de Gianni, pero decían que se oían ruidos extraños de noche."
      },
      { 
        id: 'mia2', 
        name: 'The Colony Hotel', 
        description: '[HOOK] El neón que salvó a Miami.\n[STORY] En los 70, South Beach era un asilo de ancianos. El Art Deco iba a ser demolido. Pero un par de visionarios encendieron estos neones y Hollywood se enamoró.\n[SECRET] Aquí se rodó parte de Scarface.', 
        latitude: 25.7790, longitude: -80.1310, type: 'photo', visited: false, isRichInfo: true,
        curiosity: "Es el hotel más fotografiado del mundo por su cartel azul.",
        gossip: "Al Pacino se quejaba del calor insoportable durante el rodaje y amenazó con irse de Miami."
      }
    ]
  }
];
