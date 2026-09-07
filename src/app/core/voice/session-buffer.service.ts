import { Injectable } from '@angular/core';

/**
 * What a dictated examination has recorded but not yet saved.
 *
 * ── Why there is a buffer at all ────────────────────────────────────────
 *
 * Findings used to be written to the clinical record as they were dictated.
 * That is safe against crashes and wrong for the workflow: the dentist wants
 * to review, correct and prune a consultation before any of it becomes part
 * of the record, and by then the writes have already happened. So dictation
 * now accumulates here and is committed once, at review.
 *
 * ── Why IndexedDB and not memory ────────────────────────────────────────
 *
 * Buffering moves the risk: a closed tab, a flat battery or a crashed browser
 * now loses a consultation that would previously have been half-written. This
 * is the answer to that — the buffer survives a reload, and the dossier offers
 * to resume it. It is a second line of defence rather than the only one: every
 * command is also audited server-side as it is spoken, so even a lost buffer
 * leaves a record of what was said.
 *
 * ── What is stored ─────────────────────────────────────────────────────
 *
 * Transcripts and resolved intents. Not audio: a consultation recording in a
 * browser profile is an exposure with no corresponding use, since the clip has
 * already been transcribed by the time an entry is written here.
 */

export interface BufferedCommand {
  /** Server-side audit row id — what commit approves or rejects. */
  auditId: string;
  intent: string;
  entities: Record<string, unknown>;
  /** What the dentist actually said, for the review page's "heard" column. */
  transcript: string;
  /** Human-readable preview, as shown in the HUD at dictation time. */
  preview: string;
  /** Terms the fuzzy matcher repaired, so review can show what was corrected. */
  corrections: { from: string; to: string }[];
  at: number;
}

export interface BufferedSession {
  sessionId: string;
  patientId: string;
  patientName: string;
  locale: string;
  startedAt: number;
  updatedAt: number;
  commands: BufferedCommand[];
}

const DB_NAME = 'orthoflow-voice';
const DB_VERSION = 1;
const STORE = 'sessions';

/**
 * A buffer older than this is not resumable. A dentist coming back to a
 * two-day-old half-finished consultation is not resuming it — they are
 * looking at something they have forgotten the context of, and the server's
 * PENDING_REVIEW list is the right place to pick that up rather than a
 * browser-local blob.
 */
const EXPIRY_MS = 24 * 60 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class SessionBufferService {
  private dbPromise: Promise<IDBDatabase | null> | null = null;

  /**
   * IndexedDB is unavailable in private windows in some browsers and can be
   * disabled outright. Every method resolves to a null-ish result in that
   * case rather than throwing: losing crash-resilience is a degradation, not
   * a reason to block a consultation.
   */
  private open(): Promise<IDBDatabase | null> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise<IDBDatabase | null>(resolve => {
      if (typeof indexedDB === 'undefined') {
        resolve(null);
        return;
      }
      let request: IDBOpenDBRequest;
      try {
        request = indexedDB.open(DB_NAME, DB_VERSION);
      } catch {
        resolve(null);
        return;
      }
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'sessionId' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    });
    return this.dbPromise;
  }

  private async withStore<T>(
    mode: IDBTransactionMode,
    action: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T | null> {
    const db = await this.open();
    if (!db) return null;
    return new Promise<T | null>(resolve => {
      try {
        const transaction = db.transaction(STORE, mode);
        const request = action(transaction.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  async begin(session: Omit<BufferedSession, 'commands' | 'updatedAt'>): Promise<void> {
    await this.withStore('readwrite', store => store.put({
      ...session,
      commands: [],
      updatedAt: Date.now(),
    } satisfies BufferedSession));
  }

  /**
   * Appends one dictated command.
   *
   * Read-modify-write rather than an append-only store of individual commands:
   * a consultation is tens of entries, not thousands, and keeping the session
   * as one record means a partially-written buffer is never a possibility.
   */
  async append(sessionId: string, command: BufferedCommand): Promise<void> {
    const session = await this.get(sessionId);
    if (!session) return;
    session.commands.push(command);
    session.updatedAt = Date.now();
    await this.withStore('readwrite', store => store.put(session));
  }

  /** Drops one command — the hands-free "annule ça" during dictation. */
  async remove(sessionId: string, auditId: string): Promise<void> {
    const session = await this.get(sessionId);
    if (!session) return;
    session.commands = session.commands.filter(command => command.auditId !== auditId);
    session.updatedAt = Date.now();
    await this.withStore('readwrite', store => store.put(session));
  }

  async get(sessionId: string): Promise<BufferedSession | null> {
    const result = await this.withStore<BufferedSession>('readonly', store => store.get(sessionId));
    return result ?? null;
  }

  /** Called once the server has accepted the commit. */
  async clear(sessionId: string): Promise<void> {
    await this.withStore('readwrite', store => store.delete(sessionId));
  }

  /**
   * An unfinished session for this patient, if one is worth resuming.
   *
   * Scoped to the patient on purpose: offering to resume Ahmed's half-finished
   * examination while the dentist has Fatima's dossier open is how findings
   * end up on the wrong chart.
   */
  async findResumable(patientId: string): Promise<BufferedSession | null> {
    const all = await this.withStore<BufferedSession[]>('readonly', store => store.getAll());
    if (!all) return null;

    const cutoff = Date.now() - EXPIRY_MS;
    const stale = all.filter(session => session.updatedAt < cutoff);
    // Opportunistic cleanup: expired buffers have no other reaper, and this is
    // the only code path that reliably runs.
    for (const session of stale) {
      await this.clear(session.sessionId);
    }

    return all
      .filter(session => session.patientId === patientId
        && session.updatedAt >= cutoff
        && session.commands.length > 0)
      .sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null;
  }
}
