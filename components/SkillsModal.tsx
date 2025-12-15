import React from 'react';
import { Player, Skill, StatType } from '../types';
import { getTranslation } from '../translations';

interface SkillsModalProps {
    player: Player;
    onToggleSkill: (skill: Skill) => void;
    onClose: () => void;
    language: string;
}

const SkillsModal: React.FC<SkillsModalProps> = ({ player, onToggleSkill, onClose, language }) => {
    const activeSkillsCount = player.skills.filter(s => s.isActive).length;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 rounded-t-lg">
                    <div>
                        <h2 className="text-xl font-fantasy text-amber-500 tracking-wider">{getTranslation(language, 'skills')}</h2>
                        <div className="text-xs text-slate-400 mt-1">
                            {getTranslation(language, 'activeSkills')}: <span className={activeSkillsCount > 5 ? "text-red-500" : "text-amber-100"}>{activeSkillsCount}</span>/5
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto scrollbar-custom flex-1">
                    {player.skills.length === 0 ? (
                        <div className="text-center text-slate-500 italic py-8">{getTranslation(language, 'noSkills')}</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {player.skills.map(skill => {
                                const isActive = skill.isActive;
                                // Disable toggling ON if we are at max (5) and this one is OFF
                                const isDisabled = !isActive && activeSkillsCount >= 5;

                                return (
                                    <button
                                        key={skill.id}
                                        onClick={() => !isDisabled && onToggleSkill(skill)}
                                        disabled={isDisabled}
                                        className={`
                      relative p-3 rounded border text-left transition-all group
                      ${isActive
                                                ? 'bg-amber-900/20 border-amber-500/50 hover:bg-amber-900/30'
                                                : 'bg-slate-800 border-slate-700 hover:bg-slate-750'}
                      ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`font-bold ${isActive ? 'text-amber-400' : 'text-slate-300'}`}>
                                                {skill.name}
                                            </span>
                                            {isActive && <span className="text-[10px] bg-amber-500 text-black px-1.5 rounded font-bold">EQUIPPED</span>}
                                        </div>

                                        <div className="text-xs text-slate-400 mb-2 line-clamp-2">{skill.description}</div>

                                        <div className="flex justify-between items-end text-[10px] font-mono text-slate-500">
                                            <span className="text-blue-400">{getTranslation(language, 'scalesWith')} {skill.stat}</span>
                                            <span>{skill.cooldown}t CD</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-950 rounded-b-lg flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded border border-slate-600 transition-colors"
                    >
                        {getTranslation(language, 'close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SkillsModal;
