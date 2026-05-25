import "dotenv/config";

import fs from "node:fs/promises";
import path from "node:path";

import { REVIEW_PROMPT_VERSION } from "../lib/prompts/review";

const rootDir = process.cwd();
const testsetPath = path.join(rootDir, "tests", "review-testset.json");
const reportPath = path.join(rootDir, "tests", "review-report.md");

const REVIEW_CATEGORY_LABELS: Record<string, string> = {
  pornography: "涉黄",
  gambling: "涉赌",
  drugs: "涉毒",
  political_sensitive: "政治敏感",
  harassment: "人身攻击",
  vulgar: "低俗内容",
  misinformation: "虚假信息",
};

type ReviewRiskLevel = "high" | "medium" | "low" | "none";
type ReviewCategory = string;

type ReviewTestCase = {
  id: string;
  title: string;
  content: string;
  expectedPassed: boolean;
  expectedRiskLevel: ReviewRiskLevel;
  expectedCategories: ReviewCategory[];
};

type SafetyResult = {
  passed: boolean;
  riskLevel: ReviewRiskLevel;
  categories: string[];
  reason: string;
  suggestion: string;
};

type ReviewResult = {
  status: string;
  safety: SafetyResult;
  qualityScore: number | null;
  aiFailed?: boolean;
};

type CaseOutcome =
  | {
      kind: "ok";
      actualPassed: boolean;
      actualRiskLevel: ReviewRiskLevel;
      actualCategories: string[];
      reason: string;
    }
  | {
      kind: "error";
      reason: string;
    };

type CaseResult = {
  testCase: ReviewTestCase;
  outcome: CaseOutcome;
  matched: boolean;
  highRiskBlocked: boolean;
  highRiskLevelExact: boolean;
};

const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const TEST_COOKIE = normalizeTestCookie(process.env.TEST_AUTH_COOKIE ?? "");

/** 去掉用户误粘贴的 `Cookie:` 前缀，避免请求头格式错误。 */
function normalizeTestCookie(raw: string) {
  return raw.trim().replace(/^Cookie:\s*/i, "");
}

function hasExpectedCategory(actual: string[], expected: ReviewCategory[]) {
  if (expected.length === 0) {
    return actual.length === 0;
  }

  return expected.some((category) => actual.includes(category));
}

function isCaseMatched(testCase: ReviewTestCase, outcome: Extract<CaseOutcome, { kind: "ok" }>) {
  if (testCase.expectedPassed !== outcome.actualPassed) {
    return false;
  }

  if (testCase.expectedRiskLevel !== outcome.actualRiskLevel) {
    return false;
  }

  return hasExpectedCategory(outcome.actualCategories, testCase.expectedCategories);
}

function isHighRiskBlocked(testCase: ReviewTestCase, outcome: CaseOutcome) {
  if (testCase.expectedRiskLevel !== "high") {
    return true;
  }

  if (outcome.kind !== "ok") {
    return false;
  }

  // 高危样本：成功拦截即算识别命中（等级精确度由 matched 单独考核）
  return !outcome.actualPassed;
}

function isHighRiskLevelExact(testCase: ReviewTestCase, outcome: CaseOutcome) {
  if (testCase.expectedRiskLevel !== "high") {
    return true;
  }

  if (outcome.kind !== "ok") {
    return false;
  }

  return outcome.actualRiskLevel === "high";
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

function buildCategoryStats(results: CaseResult[]) {
  const stats = new Map<string, { total: number; matched: number }>();

  for (const result of results) {
    const categories = result.testCase.expectedCategories.length
      ? result.testCase.expectedCategories
      : (["normal"] as const);

    for (const category of categories) {
      const current = stats.get(category) ?? { total: 0, matched: 0 };
      current.total += 1;
      if (result.matched) {
        current.matched += 1;
      }
      stats.set(category, current);
    }
  }

  return [...stats.entries()].sort(([left], [right]) => left.localeCompare(right));
}

function buildReport(results: CaseResult[]) {
  const total = results.length;
  const matched = results.filter((result) => result.matched).length;
  const highRiskCases = results.filter(
    (result) => result.testCase.expectedRiskLevel === "high"
  );
  const highRiskBlocked = highRiskCases.filter((result) => result.highRiskBlocked).length;
  const highRiskLevelExact = highRiskCases.filter(
    (result) => result.highRiskLevelExact
  ).length;
  const failed = results.filter((result) => !result.matched);
  const errored = results.filter((result) => result.outcome.kind === "error");
  const categoryRows = buildCategoryStats(results)
    .map(([category, stats]) => {
      const label =
        category === "normal"
          ? "正常内容"
          : REVIEW_CATEGORY_LABELS[category] ?? category;
      return `| ${label} | ${stats.matched}/${stats.total} | ${formatPercent(
        stats.matched / stats.total
      )} |`;
    })
    .join("\n");
  const failedRows = failed
    .slice(0, 30)
    .map((result) => {
      const actualRisk =
        result.outcome.kind === "ok" ? result.outcome.actualRiskLevel : "error";
      const reason =
        result.outcome.kind === "ok"
          ? result.outcome.reason
          : result.outcome.reason;
      return `| ${result.testCase.id} | ${result.testCase.expectedRiskLevel} | ${actualRisk} | ${reason.replace(/\|/g, " ")} |`;
    })
    .join("\n");

  return `# 内容审核评估报告

- Prompt 版本：${REVIEW_PROMPT_VERSION}
- 运行时间：${new Date().toISOString()}
- 样本数量：${total}
- API 地址：${BASE_URL}
- 整体准确率：${matched}/${total} (${formatPercent(matched / total)})
- 高危拦截准确率：${highRiskBlocked}/${highRiskCases.length} (${formatPercent(
    highRiskBlocked / Math.max(highRiskCases.length, 1)
  )})
- 高危等级精确率：${highRiskLevelExact}/${highRiskCases.length} (${formatPercent(
    highRiskLevelExact / Math.max(highRiskCases.length, 1)
  )})
- API/AI 异常：${errored.length} 条

## 分类准确率

| 类别 | 命中 | 准确率 |
| --- | --- | --- |
${categoryRows}

## 误判样本

| 样本 | 期望风险 | 实际风险 | 原因 |
| --- | --- | --- | --- |
${failedRows || "| 无 | - | - | - |"}
`;
}

function parseReviewOutcome(review: ReviewResult): CaseOutcome {
  if (review.aiFailed || review.status === "PENDING") {
    return {
      kind: "error",
      reason:
        review.safety?.reason ??
        "AI 审核未完成（PENDING），请检查 ARK 配置、Redis 与 dev server 日志",
    };
  }

  if (!review.safety?.riskLevel) {
    return {
      kind: "error",
      reason: "审核 API 返回结构不完整，缺少 safety.riskLevel",
    };
  }

  const actualPassed = review.status !== "REJECTED" && review.status !== "FLAGGED";

  return {
    kind: "ok",
    actualPassed,
    actualRiskLevel: review.safety.riskLevel,
    actualCategories: review.safety.categories ?? [],
    reason: review.safety.reason,
  };
}

async function assertPreflight(testCases: ReviewTestCase[]) {
  if (!TEST_COOKIE) {
    throw new Error(
      "未配置 TEST_AUTH_COOKIE。请在 .env 中设置登录 Cookie，例如 authjs.session-token=..."
    );
  }

  if (testCases.length === 0) {
    throw new Error("测试集为空，请检查 tests/review-testset.json");
  }

  for (const testCase of testCases) {
    if (!testCase.title.trim() || !testCase.content.trim()) {
      throw new Error(`测试样本 ${testCase.id} 标题或正文为空`);
    }
    if (testCase.title.trim().length > 100) {
      throw new Error(
        `测试样本 ${testCase.id} 标题超过 100 字，会被 /api/review/content 拒绝`
      );
    }
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/api/review/content`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: TEST_COOKIE,
      },
      body: JSON.stringify({
        title: "预检探针",
        content: "这是一条用于验证登录态与审核 API 可用性的探针内容。",
      }),
    });
  } catch (error) {
    throw new Error(
      `无法连接 ${BASE_URL}，请先启动 dev server。${
        error instanceof Error ? `: ${error.message}` : ""
      }`
    );
  }

  if (response.status === 401) {
    throw new Error("TEST_AUTH_COOKIE 无效或已过期，请重新登录后复制 Cookie");
  }

  const payload = (await response.json().catch(() => null)) as {
    reviewResult?: ReviewResult;
    error?: string;
  } | null;

  if (!payload?.reviewResult) {
    throw new Error(
      payload?.error ??
        `预检失败：审核 API 未返回 reviewResult (HTTP ${response.status})`
    );
  }

  if (payload.reviewResult.aiFailed || payload.reviewResult.status === "PENDING") {
    throw new Error(
      "预检探针进入 PENDING，说明 AI 审核不可用。请检查 ARK_API_KEY、ARK_MODEL 与 Redis。"
    );
  }

  console.log("预检通过：登录态、dev server 与 AI 审核链路可用。\n");
}

async function callReviewApi(title: string, content: string): Promise<ReviewResult> {
  const response = await fetch(`${BASE_URL}/api/review/content`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: TEST_COOKIE,
    },
    body: JSON.stringify({ title, content }),
  });

  const payload = (await response.json().catch(() => null)) as {
    reviewResult?: ReviewResult;
    error?: string;
  } | null;

  if (response.status === 401) {
    throw new Error("登录 Cookie 已失效 (401)，请更新 TEST_AUTH_COOKIE");
  }

  if (!payload?.reviewResult) {
    throw new Error(payload?.error ?? `审核 API 返回异常 (HTTP ${response.status})`);
  }

  return payload.reviewResult;
}

async function main() {
  const raw = await fs.readFile(testsetPath, "utf8");
  const testCases = JSON.parse(raw) as ReviewTestCase[];

  await assertPreflight(testCases);

  const results: CaseResult[] = [];

  console.log(`开始测试，共 ${testCases.length} 条样本，API: ${BASE_URL}\n`);

  for (const [index, testCase] of testCases.entries()) {
    try {
      const review = await callReviewApi(testCase.title, testCase.content);
      const outcome = parseReviewOutcome(review);
      const matched =
        outcome.kind === "ok" ? isCaseMatched(testCase, outcome) : false;

      results.push({
        testCase,
        outcome,
        matched,
        highRiskBlocked: isHighRiskBlocked(testCase, outcome),
        highRiskLevelExact: isHighRiskLevelExact(testCase, outcome),
      });

      const actualRisk =
        outcome.kind === "ok" ? outcome.actualRiskLevel : "error";
      const statusLabel =
        outcome.kind === "error" ? "ERROR" : matched ? "PASS" : "FAIL";

      console.log(
        `[${index + 1}/${testCases.length}] ${testCase.id}: ${statusLabel} expected=${testCase.expectedRiskLevel} actual=${actualRisk}`
      );

      if (outcome.kind === "error") {
        console.log(`  ↳ ${outcome.reason}`);
      } else if (!matched) {
        console.log(`  ↳ ${outcome.reason}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[${index + 1}/${testCases.length}] ${testCase.id}: ERROR - ${message}`);
      const outcome: CaseOutcome = { kind: "error", reason: message };
      results.push({
        testCase,
        outcome,
        matched: false,
        highRiskBlocked: isHighRiskBlocked(testCase, outcome),
        highRiskLevelExact: isHighRiskLevelExact(testCase, outcome),
      });
    }
  }

  await fs.writeFile(reportPath, buildReport(results), "utf8");
  console.log(`\n报告已写入 ${reportPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
