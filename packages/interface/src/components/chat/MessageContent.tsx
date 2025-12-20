import { useMemo, Fragment, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Source } from '@/lib/types';
import { SourceButton } from './SourceButton';

interface MessageContentProps {
  content: string;
  sources?: Source[];
  onSourceClick?: (source: Source) => void;
}

// Build a map of display names to sources for quick lookup
function buildSourceMap(sources: Source[]): Map<string, Source> {
  const map = new Map<string, Source>();
  sources.forEach((source) => {
    const displayName = source.source_filename.replace(/\.[^/.]+$/, '');
    if (!map.has(displayName)) {
      map.set(displayName, source);
    }
  });
  return map;
}

// Replace document name matches in text with clickable buttons
function replaceSourceReferences(
  text: string,
  sourceMap: Map<string, Source>,
  onSourceClick?: (source: Source) => void
): ReactNode[] {
  if (sourceMap.size === 0 || !onSourceClick) {
    return [text];
  }

  // Sort by length descending to match longer names first
  const displayNames = Array.from(sourceMap.keys()).sort((a, b) => b.length - a.length);
  
  // Create regex pattern to match any source name (case-insensitive)
  // Also capture surrounding quotes to remove them
  const pattern = new RegExp(
    `["'«»]?(${displayNames.map(name => escapeRegExp(name)).join('|')})["'«»]?`,
    'gi'
  );

  const parts = text.split(pattern);
  
  return parts.map((part, index) => {
    // Check if this part matches a source name (case-insensitive lookup)
    const matchedKey = displayNames.find(
      name => name.toLowerCase() === part.toLowerCase()
    );
    
    if (matchedKey) {
      const source = sourceMap.get(matchedKey)!;
      return (
        <SourceButton
          key={`${matchedKey}-${index}`}
          displayName={part}
          docId={source.doc_id}
          onClick={() => onSourceClick(source)}
        />
      );
    }
    
    return <Fragment key={index}>{part}</Fragment>;
  });
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function MessageContent({ content, sources, onSourceClick }: MessageContentProps) {
  const sourceMap = useMemo(() => {
    if (!sources || sources.length === 0) return new Map<string, Source>();
    return buildSourceMap(sources);
  }, [sources]);

  const components = useMemo(() => {
    if (sourceMap.size === 0) return undefined;

    return {
      // Custom text renderer to inject source buttons
      p: ({ children }: { children?: ReactNode }) => {
        return <p>{processChildren(children, sourceMap, onSourceClick)}</p>;
      },
      li: ({ children }: { children?: ReactNode }) => {
        return <li>{processChildren(children, sourceMap, onSourceClick)}</li>;
      },
      td: ({ children }: { children?: ReactNode }) => {
        return <td>{processChildren(children, sourceMap, onSourceClick)}</td>;
      },
    };
  }, [sourceMap, onSourceClick]);

  return (
    <div className="markdown-content text-inherit">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

// Process children to replace text nodes with source references
function processChildren(
  children: ReactNode,
  sourceMap: Map<string, Source>,
  onSourceClick?: (source: Source) => void
): ReactNode {
  if (!children) return children;

  if (typeof children === 'string') {
    return replaceSourceReferences(children, sourceMap, onSourceClick);
  }

  if (Array.isArray(children)) {
    return children.map((child, index) => {
      if (typeof child === 'string') {
        return (
          <Fragment key={index}>
            {replaceSourceReferences(child, sourceMap, onSourceClick)}
          </Fragment>
        );
      }
      return child;
    });
  }

  return children;
}
