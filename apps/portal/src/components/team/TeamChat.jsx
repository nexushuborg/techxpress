import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MessageSquare, Send, Lock } from 'lucide-react';
import { api } from '../../lib/api.js';
import { getSocket } from '../../lib/socket.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { Spinner } from '../ui/Spinner.jsx';
import { initials } from '../../utils/format.js';
import { cn } from '../../utils/cn.js';

// Private chat for one team. The server only lets current members read or
// post (and only members can join the team's live socket room), so this
// component simply assumes the viewer is a member.

const MAX_LEN = 1000;

const timeLabel = (iso) => {
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const mergeById = (prev, incoming) => {
  const seen = new Set(prev.map((m) => m.id));
  const merged = [...prev, ...incoming.filter((m) => !seen.has(m.id))];
  return merged.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
};

export const TeamChat = ({ teamId }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const stickToBottom = useRef(true); // auto-scroll only if the user is at the bottom
  const keepOffset = useRef(null);    // preserve position when older messages load

  const loadLatest = useCallback(async () => {
    try {
      const res = await api.get(`/api/teams/${teamId}/messages`, { query: { limit: 50 } });
      setMessages((prev) => mergeById(prev, res.messages));
      setHasMore((h) => h || res.hasMore);
    } catch (err) {
      if (err.status !== 403) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [teamId, toast]);

  // Initial load + live updates through the team's socket room. (Mount with
  // key={teamId} so switching teams starts from fresh state.)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/api/teams/${teamId}/messages`, { query: { limit: 50 } });
        if (cancelled) return;
        setMessages((prev) => mergeById(prev, res.messages));
        setHasMore(res.hasMore);
      } catch (err) {
        if (!cancelled && err.status !== 403) toast.error(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const socket = getSocket();
    if (!socket) return () => { cancelled = true; };
    const join = () => socket.emit('team:join', { teamId }, () => {});
    const onConnect = () => { join(); loadLatest(); }; // catch up after a reconnect
    const onMessage = ({ message }) => {
      if (message?.teamId === teamId) setMessages((prev) => mergeById(prev, [message]));
    };
    join();
    socket.on('connect', onConnect);
    socket.on('team:message', onMessage);
    return () => {
      cancelled = true;
      socket.off('connect', onConnect);
      socket.off('team:message', onMessage);
      socket.emit('team:leave', { teamId });
    };
  }, [teamId, loadLatest, toast]);

  // Scroll handling: stay pinned to the newest message, or keep the reading
  // position when older history is prepended.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (keepOffset.current != null) {
      el.scrollTop = el.scrollHeight - keepOffset.current;
      keepOffset.current = null;
    } else if (stickToBottom.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const onScroll = () => {
    const el = scrollRef.current;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  };

  const loadOlder = async () => {
    if (!messages.length) return;
    setLoadingOlder(true);
    try {
      const res = await api.get(`/api/teams/${teamId}/messages`, {
        query: { before: messages[0].createdAt, limit: 50 },
      });
      keepOffset.current = scrollRef.current.scrollHeight - scrollRef.current.scrollTop;
      setMessages((prev) => mergeById(prev, res.messages));
      setHasMore(res.hasMore);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingOlder(false);
    }
  };

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const { message } = await api.post(`/api/teams/${teamId}/messages`, { body });
      stickToBottom.current = true;
      setMessages((prev) => mergeById(prev, [message]));
      setDraft('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };

  return (
    <section className="border-2 border-[#151320] bg-[#fffaf0] shadow-[0_3px_0_#151320]">
      <header className="flex items-center justify-between border-b-2 border-[#151320] bg-[#f3e9d2] px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare size={15} className="text-[#a81f55]" />
          <h3 className="font-['Barlow_Condensed','Arial_Narrow',sans-serif] text-[18px] font-extrabold uppercase tracking-[0.08em] text-[#151320]">Team chat</h3>
        </div>
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#4a4458]">
          <Lock size={10} /> Members only
        </span>
      </header>

      <div ref={scrollRef} onScroll={onScroll} className="scroll-panel h-[420px] space-y-3 overflow-y-auto overscroll-contain bg-[#fffaf0] px-4 py-4">
        {hasMore && (
          <div className="flex justify-center">
            <button className="ghost-button inline-flex items-center gap-1.5 !px-3 !py-1 !text-[11px]" onClick={loadOlder} disabled={loadingOlder}>
              {loadingOlder && <Spinner size={11} />} Load earlier messages
            </button>
          </div>
        )}

        {loading && <div className="flex justify-center py-10 text-[#4a4458]"><Spinner size={16} /></div>}

        {!loading && messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <MessageSquare size={22} className="text-[#4a4458]/50" />
            <p className="font-mono text-[12px] text-[#4a4458]">No messages yet. Say hi to your team 👋</p>
          </div>
        )}

        {messages.map((m, i) => {
          const mine = m.sender.id === user.id;
          const prev = messages[i - 1];
          const grouped = prev && prev.sender.id === m.sender.id
            && new Date(m.createdAt) - new Date(prev.createdAt) < 5 * 60 * 1000;
          return (
            <div key={m.id} className={cn('flex gap-2.5', mine ? 'flex-row-reverse' : 'flex-row', grouped && '!mt-1')}>
              <div className={cn(
                'grid h-8 w-8 shrink-0 place-items-center border-2 border-[#151320] font-["Barlow_Condensed","Arial_Narrow",sans-serif] text-[13px] font-extrabold',
                mine ? 'bg-[#f5b800] text-[#151320]' : 'bg-[#151320] text-[#f3e9d2]',
                grouped && 'invisible',
              )}>
                {initials(m.sender.fullName)}
              </div>
              <div className={cn('flex max-w-[78%] flex-col', mine ? 'items-end' : 'items-start')}>
                {!grouped && (
                  <div className="mb-1 flex items-baseline gap-2 font-mono text-[10px] text-[#4a4458]">
                    <span className="font-bold text-[#151320]">{mine ? 'You' : m.sender.fullName}</span>
                    <span>{timeLabel(m.createdAt)}</span>
                  </div>
                )}
                <div className={cn(
                  'whitespace-pre-wrap break-words border-[1.5px] border-[#151320] px-3 py-2 font-sans text-[13px] leading-relaxed',
                  mine ? 'bg-[#f3e9d2] text-[#151320]' : 'bg-white text-[#151320]',
                )}>
                  {m.body}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t-2 border-[#151320] bg-[#f3e9d2] p-3">
        <div className="flex items-end gap-2">
          <textarea
            className="input-glass min-h-[44px] max-h-32 resize-none !py-2.5"
            rows={1}
            maxLength={MAX_LEN}
            placeholder="Message your team…  (Enter to send, Shift+Enter for a new line)"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button
            className="glow-button inline-flex h-[44px] shrink-0 items-center gap-1.5 !px-4"
            onClick={send}
            disabled={sending || !draft.trim()}
          >
            {sending ? <Spinner size={13} /> : <Send size={13} />} Send
          </button>
        </div>
        {draft.length > MAX_LEN * 0.8 && (
          <div className="mt-1 text-right font-mono text-[10px] text-[#4a4458]">{draft.length} / {MAX_LEN}</div>
        )}
      </div>
    </section>
  );
};
