import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function SvgDiagram({ code }: { code: string }) {
  const svg = code.trim();
  if (!svg.startsWith("<svg")) return <pre>{code}</pre>;
  const src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  return (
    <figure className="my-3 overflow-hidden rounded-xl border bg-card p-2">
      <img src={src} alt="Diagram from your tutor" className="mx-auto w-full max-w-md" />
    </figure>
  );
}

export function TutorMarkdown({ text }: { text: string }) {
  return (
    <div className="tutor-prose text-[15px]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children }) {
            const lang = /language-(\w+)/.exec(className ?? "")?.[1];
            const content = String(children);
            if (lang === "svg" || content.trim().startsWith("<svg")) return <SvgDiagram code={content} />;
            return <code className={className}>{children}</code>;
          },
          pre({ children }) {
            return <>{children}</>;
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

/** Text suitable for reading aloud: drops diagrams, code and markdown symbols. */
export function speakableText(md: string) {
  return md
    .replace(/```[\s\S]*?```/g, " (see the diagram) ")
    .replace(/[#*_`>|]/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}
