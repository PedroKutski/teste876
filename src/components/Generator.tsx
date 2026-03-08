import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { RefreshCw, CheckCircle2, Plus, Trash2, Send, Database } from 'lucide-react';
import { useStore } from '../StoreContext';
import { SelectWithManage } from './SelectWithManage';

const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  let availableChars = chars.split('');
  
  for (let i = 0; i < 5; i++) {
    const randomIndex = Math.floor(Math.random() * availableChars.length);
    code += availableChars[randomIndex];
    availableChars.splice(randomIndex, 1); // Remove used character so it doesn't repeat
  }
  return code;
};

export function Generator({ onSuccess }: { onSuccess?: () => void }) {
  const [code, setCode] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [personName, setPersonName] = useState('');
  const [items, setItems] = useState([{ model: '', quantity: 1 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { 
    addWithdrawal, 
    savedNames, addName, removeName,
    savedModels, addModel, removeModel
  } = useStore();

  useEffect(() => {
    setCode(generateCode());
  }, []);

  const addItem = () => setItems([...items, { model: '', quantity: 1 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: 'model' | 'quantity', value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (!personName) return alert('Selecione o nome da pessoa.');
    if (items.some(i => !i.model)) return alert('Selecione o modelo para todos os itens.');

    setIsSubmitting(true);
    const startTime = Date.now();
    
    await addWithdrawal({
      code,
      customCode: customCode.trim() || undefined,
      personName,
      items,
      date: new Date().toISOString(),
    });

    const elapsed = Date.now() - startTime;
    if (elapsed < 500) {
      await new Promise(r => setTimeout(r, 500 - elapsed));
    }

    setIsSubmitting(false);
    setShowSuccess(true);
    
    setTimeout(() => {
      setShowSuccess(false);
      setCode(generateCode());
      setCustomCode('');
      setPersonName('');
      setItems([{ model: '', quantity: 1 }]);
      if (onSuccess) onSuccess();
    }, 1200);
  };

  if (isSubmitting || showSuccess) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-full py-20"
      >
        <div className="relative w-32 h-32 flex items-center justify-center mb-6">
          {isSubmitting && (
            <>
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute right-2 top-2 z-0"
              >
                <Database className="text-indigo-200 w-16 h-16" />
              </motion.div>
              <motion.div
                animate={{
                  x: [-40, 30],
                  y: [40, -20],
                  opacity: [0, 1, 0],
                  scale: [0.8, 1.2, 0.8]
                }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute z-10"
              >
                <Send className="text-indigo-600 w-12 h-12" />
              </motion.div>
            </>
          )}

          {showSuccess && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [1.2, 1], opacity: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="absolute z-10 bg-green-100 p-4 rounded-full"
            >
              <CheckCircle2 className="text-green-600 w-12 h-12" />
            </motion.div>
          )}
        </div>

        <motion.h2 
          key={showSuccess ? "success" : "sending"}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[22px] font-bold text-gray-900 mb-2"
        >
          {showSuccess ? 'Registrado!' : 'Enviando...'}
        </motion.h2>
        <motion.p 
          key={showSuccess ? "success-desc" : "sending-desc"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[15px] text-gray-500 text-center"
        >
          {showSuccess ? 'A retirada foi salva no banco de dados.' : 'Sincronizando com o sistema...'}
        </motion.p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto"
    >
      <div className="bg-white rounded-[28px] shadow-sm p-6 mb-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-500"></div>
        <p className="text-[12px] text-gray-500 font-semibold mb-2 uppercase tracking-widest">Código de Retirada</p>
        <div className="flex items-center justify-center gap-4">
          <h2 className="text-[44px] leading-none font-mono font-bold text-gray-900 tracking-widest">{code}</h2>
          <button 
            type="button"
            onClick={() => setCode(generateCode())}
            className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors active:scale-90"
            title="Gerar novo código"
          >
            <RefreshCw size={22} />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-5 rounded-[28px] shadow-sm space-y-5">
          <SelectWithManage
            label="Nome de quem retirou"
            value={personName}
            options={savedNames}
            onSelect={setPersonName}
            onAdd={addName}
            onRemove={removeName}
            placeholder="Selecione ou adicione um nome"
          />

          <div>
            <label className="block text-[13px] font-medium text-gray-500 mb-1.5 ml-1">
              Código Próprio (Opcional)
            </label>
            <input
              type="text"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              placeholder="Ex: OS-12345"
              className="w-full px-4 py-3.5 text-[16px] rounded-2xl bg-gray-100/80 focus:bg-gray-200/80 outline-none transition-colors"
            />
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-[13px] font-medium text-gray-500 ml-1">Dispositivos</h3>
            </div>
            
            {items.map((item, index) => (
              <div key={index} className="flex gap-3 items-end bg-white">
                <div className="flex-1">
                  <SelectWithManage
                    label={`Modelo ${index + 1}`}
                    value={item.model}
                    options={savedModels}
                    onSelect={(val) => updateItem(index, 'model', val)}
                    onAdd={addModel}
                    onRemove={removeModel}
                    placeholder="Selecione o modelo"
                  />
                </div>
                <div className="w-[72px]">
                  <label className="block text-[13px] font-medium text-gray-500 mb-1.5 ml-1 text-center">Qtd</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    className="w-full px-2 py-3.5 text-[16px] rounded-2xl bg-gray-100/80 focus:bg-gray-200/80 transition-colors outline-none text-center"
                  />
                </div>
                {items.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeItem(index)} 
                    className="p-3.5 text-red-500 hover:bg-red-50 rounded-2xl mb-[1px] transition-colors active:scale-95"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            ))}

            <button 
              type="button" 
              onClick={addItem} 
              className="w-full py-3.5 mt-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-2xl flex items-center justify-center gap-2 transition-colors font-medium text-[15px] active:scale-[0.98]"
            >
              <Plus size={18} /> Adicionar outro modelo
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-[17px] font-semibold py-4 rounded-2xl shadow-sm shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-70 mt-4"
        >
          {isSubmitting ? 'Registrando...' : 'Confirmar Retirada'}
        </button>
      </form>
    </motion.div>
  );
}
