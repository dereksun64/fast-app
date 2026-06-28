import { runEventSchema, type RunEvent } from "@fast-app/shared";

export type RunEventListener = (event: RunEvent) => void;

export interface RunEventPublisher {
  publish(event: RunEvent): void;
  subscribe(listener: RunEventListener): () => void;
  subscribeToRun(runId: string, listener: RunEventListener): () => void;
}

export function createRunEventPublisher(): RunEventPublisher {
  const listeners = new Set<RunEventListener>();

  return {
    publish(event: RunEvent): void {
      const validatedEvent = runEventSchema.parse(event);

      for (const listener of listeners) {
        listener(validatedEvent);
      }
    },

    subscribe(listener: RunEventListener): () => void {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },

    subscribeToRun(runId: string, listener: RunEventListener): () => void {
      return this.subscribe((event) => {
        if (event.runId === runId) {
          listener(event);
        }
      });
    }
  };
}
