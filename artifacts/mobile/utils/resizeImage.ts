import * as ImageManipulator from "expo-image-manipulator";
import { Image } from "react-native";

const DEFAULT_MAX_SIDE = 512;
const DEFAULT_QUALITY = 0.8;

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (uri.startsWith("data:")) {
      resolve({ width: 0, height: 0 });
      return;
    }
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
}

export async function resizeImageForUpload(
  uri: string,
  maxSide = DEFAULT_MAX_SIDE,
  quality = DEFAULT_QUALITY
): Promise<{ base64: string; mimeType: "image/jpeg" }> {
  const actions: ImageManipulator.Action[] = [];

  try {
    const { width, height } = await getImageSize(uri);
    if (width > 0 && height > 0) {
      if (width >= height && width > maxSide) {
        actions.push({ resize: { width: maxSide } });
      } else if (height > width && height > maxSide) {
        actions.push({ resize: { height: maxSide } });
      }
    } else if (uri.startsWith("data:")) {
      actions.push({ resize: { width: maxSide } });
    }
  } catch {
    actions.push({ resize: { width: maxSide } });
  }

  const result = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: quality,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });

  return {
    base64: result.base64 ?? "",
    mimeType: "image/jpeg",
  };
}
