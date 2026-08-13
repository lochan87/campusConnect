import { useEffect, useRef, useCallback } from 'react';

/**
 * Feature #20 — Persistent Draft Auto-Save
 *
 * Correctly saves formData to localStorage every `interval` ms using a ref
 * to avoid stale-closure issues. A single long-lived interval reads from the
 * ref so the timer never restarts on every keystroke.
 *
 * @param {string}   key        - Unique localStorage key, e.g. 'draft_post'
 * @param {object}   formData   - Current form state (kept current via ref)
 * @param {Function} setFormData - Setter to restore a draft
 * @param {number}   interval   - Auto-save interval in ms (default 3000)
 * @returns {{ hasDraft, draftAge, resumeDraft, discardDraft }}
 */
const useDraft = (key, formData, setFormData, interval = 3000) => {
  // Always holds the latest formData without re-creating the interval
  const latestFormData = useRef(formData);
  useEffect(() => {
    latestFormData.current = formData;
  }); // runs after every render — no deps needed

  // --- Helpers (stable references) ---
  const getSaved = useCallback(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [key]);

  const save = useCallback((data) => {
    try {
      // Don't persist if every field is empty
      const hasContent = Object.entries(data).some(([, v]) =>
        typeof v === 'string' ? v.trim().length > 0 : Boolean(v)
      );
      if (!hasContent) return;
      localStorage.setItem(key, JSON.stringify({ data, savedAt: Date.now() }));
    } catch {
      // localStorage unavailable (private mode / quota) — silently ignore
    }
  }, [key]);

  const discard = useCallback(() => {
    try { localStorage.removeItem(key); } catch { /* noop */ }
  }, [key]);

  // --- Single long-lived auto-save timer ---
  // Reads from ref so it never needs to restart when formData changes.
  useEffect(() => {
    const timer = setInterval(() => save(latestFormData.current), interval);
    return () => clearInterval(timer);
    // key and interval are the only real dependencies — formData is via ref
  }, [key, interval, save]);

  // --- Public API ---
  // Read draft state once at mount (getSaved is stable so no closure issue)
  const savedRef = useRef(getSaved());

  const hasDraft = Boolean(savedRef.current);
  const draftAge = savedRef.current
    ? Math.max(0, Math.round((Date.now() - savedRef.current.savedAt) / 1000 / 60))
    : 0;

  const resumeDraft = useCallback(() => {
    const latest = getSaved();
    if (!latest?.data) return;
    // Restore only primitives + arrays — skip non-serialisable File objects
    const restorable = {};
    Object.entries(latest.data).forEach(([k, v]) => {
      if (v === null || typeof v !== 'object' || Array.isArray(v)) {
        restorable[k] = v;
      }
      // objects that survived JSON serialisation (no File/Blob) are safe
      else if (Object.getPrototypeOf(v) === Object.prototype) {
        restorable[k] = v;
      }
    });
    setFormData(prev => ({ ...prev, ...restorable }));
    // Update the ref so subsequent saves don't immediately overwrite
    savedRef.current = getSaved();
  }, [getSaved, setFormData]);

  const discardDraft = useCallback(() => {
    discard();
    savedRef.current = null;
  }, [discard]);

  return { hasDraft, draftAge, resumeDraft, discardDraft };
};

export default useDraft;
