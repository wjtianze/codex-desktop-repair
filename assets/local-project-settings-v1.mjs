export function createProjectSourceTracker(notify) {
  let changed = false;
  let pending = 0;
  let saving = false;
  const publish = () => notify({changed, pending});
  return {
    get pending() { return pending; },
    beginSave() {
      if (pending > 0 || saving) return false;
      saving = true;
      return true;
    },
    endSave() { saving = false; },
    track(operation) {
      if (saving) return Promise.reject(new Error('Project settings are being saved. Try again when saving finishes.'));
      pending += 1;
      publish();
      return Promise.resolve().then(operation).then(value => {
        changed = true;
        return value;
      }).finally(() => {
        pending -= 1;
        publish();
      });
    }
  };
}
