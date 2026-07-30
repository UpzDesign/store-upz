export type ProjectUpdateKind = "client_update" | "feedback_request" | "approval_request";
export type ClientResponseAction = "reply" | "approved" | "revision_requested";

const UPDATE_PATTERN = /^\[\[update:(client_update|feedback_request|approval_request)(?:;stage:(\d+))?\]\]\s*/;
const RESPONSE_PATTERN = /^\[\[thread:(\d+);action:(reply|approved|revision_requested)\]\]\s*/;
const STAGE_COMMENT_PATTERN = /^\[\[stage-comment:(\d+)\]\]\s*/;

export function encodeProjectUpdate(body: string, kind: ProjectUpdateKind, stageId?: number | null) {
  const stage = stageId ? `;stage:${stageId}` : "";
  return `[[update:${kind}${stage}]] ${body.trim()}`;
}

export function encodeStageComment(body: string, stageId: number) {
  return `[[stage-comment:${stageId}]] ${body.trim()}`;
}

export function encodeClientResponse(body: string, updateId: number, action: ClientResponseAction) {
  return `[[thread:${updateId};action:${action}]] ${body.trim()}`;
}

export function parseProjectMessage(rawBody: string) {
  const response = rawBody.match(RESPONSE_PATTERN);
  if (response) {
    return {
      body: rawBody.replace(RESPONSE_PATTERN, "").trim(),
      kind: "client_response" as const,
      replyToId: Number(response[1]),
      action: response[2] as ClientResponseAction,
      stageId: null,
    };
  }

  const stageComment = rawBody.match(STAGE_COMMENT_PATTERN);
  if (stageComment) {
    return {
      body: rawBody.replace(STAGE_COMMENT_PATTERN, "").trim(),
      kind: "internal_stage" as const,
      replyToId: null,
      action: null,
      stageId: Number(stageComment[1]),
    };
  }

  const update = rawBody.match(UPDATE_PATTERN);
  if (update) {
    return {
      body: rawBody.replace(UPDATE_PATTERN, "").trim(),
      kind: update[1] as ProjectUpdateKind,
      replyToId: null,
      action: null,
      stageId: update[2] ? Number(update[2]) : null,
    };
  }

  return {
    body: rawBody,
    kind: "client_update" as const,
    replyToId: null,
    action: null,
    stageId: null,
  };
}
