import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, ChevronDown } from 'lucide-react';

export function SelectWithManage({
  label,
  value,
  options,
  onSelect,
  onAdd,
  onRemove,
  placeholder
}: {
  label: string;
  value: string;
  options: string[];
  onSelect: (val: string) => void;
  onAdd: (val: string) => void;
  onRemove: (val: string) => void;
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    const val = newItem.trim();
    if (val) {
      if (!options.includes(val)) {
        onAdd(val);
      }
      onSelect(val);
      setNewItem('');
      setIsOpen(false);
    }
  };

  return (
    <>
      <div>
        <label className="block text-[13px] font-medium text-gray-500 mb-1.5 ml-1">{label}</label>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full px-4 py-3.5 rounded-2xl bg-gray-100/80 text-left flex justify-between items-center active:bg-gray-200 transition-colors"
        >
          <span className={`text-[16px] ${value ? 'text-gray-900' : 'text-gray-400'}`}>
            {value || placeholder}
          </span>
          <ChevronDown size={20} className="text-gray-400" />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-[420px] bg-white rounded-t-[32px] sm:rounded-[32px] h-[85vh] sm:h-[60vh] flex flex-col overflow-hidden shadow-2xl"
            >
              {/* iOS Drag Handle */}
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-1" />
              
              <div className="px-6 py-3 border-b border-gray-100 flex justify-between items-center bg-white">
                <h3 className="font-semibold text-[17px] text-gray-900">Selecionar {label}</h3>
                <button onClick={() => setIsOpen(false)} className="p-2 -mr-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-4 border-b border-gray-100 bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
                    placeholder={`Adicionar novo(a)...`}
                    className="flex-1 px-4 py-3 text-[16px] rounded-2xl bg-gray-100/80 focus:bg-gray-200/80 outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={!newItem.trim()}
                    className="bg-indigo-600 text-white px-4 rounded-2xl disabled:opacity-50 active:scale-95 transition-transform flex items-center justify-center"
                  >
                    <Plus size={24} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                {options.length === 0 ? (
                  <div className="text-center text-[15px] text-gray-400 py-10">
                    Nenhum item salvo.
                  </div>
                ) : (
                  <ul className="space-y-1 px-2">
                    {options.map((opt) => (
                      <li key={opt} className="flex items-center justify-between p-1 hover:bg-gray-50 rounded-2xl group">
                        <button
                          type="button"
                          onClick={() => { onSelect(opt); setIsOpen(false); }}
                          className="flex-1 text-left px-3 py-3 text-[16px] text-gray-900 font-medium active:opacity-70"
                        >
                          {opt}
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemove(opt)}
                          className="p-3 text-red-500 hover:bg-red-50 rounded-xl opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
