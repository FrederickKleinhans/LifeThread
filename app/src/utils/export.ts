import type { Thread, Entry } from '../types';
import { format } from 'date-fns';

export function exportToJSON(threads: Thread[], entries: Entry[]): string {
  const data = threads.map((thread) => ({
    ...thread,
    entries: entries
      .filter((e) => e.thread_id === thread.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
  }));
  return JSON.stringify(data, null, 2);
}

export function exportToMarkdown(threads: Thread[], entries: Entry[]): string {
  let md = '# LifeThread Export\n\n';
  md += `*Exported on ${format(new Date(), 'MMMM d, yyyy')}*\n\n`;

  for (const thread of threads) {
    md += `## ${thread.title}\n\n`;
    md += `- **Folder:** ${thread.folder}${thread.subfolder ? ` > ${thread.subfolder}` : ''}\n`;
    md += `- **Tags:** ${thread.tags.length > 0 ? thread.tags.join(', ') : 'none'}\n`;
    md += `- **Created:** ${format(new Date(thread.created_at), 'MMM d, yyyy')}\n\n`;

    const threadEntries = entries
      .filter((e) => e.thread_id === thread.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (threadEntries.length > 0) {
      md += '### Timeline\n\n';
      for (const entry of threadEntries) {
        const date = format(new Date(entry.created_at), 'MMM d, yyyy h:mm a');
        md += `- **[${entry.type}]** ${entry.body} *(${date})*\n`;
      }
      md += '\n';
    }

    md += '---\n\n';
  }

  return md;
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
