export function countWords(text: string): number {
  if (!text) return 0;
  // Clean markers like [INTRO] before counting words
  const clean = text.replace(/\[[A-ZÀ-Ú0-9_\-\s]+\]/gi, ' ');
  const words = clean.trim().split(/\s+/).filter((w) => w.length > 0);
  return words.length;
}

export function calculateEstimatedSeconds(wordCount: number, wpm = 130): number {
  if (wordCount <= 0) return 0;
  const safeWpm = Math.max(50, Math.min(300, wpm));
  return Math.round((wordCount / safeWpm) * 60);
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0 || isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours.toString().padStart(2, '0')}:${remMins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const KNOWN_MARKERS = ['INTRO', 'PAUSA', 'ÊNFASE', 'ENFASE', 'CTA', 'FINAL', 'DICA', 'GANCHO'];

export function parseScriptContent(content: string, hideMarkers: boolean) {
  if (!content) return [];

  const lines = content.split('\n');
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    const isMarker = /^\[[A-ZÀ-Ú0-9_\-\s]+\]$/i.test(trimmed);
    const markerType = isMarker ? trimmed.replace(/[\[\]]/g, '').toUpperCase() : null;

    return {
      id: `line-${idx}`,
      raw: line,
      isMarker,
      markerType,
      shouldRender: !(isMarker && hideMarkers),
    };
  });
}
