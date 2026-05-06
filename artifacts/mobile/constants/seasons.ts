export type ColorSeason = "Spring" | "Summer" | "Autumn" | "Winter";

export type SeasonProfile = {
  season: ColorSeason;
  subtitle: string;
  emoji: string;
  description: string;
  palette: string[];
  bestColors: string[];
  avoidColors: string[];
  gradient: [string, string];
};

const SEASON_PROFILES: Record<ColorSeason, SeasonProfile> = {
  Spring: {
    season: "Spring",
    subtitle: "Warm & Light",
    emoji: "🌸",
    description:
      "You have warm golden undertones with a lighter complexion. Fresh, warm, and luminous colors make your skin glow and your eyes sparkle.",
    palette: ["#F2B48A", "#E8855A", "#F5CFA0", "#D4956A", "#8BC4A8", "#F5E6C8"],
    bestColors: ["Peach", "Coral", "Warm Yellow", "Ivory", "Camel", "Warm Green"],
    avoidColors: ["Black", "Icy Pink", "Cool Blue", "Burgundy"],
    gradient: ["#FDECD3", "#F5CFA0"],
  },
  Summer: {
    season: "Summer",
    subtitle: "Cool & Light",
    emoji: "🌊",
    description:
      "You have cool rosy undertones with a lighter complexion. Soft, muted, and cool-toned colors complement your delicate, elegant coloring.",
    palette: ["#B8CBDF", "#9BB5D5", "#C8B8D8", "#B0A8C8", "#D5B8C8", "#A8C5BD"],
    bestColors: ["Soft Blue", "Lavender", "Rose Pink", "Dusty Mauve", "Powder Blue", "Soft White"],
    avoidColors: ["Orange", "Warm Yellow", "Warm Brown", "Black"],
    gradient: ["#D9EEF5", "#C8B8D8"],
  },
  Autumn: {
    season: "Autumn",
    subtitle: "Warm & Deep",
    emoji: "🍂",
    description:
      "You have warm earthy undertones with a richer complexion. Deep, rich, and spicy earth tones create a stunning harmony with your natural coloring.",
    palette: ["#C4956A", "#8B5E3C", "#B8860B", "#6B4226", "#A0522D", "#C17F5A"],
    bestColors: ["Rust", "Terracotta", "Olive", "Mustard", "Brown", "Forest Green"],
    avoidColors: ["Icy Pastels", "Cool Pink", "Electric Blue", "Pure White"],
    gradient: ["#F5D5B0", "#C4956A"],
  },
  Winter: {
    season: "Winter",
    subtitle: "Cool & Deep",
    emoji: "❄️",
    description:
      "You have cool neutral or blue undertones with a deeper complexion. Bold, high-contrast, and icy colors create dramatic and stunning looks for you.",
    palette: ["#1A1A2E", "#4A4A8A", "#8A3A5C", "#2E5A7A", "#6A2E4A", "#EBEBFF"],
    bestColors: ["True Red", "Icy Blue", "Pure White", "Black", "Royal Purple", "Fuchsia"],
    avoidColors: ["Warm Brown", "Orange", "Camel", "Warm Yellow"],
    gradient: ["#D9EEF5", "#B0A8C8"],
  },
};

export function getColorSeason(undertone: string, skinTone: string): ColorSeason {
  const isWarm = /warm|golden|yellow|peach|olive|amber/i.test(undertone);
  const isCool = /cool|pink|rose|blue|ash|silver/i.test(undertone);
  const isLight = /light|fair|ivory|porcelain|pale|cream/i.test(skinTone);
  const isMedium = /medium|olive|beige|tan|caramel/i.test(skinTone);
  const isDeep = /deep|dark|rich|mahogany|ebony|mocha/i.test(skinTone);

  if (isWarm || (!isCool)) {
    return isLight ? "Spring" : "Autumn";
  } else {
    return isLight || isMedium ? "Summer" : "Winter";
  }
}

export function getSeasonProfile(season: ColorSeason): SeasonProfile {
  return SEASON_PROFILES[season];
}
