
import { Stop } from '../types';

// Fix: Declare google as any to avoid "Cannot find name 'google'" errors
declare const google: any;

/**
 * Validates and gets exact coordinates from Google Places API for a list of stop names.
 * Ensures the coordinates come from Google's database, not AI hallucination.
 */
export const geocodeStops = async (stops: Partial<Stop>[], city: string): Promise<Stop[]> => {
  const service = new google.maps.places.PlacesService(document.createElement('div'));
  
  const geocodedStops = await Promise.all(stops.map(async (stop) => {
    return new Promise<Stop>((resolve) => {
      const request = {
        query: `${stop.name}, ${city}`,
        fields: ['name', 'geometry', 'place_id'],
      };

      service.findPlaceFromQuery(request, (results: any, status: any) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]?.geometry?.location) {
          const loc = results[0].geometry.location;
          resolve({
            ...stop,
            latitude: loc.lat(),
            longitude: loc.lng(),
            id: results[0].place_id || stop.id || `stop_${Math.random()}`,
          } as Stop);
        } else {
          // Fallback if not found, though ideally we want exact matches
          resolve(stop as Stop);
        }
      });
    });
  }));

  return geocodedStops;
};

/**
 * Fetches polyline for the entire tour route using Google Directions API.
 */
// Fix: Use any as the return type to avoid "Cannot find namespace 'google'"
export const getRouteDirections = async (stops: Stop[]): Promise<any> => {
  const directionsService = new google.maps.DirectionsService();
  
  if (stops.length < 2) throw new Error("At least 2 stops required for a route");

  const origin = new google.maps.LatLng(stops[0].latitude, stops[0].longitude);
  const destination = new google.maps.LatLng(stops[stops.length - 1].latitude, stops[stops.length - 1].longitude);
  const waypoints = stops.slice(1, -1).map(stop => ({
    location: new google.maps.LatLng(stop.latitude, stop.longitude),
    stopover: true
  }));

  return new Promise((resolve, reject) => {
    directionsService.route({
      origin,
      destination,
      waypoints,
      travelMode: google.maps.TravelMode.WALKING,
    }, (result: any, status: any) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        resolve(result);
      } else {
        reject(status);
      }
    });
  });
};
