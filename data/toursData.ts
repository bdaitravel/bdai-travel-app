
import { Tour } from '../types';

export const STATIC_TOURS: Tour[] = [
  {
    id: "vitoria_medieval_elite",
    city: "Vitoria",
    title: "Vitoria: Sangre, Naipes y la Almendra Sagrada",
    description: "Un recorrido lineal perfecto por el corazón gótico. De la Virgen Blanca a la Muralla, descubriendo palacios que esconden el origen de la baraja española y túneles medievales.",
    duration: "3.5h",
    distance: "2.9 km",
    difficulty: "Moderate",
    theme: "Historia y Secretos",
    isEssential: true,
    stops: [
      {
        id: "vit_s1",
        name: "Plaza de la Virgen Blanca: El Espejo de la Ciudad",
        description: "Empezamos en el kilómetro cero. Fíjate en el monumento central: no es solo piedra, es el relato de la Batalla de Vitoria de 1813. ¿Sabías que los vitorianos robaron el equipaje de José Bonaparte, incluyendo su orinal de plata, mientras huía? Ese botín aún circula por algunas casas nobles de la ciudad. Mira hacia arriba, a los miradores blancos: son el 'aislamiento inteligente' del siglo XVIII, diseñados para atrapar el sol del norte y calentar las casas. Aquí cada 4 de agosto, Celedón baja por un cable; es un homenaje a un aldeano real que jamás faltaba a la fiesta.",
        latitude: 42.8465,
        longitude: -2.6734,
        type: "historical",
        visited: false,
        photoSpot: {
          angle: "Desde la base del monumento, encuadrando la torre de San Miguel.",
          bestTime: "11:30 AM.",
          instagramHook: "Donde la historia napoleónica se encuentra con el diseño bioclimático. 🏛️ #VitoriaGasteiz",
          milesReward: 100,
          secretLocation: "Letras de musgo 'Green Capital'."
        }
      },
      {
        id: "vit_s2",
        name: "Plaza de España: El Neoclasicismo de Olaguíbel",
        description: "A solo 50 metros, entramos en un cuadrado perfecto. Olaguíbel tenía un reto: unir la ciudad alta con la baja. Si caminas por los soportales, busca las marcas en las columnas; son los números originales del 'puzzle' que fue construir este edificio. El chisme: debajo de esta plaza pasa el río Zapardiel, que fue el alcantarillado natural de la ciudad durante siglos. Hoy el Ayuntamiento preside este espacio, pero antes aquí se celebraban corridas de toros que los nobles veían desde sus balcones.",
        latitude: 42.8460,
        longitude: -2.6726,
        type: "historical",
        visited: false,
        photoSpot: {
          angle: "Bajo el arco central, buscando la simetría de las farolas.",
          bestTime: "Mañana temprano.",
          instagramHook: "Simetría que calma el alma. 🏛️ #Architecture",
          milesReward: 80,
          secretLocation: "Punto central bajo el reloj."
        }
      },
      {
        id: "vit_s3",
        name: "Los Arquillos: La Calle de Dos Pisos",
        description: "Subimos hacia la colina por la joya de la corona. Olaguíbel creó esta calle suspendida para salvar los 10 metros de desnivel. Es una genialidad: por arriba es una calle, por abajo son soportales. Estos arcos actúan como un túnel de viento natural; los vitorianos lo llamamos 'el cierzo'. Era el lugar donde la burguesía paseaba para ver y ser vista sin mojarse cuando llovía. Fíjate en las vigas de madera: son originales del siglo XVIII.",
        latitude: 42.8471,
        longitude: -2.6724,
        type: "art",
        visited: false,
        photoSpot: {
          angle: "Desde la mitad de la escalinata de San Miguel.",
          bestTime: "Atardecer (luz de oro).",
          instagramHook: "Caminar por el aire en una ciudad con dos alturas. 🌉 #Engineering",
          milesReward: 120,
          secretLocation: "Rellano superior de la escalera."
        }
      },
      {
        id: "vit_s4",
        name: "Plaza del Machete: Juramentos de Vida o Muerte",
        description: "Llegamos a la frontera del Casco Viejo. En el muro de la iglesia de San Vicente hay una hornacina con un machete real. No es una réplica: es el arma sobre la que el Procurador General juraba defender los fueros. La frase era: 'Que se me corte la cabeza con este machete si no cumplo mi palabra'. Aquí la política se tomaba muy en serio. Fíjate en la anchura de las calles que bajan, diseñadas para que pasaran los carros de bueyes medievales.",
        latitude: 42.8476,
        longitude: -2.6717,
        type: "historical",
        visited: false,
        photoSpot: {
          angle: "Macro del machete dentro de su urna.",
          bestTime: "Cualquier hora.",
          instagramHook: "Justicia a golpe de acero. ⚔️ #MedievalVibe",
          milesReward: 150,
          secretLocation: "Nicho en la pared de la Iglesia."
        }
      },
      {
        id: "vit_s5",
        name: "Palacio de Villa Suso",
        description: "Justo encima del Machete. Este palacio renacentista es fascinante porque integra la muralla antigua en su salón principal. Fue construido por un embajador de Carlos V que quería demostrar su poder. El patio es un remanso de paz. El chisme: se dice que en sus sótanos aún quedan restos de una necrópolis de cuando Gasteiz era apenas una aldea de pastores.",
        latitude: 42.8479,
        longitude: -2.6715,
        type: "historical",
        visited: false,
        photoSpot: {
          angle: "Fachada desde la plaza superior.",
          bestTime: "Mañana.",
          instagramHook: "Piedra que respira renacimiento. 🏰 #Renaissance",
          milesReward: 100,
          secretLocation: "Puerta lateral del palacio."
        }
      },
      {
        id: "vit_s6",
        name: "Casa del Cordón: El Secreto del Converso",
        description: "En plena calle Cuchillería. Se llama así por el cordón franciscano de su puerta. Fue construida por un judío converso que puso el cordón para evitar que la Inquisición sospechara de él. Dentro se esconde una torre medieval de 15 metros que quedó 'atrapada' por el palacio. Aquí durmió el Papa Adriano VI cuando supo que era el nuevo Pontífice. Imagina a un Papa rodeado de carniceros vitorianos.",
        latitude: 42.8488,
        longitude: -2.6712,
        type: "historical",
        visited: false,
        photoSpot: {
          angle: "Detalle del cordón de piedra sobre el arco.",
          bestTime: "Mediodía.",
          instagramHook: "Secretos de la Inquisición en piedra. 🧵 #HiddenHistory",
          milesReward: 140,
          secretLocation: "Entrada de Cuchillería 24."
        }
      },
      {
        id: "vit_s7",
        name: "Museo Fournier de Naipes (Palacio Bendaña)",
        description: "Vitoria es la capital mundial de las cartas. Heraclio Fournier revolucionó el juego aquí. El palacio es una joya con un patio renacentista increíble. Verás barajas imperiales chinas y la baraja española actual, que se diseñó basándose en caras reales de ciudadanos de Vitoria de la época. La torre lateral era un símbolo de estatus: cuanto más alta la torre, más rico el dueño.",
        latitude: 42.8495,
        longitude: -2.6715,
        type: "culture",
        visited: false,
        photoSpot: {
          angle: "Desde el patio mirando hacia la galería superior.",
          bestTime: "12:00 PM.",
          instagramHook: "Donde nacieron todos tus juegos de cartas. 🃏 #Fournier",
          milesReward: 160,
          secretLocation: "Pozo del patio central."
        }
      },
      {
        id: "vit_s8",
        name: "Catedral de Santa María: Abierto por Obras",
        description: "Esta catedral inspiró a Ken Follett. Está 'enferma': sus cimientos cedieron y la estructura se dobló, creando un efecto de 'paredes líquidas'. No vengas a verla terminada, ven a ver cómo se salva. La restauración reveló que originalmente estaba pintada de rojos y azules chillones, no era gris. Entrar con casco es una experiencia que te cambia la perspectiva sobre cómo se construía hace 800 años.",
        latitude: 42.8505,
        longitude: -2.6722,
        type: "art",
        visited: false,
        photoSpot: {
          angle: "Desde la Plaza de la Burullería, buscando el pórtico.",
          bestTime: "Puesta de sol.",
          instagramHook: "La catedral que inspiró los pilares de la tierra. ⛪ #SantaMaria",
          milesReward: 200,
          secretLocation: "Escultura de Ken Follett."
        }
      },
      {
        id: "vit_s9",
        name: "Plaza de la Burullería y El Portalón",
        description: "Donde se vendían las telas ('burullos'). El edificio de madera es El Portalón, un mesón del siglo XV que sigue vivo. Sus puertas son enormes porque los caballos entraban directos al patio. Al lado está la Torre de los Anda, la más antigua. Si te fijas en la base de la torre, verás piedras romanas reutilizadas; en Vitoria siempre hemos reciclado la historia.",
        latitude: 42.8508,
        longitude: -2.6719,
        type: "historical",
        visited: false,
        photoSpot: {
          angle: "Diagonal que incluya el Portalón y la Torre de los Anda.",
          bestTime: "Tarde.",
          instagramHook: "Regreso al siglo XV. 🕰 #MedievalArchitecture",
          milesReward: 110,
          secretLocation: "Bajo el arco de la torre."
        }
      },
      {
        id: "vit_s10",
        name: "Muralla Medieval y la Nevera",
        description: "Terminamos en la cresta de la colina. Esta muralla del siglo XI se descubrió casi por accidente. Lo más curioso es la 'Nevera': un pozo profundo donde guardaban nieve con paja para tener hielo en verano. Era el aire acondicionado de los nobles medievales. Desde aquí tienes la mejor vista del valle de Álava, el mismo que vigilaban los arqueros hace mil años.",
        latitude: 42.8500,
        longitude: -2.6710,
        type: "historical",
        visited: false,
        photoSpot: {
          angle: "Desde el adarve superior mirando al valle.",
          bestTime: "Atardecer.",
          instagramHook: "Guardián de la frontera norte. 🏰 #OldWalls",
          milesReward: 180,
          secretLocation: "Entrada a la Nevera."
        }
      }
    ]
  },
  {
    id: "vitoria_romantic_green",
    city: "Vitoria",
    title: "Vitoria: Palacios, Poder y la Senda Verde",
    description: "Un recorrido lineal por el Ensanche romántico y el Anillo Verde. De la majestuosidad de la Florida al modernismo de la Calle Dato.",
    duration: "3h",
    distance: "3.4 km",
    difficulty: "Easy",
    theme: "Burguesía y Naturaleza",
    isEssential: false,
    stops: [
      {
        id: "vit_g1",
        name: "Parque de la Florida",
        description: "El jardín botánico de la ciudad desde 1820. Pasea entre secuoyas gigantes. El secreto: las estatuas de los reyes godos fueron un regalo de Madrid porque 'sobraban' en el Palacio Real. Aquí se monta el Belén a escala real más grande del mundo en Navidad. Es el lugar donde los vitorianos se han enamorado durante dos siglos.",
        latitude: 42.8445,
        longitude: -2.6750,
        type: "nature",
        visited: false,
        photoSpot: {
          angle: "Bajo el sauce llorón principal.",
          bestTime: "Mañana.",
          instagramHook: "Un rincón de París en el corazón de Álava. 🌿 #FloridaPark",
          milesReward: 100,
          secretLocation: "Puente de piedra del riachuelo."
        }
      },
      {
        id: "vit_g2",
        name: "Catedral Nueva (Inmaculada)",
        description: "Un gigante neogótico que estuvo 50 años parado por falta de dinero. Es tan grande que podrías meter la catedral de Santander dentro. Fíjate en las gárgolas: algunas son muy raras porque los escultores modernos hicieron lo que quisieron. Su cripta es de lo mejor de España. Fue construida sobre un antiguo hospital de sangre.",
        latitude: 42.8438,
        longitude: -2.6765,
        type: "art",
        visited: false,
        photoSpot: {
          angle: "Desde la plaza lateral para captar la altura.",
          bestTime: "Mediodía.",
          instagramHook: "Arquitectura que desafía al cielo. ⛪ #NeoGothic",
          milesReward: 150,
          secretLocation: "Escalinata de la girola."
        }
      },
      {
        id: "vit_g3",
        name: "Paseo de la Senda: La Milla de Oro",
        description: "El paseo más elegante del norte. Un túnel de castaños flanqueado por palacetes de la burguesía industrial. Aquí el aire es distinto: el Anillo Verde entra directo al centro. Es el lugar del 'postureo' vitoriano histórico: pasear los domingos para que todos supieran que tu cuenta en el banco estaba llena.",
        latitude: 42.8425,
        longitude: -2.6780,
        type: "culture",
        visited: false,
        photoSpot: {
          angle: "Perspectiva infinita bajo los árboles.",
          bestTime: "Otoño.",
          instagramHook: "Elegancia que no pasa de moda. 🌳 #LaSenda",
          milesReward: 120,
          secretLocation: "Entrada del Palacio Zulueta."
        }
      },
      {
        id: "vit_g4",
        name: "Palacio Zulueta",
        description: "Un palacete de un rico comerciante de azúcar en Cuba. Representa el éxito de los vitorianos que 'hicieron las Américas'. Su jardín romántico es perfecto para leer. La cúpula de cristal era revolucionaria para su época. Hoy guarda el archivo más importante de la cultura vasca (Sancho el Sabio).",
        latitude: 42.8415,
        longitude: -2.6795,
        type: "art",
        visited: false,
        photoSpot: {
          angle: "Hacia la fachada desde el jardín.",
          bestTime: "Tarde.",
          instagramHook: "Vivir como un marqués del siglo XIX. 💍 #PalaceLife",
          milesReward: 130,
          secretLocation: "Banco junto a la fuente."
        }
      },
      {
        id: "vit_g5",
        name: "Palacio de Ajuria Enea",
        description: "La residencia del Lehendakari (Presidente Vasco). Un palacio neovasco de 1920 que antes fue de una familia de magnates del acero. El chisme: tuvieron que venderlo porque perdieron su fortuna y acabó siendo hasta un museo antes de ser la sede del gobierno. La fachada es una lección de arquitectura regionalista.",
        latitude: 42.8405,
        longitude: -2.6805,
        type: "historical",
        visited: false,
        photoSpot: {
          angle: "Fachada lateral desde la valla.",
          bestTime: "Tarde.",
          instagramHook: "La casa del Lehendakari. 🛡️ #AjuriaEnea",
          milesReward: 180,
          secretLocation: "Portón de seguridad."
        }
      },
      {
        id: "vit_g6",
        name: "Museo de Armería",
        description: "Justo enfrente de Ajuria Enea. Guarda el secreto militar de la ciudad: las armas reales de la Batalla de Vitoria y armaduras que parecen de Juego de Tronos. Vitoria ha sido estratégica desde hace 4.000 años, como demuestra un hacha de bronce encontrada cerca. Aquí entiendes por qué los vascos tienen fama de buenos herreros.",
        latitude: 42.8402,
        longitude: -2.6812,
        type: "culture",
        visited: false,
        photoSpot: {
          angle: "Detalle de los cañones de la entrada.",
          bestTime: "Mañana.",
          instagramHook: "Historia escrita en acero. ⚔️ #Armory",
          milesReward: 100,
          secretLocation: "Patio exterior."
        }
      },
      {
        id: "vit_g7",
        name: "Museo de Bellas Artes (Palacio de Augusti)",
        description: "El palacio más recargado y bonito. Lo mandó construir un empresario por amor a su mujer. Es puro estilo neoplateresco. El jardín trasero es un secreto entre locales; el lugar más tranquilo del mundo. Fíjate en las columnas: parece que están hechas de encaje en lugar de piedra.",
        latitude: 42.8395,
        longitude: -2.6820,
        type: "art",
        visited: false,
        photoSpot: {
          angle: "Gran angular desde la acera de enfrente.",
          bestTime: "Tarde suave.",
          instagramHook: "El palacio más romántico de Gasteiz. 🎨 #FineArts",
          milesReward: 130,
          secretLocation: "Bancos del jardín trasero."
        }
      },
      {
        id: "vit_g8",
        name: "Plaza de los Fueros",
        description: "Obra de Eduardo Chillida. Un anfiteatro de granito rosa que rinde homenaje a las leyes vascas. No es solo una plaza, es un laberinto artístico. Hay un frontón escondido dentro de la estructura, uniendo el deporte tradicional con el arte de vanguardia. Un lugar para perderse entre ángulos rectos.",
        latitude: 42.8455,
        longitude: -2.6710,
        type: "art",
        visited: false,
        photoSpot: {
          angle: "Desde el foso central mirando hacia arriba.",
          bestTime: "Día soleado (sombras fuertes).",
          instagramHook: "Perdido en el laberinto de Chillida. 🧱 #Art",
          milesReward: 150,
          secretLocation: "Estatua de la mano de hierro."
        }
      },
      {
        id: "vit_g9",
        name: "Estatua del Caminante",
        description: "El símbolo moderno de la ciudad. Representa al vitoriano que siempre está paseando. Mide 3.5 metros y está hecho de bronce. Es costumbre disfrazarlo en fiestas o ponerle bufanda si hace frío. Es el habitante más alto y silencioso de la Plaza del Arca. Una foto con él es obligatoria para decir que has estado en Gasteiz.",
        latitude: 42.8462,
        longitude: -2.6720,
        type: "culture",
        visited: false,
        photoSpot: {
          angle: "Caminando al lado de la estatua.",
          bestTime: "Día.",
          instagramHook: "Uno más en la ciudad del paseo. 🚶‍♂️ #Caminante",
          milesReward: 90,
          secretLocation: "Plaza del Arca."
        }
      },
      {
        id: "vit_g10",
        name: "Calle Dato y Confituras Goya",
        description: "Terminamos en la calle social por excelencia. Pero el secreto real son los 'Vasquitos y Nesquitas' de Confituras Goya, bombones que definen el paladar de aquí desde 1886. Fue la primera calle peatonal y sigue siendo el corazón de la vida vitoriana. Desde aquí estás a un paso de volver a la Virgen Blanca para cerrar el círculo.",
        latitude: 42.8445,
        longitude: -2.6728,
        type: "culture",
        visited: false,
        photoSpot: {
          angle: "Perspectiva de la calle hacia el sur.",
          bestTime: "Hora del vermut.",
          instagramHook: "El pulso de la ciudad en una calle. ☕ #CalleDato",
          milesReward: 80,
          secretLocation: "Escaparate de Goya."
        }
      }
    ]
  },
  {
    id: "vlc_elite_premium",
    city: "Valencia",
    title: "Valencia: El Código del Siglo de Oro",
    description: "No es un tour, es una infiltración en la ciudad que dominó el mundo. De gárgolas pecaminosas al Santo Grial, revelamos la cara oculta de la 'millor terreta del món'.",
    duration: "4h",
    distance: "4.8 km",
    difficulty: "Moderate",
    theme: "Elite & Secretos",
    isEssential: true,
    stops: [
      {
        id: "vlc_s1",
        name: "Torres de Serranos: Prisión de Sangre Azul",
        description: "Bienvenido a la puerta gótica más masiva de Europa. Durante siglos esto fue 'la cárcel de los nobles'. Si eras un caballero y la liabas, te encerraban aquí con tus lujos. Fíjate en el foso: verás marcas de herramientas que parecen jeroglíficos; son las 'firmas' de los canteros para cobrar el jornal. El chisme: la torre está abierta por detrás para que el Rey pudiera disparar a sus propios soldados si se rebelaban.",
        latitude: 39.4792,
        longitude: -0.3759,
        type: "historical",
        visited: false,
        photoSpot: {
          angle: "Desde el foso, buscando la gárgola del perro.",
          bestTime: "18:00 PM.",
          instagramHook: "Donde los nobles pagaban sus pecados. 🏰 #ValenciaSecrets",
          milesReward: 150,
          secretLocation: "Escalera trasera."
        }
      },
      {
        id: "vlc_s2",
        name: "Palau de la Generalitat: El Salón del Chisme",
        description: "Aquí se cocinaba el poder. El techo del 'Saló de Corts' es tan espectacular que se dice que los carpinteros acabaron con tortícolis. Hay una leyenda sobre un túnel secreto que conecta el Palacio con la Catedral para que los gobernantes fueran a confesarse a escondidas. Fíjate en la torre: es de 1950, pero engaña a todos pareciendo del siglo XV.",
        latitude: 39.4764,
        longitude: -0.3756,
        type: "historical",
        visited: false,
        photoSpot: {
          angle: "Desde la Calle Caballeros.",
          bestTime: "11:00 AM.",
          instagramHook: "Muros que guardan secretos de estado. 🏛️ #EliteVLC",
          milesReward: 95,
          secretLocation: "Portón de madera."
        }
      },
      {
        id: "vlc_s3",
        name: "Plaza de la Virgen: Sangre, Agua y Neptuno",
        description: "Debajo de tus pies están los huesos de los primeros romanos. Pero el show real es el Tribunal de las Aguas: cada jueves a las 12:00, labradores deciden quién riega. Chisme de la fuente: el hombre barbudo no es Neptuno, es el Río Turia. Las 8 chicas desnudas son las acequias que dan de comer a la ciudad.",
        latitude: 39.4760,
        longitude: -0.3751,
        type: "culture",
        visited: false,
        photoSpot: {
          angle: "Sentado en la fuente mirando a la Basílica.",
          bestTime: "Jueves mediodía.",
          instagramHook: "La justicia más antigua de Europa. ⛲ #Tradition",
          milesReward: 160,
          secretLocation: "Punto central de la fuente."
        }
      },
      {
        id: "vlc_s4",
        name: "Catedral: El Grial y las 7 Parejas",
        description: "Aquí está el Santo Grial. El de verdad. Una copa del siglo I. Pero mira la Puerta de la Almoina: verás 7 parejas de cabezas talladas. Dicen que son las 7 familias que trajeron a sus hijas para fundar la Valencia cristiana. Chisme: en el altar mayor aparecieron ángeles músicos renacentistas tapados durante 300 años porque a un obispo le parecieron 'demasiado modernos'.",
        latitude: 39.4753,
        longitude: -0.3751,
        type: "historical",
        visited: false,
        photoSpot: {
          angle: "Detalle de las cabezas de la puerta.",
          bestTime: "13:00 PM.",
          instagramHook: "Tras la pista del cáliz definitivo. 🍷 #HolyGrail",
          milesReward: 140,
          secretLocation: "Calle de la Barchilla."
        }
      },
      {
        id: "vlc_s5",
        name: "El Micalet: 207 Escalones de Venganza",
        description: "Subir aquí es un rito. La escalera de caracol se diseñó para que un solo hombre pudiera detener a un ejército; es tan estrecha que no caben dos. Chisme: las campanas tienen nombres de mujer y se tocan a mano. Cuando oigas el estruendo, es que algo grande pasa en Valencia. Desde arriba, el azul de las cúpulas te cegará.",
        latitude: 39.4751,
        longitude: -0.3755,
        type: "historical",
        visited: false,
        photoSpot: {
          angle: "Hacia el Mercado Central desde arriba.",
          bestTime: "Atardecer.",
          instagramHook: "Valencia a mis pies. 360º de Mediterráneo. 🌊 #Micalet",
          milesReward: 250,
          secretLocation: "Planta de campanas."
        }
      },
      {
        id: "vlc_s6",
        name: "Plaza Redonda: El Embudo de los Susurros",
        description: "Un círculo perfecto. La magia es física: ponte en el centro exacto y susurra; alguien al otro lado te oirá como si estuvieras a su lado. Se llama focalización acústica. Chisme: aquí se vendían los encajes de novia más caros de España. Sigue siendo el lugar donde las falleras compran sus hilos de oro.",
        latitude: 39.4740,
        longitude: -0.3768,
        type: "culture",
        visited: false,
        photoSpot: {
          angle: "Cenital hacia el anillo de cielo.",
          bestTime: "Mediodía.",
          instagramHook: "El círculo más instagrameable. ⭕ #HiddenVLC",
          milesReward: 110,
          secretLocation: "Punto central metálico."
        }
      },
      {
        id: "vlc_s7",
        name: "La Lonja: Sexo, Seda y Banca Rota",
        description: "Patrimonio UNESCO. El salón de columnas es un bosque de palmeras de piedra. Pero mira las gárgolas del patio: son famosas por ser pornográficas. Eran una lección: 'Si haces trampas, acabarás en el vicio'. Chisme: aquí nació el primer banco municipal. Si un mercader no pagaba, le rompían la mesa (la banca) delante de todos. De ahí viene 'Banca Rota'.",
        latitude: 39.4744,
        longitude: -0.3784,
        type: "historical",
        visited: false,
        photoSpot: {
          angle: "Diagonal del bosque de columnas.",
          bestTime: "10:30 AM.",
          instagramHook: "Poder, seda y gárgolas pecaminosas. 🏛 #UNESCO",
          milesReward: 180,
          secretLocation: "Patio de los Naranjos."
        }
      },
      {
        id: "vlc_s8",
        name: "Mercado Central: La Cotorra Cotilla",
        description: "El templo del sabor. Mira la cúpula: hay una veleta de una cotorra. Dicen que se pasa el día criticando a la veleta de la iglesia de enfrente, que es un pájaro mudo. El truco: busca el puesto de anguilas vivas y tómate un zumo de naranja recién exprimido. Es el mercado con más alma de España.",
        latitude: 39.4736,
        longitude: -0.3790,
        type: "food",
        visited: false,
        photoSpot: {
          angle: "Entrada con azulejos modernistas.",
          bestTime: "09:00 AM.",
          instagramHook: "Desayunando en la catedral de los sabores. 🍊 #GastroVLC",
          milesReward: 120,
          secretLocation: "Pasillo de pescaderías."
        }
      },
      {
        id: "vlc_s9",
        name: "San Nicolás: El Milagro del Láser",
        description: "La Capilla Sixtina Valenciana. 2.000 metros de frescos barrocos. No es relieve, es pintura plana que engaña al ojo. Para restaurarla usaron bacterias 'entrenadas' para comerse la cal y láseres. Parece que lo pintaron ayer. Busca a San Nicolás dando bolsas de oro a tres chicas pobres para salvar su honor.",
        latitude: 39.4760,
        longitude: -0.3786,
        type: "art",
        visited: false,
        photoSpot: {
          angle: "Plano medio de la bóveda.",
          bestTime: "Mañana.",
          instagramHook: "Cuando el barroco se vuelve infinito. 🎨 #ArtVLC",
          milesReward: 200,
          secretLocation: "Capilla lateral."
        }
      },
      {
        id: "vlc_s10",
        name: "Dos Aguas: El Palacio del Postureo",
        description: "El mayor monumento al ego. El Marqués de Dos Aguas quería fardar y encargó esta portada de alabastro que parece merengue derretido. Chisme: el interior tiene un salón de baile donde el Marqués obligaba a sus invitados a bailar mientras él los miraba desde un trono. Postureo puro del siglo XVIII.",
        latitude: 39.4727,
        longitude: -0.3752,
        type: "art",
        visited: false,
        photoSpot: {
          angle: "Desde la esquina opuesta.",
          bestTime: "11:00 AM.",
          instagramHook: "Exceso, alabastro y un poquito de envidia. ✨ #Luxury",
          milesReward: 150,
          secretLocation: "Bajo la figura del río Júcar."
        }
      }
    ]
  }
];
