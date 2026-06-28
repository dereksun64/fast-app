import type { Page } from "playwright";

import type {
  FieldDescriptor,
  ResolverDecision
} from "../resolvers/index.js";

export type ContinuationControlKind =
  | "safe-next"
  | "final-submit"
  | "review"
  | "ambiguous";

export interface ContinuationControl {
  readonly kind: ContinuationControlKind;
  readonly label: string;
  readonly controlType: "button" | "link";
  readonly buttonType?: "button" | "submit" | "reset" | "unknown";
  readonly reason: string;
}

export interface FillFieldResult {
  readonly action: "filled" | "prompt-needed" | "skipped";
  readonly field: FieldDescriptor;
  readonly metadata: BrowserStepMetadata;
}

export interface ClickContinuationControlResult {
  readonly action: "clicked" | "blocked";
  readonly control: ContinuationControl;
  readonly reason: string;
  readonly metadata: BrowserStepMetadata;
}

export interface BrowserStepMetadata {
  readonly action:
    | "scan"
    | "fill"
    | "skip"
    | "prompt-needed"
    | "continue"
    | "blocked-continuation"
    | "screenshot"
    | "failure";
  readonly pageUrl: string;
  readonly fieldLabel?: string;
  readonly controlType?: FieldDescriptor["controlType"];
  readonly decisionAction?: ResolverDecision["action"];
  readonly source?: string;
  readonly reason?: string;
  readonly fieldCount?: number;
  readonly screenshotPath?: string;
  readonly continuationLabel?: string;
  readonly continuationKind?: ContinuationControlKind;
}

export interface SiteAdapter {
  scanPage(page: Page): Promise<readonly FieldDescriptor[]>;
  fillField(page: Page, decision: ResolverDecision): Promise<FillFieldResult>;
  classifyContinuationControls(
    page: Page
  ): Promise<readonly ContinuationControl[]>;
  clickContinuationControl(
    page: Page,
    control: ContinuationControl
  ): Promise<ClickContinuationControlResult>;
}
