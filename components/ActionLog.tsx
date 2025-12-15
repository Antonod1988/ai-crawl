
import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface ActionLogProps {
  logs: LogEntry[];
  showMechanics: boolean;
}

const ActionLog: React.FC<ActionLogProps> = ({ logs, showMechanics }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-4 overflow-y-auto scrollbar-custom h-96 shadow-inner relative">
      <div className="space-y-4">
        {logs.map((log) => (
          <div key={log.id} className="flex flex-col gap-1">
            <div className={`text-sm leading-relaxed font-medium
              ${log.type === 'narrative' ? 'text-slate-300 italic' : ''}
              ${log.type === 'combat' ? 'text-red-400' : ''}
              ${log.type === 'loot' ? 'text-yellow-400' : ''}
              ${log.type === 'system' ? 'text-blue-400' : ''}
            `}>
              <span className="opacity-50 text-xs mr-2 font-mono">
                [{new Date(log.timestamp).toLocaleTimeString([], {hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit'})}]
              </span>
              {log.text}
            </div>
            
            {showMechanics && log.mechanics && (
              <div className="ml-10 text-[10px] font-mono text-slate-600 border-l-2 border-slate-800 pl-2">
                ⚙️ {log.mechanics}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default ActionLog;
