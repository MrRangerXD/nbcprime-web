import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import { Loader, Badge } from '../components/ui';

export default function PostView() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/api/public/posts/' + slug).then((d) => setPost(d.data)).catch(() => setError('Not found'));
  }, [slug]);

  if (error) return <div className="mx-auto max-w-3xl px-5 py-24 text-center text-muted">{error}</div>;
  if (!post) return <Loader />;

  return (
    <article className="mx-auto max-w-3xl px-5 py-16">
      <Link to={post.type === 'news' ? '/news' : '/blogs'} className="inline-flex items-center gap-2 text-sm text-muted hover:text-white">
        <ArrowLeft size={15} /> Back
      </Link>
      <Badge tone="purple" className="mt-6">{post.type}</Badge>
      <h1 className="mt-4 font-display text-4xl font-bold leading-tight">{post.title}</h1>
      <p className="mt-4 text-sm text-muted">
        {post.authorName} - {new Date(post.publishedAt).toDateString()} - {post.views} views
      </p>
      {post.coverImage && <img src={post.coverImage} alt="" className="mt-8 w-full rounded-2xl border border-edge" />}
      <div
        className="mt-10 space-y-4 leading-relaxed text-white/85"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(post.content || '')) }}
      />
    </article>
  );
}
