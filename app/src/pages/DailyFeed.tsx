import { useNavigate } from 'react-router-dom';
import { QuickCapture } from '../components/QuickCapture';
import { EntryCard } from '../components/EntryCard';
import { useDailyFeed, useAllFeed } from '../hooks/useDailyFeed';
import { Newspaper } from 'lucide-react';

export function DailyFeed() {
  const navigate = useNavigate();
  const todayFeed = useDailyFeed();
  const allFeed = useAllFeed();

  const feedToShow = todayFeed.length > 0 ? todayFeed : allFeed.slice(0, 20);
  const showingAll = todayFeed.length === 0 && allFeed.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Daily Feed</h2>
        <p className="text-sm text-gray-500 mt-1">
          {showingAll ? 'Recent entries across all threads' : "Everything you touched today"}
        </p>
      </div>

      <QuickCapture />

      {feedToShow.length === 0 ? (
        <div className="text-center py-16">
          <Newspaper size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-500">Nothing here yet</h3>
          <p className="text-sm text-gray-400 mt-1">
            Start by capturing something above. Your day begins here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedToShow.map((item) => (
            <EntryCard
              key={item.entry.id}
              entry={item.entry}
              threadTitle={item.thread.title}
              onThreadClick={() => navigate(`/thread/${item.thread.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
