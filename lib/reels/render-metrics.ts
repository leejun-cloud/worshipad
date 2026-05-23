// Stage 4 — render observability. Writes one NDJSON line per event so we can
// post-mortem failed jobs (out/.metrics/{jobId}.ndjson) and grep for slow
// slides across jobs.
import { appendFile, mkdir, writeFile } from 'fs/promises';
import path from 'path';

const METRICS_DIR = path.join(process.cwd(), 'out', '.metrics');
const FAILURES_DIR = path.join(process.cwd(), 'out', '.failures');

export type MetricEvent =
  | {
      type: 'slice_start';
      jobId: string;
      slideIndex: number;
      ts: number;
    }
  | {
      type: 'slice_done';
      jobId: string;
      slideIndex: number;
      ts: number;
      durationMs: number;
      cached: boolean;
      rssBytes: number;
    }
  | {
      type: 'slice_failed';
      jobId: string;
      slideIndex: number;
      ts: number;
      durationMs: number;
      error: string;
      attempt: number;
    }
  | {
      type: 'job_done';
      jobId: string;
      ts: number;
      totalMs: number;
      slideCount: number;
    }
  | {
      type: 'job_failed';
      jobId: string;
      ts: number;
      error: string;
    };

export const recordEvent = async (ev: MetricEvent): Promise<void> => {
  try {
    await mkdir(METRICS_DIR, { recursive: true });
    await appendFile(
      path.join(METRICS_DIR, `${ev.jobId}.ndjson`),
      JSON.stringify(ev) + '\n',
      'utf-8'
    );
  } catch {
    // Best-effort — never let metrics block render progress.
  }
};

/**
 * Persist a failing slide's inputProps so we can reproduce the failure
 * without re-running the entire pipeline. Indexed by jobId+slideIndex.
 */
export const persistFailure = async (
  jobId: string,
  slideIndex: number,
  payload: { error: string; inputProps: unknown; stack?: string }
): Promise<void> => {
  try {
    const dir = path.join(FAILURES_DIR, jobId);
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, `slide-${slideIndex}.json`),
      JSON.stringify(payload, null, 2),
      'utf-8'
    );
  } catch {
    // best-effort
  }
};
