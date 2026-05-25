import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/db";
import { loadAccessiblePrompt } from "@/lib/prompts/ownership";
import { promptListInclude } from "@/lib/prompts/list";
import { serializePrompt } from "@/lib/prompts/serialize";

export const runtime = "nodejs";

export async function POST(
  _request: NextRequest,
  context: RouteContext<"/api/prompts/[id]/use">
) {
  const { id } = await context.params;
  const result = await loadAccessiblePrompt(id);
  if ("error" in result) {
    return result.error;
  }

  const updated = await prisma.prompt.update({
    where: { id },
    data: { usageCount: { increment: 1 } },
    include: promptListInclude(result.user.id),
  });

  return NextResponse.json({ prompt: serializePrompt(updated) });
}
