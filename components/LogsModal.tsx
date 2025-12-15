
import React from 'react';
import { LogEntry } from '../types';
import { getTranslation } from '../translations';

interface LogsModalProps {
    logs: LogEntry[];
    onClose: () => void;
    language: string;
}

const LogsModal: React.FC<LogsModalProps> = ({ logs, onClose, language }) => {
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-600 rounded-lg p-6 max-w-3xl w-full m-4 shadow-2xl relative h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2 shrink-0">
                    <h2 className="text-2xl font-fantasy text-amber-500">{getTranslation(language, 'adventureLog')}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">&times;</button>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-custom bg-slate-950 p-4 rounded border border-slate-800 font-mono text-sm space-y-2">
                    {logs.length === 0 ? (
                        <p className="text-slate-500 italic text-center">{getTranslation(language, 'noLogs')}</p>
                    ) : (
                        logs.slice().reverse().map((log) => (
                            <div key={log.id} className={`border-b border-slate-800/50 pb-1 ${log.type === 'combat' ? 'text-red-300' :
                                    log.type === 'loot' ? 'text-amber-300' :
                                        log.type === 'system' ? 'text-slate-500' :
                                            'text-slate-300'
                                }`}>
                                <span className="text-slate-600 text-[10px] mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                <span>{log.text}</span>
                                {log.mechanics && (
                                    <div className="text-xs text-slate-500 ml-14 mt-0.5 border-l-2 border-slate-700 pl-2">
                                        {log.mechanics}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-4 pt-2 border-t border-slate-700 text-right shrink-0 flex justify-between items-center">
                    <button
                        onClick={() => {
                            const text = logs.map(l => `[${new Date(l.timestamp).toLocaleTimeString()}] ${l.text} ${l.mechanics ? `(${l.mechanics})` : ''}`).join('\n');
                            const blob = new Blob([text], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `aether-crawl-logs-${Date.now()}.txt`;
                            a.click();
                        }}
                        className="text-amber-500 hover:text-amber-400 text-sm flex items-center gap-1"
                    >
                        💾 {getTranslation(language, 'downloadLogs')}
                    </button>
                    <button onClick={onClose} className="text-slate-400 hover:text-white underline text-sm">{getTranslation(language, 'close')}</button>
                </div>
            </div>
        </div>
    );
};

export default LogsModal;
