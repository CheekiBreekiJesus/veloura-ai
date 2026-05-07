import * as MediaLibrary from "expo-media-library";
import { Platform, ToastAndroid } from "react-native";

let permissionDeniedToastShown = false;

export async function saveToGallery(
  uri: string,
  albumName?: string
): Promise<string | null> {
  const { status } = await MediaLibrary.requestPermissionsAsync();

  if (status !== "granted") {
    if (!permissionDeniedToastShown) {
      permissionDeniedToastShown = true;
      if (Platform.OS === "android") {
        ToastAndroid.show(
          "Enable photo library access in Settings to save photos.",
          ToastAndroid.LONG
        );
      }
      // iOS: silent — prompts are already surfaced by the OS
    }
    return null;
  }

  try {
    const asset = await MediaLibrary.createAssetAsync(uri);

    if (albumName) {
      let album = await MediaLibrary.getAlbumAsync(albumName);
      if (!album) {
        album = await MediaLibrary.createAlbumAsync(albumName, asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }
    }

    return asset.uri;
  } catch {
    return null;
  }
}
