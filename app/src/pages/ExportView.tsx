import { useThreadStore } from '../stores/threadStore';
import { exportToJSON, exportToMarkdown, downloadFile } from '../utils/export';
import { Download, FileJson, FileText } from 'lucide-react';

export function ExportView() {
  const threads = useThreadStore((s) => s.threads);
  const entries = useThreadStore((s) => s.entries);

  const handleExportJSON = () => {
    const json = exportToJSON(threads, entries);
    downloadFile(json, 'lifethread-export.json', 'application/json');
  };

  const handleExportMarkdown = () => {
    const md = exportToMarkdown(threads, entries);
    downloadFile(md, 'lifethread-export.md', 'text/markdown');
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c66b4b] mb-2">Take it with you</p>
        <h2 className="text-3xl font-bold text-[#27231f]">Export</h2>
        <p className="text-sm text-[#766e64] mt-2">
          Your notes are yours. Save a copy whenever you like.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={handleExportJSON}
          disabled={threads.length === 0}
          className="flex flex-col items-center gap-3 p-6 bg-[#fbf9f6] border border-[#e6ded2] rounded-2xl hover:border-[#8f89ca] hover:shadow-[0_8px_24px_rgba(92,74,54,0.07)] transition-all disabled:opacity-50 disabled:hover:border-[#e6ded2] disabled:hover:shadow-none"
        >
          <FileJson size={32} className="text-indigo-500" />
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-900">Export as JSON</h3>
            <p className="text-xs text-gray-400 mt-1">Full backup, machine-readable</p>
          </div>
        </button>

        <button
          onClick={handleExportMarkdown}
          disabled={threads.length === 0}
          className="flex flex-col items-center gap-3 p-6 bg-[#fbf9f6] border border-[#e6ded2] rounded-2xl hover:border-[#8f89ca] hover:shadow-[0_8px_24px_rgba(92,74,54,0.07)] transition-all disabled:opacity-50 disabled:hover:border-[#e6ded2] disabled:hover:shadow-none"
        >
          <FileText size={32} className="text-emerald-500" />
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-900">Export as Markdown</h3>
            <p className="text-xs text-gray-400 mt-1">Human-readable, great for notes apps</p>
          </div>
        </button>
      </div>

      <div className="bg-[#fff2df] rounded-2xl p-4 border border-[#f0d8bd]">
        <div className="flex items-center gap-2 mb-2">
          <Download size={16} className="text-gray-400" />
          <h4 className="text-sm font-medium text-gray-700">Export stats</h4>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-2xl font-bold text-gray-900">{threads.length}</p>
            <p className="text-xs text-gray-400">Threads</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{entries.length}</p>
            <p className="text-xs text-gray-400">Entries</p>
          </div>
        </div>
      </div>
    </div>
  );
}
