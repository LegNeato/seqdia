"use client";

import { useEffect, useState } from "react";
import { codeToHtml } from "shiki";

interface CodeBlockProps {
  code: string;
  lang?: string;
}

export function CodeBlock({ code, lang = "tsx" }: CodeBlockProps) {
  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    codeToHtml(code.trim(), {
      lang,
      theme: "github-light",
    }).then(setHtml);
  }, [code, lang]);

  if (!html) {
    return (
      <pre className="whitespace-pre-wrap font-mono text-[11px] leading-6 text-muted-foreground">
        {code}
      </pre>
    );
  }

  return (
    <div
      className="[&_pre]:!bg-transparent [&_pre]:!p-0 [&_code]:text-[11px] [&_code]:leading-6"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
