
import { Tour } from '../types';

export const STATIC_TOURS: Tour[] = [
  {
    id: 'mad-1',
    city: 'Madrid',
    title: 'Madrid de los Austrias',
    description: 'Recorrido por el corazón histórico de la capital de España.',
    duration: '2h',
    distance: '3.5 km',
    difficulty: 'Easy',
    theme: 'History',
    stops: [
      { id: 'm1', name: 'Puerta del Sol', description: 'El centro neurálgico de España y su kilómetro cero.', latitude: 40.4169, longitude: -3.7035, type: 'historical', visited: false },
      { id: 'm2', name: 'Plaza Mayor', description: 'La gran plaza porticada del siglo XVII.', latitude: 40.4154, longitude: -3.7074, type: 'historical', visited: false },
      { id: 'm3', name: 'Palacio Real', description: 'Residencia oficial del Rey de España.', latitude: 40.4180, longitude: -3.7144, type: 'historical', visited: false }
    ]
  },
  {
    id: 'bcn-1',
    city: 'Barcelona',
    title: 'Gaudí y el Modernismo',
    description: 'Descubre las obras maestras de Antoni Gaudí en el Eixample.',
    duration: '3h',
    distance: '4.2 km',
    difficulty: 'Easy',
    theme: 'Art',
    stops: [
      { id: 'b1', name: 'Sagrada Familia', description: 'La basílica inacabada, icono mundial.', latitude: 41.4036, longitude: 2.1744, type: 'art', visited: false },
      { id: 'b2', name: 'Casa Batlló', description: 'Arquitectura orgánica inspirada en el mar.', latitude: 41.3916, longitude: 2.1649, type: 'art', visited: false },
      { id: 'b3', name: 'La Pedrera', description: 'Formas onduladas que desafían la gravedad.', latitude: 41.3953, longitude: 2.1619, type: 'art', visited: false }
    ]
  },
  {
    id: 'svq-1',
    city: 'Sevilla',
    title: 'Sevilla Monumental',
    description: 'Un paseo por la historia de la capital andaluza.',
    duration: '2.5h',
    distance: '3 km',
    difficulty: 'Easy',
    theme: 'History',
    stops: [
      { id: 's1', name: 'Giralda y Catedral', description: 'La catedral gótica más grande del mundo.', latitude: 37.3858, longitude: -5.9931, type: 'historical', visited: false },
      { id: 's2', name: 'Real Alcázar', description: 'Palacio real de estilo mudéjar en uso.', latitude: 37.3831, longitude: -5.9902, type: 'historical', visited: false },
      { id: 's3', name: 'Torre del Oro', description: 'Torre defensiva a orillas del Guadalquivir.', latitude: 37.3824, longitude: -5.9964, type: 'historical', visited: false }
    ]
  }
];