import { initialSchemaMigration } from "./001-initial-schema.js";

export const appMigrations = [initialSchemaMigration] as const;
