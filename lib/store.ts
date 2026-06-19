"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  calculateMetrics,
  defaultOptions,
  generateInsights,
  generateOptimizer,
  makeDraftSnapshot,
  refineDraft,
  sampleDraft,
  sampleRefined,
  type DraftSnapshot,
  type Insight,
  type Metric,
  type OptimizerItem,
  type OptionKey,
  type Platform,
  type RefinementLevel,
  type RefinementOptions,
  type Tone,
  type VersionSnapshot
} from "@/lib/redrafto";

type RedraftoState = {
  original: string;
  refined: string;
  platform: Platform;
  tone: Tone;
  level: RefinementLevel;
  options: RefinementOptions;
  metrics: Metric[];
  insights: Insight[];
  optimizer: OptimizerItem[];
  recentDrafts: DraftSnapshot[];
  versions: VersionSnapshot[];
  currentDraftId?: string;
  lastSavedAt?: number;
  hasGenerated: boolean;
  setOriginal: (value: string) => void;
  setRefined: (value: string) => void;
  setPlatform: (value: Platform) => void;
  setTone: (value: Tone) => void;
  setLevel: (value: RefinementLevel) => void;
  toggleOption: (key: OptionKey) => void;
  redraft: () => void;
  saveDraft: () => void;
  loadDraft: (draft: DraftSnapshot) => void;
  restoreVersion: (version: VersionSnapshot) => void;
  clear: () => void;
};

const initialMetrics = calculateMetrics(sampleDraft, sampleRefined);
const initialInsights = generateInsights(sampleRefined, "medium");
const initialOptimizer = generateOptimizer(sampleRefined, "medium");

export const useRedraftoStore = create<RedraftoState>()(
  persist(
    (set, get) => ({
      original: sampleDraft,
      refined: sampleRefined,
      platform: "medium",
      tone: "storytelling",
      level: "balanced",
      options: defaultOptions,
      metrics: initialMetrics,
      insights: initialInsights,
      optimizer: initialOptimizer,
      recentDrafts: [],
      versions: [
        {
          id: "sample-version",
          label: "Example refinement",
          refined: sampleRefined,
          createdAt: Date.now()
        }
      ],
      hasGenerated: true,
      setOriginal: (value) => {
        set({
          original: value,
          hasGenerated: false
        });
      },
      setRefined: (value) => {
        const state = get();
        set({
          refined: value,
          metrics: calculateMetrics(state.original, value),
          insights: generateInsights(value, state.platform),
          optimizer: generateOptimizer(value, state.platform)
        });
      },
      setPlatform: (value) => {
        const state = get();
        set({
          platform: value,
          insights: generateInsights(state.refined, value),
          optimizer: generateOptimizer(state.refined, value)
        });
      },
      setTone: (value) => set({ tone: value }),
      setLevel: (value) => set({ level: value }),
      toggleOption: (key) => {
        const options = get().options;
        set({
          options: {
            ...options,
            [key]: !options[key]
          }
        });
      },
      redraft: () => {
        const state = get();
        const refined = refineDraft(state.original, {
          platform: state.platform,
          tone: state.tone,
          level: state.level,
          options: state.options
        });
        const version: VersionSnapshot = {
          id: crypto.randomUUID(),
          label: `${state.platform} / ${state.tone}`,
          refined,
          createdAt: Date.now()
        };

        set({
          refined,
          metrics: calculateMetrics(state.original, refined),
          insights: generateInsights(refined, state.platform),
          optimizer: generateOptimizer(refined, state.platform),
          versions: [version, ...state.versions].slice(0, 8),
          hasGenerated: true
        });

        get().saveDraft();
      },
      saveDraft: () => {
        const state = get();
        const original = state.original.trim();
        const refined = state.refined.trim();

        if (!original && !refined) {
          return;
        }

        const snapshot = makeDraftSnapshot(
          state.original,
          state.refined,
          state.platform,
          state.tone,
          state.currentDraftId
        );
        const withoutCurrent = state.recentDrafts.filter((draft) => draft.id !== snapshot.id);

        set({
          recentDrafts: [snapshot, ...withoutCurrent].slice(0, 6),
          currentDraftId: snapshot.id,
          lastSavedAt: snapshot.updatedAt
        });
      },
      loadDraft: (draft) => {
        set({
          original: draft.original,
          refined: draft.refined,
          platform: draft.platform,
          tone: draft.tone,
          metrics: calculateMetrics(draft.original, draft.refined),
          insights: generateInsights(draft.refined, draft.platform),
          optimizer: generateOptimizer(draft.refined, draft.platform),
          currentDraftId: draft.id,
          hasGenerated: Boolean(draft.refined)
        });
      },
      restoreVersion: (version) => {
        const state = get();
        set({
          refined: version.refined,
          metrics: calculateMetrics(state.original, version.refined),
          insights: generateInsights(version.refined, state.platform),
          optimizer: generateOptimizer(version.refined, state.platform),
          hasGenerated: true
        });
      },
      clear: () => {
        set({
          original: "",
          refined: "",
          metrics: [],
          insights: [],
          optimizer: [],
          versions: [],
          currentDraftId: undefined,
          hasGenerated: false
        });
      }
    }),
    {
      name: "redrafto-workspace",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        original: state.original,
        refined: state.refined,
        platform: state.platform,
        tone: state.tone,
        level: state.level,
        options: state.options,
        metrics: state.metrics,
        insights: state.insights,
        optimizer: state.optimizer,
        recentDrafts: state.recentDrafts,
        versions: state.versions,
        currentDraftId: state.currentDraftId,
        lastSavedAt: state.lastSavedAt,
        hasGenerated: state.hasGenerated
      })
    }
  )
);
