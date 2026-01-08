
import { Tour } from '../types';

export const STATIC_TOURS: Tour[] = [
  {
    id: "vitoria_medieval_elite",
    city: "Vitoria",
    title: "Vitoria: Sangre, Naipes y la Almendra Sagrada",
    description: "Un recorrido lineal perfecto por el corazón gótico de la ciudad. Ascenderemos la colina de la 'Almendra' descubriendo palacios que esconden el origen de la baraja española, secretos de la Inquisición y la catedral que cautivó a Ken Follett.",
    duration: "3.5h",
    distance: "2.8 km",
    difficulty: "Moderate",
    theme: "Historia y Secretos",
    isEssential: true,
    stops: [
      {
        id: "vit_s1",
        name: "Plaza de la Virgen Blanca: El Espejo de la Ciudad",
        description: "Empezamos en el kilómetro cero. Fíjate en el monumento central: narra la Batalla de Vitoria de 1813. El gran secreto es que, tras la victoria, los vitorianos saquearon el carruaje de José Bonaparte, ¡robándole hasta su orinal de plata! Ese botín real aún se rumorea que adorna alguna casa noble del casco viejo. Mira los miradores blancos de las casas; no son solo estética, son 'trampas de sol' diseñadas en el XVIII para calentar las viviendas sin carbón. Aquí cada agosto baja Celedón por un cable, un personaje que existió de verdad y cuya casa aún puedes visitar en el pueblo de Zalduondo.",
        latitude: 42.8465,
        longitude: -2.6734,
        type: "historical",
        visited: false,
        photoSpot: {
          angle: "Desde la base del monumento, encuadrando la torre de San Miguel entre los balcones blancos.",
          bestTime: "11:30 AM.",
          instagramHook: "Donde la historia napoleónica se encuentra con el diseño bioclimático del XVIII. 🏛️ #VitoriaGasteiz",
          milesReward: 100,
          secretLocation: "Letras de musgo 'Vitoria-Gasteiz' en la plaza."
        }
      },
      {
        id: "vit_s2",
        name: "Plaza de España: El Neoclasicismo de Olaguíbel",
        description: "A solo unos pasos entramos en un cuadrado perfecto. Olaguíbel diseñó esta plaza en 1781 para unir la ciudad alta con la nueva. Si te fijas en los soportales, verás marcas en las columnas; son los números originales del 'puzzle' de piedra que fue su construcción. El chisme oculto: bajo tus pies corre el río Zapardiel, que fue el alcantarillado medieval y hoy está canalizado. En su día, esta plaza era el 'coso taurino' de la ciudad, y los nobles alquilaban sus balcones por fortunas para ver las corridas.",
        latitude: 42.8460,
        longitude: -2.6726,
        type: "historical",
        visited: false,
        photoSpot: {
          angle: "Bajo el arco central del Ayuntamiento, buscando la simetría de las farolas.",
          bestTime: "Mañana temprano.",
          instagramHook: "Simetría neoclásica que calma el alma. 🏛️ #Architecture",
          milesReward: 80,
          secretLocation: "Punto central bajo el reloj municipal."
        }
      },
      {
        id: "vit_s3",
        name: "Los Arquillos: La Calle Suspendida",
        description: "Subimos hacia la colina por esta genialidad de ingeniería. Olaguíbel creó estos arcos para salvar los 10 metros de desnivel. Lo que nadie te cuenta es que estos soportales crean un túnel de viento natural que los vitorianos llamamos 'el cierzo'. Era el lugar favorito de la burguesía para pasear los días de lluvia sin mojarse. Fíjate en las vigas de madera: son robles de los montes de Álava que llevan soportando el peso de la ciudad desde hace más de 200 años.",
        latitude: 42.8471,
        longitude: -2.6724,
        type: "art",
        visited: false,
        photoSpot: {
          angle: "Desde la mitad de la escalinata de San Miguel, mirando hacia el túnel de los Arquillos.",
          bestTime: "Atardecer.",
          instagramHook: "Caminar por el aire en una ciudad con dos niveles. 🌉 #Olaguibel",
          milesReward: 120,
          secretLocation: "Rellano superior de la escalera mecánica."
        }
      },
      {
        id: "vit_s4",
        name: "Plaza del Machete: Juramentos de Acero",
        description: "Llegamos a la frontera del casco viejo. En el muro de la iglesia de San Vicente verás una hornacina con un machete real. No es decoración: sobre él, el Procurador General juraba defender los fueros. Si no cumplía su palabra, se le cortaba la cabeza con ese mismo acero. Esta plaza era también la 'muga' o frontera del mercado. Fíjate en las casas de la ladera: algunas tienen pasadizos ocultos que conectan con las bodegas del barrio de abajo.",
        latitude: 42.8476,
        longitude: -2.6717,
        type: "historical",
        visited: false,
        photoSpot: {
          angle: "Macro del machete dentro de su urna, con el reflejo de la torre de San Vicente.",
          bestTime: "Cualquier hora.",
          instagramHook: "Justicia a golpe de machete. ⚔️ #MedievalVibe",
          milesReward: 150,
          secretLocation: "Nicho en la pared de la Iglesia."
        }
      },
      {
        id: "vit_s5",
        name: "Palacio de Villa Suso: La Muralla en el Salón",
        description: "En la misma plaza se alza este palacio renacentista. Fue construido por un embajador de Carlos V que quería demostrar su riqueza tras volver de Italia. Lo fascinante es que el palacio 'se comió' un trozo de la muralla original del siglo XI, que aún puedes ver integrada en su salón principal. El secreto: durante su restauración aparecieron restos de una necrópolis medieval justo debajo del patio, confirmando que este fue el primer asentamiento de la aldea de Gasteiz.",
        latitude: 42.8479,
        longitude: -2.6715,
        type: "historical",
        visited: false,
        photoSpot: {
          angle: "Fachada desde la plaza superior, buscando el escudo de armas.",
          bestTime: "Mañana.",
          instagramHook: "Renacimiento vitoriano sobre cimientos del siglo XI. 🏰 #Renaissance",
          milesReward: 100,
          secretLocation: "Puerta lateral del palacio."
        }
      },
      {
        id: "vit_s6",
        name: "Casa del Cordón: El Refugio del Converso",
        description: "Bajamos a la calle Cuchillería. Este palacio es un enigma. Se llama así por el cordón franciscano de su puerta, puesto por el judío converso Sánchez de Bilbao para demostrar una fe cristiana extrema y evitar a la Inquisición. Dentro se esconde una torre medieval de 15 metros intacta. Un dato histórico de élite: aquí durmió el Papa Adriano VI en 1522 cuando le comunicaron que había sido elegido Pontífice. El hombre más poderoso del mundo estaba en esta humilde calle de artesanos.",
        latitude: 42.8488,
        longitude: -2.6712,
        type: "historical",
        visited: false,
        photoSpot: {
          angle: "Detalle del cordón de piedra sobre el arco de entrada.",
          bestTime: "Mediodía.",
          instagramHook: "Secretos de la Inquisición grabados en piedra. 🧵 #HiddenHistory",
          milesReward: 140,
          secretLocation: "Cuchillería 24."
        }
      },
      {
        id: "vit_s7",
        name: "Museo Fournier de Naipes (Palacio Bendaña)",
        description: "Vitoria puso las cartas en las manos de todo el mundo. Heraclio Fournier revolucionó el diseño de la baraja aquí en 1870. El palacio de Bendaña es una joya del XVI con un patio interior renacentista que te dejará mudo. Verás desde barajas imperiales chinas hasta la que usaba la corte de Versalles. El chisme: el diseño de la baraja española actual se inspiró en los rostros de ciudadanos vitorianos de la época que Fournier veía pasar por su imprenta.",
        latitude: 42.8495,
        longitude: -2.6715,
        type: "culture",
        visited: false,
        photoSpot: {
          angle: "Desde el centro del patio mirando hacia la galería superior de madera.",
          bestTime: "12:00 PM.",
          instagramHook: "Donde nació tu baraja favorita. 🃏 #FournierNaipes",
          milesReward: 160,
          secretLocation: "Pozo del patio central."
        }
      },
      {
        id: "vit_s8",
        name: "Muralla Medieval y la Nevera",
        description: "Llegamos a la zona alta. Esta muralla del siglo XI se descubrió hace poco, estaba oculta tras casas viejas. Lo más increíble es la 'Nevera': un pozo de 8 metros donde los monjes guardaban la nieve del invierno mezclada con paja para tener hielo en verano. Vendían el hielo para conservar pescado y curar fiebres. Es el 'frigorífico' más antiguo de Vitoria. Fíjate en las saeteras: están diseñadas para que un arquero viera toda la llanada alavesa sin ser visto.",
        latitude: 42.8500,
        longitude: -2.6710,
        type: "historical",
        visited: false,
        photoSpot: {
          angle: "Desde el adarve superior mirando hacia el valle.",
          bestTime: "Atardecer.",
          instagramHook: "Guardián de la frontera norte. 🛡️ #CityWalls",
          milesReward: 180,
          secretLocation: "Entrada a la Nevera."
        }
      },
      {
        id: "vit_s9",
        name: "Catedral de Santa María: Abierta por Obras",
        description: "Esta catedral no es solo un templo, es un paciente en cuidados intensivos. Sus cimientos cedieron y la iglesia empezó a doblarse, creando paredes curvadas que parecen de plastilina. Ken Follett se inspiró aquí para 'Un mundo sin fin'. La restauración es tan famosa que ha recibido premios mundiales; entras con casco para ver cómo salvan un edificio del colapso. El secreto: bajo el altar aparecieron túneles que conectan con la antigua muralla.",
        latitude: 42.8505,
        longitude: -2.6722,
        type: "art",
        visited: false,
        photoSpot: {
          angle: "Desde la Plaza de la Burullería, buscando el pórtico majestuoso.",
          bestTime: "Puesta de sol.",
          instagramHook: "La catedral que inspiró los pilares de la tierra. ⛪ #SantaMaria",
          milesReward: 200,
          secretLocation: "Estatua de Ken Follett junto al muro."
        }
      },
      {
        id: "vit_s10",
        name: "Plaza de la Burullería: El Fin de la Almendra",
        description: "Terminamos donde comerciaban los tejedores ('burulleros'). El edificio de madera y ladrillo es El Portalón, un mesón del siglo XV que sigue vivo. Sus puertas son tan grandes porque los caballos y carruajes entraban directamente al patio interior. Al lado está la Torre de los Anda, la más antigua de la ciudad. Fíjate en los escudos: cuentan la historia de las familias que defendieron Vitoria de los ataques de bandidos de la sierra.",
        latitude: 42.8508,
        longitude: -2.6719,
        type: "historical",
        visited: false,
        photoSpot: {
          angle: "Diagonal que incluya el Portalón y la Torre de los Anda.",
          bestTime: "Tarde.",
          instagramHook: "Viaje directo al siglo XV. 🕰️ #MedievalArchitecture",
          milesReward: 110,
          secretLocation: "Bajo el arco de la torre."
        }
      }
    ]
  },
  {
    id: "vitoria_romantic_green",
    city: "Vitoria",
    title: "Vitoria: Palacios, Poder y la Senda Verde",
    description: "Un recorrido lineal por el Ensanche romántico y el Anillo Verde interior. De la majestuosidad de la Florida al modernismo de la Calle Dato.",
    duration: "3h",
    distance: "3.4 km",
    difficulty: "Easy",
    theme: "Burguesía y Naturaleza",
    isEssential: false,
    stops: [
      {
        id: "vit_g1",
        name: "Estatua del Caminante",
        description: "Empezamos en el corazón social. Esta figura de bronce de 3,5 metros representa al vitoriano que siempre está de paso, paseando por su ciudad. Es obra de Juan José Eguizábal y se ha convertido en el símbolo moderno. El chisme: en fiestas o eventos importantes (como el ascenso del Alavés), los ciudadanos lo disfrazan. Es el ciudadano más alto y silencioso de Gasteiz. Desde aquí sale la calle Dato, la milla de oro.",
        latitude: 42.8462,
        longitude: -2.6720,
        type: "culture",
        visited: false,
        photoSpot: {
          angle: "Haciendo que caminas al lado de la estatua.",
          bestTime: "Día.",
          instagramHook: "Uno más en la ciudad del paseo. 🚶‍♂️ #CaminanteVitoria",
          milesReward: 90,
          secretLocation: "Plaza del Arca."
        }
      },
      {
        id: "vit_g2",
        name: "Plaza de los Fueros: El Granito de Chillida",
        description: "A dos minutos del Caminante. Obra maestra de Eduardo Chillida y Peña Ganchegui. Es un anfiteatro de granito rosa que rinde homenaje a las leyes vascas. El secreto: dentro de la estructura hay un frontón escondido, uniendo el deporte tradicional con el arte de vanguardia. Es un lugar para perderse entre sus ángulos rectos y sentir el peso del granito. Fíjate en la escultura de la mano de hierro que emerge del suelo.",
        latitude: 42.8455,
        longitude: -2.6710,
        type: "art",
        visited: false,
        photoSpot: {
          angle: "Desde el foso central mirando hacia arriba para captar las formas.",
          bestTime: "Día soleado (sombras fuertes).",
          instagramHook: "Perdido en el laberinto de Chillida. 🧱 #EduardoChillida",
          milesReward: 150,
          secretLocation: "Escultura de la mano de hierro."
        }
      },
      {
        id: "vit_g3",
        name: "Calle Dato y Confituras Goya",
        description: "Caminamos por la calle peatonal por excelencia. Aquí se viene a ver y ser visto. Lo más importante: Confituras Goya. Tienes que probar los 'Vasquitos y Nesquitas', bombones de chocolate que definen el paladar de Vitoria desde 1886. El secreto de la calle: mira hacia arriba, los balcones conservan la forja original del siglo XIX de cuando esta calle era el centro de la moda del norte de España.",
        latitude: 42.8445,
        longitude: -2.6728,
        type: "culture",
        visited: false,
        photoSpot: {
          angle: "Perspectiva de la calle desde el Caminante hacia el sur.",
          bestTime: "Hora del vermut.",
          instagramHook: "El pulso de la ciudad en una sola calle. ☕ #CalleDato",
          milesReward: 80,
          secretLocation: "Escaparate de Confituras Goya."
        }
      },
      {
        id: "vit_g4",
        name: "Parque de la Florida: El Jardín Francés",
        description: "Al final de Dato entramos en el pulmón romántico. Inaugurado en 1820, es un jardín botánico con secuoyas gigantes. El secreto: las estatuas de los reyes godos fueron un regalo de Madrid porque 'sobraban' en el Palacio Real. Aquí se monta el Belén a escala real más grande del mundo en Navidad. Busca el sauce llorón junto al quiosco; es el lugar donde los vitorianos se han declarado amor desde hace dos siglos.",
        latitude: 42.8445,
        longitude: -2.6750,
        type: "nature",
        visited: false,
        photoSpot: {
          angle: "Bajo el sauce llorón principal con el quiosco de fondo.",
          bestTime: "Mañana.",
          instagramHook: "Un rincón de París en el corazón de Álava. 🌿 #FloridaPark",
          milesReward: 100,
          secretLocation: "Puente de piedra sobre el riachuelo."
        }
      },
      {
        id: "vit_g5",
        name: "Catedral Nueva (Inmaculada): El Gigante Inacabado",
        description: "Justo al lado de la Florida. Esta mole neogótica es tan grande que podrías meter la catedral de Santander dentro. Estuvo 50 años parada por falta de dinero. Fíjate en las gárgolas: algunas son muy raras porque los escultores modernos se tomaron licencias creativas. Su cripta es de lo mejor de España. Fue construida sobre un antiguo hospital de sangre, lo que le da un aire místico y algo oscuro.",
        latitude: 42.8438,
        longitude: -2.6765,
        type: "art",
        visited: false,
        photoSpot: {
          angle: "Desde la plaza lateral para captar la altura de los contrafuertes.",
          bestTime: "Mediodía.",
          instagramHook: "Arquitectura que desafía al cielo. ⛪ #NeoGothic",
          milesReward: 150,
          secretLocation: "Escalinata de la girola."
        }
      },
      {
        id: "vit_g6",
        name: "Paseo de la Senda: La Milla de Oro Burguesa",
        description: "Salimos hacia el paseo más elegante. Flanqueado por castaños de indias y palacetes. Aquí vivía la aristocracia industrial que hizo fortuna con el acero y el azúcar. Es el lugar del 'postureo' histórico: pasear los domingos para lucir el abrigo de piel. El aire aquí es distinto: es el Anillo Verde entrando directo al centro de la ciudad. Fíjate en las verjas de hierro: son obras maestras de la forja local.",
        latitude: 42.8425,
        longitude: -2.6780,
        type: "culture",
        visited: false,
        photoSpot: {
          angle: "Perspectiva del túnel de árboles mirando hacia el sur.",
          bestTime: "Otoño.",
          instagramHook: "Elegancia que no pasa de moda. 🌳 #LaSendaVitoria",
          milesReward: 120,
          secretLocation: "Entrada del Palacio Zulueta."
        }
      },
      {
        id: "vit_g7",
        name: "Palacio Zulueta: El Sueño del Indiano",
        description: "Este palacete fue la casa de un rico comerciante que hizo fortuna en Cuba. Representa el éxito de los vitorianos en América. Su cúpula de cristal era una locura tecnológica en su época. El jardín delantero es público y es el lugar más tranquilo para leer un libro. Hoy guarda el archivo más importante de la cultura vasca (Fundación Sancho el Sabio). Mira los detalles de las ventanas: son de estilo ecléctico, mezclando todo lo que el dueño vio en sus viajes.",
        latitude: 42.8415,
        longitude: -2.6795,
        type: "art",
        visited: false,
        photoSpot: {
          angle: "Hacia la fachada desde el jardín delantero.",
          bestTime: "Luz de tarde.",
          instagramHook: "Vivir como un marqués del siglo XIX. 💍 #PalaceLife",
          milesReward: 130,
          secretLocation: "Banco junto a la fuente."
        }
      },
      {
        id: "vit_g8",
        name: "Palacio de Ajuria Enea: El Corazón del Poder",
        description: "Llegamos a la residencia oficial del Lehendakari (Presidente Vasco). Un palacio neovasco de 1920 que antes fue de la familia Ajuria, magnates del acero. El chisme de élite: la familia perdió su fortuna y el edificio fue hasta un colegio antes de ser sede del gobierno. Es el edificio más protegido de Euskadi. Fíjate en el escudo de la puerta: representa la unión de los territorios vascos bajo un mismo techo.",
        latitude: 42.8405,
        longitude: -2.6805,
        type: "historical",
        visited: false,
        photoSpot: {
          angle: "Fachada lateral desde la valla de seguridad.",
          bestTime: "Tarde.",
          instagramHook: "La casa del Presidente. 🛡️ #AjuriaEnea",
          milesReward: 180,
          secretLocation: "Portón de seguridad."
        }
      },
      {
        id: "vit_g9",
        name: "Museo de Armería: El Acero de la Historia",
        description: "Justo frente a Ajuria Enea. Guarda el secreto militar de la ciudad. Verás las armas reales de la Batalla de Vitoria y armaduras medievales que parecen de película. Lo más curioso: un hacha de la Edad de Bronce encontrada muy cerca, demostrando que Vitoria ha sido estratégica desde hace 4.000 años. Aquí entiendes por qué los vascos tienen fama mundial de ser los mejores herreros de la historia.",
        latitude: 42.8402,
        longitude: -2.6812,
        type: "culture",
        visited: false,
        photoSpot: {
          angle: "Detalle de los cañones de la entrada.",
          bestTime: "Mañana.",
          instagramHook: "Historia escrita en acero y pólvora. ⚔️ #ArmoryMuseum",
          milesReward: 100,
          secretLocation: "Patio de artillería."
        }
      },
      {
        id: "vit_g10",
        name: "Museo de Bellas Artes (Palacio de Augusti)",
        description: "Terminamos en el palacio más romántico y recargado. Fue un regalo de un empresario a su mujer por amor. Su fachada neoplateresca parece de encaje, no de piedra. El jardín trasero es el secreto mejor guardado de los locales: un oasis de paz absoluta. Dentro hay una colección de pintura vasca que es un viaje por la luz y el paisaje de nuestra tierra. Es el final perfecto para entender la alma burguesa y artística de Vitoria.",
        latitude: 42.8395,
        longitude: -2.6820,
        type: "art",
        visited: false,
        photoSpot: {
          angle: "Gran angular desde la acera de enfrente para captar toda la fachada.",
          bestTime: "Luz de tarde suave.",
          instagramHook: "El palacio más bello de Gasteiz. 🎨 #FineArtsVitoria",
          milesReward: 130,
          secretLocation: "Bancos del jardín trasero."
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
