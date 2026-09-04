import { CanDeactivateFn } from '@angular/router';

export interface HasPendingChanges {
  hasUnsavedChanges(): boolean;
}

export const pendingChangesGuard: CanDeactivateFn<HasPendingChanges> = component => {
  if (!component?.hasUnsavedChanges?.()) return true;
  return window.confirm('You have unsaved changes. Leave this page and discard them?');
};
