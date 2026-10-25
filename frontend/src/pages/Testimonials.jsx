import TestimonialsGrid from '../components/Testimonials';

export default function Testimonials() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-16">
      <div className="mb-10 text-center">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-muted">What users say</p>
        <h1 className="font-display text-4xl font-bold">Loved by server owners</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm text-muted">
          Real feedback from people running communities, events and raids with NBCPrime.
        </p>
      </div>
      <TestimonialsGrid />
    </div>
  );
}