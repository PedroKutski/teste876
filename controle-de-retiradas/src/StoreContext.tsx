import React, { createContext, useContext, useState, useEffect } from 'react';
import { Withdrawal } from './types';

interface StoreContextType {
  withdrawals: Withdrawal[];
  addWithdrawal: (w: Omit<Withdrawal, 'id' | 'synced'>) => Promise<void>;
  removeWithdrawal: (id: string) => void;
  scriptUrl: string;
  setScriptUrl: (url: string) => void;
  savedNames: string[];
  addName: (name: string) => void;
  removeName: (name: string) => void;
  savedModels: string[];
  addModel: (model: string) => void;
  removeModel: (model: string) => void;
  isSyncing: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(() => {
    const saved = localStorage.getItem('withdrawals');
    return saved ? JSON.parse(saved) : [];
  });

  const [scriptUrl, setScriptUrl] = useState(() => {
    return localStorage.getItem('scriptUrl') || '';
  });

  const [savedNames, setSavedNames] = useState<string[]>(() => {
    const saved = localStorage.getItem('savedNames');
    return saved ? JSON.parse(saved) : [];
  });

  const [savedModels, setSavedModels] = useState<string[]>(() => {
    const saved = localStorage.getItem('savedModels');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('withdrawals', JSON.stringify(withdrawals));
  }, [withdrawals]);

  useEffect(() => {
    localStorage.setItem('scriptUrl', scriptUrl);
  }, [scriptUrl]);

  useEffect(() => {
    localStorage.setItem('savedNames', JSON.stringify(savedNames));
  }, [savedNames]);

  useEffect(() => {
    localStorage.setItem('savedModels', JSON.stringify(savedModels));
  }, [savedModels]);

  const fetchMetadata = async () => {
    // Ensure it's a valid execution URL
    if (!scriptUrl || !scriptUrl.includes('script.google.com') || !scriptUrl.endsWith('/exec')) {
      return;
    }
    
    setIsSyncing(true);
    try {
      const res = await fetch(scriptUrl, {
        method: 'GET',
        redirect: 'follow'
      });
      
      if (!res.ok) throw new Error('Network response was not ok');
      
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        if (data.names && Array.isArray(data.names)) {
          setSavedNames(data.names);
        }
        if (data.models && Array.isArray(data.models)) {
          setSavedModels(data.models);
        }
        if (data.withdrawals && Array.isArray(data.withdrawals)) {
          // Merge local unsynced withdrawals with remote withdrawals
          setWithdrawals(prev => {
            const unsynced = prev.filter(w => !w.synced);
            
            // Create a map of remote withdrawals by code for easy lookup
            const remoteMap = new Map(data.withdrawals.map((w: any) => [w.code, w]));
            
            // Keep unsynced items, but if they exist in remote, mark them as synced
            const updatedUnsynced = unsynced.map(w => {
              if (remoteMap.has(w.code)) {
                remoteMap.delete(w.code); // Remove from remote map so we don't duplicate
                return { ...w, synced: true };
              }
              return w;
            });

            // Combine updated unsynced items with the remaining remote items
            return [...updatedUnsynced, ...Array.from(remoteMap.values())].sort((a, b) => 
              new Date(b.date).getTime() - new Date(a.date).getTime()
            );
          });
        }
      } catch (parseError) {
        console.warn('A resposta do script não é um JSON válido. Verifique se a implantação está como "Qualquer pessoa".');
      }
    } catch (error) {
      // Silently fail for network/CORS errors to avoid polluting the console
      console.warn('Sincronização em segundo plano falhou. Verifique a URL do Google Script e as permissões.');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchMetadata();

    // Set up polling for real-time updates (every 10 seconds)
    const intervalId = setInterval(() => {
      if (scriptUrl && !isSyncing) {
        fetchMetadata();
      }
    }, 10000);

    return () => clearInterval(intervalId);
  }, [scriptUrl]);

  const syncAction = (action: string, payload: any) => {
    if (!scriptUrl) return;
    fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...payload })
    }).catch(console.error);
  };

  const addName = (name: string) => {
    if (!savedNames.includes(name)) {
      setSavedNames(prev => [...prev, name].sort());
      syncAction('addName', { name });
    }
  };

  const removeName = (name: string) => {
    setSavedNames(prev => prev.filter(n => n !== name));
    syncAction('removeName', { name });
  };

  const addModel = (model: string) => {
    if (!savedModels.includes(model)) {
      setSavedModels(prev => [...prev, model].sort());
      syncAction('addModel', { model });
    }
  };

  const removeModel = (model: string) => {
    setSavedModels(prev => prev.filter(m => m !== model));
    syncAction('removeModel', { model });
  };

  const addWithdrawal = async (withdrawal: Omit<Withdrawal, 'id' | 'synced'>) => {
    const newWithdrawal: Withdrawal = {
      ...withdrawal,
      id: crypto.randomUUID(),
      synced: false,
    };

    setWithdrawals(prev => [newWithdrawal, ...prev]);

    if (scriptUrl) {
      try {
        await fetch(scriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify({ action: 'addWithdrawal', ...newWithdrawal }),
        });
        
        setWithdrawals(prev => prev.map(w => w.id === newWithdrawal.id ? { ...w, synced: true } : w));
      } catch (error) {
        console.error('Failed to sync', error);
      }
    }
  };

  const removeWithdrawal = (id: string) => {
    const withdrawalToRemove = withdrawals.find(w => w.id === id);
    setWithdrawals(prev => prev.filter(w => w.id !== id));
    
    if (withdrawalToRemove && scriptUrl) {
      syncAction('removeWithdrawal', { code: withdrawalToRemove.code });
    }
  };

  return (
    <StoreContext.Provider value={{ 
      withdrawals, addWithdrawal, removeWithdrawal,
      scriptUrl, setScriptUrl,
      savedNames, addName, removeName,
      savedModels, addModel, removeModel,
      isSyncing
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
}
