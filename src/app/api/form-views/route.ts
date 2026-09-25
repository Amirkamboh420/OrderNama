import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/seller";

// POST /api/form-views — records a view of the public order form
// Body: { slug?: string, source?: "direct"|"instagram"|"whatsapp"|"other" }
export async function POST(req: NextRequest) {
  try {
    const seller = await requireSeller();
    const body = await req.json().catch(() => ({}));
    const source = ["direct", "instagram", "whatsapp", "other"].includes(body.source)
      ? body.source
      : "direct";

    const view = await db.formView.create({
      data: {
        sellerId: seller.id,
        slug: body.slug || seller.businessName.toLowerCase().replace(/\s+/g, "-"),
        source,
      },
    });

    return NextResponse.json({ ok: true, id: view.id });
  } catch {
    // If no seller found (public form view), just return ok without recording
    return NextResponse.json({ ok: true, skipped: true });
  }
}
