type MarkdownBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "blockquote"; text: string }
  | { type: "code"; language: string; text: string }
  | { type: "list"; ordered: boolean; items: string[] };

type TipTapNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: Array<{ type?: string }>;
  content?: TipTapNode[];
};

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderInlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
}

function isFence(line: string) {
  return line.trim().startsWith("```");
}

function isHeading(line: string) {
  return /^#{1,3}\s+/.test(line.trim());
}

function isUnorderedList(line: string) {
  return /^[-*]\s+/.test(line.trim());
}

function isOrderedList(line: string) {
  return /^\d+\.\s+/.test(line.trim());
}

function isBlockquote(line: string) {
  return /^>\s?/.test(line.trim());
}

function parseMarkdown(markdown: string): MarkdownBlock[] {
  const lines = markdown.replace(/\r/g, "").split("\n");
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (isFence(line)) {
      const language = trimmed.replace(/^```/, "").trim();
      const code: string[] = [];
      index += 1;

      while (index < lines.length && !isFence(lines[index] ?? "")) {
        code.push(lines[index] ?? "");
        index += 1;
      }

      blocks.push({ type: "code", language, text: code.join("\n") });
      index += 1;
      continue;
    }

    if (isHeading(line)) {
      const match = trimmed.match(/^(#{1,3})\s+(.*)$/);
      blocks.push({
        type: "heading",
        level: match?.[1]?.length ?? 2,
        text: match?.[2] ?? trimmed
      });
      index += 1;
      continue;
    }

    if (isUnorderedList(line) || isOrderedList(line)) {
      const ordered = isOrderedList(line);
      const items: string[] = [];

      while (
        index < lines.length &&
        (ordered ? isOrderedList(lines[index] ?? "") : isUnorderedList(lines[index] ?? ""))
      ) {
        items.push((lines[index] ?? "").trim().replace(ordered ? /^\d+\.\s+/ : /^[-*]\s+/, ""));
        index += 1;
      }

      blocks.push({ type: "list", ordered, items });
      continue;
    }

    if (isBlockquote(line)) {
      const quotes: string[] = [];

      while (index < lines.length && isBlockquote(lines[index] ?? "")) {
        quotes.push((lines[index] ?? "").trim().replace(/^>\s?/, ""));
        index += 1;
      }

      blocks.push({ type: "blockquote", text: quotes.join(" ") });
      continue;
    }

    const paragraph: string[] = [];

    while (
      index < lines.length &&
      (lines[index] ?? "").trim() &&
      !isFence(lines[index] ?? "") &&
      !isHeading(lines[index] ?? "") &&
      !isUnorderedList(lines[index] ?? "") &&
      !isOrderedList(lines[index] ?? "") &&
      !isBlockquote(lines[index] ?? "")
    ) {
      paragraph.push((lines[index] ?? "").trim());
      index += 1;
    }

    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
  }

  return blocks;
}

export function markdownToHtml(markdown: string) {
  return parseMarkdown(markdown)
    .map((block) => {
      if (block.type === "heading") {
        const Tag = `h${Math.min(3, Math.max(1, block.level))}`;
        return `<${Tag}>${renderInlineMarkdown(block.text)}</${Tag}>`;
      }

      if (block.type === "code") {
        const language = block.language ? ` data-language="${escapeHtml(block.language)}"` : "";
        return `<pre${language}><code>${escapeHtml(block.text)}</code></pre>`;
      }

      if (block.type === "list") {
        const Tag = block.ordered ? "ol" : "ul";
        const items = block.items
          .map((item) => `<li>${renderInlineMarkdown(item)}</li>`)
          .join("");
        return `<${Tag}>${items}</${Tag}>`;
      }

      if (block.type === "blockquote") {
        return `<blockquote>${renderInlineMarkdown(block.text)}</blockquote>`;
      }

      return `<p>${renderInlineMarkdown(block.text)}</p>`;
    })
    .join("");
}

export function markdownToPlainText(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/^```[^\n]*\n?/, "").replace(/```$/, ""))
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1$2")
    .trim();
}

export function looksLikeMarkdown(value: string) {
  return (
    /^#{1,3}\s+\S/m.test(value) ||
    /^[-*]\s+\S/m.test(value) ||
    /^\d+\.\s+\S/m.test(value) ||
    /^>\s+\S/m.test(value) ||
    /```[\s\S]*```/.test(value) ||
    /\*\*[^*\n]+\*\*/.test(value) ||
    /`[^`\n]+`/.test(value)
  );
}

function inlineNodeToMarkdown(node: TipTapNode): string {
  if (node.type === "text") {
    let text = node.text ?? "";

    for (const mark of node.marks ?? []) {
      if (mark.type === "code") {
        text = `\`${text}\``;
      }

      if (mark.type === "bold") {
        text = `**${text}**`;
      }

      if (mark.type === "italic") {
        text = `*${text}*`;
      }
    }

    return text;
  }

  if (node.type === "hardBreak") {
    return "\n";
  }

  return (node.content ?? []).map(inlineNodeToMarkdown).join("");
}

function blockNodeToMarkdown(node: TipTapNode, listIndex?: number): string {
  const content = (node.content ?? []).map(inlineNodeToMarkdown).join("").trim();

  if (node.type === "heading") {
    const level = Number(node.attrs?.level ?? 2);
    return `${"#".repeat(Math.min(3, Math.max(1, level)))} ${content}`;
  }

  if (node.type === "codeBlock") {
    return `\`\`\`\n${content}\n\`\`\``;
  }

  if (node.type === "blockquote") {
    return (node.content ?? [])
      .map((child) => blockNodeToMarkdown(child))
      .join("\n")
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n");
  }

  if (node.type === "bulletList" || node.type === "orderedList") {
    return (node.content ?? [])
      .map((child, index) => blockNodeToMarkdown(child, node.type === "orderedList" ? index + 1 : undefined))
      .join("\n");
  }

  if (node.type === "listItem") {
    const childText = (node.content ?? [])
      .map((child) => blockNodeToMarkdown(child))
      .join(" ")
      .trim();
    return `${listIndex ? `${listIndex}.` : "-"} ${childText}`;
  }

  return content;
}

export function tiptapJsonToMarkdown(doc: TipTapNode) {
  return (doc.content ?? [])
    .map((node) => blockNodeToMarkdown(node))
    .filter(Boolean)
    .join("\n\n")
    .trim();
}
