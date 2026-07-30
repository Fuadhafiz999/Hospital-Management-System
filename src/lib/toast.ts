// ═══════════════════════════════════════════════════════════════════
//  Toast Helpers
//  Consistent toast notifications using Sonner.
//  Usage:
//    import { showSuccess, showError, showPromise } from "@/lib/toast";
//    showSuccess("Appointment booked successfully!");
//    showError("Failed to save record.", "Please try again");
//    showPromise(saveData(), "Saving...", "Saved!", "Failed to save");
// ═══════════════════════════════════════════════════════════════════

import { toast } from "sonner";

/**
 * Show a success toast with an optional description.
 */
export function showSuccess(title: string, description?: string) {
  toast.success(title, {
    description,
    duration: 4000,
  });
}

/**
 * Show an error toast with an optional description.
 */
export function showError(title: string, description?: string) {
  toast.error(title, {
    description,
    duration: 6000,
  });
}

/**
 * Show an info toast with an optional description.
 */
export function showInfo(title: string, description?: string) {
  toast.info(title, {
    description,
    duration: 4000,
  });
}

/**
 * Show a warning toast with an optional description.
 */
export function showWarning(title: string, description?: string) {
  toast.warning(title, {
    description,
    duration: 5000,
  });
}

/**
 * Wrap a promise with loading/success/error toast states.
 *
 * @param promise  — The async operation to track.
 * @param loading  — Message shown while the promise is pending.
 * @param success  — Message (or callback) on resolution.
 * @param error    — Message (or callback) on rejection.
 * @returns        The promise so callers can await it.
 */
export function showPromise<T>(
  promise: Promise<T>,
  loading: string,
  success: string | ((data: T) => string),
  error: string | ((err: unknown) => string),
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    toast.promise(promise, {
      loading,
      success: (data: T) =>
        typeof success === "function" ? success(data) : success,
      error: (err: unknown) =>
        typeof error === "function" ? error(err) : error,
    });

    promise.then(resolve).catch(reject);
  });
}
