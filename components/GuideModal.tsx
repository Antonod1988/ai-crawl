import React from 'react';
import { getTranslation } from '../translations';

interface GuideModalProps {
    isOpen: boolean;
    onClose: () => void;
    language: string;
}

const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose, language }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-950 rounded-t-lg">
                    <h2 className="text-xl font-bold text-amber-500 font-fantasy tracking-wider">
                        {getTranslation(language, 'combatGuide') || 'Combat Guide'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors text-xl font-bold px-2"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6 text-slate-300 custom-scrollbar">

                    {/* Status Effects Section */}
                    <section>
                        <h3 className="text-lg font-bold text-white mb-3 border-b border-slate-700 pb-1">
                            {getTranslation(language, 'activeEffects') || 'Status Effects'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                            {/* Toxic */}
                            <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                                <div className="flex items-center gap-2 mb-1 text-green-400 font-bold">
                                    <span>☠️</span> {getTranslation(language, 'toxic')}
                                </div>
                                <div className="text-sm text-slate-400">
                                    {language === 'Russian' ? 'Наносит 2^n урона (2, 4, 8...).' : 'Deals 2^n damage (2, 4, 8...).'}
                                </div>
                            </div>

                            {/* Burning */}
                            <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                                <div className="flex items-center gap-2 mb-1 text-orange-400 font-bold">
                                    <span>🔥</span> {getTranslation(language, 'burning')}
                                </div>
                                <div className="text-sm text-slate-400">
                                    {language === 'Russian' ? 'Наносит 5% от Макс. Здоровья.' : 'Deals 5% of Max HP.'}
                                </div>
                            </div>

                            {/* Chilled */}
                            <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                                <div className="flex items-center gap-2 mb-1 text-cyan-400 font-bold">
                                    <span>❄️</span> {getTranslation(language, 'chilled')}
                                </div>
                                <div className="text-sm text-slate-400">
                                    {language === 'Russian' ? '-50% Ловкости (Снижает Попадание и КД).' : '-50% Dexterity (Reduces Hit & AC).'}
                                </div>
                            </div>

                            {/* Shocked */}
                            <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                                <div className="flex items-center gap-2 mb-1 text-yellow-400 font-bold">
                                    <span>⚡</span> {getTranslation(language, 'shocked')}
                                </div>
                                <div className="text-sm text-slate-400">
                                    {language === 'Russian' ? 'Увеличивает перезарядку навыков.' : 'Increases skill cooldowns.'}
                                </div>
                            </div>

                            {/* Sundered */}
                            <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                                <div className="flex items-center gap-2 mb-1 text-red-400 font-bold">
                                    <span>💔</span> {getTranslation(language, 'sundered')}
                                    <div className="text-sm text-slate-400">
                                        {language === 'Russian' ? '+50% Урона, -50% Защиты.' : '+50% Damage, -50% Defense.'}
                                    </div>
                                </div>

                            </div>

                            {/* Stoneskin */}
                            <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                                <div className="flex items-center gap-2 mb-1 text-stone-300 font-bold">
                                    <span>🛡️</span> {getTranslation(language, 'stoneskin')}
                                </div>
                                <div className="text-sm text-slate-400">
                                    {language === 'Russian' ? '+10 Защиты (Брони).' : '+10 Defense (Soak).'}
                                </div>
                            </div>

                            {/* Blur */}
                            <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                                <div className="flex items-center gap-2 mb-1 text-blue-300 font-bold">
                                    <span>👻</span> {getTranslation(language, 'blur')}
                                </div>
                                <div className="text-sm text-slate-400">
                                    {language === 'Russian' ? '+5 КД (Уклонение).' : '+5 AC (Dodge).'}
                                </div>
                            </div>

                            {/* Raged */}
                            <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                                <div className="flex items-center gap-2 mb-1 text-red-300 font-bold">
                                    <span>🩸</span> {getTranslation(language, 'raged')}
                                </div>
                                <div className="text-sm text-slate-400">
                                    {language === 'Russian' ? '+50% Урона, -50% Защиты.' : '+50% Damage, -50% Defense.'}
                                </div>
                            </div>

                            {/* Focused */}
                            <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                                <div className="flex items-center gap-2 mb-1 text-purple-300 font-bold">
                                    <span>🔋</span> {getTranslation(language, 'focused')}
                                </div>
                                <div className="text-sm text-slate-400">
                                    {language === 'Russian' ? 'Следующий навык: Крит и 0 перезарядки.' : 'Next Skill: Crit & 0 Cooldown.'}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Material Interactions Section */}
                    <section>
                        <h3 className="text-lg font-bold text-white mb-3 border-b border-slate-700 pb-1">
                            {language === 'Russian' ? 'Взаимодействие Материалов' : 'Material Interactions'}
                        </h3>
                        <div className="space-y-4">
                            <div className="bg-slate-800/50 p-4 rounded border border-slate-700">
                                <h4 className="text-amber-400 font-bold mb-2 text-sm uppercase tracking-widest">
                                    {language === 'Russian' ? 'Слабости (1.5x Урона)' : 'Weaknesses (1.5x Damage)'}
                                </h4>
                                <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
                                    <div>🥩 Flesh vs 🗡️ Slashing</div>
                                    <div>🧥 Leather vs 🏹 Piercing</div>
                                    <div>🛡️ Plate vs 🔨 Blunt</div>
                                    <div>🦴 Bone vs 🔨 Blunt</div>
                                    <div>🪵 Wood vs 🔥 Fire</div>
                                    <div>👘 Cloth vs 🔥 Fire</div>
                                </div>
                            </div>

                            <div className="bg-slate-800/50 p-4 rounded border border-slate-700">
                                <h4 className="text-blue-400 font-bold mb-2 text-sm uppercase tracking-widest">
                                    {language === 'Russian' ? 'Сопротивления (0.5x Урона)' : 'Resistances (0.5x Damage)'}
                                </h4>
                                <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
                                    <div>🛡️ Plate vs 🗡️ Slashing</div>
                                    <div>🦴 Bone vs 🏹 Piercing</div>
                                    <div>🧥 Leather vs 🔨 Blunt</div>
                                    <div>👘 Cloth vs ✨ Magic</div>
                                </div>
                            </div>

                            <div className="bg-slate-900/80 p-4 rounded border border-slate-700">
                                <h4 className="text-slate-400 font-bold mb-2 text-sm uppercase tracking-widest">
                                    {language === 'Russian' ? 'Материал Игрока' : 'Player Material'}
                                </h4>
                                <p className="text-xs text-slate-500 mb-2">
                                    {language === 'Russian'
                                        ? 'Ваш материал определяется надетой броней:'
                                        : 'Your material is determined by your equipped armor:'}
                                </p>
                                <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                                    <li>Plate/Mail/Iron/Steel ➔ <strong>PLATE</strong></li>
                                    <li>Leather/Hide/Skin ➔ <strong>LEATHER</strong></li>
                                    <li>Bone/Skull ➔ <strong>BONE</strong></li>
                                    <li>Robe/Cloth/Silk ➔ <strong>FLESH</strong> (Default)</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Damage Types Section */}
                    <section>
                        <h3 className="text-lg font-bold text-white mb-3 border-b border-slate-700 pb-1">
                            {getTranslation(language, 'damageTypes') || 'Damage Types'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                                <div className="flex items-center gap-2 mb-1 text-slate-300 font-bold">
                                    <span>🗡️</span> {getTranslation(language, 'slashing')}
                                </div>
                                <div className="text-sm text-slate-400">
                                    {language === 'Russian' ? 'Эффективно против Плоти. Слабо против Латы.' : 'Effective vs Flesh. Weak vs Plate.'}
                                </div>
                            </div>
                            <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                                <div className="flex items-center gap-2 mb-1 text-slate-300 font-bold">
                                    <span>🔨</span> {getTranslation(language, 'blunt')}
                                </div>
                                <div className="text-sm text-slate-400">
                                    {language === 'Russian' ? 'Эффективно против Латы/Кости. Слабо против Духа.' : 'Effective vs Plate/Bone. Weak vs Spirit.'}
                                </div>
                            </div>
                            <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                                <div className="flex items-center gap-2 mb-1 text-slate-300 font-bold">
                                    <span>🏹</span> {getTranslation(language, 'piercing')}
                                </div>
                                <div className="text-sm text-slate-400">
                                    {language === 'Russian' ? 'Эффективно против Кожи. Слабо против Кости.' : 'Effective vs Leather. Weak vs Bone.'}
                                </div>
                            </div>
                            <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                                <div className="flex items-center gap-2 mb-1 text-purple-400 font-bold">
                                    <span>✨</span> {getTranslation(language, 'magic')}
                                </div>
                                <div className="text-sm text-slate-400">
                                    {language === 'Russian' ? 'Эффективно против Духа/Латы.' : 'Effective vs Spirit/Plate.'}
                                </div>
                            </div>
                        </div>
                        <div className="mt-3 text-sm text-slate-400 italic">
                            {language === 'Russian'
                                ? 'Враги имеют Материал (Плоть, Кожа, Латы, Кость, Дух), который определяет их слабости.'
                                : 'Enemies have a Material (Flesh, Leather, Plate, Bone, Spirit) which determines their weaknesses.'}
                        </div>
                    </section>

                    {/* Weapon Effects Section */}
                    <section>
                        <h3 className="text-lg font-bold text-white mb-3 border-b border-slate-700 pb-1">
                            {getTranslation(language, 'weaponEffects') || 'Weapon Effects'}
                        </h3>
                        <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                            <div className="flex items-center gap-2 mb-1 text-red-400 font-bold">
                                <span>🩸</span> {getTranslation(language, 'lifeDrain')}
                            </div>
                            <div className="text-sm text-slate-400">
                                {language === 'Russian'
                                    ? 'Восстанавливает ХП в размере 20% от нанесенного урона.'
                                    : 'Heals for 20% of damage dealt.'}
                            </div>
                        </div>
                    </section>

                    {/* Stats Section */}
                    <section>
                        <h3 className="text-lg font-bold text-white mb-3 border-b border-slate-700 pb-1">
                            {getTranslation(language, 'stats') || 'Stats & Attributes'}
                        </h3>
                        <div className="space-y-2 text-sm">
                            <p><strong className="text-amber-500">STR (Strength):</strong> {language === 'Russian' ? 'Увеличивает урон в ближнем бою.' : 'Increases melee damage.'} <span className="text-slate-500">(20+ = Ignore 2 Armor)</span></p>
                            <p><strong className="text-amber-500">DEX (Dexterity):</strong> {language === 'Russian' ? 'Увеличивает шанс попадания и КД.' : 'Increases Hit Chance and Armor Class.'} <span className="text-slate-500">(20+ = First Strike)</span></p>
                            <p><strong className="text-amber-500">INT (Intelligence):</strong> {language === 'Russian' ? 'Усиливает навыки.' : 'Increases Skill Power.'} <span className="text-slate-500">(20+ = Skill Heal 1%)</span></p>
                            <p><strong className="text-amber-500">CON (Constitution):</strong> {language === 'Russian' ? 'Увеличивает ХП.' : 'Increases Max HP.'} <span className="text-slate-500">(20+ = +1 Regen)</span></p>
                        </div>
                    </section>

                </div>

                <div className="p-4 border-t border-slate-700 bg-slate-950 rounded-b-lg flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors"
                    >
                        {getTranslation(language, 'close')}
                    </button>
                </div>
            </div >
        </div >
    );
};

export default GuideModal;
