const validString = (value, max = 160) => typeof value === 'string' && value.length > 0 && value.length <= max;
export function normalizeModelChoice(value) {
  if (!value || !validString(value.slug) || (value.thinkingEffort != null && !validString(value.thinkingEffort, 40)) || (value.versionId != null && !validString(value.versionId, 80))) return null;
  return {slug:value.slug, thinkingEffort:value.thinkingEffort ?? null, versionId:value.versionId ?? null};
}
function choiceKey(origin, id) { return validString(id, 300) ? JSON.stringify([origin ?? 'chatgpt', id]) : null; }
export function readConversationChoice(state, origin, serverId, clientId) {
  if (state?.version !== 1 || !state.choices || typeof state.choices !== 'object' || Array.isArray(state.choices)) return null;
  for (const id of [serverId, clientId]) { const key = choiceKey(origin, id); if (key && Object.hasOwn(state.choices,key)) { const choice = normalizeModelChoice(state.choices[key]); if (choice) return choice; } }
  return null;
}
export function writeConversationChoice(state, origin, serverId, clientId, value) {
  const choice = normalizeModelChoice(value), key = choiceKey(origin, serverId ?? clientId);
  if (!choice || !key) return state;
  const previous = state?.version === 1 ? state.choices?.[key] : null;
  const existingDraftKey = choiceKey(origin, clientId);
  if (previous && previous.slug === choice.slug && previous.thinkingEffort === choice.thinkingEffort && previous.versionId === choice.versionId &&
      (!existingDraftKey || existingDraftKey === key || !Object.hasOwn(state.choices,existingDraftKey))) return state;
  const choices = state?.version === 1 && state.choices && typeof state.choices === 'object' && !Array.isArray(state.choices) ? {...state.choices} : {};
  const draftKey = choiceKey(origin, clientId);
  if (draftKey && draftKey !== key) delete choices[draftKey];
  delete choices[key]; choices[key] = choice;
  return {version:1,choices};
}
export function historicalModelChoice(messages, expectedSlug) {
  if (!Array.isArray(messages)) return null;
  for (let i=messages.length-1;i>=0;i--) {
    const message=messages[i], metadata=message?.metadata;
    if (message?.author?.role !== 'assistant' || !validString(metadata?.model_slug)) continue;
    if (expectedSlug && metadata.model_slug !== expectedSlug) return null;
    if (!Object.hasOwn(metadata,'thinking_effort')) continue;
    return normalizeModelChoice({slug:metadata.model_slug,thinkingEffort:metadata.thinking_effort});
  }
  return null;
}
export function effectiveThinkingEffort(catalog, options, selection, allowNullOption) {
  if (selection?.thinkingEffort != null) return selection.thinkingEffort;
  if (allowNullOption) return null;
  const configured=catalog?.defaultThinkingEffortByModelSlug?.[selection?.slug];
  if (configured != null) return configured;
  const available=options ?? catalog?.options ?? [];
  return available.find(option=>option.slug===selection?.slug)?.thinkingEffort ?? null;
}
