import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { ArrowLeft, Eye, Calendar } from 'lucide-react';
import { api } from '../lib/api';
import { timeAgo } from '../lib/format';
import { Loader, Empty, Badge } from '../components/ui';

export default function PostView() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get(`/api/public/posts/${slug}`)
      .then((d) => { if (alive) setPost(d?.data || null); })
      .catch(() => { if (alive) setPost(null); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [slug]);

  const html = useMemo(() => {
    if (!post?.content) return '';
    return DOMPurify.sanitize(marked.parse(post.content));
  }, [post]);

  if (loading) return <Loader label="Loading post" />;
  if (!post) return <Empty title="Post not found" sub="It may have been removed." action={<Link to="/blogs" className="btn-primary">Back to blogs</Link>} />;

  return (
    <article className="mx-auto max-w-3xl px-5 py-16">
      <Link to={post.type === 'news' ? '/news' : '/blogs'} className="inline-flex items-center gap-2 text-sm text-muted hover:text-white">
        <ArrowLeft size={14} /> Back
      </Link>

      <div className="mt-6 flex items-center gap-3">
        <Badge tone="solid">{post.type === 'news' ? 'NEWS' : 'BLOG'}</Badge>
        <span className="flex items-center gap-1.5 text-[11px] text-dim">
          <Calendar size={11} /> {timeAgo(post.publishedAt)}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-dim">
          <Eye size={11} /> {post.views || 0}
        </span>
      </div>

      <h1 className="mt-4 font-display text-3xl font-bold leading-tight md:text-4xl">{post.title}</h1>
      {post.excerpt && <p className="mt-4 text-[15px] leading-relaxed text-muted">{post.excerpt}</p>}
      <p className="mt-4 text-xs text-dim">By {post.authorName || 'NBCPrime'}</p>

      <div className="hairline my-8" />

      {post.coverImage && (
        <img src={post.coverImage} alt="" className="mb-8 w-full rounded-2xl border border-edge" />
      )}

      <div
        className="prose-invert space-y-4 text-[15px] leading-relaxed text-white/85
          [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white
          [&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold
          [&_a]:text-white [&_a]:underline
          [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6
          [&_code]:rounded [&_code]:bg-surface [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px]
          [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-edge [&_pre]:bg-panel [&_pre]:p-4
          [&_img]:rounded-xl [&_blockquote]:border-l-2 [&_blockquote]:border-edge [&_blockquote]:pl-4 [&_blockquote]:text-muted"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  );
}