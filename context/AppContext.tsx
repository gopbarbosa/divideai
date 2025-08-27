import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export interface Participante {
  id: string;
  nome: string;
  cor?: string;
  icone?: string;
}

export interface Despesa {
  id: string;
  valor: number;
  descricao: string;
  quemPagou: string; // id do participante
  participantes: string[]; // ids dos participantes
  data: string;
}

interface AppContextData {
  participantes: Participante[];
  despesas: Despesa[];
  addParticipante: (p: Omit<Participante, 'id'>) => Promise<void>;
  editParticipante: (id: string, p: Partial<Participante>) => Promise<void>;
  removeParticipante: (id: string) => Promise<void>;
  addDespesa: (d: Omit<Despesa, 'id' | 'data'>) => Promise<void>;
  editDespesa: (id: string, d: Partial<Despesa>) => Promise<void>;
  removeDespesa: (id: string) => Promise<void>;
  carregar: () => Promise<void>;
}

const AppContext = createContext<AppContextData | undefined>(undefined);

const PARTICIPANTES_KEY = 'divideai_participantes';
const DESPESAS_KEY = 'divideai_despesas';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const p = await AsyncStorage.getItem(PARTICIPANTES_KEY);
    const d = await AsyncStorage.getItem(DESPESAS_KEY);
    setParticipantes(p ? JSON.parse(p) : []);
    setDespesas(d ? JSON.parse(d) : []);
  }

  async function salvarParticipantes(novos: Participante[]) {
    setParticipantes(novos);
    await AsyncStorage.setItem(PARTICIPANTES_KEY, JSON.stringify(novos));
  }
  async function salvarDespesas(novas: Despesa[]) {
    setDespesas(novas);
    await AsyncStorage.setItem(DESPESAS_KEY, JSON.stringify(novas));
  }

  async function addParticipante(p: Omit<Participante, 'id'>) {
    const novo = { ...p, id: Date.now().toString() };
    await salvarParticipantes([...participantes, novo]);
  }
  async function editParticipante(id: string, p: Partial<Participante>) {
    await salvarParticipantes(participantes.map(x => x.id === id ? { ...x, ...p } : x));
  }
  async function removeParticipante(id: string) {
    await salvarParticipantes(participantes.filter(x => x.id !== id));
    await salvarDespesas(despesas.filter(d => d.quemPagou !== id && !d.participantes.includes(id)));
  }

  async function addDespesa(d: Omit<Despesa, 'id' | 'data'>) {
    const nova = { ...d, id: Date.now().toString(), data: new Date().toISOString() };
    await salvarDespesas([...despesas, nova]);
  }
  async function editDespesa(id: string, d: Partial<Despesa>) {
    await salvarDespesas(despesas.map(x => x.id === id ? { ...x, ...d } : x));
  }
  async function removeDespesa(id: string) {
    await salvarDespesas(despesas.filter(x => x.id !== id));
  }

  return (
    <AppContext.Provider value={{ participantes, despesas, addParticipante, editParticipante, removeParticipante, addDespesa, editDespesa, removeDespesa, carregar }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp deve ser usado dentro de AppProvider');
  return ctx;
}
