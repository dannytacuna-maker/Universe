import { Fragment, type ReactNode } from "react";

type JarvisMarkdownProps = Readonly<{
  text: string;
}>;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
  let lastIndex = 0;
  let match = pattern.exec(text);
  let partIndex = 0;

  while (match !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    if (match[2] !== undefined) {
      nodes.push(
        <strong key={`${keyPrefix}-b-${partIndex}`}>{match[2]}</strong>,
      );
    } else if (match[3] !== undefined) {
      nodes.push(<em key={`${keyPrefix}-i-${partIndex}`}>{match[3]}</em>);
    } else if (match[4] !== undefined) {
      nodes.push(<code key={`${keyPrefix}-c-${partIndex}`}>{match[4]}</code>);
    }

    lastIndex = match.index + match[0].length;
    partIndex += 1;
    match = pattern.exec(text);
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function normalizeMarkdownNoise(text: string) {
  return text
    .replace(/\*{3,}/g, "")
    .replace(/(^|\n)\s*\*\s+/g, "$1- ")
    .trim();
}

export function JarvisMarkdown({ text }: JarvisMarkdownProps) {
  const normalized = normalizeMarkdownNoise(text);
  if (normalized.length === 0) {
    return null;
  }

  const blocks = normalized.split(/\n{2,}/);
  const elements: ReactNode[] = [];

  blocks.forEach((block, blockIndex) => {
    const lines = block.split("\n");
    const isList = lines.every(
      (line) => /^\s*[-•]\s+/.test(line) || line.trim().length === 0,
    );

    if (isList) {
      const items = lines
        .map((line) => line.replace(/^\s*[-•]\s+/, "").trim())
        .filter((line) => line.length > 0);

      elements.push(
        <ul key={`list-${blockIndex}`}>
          {items.map((item, itemIndex) => (
            <li key={`list-${blockIndex}-${itemIndex}`}>
              {renderInline(item, `l${blockIndex}-${itemIndex}`)}
            </li>
          ))}
        </ul>,
      );
      return;
    }

    elements.push(
      <p key={`p-${blockIndex}`}>
        {lines.map((line, lineIndex) => (
          <Fragment key={`p-${blockIndex}-line-${lineIndex}`}>
            {lineIndex > 0 ? <br /> : null}
            {renderInline(line, `p${blockIndex}-${lineIndex}`)}
          </Fragment>
        ))}
      </p>,
    );
  });

  return <>{elements}</>;
}
