"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useForm, type UseFormRegister, type UseFormSetValue } from "react-hook-form";
import {
  ArrowDown,
  ArrowRight,
  Bold,
  BookOpenText,
  Check,
  Code2,
  Clipboard,
  Copy,
  Download,
  Eraser,
  FileDown,
  Heading1,
  Heading2,
  History,
  Italic,
  List,
  ListOrdered,
  NotebookPen,
  Quote,
  Send,
  RefreshCw,
  Save,
  SlidersHorizontal,
  Sparkles
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useRedraftoStore } from "@/lib/store";
import {
  buildFileName,
  examples,
  formatTimestamp,
  getWritingStats,
  levels,
  optionLabels,
  platformLabel,
  platforms,
  pricingPlans,
  sampleDraft,
  sampleRefined,
  tones,
  type OptionKey,
  type Platform,
  type RefinementLevel,
  type RefinementOptions,
  type Tone
} from "@/lib/redrafto";
import {
  looksLikeMarkdown,
  markdownToHtml,
  markdownToPlainText,
  tiptapJsonToMarkdown
} from "@/lib/markdown";

type ControlsForm = {
  platform: Platform;
  tone: Tone;
  levelIndex: number;
  options: RefinementOptions;
};

function splitParagraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function levelToIndex(level: RefinementLevel) {
  return Math.max(
    0,
    levels.findIndex((item) => item.value === level)
  );
}

function downloadText(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function RedraftoApp() {
  const {
    original,
    refined,
    platform,
    tone,
    level,
    options,
    metrics,
    insights,
    optimizer,
    recentDrafts,
    versions,
    lastSavedAt,
    hasGenerated,
    setOriginal,
    setPlatform,
    setTone,
    setLevel,
    redraft,
    saveDraft,
    loadDraft,
    restoreVersion,
    clear
  } = useRedraftoStore();
  const [comparePosition, setComparePosition] = useState(32);
  const { register, handleSubmit, setValue } = useForm<ControlsForm>({
    defaultValues: {
      platform,
      tone,
      levelIndex: levelToIndex(level),
      options
    }
  });

  const originalStats = useMemo(() => getWritingStats(markdownToPlainText(original)), [original]);
  const refinedStats = useMemo(() => getWritingStats(markdownToPlainText(refined)), [refined]);
  const heroOriginal = useMemo(
    () => markdownToPlainText(original).trim() || markdownToPlainText(sampleDraft),
    [original]
  );
  const heroRefined = useMemo(
    () => markdownToPlainText(refined).trim() || markdownToPlainText(sampleRefined),
    [refined]
  );

  useEffect(() => {
    let direction = 1;
    const interval = window.setInterval(() => {
      setComparePosition((current) => {
        const next = current + direction * 3;

        if (next >= 86) {
          direction = -1;
          return 86;
        }

        if (next <= 28) {
          direction = 1;
          return 28;
        }

        return next;
      });
    }, 120);

    return () => window.clearInterval(interval);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Paste AI-generated content here..."
      })
    ],
    content: markdownToHtml(original),
    editorProps: {
      attributes: {
        class: "editor-shell"
      },
      handlePaste: (_view, event) => {
        const text = event.clipboardData?.getData("text/plain");
        if (text && looksLikeMarkdown(text)) {
          event.preventDefault();
          editor?.chain().focus().insertContent(markdownToHtml(text)).run();
          return true;
        }
        return false;
      }
    },
    immediatelyRender: false,
    onUpdate: ({ editor: activeEditor }) => {
      setOriginal(tiptapJsonToMarkdown(activeEditor.getJSON()));
    }
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const currentMarkdown = tiptapJsonToMarkdown(editor.getJSON()).trim();
    if (currentMarkdown !== original.trim()) {
      editor.commands.setContent(markdownToHtml(original), false);
    }
  }, [editor, original]);

  useEffect(() => {
    setValue("platform", platform);
    setValue("tone", tone);
    setValue("levelIndex", levelToIndex(level));
    optionLabels.forEach((option) => {
      setValue(`options.${option.value}` as `options.${OptionKey}`, options[option.value]);
    });
  }, [level, options, platform, setValue, tone]);

  useEffect(() => {
    if (!original.trim() && !refined.trim()) {
      return;
    }

    const timeout = window.setTimeout(() => {
      saveDraft();
    }, 1200);

    return () => window.clearTimeout(timeout);
  }, [original, refined, platform, tone, level, options, saveDraft]);

  const runRedraft = useCallback(() => {
    redraft();
    toast.success("Draft refined");
  }, [redraft]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const modifier = event.metaKey || event.ctrlKey;

      if (modifier && event.key === "Enter") {
        event.preventDefault();
        runRedraft();
      }

      if (modifier && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveDraft();
        toast.success("Draft saved");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [runRedraft, saveDraft]);

  const copyRefined = async () => {
    if (!refined.trim()) {
      toast.error("There is no refined draft to copy");
      return;
    }

    const html = markdownToHtml(refined);

    if (typeof ClipboardItem !== "undefined" && navigator.clipboard.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([refined], { type: "text/plain" })
        })
      ]);
      toast.success("Copied with formatting");
      return;
    }

    await navigator.clipboard.writeText(refined);
    toast.success("Copied as Markdown");
  };

  const exportMarkdown = () => {
    if (!refined.trim()) {
      toast.error("Generate a refined draft first");
      return;
    }

    downloadText(refined, buildFileName(platform, "md"), "text/markdown;charset=utf-8");
    toast.success("Markdown exported");
  };

  const exportTxt = () => {
    if (!refined.trim()) {
      toast.error("Generate a refined draft first");
      return;
    }

    downloadText(markdownToPlainText(refined), buildFileName(platform, "txt"), "text/plain;charset=utf-8");
    toast.success("Text exported");
  };

  const handleClear = () => {
    clear();
    toast.message("Workspace cleared");
  };

  const onSubmit = () => runRedraft();

  return (
    <main className="min-h-screen bg-bg">
      <Toaster position="top-right" richColors />

      <SiteHeader lastSavedAt={lastSavedAt} formatTimestamp={formatTimestamp} />

      {/* Hero */}
      <section className="border-b border-border bg-white">
        <div className="mx-auto grid max-w-[1200px] gap-8 px-6 py-14 md:py-18 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-bg px-3 py-1 text-xs font-semibold text-muted">
              <Sparkles className="h-3.5 w-3.5 text-action" />
              AI Draft &rarr; Authentic Writing
            </div>
            <h1 className="text-[clamp(2rem,4.5vw,3rem)] font-semibold leading-[1.1] tracking-tight text-ink">
              Make AI Content Sound Human Again
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
              Transform AI-generated articles, posts, blogs, and newsletters
              into authentic content that readers trust.
            </p>
            <div className="mt-6 flex gap-3">
              <Button asChild size="sm">
                <a href="#workspace">
                  Start Writing
                  <ArrowDown className="h-4 w-4" />
                </a>
              </Button>
              <Button asChild variant="secondary" size="sm">
                <a href="#examples">
                  View Examples
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-semibold text-ink">Live comparison</span>
              <span className="text-[11px] text-muted">Swipe to compare</span>
            </div>
            <div className="relative min-h-[280px] overflow-hidden rounded-lg border border-border bg-white">
              <div className="absolute inset-0 p-5">
                <ComparisonSnippet
                  indicator="AI Draft"
                  indicatorColor="bg-warning"
                  body={heroOriginal}
                  muted
                />
              </div>
              <div
                className="absolute inset-0 overflow-hidden border-r border-action bg-white transition-[clip-path] duration-150 ease-out"
                style={{ clipPath: `inset(0 ${100 - comparePosition}% 0 0)` }}
              >
                <div className="w-[200%] p-5">
                  <ComparisonSnippet
                    indicator="Redrafto Output"
                    indicatorColor="bg-success"
                    body={heroRefined}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workspace */}
      <section id="workspace" className="border-b border-border bg-white py-8">
        <div className="mx-auto max-w-[1200px] px-6">
          <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
            <ControlsBar
              platform={platform}
              tone={tone}
              level={level}
              register={register}
              platforms={platforms}
              tones={tones}
              levels={levels}
              setValue={setValue}
              setPlatform={setPlatform}
              setTone={setTone}
              setLevel={setLevel}
              levelToIndex={levelToIndex}
            />

            {/* Editor panels */}
                <div className="grid gap-4 lg:grid-cols-2">
                  <WritingPanel
                    title="Original Content"
                    stats={originalStats}
                    action={
                      <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
                        <Eraser className="h-4 w-4" />
                        Clear
                      </Button>
                    }
                  >
                    <EditorToolbar editor={editor} />
                    <div className="min-h-[440px] rounded-lg border border-border bg-white p-4">
                      <EditorContent editor={editor} />
                    </div>
                  </WritingPanel>

                  <WritingPanel
                    title="Refined Content"
                    stats={refinedStats}
                    action={
                      <div className="flex gap-1">
                        <IconButton label="Copy" onClick={copyRefined}>
                          <Copy className="h-4 w-4" />
                        </IconButton>
                        <IconButton label="Regenerate" onClick={runRedraft}>
                          <RefreshCw className="h-4 w-4" />
                        </IconButton>
                        <IconButton label="Export Markdown" onClick={exportMarkdown}>
                          <FileDown className="h-4 w-4" />
                        </IconButton>
                        <IconButton label="Export TXT" onClick={exportTxt}>
                          <Download className="h-4 w-4" />
                        </IconButton>
                      </div>
                    }
                  >
                    <MarkdownPreview
                      className="min-h-[440px] rounded-lg border border-border bg-white p-4"
                      emptyText="Your refined draft will appear here after generation."
                      markdown={refined}
                    />
                  </WritingPanel>
                </div>
              </form>
            </div>
          </section>

          {/* Analysis + Side Rail */}
          <section id="analysis" className="border-b border-border bg-bg py-8">
            <div className="mx-auto max-w-[1280px] px-6">
              <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
                <AnalysisSection metrics={metrics} hasGenerated={hasGenerated} />
                <SideRail
                  recentDrafts={recentDrafts}
                  versions={versions}
                  optimizer={optimizer}
                  onLoadDraft={loadDraft}
                  onRestoreVersion={restoreVersion}
                />
              </div>
            </div>
          </section>

          {/* Before vs After */}
      <section className="border-b border-border bg-white py-10">
        <div className="mx-auto max-w-[1200px] px-6">
          <SectionHeader
            eyebrow="Before vs After"
            title="See the transformation."
            body="The split view keeps the original meaning visible while highlighting what changed: stronger hooks, cleaner transitions, less robotic phrasing."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <ComparisonColumn label="Original Draft" text={original || sampleDraft} />
            <ComparisonColumn label="Redrafto Version" text={refined || sampleRefined} refined />
          </div>
        </div>
      </section>

      {/* Insights */}
      <section className="border-b border-border bg-bg py-10">
        <div className="mx-auto max-w-[1200px] px-6">
          <SectionHeader
            eyebrow="Writing Insights"
            title="Useful signals, not a noisy dashboard."
            body="Scores are intentionally simple: enough context to guide a final edit."
          />
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {insights.map((insight) => (
              <InsightCard key={insight.label} insight={insight} />
            ))}
          </div>
        </div>
      </section>

      {/* Examples */}
      <section id="examples" className="border-b border-border bg-white py-10">
        <div className="mx-auto max-w-[1200px] px-6">
          <SectionHeader
            eyebrow="Example Transformations"
            title="Realistic drafts, sharper final copy."
            body="Redrafto is tuned for creators who need publication quality across Medium, LinkedIn, developer blogs, newsletters, and founder essays."
          />
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {examples.map((example) => (
              <ExampleCard key={example.title} example={example} />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-b border-border bg-bg py-10">
        <div className="mx-auto max-w-[1200px] px-6">
          <SectionHeader
            eyebrow="Pricing"
            title="Simple plans for serious creators."
            body="Start with short refinements, move into long-form publishing, or keep Redrafto in your permanent writing stack."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {pricingPlans.map((plan) => (
              <PricingCard key={plan.name} plan={plan} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-6">
        <div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-3 px-6 text-sm text-muted md:flex-row md:items-center">
          <div className="flex items-center gap-2 font-semibold text-ink">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-ink text-xs text-white">
              R
            </span>
            Redrafto
          </div>
          <p>From AI Draft to Authentic Writing.</p>
        </div>
      </footer>
    </main>
  );
}

/* ── Sub-components ── */

function SiteHeader({
  lastSavedAt,
  formatTimestamp
}: {
  lastSavedAt: number | undefined;
  formatTimestamp: (t: number) => string;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-6">
        <a className="flex items-center gap-2 font-bold text-ink" href="#">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-sm text-white">
            R
          </span>
          Redrafto
        </a>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted md:flex">
          <a className="hover:text-ink transition-colors" href="#workspace">Workspace</a>
          <a className="hover:text-ink transition-colors" href="#examples">Examples</a>
          <a className="hover:text-ink transition-colors" href="#pricing">Pricing</a>
        </nav>
        <div className="flex items-center gap-3 text-xs text-muted">
          <Save className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">
            {lastSavedAt ? `Saved ${formatTimestamp(lastSavedAt)}` : "Autosave ready"}
          </span>
          <Button asChild size="sm">
            <a href="#workspace">Start Writing</a>
          </Button>
        </div>
      </div>
    </header>
  );
}

function ControlsBar({
  platform,
  tone,
  level,
  register,
  platforms,
  tones,
  levels,
  setValue,
  setPlatform,
  setTone,
  setLevel,
  levelToIndex
}: {
  platform: Platform;
  tone: Tone;
  level: RefinementLevel;
  register: UseFormRegister<ControlsForm>;
  platforms: readonly { value: Platform; label: string }[];
  tones: readonly { value: Tone; label: string }[];
  levels: readonly { value: RefinementLevel; label: string }[];
  setValue: UseFormSetValue<ControlsForm>;
  setPlatform: (v: Platform) => void;
  setTone: (v: Tone) => void;
  setLevel: (v: RefinementLevel) => void;
  levelToIndex: (v: RefinementLevel) => number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface p-3 shadow-sm">
      <div className="flex items-center gap-2 rounded-lg px-2 py-1">
        <SlidersHorizontal className="h-4 w-4 text-action" />
        <span className="text-xs font-semibold text-ink">Refine Settings</span>
      </div>

      <span className="h-4 w-px bg-border" />

      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-semibold text-muted">Platform:</span>
        <div className="flex gap-1">
          {platforms.map((item) => {
            const field = register("platform");
            return (
              <label
                className={cn(
                  "cursor-pointer rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors",
                  platform === item.value
                    ? "border-action bg-white text-action shadow-sm"
                    : "border-border bg-white text-muted hover:text-ink"
                )}
                key={item.value}
              >
                <input
                  className="sr-only"
                  type="radio"
                  value={item.value}
                  name={field.name}
                  ref={field.ref}
                  checked={platform === item.value}
                  onBlur={field.onBlur}
                  onChange={() => {
                    setValue("platform", item.value);
                    setPlatform(item.value);
                  }}
                />
                {item.label}
              </label>
            );
          })}
        </div>
      </div>

      <span className="h-4 w-px bg-border" />

      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-semibold text-muted">Tone:</span>
        <select
          className="rounded-md border border-border bg-white px-2 py-1 text-[11px] font-semibold text-ink"
          value={tone}
          {...register("tone")}
          onChange={(e) => {
            const next = e.target.value as Tone;
            setValue("tone", next);
            setTone(next);
          }}
        >
          {tones.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      </div>

      <span className="h-4 w-px bg-border" />

      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-semibold text-muted">Level:</span>
        <select
          className="rounded-md border border-border bg-white px-2 py-1 text-[11px] font-semibold text-ink"
          value={levelToIndex(level)}
          {...register("levelIndex", { valueAsNumber: true })}
          onChange={(event) => {
            const next = levels[Number(event.target.value)]?.value ?? "balanced";
            setValue("levelIndex", Number(event.target.value));
            setLevel(next);
          }}
        >
          {levels.map((item, i) => (
            <option key={item.value} value={i}>{item.label}</option>
          ))}
        </select>
      </div>

      <div className="ml-auto">
        <Button size="sm" type="submit">
          <NotebookPen className="h-4 w-4" />
          Redraft
        </Button>
      </div>
    </div>
  );
}

function ComparisonSnippet({
  indicator,
  indicatorColor,
  body,
  muted
}: {
  indicator: string;
  indicatorColor: string;
  body: string;
  muted?: boolean;
}) {
  return (
    <div className={cn("h-full", muted && "text-muted")}>
      <div className="mb-3 flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full", indicatorColor)} />
        <span className="text-[11px] font-semibold">{indicator}</span>
      </div>
      <div className="space-y-3 text-[13px] leading-6">
        {splitParagraphs(body)
          .slice(0, 3)
          .map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
      </div>
    </div>
  );
}

function WritingPanel({
  title,
  stats,
  action,
  children
}: {
  title: string;
  stats: ReturnType<typeof getWritingStats>;
  action: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          <span className="h-3 w-px bg-border" />
          <span className="text-[11px] text-muted">
            {stats.words} words &middot; {stats.readingTime}
          </span>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function IconButton({
  label,
  onClick,
  children
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="h-8 w-8"
    >
      {children}
    </Button>
  );
}

function AnalysisSection({
  metrics,
  hasGenerated
}: {
  metrics: ReturnType<typeof useRedraftoStore.getState>["metrics"];
  hasGenerated: boolean;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white">
          <BookOpenText className="h-4 w-4 text-action" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Writing Metrics</h3>
          <p className="text-xs text-muted">
            {hasGenerated ? "Generated from the current refinement" : "Ready after generation"}
          </p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {metrics.map((metric) => (
          <div className="rounded-lg border border-border bg-white p-4" key={metric.label}>
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{metric.label}</p>
                <p className="mt-0.5 text-xs leading-5 text-muted">{metric.detail}</p>
              </div>
              <span className="text-lg font-bold tabular-nums">{metric.value}</span>
            </div>
            <Progress value={metric.lowerIsBetter ? 100 - metric.value : metric.value} />
          </div>
        ))}
      </div>
    </section>
  );
}

function SideRail({
  recentDrafts,
  versions,
  optimizer,
  onLoadDraft,
  onRestoreVersion
}: {
  recentDrafts: ReturnType<typeof useRedraftoStore.getState>["recentDrafts"];
  versions: ReturnType<typeof useRedraftoStore.getState>["versions"];
  optimizer: ReturnType<typeof useRedraftoStore.getState>["optimizer"];
  onLoadDraft: ReturnType<typeof useRedraftoStore.getState>["loadDraft"];
  onRestoreVersion: ReturnType<typeof useRedraftoStore.getState>["restoreVersion"];
}) {
  return (
    <aside className="space-y-4">
      <RailPanel icon={<Send className="h-4 w-4 text-action" />} title="Platform Optimizer">
        <div className="space-y-2">
          {optimizer.map((item) => (
            <div className="rounded-lg border border-border bg-white p-3" key={item.label}>
              <p className="text-xs font-semibold">{item.label}</p>
              <p className="mt-1 text-xs leading-5 text-muted">{item.value}</p>
            </div>
          ))}
        </div>
      </RailPanel>

      <RailPanel icon={<Clipboard className="h-4 w-4 text-action" />} title="Recent Drafts">
        {recentDrafts.length > 0 ? (
          <div className="space-y-2">
            {recentDrafts.map((draft) => (
              <button
                className="w-full rounded-lg border border-border bg-white p-3 text-left transition-colors hover:border-gray-300"
                key={draft.id}
                type="button"
                onClick={() => onLoadDraft(draft)}
              >
                <p className="line-clamp-1 text-xs font-semibold">{draft.title}</p>
                <p className="mt-1 text-[11px] text-muted">
                  {platformLabel(draft.platform)} / {formatTimestamp(draft.updatedAt)}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs leading-5 text-muted">Saved drafts appear here automatically.</p>
        )}
      </RailPanel>

      <RailPanel icon={<History className="h-4 w-4 text-action" />} title="Version History">
        {versions.length > 0 ? (
          <div className="space-y-2">
            {versions.map((version) => (
              <button
                className="w-full rounded-lg border border-border bg-white p-3 text-left transition-colors hover:border-gray-300"
                key={version.id}
                type="button"
                onClick={() => onRestoreVersion(version)}
              >
                <p className="text-xs font-semibold">{version.label}</p>
                <p className="mt-1 text-[11px] text-muted">{formatTimestamp(version.createdAt)}</p>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs leading-5 text-muted">Generated versions will collect here.</p>
        )}
      </RailPanel>
    </aside>
  );
}

function RailPanel({
  icon,
  title,
  children
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-white">
          {icon}
        </div>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  body
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-action">{eyebrow}</p>
      <h2 className="mt-1.5 text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
    </div>
  );
}

function ComparisonColumn({
  label,
  text,
  refined
}: {
  label: string;
  text: string;
  refined?: boolean;
}) {
  const highlights = refined
    ? ["Better hooks", "Improved transitions", "Reduced robotic language"]
    : ["Original meaning", "Source claims", "Author intent"];

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{label}</h3>
        <div className="flex gap-1.5">
          {highlights.map((highlight) => (
            <span
              className="rounded-md border border-border bg-white px-2 py-0.5 text-[11px] font-semibold text-muted"
              key={highlight}
            >
              {highlight}
            </span>
          ))}
        </div>
      </div>
      <MarkdownPreview
        className="max-h-[480px] overflow-hidden rounded-lg border border-border bg-white p-4"
        markdown={text}
      />
    </div>
  );
}

function EditorToolbar({ editor }: { editor: Editor | null }) {
  return (
    <div className="mb-3 flex flex-wrap gap-1 rounded-lg border border-border bg-white p-1.5">
      <ToolbarButton
        active={editor?.isActive("heading", { level: 1 })}
        disabled={!editor}
        label="Heading 1"
        onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor?.isActive("heading", { level: 2 })}
        disabled={!editor}
        label="Heading 2"
        onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <span className="mx-0.5 h-5 w-px self-center bg-border" />
      <ToolbarButton
        active={editor?.isActive("bold")}
        disabled={!editor}
        label="Bold"
        onClick={() => editor?.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor?.isActive("italic")}
        disabled={!editor}
        label="Italic"
        onClick={() => editor?.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <span className="mx-0.5 h-5 w-px self-center bg-border" />
      <ToolbarButton
        active={editor?.isActive("code")}
        disabled={!editor}
        label="Inline code"
        onClick={() => editor?.chain().focus().toggleCode().run()}
      >
        <Code2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor?.isActive("bulletList")}
        disabled={!editor}
        label="Bullet list"
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor?.isActive("orderedList")}
        disabled={!editor}
        label="Numbered list"
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor?.isActive("blockquote")}
        disabled={!editor}
        label="Quote"
        onClick={() => editor?.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor?.isActive("codeBlock")}
        disabled={!editor}
        label="Code block"
        onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
      >
        <Code2 className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}

function ToolbarButton({
  active,
  children,
  disabled,
  label,
  onClick
}: {
  active?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md border text-muted transition-colors",
        active
          ? "border-ink bg-ink text-white"
          : "border-transparent hover:bg-accent hover:text-ink"
      )}
      disabled={disabled}
      title={label}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function MarkdownPreview({
  className,
  emptyText,
  markdown
}: {
  className?: string;
  emptyText?: string;
  markdown: string;
}) {
  if (!markdown.trim()) {
    return (
      <article className={cn("writing-preview", className)}>
        <p className="text-sm text-muted">{emptyText ?? "No content yet."}</p>
      </article>
    );
  }

  return (
    <article
      className={cn("writing-preview", className)}
      dangerouslySetInnerHTML={{ __html: markdownToHtml(markdown) }}
    />
  );
}

function InsightCard({ insight }: { insight: { label: string; value: string; detail: string } }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <p className="text-xs font-semibold text-muted">{insight.label}</p>
      <p className="mt-1.5 text-2xl font-bold tabular-nums">{insight.value}</p>
      <p className="mt-1.5 text-xs leading-5 text-muted">{insight.detail}</p>
    </div>
  );
}

function ExampleCard({
  example
}: {
  example: { title: string; platform: string; before: string; after: string };
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{example.title}</h3>
        <span className="rounded-md border border-border bg-white px-2 py-0.5 text-[11px] font-semibold text-muted">
          {example.platform}
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <MiniDraft label="Before" text={example.before} muted />
        <MiniDraft label="After" text={example.after} />
      </div>
    </div>
  );
}

function MiniDraft({
  label,
  text,
  muted
}: {
  label: string;
  text: string;
  muted?: boolean;
}) {
  return (
    <div className={cn("rounded-lg border border-border p-3", muted ? "bg-white" : "bg-white")}>
      <p className="mb-2 text-[11px] font-semibold uppercase text-muted">{label}</p>
      <p className={cn("text-xs leading-5", muted ? "text-muted" : "text-ink")}>{text}</p>
    </div>
  );
}

function PricingCard({
  plan
}: {
  plan: { name: string; price: string; description: string; features: string[] };
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-surface p-6 shadow-sm",
        plan.name === "Pro" ? "border-ink" : "border-border"
      )}
    >
      <h3 className="text-sm font-semibold">{plan.name}</h3>
      <p className="mt-1 text-xs leading-5 text-muted">{plan.description}</p>
      <p className="mt-5 text-3xl font-bold tabular-nums">{plan.price}</p>
      <ul className="mt-5 space-y-2.5">
        {plan.features.map((feature) => (
          <li className="flex gap-2.5 text-xs text-muted" key={feature}>
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Button
        className="mt-6 w-full"
        variant={plan.name === "Pro" ? "primary" : "secondary"}
        size="sm"
        type="button"
      >
        {plan.name === "Free" ? "Start Free" : "Choose Plan"}
      </Button>
    </div>
  );
}
