import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { api } from '../lib/api';
import PostCard from '../components/PostCard';
import { Loader, Empty } from '../components/ui';

export default function Posts({ type }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get(`/api/public/posts?type=${type}&limit=50`)
      .then((d) => { if (alive) setPosts(Array.isArray(d?.data) ? d.data : []); })
      .catch(() => { if (alive) setPosts([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [type]);

  const list = posts.filter(
    (p) =>
      !query ||
      p.title?.toLowerCase().includes(query.toLowerCase()) ||
      p.excerpt?.toLowerCase().includes(query.toLowerCase())
  );

  const label = type === 'news' ? 'News' : 'Blogs';

  return (
    <div className="mx-auto max-w-7xl px-5 py-16">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-muted">{label}</p>
          <h1 className="font-display text-4xl font-bold">
            {type === 'news' ? 'Latest updates' : 'Guides & articles'}
          </h1>
          <p className="mt-3 max-w-lg text-sm text-muted">
            {type === 'news' ? 'Product updates and announcements.' : 'Nuke strategies, tips and tutorials.'}
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" />
          <input
            className="input pl-10"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <Loader label={`Loading ${label.toLowerCase()}`} />
      ) : list.length === 0 ? (
        <Empty title={`No ${label.toLowerCase()} yet`} sub="Check back soon." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => <PostCard key={p.id || p.slug} post={p} />)}
        </div>
      )}
    </div>
  );
}