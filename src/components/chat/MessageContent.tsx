import React from 'react';
import { useLLMOutput, useStreamExample } from '@llm-ui/react';
import { markdownLookBack } from '@llm-ui/markdown';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageContentProps {
  content: string;
  isUser: boolean;
}

export function MessageContent({ content, isUser }: MessageContentProps) {
  if (isUser) {
    return (
      <div className="markdown-content">
         <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    );
  }

  // Simulate streaming for assistant messages
  // in a real streaming app, you would pass the streaming content directly
  const { output, isStreamFinished } = useStreamExample(content, {
    autoStart: true,
    delayMultiplier: 0.25, // Faster streaming (was 0.4, 1.6x faster is ~0.25)
  });

  const { blockMatches } = useLLMOutput({
    llmOutput: output,
    fallbackBlock: {
      component: ({ blockMatch }) => (
        <div className="markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {blockMatch.visibleText}
            </ReactMarkdown>
        </div>
      ),
      lookBack: markdownLookBack(),
    },
    isStreamFinished,
  });

  return (
    <>
      {blockMatches.map((blockMatch, index) => {
        const Component = blockMatch.block.component;
        return <Component key={index} blockMatch={blockMatch} />;
      })}
    </>
  );
}

