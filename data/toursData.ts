
import { Tour } from '../types';

export const STATIC_TOURS: Tour[] = [
  {
    id: "logrono_elite_v3_2026",
    city: "Logroño",
    title: "Logroño: El Hilo de Ariadna entre el Ebro y el Sillar",
    description: "Este no es un paseo turístico; es un análisis forense de la evolución urbana de Logroño. Desvelamos la ingeniería defensiva del Puente de Piedra, la geometría sagrada de sus templos góticos y la infraestructura oculta de la mayor red de calados subterráneos de Europa. Una ruta diseñada para el intelecto, no solo para la vista.",
    duration: "4.5h",
    distance: "3.8 km",
    difficulty: "Moderate",
    theme: "Ingeniería, Simbolismo y Calados",
    isEssential: true,
    stops: [
      { 
        id: "log_1", 
        name: "Puente de Piedra: La Ingeniería de la Supervivencia", 
        description: "El punto cero de la ciudad. Lo que pisas hoy es una reconstrucción magistral de 1884 sobre las bases del puente medieval de San Juan de Ortega. Su estructura consta de siete arcos de medio punto fabricados con piedra de sillar de las canteras de Grávalos, diseñados con tajamares angulares extremos para dividir la presión hidrodinámica del Ebro, que en este punto alcanza velocidades críticas durante las crecidas invernales. El secreto constructivo reside en sus cimientos: se utilizaron cajones de aire comprimido para asentar las pilas directamente sobre el lecho de roca, evitando el socavamiento por erosión que destruyó el puente original. Históricamente, este puente fue el cuello de botella fiscal de la ciudad, donde se cobraba el 'pontazgo' a los mercaderes y peregrinos del Camino de Santiago.", 
        latitude: 42.4705, longitude: -2.4435, 
        type: "historical", visited: false, 
        photoSpot: { angle: "Contrapicado desde el primer tajamar (lado norte)", bestTime: "Amanecer (Luz dorada sobre el sillar)", instagramHook: "PuertaDelCamino", milesReward: 120, secretLocation: "Plinto del arco central" } 
      },
      { 
        id: "log_2", 
        name: "Ermita de San Gregorio: El Eje Freático", 
        description: "Enclavada en la Ruavieja, la calle más antigua de la ciudad. Esta minúscula ermita del siglo XVII es el último vestigio de la arquitectura devocional de escala humana. San Gregorio de Ostia, legado papal en el siglo XI, es el protector contra las plagas; su presencia aquí no es casual, sino estratégica para la moral de una ciudad diezmada por la filoxera y las inundaciones. El detalle arquitectónico crítico es su fachada barroca mínima: fíjate en el dintel de piedra, presenta una curvatura casi imperceptible diseñada para drenar el agua de lluvia lejos de la puerta de madera noble. Los muros de la ermita funcionan como un testigo del nivel freático; la humedad que ves en la base es el Ebro filtrándose silenciosamente a través de la arena fluvial sobre la que se asienta el casco antiguo.", 
        latitude: 42.4695, longitude: -2.4438, 
        type: "culture", visited: false, 
        photoSpot: { angle: "Primer plano del dintel y la aldaba", bestTime: "11:00 AM", instagramHook: "SanGregorioSecrets", milesReward: 80, secretLocation: "Marco de la puerta" } 
      },
      { 
        id: "log_3", 
        name: "Santa María de Palacio: El Faro de Piedra", 
        description: "Su aguja piramidal octogonal del siglo XIII es el hito visual más complejo del gótico en el norte de España. Es una estructura autoportante de ocho caras que se eleva sobre el crucero de la iglesia. Lo que ves desde fuera como pura estética es en realidad un prodigio de estabilidad: los nervios de piedra internos actúan como un esqueleto que distribuye el peso hacia los muros exteriores, permitiendo que la torre sea hueca y ligera. Se le conoce como 'La Aguja' y servía de faro terrestre para los peregrinos que bajaban de los montes de Navarra. El claustro oculta marcas de cantería de la orden del Santo Sepulcro, firmas de maestros constructores que grababan símbolos rúnicos en el sillar para reclamar sus jornales. Aquí, la piedra cuenta la historia del gremio masónico riojano.", 
        latitude: 42.4678, longitude: -2.4445, 
        type: "art", visited: false, 
        photoSpot: { angle: "Desde el centro del claustro mirando hacia la aguja", bestTime: "Mediodía (Sombras duras)", instagramHook: "GóticoVertical", milesReward: 150, secretLocation: "Rincón del claustro norte" } 
      },
      { 
        id: "log_4", 
        name: "Iglesia de Santiago el Real: La Fortaleza del Apóstol", 
        description: "Fíjate en su fachada: no es una iglesia convencional, es un monumento de propaganda barroca del siglo XVIII. Santiago Matamoros preside la entrada sobre un caballo brioso. Sin embargo, el verdadero tesoro es técnico: la nave es una de las más anchas de La Rioja sin columnas intermedias, lograda gracias a un complejo sistema de bóvedas de crucería estrellada que canaliza las tensiones hacia contrafuertes externos camuflados en las casas colindantes. A pocos metros, en el suelo de la plaza, el 'Juego de la Oca' no es una decoración infantil; es una representación codificada de las etapas del Camino de Santiago, donde cada casilla coincide con hitos geográficos reales de la ruta jacobea. Debajo del altar, el Calado de San Gregorio (un túnel de vino del S.XVI) demuestra cómo la ciudad se construyó en dos niveles: el espiritual y el vinícola.", 
        latitude: 42.4674, longitude: -2.4485, 
        type: "historical", visited: false, 
        photoSpot: { angle: "Picado sobre el tablero de la Oca en el suelo", bestTime: "Tarde (Luz lateral)", instagramHook: "CódigoSantiago", milesReward: 100, secretLocation: "Casilla 63 de la plaza" } 
      },
      { 
        id: "log_5", 
        name: "Iglesia de San Bartolomé: El Tímpano de la Historia", 
        description: "Esta es la portada más antigua de Logroño (siglo XIII). Es un libro de texto en piedra. El tímpano narra el martirio de San Bartolomé con un realismo que asustaba a los fieles medievales. Fíjate en la técnica del tallado: las figuras están casi en bulto redondo, lo que indica la transición del románico estático al gótico dinámico. La torre, robusta y con escasas saeteras, no fue diseñada solo para campanas, sino como torre de defensa integrada en la muralla sur de la ciudad vieja. Los agujeros que ves en el sillar no son desgaste, son 'mechinales' donde se insertaban los andamios de madera durante su construcción. Cada bloque de piedra pesa más de 200 kilos y fue transportado desde las canteras del monte Cantabria mediante bueyes y poleas de madera.", 
        latitude: 42.4668, longitude: -2.4446, 
        type: "historical", visited: false, 
        photoSpot: { angle: "Detalle de los relieves del tímpano", bestTime: "Mañana (Sol directo)", instagramHook: "SanBartolomeLog", milesReward: 110, secretLocation: "Muro izquierdo de la portada" } 
      },
      { 
        id: "log_6", 
        name: "La Redonda: Las Torres de la Ostentación", 
        description: "Su nombre engaña: es una planta rectangular. Se llama 'La Redonda' porque se asienta sobre una antigua colegiata románica circular que fue demolida para dar paso a este coloso. Las dos torres barrocas, terminadas en 1756, son el 'skyline' oficial. Fueron construidas para rivalizar con las de Santo Domingo de la Calzada. El detalle técnico que define a La Redonda es el 'Calvario' que guarda en su interior, una tabla atribuida a Miguel Ángel, lo que eleva el valor artístico del recinto a niveles europeos. El subsuelo de la catedral es un cementerio de arena; debido a la inestabilidad del terreno por su cercanía al antiguo cauce, los arquitectos tuvieron que diseñar una base de 'pilotes de madera' y cascotes de piedra para evitar que el peso de las torres gemelas hiciera colapsar la nave central.", 
        latitude: 42.4665, longitude: -2.4455, 
        type: "art", visited: false, 
        photoSpot: { angle: "Desde la Plaza del Mercado enfocando las torres", bestTime: "Atardecer (Color fuego)", instagramHook: "TorresGemelasRioja", milesReward: 140, secretLocation: "Puerta del Perdón" } 
      },
      { 
        id: "log_7", 
        name: "Palacio de los Chapiteles: El Renacimiento del Poder", 
        description: "Antigua sede del ayuntamiento. Es la máxima expresión del palacio civil riojano. Su balconada corrida de hierro forjado es una proeza de la herrería del siglo XVI; fíjate en las uniones, están hechas con remaches en caliente, sin una sola soldadura moderna. El palacio presenta una fachada de sillar de grano fino que ha resistido la contaminación atmosférica mejor que la piedra caliza de las iglesias. Bajo el edificio se encuentra una red de túneles que conectaba las casas nobles con la muralla; estos pasajes permitían el flujo de información y suministros durante los asedios franceses de 1521. Es arquitectura de poder: sobria, robusta y con una simetría que imponía respeto a los ciudadanos de a pie.", 
        latitude: 42.4663, longitude: -2.4452, 
        type: "historical", visited: false, 
        photoSpot: { angle: "Eje de simetría desde la calle Portales", bestTime: "Luz de tarde", instagramHook: "PoderRenacentista", milesReward: 70, secretLocation: "Base del balcón central" } 
      },
      { 
        id: "log_8", 
        name: "Calle Portales: El Corredor del Tiempo", 
        description: "La columna vertebral social de Logroño. Sus arcos y soportales no son solo decorativos; responden a una necesidad comercial y climática. Permitían a los mercaderes exponer sus paños y vinos protegidos de la lluvia riojana. Fíjate en los pilares de granito: cada uno presenta marcas de nivel para controlar las inundaciones históricas del Ebro. Esta calle sigue el trazado de la antigua muralla, de ahí su ligera curvatura. Es el lugar donde la ciudad medieval se fundió con el comercio moderno. Las baldosas actuales ocultan los antiguos canales de evacuación de aguas grises que vertían directamente hacia el exterior de la muralla. Hoy es un museo vivo de balconadas barrocas y escudos heráldicos de la baja nobleza que enriqueció la ciudad mediante el comercio del cereal.", 
        latitude: 42.4658, longitude: -2.4465, 
        type: "culture", visited: false, 
        photoSpot: { angle: "Perspectiva infinita bajo los arcos", bestTime: "Noche (Luces led cálidas)", instagramHook: "PortalesLog", milesReward: 60, secretLocation: "Pilar número 7" } 
      },
      { 
        id: "log_9", 
        name: "Parlamento de La Rioja: Del Convento a la Ley", 
        description: "Antiguo Convento de la Merced. Este edificio ha vivido todas las mutaciones posibles: convento barroco, hospital, cuartel, cárcel y hoy Parlamento. Su fachada barroca es una lección de proporción: el frontón partido y las hornacinas vacías reflejan el declive de la opulencia religiosa frente a la necesidad civil. El claustro interior ha sido intervenido con una estructura de acero y vidrio de vanguardia que genera una climatización pasiva mediante el 'efecto chimenea', manteniendo el edificio fresco sin necesidad de aire acondicionado industrial. El sillar exterior muestra impactos de la Guerra Civil, cicatrices que los arquitectos decidieron no borrar para mantener la memoria histórica del edificio. Es el punto donde el pasado monástico se reconcilia con la democracia moderna.", 
        latitude: 42.4665, longitude: -2.4495, 
        type: "historical", visited: false, 
        photoSpot: { angle: "Fachada principal desde la muralla del Revellín", bestTime: "Mañana", instagramHook: "MurosConMemoria", milesReward: 90, secretLocation: "Esquina con la muralla" } 
      },
      { 
        id: "log_10", 
        name: "Museo de La Rioja: El Palacio del General", 
        description: "Residencia del General Espartero, figura clave de la España del XIX. Es un palacio barroco civil que destaca por su escalera imperial, diseñada para que dos personas pudieran subir en paralelo sin tocarse, un protocolo de la etiqueta noble. La fachada es un despliegue de heráldica: el escudo central es una pieza única de talla profunda. El edificio fue restaurado recientemente utilizando 'mortero de cal' tradicional para permitir que la piedra 'respire', evitando la acumulación de sales que degradan el sillar. En su interior se guardan las tablas de San Millán de la Cogolla, pero el edificio en sí mismo es la pieza de museo más valiosa, representando la transición de la casa-torre defensiva al palacio de recreo de la burguesía ilustrada.", 
        latitude: 42.4652, longitude: -2.4485, 
        type: "art", visited: false, 
        photoSpot: { angle: "Escudo de armas central en alta resolución", bestTime: "10:00 AM", instagramHook: "PalacioEspartero", milesReward: 130, secretLocation: "Primer peldaño escalera" } 
      },
      { 
        id: "log_11", 
        name: "Calle Laurel: La Infraestructura del Placer", 
        description: "No te dejes engañar por las tapas y el vino; estás caminando sobre una colmena de calados subterráneos. Bajo el pavimento de la Laurel hay kilómetros de túneles del siglo XVI que servían para fermentar el vino a una temperatura constante de 13 grados, independientemente del exterior. Cada bar que ves arriba tiene un espejo subterráneo de piedra. El 'pincho' no es solo comida, es una micro-ingeniería culinaria diseñada para ser consumida en dos bocados mientras se sostiene una copa de Rioja. El olor característico a champiñón a la plancha proviene de las potentes campanas industriales que tuvieron que ser integradas en edificios centenarios, un reto técnico de ventilación que evita que el humo sature el casco antiguo. La Laurel es el motor económico oculto de la ciudad.", 
        latitude: 42.4645, longitude: -2.4475, 
        type: "food", visited: false, 
        photoSpot: { angle: "Cruce de Laurel con Albornoz (El corazón)", bestTime: "20:30 (Bullicio máximo)", instagramHook: "LaurelIntelligence", milesReward: 200, secretLocation: "Acceso al calado del bar Blanco y Negro" } 
      },
      { 
        id: "log_12", 
        name: "Paseo del Espolón: El Final del Trayecto", 
        description: "Coordenada final del vector Sur. El Espolón es el 'salón' de la ciudad, diseñado bajo los cánones del urbanismo romántico francés. La estatua ecuestre de Espartero es el eje central. Curiosidad técnica: El bronce de la estatua se fundió utilizando cañones reales capturados en batalla. El pavimento del paseo está diseñado con un ligero gradiente hacia los lados para evacuar las tormentas repentinas de la cuenca del Ebro hacia el alcantarillado perimetral. Los árboles (plátanos de sombra) están dispuestos en una cuadrícula exacta que crea un túnel de aire fresco durante el verano riojano. Es el punto donde el Logroño medieval de piedra y sombras termina y se abre a la ciudad ancha y moderna del siglo XX. Aquí el archivo se cierra, habiendo cruzado el tiempo y la geografía de la capital del vino.", 
        latitude: 42.4635, longitude: -2.4455, 
        type: "culture", visited: false, 
        photoSpot: { angle: "Estatua ecuestre con la bandera de La Rioja de fondo", bestTime: "Noche (Iluminación monumental)", instagramHook: "FinalDeRutaLog", milesReward: 100, secretLocation: "Kiosco de música central" } 
      }
    ]
  }
];
