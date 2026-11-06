import type { FieldErrors } from "./validation";

export type ActionResult = {
  ok: boolean;
  message?: string;
  fieldErrors?: FieldErrors;
  id?: string;
};

export function actionOk(message?: string): ActionResult {
  return { ok: true, message };
}

export function actionError(message: string, fieldErrors?: FieldErrors): ActionResult {
  return { ok: false, message, fieldErrors };
}

export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string") values[key] = value;
  });
  return values;
}
