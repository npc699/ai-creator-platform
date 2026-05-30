type EditBootstrapPayload = {
  draftId: string;
  postId: string;
  title: string;
  content: string;
  tags: string[];
  coverUrl: string | null;
  updatedAt: string;
};

const inflight = new Map<string, Promise<EditBootstrapPayload>>();

/** 同一 postId 的 bootstrap 请求去重，避免 Strict Mode 双挂载并发触发服务端竞态。 */
export function fetchEditBootstrap(postId: string) {
  const cached = inflight.get(postId);
  if (cached) {
    return cached;
  }

  const request = fetch(`/api/posts/${postId}/edit`, {
    credentials: "same-origin",
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`EDIT_BOOTSTRAP_${response.status}`);
      }
      return (await response.json()) as EditBootstrapPayload;
    })
    .finally(() => {
      inflight.delete(postId);
    });

  inflight.set(postId, request);
  return request;
}
