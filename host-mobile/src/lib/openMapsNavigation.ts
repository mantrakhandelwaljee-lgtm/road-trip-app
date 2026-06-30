import { Linking, Platform } from 'react-native';

/**
 * Opens the device's maps app with driving directions to `destination`.
 * The host app moves to the background while maps stays in the foreground.
 */
export async function openMapsNavigation(destination: string): Promise<void> {
  const trimmed = destination.trim();
  if (!trimmed) return;

  const encoded = encodeURIComponent(trimmed);

  const urls = Platform.select({
    ios: [
      `maps://?daddr=${encoded}&dirflg=d`,
      `http://maps.apple.com/?daddr=${encoded}&dirflg=d`,
      `comgooglemaps://?daddr=${encoded}&directionsmode=driving`,
    ],
    android: [
      `google.navigation:q=${encoded}`,
      `geo:0,0?q=${encoded}`,
    ],
    default: [],
  }) ?? [];

  urls.push(
    `https://www.google.com/maps/dir/?api=1&destination=${encoded}&travelmode=driving`,
  );

  for (const url of urls) {
    try {
      await Linking.openURL(url);
      return;
    } catch {
      // Try the next maps URL scheme.
    }
  }
}
