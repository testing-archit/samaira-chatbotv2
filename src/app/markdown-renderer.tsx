import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

export default function MarkdownRenderer({ content }: { content: string }) {
  // Pre-process the content to replace [coming_soon] tags with HTML spans
  const processedContent = content.replace(/\[coming_soon\]/gi, '<span class="badge-coming-soon">Coming Soon</span>');

  return (
    <ReactMarkdown 
      remarkPlugins={[remarkGfm]} 
      rehypePlugins={[rehypeRaw]}
      components={{
        table: ({node, ...props}) => (
          <div className="table-responsive">
            <table {...props} />
          </div>
        )
      }}
    >
      {processedContent}
    </ReactMarkdown>
  );
}
