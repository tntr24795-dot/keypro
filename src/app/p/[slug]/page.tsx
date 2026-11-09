import { notFound } from 'next/navigation';
import ProductHero from '@/components/ProductHero';
import { getProduct } from '@/lib/products';
import { getLang } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug);
  if (!product) notFound();
  return <ProductHero product={product} lang={getLang()} />;
}
