import * as ImageManipulator from "expo-image-manipulator";
import { Image } from "react-native";

const DEFAULT_MAX_SIDE = 512;
const DEFAULT_QUALITY = 0.8;

async function resolveImageDimensions(
  uri: string
): Promise<{ width: number; height: number }> {
  if (!uri.startsWith("data:")) {
    return new Promise<{ width: number; height: number }>((resolve, reject) => {
      Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
    });
  }
  const info = await ImageManipulator.manipulateAsync(uri, [], {
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return { width: info.width, height: info.height };
}

export async function resizeImageForUpload(
  uri: string,
  maxSide = DEFAULT_MAX_SIDE,
  quality = DEFAULT_QUALITY
): Promise<{ base64: string; mimeType: "image/jpeg" }> {
  const actions: ImageManipulator.Action[] = [];

  try {
    const { width, height } = await resolveImageDimensions(uri);
    if (width > 0 && height > 0) {
      if (width >= height && width > maxSide) {
        actions.push({ resize: { width: maxSide } });
      } else if (height > width && height > maxSide) {
        actions.push({ resize: { height: maxSide } });
      }
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
