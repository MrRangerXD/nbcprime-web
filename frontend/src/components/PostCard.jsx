import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { timeAgo } from '../lib/format';
import { Badge } from './ui';

export default function PostCard({ post }) {
  return (
    <Link to={`/post/${post.slug}`} className="card card-hover group flex flex-col overflow-hidden">
      {post.coverImage && (
        <div className="aspect-[16/9] overflow-hidden border-b border-edge bg-surface">
          <img
            src={post.coverImage}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover opacity-80 transition group-hover:scale-[1.03] group-hover:opacity-100"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2">
          <Badge>{post.type === 'news' ? 'NEWS' : 'BLOG'}</Badge>
          <span className="text-[11px] text-dim">{timeAgo(post.publishedAt)}</span>
        </div>
        <h3 className="mt-3 font-display text-base font-bold leading-snug">{post.title}</h3>
        {post.excerpt && (
          <p className="mt-2 line-clamp-3 flex-1 text-[13px] leading-relaxed text-muted">{post.excerpt}</p>
        )}
        <div className="mt-4 flex items-center gap-3 border-t border-edge pt-3 text-[11px] text-dim">
          <span className="truncate">{post.authorName || 'NBCPrime'}</span>
          <span className="ml-auto flex shrink-0 items-center gap-1"><Eye size={11} /> {post.views || 0}</span>
        </div>
      </div>
    </Link>
  );
}