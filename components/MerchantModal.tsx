import React from 'react';
import { Item, Player, ItemType } from '../types';
import { getTranslation } from '../translations';

interface MerchantModalProps {
    player: Player;
    merchantItems: Item[];
    onBuy: (item: Item) => void;
    onSell: (item: Item) => void;
    onForgetSkill: (skill: any) => void;
    onClose: () => void;
    language: string;
}

export const MerchantModal: React.FC<MerchantModalProps> = ({
    player,
    merchantItems,
    onBuy,
    onSell,
    onForgetSkill,
    onClose,
    language
}) => {
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border-2 border-amber-600 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(217,119,6,0.3)]">

                {/* Header */}
                <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-950">
                    <div>
                        <h2 className="text-3xl font-fantasy text-amber-500 tracking-wider">Traveling Merchant</h2>
                        <p className="text-slate-400 italic">"Got some rare things on sale, stranger!"</p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-slate-400 uppercase tracking-widest">Your Gold</div>
                        <div className="text-2xl font-bold text-amber-400 flex items-center justify-end gap-2">
                            <span>{player.gold}</span>
                            <span className="text-amber-600">🪙</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">

                    {/* Merchant Stock */}
                    <div className="flex-1 p-4 overflow-y-auto border-b md:border-b-0 md:border-r border-slate-700 bg-slate-900/50">
                        <h3 className="text-amber-200 font-bold mb-4 uppercase tracking-widest text-sm border-b border-slate-700 pb-2">
                            Merchant's Wares
                        </h3>
                        <div className="grid gap-3">
                            {merchantItems.map((item) => (
                                <div key={item.id} className="bg-slate-800 p-3 rounded border border-slate-700 flex justify-between items-center group hover:border-amber-500/50 transition-colors">
                                    <div>
                                        <div className="font-bold text-slate-200 group-hover:text-amber-400 transition-colors">{item.name}</div>
                                        <div className="text-xs text-slate-500">{item.type} • Power: {item.value}</div>
                                        {item.statModifier && <div className="text-xs text-blue-400">+{item.statModifier}</div>}
                                    </div>
                                    <button
                                        onClick={() => onBuy(item)}
                                        disabled={player.gold < item.cost}
                                        className={`px-4 py-2 rounded font-bold text-sm flex items-center gap-1 ${player.gold >= item.cost
                                            ? 'bg-amber-700 hover:bg-amber-600 text-white'
                                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                            }`}
                                    >
                                        <span>Buy</span>
                                        <span>{item.cost} 🪙</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Player Inventory (Sell) */}
                    <div className="flex-1 p-4 overflow-y-auto bg-slate-950/30">
                        <h3 className="text-slate-400 font-bold mb-4 uppercase tracking-widest text-sm border-b border-slate-700 pb-2">
                            Your Inventory
                        </h3>
                        <div className="grid gap-3">
                            {player.inventory.length === 0 && (
                                <div className="text-slate-600 text-center italic py-10">Your bag is empty.</div>
                            )}
                            {player.inventory.map((item) => (
                                <div key={item.id} className="bg-slate-800 p-3 rounded border border-slate-700 flex justify-between items-center group hover:border-red-500/30 transition-colors">
                                    <div>
                                        <div className="font-bold text-slate-200">{item.name}</div>
                                        <div className="text-xs text-slate-500">{item.type} • Power: {item.value}</div>
                                    </div>
                                    <button
                                        onClick={() => onSell(item)}
                                        className="px-4 py-2 rounded font-bold text-sm bg-slate-700 hover:bg-red-900/50 text-slate-300 hover:text-red-200 border border-slate-600 hover:border-red-800 transition-all flex items-center gap-1"
                                    >
                                        <span>Sell</span>
                                        <span>{Math.floor(item.cost / 2)} 🪙</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>


                    {/* Forget Skills */}
                    <div className="flex-1 p-4 overflow-y-auto border-l border-slate-700 bg-slate-900/50">
                        <h3 className="text-purple-400 font-bold mb-4 uppercase tracking-widest text-sm border-b border-slate-700 pb-2">
                            Forget Skills
                        </h3>
                        <div className="grid gap-3">
                            {player.skills.length === 0 && (
                                <div className="text-slate-600 text-center italic py-10">No skills to forget.</div>
                            )}
                            {player.skills.map((skill) => {
                                const cost = skill.cost || (player.level * 100);
                                return (
                                    <div key={skill.id} className="bg-slate-800 p-3 rounded border border-slate-700 flex justify-between items-center group hover:border-purple-500/50 transition-colors">
                                        <div>
                                            <div className="font-bold text-slate-200">{skill.name}</div>
                                            <div className="text-xs text-slate-500">{skill.description}</div>
                                            <div className="text-xs text-purple-400">Cost: {cost} 🪙</div>
                                        </div>
                                        <button
                                            onClick={() => onForgetSkill(skill)}
                                            disabled={player.gold < cost}
                                            className={`px-3 py-1 rounded font-bold text-xs flex items-center gap-1 ${player.gold >= cost
                                                ? 'bg-purple-900/50 hover:bg-purple-800 text-purple-200 border border-purple-700'
                                                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                                }`}
                                        >
                                            Forget
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700 bg-slate-950 flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="bg-gradient-to-r from-amber-700 to-orange-900 hover:from-amber-600 hover:to-orange-800 text-white px-8 py-3 rounded font-bold tracking-widest shadow-lg"
                    >
                        LEAVE MERCHANT & CONTINUE
                    </button>
                </div>
            </div>
        </div >
    );
};
