"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useForm } from "react-hook-form";
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
  PenLine,
  Quote,
  RefreshCw,
  Save,
  Send,
  SlidersHorizontal
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

const fadeIn = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.45, ease: "easeOut" as const }
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
    toggleOption,
    redraft,
    saveDraft,
    loadDraft,
    restoreVersion,
    clear
  } = useRedraftoStore();
  const [comparePosition, setComparePosition] = useState(55);

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

  const handleEditorPaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const pastedText = event.clipboardData.getData("text/plain");

    if (!editor || !looksLikeMarkdown(pastedText)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    editor.chain().focus().insertContent(markdownToHtml(pastedText)).run();
  };

  const onSubmit = () => runRedraft();

  return (
    <main className="min-h-screen bg-background text-ink">
      <Toaster position="top-right" richColors />
      <SiteHeader />

      <section className="border-b border-border bg-white">
        <div className="mx-auto grid max-w-[1200px] gap-12 px-6 py-16 md:px-8 md:py-20 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <motion.div {...fadeIn}>
            <p className="mb-5 inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-muted">
              <PenLine className="h-4 w-4 text-action" />
              From AI Draft to Authentic Writing.
            </p>
            <h1 className="max-w-3xl text-[clamp(3rem,7vw,4rem)] font-bold leading-[1.02] text-ink">
              Make AI Content Sound Human Again
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
              Transform AI-generated Medium articles, LinkedIn posts, blogs, and
              newsletters into authentic content that readers trust and engage with.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <a href="#workspace">
                  Start Writing
                  <ArrowDown className="h-4 w-4" />
                </a>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <a href="#examples">
                  View Example
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </motion.div>

          <motion.div
            {...fadeIn}
            transition={{ duration: 0.5, delay: 0.08, ease: "easeOut" }}
            className="paper-grid rounded-lg border border-border bg-white p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between border-b border-border pb-3">
              <div>
                <p className="text-sm font-semibold text-ink">Live comparison</p>
                <p className="text-sm text-muted">AI draft to Redrafto output</p>
              </div>
              <span className="rounded-md bg-surface px-2.5 py-1 text-xs font-semibold text-muted">
                {comparePosition}% refined
              </span>
            </div>
            <div className="relative min-h-[390px] overflow-hidden rounded-md border border-border bg-white">
              <div className="absolute inset-0 p-6">
                <Snippet
                  eyebrow="AI Draft"
                  title="Generic draft"
                  body={sampleDraft}
                  muted
                />
              </div>
              <div
                className="absolute inset-0 overflow-hidden border-r border-action bg-white"
                style={{ clipPath: `inset(0 ${100 - comparePosition}% 0 0)` }}
              >
                <div className="w-[calc(100vw-3rem)] max-w-[552px] p-6">
                  <Snippet
                    eyebrow="Redrafto Output"
                    title="Publication-ready"
                    body={sampleRefined}
                  />
                </div>
              </div>
            </div>
            <label className="mt-4 block">
              <span className="sr-only">Adjust comparison</span>
              <input
                className="w-full accent-action"
                type="range"
                min="25"
                max="85"
                value={comparePosition}
                onChange={(event) => setComparePosition(Number(event.target.value))}
              />
            </label>
          </motion.div>
        </div>
      </section>

      <section id="workspace" className="border-b border-border bg-white py-12 md:py-16">
        <div className="mx-auto max-w-[1400px] px-4 md:px-8">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase text-action">Writing workspace</p>
              <h2 className="mt-2 text-3xl font-bold md:text-4xl">
                Refine before you publish.
              </h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted">
              <Save className="h-4 w-4" />
              <span>
                {lastSavedAt ? `Autosaved ${formatTimestamp(lastSavedAt)}` : "Autosave ready"}
              </span>
            </div>
          </div>

          <form
            className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px_minmax(0,1fr)]"
            onSubmit={handleSubmit(onSubmit)}
          >
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
              <div
                className="medium-writing-surface markdown-body writing-preview min-h-[520px] rounded-md border border-border bg-white p-5"
                onPaste={handleEditorPaste}
              >
                <EditorContent editor={editor} />
              </div>
            </WritingPanel>

            <section className="rounded-lg border border-border bg-surface p-4">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-white">
                  <SlidersHorizontal className="h-5 w-5 text-action" />
                </div>
                <div>
                  <h3 className="font-semibold text-ink">Refinement Controls</h3>
                  <p className="text-sm text-muted">{platformLabel(platform)} / {tone}</p>
                </div>
              </div>

              <ControlGroup title="Platform">
                <div className="grid grid-cols-2 gap-2">
                  {platforms.map((item) => {
                    const field = register("platform");
                    return (
                      <label
                        className={cn(
                          "cursor-pointer rounded-md border px-3 py-2 text-sm font-semibold transition-colors",
                          platform === item.value
                            ? "border-action bg-white text-action"
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
              </ControlGroup>

              <ControlGroup title="Tone">
                <div className="grid grid-cols-2 gap-2">
                  {tones.map((item) => {
                    const field = register("tone");
                    return (
                      <label
                        className={cn(
                          "cursor-pointer rounded-md border px-3 py-2 text-sm font-semibold transition-colors",
                          tone === item.value
                            ? "border-ink bg-ink text-white"
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
                          checked={tone === item.value}
                          onBlur={field.onBlur}
                          onChange={() => {
                            setValue("tone", item.value);
                            setTone(item.value);
                          }}
                        />
                        {item.label}
                      </label>
                    );
                  })}
                </div>
              </ControlGroup>

              <ControlGroup title="Refinement Level">
                <div className="rounded-md border border-border bg-white p-3">
                  <input
                    className="w-full accent-action"
                    type="range"
                    min="0"
                    max="2"
                    step="1"
                    value={levelToIndex(level)}
                    {...register("levelIndex", { valueAsNumber: true })}
                    onChange={(event) => {
                      const next = levels[Number(event.target.value)]?.value ?? "balanced";
                      setValue("levelIndex", Number(event.target.value));
                      setLevel(next);
                    }}
                  />
                  <div className="mt-2 grid grid-cols-3 text-xs font-semibold text-muted">
                    {levels.map((item) => (
                      <span
                        className={cn(item.value === level && "text-action", "text-center")}
                        key={item.value}
                      >
                        {item.label}
                      </span>
                    ))}
                  </div>
                </div>
              </ControlGroup>

              <ControlGroup title="Additional Options">
                <div className="space-y-2">
                  {optionLabels.map((item) => {
                    const name = `options.${item.value}` as `options.${OptionKey}`;
                    const field = register(name);
                    return (
                      <label
                        className="flex cursor-pointer items-center gap-3 rounded-md border border-border bg-white px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-ink"
                        key={item.value}
                      >
                        <input
                          className="sr-only"
                          type="checkbox"
                          name={field.name}
                          ref={field.ref}
                          checked={options[item.value]}
                          onBlur={field.onBlur}
                          onChange={() => {
                            setValue(name, !options[item.value]);
                            toggleOption(item.value);
                          }}
                        />
                        <span
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded border",
                            options[item.value]
                              ? "border-action bg-action text-white"
                              : "border-border bg-white"
                          )}
                        >
                          {options[item.value] ? <Check className="h-3.5 w-3.5" /> : null}
                        </span>
                        {item.label}
                      </label>
                    );
                  })}
                </div>
              </ControlGroup>

              <Button className="mt-5 w-full" size="lg" type="submit">
                <NotebookPen className="h-4 w-4" />
                Redraft Content
              </Button>
            </section>

            <WritingPanel
              title="Refined Content"
              stats={refinedStats}
              action={
                <div className="flex flex-wrap gap-2">
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
                className="medium-writing-surface min-h-[520px] rounded-md border border-border bg-white p-5"
                emptyText="Your refined draft will appear here after generation."
                markdown={refined}
              />
            </WritingPanel>
          </form>
        </div>
      </section>

      <section className="border-b border-border bg-surface py-12 md:py-16">
        <div className="mx-auto grid max-w-[1400px] gap-6 px-4 md:px-8 xl:grid-cols-[1fr_420px]">
          <AnalysisSection metrics={metrics} hasGenerated={hasGenerated} />
          <SideRail
            recentDrafts={recentDrafts}
            versions={versions}
            optimizer={optimizer}
            onLoadDraft={loadDraft}
            onRestoreVersion={restoreVersion}
          />
        </div>
      </section>

      <section className="border-b border-border bg-white py-12 md:py-20">
        <div className="mx-auto max-w-[1200px] px-6 md:px-8">
          <SectionHeader
            eyebrow="Before vs After"
            title="A comparison view for editorial judgment."
            body="The split view keeps the original meaning visible while highlighting what changed: stronger hooks, cleaner transitions, less robotic phrasing, and a clearer flow."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <ComparisonColumn label="Original Draft" text={original || sampleDraft} />
            <ComparisonColumn label="Redrafto Version" text={refined || sampleRefined} refined />
          </div>
        </div>
      </section>

      <section id="pricing" className="border-b border-border bg-white py-12 md:py-20">
        <div className="mx-auto max-w-[1200px] px-6 md:px-8">
          <SectionHeader
            eyebrow="Writing Insights"
            title="Useful signals without a noisy dashboard."
            body="Scores are intentionally simple: enough context to guide a final edit without pretending writing can be reduced to a chart."
          />
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {insights.map((insight) => (
              <div className="rounded-lg border border-border bg-surface p-4" key={insight.label}>
                <p className="text-sm font-semibold text-muted">{insight.label}</p>
                <p className="mt-2 text-2xl font-bold">{insight.value}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{insight.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="examples" className="border-b border-border bg-surface py-12 md:py-20">
        <div className="mx-auto max-w-[1200px] px-6 md:px-8">
          <SectionHeader
            eyebrow="Example Transformations"
            title="Realistic drafts, sharper final copy."
            body="Redrafto is tuned for creators who need publication quality across Medium, LinkedIn, developer blogs, newsletters, and founder essays."
          />
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {examples.map((example) => (
              <div className="rounded-lg border border-border bg-white p-5" key={example.title}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold">{example.title}</h3>
                  <span className="rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-muted">
                    {example.platform}
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <MiniDraft label="Before" text={example.before} muted />
                  <MiniDraft label="After" text={example.after} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-white py-12 md:py-20">
        <div className="mx-auto max-w-[1200px] px-6 md:px-8">
          <SectionHeader
            eyebrow="Pricing"
            title="Simple plans for serious creators."
            body="Start with short refinements, move into long-form publishing, or keep Redrafto in your permanent writing stack."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div
                className={cn(
                  "rounded-lg border bg-white p-6",
                  plan.name === "Pro" ? "border-ink shadow-sm" : "border-border"
                )}
                key={plan.name}
              >
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-muted">{plan.description}</p>
                <p className="mt-6 text-4xl font-bold">{plan.price}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li className="flex gap-3 text-sm text-muted" key={feature}>
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-6 w-full"
                  variant={plan.name === "Pro" ? "primary" : "secondary"}
                  type="button"
                >
                  {plan.name === "Free" ? "Start Free" : "Choose Plan"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-white py-8">
        <div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-4 px-6 text-sm text-muted md:flex-row md:items-center md:px-8">
          <div className="flex items-center gap-2 font-semibold text-ink">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-ink text-white">
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

function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6 md:px-8">
        <a className="flex items-center gap-2 font-bold text-ink" href="#">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-ink text-white">
            R
          </span>
          Redrafto
        </a>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-muted md:flex">
          <a className="hover:text-ink" href="#workspace">
            Workspace
          </a>
          <a className="hover:text-ink" href="#examples">
            Examples
          </a>
          <a className="hover:text-ink" href="#pricing">
            Pricing
          </a>
        </nav>
        <Button asChild size="sm">
          <a href="#workspace">Start Writing</a>
        </Button>
      </div>
    </header>
  );
}

function Snippet({
  eyebrow,
  title,
  body,
  muted
}: {
  eyebrow: string;
  title: string;
  body: string;
  muted?: boolean;
}) {
  return (
    <div className={cn("h-full", muted && "text-muted")}>
      <div className="mb-5 flex items-center gap-2">
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full",
            muted ? "bg-warning" : "bg-success"
          )}
        />
        <p className="text-sm font-semibold">{eyebrow}</p>
      </div>
      <h3 className="text-xl font-semibold text-ink">{title}</h3>
      <div className="mt-5 space-y-4 text-[15px] leading-7">
        {splitParagraphs(body)
          .slice(0, 3)
          .map((paragraph, index) => (
            <p key={`${eyebrow}-${index}`}>{paragraph}</p>
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
    <section className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h3 className="text-xl font-semibold">{title}</h3>
          <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-muted">
            <span className="rounded-md border border-border bg-white px-2 py-1">
              {stats.characters} chars
            </span>
            <span className="rounded-md border border-border bg-white px-2 py-1">
              {stats.words} words
            </span>
            <span className="rounded-md border border-border bg-white px-2 py-1">
              {stats.readingTime}
            </span>
          </div>
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
      variant="secondary"
      size="icon"
      title={label}
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function ControlGroup({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="mt-5">
      <legend className="mb-2 text-sm font-semibold text-ink">{title}</legend>
      {children}
    </fieldset>
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
    <section className="rounded-lg border border-border bg-white p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface">
          <BookOpenText className="h-5 w-5 text-action" />
        </div>
        <div>
          <h3 className="text-xl font-semibold">Writing Metrics</h3>
          <p className="text-sm text-muted">
            {hasGenerated ? "Generated from the current refinement" : "Ready after generation"}
          </p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {metrics.map((metric) => (
          <div className="rounded-lg border border-border bg-surface p-4" key={metric.label}>
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{metric.label}</p>
                <p className="mt-1 text-sm leading-5 text-muted">{metric.detail}</p>
              </div>
              <span className="text-xl font-bold">{metric.value}</span>
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
      <RailPanel icon={<Send className="h-5 w-5 text-action" />} title="Platform Optimizer">
        <div className="space-y-3">
          {optimizer.map((item) => (
            <div className="rounded-md border border-border bg-surface p-3" key={item.label}>
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{item.value}</p>
            </div>
          ))}
        </div>
      </RailPanel>

      <RailPanel icon={<Clipboard className="h-5 w-5 text-action" />} title="Recent Drafts">
        {recentDrafts.length > 0 ? (
          <div className="space-y-2">
            {recentDrafts.map((draft) => (
              <button
                className="w-full rounded-md border border-border bg-surface p-3 text-left transition-colors hover:border-gray-300 hover:bg-white"
                key={draft.id}
                type="button"
                onClick={() => onLoadDraft(draft)}
              >
                <p className="line-clamp-1 text-sm font-semibold">{draft.title}</p>
                <p className="mt-1 text-xs text-muted">
                  {platformLabel(draft.platform)} / {formatTimestamp(draft.updatedAt)}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm leading-6 text-muted">Saved drafts appear here automatically.</p>
        )}
      </RailPanel>

      <RailPanel icon={<History className="h-5 w-5 text-action" />} title="Version History">
        {versions.length > 0 ? (
          <div className="space-y-2">
            {versions.map((version) => (
              <button
                className="w-full rounded-md border border-border bg-surface p-3 text-left transition-colors hover:border-gray-300 hover:bg-white"
                key={version.id}
                type="button"
                onClick={() => onRestoreVersion(version)}
              >
                <p className="text-sm font-semibold">{version.label}</p>
                <p className="mt-1 text-xs text-muted">{formatTimestamp(version.createdAt)}</p>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm leading-6 text-muted">Generated versions will collect here.</p>
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
    <section className="rounded-lg border border-border bg-white p-4">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface">
          {icon}
        </div>
        <h3 className="font-semibold">{title}</h3>
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
    <motion.div {...fadeIn} className="max-w-3xl">
      <p className="text-sm font-semibold uppercase text-action">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold md:text-4xl">{title}</h2>
      <p className="mt-4 text-lg leading-8 text-muted">{body}</p>
    </motion.div>
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
    ? ["Better hooks", "Improved transitions", "Reduced robotic language", "Better storytelling", "Improved flow"]
    : ["Original meaning", "Source claims", "Author intent", "Raw structure", "Draft context"];

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-semibold">{label}</h3>
        <div className="flex flex-wrap gap-2">
          {highlights.slice(0, 3).map((highlight) => (
            <span
              className="rounded-md border border-border bg-white px-2 py-1 text-xs font-semibold text-muted"
              key={highlight}
            >
              {highlight}
            </span>
          ))}
        </div>
      </div>
      <MarkdownPreview
        className="max-h-[560px] overflow-hidden rounded-md border border-border bg-white p-5"
        markdown={text}
      />
    </div>
  );
}

function EditorToolbar({ editor }: { editor: Editor | null }) {
  return (
    <div className="mb-3 flex flex-wrap gap-2 rounded-md border border-border bg-white p-2">
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
        "flex h-9 w-9 items-center justify-center rounded-md border text-muted transition-colors",
        active ? "border-ink bg-ink text-white" : "border-border bg-surface hover:text-ink"
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
      <article className={cn("markdown-body writing-preview", className)}>
        <p className="text-muted">{emptyText ?? "No content yet."}</p>
      </article>
    );
  }

  return (
    <article
      className={cn("markdown-body writing-preview", className)}
      dangerouslySetInnerHTML={{ __html: markdownToHtml(markdown) }}
    />
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
    <div className={cn("rounded-md border border-border bg-surface p-4", muted && "bg-white")}>
      <p className="mb-3 text-xs font-semibold uppercase text-muted">{label}</p>
      <p className="text-sm leading-6 text-muted">{text}</p>
    </div>
  );
}
