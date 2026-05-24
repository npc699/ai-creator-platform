import type { SerializedPrompt } from "@/lib/prompts/serialize";
import type { PromptCategorySlug } from "@/lib/prompts/category";
import type { EditorPromptScope } from "@/lib/prompts/query";
import type { PromptCreateInput, PromptUpdateInput } from "@/lib/validations/prompt";

export type EditorPrompt = SerializedPrompt;

async function parseJsonError(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error || fallback;
  } catch {
    return fallback;
  }
}

export async function fetchEditorPrompts(
  scope: EditorPromptScope = "mine"
): Promise<EditorPrompt[]> {
  const response = await fetch(`/api/prompts?scope=${scope}`, {
    credentials: "same-origin",
  });
  if (!response.ok) {
    throw new Error(await parseJsonError(response, "加载 Prompt 失败"));
  }

  const data = (await response.json()) as { prompts: EditorPrompt[] };
  return data.prompts ?? [];
}

export async function fetchEditorPrompt(id: string): Promise<EditorPrompt> {
  const response = await fetch(`/api/prompts/${id}`, { credentials: "same-origin" });
  if (!response.ok) {
    throw new Error(await parseJsonError(response, "加载 Prompt 失败"));
  }

  const data = (await response.json()) as { prompt: EditorPrompt };
  return data.prompt;
}

export async function createEditorPrompt(input: {
  title: string;
  content: string;
  category: PromptCategorySlug;
}): Promise<EditorPrompt> {
  const response = await fetch("/api/prompts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input satisfies PromptCreateInput),
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error(await parseJsonError(response, "创建 Prompt 失败"));
  }

  const data = (await response.json()) as { prompt: EditorPrompt };
  return data.prompt;
}

export async function updateEditorPrompt(
  id: string,
  input: PromptUpdateInput
): Promise<EditorPrompt> {
  const response = await fetch(`/api/prompts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error(await parseJsonError(response, "更新 Prompt 失败"));
  }

  const data = (await response.json()) as { prompt: EditorPrompt };
  return data.prompt;
}

export async function toggleEditorPromptFavorite(
  id: string,
  isFavorite: boolean
): Promise<EditorPrompt> {
  const response = await fetch(`/api/prompts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isFavorite }),
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error(await parseJsonError(response, "更新收藏状态失败"));
  }

  const data = (await response.json()) as { prompt: EditorPrompt };
  return data.prompt;
}

export async function deleteEditorPrompt(id: string) {
  const response = await fetch(`/api/prompts/${id}`, {
    method: "DELETE",
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error(await parseJsonError(response, "删除 Prompt 失败"));
  }
}

export async function useEditorPrompt(id: string): Promise<EditorPrompt> {
  const response = await fetch(`/api/prompts/${id}/use`, {
    method: "POST",
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error(await parseJsonError(response, "使用 Prompt 失败"));
  }

  const data = (await response.json()) as { prompt: EditorPrompt };
  return data.prompt;
}
