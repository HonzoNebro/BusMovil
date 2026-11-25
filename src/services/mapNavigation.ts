import { Linking, Platform } from 'react-native';
export interface MapDestination {
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

/** Hand navigation to the user's installed map app; no routing API or API key. */
export async function navigateToPoint(point: MapDestination): Promise<void> {
  const coordinates =
    typeof point.latitude === 'number' && typeof point.longitude === 'number';
  const destination = coordinates
    ? point.latitude + ',' + point.longitude
    : point.address + ', Cádiz, España';
  const query = coordinates
    ? destination + ' (' + point.name + ')'
    : point.name + ', ' + destination;
  const native =
    Platform.OS === 'ios'
      ? 'maps://?daddr=' + encodeURIComponent(destination)
      : 'geo:0,0?q=' + encodeURIComponent(query);
  try {
    await Linking.openURL(native);
  } catch {
    await Linking.openURL(
      'https://www.google.com/maps/dir/?api=1&travelmode=walking&destination=' +
        encodeURIComponent(destination)
    );
  }
}
