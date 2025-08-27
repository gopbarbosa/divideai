import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useApp } from '../../context/AppContext';

export default function PessoasScreen() {
  const { participantes, addParticipante, editParticipante, removeParticipante } = useApp();
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState('');
  const [erro, setErro] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);

  async function salvar() {
    if (!nome.trim()) {
      setErro('Digite um nome');
      return;
    }
    if (!editandoId && participantes.some(p => p.nome === nome.trim())) {
      setErro('Nome já adicionado');
      return;
    }
    if (editandoId) {
      await editParticipante(editandoId, { nome, cor });
      setEditandoId(null);
    } else {
      await addParticipante({ nome, cor });
    }
    setNome('');
    setCor('');
    setErro('');
  }

  function editar(p: { id: string; nome: string; cor?: string }) {
    setEditandoId(p.id);
    setNome(p.nome);
    setCor(p.cor || '');
  }

  async function excluir(id: string) {
    await removeParticipante(id);
    if (editandoId === id) {
      setEditandoId(null);
      setNome('');
      setCor('');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Participantes</Text>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Nome"
          value={nome}
          onChangeText={setNome}
        />
        <TextInput
          style={styles.input}
          placeholder="Cor (opcional, ex: #4f8cff)"
          value={cor}
          onChangeText={setCor}
        />
        <TouchableOpacity style={styles.botao} onPress={salvar}>
          <Text style={styles.botaoTexto}>{editandoId ? 'Salvar' : 'Adicionar'}</Text>
        </TouchableOpacity>
      </View>
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
      <FlatList
        data={participantes}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.participanteBox}>
            <View style={[styles.corBox, { backgroundColor: item.cor || '#eee' }]} />
            <Text style={styles.nome}>{item.nome}</Text>
            <TouchableOpacity onPress={() => editar(item)}>
              <Text style={styles.acao}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => excluir(item.id)}>
              <Text style={[styles.acao, { color: '#e74c3c' }]}>Excluir</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: '#888', textAlign: 'center', marginTop: 24 }}>Nenhum participante</Text>}
        style={{ marginTop: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f7f7fa',
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2d2d2d',
    textAlign: 'center',
  },
  form: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
    fontSize: 16,
    flex: 1,
  },
  botao: {
    backgroundColor: '#4f8cff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginLeft: 4,
  },
  botaoTexto: {
    color: '#fff',
    fontWeight: 'bold',
  },
  erro: {
    color: '#e74c3c',
    marginBottom: 8,
    textAlign: 'center',
  },
  participanteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    gap: 8,
  },
  corBox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  nome: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d2d2d',
    flex: 1,
  },
  acao: {
    color: '#4f8cff',
    fontWeight: 'bold',
    marginLeft: 12,
  },
});
