/**
 * Optional clipboard support.
 * Works when @react-native-clipboard/clipboard is installed;
 * falls back to React Native's Share sheet otherwise.
 */
import { Share } from 'react-native';

function tryClipboard(text: string): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Clipboard = require('@react-native-clipboard/clipboard').default;
    Clipboard.setString(text);
    return true;
  } catch {
    return false;
  }
}

export async function copyToClipboard(text: string): Promise<void> {
  const copied = tryClipboard(text);
  if (!copied) {
    // Graceful fallback: open the system share sheet so the user can copy manually
    await Share.share({ message: text }).catch(() => {});
  }
}
