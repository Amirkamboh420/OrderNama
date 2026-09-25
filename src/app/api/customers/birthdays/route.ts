import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/seller";

// GET /api/customers/birthdays — returns customers with birthdays this month
export async function GET() {
  const seller = await requireSeller();
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12

  const customers = await db.customer.findMany({
    where: { sellerId: seller.id },
    select: {
      id: true,
      name: true,
      phone: true,
      city: true,
      birthday: true,
      isRepeat: true,
      totalOrders: true,
      totalSpent: true,
      tags: true,
    },
  });

  // Filter to birthdays this month, parse "YYYY-MM-DD" format
  const birthdayCustomers = customers
    .filter((c) => {
      if (!c.birthday) return false;
      const month = parseInt(c.birthday.split("-")[1], 10);
      return month === currentMonth;
    })
    .map((c) => {
      const day = parseInt(c.birthday!.split("-")[2], 10);
      const today = now.getDate();
      const daysUntil = day - today;
      return {
        ...c,
        birthdayDay: day,
        daysUntil,
        isToday: daysUntil === 0,
        isUpcoming: daysUntil > 0,
      };
    })
    .sort((a, b) => a.birthdayDay - b.birthdayDay);

  return NextResponse.json({
    customers: birthdayCustomers,
    count: birthdayCustomers.length,
    month: now.toLocaleString("en-PK", { month: "long" }),
  });
}
