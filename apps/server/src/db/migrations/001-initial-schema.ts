import type { Migration } from "../migrations.js";

export const initialSchemaMigration: Migration = {
  id: "001",
  name: "initial application persistence schema",
  sql: `
    CREATE TABLE applicant_profiles (
      id TEXT PRIMARY KEY CHECK (id = 'default'),
      profile_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE learned_answers (
      id TEXT PRIMARY KEY,
      raw_label TEXT NOT NULL,
      normalized_label TEXT NOT NULL,
      control_type TEXT NOT NULL CHECK (
        control_type IN ('text', 'textarea', 'select', 'checkbox', 'radio')
      ),
      page_host TEXT NOT NULL,
      page_path_pattern TEXT,
      nearby_context TEXT,
      answer_type TEXT NOT NULL CHECK (
        answer_type IN ('text', 'boolean', 'option')
      ),
      answer_value_json TEXT NOT NULL,
      state TEXT NOT NULL CHECK (state IN ('enabled', 'disabled')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_used_at TEXT
    );

    CREATE INDEX learned_answers_lookup_idx
      ON learned_answers (
        state,
        normalized_label,
        control_type,
        page_host
      );

    CREATE TABLE application_runs (
      id TEXT PRIMARY KEY,
      job_url TEXT NOT NULL,
      status TEXT NOT NULL CHECK (
        status IN (
          'pending',
          'starting',
          'scanning',
          'filling',
          'prompting',
          'waitingForReview',
          'failed',
          'canceled',
          'completed'
        )
      ),
      current_prompt_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      started_at TEXT,
      completed_at TEXT,
      failed_at TEXT,
      canceled_at TEXT,
      FOREIGN KEY (current_prompt_id) REFERENCES prompts(id) ON DELETE SET NULL
    );

    CREATE TABLE prompts (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('open', 'answered', 'skipped')),
      field_label TEXT NOT NULL,
      normalized_field_label TEXT NOT NULL,
      control_type TEXT NOT NULL CHECK (
        control_type IN ('text', 'textarea', 'select', 'checkbox', 'radio')
      ),
      page_host TEXT NOT NULL,
      page_path TEXT,
      nearby_context TEXT,
      message TEXT NOT NULL,
      response_json TEXT,
      created_at TEXT NOT NULL,
      answered_at TEXT,
      FOREIGN KEY (run_id) REFERENCES application_runs(id) ON DELETE CASCADE
    );

    CREATE INDEX prompts_run_id_idx ON prompts (run_id, created_at);
    CREATE INDEX prompts_status_idx ON prompts (status);

    CREATE TABLE run_steps (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK (
        status IN (
          'pending',
          'starting',
          'scanning',
          'filling',
          'prompting',
          'waitingForReview',
          'failed',
          'canceled',
          'completed'
        )
      ),
      level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'error')),
      message TEXT NOT NULL,
      page_url TEXT,
      field_label TEXT,
      prompt_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (run_id) REFERENCES application_runs(id) ON DELETE CASCADE,
      FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE SET NULL
    );

    CREATE INDEX run_steps_run_id_idx ON run_steps (run_id, created_at);

    CREATE TABLE screenshot_metadata (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      step_id TEXT,
      file_path TEXT NOT NULL,
      page_url TEXT,
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (run_id) REFERENCES application_runs(id) ON DELETE CASCADE,
      FOREIGN KEY (step_id) REFERENCES run_steps(id) ON DELETE SET NULL
    );

    CREATE INDEX screenshot_metadata_run_id_idx
      ON screenshot_metadata (run_id, created_at);

    CREATE UNIQUE INDEX application_runs_current_prompt_idx
      ON application_runs (current_prompt_id)
      WHERE current_prompt_id IS NOT NULL;
  `
};
