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
        <h2 className="text-2xl font-bold text-gray-900">Export</h2>
        <p className="text-sm text-gray-500 mt-1">
          Your data belongs to you. Export everything anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={handleExportJSON}
          disabled={threads.length === 0}
          className="flex flex-col items-center gap-3 p-6 bg-white border border-gray-100 rounded-xl hover:border-indigo-200 hover:shadow-sm transition-all disabled:opacity-50 disabled:hover:border-gray-100 disabled:hover:shadow-none"
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
          className="flex flex-col items-center gap-3 p-6 bg-white border border-gray-100 rounded-xl hover:border-indigo-200 hover:shadow-sm transition-all disabled:opacity-50 disabled:hover:border-gray-100 disabled:hover:shadow-none"
        >
          <FileText size={32} className="text-emerald-500" />
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-900">Export as Markdown</h3>
            <p className="text-xs text-gray-400 mt-1">Human-readable, great for notes apps</p>
          </div>
        </button>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
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
