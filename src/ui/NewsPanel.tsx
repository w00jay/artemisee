import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Panel } from './Overlay';

interface Article {
  title: string;
  summary: string;
  url: string;
  image_url: string;
  source: string;
  published: string;
}

export function NewsPanel() {
  const [expanded, setExpanded] = useState(false);

  const { data } = useQuery({
    queryKey: ['news'],
    queryFn: async () => {
      const res = await fetch('/v1/news?q=artemis&limit=8');
      if (!res.ok) return null;
      return res.json() as Promise<{ articles: Article[]; count: number }>;
    },
    refetchInterval: 15 * 60 * 1000,
    staleTime: 10 * 60 * 1000,
  });

  if (!data?.articles?.length) return null;

  const articles = expanded ? data.articles : data.articles.slice(0, 3);

  return (
    <Panel style={{ maxWidth: 280, maxHeight: expanded ? 400 : undefined, overflowY: expanded ? 'auto' : undefined }}>
      <div
        style={{ fontWeight: 600, marginBottom: 6, fontSize: 11, opacity: 0.7, cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        SPACE NEWS {expanded ? '\u25B2' : '\u25BC'}
      </div>
      {articles.map((a, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <a
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#7dd3fc', textDecoration: 'none', fontSize: 12, lineHeight: 1.4, display: 'block' }}
          >
            {a.title}
          </a>
          <div style={{ fontSize: 10, opacity: 0.4, marginTop: 2 }}>
            {a.source} — {timeAgo(a.published)}
          </div>
        </div>
      ))}
    </Panel>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
