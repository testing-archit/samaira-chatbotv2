import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

export default function MarkdownRenderer({ content }: { content: string }) {
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
      {content}
    </ReactMarkdown>
  );
}
