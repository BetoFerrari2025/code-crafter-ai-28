import { useState, useCallback } from 'react';

interface CodeVersion {
  id: string;
  code: string;
  timestamp: Date;
  description: string;
}

const MAX_HISTORY_SIZE = 20;

export const useCodeHistory = () => {
  const [history, setHistory] = useState<CodeVersion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const addVersion = useCallback((code: string, description: string = 'Código gerado') => {
    const newVersion: CodeVersion = {
      id: Date.now().toString(),
      code,
      timestamp: new Date(),
      description,
    };

    setHistory(prev => {
      // Remove versões futuras se estamos no meio do histórico
      const newHistory = prev.slice(0, currentIndex + 1);
      
      // Adiciona nova versão
      newHistory.push(newVersion);
      
      // Limita o tamanho do histórico
      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory.shift();
      }
      
      return newHistory;
    });

    setCurrentIndex(prev => Math.min(prev + 1, MAX_HISTORY_SIZE - 1));
  }, [currentIndex]);

  const undo = useCallback((): CodeVersion | null => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      return history[newIndex];
    }
    return null;
  }, [currentIndex, history]);

  const redo = useCallback((): CodeVersion | null => {
    if (currentIndex < history.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      return history[newIndex];
    }
    return null;
  }, [currentIndex, history]);

  const getCurrentVersion = useCallback((): CodeVersion | null => {
    if (currentIndex >= 0 && currentIndex < history.length) {
      return history[currentIndex];
    }
    return null;
  }, [currentIndex, history]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return {
    history,
    currentIndex,
    addVersion,
    undo,
    redo,
    getCurrentVersion,
    canUndo,
    canRedo,
  };
};
