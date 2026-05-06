import { type AnalysisResult } from "@/context/AnalysisContext";

type Tip = {
  title: string;
  body: string;
  icon: string;
  category: "beauty" | "style" | "color" | "hair" | "wellness";
};

const GENERIC_TIPS: Tip[] = [
  {
    title: "The Power of Your Palette",
    body: "Wearing colors from your personal palette near your face instantly harmonizes your complexion and brightens your eyes.",
    icon: "color-palette-outline",
    category: "color",
  },
  {
    title: "Foundation of Great Skin",
    body: "Hydration is the foundation of every great look. Eight glasses of water daily keeps your skin naturally luminous.",
    icon: "water-outline",
    category: "wellness",
  },
  {
    title: "The One-Repeat Rule",
    body: "Repeat one color from your top in an accessory below the waist for an effortlessly pulled-together outfit.",
    icon: "shirt-outline",
    category: "style",
  },
  {
    title: "Brow Framing",
    body: "Well-groomed brows tailored to your face shape can make as much impact as contouring — often more.",
    icon: "sparkles-outline",
    category: "beauty",
  },
  {
    title: "Layer Your Neutrals",
    body: "Mixing tones within your neutral family creates depth and texture without introducing clashing colors.",
    icon: "layers-outline",
    category: "style",
  },
  {
    title: "Hair Health First",
    body: "Before trying a new style, focus on your hair's condition. Healthy hair holds any style far better than styled-but-dry hair.",
    icon: "cut-outline",
    category: "hair",
  },
  {
    title: "The 3-Second Rule",
    body: "If a garment doesn't make you smile within 3 seconds of seeing it on you, it's not your piece. Trust your first instinct.",
    icon: "heart-outline",
    category: "style",
  },
];

export function getDailyTip(analysis: AnalysisResult | null): Tip {
  if (!analysis) {
    const dayIndex = new Date().getDay();
    return GENERIC_TIPS[dayIndex % GENERIC_TIPS.length];
  }

  const personalizedTips: Tip[] = [
    {
      title: `${analysis.style_archetype} Signature Move`,
      body: analysis.fashion_recommendations[0] ?? "Lean into your natural archetype with one intentional outfit choice today.",
      icon: "sparkles-outline",
      category: "style",
    },
    {
      title: "Your Color Advantage",
      body: `As someone with ${analysis.undertone.toLowerCase()} undertones, your palette's anchor colors work best near your face.`,
      icon: "color-palette-outline",
      category: "color",
    },
    {
      title: "Face Shape Styling",
      body: analysis.beauty_recommendations[0] ?? `Your ${analysis.face_shape.toLowerCase()} face shape has specific power moves — use them today.`,
      icon: "scan-outline",
      category: "beauty",
    },
    {
      title: "Today's Hair Idea",
      body: analysis.hairstyle_suggestions[0] ?? "A style that frames your face shape can elevate even a casual look.",
      icon: "cut-outline",
      category: "hair",
    },
  ];

  const allTips = [...personalizedTips, ...GENERIC_TIPS];
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return allTips[dayOfYear % allTips.length];
}
