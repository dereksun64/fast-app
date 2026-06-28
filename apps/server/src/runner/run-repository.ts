import { randomUUID } from "node:crypto";

import {
  applicationRunSchema,
  promptResponseSchema,
  promptSchema,
  runStepSchema,
  type ApplicationRun,
  type LearnedAnswerControlType,
  type Prompt,
  type PromptResponse,
  type RunStatus,
  type RunStep,
  type RunStepLevel
} from "@fast-app/shared";

import type { SqliteDatabase } from "../db/sqlite.js";

interface ApplicationRunRow {
  readonly id: string;
  readonly job_url: string;
  readonly status: RunStatus;
  readonly current_prompt_id: string | null;
  readonly created_at: string;
  readonly updated_at: string;
  readonly started_at: string | null;
  readonly completed_at: string | null;
  readonly failed_at: string | null;
  readonly canceled_at: string | null;
}

interface PromptRow {
  readonly id: string;
  readonly run_id: string;
  readonly status: "open" | "answered" | "skipped";
  readonly field_label: string;
  readonly normalized_field_label: string;
  readonly control_type: LearnedAnswerControlType;
  readonly page_host: string;
  readonly page_path: string | null;
  readonly nearby_context: string | null;
  readonly message: string;
  readonly response_json: string | null;
  readonly created_at: string;
  readonly answered_at: string | null;
}

interface RunStepRow {
  readonly id: string;
  readonly run_id: string;
  readonly status: RunStatus;
  readonly level: RunStepLevel;
  readonly message: string;
  readonly page_url: string | null;
  readonly field_label: string | null;
  readonly prompt_id: string | null;
  readonly created_at: string;
}

interface ScreenshotMetadataRow {
  readonly id: string;
  readonly run_id: string;
  readonly step_id: string | null;
  readonly file_path: string;
  readonly page_url: string | null;
  readonly reason: string;
  readonly created_at: string;
}

export interface CreatePromptInput {
  readonly runId: string;
  readonly fieldLabel: string;
  readonly normalizedFieldLabel: string;
  readonly controlType: LearnedAnswerControlType;
  readonly pageHost: string;
  readonly pagePath?: string;
  readonly nearbyContext?: string;
  readonly message: string;
}

export interface AppendRunStepInput {
  readonly runId: string;
  readonly status: RunStatus;
  readonly level: RunStepLevel;
  readonly message: string;
  readonly pageUrl?: string;
  readonly fieldLabel?: string;
  readonly promptId?: string;
}

export interface CreateScreenshotMetadataInput {
  readonly runId: string;
  readonly stepId?: string;
  readonly filePath: string;
  readonly pageUrl?: string;
  readonly reason: string;
}

export interface ScreenshotMetadata {
  readonly id: string;
  readonly runId: string;
  readonly stepId?: string;
  readonly filePath: string;
  readonly pageUrl?: string;
  readonly reason: string;
  readonly createdAt: string;
}

export interface RunRepository {
  createRun(jobUrl: string): ApplicationRun;
  getRun(id: string): ApplicationRun | undefined;
  updateRunStatus(id: string, status: RunStatus): ApplicationRun | undefined;
  setCurrentPrompt(
    runId: string,
    promptId: string | undefined
  ): ApplicationRun | undefined;
  createPrompt(input: CreatePromptInput): Prompt;
  answerPrompt(
    promptId: string,
    response: PromptResponse
  ): Prompt | undefined;
  getPrompt(id: string): Prompt | undefined;
  getCurrentPrompt(runId: string): Prompt | undefined;
  appendRunStep(input: AppendRunStepInput): RunStep;
  listRunSteps(runId: string): RunStep[];
  createScreenshotMetadata(
    input: CreateScreenshotMetadataInput
  ): ScreenshotMetadata;
  listScreenshotMetadata(runId: string): ScreenshotMetadata[];
}

export function createRunRepository(
  database: SqliteDatabase,
  options: {
    readonly now?: () => string;
    readonly createId?: () => string;
  } = {}
): RunRepository {
  const now = options.now ?? (() => new Date().toISOString());
  const createId = options.createId ?? randomUUID;

  return {
    createRun(jobUrl: string): ApplicationRun {
      const timestamp = now();
      const run = applicationRunSchema.parse({
        id: createId(),
        jobUrl,
        status: "pending",
        createdAt: timestamp,
        updatedAt: timestamp
      });

      database
        .prepare(
          `INSERT INTO application_runs (
            id,
            job_url,
            status,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?)`
        )
        .run(run.id, run.jobUrl, run.status, run.createdAt, run.updatedAt);

      return run;
    },

    getRun(id: string): ApplicationRun | undefined {
      return getRun(database, id);
    },

    updateRunStatus(
      id: string,
      status: RunStatus
    ): ApplicationRun | undefined {
      const current = getRun(database, id);

      if (!current) {
        return undefined;
      }

      const timestamp = now();
      const timestampUpdates = statusTimestampUpdates(status, current, timestamp);

      database
        .prepare(
          `UPDATE application_runs
           SET
            status = ?,
            updated_at = ?,
            started_at = ?,
            completed_at = ?,
            failed_at = ?,
            canceled_at = ?
           WHERE id = ?`
        )
        .run(
          status,
          timestamp,
          timestampUpdates.startedAt ?? null,
          timestampUpdates.completedAt ?? null,
          timestampUpdates.failedAt ?? null,
          timestampUpdates.canceledAt ?? null,
          id
        );

      return getRun(database, id);
    },

    setCurrentPrompt(
      runId: string,
      promptId: string | undefined
    ): ApplicationRun | undefined {
      if (!getRun(database, runId)) {
        return undefined;
      }

      database
        .prepare(
          `UPDATE application_runs
           SET current_prompt_id = ?, updated_at = ?
           WHERE id = ?`
        )
        .run(promptId ?? null, now(), runId);

      return getRun(database, runId);
    },

    createPrompt(input: CreatePromptInput): Prompt {
      const timestamp = now();
      const prompt = promptSchema.parse({
        id: createId(),
        runId: input.runId,
        status: "open",
        fieldLabel: input.fieldLabel,
        normalizedFieldLabel: input.normalizedFieldLabel,
        controlType: input.controlType,
        pageHost: input.pageHost,
        pagePath: input.pagePath,
        nearbyContext: input.nearbyContext,
        message: input.message,
        createdAt: timestamp
      });

      database
        .prepare(
          `INSERT INTO prompts (
            id,
            run_id,
            status,
            field_label,
            normalized_field_label,
            control_type,
            page_host,
            page_path,
            nearby_context,
            message,
            response_json,
            created_at,
            answered_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          prompt.id,
          prompt.runId,
          prompt.status,
          prompt.fieldLabel,
          prompt.normalizedFieldLabel,
          prompt.controlType,
          prompt.pageHost,
          prompt.pagePath ?? null,
          prompt.nearbyContext ?? null,
          prompt.message,
          prompt.response ? JSON.stringify(prompt.response) : null,
          prompt.createdAt,
          prompt.answeredAt ?? null
        );

      return prompt;
    },

    answerPrompt(
      promptId: string,
      response: PromptResponse
    ): Prompt | undefined {
      const current = getPrompt(database, promptId);

      if (!current) {
        return undefined;
      }

      const validatedResponse = promptResponseSchema.parse(response);
      const answeredAt = now();
      const status = validatedResponse.action === "skip" ? "skipped" : "answered";

      database
        .prepare(
          `UPDATE prompts
           SET status = ?, response_json = ?, answered_at = ?
           WHERE id = ?`
        )
        .run(status, JSON.stringify(validatedResponse), answeredAt, promptId);

      return getPrompt(database, promptId);
    },

    getPrompt(id: string): Prompt | undefined {
      return getPrompt(database, id);
    },

    getCurrentPrompt(runId: string): Prompt | undefined {
      const run = getRun(database, runId);

      if (!run?.currentPromptId) {
        return undefined;
      }

      return getPrompt(database, run.currentPromptId);
    },

    appendRunStep(input: AppendRunStepInput): RunStep {
      const timestamp = now();
      const step = runStepSchema.parse({
        id: createId(),
        runId: input.runId,
        status: input.status,
        level: input.level,
        message: input.message,
        pageUrl: input.pageUrl,
        fieldLabel: input.fieldLabel,
        promptId: input.promptId,
        createdAt: timestamp
      });

      database
        .prepare(
          `INSERT INTO run_steps (
            id,
            run_id,
            status,
            level,
            message,
            page_url,
            field_label,
            prompt_id,
            created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          step.id,
          step.runId,
          step.status,
          step.level,
          step.message,
          step.pageUrl ?? null,
          step.fieldLabel ?? null,
          step.promptId ?? null,
          step.createdAt
        );

      return step;
    },

    listRunSteps(runId: string): RunStep[] {
      return database
        .prepare<[string], RunStepRow>(
          `SELECT
            id,
            run_id,
            status,
            level,
            message,
            page_url,
            field_label,
            prompt_id,
            created_at
          FROM run_steps
          WHERE run_id = ?
          ORDER BY created_at ASC, id ASC`
        )
        .all(runId)
        .map(rowToRunStep);
    },

    createScreenshotMetadata(
      input: CreateScreenshotMetadataInput
    ): ScreenshotMetadata {
      const timestamp = now();
      const screenshotMetadata = parseScreenshotMetadata({
        id: createId(),
        runId: input.runId,
        filePath: input.filePath,
        reason: input.reason,
        createdAt: timestamp,
        ...optionalValue("stepId", input.stepId),
        ...optionalValue("pageUrl", input.pageUrl)
      });

      database
        .prepare(
          `INSERT INTO screenshot_metadata (
            id,
            run_id,
            step_id,
            file_path,
            page_url,
            reason,
            created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          screenshotMetadata.id,
          screenshotMetadata.runId,
          screenshotMetadata.stepId ?? null,
          screenshotMetadata.filePath,
          screenshotMetadata.pageUrl ?? null,
          screenshotMetadata.reason,
          screenshotMetadata.createdAt
        );

      return screenshotMetadata;
    },

    listScreenshotMetadata(runId: string): ScreenshotMetadata[] {
      return database
        .prepare<[string], ScreenshotMetadataRow>(
          `SELECT
            id,
            run_id,
            step_id,
            file_path,
            page_url,
            reason,
            created_at
          FROM screenshot_metadata
          WHERE run_id = ?
          ORDER BY created_at ASC, id ASC`
        )
        .all(runId)
        .map(rowToScreenshotMetadata);
    }
  };
}

function getRun(
  database: SqliteDatabase,
  id: string
): ApplicationRun | undefined {
  const row = database
    .prepare<[string], ApplicationRunRow>(
      `SELECT
        id,
        job_url,
        status,
        current_prompt_id,
        created_at,
        updated_at,
        started_at,
        completed_at,
        failed_at,
        canceled_at
      FROM application_runs
      WHERE id = ?`
    )
    .get(id);

  if (!row) {
    return undefined;
  }

  return rowToApplicationRun(database, row);
}

function getPrompt(
  database: SqliteDatabase,
  id: string
): Prompt | undefined {
  const row = database
    .prepare<[string], PromptRow>(
      `SELECT
        id,
        run_id,
        status,
        field_label,
        normalized_field_label,
        control_type,
        page_host,
        page_path,
        nearby_context,
        message,
        response_json,
        created_at,
        answered_at
      FROM prompts
      WHERE id = ?`
    )
    .get(id);

  if (!row) {
    return undefined;
  }

  return rowToPrompt(row);
}

function rowToApplicationRun(
  database: SqliteDatabase,
  row: ApplicationRunRow
): ApplicationRun {
  return applicationRunSchema.parse({
    id: row.id,
    jobUrl: row.job_url,
    status: row.status,
    currentPromptId: row.current_prompt_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    startedAt: row.started_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    failedAt: row.failed_at ?? undefined,
    canceledAt: row.canceled_at ?? undefined,
    latestStep: getLatestRunStep(database, row.id)
  });
}

function rowToPrompt(row: PromptRow): Prompt {
  const response: unknown =
    row.response_json === null ? undefined : JSON.parse(row.response_json);

  return promptSchema.parse({
    id: row.id,
    runId: row.run_id,
    status: row.status,
    fieldLabel: row.field_label,
    normalizedFieldLabel: row.normalized_field_label,
    controlType: row.control_type,
    pageHost: row.page_host,
    pagePath: row.page_path ?? undefined,
    nearbyContext: row.nearby_context ?? undefined,
    message: row.message,
    response,
    createdAt: row.created_at,
    answeredAt: row.answered_at ?? undefined
  });
}

function rowToRunStep(row: RunStepRow): RunStep {
  return runStepSchema.parse({
    id: row.id,
    runId: row.run_id,
    status: row.status,
    level: row.level,
    message: row.message,
    pageUrl: row.page_url ?? undefined,
    fieldLabel: row.field_label ?? undefined,
    promptId: row.prompt_id ?? undefined,
    createdAt: row.created_at
  });
}

function rowToScreenshotMetadata(
  row: ScreenshotMetadataRow
): ScreenshotMetadata {
  return parseScreenshotMetadata({
    id: row.id,
    runId: row.run_id,
    filePath: row.file_path,
    reason: row.reason,
    createdAt: row.created_at,
    ...optionalValue("stepId", row.step_id ?? undefined),
    ...optionalValue("pageUrl", row.page_url ?? undefined)
  });
}

function getLatestRunStep(
  database: SqliteDatabase,
  runId: string
): RunStep | undefined {
  const row = database
    .prepare<[string], RunStepRow>(
      `SELECT
        id,
        run_id,
        status,
        level,
        message,
        page_url,
        field_label,
        prompt_id,
        created_at
      FROM run_steps
      WHERE run_id = ?
      ORDER BY created_at DESC, id DESC
      LIMIT 1`
    )
    .get(runId);

  if (!row) {
    return undefined;
  }

  return rowToRunStep(row);
}

function statusTimestampUpdates(
  status: RunStatus,
  current: ApplicationRun,
  timestamp: string
): Pick<
  ApplicationRun,
  "startedAt" | "completedAt" | "failedAt" | "canceledAt"
> {
  return {
    startedAt:
      status === "starting" ? current.startedAt ?? timestamp : current.startedAt,
    completedAt:
      status === "completed" ? current.completedAt ?? timestamp : current.completedAt,
    failedAt: status === "failed" ? current.failedAt ?? timestamp : current.failedAt,
    canceledAt:
      status === "canceled" ? current.canceledAt ?? timestamp : current.canceledAt
  };
}

function parseScreenshotMetadata(value: ScreenshotMetadata): ScreenshotMetadata {
  if (value.id.trim().length === 0) {
    throw new Error("Screenshot metadata id is required.");
  }

  if (value.runId.trim().length === 0) {
    throw new Error("Screenshot metadata run id is required.");
  }

  if (value.filePath.trim().length === 0) {
    throw new Error("Screenshot metadata file path is required.");
  }

  if (value.reason.trim().length === 0) {
    throw new Error("Screenshot metadata reason is required.");
  }

  if (Number.isNaN(Date.parse(value.createdAt))) {
    throw new Error("Screenshot metadata createdAt must be a datetime.");
  }

  return value;
}

function optionalValue<Key extends string, Value>(
  key: Key,
  value: Value | undefined
): Record<Key, Value> | Record<string, never> {
  if (value === undefined) {
    return {};
  }

  return { [key]: value } as Record<Key, Value>;
}
