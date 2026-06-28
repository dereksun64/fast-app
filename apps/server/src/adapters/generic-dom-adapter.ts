import { normalizeNearbyContext } from "@fast-app/shared";
import type { Locator, Page } from "playwright";

import type {
  FieldDescriptor,
  FieldOptionDescriptor,
  ResolverDecision
} from "../resolvers/index.js";
import type {
  BrowserStepMetadata,
  ContinuationControl,
  FillFieldResult,
  SiteAdapter
} from "./site-adapter.js";

interface ScannedFieldControl {
  readonly id?: string | undefined;
  readonly name?: string | undefined;
  readonly label: string;
  readonly controlType: FieldDescriptor["controlType"];
  readonly placeholder?: string | undefined;
  readonly ariaLabel?: string | undefined;
  readonly nearbyContext?: string | undefined;
  readonly options?: readonly FieldOptionDescriptor[] | undefined;
  readonly required?: boolean | undefined;
}

interface ScannedContinuationControl {
  readonly label: string;
  readonly controlType: "button" | "link";
}

export function createGenericDomAdapter(): SiteAdapter {
  return {
    async scanPage(page: Page): Promise<readonly FieldDescriptor[]> {
      const pageUrl = new URL(page.url());
      const scannedFields = await scanFieldControls(page);

      return scannedFields.map((field) =>
        toFieldDescriptor(field, pageUrl.hostname, pageUrl.pathname)
      );
    },

    async fillField(
      page: Page,
      decision: ResolverDecision
    ): Promise<FillFieldResult> {
      if (decision.action === "prompt") {
        return metadataResult("prompt-needed", page, decision);
      }

      if (decision.action === "skip") {
        return metadataResult("skipped", page, decision);
      }

      await fillApprovedDecision(page, decision);

      return metadataResult("filled", page, decision);
    },

    async classifyContinuationControls(
      page: Page
    ): Promise<readonly ContinuationControl[]> {
      const controls = await scanContinuationControls(page);

      return controls.map((control) => ({
        ...control,
        kind: classifyContinuationLabel(control.label)
      }));
    }
  };
}

export function createScanStepMetadata(
  pageUrl: string,
  fieldCount: number
): BrowserStepMetadata {
  return {
    action: "scan",
    pageUrl,
    fieldCount
  };
}

export function createFailureStepMetadata(
  pageUrl: string,
  reason: string,
  field?: FieldDescriptor
): BrowserStepMetadata {
  return {
    action: "failure",
    pageUrl,
    reason,
    ...(field
      ? {
          fieldLabel: field.label,
          controlType: field.controlType
        }
      : {})
  };
}

async function fillApprovedDecision(
  page: Page,
  decision: Extract<ResolverDecision, { action: "fill" }>
): Promise<void> {
  const field = decision.field;

  switch (field.controlType) {
    case "text":
    case "textarea":
      if (decision.answer.answerType !== "text") {
        throw new Error("Text fields require a text answer.");
      }

      await fieldLocator(page, field).fill(decision.answer.value);
      return;

    case "select":
      if (decision.answer.answerType !== "option") {
        throw new Error("Select fields require an option answer.");
      }

      await selectOption(page, field, decision.answer.value);
      return;

    case "checkbox":
      if (decision.answer.answerType !== "boolean") {
        throw new Error("Checkbox fields require a boolean answer.");
      }

      await fieldLocator(page, field).setChecked(decision.answer.value);
      return;

    case "radio":
      if (decision.answer.answerType !== "option") {
        throw new Error("Radio fields require an option answer.");
      }

      await checkRadioOption(page, field, decision.answer.value);
      return;
  }
}

async function selectOption(
  page: Page,
  field: FieldDescriptor,
  answerValue: string
): Promise<void> {
  const locator = fieldLocator(page, field);
  const matchingOption = findFieldOption(field.options, answerValue);
  const valueToSelect = matchingOption?.value ?? answerValue;

  try {
    await locator.selectOption({ value: valueToSelect });
  } catch {
    await locator.selectOption({ label: matchingOption?.label ?? answerValue });
  }
}

async function checkRadioOption(
  page: Page,
  field: FieldDescriptor,
  answerValue: string
): Promise<void> {
  const matchingOption = findFieldOption(field.options, answerValue);
  const optionValue = matchingOption?.value ?? answerValue;

  if (field.name) {
    const byValue = page
      .locator(
        `input[type="radio"][name="${escapeCssAttribute(field.name)}"][value="${escapeCssAttribute(
          optionValue
        )}"]`
      )
      .first();

    if ((await byValue.count()) > 0) {
      await byValue.check();
      return;
    }
  }

  await page.getByLabel(matchingOption?.label ?? answerValue, {
    exact: true
  }).check();
}

function fieldLocator(page: Page, field: FieldDescriptor): Locator {
  if (field.id) {
    return page.locator(`[id="${escapeCssAttribute(field.id)}"]`).first();
  }

  if (field.name) {
    return page.locator(`[name="${escapeCssAttribute(field.name)}"]`).first();
  }

  if (field.label) {
    return page.getByLabel(field.label, { exact: true }).first();
  }

  if (field.placeholder) {
    return page.getByPlaceholder(field.placeholder, { exact: true }).first();
  }

  if (field.ariaLabel) {
    return page.getByLabel(field.ariaLabel, { exact: true }).first();
  }

  throw new Error("A fillable field needs a stable id, name, label, or placeholder.");
}

function findFieldOption(
  options: readonly FieldOptionDescriptor[] | undefined,
  answerValue: string
): FieldOptionDescriptor | undefined {
  return options?.find((option) => {
    return option.value === answerValue || option.label === answerValue;
  });
}

function metadataResult(
  action: FillFieldResult["action"],
  page: Page,
  decision: ResolverDecision
): FillFieldResult {
  const metadata: BrowserStepMetadata = {
    action:
      action === "filled"
        ? "fill"
        : action === "prompt-needed"
          ? "prompt-needed"
          : "skip",
    pageUrl: page.url(),
    fieldLabel: decision.field.label,
    controlType: decision.field.controlType,
    decisionAction: decision.action,
    reason: decision.reason,
    ...(decision.action === "fill" ? { source: decision.source } : {})
  };

  return {
    action,
    field: decision.field,
    metadata
  };
}

function toFieldDescriptor(
  field: ScannedFieldControl,
  pageHost: string,
  pagePath: string
): FieldDescriptor {
  return {
    label: field.label,
    controlType: field.controlType,
    pageHost: pageHost.toLowerCase(),
    pagePath,
    ...(field.id ? { id: field.id } : {}),
    ...(field.name ? { name: field.name } : {}),
    ...(field.placeholder ? { placeholder: field.placeholder } : {}),
    ...(field.ariaLabel ? { ariaLabel: field.ariaLabel } : {}),
    ...(field.nearbyContext ? { nearbyContext: field.nearbyContext } : {}),
    ...(field.options ? { options: field.options } : {}),
    ...(field.required !== undefined ? { required: field.required } : {})
  };
}

function classifyContinuationLabel(
  label: string
): ContinuationControl["kind"] {
  const normalized = label.trim().toLowerCase();

  if (
    /\b(submit|apply|finish|send application|complete application)\b/.test(
      normalized
    )
  ) {
    return "final-submit";
  }

  if (/\b(next|continue|save and continue|review)\b/.test(normalized)) {
    return "continue";
  }

  return "unknown";
}

function escapeCssAttribute(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

async function scanFieldControls(page: Page): Promise<readonly ScannedFieldControl[]> {
  const fields = await page.evaluate(() => {
    const textInputTypes = new Set([
      "",
      "text",
      "email",
      "tel",
      "url",
      "number",
      "search"
    ]);

    function visibleText(element: Element | null | undefined): string {
      if (!element) {
        return "";
      }

      const text = (element.textContent ?? "").replace(/\s+/g, " ").trim();

      return text.slice(0, 500);
    }

    function isVisible(element: HTMLElement): boolean {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();

      return (
        style.visibility !== "hidden" &&
        style.display !== "none" &&
        rect.width > 0 &&
        rect.height > 0
      );
    }

    function isScannable(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): boolean {
      return !element.disabled && isVisible(element);
    }

    function textFromIds(ids: string | null): string {
      if (!ids) {
        return "";
      }

      return ids
        .split(/\s+/)
        .map((id) => visibleText(document.getElementById(id)))
        .filter(Boolean)
        .join(" ");
    }

    function labelFor(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): string {
      const labels = Array.from(element.labels ?? [])
        .map((label) => visibleText(label))
        .filter(Boolean)
        .join(" ");
      const ariaLabel = element.getAttribute("aria-label")?.trim() ?? "";
      const labelledBy = textFromIds(element.getAttribute("aria-labelledby"));
      const placeholder =
        "placeholder" in element ? element.placeholder.trim() : "";

      return (
        labels ||
        ariaLabel ||
        labelledBy ||
        placeholder ||
        element.getAttribute("name") ||
        element.id ||
        ""
      );
    }

    function legendFor(element: Element): string {
      return visibleText(element.closest("fieldset")?.querySelector("legend"));
    }

    function fieldsetQuestionFor(element: Element): string {
      const fieldset = element.closest("fieldset");

      if (!fieldset) {
        return "";
      }

      const questionElement = Array.from(
        fieldset.querySelectorAll("p, h1, h2, h3, h4, h5, h6")
      ).find((candidate) => visibleText(candidate).length > 0);

      return visibleText(questionElement);
    }

    function previousText(element: Element): string {
      let sibling = element.previousElementSibling;

      while (sibling) {
        const text = visibleText(sibling);

        if (text) {
          return text;
        }

        sibling = sibling.previousElementSibling;
      }

      return "";
    }

    function nearbyContext(element: Element, label: string): string | undefined {
      const context = [
        legendFor(element),
        previousText(element),
        visibleText(element.closest("section, article, form, fieldset, div")),
        label
      ]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 500);

      return context || undefined;
    }

    function optionFor(input: HTMLInputElement): { label: string; value?: string } {
      const label = labelFor(input);

      return {
        label,
        value: input.value || label
      };
    }

    const fields: ScannedFieldControl[] = [];
    const radioInputs = Array.from(
      document.querySelectorAll<HTMLInputElement>('input[type="radio"]')
    ).filter(isScannable);
    const radioGroups = new Map<string, HTMLInputElement[]>();

    for (const input of radioInputs) {
      const key =
        input.name ||
        input.closest("fieldset")?.querySelector("legend")?.textContent?.trim() ||
        input.id;

      if (!key) {
        continue;
      }

      radioGroups.set(key, [...(radioGroups.get(key) ?? []), input]);
    }

    for (const input of Array.from(document.querySelectorAll<HTMLInputElement>("input"))) {
      const type = input.type.toLowerCase();

      if (!isScannable(input)) {
        continue;
      }

      if (textInputTypes.has(type)) {
        const label = labelFor(input);
        fields.push({
          id: input.id || undefined,
          name: input.name || undefined,
          label,
          controlType: "text",
          placeholder: input.placeholder || undefined,
          ariaLabel: input.getAttribute("aria-label") ?? undefined,
          nearbyContext: nearbyContext(input, label),
          required: input.required || undefined
        });
      }

      if (type === "checkbox") {
        const label = labelFor(input);
        fields.push({
          id: input.id || undefined,
          name: input.name || undefined,
          label,
          controlType: "checkbox",
          ariaLabel: input.getAttribute("aria-label") ?? undefined,
          nearbyContext: nearbyContext(input, label),
          options: [optionFor(input)],
          required: input.required || undefined
        });
      }
    }

    for (const textarea of Array.from(document.querySelectorAll<HTMLTextAreaElement>("textarea"))) {
      if (!isScannable(textarea)) {
        continue;
      }

      const label = labelFor(textarea);
      fields.push({
        id: textarea.id || undefined,
        name: textarea.name || undefined,
        label,
        controlType: "textarea",
        placeholder: textarea.placeholder || undefined,
        ariaLabel: textarea.getAttribute("aria-label") ?? undefined,
        nearbyContext: nearbyContext(textarea, label),
        required: textarea.required || undefined
      });
    }

    for (const select of Array.from(document.querySelectorAll<HTMLSelectElement>("select"))) {
      if (!isScannable(select)) {
        continue;
      }

      const label = labelFor(select);
      fields.push({
        id: select.id || undefined,
        name: select.name || undefined,
        label,
        controlType: "select",
        ariaLabel: select.getAttribute("aria-label") ?? undefined,
        nearbyContext: nearbyContext(select, label),
        options: Array.from(select.options)
          .filter((option) => !option.disabled && option.text.trim().length > 0)
          .map((option) => ({
            label: option.text.trim(),
            value: option.getAttribute("value") ?? option.text.trim()
          })),
        required: select.required || undefined
      });
    }

    for (const [key, inputs] of radioGroups) {
      const firstInput = inputs[0];

      if (!firstInput) {
        continue;
      }

      const legend = legendFor(firstInput);
      const labelledBy = textFromIds(firstInput.getAttribute("aria-labelledby"));
      const fieldsetQuestion = fieldsetQuestionFor(firstInput);
      const label = labelledBy || fieldsetQuestion || legend || firstInput.name || key;
      fields.push({
        id: firstInput.id || undefined,
        name: firstInput.name || undefined,
        label,
        controlType: "radio",
        ariaLabel: firstInput.getAttribute("aria-label") ?? undefined,
        nearbyContext: nearbyContext(firstInput, label),
        options: inputs.map(optionFor),
        required: inputs.some((input) => input.required) || undefined
      });
    }

    return fields;
  });

  return fields.map((field) => ({
    ...field,
    label: field.label.trim(),
    nearbyContext: field.nearbyContext
      ? normalizeNearbyContext(field.nearbyContext)
      : undefined
  }));
}

async function scanContinuationControls(
  page: Page
): Promise<readonly ScannedContinuationControl[]> {
  return page.evaluate(() => {
    function visibleText(element: Element): string {
      return (element.textContent ?? "").replace(/\s+/g, " ").trim();
    }

    function isVisible(element: HTMLElement): boolean {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();

      return (
        style.visibility !== "hidden" &&
        style.display !== "none" &&
        rect.width > 0 &&
        rect.height > 0
      );
    }

    const buttons = Array.from(
      document.querySelectorAll<HTMLButtonElement | HTMLInputElement>(
        "button, input[type='submit'], input[type='button']"
      )
    )
      .filter((button) => !button.disabled && isVisible(button))
      .map((button) => ({
        label:
          button instanceof HTMLInputElement
            ? button.value || button.getAttribute("aria-label") || ""
            : visibleText(button) || button.getAttribute("aria-label") || "",
        controlType: "button" as const
      }))
      .filter((button) => button.label.trim().length > 0);

    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("a"))
      .filter((link) => isVisible(link))
      .map((link) => ({
        label: visibleText(link) || link.getAttribute("aria-label") || "",
        controlType: "link" as const
      }))
      .filter((link) => link.label.trim().length > 0);

    return [...buttons, ...links];
  });
}
