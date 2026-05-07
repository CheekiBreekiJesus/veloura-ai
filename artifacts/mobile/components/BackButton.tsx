import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleProp, StyleSheet, ViewStyle } from "react-native";

import { useColors } from "@/hooks/useColors";

interface BackButtonProps {
  variant?: "back" | "close";
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  iconColor?: string;
  size?: number;
}

export default function BackButton({
  variant = "back",
  onPress,
  style,
  iconColor,
  size = 40,
}: BackButtonProps) {
  const colors = useColors();

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  const iconName = variant === "close" ? "close" : "chevron-back";
  const resolvedIconColor = iconColor ?? colors.foreground;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.btn,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.secondary,
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
      hitSlop={8}
    >
      <Ionicons name={iconName} size={20} color={resolvedIconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: "center",
    justifyContent: "center",
  },
});
