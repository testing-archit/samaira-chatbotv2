'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// rehype-raw intentionally NOT used — it would allow arbitrary HTML from AI output (XSS risk).
// Instead we use a custom component approach for the [coming_soon] badge.

const COMING_SOON_REGEX = /\[coming_soon\]/gi;

// Split content into text segments and badge markers so we never inject raw HTML.
function parseBadges(text: string): Array<{ type: 'text' | 'badge'; value: string }> {
  const parts: Array<{ type: 'text' | 'badge'; value: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(COMING_SOON_REGEX.source, 'gi');
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'badge', value: 'Coming Soon' });
    lastIndex = re.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }
  return parts;
}

// Custom renderer for paragraph text nodes — injects the Coming Soon badge safely via React.
function TextWithBadges({ children }: { children: string }) {
  const segments = parseBadges(children);
  if (segments.length === 1 && segments[0].type === 'text') return <>{children}</>;
  return (
    <>
      {segments.map((seg, i) =>
        seg.type === 'badge' ? (
          <span key={i} className="badge-coming-soon">{seg.value}</span>
        ) : (
          <span key={i}>{seg.value}</span>
        )
      )}
    </>
  );
}

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Intercept text nodes to render badges safely without raw HTML
        p: ({ children }) => (
          <p>
            {typeof children === 'string'
              ? <TextWithBadges>{children}</TextWithBadges>
              : children}
          </p>
        ),
        table: ({ node, ...props }) => (
          <div className="table-responsive">
            <table {...props} />
          </div>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
