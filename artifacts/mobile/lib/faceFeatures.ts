import type { AnalysisResult } from "@/context/AnalysisContext";
import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

export interface FeatureCard {
  id: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  title: string;
  bullets: string[];
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function faceShapeCard(analysis: AnalysisResult): FeatureCard {
  const shape = capitalize(analysis.face_shape);
  const shapeDescriptions: Record<string, string[]> = {
    Oval: [
      "Balanced proportions — the ideal canvas for most styles",
      "Gently wider at the cheekbones, tapering to the chin",
      "Virtually all frame and collar shapes are flattering",
    ],
    Round: [
      "Soft, curved contours with cheek width matching face length",
      "Angular cuts and V-necks create flattering elongation",
      "Structured frames and vertical styling add definition",
    ],
    Square: [
      "Strong, even jawline with defined angular proportions",
      "Soft, rounded styles balance the bold structure beautifully",
      "Oval or round frames complement the geometry",
    ],
    Heart: [
      "Wider forehead tapering to a delicate, narrow chin",
      "Styles that add width at the jaw create beautiful balance",
      "Bottom-heavy details and wide-set earrings are ideal",
    ],
    Diamond: [
      "Narrow forehead and chin with wide, prominent cheekbones",
      "Styles that broaden the forehead or soften the cheeks suit you",
      "Cat-eye and oval frames highlight your striking structure",
    ],
    Oblong: [
      "Longer face with fairly uniform width throughout",
      "Horizontal elements and width-adding styles are most flattering",
      "Wide frames and textured volume add beautiful balance",
    ],
  };
  const bullets =
    shapeDescriptions[shape] ??
    [
      `${shape} face shape with distinctive proportions`,
      "Frame choices that complement your natural geometry",
      "Styling techniques that enhance your unique structure",
    ];
  return { id: "face_shape", icon: "scan-outline", title: `${shape} Face`, bullets };
}

function eyeShapeCard(analysis: AnalysisResult): FeatureCard {
  const shape = analysis.eye_shape || "Defined";
  const bullets: string[] = [
    `${shape} eye shape with characteristic depth`,
    eyeLinerTip(shape),
    eyeShadowTip(shape),
  ];
  return { id: "eye_shape", icon: "eye-outline", title: `${shape} Eyes`, bullets };
}

function eyeLinerTip(shape: string): string {
  const lower = shape.toLowerCase();
  if (lower.includes("almond")) return "A thin wing liner extends the natural taper beautifully";
  if (lower.includes("round")) return "Elongated liner at outer corners creates elegant dimension";
  if (lower.includes("hooded")) return "Liner drawn above the crease lifts and opens the lid";
  if (lower.includes("monolid")) return "Graphic liner across the upper lid creates definition";
  if (lower.includes("upturned")) return "Lower lash liner balances the natural lift at the outer edge";
  if (lower.includes("downturned")) return "An uplifted outer wing creates a flattering lift effect";
  return "Liner along the upper lash line enhances natural depth";
}

function eyeShadowTip(shape: string): string {
  const lower = shape.toLowerCase();
  if (lower.includes("almond")) return "Versatile — virtually all eyeshadow placements are flattering";
  if (lower.includes("round")) return "Transition shades blended outward elongate the shape";
  if (lower.includes("hooded")) return "Matte transition shades on the brow bone create visible depth";
  if (lower.includes("monolid")) return "Shimmer on the centre lid and blended edges add dimension";
  if (lower.includes("upturned")) return "Darker outer-corner shading softens the natural upward angle";
  if (lower.includes("downturned")) return "Light shimmer at inner corners and mid-lid brightens beautifully";
  return "A soft gradient from lid to brow bone suits your shape";
}

function eyebrowCard(analysis: AnalysisResult): FeatureCard {
  const shape = analysis.eyebrow_shape || "Defined";
  const bullets: string[] = [
    `${shape} brow architecture that frames the face`,
    eyebrowFillTip(shape),
    eyebrowGroomTip(shape),
  ];
  return { id: "eyebrow_shape", icon: "remove-outline", title: `${shape} Brows`, bullets };
}

function eyebrowFillTip(shape: string): string {
  const lower = shape.toLowerCase();
  if (lower.includes("arched")) return "Fill with light, hair-like strokes to maintain the natural peak";
  if (lower.includes("straight")) return "Softly defined with minimal arch creates a clean, modern look";
  if (lower.includes("feathered")) return "Feather-fill technique mirrors the naturally textured structure";
  if (lower.includes("round")) return "A subtle high point adds gentle lift to the rounded form";
  if (lower.includes("angled")) return "Sharp-angle brows benefit from precision pencil definition";
  return "Hair-stroke filling preserves natural texture and depth";
}

function eyebrowGroomTip(shape: string): string {
  const lower = shape.toLowerCase();
  if (lower.includes("thick") || lower.includes("full")) return "Light grooming at the underside keeps the shape refined";
  if (lower.includes("sparse") || lower.includes("thin")) return "Tinted brow serum adds density while looking effortlessly natural";
  if (lower.includes("feathered")) return "Spoolie brushing upward enhances the airy, feathered texture";
  return "Regular shaping preserves the brow's natural eloquence";
}

function noseCard(analysis: AnalysisResult): FeatureCard {
  const shape = analysis.nose_shape || "Refined";
  const bullets: string[] = [
    `${shape} nose shape with refined proportions`,
    noseContourTip(shape),
    "Contouring can enhance or soften — match intensity to occasion",
  ];
  return { id: "nose_shape", icon: "navigate-outline", title: `${shape} Nose`, bullets };
}

function noseContourTip(shape: string): string {
  const lower = shape.toLowerCase();
  if (lower.includes("button") || lower.includes("round")) return "Subtle highlighter on the bridge elongates elegantly";
  if (lower.includes("straight") || lower.includes("refined")) return "A fine highlight stripe down the bridge enhances definition";
  if (lower.includes("aquiline") || lower.includes("roman")) return "Soft blending along the bridge softens the distinguished slope";
  if (lower.includes("broad") || lower.includes("wide")) return "Soft shadow at the sides with bridge highlight narrows beautifully";
  if (lower.includes("narrow")) return "Highlight slightly widened toward the nostrils adds balance";
  return "A fine highlighter down the bridge refines the silhouette";
}

function cheeksCard(analysis: AnalysisResult): FeatureCard {
  const jawline = analysis.jawline_definition ?? "medium";
  const cheekbones = analysis.cheekbone_prominence ?? "medium";

  const cheekMap: Record<string, string> = {
    high: "High, sculpted cheekbones create natural shadow and dimension",
    medium: "Well-proportioned cheekbones in balanced harmony",
    low: "Softly set cheekbones lend a gentle, approachable elegance",
  };
  const jawMap: Record<string, string> = {
    sharp: "A defined jawline adds striking structure and edge",
    medium: "A balanced jawline with natural, refined definition",
    soft: "A softly curved jaw creates feminine, delicate proportions",
  };

  const bullets = [
    cheekMap[cheekbones] ?? `${capitalize(cheekbones)} cheekbone prominence`,
    jawMap[jawline] ?? `${capitalize(jawline)} jawline definition`,
    blushTip(cheekbones, jawline),
  ];
  return { id: "cheeks", icon: "diamond-outline", title: "Cheeks & Jaw", bullets };
}

function blushTip(cheekbones: string, jawline: string): string {
  if (cheekbones === "high") return "Drape blush just below the cheekbone peak for sculpted glamour";
  if (cheekbones === "low" && jawline === "soft") return "Rounded blush placement on the apple of the cheeks is most flattering";
  if (jawline === "sharp") return "Soft, diffused blush above the cheekbone balances the strong jaw";
  return "Blush swept lightly from the cheekbone toward the temples lifts beautifully";
}

function lipsCard(analysis: AnalysisResult): FeatureCard {
  const shape = analysis.lip_shape || "Full";
  const bullets: string[] = [
    `${shape} lip shape with distinctive character`,
    lipLinerTip(shape),
    lipColorTip(analysis.undertone),
  ];
  return { id: "lip_shape", icon: "happy-outline", title: `${shape} Lips`, bullets };
}

function lipLinerTip(shape: string): string {
  const lower = shape.toLowerCase();
  if (lower.includes("full")) return "Natural liner along the natural edge; no need to overline";
  if (lower.includes("thin") || lower.includes("small")) return "Overlining just outside the natural border adds beautiful volume";
  if (lower.includes("bow") || lower.includes("cupid")) return "Emphasise the cupid's bow peak for a romantic, defined look";
  if (lower.includes("wide")) return "Liner slightly inside the corners subtly rebalances proportion";
  if (lower.includes("asymm")) return "Liner matched to the fuller side creates beautiful symmetry";
  return "Precisely lined lips bring out the shape's natural elegance";
}

function lipColorTip(undertone?: string): string {
  if (undertone === "warm") return "Terracottas, peachy nudes, and warm reds are your most flattering shades";
  if (undertone === "cool") return "Berry, mauve, and blue-based reds complement your cool undertone";
  return "Neutral nudes and classic roses flatter your balanced undertone";
}

export function buildFaceFeatureCards(analysis: AnalysisResult): FeatureCard[] {
  return [
    faceShapeCard(analysis),
    eyeShapeCard(analysis),
    eyebrowCard(analysis),
    noseCard(analysis),
    cheeksCard(analysis),
    lipsCard(analysis),
  ];
}

export function getHarmonyLabel(score?: number): string {
  if (score === undefined) return "Balanced";
  if (score >= 0.85) return "Highly Balanced";
  if (score >= 0.7) return "Balanced";
  return "Softly Asymmetric";
}

export function getFeatureBalanceStyle(styleArchetype?: string): string {
  if (!styleArchetype) return "Harmonious";
  const lower = styleArchetype.toLowerCase();
  if (lower.includes("classic") || lower.includes("elegant")) return "Classically Proportioned";
  if (lower.includes("romantic") || lower.includes("soft")) return "Softly Harmonious";
  if (lower.includes("modern") || lower.includes("minimal")) return "Clean & Symmetrical";
  if (lower.includes("editorial") || lower.includes("bold") || lower.includes("edgy")) return "Striking & Dimensional";
  if (lower.includes("natural") || lower.includes("bohemian")) return "Naturally Balanced";
  if (lower.includes("dramatic")) return "Powerfully Defined";
  return "Elegantly Proportioned";
}
