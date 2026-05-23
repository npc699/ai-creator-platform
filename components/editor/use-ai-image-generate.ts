"use client";

import { useCallback, useRef, useState } from "react";

import type { AiImageSize } from "@/lib/ai/image-schema";

export type AiImageGenerateResult = {
  url: string;
  revisedPrompt?: string;
};

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

export function useAiImageGenerate() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<AiImageGenerateResult | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isGeneratingRef = useRef(false);

  const stopGenerate = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    isGeneratingRef.current = false;
    setIsGenerating(false);
  }, []);

  const reset = useCallback(() => {
    stopGenerate();
    setError(null);
    setLastResult(null);
  }, [stopGenerate]);

  const generateImage = useCallback(
    async (prompt: string, size: AiImageSize = "2K") => {
      const trimmed = prompt.trim();

      if (!trimmed) {
        setError("请输入图片描述");
        return null;
      }

      if (isGeneratingRef.current) {
        return null;
      }

      abortControllerRef.current?.abort();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      isGeneratingRef.current = true;
      setIsGenerating(true);
      setError(null);

      try {
        const response = await fetch("/api/ai/image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: trimmed, size }),
          signal: abortController.signal,
        });

        const payload = (await response.json()) as {
          url?: string;
          revisedPrompt?: string;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error || "AI 生图失败，请稍后重试");
        }

        if (!payload.url) {
          throw new Error("AI 生图未返回图片地址");
        }

        const result: AiImageGenerateResult = {
          url: payload.url,
          ...(payload.revisedPrompt ? { revisedPrompt: payload.revisedPrompt } : {}),
        };

        setLastResult(result);
        return result.url;
      } catch (generateError) {
        if (!isAbortError(generateError)) {
          setError(
            generateError instanceof Error
              ? generateError.message
              : "AI 生图失败，请稍后重试"
          );
        }
        return null;
      } finally {
        abortControllerRef.current = null;
        isGeneratingRef.current = false;
        setIsGenerating(false);
      }
    },
    []
  );

  return {
    error,
    generateImage,
    isGenerating,
    lastResult,
    reset,
    stopGenerate,
  };
}
