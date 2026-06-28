import { randomUUID } from "node:crypto";

import {
  learnedAnswerSchema,
  type LearnedAnswer,
  type LearnedAnswerControlType,
  type LearnedAnswerValue,
  type UpdateLearnedAnswerRequest
} from "@fast-app/shared";

import type { SqliteDatabase } from "../db/sqlite.js";

interface LearnedAnswerRow {
  readonly id: string;
  readonly raw_label: string;
  readonly normalized_label: string;
  readonly control_type: LearnedAnswerControlType;
  readonly page_host: string;
  readonly page_path_pattern: string | null;
  readonly nearby_context: string | null;
  readonly answer_type: LearnedAnswerValue["answerType"];
  readonly answer_value_json: string;
  readonly state: "enabled" | "disabled";
  readonly created_at: string;
  readonly updated_at: string;
  readonly last_used_at: string | null;
}

export interface CreateLearnedAnswerInput {
  readonly rawLabel: string;
  readonly normalizedLabel: string;
  readonly controlType: LearnedAnswerControlType;
  readonly pageHost: string;
  readonly pagePathPattern?: string;
  readonly nearbyContext?: string;
  readonly answer: LearnedAnswerValue;
}

export interface MemoryRepository {
  listLearnedAnswers(): LearnedAnswer[];
  createLearnedAnswer(input: CreateLearnedAnswerInput): LearnedAnswer;
  updateLearnedAnswer(
    id: string,
    updates: UpdateLearnedAnswerRequest
  ): LearnedAnswer | undefined;
  disableLearnedAnswer(id: string): LearnedAnswer | undefined;
  markLearnedAnswerUsed(id: string): LearnedAnswer | undefined;
}

export function createMemoryRepository(
  database: SqliteDatabase,
  options: {
    readonly now?: () => string;
    readonly createId?: () => string;
  } = {}
): MemoryRepository {
  const now = options.now ?? (() => new Date().toISOString());
  const createId = options.createId ?? randomUUID;

  return {
    listLearnedAnswers(): LearnedAnswer[] {
      return database
        .prepare<[], LearnedAnswerRow>(
          `SELECT
            id,
            raw_label,
            normalized_label,
            control_type,
            page_host,
            page_path_pattern,
            nearby_context,
            answer_type,
            answer_value_json,
            state,
            created_at,
            updated_at,
            last_used_at
          FROM learned_answers
          ORDER BY created_at DESC, id ASC`
        )
        .all()
        .map(rowToLearnedAnswer);
    },

    createLearnedAnswer(input: CreateLearnedAnswerInput): LearnedAnswer {
      const timestamp = now();
      const learnedAnswer = learnedAnswerSchema.parse({
        id: createId(),
        rawLabel: input.rawLabel,
        normalizedLabel: input.normalizedLabel,
        controlType: input.controlType,
        pageHost: input.pageHost,
        pagePathPattern: input.pagePathPattern,
        nearbyContext: input.nearbyContext,
        state: "enabled",
        createdAt: timestamp,
        updatedAt: timestamp,
        ...input.answer
      });

      database
        .prepare(
          `INSERT INTO learned_answers (
            id,
            raw_label,
            normalized_label,
            control_type,
            page_host,
            page_path_pattern,
            nearby_context,
            answer_type,
            answer_value_json,
            state,
            created_at,
            updated_at,
            last_used_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          learnedAnswer.id,
          learnedAnswer.rawLabel,
          learnedAnswer.normalizedLabel,
          learnedAnswer.controlType,
          learnedAnswer.pageHost,
          learnedAnswer.pagePathPattern ?? null,
          learnedAnswer.nearbyContext ?? null,
          learnedAnswer.answerType,
          JSON.stringify(learnedAnswer.value),
          learnedAnswer.state,
          learnedAnswer.createdAt,
          learnedAnswer.updatedAt,
          learnedAnswer.lastUsedAt ?? null
        );

      return learnedAnswer;
    },

    updateLearnedAnswer(
      id: string,
      updates: UpdateLearnedAnswerRequest
    ): LearnedAnswer | undefined {
      const current = getLearnedAnswer(database, id);

      if (!current) {
        return undefined;
      }

      const updated = learnedAnswerSchema.parse({
        ...current,
        ...mapLearnedAnswerUpdates(updates),
        updatedAt: now()
      });

      database
        .prepare(
          `UPDATE learned_answers
           SET
            raw_label = ?,
            normalized_label = ?,
            page_path_pattern = ?,
            nearby_context = ?,
            answer_type = ?,
            answer_value_json = ?,
            state = ?,
            updated_at = ?
           WHERE id = ?`
        )
        .run(
          updated.rawLabel,
          updated.normalizedLabel,
          updated.pagePathPattern ?? null,
          updated.nearbyContext ?? null,
          updated.answerType,
          JSON.stringify(updated.value),
          updated.state,
          updated.updatedAt,
          id
        );

      return updated;
    },

    disableLearnedAnswer(id: string): LearnedAnswer | undefined {
      return this.updateLearnedAnswer(id, { state: "disabled" });
    },

    markLearnedAnswerUsed(id: string): LearnedAnswer | undefined {
      const current = getLearnedAnswer(database, id);

      if (!current) {
        return undefined;
      }

      const timestamp = now();
      const updated = learnedAnswerSchema.parse({
        ...current,
        updatedAt: timestamp,
        lastUsedAt: timestamp
      });

      database
        .prepare(
          `UPDATE learned_answers
           SET updated_at = ?, last_used_at = ?
           WHERE id = ?`
        )
        .run(updated.updatedAt, updated.lastUsedAt, id);

      return updated;
    }
  };
}

function getLearnedAnswer(
  database: SqliteDatabase,
  id: string
): LearnedAnswer | undefined {
  const row = database
    .prepare<[string], LearnedAnswerRow>(
      `SELECT
        id,
        raw_label,
        normalized_label,
        control_type,
        page_host,
        page_path_pattern,
        nearby_context,
        answer_type,
        answer_value_json,
        state,
        created_at,
        updated_at,
        last_used_at
      FROM learned_answers
      WHERE id = ?`
    )
    .get(id);

  if (!row) {
    return undefined;
  }

  return rowToLearnedAnswer(row);
}

function rowToLearnedAnswer(row: LearnedAnswerRow): LearnedAnswer {
  const answerValue: unknown = JSON.parse(row.answer_value_json);

  return learnedAnswerSchema.parse({
    id: row.id,
    rawLabel: row.raw_label,
    normalizedLabel: row.normalized_label,
    controlType: row.control_type,
    pageHost: row.page_host,
    pagePathPattern: row.page_path_pattern ?? undefined,
    nearbyContext: row.nearby_context ?? undefined,
    answerType: row.answer_type,
    value: answerValue,
    state: row.state,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastUsedAt: row.last_used_at ?? undefined
  });
}

function mapLearnedAnswerUpdates(
  updates: UpdateLearnedAnswerRequest
): Record<string, unknown> {
  const mappedUpdates: Record<string, unknown> = {};

  if (updates.rawLabel !== undefined) {
    mappedUpdates.rawLabel = updates.rawLabel;
  }

  if (updates.normalizedLabel !== undefined) {
    mappedUpdates.normalizedLabel = updates.normalizedLabel;
  }

  if (updates.pagePathPattern !== undefined) {
    mappedUpdates.pagePathPattern =
      updates.pagePathPattern === null ? undefined : updates.pagePathPattern;
  }

  if (updates.nearbyContext !== undefined) {
    mappedUpdates.nearbyContext =
      updates.nearbyContext === null ? undefined : updates.nearbyContext;
  }

  if (updates.state !== undefined) {
    mappedUpdates.state = updates.state;
  }

  if (updates.answer !== undefined) {
    mappedUpdates.answerType = updates.answer.answerType;
    mappedUpdates.value = updates.answer.value;
  }

  return mappedUpdates;
}
