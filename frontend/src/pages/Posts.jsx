import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Loader, Empty, Badge } from '../components/ui';
import { timeAgo } from '../lib/format';

export default function Posts({ type }) {
  const [posts, setPosts] = useState(null);

  useEffect(() => {
    setPosts(null);
    api.get('/api/public/posts?type=' + type).then((d) => setPosts(d.data)).catch(() => setPosts([]));
  }, [type]);

  const title = type === 'news' ? 'News' : 'Blogs';

  return (
    <div className="mx-auto max-w-5xl px-5 py-16">
      <h1 className="font-display text-4xl font-bold glow-text">{title}</h1>
      <p className="mt-3 text-muted">
        {type === 'news' ? 'Updates and announcements from the NBCPrime team.' : 'Guides, deep dives and raid strategy.'}
      </p>

      <div className="mt-10">
        {posts === null && <Loader />}
        {posts && posts.length === 0 && <Empty title="Nothing published yet" sub="Check back soon." />}
        <div className="grid gap-4 md:grid-cols-2">
          {posts && posts.map((p) => (
            <Link key={p._id} to={'/post/' + p.slug} className="card card-hover overflow-hidden">
              {p.coverImage && <img src={p.coverImage} alt="" className="h-44 w-full object-cover" />}
              <div className="p-5">
                <div className="flex items-center gap-2">
                  <Badge tone={type === 'news' ? 'amber' : 'purple'}>{type}</Badge>
                  <span className="text-xs text-muted">{timeAgo(p.publishedAt)}</span>
                </div>
                <h2 className="mt-3 font-display text-lg font-semibold">{p.title}</h2>
                {p.excerpt && <p className="mt-2 text-sm text-muted">{p.excerpt}</p>}
                <p className="mt-4 text-xs text-muted">{p.authorName} - {p.views} views</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
