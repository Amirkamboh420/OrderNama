import { PublicOrderForm } from "@/components/ordernama/public-order-form";

export default async function PublicOrderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PublicOrderForm publicSlug={slug} />;
}
