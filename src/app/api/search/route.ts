// src/app/api/search/route.ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const GET = auth(async (req) => {
  const userId = req.auth?.user?.id;
  const organizationId = req.auth?.user?.organizationId;
  
  if (!userId || !organizationId) {
    return NextResponse.json({ error: "Пользователь не авторизован" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query || !query.trim()) {
    return NextResponse.json({ deals: [], contacts: [] });
  }

  const searchString = query.trim();

  const [deals, contacts] = await Promise.all([
    prisma.deal.findMany({
      where: {
        organizationId: organizationId, 
        title: { contains: searchString, mode: 'insensitive' } 
      },
      select: {
        id: true,
        title: true,
        budget: true,
        stageId: true,
        pipelineId: true,
      },
      take: 5
    }),
    
    prisma.contact.findMany({
      where: {
        organizationId: organizationId,
        OR: [
          { firstName: { contains: searchString, mode: 'insensitive' } },
          { lastName: { contains: searchString, mode: 'insensitive' } },
          { phone: { contains: searchString, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
      },
      take: 5
    })
  ]);

  return NextResponse.json({ deals, contacts });
});
