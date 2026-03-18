'use client';

interface LogEntry {
  message: string;
  timestamp: number;
}

interface GameLogProps {
  entries: LogEntry[];
}

export default function GameLog({ entries }: GameLogProps) {
  return (
    <div className="bg-green-900 border border-green-700 rounded-xl p-3 h-32 overflow-y-auto">
      <h3 className="text-green-400 text-xs font-bold mb-2">Game Log</h3>
      <div className="space-y-1">
        {entries.slice(-10).reverse().map((entry, i) => (
          <p key={i} className="text-green-300 text-xs">{entry.message}</p>
        ))}
        {entries.length === 0 && (
          <p className="text-green-600 text-xs">Game started...</p>
        )}
      </div>
    </div>
  );
}
