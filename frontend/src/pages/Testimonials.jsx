import { Section } from '../components/ui';
import TestimonialsGrid from '../components/Testimonials';

export default function Testimonials() {
  return (
    <Section eyebrow="What users say" title="Loved by server owners"
      sub="Real feedback from people running communities, events and raids with NBCPrime.">
      <TestimonialsGrid />
    </Section>
  );
}
