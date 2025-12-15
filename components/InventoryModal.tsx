import React from 'react';
import { Item, ItemType, Player } from '../types';

import { getTranslation } from '../translations';

interface InventoryModalProps {
  player: Player;
  onEquip: (item: Item) => void;
  onUse: (item: Item) => void;
  onClose: () => void;
  language: string;
}

const InventoryModal: React.FC<InventoryModalProps> = ({ player, onEquip, onUse, onClose, language }) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-6 max-w-2xl w-full m-4 shadow-2xl">
        <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
          <h2 className="text-2xl font-fantasy text-amber-500">{getTranslation(language, 'inventory')}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">&times;</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto scrollbar-custom pr-2">
          {player.inventory.length === 0 ? (
            <p className="text-slate-500 italic col-span-2 text-center">{getTranslation(language, 'backpackEmpty')}</p>
          ) : (
            player.inventory.map((item) => (
              <div key={item.id} className="bg-slate-900 p-4 rounded border border-slate-700 flex flex-col justify-between group hover:border-amber-500/50 transition-colors">
                <div>
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-200">{item.name}</h4>
                    <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded uppercase">{item.type}</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1 italic">{item.description}</p>
                  <div className="text-xs text-blue-400 mt-2">
                    {item.type === ItemType.WEAPON && `${getTranslation(language, 'damage')}: ${item.value} (${item.statModifier})`}
                    {item.type === ItemType.ARMOR && `${getTranslation(language, 'defense')}: ${item.value}`}
                    {item.type === ItemType.POTION && `${getTranslation(language, 'restores')}: ${item.value} HP`}
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    {getTranslation(language, 'value')}: {Math.floor(item.cost / 2)} 🪙
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  {(item.type === ItemType.WEAPON || item.type === ItemType.ARMOR) && (
                    <button
                      onClick={() => onEquip(item)}
                      className="bg-indigo-900 hover:bg-indigo-700 text-indigo-200 text-xs px-3 py-2 rounded w-full transition-colors uppercase tracking-wider font-semibold"
                    >
                      {getTranslation(language, 'equip')}
                    </button>
                  )}
                  {(item.type === ItemType.POTION || item.type === ItemType.SCROLL) && (
                    <button
                      onClick={() => onUse(item)}
                      className="bg-green-900 hover:bg-green-700 text-green-200 text-xs px-3 py-2 rounded w-full transition-colors uppercase tracking-wider font-semibold"
                    >
                      {getTranslation(language, 'use')}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-700 text-right">
          <button onClick={onClose} className="text-slate-400 hover:text-white underline text-sm">{getTranslation(language, 'close')}</button>
        </div>
      </div>
    </div>
  );
};

export default InventoryModal;
