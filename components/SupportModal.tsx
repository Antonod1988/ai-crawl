
import React from 'react';
import { getTranslation } from '../translations';

interface SupportModalProps {
    onClose: () => void;
    language: string;
}

const SupportModal: React.FC<SupportModalProps> = ({ onClose, language }) => {
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-600 rounded-lg p-6 max-w-md w-full m-4 shadow-2xl relative">
                <h2 className="text-2xl font-fantasy text-amber-500 mb-6 border-b border-slate-700 pb-2 text-center">
                    {getTranslation(language, 'supportDeveloper')}
                </h2>

                <div className="space-y-4 mb-8">
                    <p className="text-slate-300 text-center mb-6">
                        {getTranslation(language, 'buyBeer')}
                    </p>

                    <a
                        href="https://patreon.com/AntonOd?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-[#FF424D] hover:bg-[#E6303B] text-white font-bold py-3 px-4 rounded text-center transition-colors flex items-center justify-center gap-2"
                    >
                        <span>{getTranslation(language, 'becomePatron')}</span>
                    </a>

                    <a
                        href="https://boosty.to/aodelski"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-[#f15f2c] hover:bg-[#d84e1f] text-white font-bold py-3 px-4 rounded text-center transition-colors flex items-center justify-center gap-2"
                    >
                        <span>{getTranslation(language, 'supportBoosty')}</span>
                    </a>
                </div>

                <button
                    onClick={onClose}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded border border-slate-600 transition-colors"
                >
                    {getTranslation(language, 'close')}
                </button>
            </div>
        </div>
    );
};

export default SupportModal;
