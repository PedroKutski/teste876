import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../StoreContext';
import { Package, Clock, CloudOff, Cloud, Trash2, Image as ImageIcon } from 'lucide-react';

export function History() {
  const { withdrawals, removeWithdrawal } = useStore();
  const [pressingId, setPressingId] = useState<string | null>(null);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  const handlePressStart = (id: string) => {
    setPressingId(id);
    pressTimer.current = setTimeout(() => {
      removeWithdrawal(id);
      handlePressEnd();
    }, 3000);
  };

  const handlePressEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    setPressingId(null);
  };

  if (withdrawals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400">
        <Package size={48} className="mb-4 opacity-50" />
        <p className="text-[15px]">Nenhuma retirada registrada ainda.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-md mx-auto space-y-3 pb-24"
    >
      <AnimatePresence>
        {withdrawals.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="relative overflow-hidden bg-white p-4 rounded-[24px] shadow-sm flex flex-col gap-3 select-none"
            onTouchStart={() => handlePressStart(item.id)}
            onTouchEnd={handlePressEnd}
            onTouchMove={handlePressEnd}
            onMouseDown={() => handlePressStart(item.id)}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
          >
            {/* Progress overlay for long press */}
            {pressingId === item.id && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 3, ease: 'linear' }}
                className="absolute inset-0 bg-red-50/80 z-10 pointer-events-none"
              />
            )}
            
            {pressingId === item.id && (
              <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-red-100 text-red-600 px-4 py-2 rounded-full flex items-center gap-2 font-semibold shadow-sm"
                >
                  <Trash2 size={18} />
                  <span>Segure para excluir</span>
                </motion.div>
              </div>
            )}

            <div className="flex justify-between items-start relative z-0">
              <div className="flex items-center gap-2">
                <span className="bg-indigo-50 text-indigo-700 font-mono font-bold px-2.5 py-1 rounded-lg text-[13px] tracking-widest">
                  {item.code}
                </span>
                {item.customCode && (
                  <span className="bg-gray-100 text-gray-600 font-mono font-medium px-2 py-1 rounded-lg text-[12px]">
                    {item.customCode}
                  </span>
                )}
                {item.synced ? (
                  <Cloud size={16} className="text-green-500" title="Sincronizado" />
                ) : (
                  <CloudOff size={16} className="text-amber-500" title="Aguardando sincronização" />
                )}
              </div>
              <div className="flex items-center text-[12px] text-gray-400 font-medium">
                <Clock size={12} className="mr-1" />
                {new Date(item.date).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            
            <div className="relative z-0">
              <div className="flex justify-between items-center mb-2.5">
                <h3 className="font-semibold text-[16px] text-gray-900">{item.personName}</h3>
                {item.photo && (
                  <a 
                    href={item.photo} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[12px] font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg hover:bg-indigo-100 transition-colors"
                    onClick={(e) => e.stopPropagation()} // Prevent long press trigger
                  >
                    <ImageIcon size={14} />
                    Ver Foto
                  </a>
                )}
              </div>
              <div className="space-y-1.5">
                {item.items.map((device, idx) => (
                  <div key={idx} className="flex items-center text-[14px] text-gray-600 bg-gray-50 px-3 py-2 rounded-xl">
                    <span className="font-semibold text-gray-900 w-8">{device.quantity}x</span>
                    <span>{device.model}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

