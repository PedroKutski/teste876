/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Home, List, Settings as SettingsIcon, BarChart2 } from 'lucide-react';
import { Generator } from './components/Generator';
import { History } from './components/History';
import { Settings } from './components/Settings';
import { Analysis } from './components/Analysis';

export default function App() {
  const [activeTab, setActiveTab] = useState('generator');

  return (
    <div className="flex justify-center bg-gray-100 h-screen sm:p-4 sm:py-8">
      <div className="flex flex-col h-full w-full max-w-[420px] bg-[#F2F2F7] text-gray-900 font-sans relative sm:rounded-[40px] sm:shadow-2xl overflow-hidden sm:border-[6px] sm:border-gray-800">
        <header className="bg-white/80 backdrop-blur-xl px-6 py-4 flex items-center justify-center sticky top-0 z-20 border-b border-gray-200/60 pt-safe">
          <h1 className="text-[17px] font-semibold text-gray-900 tracking-tight">Controle de Retiradas</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-5 pb-28">
          {activeTab === 'generator' && <Generator />}
          {activeTab === 'history' && <History />}
          {activeTab === 'analysis' && <Analysis />}
          {activeTab === 'settings' && <Settings />}
        </main>

        <nav className="absolute bottom-0 w-full bg-white/90 backdrop-blur-xl border-t border-gray-200/60 flex justify-around pb-safe pt-2 z-20 px-2">
          <button 
            onClick={() => setActiveTab('generator')} 
            className={`p-2 flex flex-col items-center w-16 transition-colors ${activeTab === 'generator' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Home size={24} strokeWidth={activeTab === 'generator' ? 2.5 : 2} />
            <span className="text-[10px] mt-1 font-medium tracking-wide">Novo</span>
          </button>
          <button 
            onClick={() => setActiveTab('history')} 
            className={`p-2 flex flex-col items-center w-16 transition-colors ${activeTab === 'history' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <List size={24} strokeWidth={activeTab === 'history' ? 2.5 : 2} />
            <span className="text-[10px] mt-1 font-medium tracking-wide">Histórico</span>
          </button>
          <button 
            onClick={() => setActiveTab('analysis')} 
            className={`p-2 flex flex-col items-center w-16 transition-colors ${activeTab === 'analysis' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <BarChart2 size={24} strokeWidth={activeTab === 'analysis' ? 2.5 : 2} />
            <span className="text-[10px] mt-1 font-medium tracking-wide">Análise</span>
          </button>
          <button 
            onClick={() => setActiveTab('settings')} 
            className={`p-2 flex flex-col items-center w-16 transition-colors ${activeTab === 'settings' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <SettingsIcon size={24} strokeWidth={activeTab === 'settings' ? 2.5 : 2} />
            <span className="text-[10px] mt-1 font-medium tracking-wide">Ajustes</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
