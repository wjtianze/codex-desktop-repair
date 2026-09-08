export function useQuickChatActions(React, options) {
  const current = React.useRef(options);
  current.current = options;
  const busy = React.useRef(false);
  const mounted = React.useRef(true);
  const [pending, setPending] = React.useState(false);
  React.useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const allowed = value => value.enabled === true && value.serverId != null && value.origin !== 'tpp' && !value.streaming && !value.submitting && !value.readOnly && !value.featureBlocked;
  const run = React.useCallback(async (kind, messageId, value) => {
    const state = current.current;
    if (state.conversationId !== options.conversationId || !allowed(state) || busy.current) throw new Error('This chat action is currently unavailable.');
    busy.current = true;
    if (mounted.current) setPending(true);
    try {
      const args = { conversationId: state.conversationId, isTemporaryChat: false, messageId, [kind === 'edit' ? 'prompt' : 'retry']: value };
      return await state[kind](state.scope, args);
    } catch (error) {
      state.onError(kind);
      throw error;
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  }, [options.conversationId, options.scope]);
  const edit = React.useCallback((messageId, prompt) => run('edit', messageId, prompt), [run]);
  const regenerate = React.useCallback(async (messageId, retry) => { try { return await run('regenerate', messageId, retry); } catch {} }, [run]);
  const enabled = allowed(options) && !pending;
  return { onEditUserMessage: enabled ? edit : undefined, onRegenerateResponse: enabled ? regenerate : undefined };
}
