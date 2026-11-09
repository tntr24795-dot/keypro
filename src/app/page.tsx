import ProductHero from '@/components/ProductHero';
import { getProducts } from '@/lib/products';
import { getLang, t } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const lang = getLang();
  const d = t(lang);
  const [main] = await getProducts();

  return (
    <>
      {main ? <ProductHero product={main} lang={lang} /> : <p className="empty">No products yet. Add one in Supabase.</p>}

      <section id="activate" className="steps">
        <h2>{d.steps_title}</h2>
        <ol>
          {d.steps.map(([h, p]) => (
            <li key={h}><h3>{h}</h3><p>{p}</p></li>
          ))}
        </ol>
      </section>

      <section id="faq" className="faq">
        <h2>{d.faq}</h2>
        {d.faq_items.map(([q, a]) => (
          <details key={q}><summary>{q}</summary><p>{a}</p></details>
        ))}
      </section>
    </>
  );
}
