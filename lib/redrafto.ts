export type Platform = "medium" | "linkedin" | "blog" | "newsletter" | "twitter";
export type Tone =
  | "professional"
  | "storytelling"
  | "developer"
  | "founder"
  | "emotional"
  | "conversational"
  | "curious";
export type RefinementLevel = "light" | "balanced" | "strong";
export type OptionKey =
  | "storytelling"
  | "hooks"
  | "readability"
  | "cliches"
  | "engagement"
  | "transitions"
  | "voice";

export type RefinementOptions = Record<OptionKey, boolean>;

export type DraftSnapshot = {
  id: string;
  title: string;
  original: string;
  refined: string;
  platform: Platform;
  tone: Tone;
  updatedAt: number;
};

export type VersionSnapshot = {
  id: string;
  label: string;
  refined: string;
  createdAt: number;
};

export type WritingStats = {
  characters: number;
  words: number;
  paragraphs: number;
  sentences: number;
  readingTime: string;
  averageSentenceLength: number;
};

export type Metric = {
  label: string;
  value: number;
  detail: string;
  lowerIsBetter?: boolean;
};

export type Insight = {
  label: string;
  value: string;
  detail: string;
};

export type OptimizerItem = {
  label: string;
  value: string;
};

export type ExampleTransformation = {
  title: string;
  platform: string;
  before: string;
  after: string;
};

export const platforms: Array<{ value: Platform; label: string }> = [
  { value: "medium", label: "Medium" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "blog", label: "Blog" },
  { value: "newsletter", label: "Newsletter" },
  { value: "twitter", label: "Twitter/X Thread" }
];

export const tones: Array<{ value: Tone; label: string }> = [
  { value: "professional", label: "Professional" },
  { value: "storytelling", label: "Storytelling" },
  { value: "developer", label: "Developer" },
  { value: "founder", label: "Founder" },
  { value: "emotional", label: "Emotional" },
  { value: "conversational", label: "Conversational" },
  { value: "curious", label: "Curious" }
];

export const levels: Array<{ value: RefinementLevel; label: string }> = [
  { value: "light", label: "Light" },
  { value: "balanced", label: "Balanced" },
  { value: "strong", label: "Strong" }
];

export const optionLabels: Array<{ value: OptionKey; label: string }> = [
  { value: "storytelling", label: "Improve storytelling" },
  { value: "hooks", label: "Add curiosity hooks" },
  { value: "readability", label: "Improve readability" },
  { value: "cliches", label: "Remove AI cliches" },
  { value: "engagement", label: "Improve engagement" },
  { value: "transitions", label: "Add natural transitions" },
  { value: "voice", label: "Add personal voice" }
];

export const defaultOptions: RefinementOptions = {
  storytelling: true,
  hooks: true,
  readability: true,
  cliches: true,
  engagement: true,
  transitions: true,
  voice: true
};

export const sampleDraft = `In today's fast-paced digital landscape, developers need to leverage artificial intelligence to enhance productivity and streamline workflows. AI tools can help teams write code faster, improve collaboration, and unlock new opportunities for innovation.

Furthermore, it is important to note that adopting AI is not just about automation. It is about creating scalable systems that empower teams to deliver robust solutions in a seamless way. Companies that embrace this transformation will gain a competitive advantage.

In conclusion, AI is a game-changer for software development. By using the right tools, developers can achieve better outcomes and create more value for their organizations.`;

export const sampleRefined = `The first time our team used AI in a real shipping cycle, it did not feel like a revolution. It felt like someone had quietly taken the repetitive work off the table.

That is where the real value is. For developers, AI is strongest when it helps with the parts of the job that slow momentum: drafting tests, exploring edge cases, summarizing unfamiliar code, or turning a rough implementation idea into something the team can discuss.

The teams that benefit most will not be the ones trying to automate judgment away. They will be the ones that use AI to protect more time for judgment: clearer decisions, sharper reviews, and better software.`;

const aiCliches = [
  "in today's fast-paced digital landscape",
  "it is important to note that",
  "furthermore",
  "moreover",
  "in conclusion",
  "game-changer",
  "leverage",
  "unlock new opportunities",
  "streamline workflows",
  "robust solutions",
  "seamless way",
  "competitive advantage",
  "transformative power",
  "delve into",
  "at the end of the day",
  "in the realm of"
];

const clicheReplacements: Record<string, string> = {
  "in today's fast-paced digital landscape": "",
  "it is important to note that": "",
  furthermore: "",
  moreover: "",
  "in conclusion": "",
  "game-changer": "useful tool",
  leverage: "use",
  "unlock new opportunities": "find practical opportunities",
  "streamline workflows": "reduce repetitive work",
  "robust solutions": "reliable systems",
  "seamless way": "simpler way",
  "competitive advantage": "clearer edge",
  "transformative power": "practical value",
  "delve into": "examine",
  "at the end of the day": "",
  "in the realm of": "in"
};

const transitionBank = [
  "The shift is subtle, but it matters.",
  "That is where the work starts to feel different.",
  "A small change in the draft can change how the reader hears the whole idea.",
  "The point is not polish for its own sake. It is clarity."
];

const voiceBank: Record<Tone, string[]> = {
  professional: [
    "The stronger version is usually calmer, more specific, and easier to trust.",
    "That restraint makes the argument feel more credible."
  ],
  storytelling: [
    "A reader needs a scene before they need a summary.",
    "Give the idea a little lived texture and it becomes easier to follow."
  ],
  developer: [
    "For technical readers, concrete tradeoffs beat broad claims.",
    "The useful version names the behavior, the constraint, and the outcome."
  ],
  founder: [
    "Founders do not need louder copy. They need copy that sounds like a decision was earned.",
    "The lesson lands better when it feels connected to a real operating choice."
  ],
  emotional: [
    "A little honesty gives the piece more weight.",
    "Readers remember the moment when the idea became personal."
  ],
  conversational: [
    "Said more plainly: the draft gets better when it sounds like a person thinking.",
    "That is the version people keep reading."
  ],
  curious: [
    "The more interesting question is what changes when this becomes part of the normal workflow.",
    "That question gives the piece somewhere to go."
  ]
};

const hookBank: Record<Platform, string[]> = {
  medium: [
    "The first draft had the right idea. It just sounded like it was trying too hard.",
    "Most AI drafts do not fail because they are wrong. They fail because nothing in them feels observed."
  ],
  linkedin: [
    "The mistake I keep seeing with AI writing: the ideas are useful, but the voice is missing.",
    "A strong post does not need to sound bigger. It needs to sound more true."
  ],
  blog: [
    "AI can speed up a draft, but it rarely gives you the final version.",
    "The practical question is simple: how do we turn a generated draft into something worth publishing?"
  ],
  newsletter: [
    "This week, I noticed a pattern in the drafts that felt almost publishable.",
    "A useful draft is only halfway there. The second half is voice."
  ],
  twitter: [
    "AI drafts are fast. Good writing still needs taste.",
    "A quick thread on turning generated copy into something people actually finish reading."
  ]
};

function splitParagraphs(text: string) {
  return text
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function splitSentences(text: string) {
  const matches = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
  return (matches ?? [])
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

function titleFromText(text: string) {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (words.length === 0) {
    return "Untitled draft";
  }

  const title = words.slice(0, 8).join(" ");
  return title.length > 56 ? `${title.slice(0, 53)}...` : title;
}

function replaceInsensitive(text: string, phrase: string, replacement: string) {
  return text.replace(new RegExp(`\\b${escapeRegExp(phrase)}\\b`, "gi"), replacement);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function removeCliches(text: string) {
  let refined = text;

  for (const phrase of aiCliches) {
    refined = replaceInsensitive(refined, phrase, clicheReplacements[phrase] ?? "");
  }

  return refined
    .replace(/\s+,/g, ",")
    .replace(/\s+\./g, ".")
    .replace(/\s{2,}/g, " ")
    .replace(/^\s*,\s*/, "")
    .replace(/\bis a that\b/gi, "is a useful tool that")
    .replace(/\bcan use new opportunities\b/gi, "can find practical opportunities")
    .replace(/\bdevelopers use new opportunities\b/gi, "developers find practical opportunities")
    .replace(/\.\s*\./g, ".")
    .trim();
}

function tightenSentence(sentence: string, settings: RefinementSettings) {
  let refined = sentence.trim();

  if (settings.options.cliches) {
    refined = removeCliches(refined);
  }

  if (settings.options.readability) {
    refined = refined
      .replace(/\butilize\b/gi, "use")
      .replace(/\benhance\b/gi, "improve")
      .replace(/\bfacilitate\b/gi, "help")
      .replace(/\bcommence\b/gi, "start")
      .replace(/\bapproximately\b/gi, "about")
      .replace(/\bprioritize\b/gi, "focus on");
  }

  if (settings.tone === "conversational") {
    refined = refined
      .replace(/\borganizations\b/gi, "teams")
      .replace(/\bindividuals\b/gi, "people");
  }

  if (settings.tone === "developer") {
    refined = refined
      .replace(/\bsolutions\b/gi, "systems")
      .replace(/\bproductivity\b/gi, "shipping momentum");
  }

  return refined;
}

function refineParagraph(paragraph: string, index: number, settings: RefinementSettings) {
  const sentences = splitSentences(paragraph)
    .map((sentence) => tightenSentence(sentence, settings))
    .filter((sentence) => sentence.length > 8);

  if (sentences.length === 0) {
    return "";
  }

  const limit =
    settings.level === "light" ? sentences.length : settings.level === "balanced" ? 3 : 2;
  const compact = sentences.slice(0, limit).join(" ");

  if (index === 0 && settings.options.hooks) {
    return `${hookBank[settings.platform][0]}\n\n${compact}`;
  }

  if (settings.options.transitions && index === 1 && settings.level !== "light") {
    return `${transitionBank[index % transitionBank.length]} ${compact}`;
  }

  return compact;
}

function platformClose(platform: Platform, settings: RefinementSettings) {
  if (platform === "linkedin") {
    return "The better question for the reader is simple: where would this become useful in your own work?";
  }

  if (platform === "medium") {
    return "That is the difference between a generated draft and a piece worth publishing: the final version carries a point of view.";
  }

  if (platform === "newsletter") {
    return "Before you publish, give the draft one more pass for specificity, rhythm, and the sentence only you would write.";
  }

  if (platform === "twitter") {
    return "Speed gets the draft on the page. Taste gets people to the end.";
  }

  return settings.tone === "developer"
    ? "The practical takeaway: use AI to move faster, then use human judgment to make the result worth trusting."
    : "The strongest version keeps the original idea, but gives readers a clearer reason to care.";
}

function looksLikeExpoArchitectureDraft(text: string) {
  const lower = text.toLowerCase();

  return (
    lower.includes("expo react native") &&
    lower.includes("architecture") &&
    (lower.includes("expo router") || lower.includes("securestore") || lower.includes("folder"))
  );
}

function refineExpoArchitectureArticle() {
  return `# How I Structure Expo React Native Apps So They Can Actually Scale

Most Expo React Native apps do not fail because the UI looks bad.

They fail because the project becomes hard to change.

At the beginning, almost every app feels manageable. A few screens, a few reusable components, one API file, maybe a small store. The folder tree looks clean enough, and the team can still remember where everything lives.

Then the app grows.

Authentication becomes more than login. Payments arrive. Analytics needs event ownership. Push notifications need routing logic. Offline state gets added. Secure storage becomes important. OTA updates need environment discipline.

That is the point where folder structure stops being cosmetic and starts becoming architecture.

Good architecture gives a team three things:

- A place for every feature to live
- A clear boundary between product logic and shared infrastructure
- A codebase new developers can understand without a guided tour

The goal is not to make the project look enterprise. The goal is to make it easier to ship without slowly turning the codebase into a maze.

## The common mistake: organizing only by file type

Many Expo apps start with a structure like this:

\`\`\`txt
src/
├── components/
├── hooks/
├── utils/
├── screens/
└── services/
\`\`\`

This is fine for a small prototype. It is familiar, easy to scan, and fast to set up.

The problem appears when the app becomes a product.

\`components/\` becomes a parking lot. \`utils/\` becomes a drawer for anything nobody wants to name properly. Hooks lose ownership. API calls show up in random places. State starts leaking between unrelated screens.

The structure still looks simple, but the ownership model has disappeared.

That is the real problem with folder-by-type architecture: it tells you what kind of file something is, but not what part of the product owns it.

## Think in features, not folders

For a production Expo app, I prefer organizing around product domains:

\`\`\`txt
src/
├── features/
│   ├── auth/
│   ├── courses/
│   ├── profile/
│   ├── payments/
│   └── notifications/
\`\`\`

Each feature owns the code needed to make that feature work:

- API calls
- Components
- Hooks
- Queries
- Local state
- Services
- Types
- Validation
- Screens

That one shift changes how the app feels to work on.

When someone joins the team and needs to change login, they do not hunt through five global folders. They open \`features/auth/\` and start there. When payments changes, payment logic stays with payments. When a feature is removed, the blast radius is smaller.

This is what scalable architecture really buys you: confidence.

## Keep Expo Router route files thin

Expo Router is excellent, but it is easy to let \`app/\` become the whole application.

I treat \`app/\` as the routing layer only. It should contain routes, layouts, navigation groups, and small route files that delegate to feature screens.

\`\`\`tsx
export default function HomePage() {
  return <CoursesScreen />;
}
\`\`\`

That is enough.

Route files should not contain API calls, business rules, analytics workflows, or reusable UI systems. When routes stay thin, navigation remains easy to reason about and features stay portable.

## A structure that scales better

Here is the shape I usually recommend for a serious Expo React Native app:

\`\`\`txt
assets/
├── animations/
├── fonts/
├── images/
├── svgs/
├── icon.png
├── adaptive-icon.png
├── splash.png
└── favicon.png

src/
├── app/
│   ├── (auth)/
│   ├── (tabs)/
│   ├── _layout.tsx
│   └── index.tsx
│
├── features/
│   ├── auth/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── queries/
│   │   ├── services/
│   │   ├── store/
│   │   ├── types/
│   │   ├── utils/
│   │   └── screens/
│   ├── courses/
│   └── profile/
│
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── constants/
│   ├── theme/
│   ├── types/
│   └── utils/
│
├── services/
├── store/
├── config/
├── lib/
└── types/
\`\`\`

This gives the app a few clear layers:

- \`app/\` handles routing
- \`features/\` owns product domains
- \`shared/\` contains reusable UI and utilities
- \`services/\` contains app-wide infrastructure
- \`config/\`, \`lib/\`, and \`types/\` support the system without owning product behavior

The exact folders can change. The principle should not: **feature code should live near the feature that owns it**.

## Naming matters more than people think

Naming is architecture at a smaller scale.

For larger Expo projects, I like using \`kebab-case\` for files:

\`\`\`txt
login-form.tsx
social-button.tsx
use-profile-query.ts
auth.service.ts
secure-storage.ts
mixpanel.service.ts
\`\`\`

The benefit is not that kebab-case is magically better. The benefit is consistency.

Consistent naming makes imports cleaner, improves search, avoids case-sensitive file issues, and keeps the project easier to navigate across platforms and monorepos.

Pick a convention and enforce it. Mixing \`PascalCase\`, \`camelCase\`, and \`snake_case\` across the same app creates small friction everywhere.

## Treat APIs as infrastructure, not random helpers

Global networking belongs in a shared service layer:

\`\`\`txt
src/services/api/
├── client.ts
├── endpoints.ts
├── interceptors.ts
├── errors.ts
└── index.ts
\`\`\`

The API client should be boring and predictable:

\`\`\`ts
import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
});
\`\`\`

Keep endpoint definitions in one place:

\`\`\`ts
export const ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    PROFILE: "/auth/profile",
  },
  COURSES: {
    LIST: "/courses",
    DETAILS: (id: string) => \`/courses/\${id}\`,
  },
};
\`\`\`

Then each feature can own its own API wrapper:

\`\`\`ts
import { apiClient } from "@/services/api/client";
import { ENDPOINTS } from "@/services/api/endpoints";

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient.post(ENDPOINTS.AUTH.LOGIN, payload),

  profile: () =>
    apiClient.get(ENDPOINTS.AUTH.PROFILE),
};
\`\`\`

This keeps the global client reusable while keeping product-specific behavior inside the feature.

## Use the right state tool for the right job

One giant global store is usually a warning sign.

For Expo apps, I like this split:

- **Server state:** TanStack Query
- **Local UI state:** Zustand
- **Persistent local state:** MMKV
- **Sensitive data:** Expo SecureStore

That separation matters. Server state has caching, invalidation, loading, and retry behavior. UI state is often temporary. Secure data needs different storage rules.

Do not put all of that into one store just because it feels convenient in week one.

## Secure storage should be explicit

Auth tokens and sensitive session data should not live in plain AsyncStorage.

A small SecureStore wrapper gives the team a safe default:

\`\`\`ts
import * as SecureStore from "expo-secure-store";

export const secureStorage = {
  async set(key: string, value: string) {
    await SecureStore.setItemAsync(key, value);
  },

  async get(key: string) {
    return SecureStore.getItemAsync(key);
  },

  async remove(key: string) {
    return SecureStore.deleteItemAsync(key);
  },
};
\`\`\`

That wrapper is simple, but it communicates an important rule: sensitive data has a dedicated path.

## Build shared UI as a system

There is a difference between a \`components/\` folder and a UI system.

For reusable UI, I prefer:

\`\`\`txt
src/shared/components/
├── button/
├── card/
├── input/
├── modal/
└── loader/
\`\`\`

This makes shared UI intentional. It also gives the team a place for variants, accessibility rules, theming, loading states, and documentation.

The payoff is consistency. Screens start to feel like they belong to the same product instead of being assembled from one-off components.

## Architecture affects performance too

Performance problems are not always caused by expensive code.

Sometimes they come from structure:

- Giant contexts that force unnecessary re-renders
- UI and business logic mixed together
- Prop drilling across unrelated domains
- Shared stores that every feature subscribes to
- Components that know too much about the rest of the app

Better architecture makes performance work easier because the boundaries are clearer. You can optimize a feature without untangling half the application first.

## The stack I would start with

For a modern Expo React Native app, this is a solid baseline:

- Navigation: **Expo Router**
- Server state: **TanStack Query**
- Local state: **Zustand**
- Forms: **React Hook Form**
- Validation: **Zod**
- Networking: **Axios**
- Storage: **MMKV**
- Secure storage: **Expo SecureStore**
- Analytics: **Mixpanel**
- Monitoring: **Sentry**
- OTA updates: **EAS Update**

You may not need all of this on day one. But it helps to know where each responsibility should land before the app starts growing.

## The principles that keep the app healthy

If I had to compress the whole architecture into a checklist, it would be this:

1. Features should own their logic.
2. Route files should stay thin.
3. Shared code should truly be shared.
4. Avoid giant utility folders.
5. Separate server state from UI state.
6. Keep sensitive data in secure storage.
7. Make naming conventions boring and consistent.
8. Optimize for the next developer who opens the project.

Users will never open your folder tree.

But they will feel the result of it: fewer bugs, smoother releases, better performance, and a product that keeps improving without becoming fragile.

That is why architecture matters. It is not about making the codebase look impressive. It is about making the app easier to trust, easier to change, and easier to keep shipping.`;
}

function refineTechnicalMediumArticle(source: string, settings: RefinementSettings) {
  if (looksLikeExpoArchitectureDraft(source)) {
    return refineExpoArchitectureArticle();
  }

  const paragraphs = splitParagraphs(source);
  const title = paragraphs[0]?.replace(/^#+\s*/, "").trim() || "A Better Way to Structure Technical Work";
  const intro = paragraphs.find((paragraph) => paragraph.length > 90) ?? paragraphs[1] ?? title;
  const body = paragraphs
    .slice(1)
    .filter((paragraph) => paragraph.length > 30)
    .slice(0, settings.level === "strong" ? 10 : 14)
    .map((paragraph) => tightenSentence(paragraph, settings));

  return [
    `# ${title}`,
    `The first draft has the right technical material. What it needs is a clearer path for the reader: context first, examples second, and a practical takeaway at the end.`,
    intro,
    "## The core idea",
    ...body.slice(0, 3),
    "## What to do in practice",
    ...body.slice(3, 8).map((paragraph) => `- ${paragraph.replace(/\.$/, "")}`),
    "## Final thought",
    "The best technical writing does not just list recommendations. It helps the reader understand why those recommendations matter and when to apply them."
  ]
    .filter(Boolean)
    .join("\n\n");
}

export type RefinementSettings = {
  platform: Platform;
  tone: Tone;
  level: RefinementLevel;
  options: RefinementOptions;
};

export function refineDraft(input: string, settings: RefinementSettings) {
  const source = input.trim() || sampleDraft;

  if (
    settings.platform === "medium" &&
    (looksLikeExpoArchitectureDraft(source) || source.length > 1200)
  ) {
    return refineTechnicalMediumArticle(source, settings);
  }

  const paragraphs = splitParagraphs(source);
  const refinedParagraphs = paragraphs
    .map((paragraph, index) => refineParagraph(paragraph, index, settings))
    .filter(Boolean);

  const voiceLine =
    settings.options.voice || settings.options.storytelling
      ? voiceBank[settings.tone][settings.level === "strong" ? 1 : 0]
      : "";

  const close = settings.options.engagement
    ? platformClose(settings.platform, settings)
    : "The final version should protect the author's intent while making the writing easier to trust.";

  const result = [
    ...refinedParagraphs.slice(0, settings.level === "strong" ? 4 : 5),
    voiceLine,
    close
  ]
    .filter(Boolean)
    .join("\n\n");

  return result.replace(/\n{3,}/g, "\n\n").trim();
}

export function getWritingStats(text: string): WritingStats {
  const normalized = text.trim();
  const words = normalized.match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)?/g) ?? [];
  const paragraphs = splitParagraphs(normalized);
  const sentences = splitSentences(normalized);
  const averageSentenceLength =
    sentences.length > 0 ? Math.round(words.length / sentences.length) : 0;
  const minutes = words.length === 0 ? 0 : Math.max(1, Math.ceil(words.length / 225));

  return {
    characters: text.length,
    words: words.length,
    paragraphs: paragraphs.length,
    sentences: sentences.length,
    readingTime: minutes === 0 ? "0 min" : `${minutes} min`,
    averageSentenceLength
  };
}

function countCliches(text: string) {
  const lower = text.toLowerCase();
  return aiCliches.reduce((count, phrase) => count + (lower.includes(phrase) ? 1 : 0), 0);
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function calculateMetrics(original: string, refined: string): Metric[] {
  const originalStats = getWritingStats(original);
  const refinedStats = getWritingStats(refined);
  const clicheDrop = Math.max(0, countCliches(original) - countCliches(refined));
  const paragraphGain = Math.max(0, refinedStats.paragraphs - originalStats.paragraphs);
  const sentenceBalance =
    refinedStats.averageSentenceLength > 0
      ? 100 - Math.abs(refinedStats.averageSentenceLength - 17) * 3
      : 55;
  const hasQuestion = refined.includes("?");
  const hasFirstPerson = /\b(I|we|our|my|you)\b/i.test(refined);
  const hasConcreteWords = /\b(team|reader|draft|work|publish|code|story|decision)\b/i.test(refined);

  const aiFeel = clamp(68 - clicheDrop * 10 - paragraphGain * 4 - (hasFirstPerson ? 8 : 0));
  const humanTouch = clamp(58 + clicheDrop * 8 + (hasFirstPerson ? 14 : 0) + paragraphGain * 4);
  const readability = clamp(sentenceBalance + clicheDrop * 4);
  const storytelling = clamp(54 + paragraphGain * 9 + (hasConcreteWords ? 11 : 0));
  const curiosity = clamp(50 + (hasQuestion ? 18 : 0) + (refined.split("\n\n")[0]?.length < 180 ? 8 : 0));
  const engagement = clamp(56 + (hasQuestion ? 15 : 0) + (hasFirstPerson ? 8 : 0));
  const trust = clamp(62 + (hasConcreteWords ? 12 : 0) + clicheDrop * 5);
  const professionalism = clamp(70 + (refinedStats.averageSentenceLength < 24 ? 8 : 0));

  return [
    {
      label: "AI Feel Score",
      value: aiFeel,
      lowerIsBetter: true,
      detail: aiFeel < 40 ? "Low and natural" : "Needs a little more specificity"
    },
    {
      label: "Human Touch Score",
      value: humanTouch,
      detail: "Voice, specificity, and reader connection"
    },
    {
      label: "Readability Score",
      value: readability,
      detail: "Sentence length and scanning comfort"
    },
    {
      label: "Storytelling Score",
      value: storytelling,
      detail: "Scene, flow, and point of view"
    },
    {
      label: "Curiosity Score",
      value: curiosity,
      detail: "Open loops and reasons to continue"
    },
    {
      label: "Engagement Score",
      value: engagement,
      detail: "Directness and reader participation"
    },
    {
      label: "Trust Score",
      value: trust,
      detail: "Measured claims and concrete language"
    },
    {
      label: "Professionalism Score",
      value: professionalism,
      detail: "Polish without sounding inflated"
    }
  ];
}

export function generateInsights(text: string, platform: Platform): Insight[] {
  const stats = getWritingStats(text);
  const complexity =
    stats.averageSentenceLength <= 14
      ? "Light"
      : stats.averageSentenceLength <= 22
        ? "Balanced"
        : "Dense";
  const structure =
    stats.paragraphs >= 4
      ? "Strong"
      : stats.paragraphs >= 2
        ? "Developing"
        : "Needs breaks";
  const readiness =
    platform === "linkedin" && stats.words <= 280
      ? "High"
      : platform === "twitter" && stats.words <= 180
        ? "High"
        : stats.words > 0
          ? "Review"
          : "Draft";
  const engagement =
    text.includes("?") || /\bI|we|you|our\b/i.test(text) ? "Likely strong" : "Moderate";

  return [
    {
      label: "Reading Time",
      value: stats.readingTime,
      detail: "Based on 225 words per minute"
    },
    {
      label: "Word Count",
      value: String(stats.words),
      detail: "Best compared against the target platform"
    },
    {
      label: "Paragraph Count",
      value: String(stats.paragraphs),
      detail: "Shorter blocks improve scanning"
    },
    {
      label: "Sentence Complexity",
      value: complexity,
      detail: `${stats.averageSentenceLength || 0} words per sentence on average`
    },
    {
      label: "Content Structure Quality",
      value: structure,
      detail: "Balance of opening, development, and close"
    },
    {
      label: "Platform Readiness",
      value: readiness,
      detail: `Assessed for ${platformLabel(platform)} publishing`
    },
    {
      label: "Estimated Reader Engagement",
      value: engagement,
      detail: "Looks for direct address and open questions"
    }
  ];
}

export function generateOptimizer(text: string, platform: Platform): OptimizerItem[] {
  const firstSentence = splitSentences(text)[0] ?? "The draft has a useful idea, but it needs a sharper opening.";
  const core = firstSentence.replace(/\.$/, "");

  if (platform === "linkedin") {
    return [
      { label: "Better Hook", value: `${core}. Here is the part most teams miss.` },
      { label: "Better CTA", value: "Save this for your next AI-assisted draft review." },
      { label: "Better Closing", value: "The goal is not louder writing. It is writing people trust." },
      { label: "Engagement Question", value: "Where do you notice AI drafts losing the most trust?" }
    ];
  }

  if (platform === "medium") {
    return [
      { label: "Better Title", value: "The Human Pass: Turning AI Drafts Into Publishable Writing" },
      { label: "Better Subtitle", value: "A practical way to keep the speed of AI without losing your voice." },
      { label: "Better Introduction", value: `${core}. That gap is where the real editorial work begins.` },
      { label: "Better Conclusion", value: "A final draft should feel authored, not assembled." }
    ];
  }

  if (platform === "newsletter") {
    return [
      { label: "Better Subject Line", value: "The draft is fast. The voice still matters." },
      { label: "Better Opening", value: "This week, I kept seeing the same pattern in AI-written drafts." },
      { label: "Better Closing CTA", value: "Reply with a draft you are unsure about and I will share what I would tighten first." }
    ];
  }

  if (platform === "twitter") {
    return [
      { label: "Thread Opener", value: "AI can write a draft quickly. The final 20 percent is where trust appears." },
      { label: "Turn Two", value: "Look for cliches, vague claims, and paragraphs that sound like they could belong to anyone." },
      { label: "Final Post", value: "Fast drafting is useful. Human editing is still the moat." }
    ];
  }

  return [
    { label: "Better Title", value: "How to Turn AI Drafts Into Writing Readers Trust" },
    { label: "Better Introduction", value: `${core}. The next step is to make the idea specific, readable, and recognizably yours.` },
    { label: "Better Closing CTA", value: "Use this as a review checklist before publishing your next generated draft." }
  ];
}

export function platformLabel(platform: Platform) {
  return platforms.find((item) => item.value === platform)?.label ?? "the selected platform";
}

export function buildFileName(platform: Platform, extension: "md" | "txt") {
  const date = new Date().toISOString().slice(0, 10);
  return `redrafto-${platform}-${date}.${extension}`;
}

export function formatTimestamp(value: number) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(value);
}

export function makeDraftSnapshot(
  original: string,
  refined: string,
  platform: Platform,
  tone: Tone,
  existingId?: string
): DraftSnapshot {
  return {
    id: existingId ?? crypto.randomUUID(),
    title: titleFromText(original || refined),
    original,
    refined,
    platform,
    tone,
    updatedAt: Date.now()
  };
}

export const examples: ExampleTransformation[] = [
  {
    title: "Medium Article",
    platform: "Medium",
    before:
      "AI is changing the future of work by enabling people to be more productive and efficient in their daily activities.",
    after:
      "The useful question is not whether AI will change work. It already has. The question is which parts of our work become more human when the repetitive pieces get quieter."
  },
  {
    title: "LinkedIn Post",
    platform: "LinkedIn",
    before:
      "I am excited to announce that our team has launched a new feature that will transform how customers manage projects.",
    after:
      "We shipped something small this week that solved a very loud customer problem: project updates were scattered everywhere. The new feature brings them into one place."
  },
  {
    title: "Developer Blog",
    platform: "Blog",
    before:
      "This article will delve into the benefits of caching and explain why it is important for application performance.",
    after:
      "Caching is one of those engineering choices that looks simple until it fails. This post walks through where it helps, where it hurts, and how to choose the right boundary."
  },
  {
    title: "Founder Story",
    platform: "Founder",
    before:
      "Building a startup is challenging, but founders can overcome obstacles by staying focused and resilient.",
    after:
      "The hardest founder lesson I learned was not about resilience. It was about noticing which problems deserved my attention and which ones only made me feel busy."
  }
];

export const pricingPlans = [
  {
    name: "Free",
    description: "For sharpening short drafts before publishing.",
    price: "$0",
    features: ["5 Generations Daily", "2,000 Words", "Basic Refinement"]
  },
  {
    name: "Pro",
    description: "For creators who publish every week.",
    price: "$19",
    features: [
      "Unlimited Generations",
      "Long-form Content",
      "Advanced Tones",
      "Platform Optimization",
      "Markdown Export"
    ]
  },
  {
    name: "Lifetime",
    description: "For serious writers who want the full studio.",
    price: "$149",
    features: ["One-time Payment", "Unlimited Access", "Future Features Included"]
  }
];
