export type WellnessCategory = "Skin" | "Nutrition" | "Fitness" | "Mind";

export interface WellnessProduct {
  name: string;
  url: string;
  retailer: "Sephora" | "Amazon" | "iHerb";
  price: string;
}

export interface WellnessVideo {
  title: string;
  channel: string;
  url: string;
  thumbnailGradient: [string, string];
}

export interface WellnessArticle {
  id: string;
  category: WellnessCategory;
  title: string;
  teaser: string;
  readingMins: number;
  intro: string;
  tips: string[];
  products: WellnessProduct[];
  videos: WellnessVideo[];
  skinConcernTags: string[];
  gradientColors: [string, string];
  icon: string;
}

export const WELLNESS_ARTICLES: WellnessArticle[] = [
  // ── SKIN ────────────────────────────────────────────────────────────────────
  {
    id: "skin-1",
    category: "Skin",
    title: "The Art of Double Cleansing",
    teaser: "The two-step ritual Korean beauty swears by — dissolve, then purify for truly clear skin.",
    readingMins: 5,
    intro:
      "Double cleansing is the cornerstone of K-beauty for good reason: it removes makeup, SPF, and excess sebum with an oil-based cleanser first, then uses a water-based formula to sweep away sweat and residue. The result? A thoroughly clean canvas that lets every serum and moisturizer absorb fully instead of sitting on a barrier of grime.",
    tips: [
      "Start with a cleansing oil, balm, or micellar oil — massage gently for 60 seconds on dry skin to emulsify makeup and SPF.",
      "Add a few drops of water to your oily hands and massage again — watch as the formula turns milky and lifts everything off.",
      "Rinse thoroughly, then follow immediately with a gentle water-based foam or gel cleanser.",
      "Keep your water lukewarm — hot water strips the skin barrier and cool water won't open pores effectively.",
      "Limit double cleansing to your evening routine; a gentle rinse or single cleanse is sufficient in the morning.",
      "Pat dry with a clean microfibre cloth rather than rubbing — friction causes micro-tears in delicate skin.",
    ],
    products: [
      { name: "DHC Deep Cleansing Oil", url: "https://www.amazon.com/s?k=DHC+deep+cleansing+oil", retailer: "Amazon", price: "from $12" },
      { name: "Gentle Foaming Cleanser", url: "https://www.sephora.com/search?keyword=gentle+foaming+cleanser", retailer: "Sephora", price: "from $18" },
      { name: "Micellar Cleansing Water", url: "https://www.iherb.com/search/?kw=micellar+cleansing+water", retailer: "iHerb", price: "from $8" },
    ],
    videos: [
      { title: "How to Double Cleanse Correctly", channel: "Hyram", url: "https://www.youtube.com/results?search_query=how+to+double+cleanse+correctly", thumbnailGradient: ["#FDECD3", "#F5D5B0"] },
      { title: "K-Beauty Double Cleansing Routine", channel: "Beauty Within", url: "https://www.youtube.com/results?search_query=k-beauty+double+cleansing+routine", thumbnailGradient: ["#F5EDE3", "#EDE3D9"] },
    ],
    skinConcernTags: ["acne", "dryness"],
    gradientColors: ["#FDECD3", "#F5D5B0"],
    icon: "water-outline",
  },
  {
    id: "skin-2",
    category: "Skin",
    title: "Vitamin C: Your Brightening Ally",
    teaser: "Fade dark spots, boost collagen, and wake up with a lit-from-within glow — here's how.",
    readingMins: 4,
    intro:
      "Vitamin C is one of the most evidence-backed ingredients in skincare. As a potent antioxidant it neutralises free radicals from UV and pollution, stimulates collagen synthesis, and inhibits the melanin pathways that create dark spots. Paired with SPF it forms your most powerful daytime defence.",
    tips: [
      "Apply vitamin C on thoroughly dry skin — residual water dilutes the formula and reduces efficacy.",
      "Start with a low concentration (5-10%) if you're a beginner; build to 15-20% over 4-6 weeks.",
      "Oxidised (orange or brown) vitamin C serum has lost its potency — store bottles upright in a cool, dark place.",
      "Layer SPF after vitamin C every single morning — they work in synergy, not competition.",
      "If you experience tingling, try a vitamin C derivative like sodium ascorbyl phosphate, which is gentler.",
      "Pair with vitamin E and ferulic acid for dramatically enhanced stability and antioxidant power.",
    ],
    products: [
      { name: "Vitamin C 15% Serum", url: "https://www.sephora.com/search?keyword=vitamin+c+brightening+serum+15", retailer: "Sephora", price: "from $26" },
      { name: "L-Ascorbic Acid Powder", url: "https://www.iherb.com/search/?kw=l-ascorbic+acid+powder+skincare", retailer: "iHerb", price: "from $14" },
      { name: "Vitamin C + E + Ferulic Serum", url: "https://www.amazon.com/s?k=vitamin+c+e+ferulic+acid+serum", retailer: "Amazon", price: "from $22" },
    ],
    videos: [
      { title: "The Best Vitamin C Serums Ranked", channel: "Doctorly", url: "https://www.youtube.com/results?search_query=best+vitamin+c+serums+dermatologist+ranked", thumbnailGradient: ["#F5F0D9", "#EADCB8"] },
      { title: "How to Use Vitamin C in Your Routine", channel: "Dr. Dray", url: "https://www.youtube.com/results?search_query=how+to+use+vitamin+c+serum+skincare+routine", thumbnailGradient: ["#FDECD3", "#F5D5B0"] },
    ],
    skinConcernTags: ["redness", "acne", "warm"],
    gradientColors: ["#FFF3E0", "#FFE0B2"],
    icon: "sunny-outline",
  },
  {
    id: "skin-3",
    category: "Skin",
    title: "Gua Sha: Ancient Face Sculpting",
    teaser: "Five minutes a day with this jade tool can lift, depuff, and sculpt your face.",
    readingMins: 6,
    intro:
      "Gua sha is a Traditional Chinese Medicine technique adapted for the face. By gliding a smooth stone across the skin with gentle pressure you stimulate lymphatic drainage, increase microcirculation, and release facial fascia tension — the cumulative effect is a more lifted, less puffy, and visibly radiant complexion.",
    tips: [
      "Always apply a facial oil or serum before using gua sha — the tool must glide without friction to avoid broken capillaries.",
      "Work in upward and outward strokes away from the centre of your face, always finishing at the lymph nodes near your ears and neck.",
      "Hold the tool at a 15-degree angle flush to the skin for maximum surface contact.",
      "Use gentle pressure on the décolletage and neck; slightly firmer strokes are fine on the jawline and cheeks.",
      "Do your gua sha routine in the morning to depuff overnight fluid retention before heading out.",
      "Clean your stone with mild soap and cool water after each use to prevent bacteria build-up.",
    ],
    products: [
      { name: "Rose Quartz Gua Sha Stone", url: "https://www.amazon.com/s?k=rose+quartz+gua+sha+facial+tool", retailer: "Amazon", price: "from $14" },
      { name: "Facial Dry Oil Serum", url: "https://www.sephora.com/search?keyword=facial+dry+oil+serum+massage", retailer: "Sephora", price: "from $32" },
      { name: "Jade Roller & Gua Sha Set", url: "https://www.iherb.com/search/?kw=jade+roller+gua+sha+set", retailer: "iHerb", price: "from $18" },
    ],
    videos: [
      { title: "Gua Sha Tutorial for Beginners", channel: "Stephanie Lange", url: "https://www.youtube.com/results?search_query=gua+sha+tutorial+beginners+face+lift", thumbnailGradient: ["#F0E4F5", "#DFC8EF"] },
      { title: "Daily 5-Minute Gua Sha Ritual", channel: "Mount Lai", url: "https://www.youtube.com/results?search_query=5+minute+daily+gua+sha+routine", thumbnailGradient: ["#FDECD3", "#F5D5B0"] },
    ],
    skinConcernTags: ["redness", "dryness", "cool"],
    gradientColors: ["#F0E4F5", "#DFC8EF"],
    icon: "sparkles-outline",
  },
  {
    id: "skin-4",
    category: "Skin",
    title: "The Retinol Beginner's Guide",
    teaser: "The gold-standard anti-ageing ingredient — but only if you use it correctly.",
    readingMins: 7,
    intro:
      "Retinol (vitamin A) is arguably the most clinically proven ingredient for stimulating cell turnover, building collagen, and smoothing fine lines. But its potency is also why so many people give up: starting too fast leads to the dreaded 'retinol purge' of dryness, peeling, and redness. Go slow and your skin will thank you for decades.",
    tips: [
      "Start with the lowest available concentration (0.025%-0.05%) once a week for the first month.",
      "Try the 'sandwich' method: moisturiser → retinol → moisturiser, to buffer initial sensitivity.",
      "Apply strictly at night — retinol degrades in sunlight and makes your skin more photosensitive.",
      "Always follow with SPF30+ every single morning; this is non-negotiable with retinol use.",
      "Avoid mixing retinol with AHAs, BHAs, or benzoyl peroxide in the same routine to prevent over-exfoliation.",
      "The 'purge' phase (small breakouts, flaking) is temporary and normal — push through for 6-8 weeks to see results.",
    ],
    products: [
      { name: "Retinol 0.3% Serum", url: "https://www.sephora.com/search?keyword=retinol+0.3+serum+beginners", retailer: "Sephora", price: "from $29" },
      { name: "Ceramide Barrier Repair Cream", url: "https://www.amazon.com/s?k=ceramide+barrier+repair+cream", retailer: "Amazon", price: "from $16" },
      { name: "Mineral SPF50 Sunscreen", url: "https://www.iherb.com/search/?kw=mineral+spf+50+sunscreen+sensitive", retailer: "iHerb", price: "from $20" },
    ],
    videos: [
      { title: "Retinol 101: Everything You Need to Know", channel: "Dr. Sam Bunting", url: "https://www.youtube.com/results?search_query=retinol+101+beginners+guide+dermatologist", thumbnailGradient: ["#D9EEF5", "#B8DCEA"] },
      { title: "How to Introduce Retinol Without Irritation", channel: "Skincare by Hyram", url: "https://www.youtube.com/results?search_query=how+to+start+retinol+without+irritation", thumbnailGradient: ["#D9F5E4", "#B8EAD0"] },
    ],
    skinConcernTags: ["acne", "redness", "dryness"],
    gradientColors: ["#D9EEF5", "#B8DCEA"],
    icon: "medical-outline",
  },

  // ── NUTRITION ───────────────────────────────────────────────────────────────
  {
    id: "nutrition-1",
    category: "Nutrition",
    title: "Anti-Inflammatory Smoothies for Glowing Skin",
    teaser: "Blend your way to clearer skin — these recipes target inflammation from the inside out.",
    readingMins: 4,
    intro:
      "Chronic low-grade inflammation is a hidden driver of acne, redness, and premature ageing. Certain whole foods are nature's most powerful anti-inflammatory tools — loaded with polyphenols, omega-3s, and antioxidants that calm the immune cascade causing skin flares. Here are the building blocks for a daily glow smoothie.",
    tips: [
      "Add 1/4 tsp of ground turmeric with a pinch of black pepper (piperine boosts curcumin absorption by 2000%).",
      "Use frozen mango or pineapple as your sweetener base — both contain natural enzymes that aid digestion.",
      "Blend in a tablespoon of ground flaxseed for plant-based omega-3 fatty acids that calm inflammatory pathways.",
      "Add a handful of spinach — you won't taste it but you'll get iron, folate, and vitamin K in every sip.",
      "Swap dairy milk for oat or almond milk to reduce hormonal triggers if you're acne-prone.",
      "Add one Brazil nut for your full daily selenium — a key antioxidant mineral for skin repair.",
    ],
    products: [
      { name: "Organic Turmeric Curcumin Capsules", url: "https://www.iherb.com/search/?kw=organic+turmeric+curcumin+capsules", retailer: "iHerb", price: "from $14" },
      { name: "Collagen Peptides Powder (Unflavored)", url: "https://www.amazon.com/s?k=grass+fed+collagen+peptides+unflavored", retailer: "Amazon", price: "from $22" },
      { name: "Organic Ground Flaxseed", url: "https://www.iherb.com/search/?kw=organic+ground+flaxseed", retailer: "iHerb", price: "from $8" },
    ],
    videos: [
      { title: "5 Anti-Inflammatory Smoothies for Clear Skin", channel: "Pick Up Limes", url: "https://www.youtube.com/results?search_query=anti+inflammatory+smoothies+clear+skin", thumbnailGradient: ["#D9F5E4", "#B8EAD0"] },
      { title: "What I Drink for Glowing Skin", channel: "Sadia Badiei", url: "https://www.youtube.com/results?search_query=drinks+for+glowing+skin+clear+complexion", thumbnailGradient: ["#F5F0D9", "#EADCB8"] },
    ],
    skinConcernTags: ["acne", "redness"],
    gradientColors: ["#D9F5E4", "#B8EAD0"],
    icon: "nutrition-outline",
  },
  {
    id: "nutrition-2",
    category: "Nutrition",
    title: "Collagen-Boosting Foods",
    teaser: "Your diet is your best collagen supplement — eat these foods for firmer, plumper skin.",
    readingMins: 5,
    intro:
      "After your mid-20s, collagen production declines by roughly 1% per year. While topical retinoids help stimulate it, the most efficient route is nutritional — giving your body the raw amino acids and co-factors it needs to synthesise collagen internally. No supplement required.",
    tips: [
      "Vitamin C is the essential co-enzyme for collagen synthesis — citrus, kiwi, bell peppers, and broccoli are your best sources.",
      "Bone broth is rich in glycine, proline, and hydroxyproline — the building blocks of collagen fibres.",
      "Eggs provide the lysine and proline your body needs; the yolk also supplies biotin for hair strength.",
      "Copper from shellfish, nuts, and seeds activates the enzyme lysyl oxidase that cross-links collagen for structural strength.",
      "Avoid excess sugar and refined carbs — a process called glycation causes collagen fibres to become stiff and brittle.",
      "Collagen peptide supplements show modest but real benefits in double-blind studies; take 5-10g daily in your morning drink.",
    ],
    products: [
      { name: "Vital Proteins Collagen Peptides", url: "https://www.amazon.com/s?k=vital+proteins+collagen+peptides", retailer: "Amazon", price: "from $24" },
      { name: "Organic Bone Broth Powder", url: "https://www.iherb.com/search/?kw=organic+bone+broth+powder+collagen", retailer: "iHerb", price: "from $18" },
      { name: "Vitamin C Gummies 1000mg", url: "https://www.amazon.com/s?k=vitamin+c+gummies+1000mg", retailer: "Amazon", price: "from $12" },
    ],
    videos: [
      { title: "Best Foods to Boost Collagen Naturally", channel: "Doctor Mike Hansen", url: "https://www.youtube.com/results?search_query=foods+that+boost+collagen+production+naturally", thumbnailGradient: ["#FDECD3", "#F5D5B0"] },
      { title: "Collagen Rich Meal Prep for Skin Health", channel: "Pick Up Limes", url: "https://www.youtube.com/results?search_query=collagen+meal+prep+skin+health", thumbnailGradient: ["#F5EDE3", "#EDE3D9"] },
    ],
    skinConcernTags: ["dryness", "warm", "cool"],
    gradientColors: ["#F5EDE3", "#EDE3D9"],
    icon: "leaf-outline",
  },
  {
    id: "nutrition-3",
    category: "Nutrition",
    title: "The Gut-Skin Connection",
    teaser: "Your microbiome is talking to your skin. Learn to listen — and eat — accordingly.",
    readingMins: 6,
    intro:
      "The gut-skin axis is one of the most exciting areas of dermatology research: a disrupted gut microbiome creates systemic inflammation that manifests visibly on skin. Acne, rosacea, eczema, and psoriasis all have documented links to gut dysbiosis. Healing your gut can transform your complexion.",
    tips: [
      "Eat at least 30 different plant foods per week — diversity of plants equals diversity of beneficial bacteria.",
      "Add fermented foods daily: kefir, kimchi, sauerkraut, miso, and tempeh are all rich in live cultures.",
      "Limit emulsifiers found in processed foods (polysorbate 80, carrageenan) — they disrupt the gut mucosal lining.",
      "Prebiotic fibre from garlic, onions, asparagus, and green bananas feeds your existing beneficial bacteria.",
      "Reduce alcohol consumption; even moderate intake disrupts tight junctions in the gut lining (leaky gut).",
      "A targeted probiotic supplement with Lactobacillus acidophilus and Bifidobacterium longum has the strongest skin evidence.",
    ],
    products: [
      { name: "Multi-Strain Probiotic 50 Billion CFU", url: "https://www.iherb.com/search/?kw=multi+strain+probiotic+50+billion", retailer: "iHerb", price: "from $22" },
      { name: "Organic Prebiotic Fibre Blend", url: "https://www.amazon.com/s?k=organic+prebiotic+fibre+supplement", retailer: "Amazon", price: "from $18" },
      { name: "Fermented Skincare Essence", url: "https://www.sephora.com/search?keyword=fermented+skincare+essence", retailer: "Sephora", price: "from $34" },
    ],
    videos: [
      { title: "Gut Health & Skin Connection Explained", channel: "Dr. Steven Gundry", url: "https://www.youtube.com/results?search_query=gut+skin+connection+microbiome+acne", thumbnailGradient: ["#D9F5E4", "#B8EAD0"] },
      { title: "What I Eat for Clear Skin & Gut Health", channel: "Abbey Sharp", url: "https://www.youtube.com/results?search_query=what+i+eat+clear+skin+gut+health+dietitian", thumbnailGradient: ["#F5F0D9", "#EADCB8"] },
    ],
    skinConcernTags: ["acne", "redness", "dryness"],
    gradientColors: ["#E8F5E9", "#C8E6C9"],
    icon: "flask-outline",
  },
  {
    id: "nutrition-4",
    category: "Nutrition",
    title: "Skin-Nourishing Teas",
    teaser: "Steep your way to radiance — teas that target inflammation, hormones, and hydration.",
    readingMins: 4,
    intro:
      "Tea is the world's most consumed beverage for good reason — beyond ritual comfort, certain teas deliver targeted phytochemicals that directly benefit skin. From the EGCG in green tea to the phytoestrogenic compounds in spearmint, your daily cup can be a powerful skincare tool.",
    tips: [
      "Green tea contains EGCG (epigallocatechin gallate) — one of the most potent antioxidants studied for UV protection and acne.",
      "Spearmint tea (2 cups daily) has been shown in clinical trials to reduce hormonal acne by lowering androgen levels.",
      "Rosehip tea is naturally high in vitamin C and provides natural retinoids from the seeds — brew for 5-7 minutes.",
      "Rooibos is caffeine-free, rich in zinc, and has alpha-hydroxy acids that promote cell turnover.",
      "Brew green tea at 75-80°C (not boiling) to preserve EGCG — boiling water destroys up to 30% of the catechins.",
      "Drink your tea without added sugar; sugar triggers insulin spikes that stimulate sebum overproduction.",
    ],
    products: [
      { name: "Organic Ceremonial Matcha Powder", url: "https://www.iherb.com/search/?kw=organic+ceremonial+matcha+powder", retailer: "iHerb", price: "from $18" },
      { name: "Rosehip Tea Bags", url: "https://www.amazon.com/s?k=rosehip+tea+bags+organic", retailer: "Amazon", price: "from $9" },
      { name: "Spearmint Leaf Tea", url: "https://www.iherb.com/search/?kw=spearmint+tea+bags+organic", retailer: "iHerb", price: "from $7" },
    ],
    videos: [
      { title: "Best Teas for Clear Skin & Glow", channel: "Shawn Stevenson", url: "https://www.youtube.com/results?search_query=best+teas+for+clear+skin+acne+glow", thumbnailGradient: ["#E8F5E9", "#C8E6C9"] },
      { title: "How to Make Matcha for Skin Benefits", channel: "Enzo Morabito", url: "https://www.youtube.com/results?search_query=matcha+preparation+skin+benefits+recipe", thumbnailGradient: ["#D9F5E4", "#B8EAD0"] },
    ],
    skinConcernTags: ["acne", "redness", "warm"],
    gradientColors: ["#D9F5E4", "#A5D6A7"],
    icon: "cafe-outline",
  },

  // ── FITNESS ─────────────────────────────────────────────────────────────────
  {
    id: "fitness-1",
    category: "Fitness",
    title: "Yoga for Lymphatic Drainage",
    teaser: "Certain poses supercharge your lymphatic system to detoxify and depuff from head to toe.",
    readingMins: 8,
    intro:
      "Unlike the cardiovascular system, the lymphatic system has no pump — it relies entirely on movement, breath, and gravity to circulate. When lymph stagnates, toxins accumulate and the immune system becomes sluggish, showing up as persistent puffiness, dull skin, and frequent breakouts. Targeted yoga poses activate this system powerfully.",
    tips: [
      "Legs-Up-The-Wall (Viparita Karani): 10 minutes drains lymph from your lower body and depuffs ankles and calves.",
      "Twisting poses (Revolved Crescent, Seated Twist) compress the abdominal lymph nodes and stimulate the spleen — your body's largest lymph filter.",
      "Deep diaphragmatic breathing (belly breathing) pumps the thoracic duct, the lymphatic system's main highway.",
      "Cat-Cow flows synchronised with breath create rhythmic compression in the abdominal region for lymph movement.",
      "Downward Facing Dog and inversions encourage lymph to flow toward the larger nodes at your collar bones.",
      "Practice on an empty or light stomach — a full belly makes inversions uncomfortable and compresses the digestive lymph nodes.",
    ],
    products: [
      { name: "Non-Slip Yoga Mat 6mm", url: "https://www.amazon.com/s?k=non+slip+yoga+mat+6mm+thick", retailer: "Amazon", price: "from $28" },
      { name: "Lymphatic Support Supplement", url: "https://www.iherb.com/search/?kw=lymphatic+support+supplement+herbal", retailer: "iHerb", price: "from $16" },
      { name: "Yoga Bolster Cushion", url: "https://www.amazon.com/s?k=yoga+bolster+cushion+restorative", retailer: "Amazon", price: "from $35" },
    ],
    videos: [
      { title: "Lymphatic Drainage Yoga Flow (20 min)", channel: "Yoga with Adriene", url: "https://www.youtube.com/results?search_query=lymphatic+drainage+yoga+flow+adriene", thumbnailGradient: ["#F0E4F5", "#DFC8EF"] },
      { title: "Detox Yoga for Glowing Skin", channel: "SaraBethYoga", url: "https://www.youtube.com/results?search_query=detox+yoga+for+glowing+skin", thumbnailGradient: ["#E8EAF6", "#C5CAE9"] },
    ],
    skinConcernTags: ["redness", "acne", "dryness"],
    gradientColors: ["#F0E4F5", "#DFC8EF"],
    icon: "body-outline",
  },
  {
    id: "fitness-2",
    category: "Fitness",
    title: "Dry Brushing: A Full-Body Ritual",
    teaser: "Two minutes before your shower to brighter skin, reduced cellulite, and better circulation.",
    readingMins: 5,
    intro:
      "Dry brushing is a form of mechanical exfoliation that removes dead skin cells, stimulates lymphatic circulation, and increases blood flow — all before you've stepped into the shower. With consistency, it dramatically improves skin texture, reduces the appearance of cellulite, and gives an all-over glow that no body lotion can replicate alone.",
    tips: [
      "Always brush on completely dry skin before bathing — never on wet skin, which is more fragile and prone to micro-tears.",
      "Use long, sweeping strokes toward your heart: start at the feet and work up the legs, arms toward the shoulders.",
      "Apply lighter, circular motions on the abdomen and chest, and skip the face entirely (use a dedicated facial brush).",
      "The sensation should be invigorating, never painful — ease off pressure if you see redness beyond a healthy flush.",
      "Follow immediately with a moisturising shower and then a body oil or lotion on damp skin for maximum absorption.",
      "Clean your brush monthly with mild shampoo and allow to dry completely to prevent bacterial growth.",
    ],
    products: [
      { name: "Natural Sisal Body Brush", url: "https://www.amazon.com/s?k=natural+sisal+dry+body+brush+long+handle", retailer: "Amazon", price: "from $12" },
      { name: "Dry Brushing & Body Oil Set", url: "https://www.sephora.com/search?keyword=dry+brushing+body+oil+exfoliation+set", retailer: "Sephora", price: "from $38" },
      { name: "Jojoba Body Oil", url: "https://www.iherb.com/search/?kw=jojoba+oil+body+moisturiser", retailer: "iHerb", price: "from $14" },
    ],
    videos: [
      { title: "How to Dry Brush Your Body (Step by Step)", channel: "Wellness Mama", url: "https://www.youtube.com/results?search_query=how+to+dry+brush+body+correctly+step+by+step", thumbnailGradient: ["#FDECD3", "#F5D5B0"] },
      { title: "Dry Brushing Before & After — Honest Review", channel: "Teri Hofford", url: "https://www.youtube.com/results?search_query=dry+brushing+before+after+honest+review", thumbnailGradient: ["#F5EDE3", "#EDE3D9"] },
    ],
    skinConcernTags: ["dryness", "warm"],
    gradientColors: ["#FFF8E1", "#FFE082"],
    icon: "leaf-outline",
  },
  {
    id: "fitness-3",
    category: "Fitness",
    title: "Face Yoga for Lifted Features",
    teaser: "Daily facial exercises that tone the 57 muscles of your face — naturally and for free.",
    readingMins: 6,
    intro:
      "Just as body muscles atrophy without use, the 57 muscles of the face weaken with age — contributing to sagging, hollowing, and loss of definition. Face yoga uses targeted resistance exercises to rebuild muscle volume, improve circulation, and firm connective tissue, with studies showing measurable improvements in as little as 20 weeks.",
    tips: [
      "The Cheekbone Lift: place your fingertips on the tops of your cheekbones, smile wide, and hold for 30 seconds — builds the zygomaticus major.",
      "The Eye Firmer: place index fingers on your brow bones, eyes wide open, look up while pulling the brow down gently — hold 10 seconds, repeat 5x.",
      "The Jawline Definer: tilt your head back, push your lower jaw forward, hold for 10 seconds, return and repeat 8-10 times.",
      "The Neck Smoother: tilt your head back, press your tongue to the roof of your mouth, and swallow — hold each swallow for 3 seconds.",
      "Always warm up your face with gentle circular massage before exercising to increase blood flow and prevent strain.",
      "Consistency is everything: 15 minutes daily for 8 weeks produces more visible results than 2 hours once a week.",
    ],
    products: [
      { name: "Facial Roller Ice Globes", url: "https://www.amazon.com/s?k=facial+roller+ice+globes+face+lifting", retailer: "Amazon", price: "from $22" },
      { name: "Face Yoga Method Book", url: "https://www.amazon.com/s?k=face+yoga+method+book+fumiko+takatsu", retailer: "Amazon", price: "from $15" },
      { name: "Firming Face Serum for Exercises", url: "https://www.sephora.com/search?keyword=firming+face+serum+lifting", retailer: "Sephora", price: "from $44" },
    ],
    videos: [
      { title: "Face Yoga Daily Routine (10 min)", channel: "Fumiko Takatsu", url: "https://www.youtube.com/results?search_query=face+yoga+daily+routine+10+minutes+fumiko", thumbnailGradient: ["#F0E4F5", "#DFC8EF"] },
      { title: "Face Exercises for a Lifted Jawline", channel: "Koko Hayashi", url: "https://www.youtube.com/results?search_query=face+exercises+lifted+jawline+koko+hayashi", thumbnailGradient: ["#E8EAF6", "#C5CAE9"] },
    ],
    skinConcernTags: ["cool", "neutral"],
    gradientColors: ["#EDE7F6", "#D1C4E9"],
    icon: "happy-outline",
  },
  {
    id: "fitness-4",
    category: "Fitness",
    title: "Lymphatic Facial Massage at Home",
    teaser: "A 5-minute daily ritual to sculpt, depuff, and bring luminosity back to tired skin.",
    readingMins: 5,
    intro:
      "A professional lymphatic facial massage at a spa costs upwards of $150 — but with the right technique and a few minutes a day, you can achieve genuinely similar results at home. The key is ultra-light pressure (less than the weight of a coin) and precise drainage pathways toward the lymph nodes at your neck.",
    tips: [
      "Apply a few drops of facial oil before you start — the technique demands frictionless gliding across the skin.",
      "Begin at the neck: 10 gentle downward strokes toward the collarbone nodes, which empties the lymph 'drain' before you add more.",
      "Work the under-eye area with the lightest touch imaginable (ring finger only) — drag toward the ear, then down the neck.",
      "Knuckle massage along the jawline with a gentle press-and-drag motion toward the ear drains the submandibular nodes.",
      "Finish with five full 'draining' strokes from your temples, sweeping down the sides of your face, neck, and toward your collarbone.",
      "Doing this massage every morning for two weeks will noticeably reduce chronic puffiness and improve skin clarity.",
    ],
    products: [
      { name: "Facial Massage Tool Sculptor", url: "https://www.sephora.com/search?keyword=facial+massage+tool+depuff+sculptor", retailer: "Sephora", price: "from $48" },
      { name: "Squalane Facial Oil", url: "https://www.amazon.com/s?k=squalane+facial+oil+biossance", retailer: "Amazon", price: "from $20" },
      { name: "Rosehip Seed Oil 100% Pure", url: "https://www.iherb.com/search/?kw=rosehip+seed+oil+pure+organic", retailer: "iHerb", price: "from $12" },
    ],
    videos: [
      { title: "Lymphatic Facial Massage Tutorial", channel: "Georgia Louise Skincare", url: "https://www.youtube.com/results?search_query=lymphatic+facial+massage+tutorial+at+home", thumbnailGradient: ["#FDECD3", "#F5D5B0"] },
      { title: "Daily Face Massage Routine for Glow", channel: "Sarah Chapman London", url: "https://www.youtube.com/results?search_query=daily+facial+massage+routine+glow+lymphatic", thumbnailGradient: ["#F5EDE3", "#EDE3D9"] },
    ],
    skinConcernTags: ["redness", "dryness", "cool"],
    gradientColors: ["#FCE4EC", "#F8BBD9"],
    icon: "hand-right-outline",
  },

  // ── MIND ─────────────────────────────────────────────────────────────────────
  {
    id: "mind-1",
    category: "Mind",
    title: "Adaptogen Lattes for Stress Skin",
    teaser: "Cortisol is your skin's worst enemy. These warming drinks fight back from the inside.",
    readingMins: 5,
    intro:
      "When cortisol spikes — from work deadlines, poor sleep, or emotional stress — it triggers a cascade of skin disasters: increased sebum production, broken-down collagen, impaired barrier function, and inflammatory flares. Adaptogens are plants that modulate the stress response at the HPA axis level, making them uniquely powerful for stress-related skin conditions.",
    tips: [
      "Ashwagandha (300-600mg daily) has the most clinical evidence for reducing cortisol levels — blend into warm oat milk.",
      "Reishi mushroom supports immune regulation and reduces stress-induced inflammation; it has a mild, earthy flavour.",
      "Maca root improves energy and mood without caffeine spikes; use 1 tsp in a matcha or golden milk latte.",
      "Avoid taking adaptogens late in the evening — many have an energising effect that can disrupt sleep quality.",
      "Cycle your adaptogens: 6-8 weeks on, 2 weeks off prevents receptor downregulation and maintains efficacy.",
      "Combine your adaptogen latte with 5 minutes of box breathing (4-4-4-4) for synergistic cortisol reduction.",
    ],
    products: [
      { name: "Organic Ashwagandha KSM-66 Extract", url: "https://www.iherb.com/search/?kw=ashwagandha+ksm-66+extract+organic", retailer: "iHerb", price: "from $16" },
      { name: "Four Sigmatic Reishi Mushroom Elixir", url: "https://www.amazon.com/s?k=four+sigmatic+reishi+mushroom+elixir", retailer: "Amazon", price: "from $24" },
      { name: "Maca Root Powder Organic", url: "https://www.iherb.com/search/?kw=maca+root+powder+organic+raw", retailer: "iHerb", price: "from $12" },
    ],
    videos: [
      { title: "Adaptogen Lattes for Stress & Skin", channel: "Pick Up Limes", url: "https://www.youtube.com/results?search_query=adaptogen+latte+recipes+stress+cortisol+skin", thumbnailGradient: ["#D9EEF5", "#B8DCEA"] },
      { title: "How Adaptogens Changed My Skin", channel: "Courtney Swan", url: "https://www.youtube.com/results?search_query=how+adaptogens+cleared+my+skin+acne+stress", thumbnailGradient: ["#E8EAF6", "#C5CAE9"] },
    ],
    skinConcernTags: ["acne", "redness", "warm", "cool"],
    gradientColors: ["#E3F2FD", "#BBDEFB"],
    icon: "planet-outline",
  },
  {
    id: "mind-2",
    category: "Mind",
    title: "Mindful Beauty Rituals",
    teaser: "When you slow down your skincare routine, your skin — and your nervous system — rewards you.",
    readingMins: 4,
    intro:
      "The average skincare routine takes under two minutes. Mindful beauty reframes it as 5-10 minutes of intentional ritual — breathing deliberately, massaging with presence, noticing texture and scent. Research shows that mindful self-touch activates the parasympathetic nervous system, lowering cortisol and improving skin barrier integrity in the process.",
    tips: [
      "Before touching your face, take three slow breaths to shift from sympathetic ('fight-or-flight') to parasympathetic mode.",
      "Use both hands symmetrically — alternating sides of the face can unconsciously create tension. Symmetric motions promote relaxation.",
      "Notice the temperature, texture, and fragrance of each product rather than rushing to the next step.",
      "Incorporate a 30-second self-massage with your cleanser or moisturiser — acupressure points on the face directly reduce anxiety.",
      "Set a 'digital sunset' 30 minutes before your skincare ritual — blue light and social comparison both elevate cortisol.",
      "End with a brief gratitude practice focused on your body: what it did for you today, not how it looks.",
    ],
    products: [
      { name: "Aromatherapy Roll-On for Calm", url: "https://www.amazon.com/s?k=aromatherapy+roll+on+lavender+calm+stress", retailer: "Amazon", price: "from $14" },
      { name: "Ritual Facial Oil with Aromatics", url: "https://www.sephora.com/search?keyword=ritual+facial+oil+aromatherapy+mindful", retailer: "Sephora", price: "from $52" },
      { name: "Sleep & Calm Magnesium Glycinate", url: "https://www.iherb.com/search/?kw=magnesium+glycinate+calm+sleep+supplement", retailer: "iHerb", price: "from $18" },
    ],
    videos: [
      { title: "Mindful Skincare Night Routine", channel: "Glow with Rebecca", url: "https://www.youtube.com/results?search_query=mindful+skincare+routine+slow+beauty+ritual", thumbnailGradient: ["#E8EAF6", "#C5CAE9"] },
      { title: "Meditation for Skin Health & Glow", channel: "Calm", url: "https://www.youtube.com/results?search_query=meditation+for+skin+health+glow+guided", thumbnailGradient: ["#D9EEF5", "#B8DCEA"] },
    ],
    skinConcernTags: ["redness", "acne", "dryness"],
    gradientColors: ["#E8EAF6", "#C5CAE9"],
    icon: "heart-outline",
  },
  {
    id: "mind-3",
    category: "Mind",
    title: "Sleep Hygiene for Glowing Skin",
    teaser: "The most powerful (and free) anti-ageing treatment available — are you doing it right?",
    readingMins: 5,
    intro:
      "During deep sleep, human growth hormone peaks and drives cell repair, collagen synthesis, and barrier restoration. Skin's transepidermal water loss is regulated at night. Immune surveillance clears inflammatory debris. Missing even one night disrupts all of this — and chronic sleep deficit creates measurable, visible skin ageing within weeks.",
    tips: [
      "A silk or satin pillowcase reduces facial compression wrinkles and friction-related hair breakage compared to cotton.",
      "Keep your bedroom at 17-19°C (62-67°F) — the body's core temperature must drop to enter deep sleep stages.",
      "No screens 60 minutes before bed: blue light suppresses melatonin production by up to 50% and delays sleep onset.",
      "Apply your heaviest actives (retinol, AHAs) right before bed to take advantage of peak cell renewal cycles during sleep.",
      "Elevate your pillow slightly to reduce overnight facial fluid accumulation that causes morning puffiness.",
      "A consistent wake time — even on weekends — is more important for sleep quality than a consistent bedtime.",
    ],
    products: [
      { name: "Mulberry Silk Pillowcase Queen", url: "https://www.amazon.com/s?k=mulberry+silk+pillowcase+queen+25+momme", retailer: "Amazon", price: "from $28" },
      { name: "Overnight Recovery Sleep Mask", url: "https://www.sephora.com/search?keyword=overnight+recovery+sleep+mask+skin", retailer: "Sephora", price: "from $38" },
      { name: "Melatonin 0.5mg Time Release", url: "https://www.iherb.com/search/?kw=melatonin+0.5mg+time+release", retailer: "iHerb", price: "from $9" },
    ],
    videos: [
      { title: "Sleep Hygiene for Better Skin (Dermatologist)", channel: "Dr. Shereene Idriss", url: "https://www.youtube.com/results?search_query=sleep+hygiene+for+better+skin+dermatologist", thumbnailGradient: ["#E8EAF6", "#C5CAE9"] },
      { title: "Night Time Skincare & Sleep Routine", channel: "Skincare by Hyram", url: "https://www.youtube.com/results?search_query=nighttime+skincare+sleep+routine+skin+health", thumbnailGradient: ["#D9EEF5", "#B8DCEA"] },
    ],
    skinConcernTags: ["acne", "redness", "dryness", "warm", "cool"],
    gradientColors: ["#D9EEF5", "#B8DCEA"],
    icon: "moon-outline",
  },
];

export const WELLNESS_CATEGORIES: WellnessCategory[] = ["Skin", "Nutrition", "Fitness", "Mind"];
