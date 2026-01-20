
import { Tour } from '../types';

export const STATIC_TOURS: Tour[] = [
  {
    id: "mad_essential_10",
    city: "Madrid",
    title: "Madrid: El Corazón del Imperio y sus Secretos",
    description: "Mucho más que una capital. Un viaje por el Madrid de los Austrias, sus leyendas de fantasmas, sus tabernas centenarias y el espíritu indomable de los madrileños.",
    duration: "5h", distance: "6.5 km", difficulty: "Easy", theme: "Essential", isEssential: true,
    stops: [
      { 
        id: "m1", 
        name: "Puerta del Sol", 
        description: "Estás pisando el centro geográfico y emocional de España. Esta plaza no es solo un lugar de paso; es el escenario de la historia. Mira hacia arriba al cartel de Tío Pepe: estuvo a punto de desaparecer, pero los madrileños se manifestaron para salvarlo como si fuera un monumento nacional.\n\nFrente a la Real Casa de Correos verás el Kilómetro Cero. Cuenta la leyenda que si pisas la placa, tu destino quedará ligado a Madrid y siempre volverás. ¿Ves el Oso y el Madroño? Los historiadores salseantes dicen que en realidad es una osa, símbolo de fertilidad de los bosques que rodeaban la villa. \n\nEn esta plaza nació el primer Metro de España y aquí cada Nochevieja miles de personas se juegan la atragantación con las uvas. Es el caos más ordenado y alegre que verás en tu vida.", 
        latitude: 40.4168, longitude: -3.7038, 
        type: "culture", visited: false, 
        photoSpot: { angle: "Un selfie con la Osa y el cartel de Tío Pepe encuadrado arriba", milesReward: 100, secretLocation: "Placa Km 0" } 
      },
      { 
        id: "m2", 
        name: "Plaza Mayor", 
        description: "Entrar por el Arco de Cuchilleros es entrar en el siglo XVII. Esta plaza ha sido mercado, escenario de corridas de toros, sitio de ejecuciones públicas y hasta pista de patinaje.\n\nFíjate en la Casa de la Panadería: sus frescos cuentan historias de dioses romanos pero los personajes tienen caras que parecen tus vecinos. En el centro, Felipe III vigila todo sobre su caballo. Hay un secreto turbio: durante años, las palomas se metían por la boca del caballo de la estatua y morían dentro. Cuando restauraron la estatua tras una explosión en la República, salieron miles de huesecitos de pájaro.\n\nHoy, el salseo es más gastronómico. El bocata de calamares es obligatorio, pero ojo, los madrileños sabemos que el mejor es el que tiene la cola más larga de gente local, no de turistas.", 
        latitude: 40.4154, longitude: -3.7074, 
        type: "historical", visited: false, 
        photoSpot: { angle: "Bajo los arcos de la salida hacia Cuchilleros al atardecer", milesReward: 120, secretLocation: "Bajo la estatua de Felipe III" } 
      },
      { 
        id: "m3", 
        name: "Mercado de San Miguel", 
        description: "Esta estructura de hierro y cristal de 1916 es el último mercado de su tipo que queda en pie. Originalmente era un mercado de pescado ruidoso y con olores fuertes; hoy es el templo del lujo gastronómico.\n\nEs el lugar perfecto para ver cómo Madrid mezcla lo viejo con lo nuevo. Te recomiendo que busques el puesto de vermut. El vermut 'de grifo' es la bebida oficial de los domingos al sol en Madrid. \n\nCuriosidad: Los techos de hierro fueron diseñados para aguantar el peso de la nieve, algo que en Madrid no suele pasar mucho, pero cuando pasa (como con Filomena), este mercado aguanta como un titán. ¡Un sitio para ver y ser visto!", 
        latitude: 40.4153, longitude: -3.7089, 
        type: "food", visited: false, 
        photoSpot: { angle: "Reflejo del palacio en las cristaleras laterales", milesReward: 80, secretLocation: "Barra central" } 
      },
      { 
        id: "m4", 
        name: "Palacio Real y Catedral de la Almudena", 
        description: "El Palacio Real de Madrid es una animalada: tiene 3.418 habitaciones, el doble que Versalles. Se construyó sobre las cenizas del antiguo Alcázar que se quemó un día de Navidad. Se dice que el rey Felipe V, que era un poco excéntrico, no quería madera en el nuevo palacio para que no volviera a arder, por eso casi todo es piedra y mármol.\n\nJusto enfrente tienes la Almudena. Es una catedral extraña porque tardaron 100 años en terminarla. Por fuera parece neoclásica para no desentonar con el Palacio, pero por dentro es neogótica y tiene techos pintados con un estilo 'pop-art' que te deja loco. \n\nNo te vayas sin mirar el horizonte desde la valla; verás la Casa de Campo, que es cinco veces más grande que Central Park. El pulmón verde de la ciudad.", 
        latitude: 40.4173, longitude: -3.7143, 
        type: "historical", visited: false, 
        photoSpot: { angle: "Desde los Jardines de Sabatini para pillar la simetría perfecta", milesReward: 150, secretLocation: "Valla del mirador" } 
      },
      { 
        id: "m5", 
        name: "Templo de Debod", 
        description: "Si te digo que hay un templo egipcio real en Madrid, no te miento. Fue un regalo de Egipto en 1968 porque España ayudó a salvar los templos de Nubia (como Abu Simbel) de quedar bajo el agua cuando hicieron la gran presa de Asuán.\n\nLo trajeron piedra a piedra, como un puzzle gigante. Es el mejor sitio de Madrid para ver el atardecer. Los madrileños venimos aquí a desconectar, a hacer yoga o simplemente a ver cómo el sol se pone tras la Sierra. \n\nCuriosidad salseante: el templo no está orientado como en Egipto, pero los atardeceres aquí son igual de mágicos. Es un trozo de historia milenaria en un parque de barrio.", 
        latitude: 40.4240, longitude: -3.7177, 
        type: "historical", visited: false, 
        photoSpot: { angle: "Alineado con los tres arcos y el estanque", milesReward: 130, secretLocation: "Mirador de la montaña" } 
      }
    ]
  },
  {
    id: "par_essential_10",
    city: "París",
    title: "París: La Ciudad de la Luz y sus Leyendas",
    description: "Mucho más que romance. Un viaje por la revolución, el arte bohemio de Montmartre y los secretos del Sena.",
    duration: "6h", distance: "8 km", difficulty: "Moderate", theme: "Essential", isEssential: true,
    stops: [
      { 
        id: "p1", 
        name: "Torre Eiffel", 
        description: "Nadie la quería. Cuando se construyó en 1889, los intelectuales de la época firmaron un manifiesto llamándola 'el espárrago de metal' y 'deshonra de París'. Gustave Eiffel solo tenía permiso para 20 años, pero la salvó convirtiéndola en una antena de radio gigante para el ejército.\n\nUn detalle fascinante: la torre crece y encoge 15 centímetros dependiendo del calor que haga por la dilatación del hierro. Y no intentes pintarla tú: cada 7 años 25 pintores gastan 60 toneladas de pintura para que no se oxide.\n\nEs el símbolo de Francia y el monumento de pago más visitado del mundo. Mírala con respeto, estuvo a punto de ser chatarra.", 
        latitude: 48.8584, longitude: 2.2945, 
        type: "historical", visited: false, 
        photoSpot: { angle: "Desde Trocadero al amanecer para evitar hordas", milesReward: 200, secretLocation: "Jardines de la torre" } 
      },
      { 
        id: "p2", 
        name: "Museo del Louvre", 
        description: "Antes de ser museo fue fortaleza y palacio real. Si bajas al sótano verás los muros de 1190. La pirámide de cristal fue otro escándalo: los parisinos decían que parecía un gadget futurista que arruinaba la historia. Hoy nadie imagina el museo sin ella.\n\nSe dice que si vieras cada obra del Louvre por 30 segundos, tardarías 100 días en terminar. Todo el mundo corre a ver la Mona Lisa, pero mi consejo es que busques las antigüedades egipcias, son impresionantes.\n\nSalseo: La leyenda de que la pirámide tiene 666 cristales es falsa, tiene 673. ¡Pero la historia vendía mucho!", 
        latitude: 48.8606, longitude: 2.3376, 
        type: "art", visited: false, 
        photoSpot: { angle: "Sentado en uno de los bloques de granito con la pirámide detrás", milesReward: 150, secretLocation: "Patio Napoleón" } 
      }
    ]
  }
];
