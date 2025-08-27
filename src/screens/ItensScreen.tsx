import React, { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useApp } from '../../context/AppContext';

export default function ItensScreen() {
  const { participantes, despesas, addDespesa, editDespesa, removeDespesa } = useApp();
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [quemPagou, setQuemPagou] = useState('');
  const [participantesSelecionados, setParticipantesSelecionados] = useState<string[]>([]);
  const [erro, setErro] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);

  function toggleParticipante(id: string) {
    setParticipantesSelecionados(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  }

  async function salvar() {
    const valorNum = Number(valor.replace(',', '.'));
    if (!descricao.trim() || isNaN(valorNum) || valorNum <= 0 || !quemPagou || participantesSelecionados.length === 0) {
      setErro('Preencha todos os campos corretamente');
      return;
    }
    if (editandoId) {
      await editDespesa(editandoId, {
        valor: valorNum,
        descricao,
        quemPagou,
        participantes: participantesSelecionados,
      });
      setEditandoId(null);
    } else {
      await addDespesa({
        valor: valorNum,
        descricao,
        quemPagou,
        participantes: participantesSelecionados,
      });
    }
    setValor('');
    setDescricao('');
    setQuemPagou('');
    setParticipantesSelecionados([]);
    setErro('');
  }

  function editar(d: any) {
    setEditandoId(d.id);
    setValor(String(d.valor));
    setDescricao(d.descricao);
    setQuemPagou(d.quemPagou);
    setParticipantesSelecionados(d.participantes);
  }

  async function excluir(id: string) {
    await removeDespesa(id);
    if (editandoId === id) {
      setEditandoId(null);
      setValor('');
      setDescricao('');
      setQuemPagou('');
      setParticipantesSelecionados([]);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titulo}>Despesas</Text>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Descrição"
          value={descricao}
          onChangeText={setDescricao}
        />
        <TextInput
          style={styles.input}
          placeholder="Valor (ex: 10.50)"
          value={valor}
          onChangeText={setValor}
          keyboardType="decimal-pad"
        />
        <Text style={styles.label}>Quem pagou?</Text>
        <FlatList
          data={participantes}
          horizontal
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.participanteBtn, quemPagou === item.id && styles.participanteBtnAtivo]}
              onPress={() => setQuemPagou(item.id)}
            >
              <View style={[styles.corBox, { backgroundColor: item.cor || '#eee' }]} />
              <Text style={styles.participanteNome}>{item.nome}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={{ color: '#888', marginLeft: 8 }}>Nenhum participante</Text>}
          style={{ marginVertical: 8 }}
        />
        <Text style={styles.label}>Dividir entre:</Text>
        <FlatList
          data={participantes}
          horizontal
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.participanteBtn, participantesSelecionados.includes(item.id) && styles.participanteBtnAtivo]}
              onPress={() => toggleParticipante(item.id)}
            >
              <View style={[styles.corBox, { backgroundColor: item.cor || '#eee' }]} />
              <Text style={styles.participanteNome}>{item.nome}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={{ color: '#888', marginLeft: 8 }}>Nenhum participante</Text>}
          style={{ marginVertical: 8 }}
        />
        <TouchableOpacity style={styles.botao} onPress={salvar}>
          <Text style={styles.botaoTexto}>{editandoId ? 'Salvar' : 'Adicionar'}</Text>
        </TouchableOpacity>
      </View>
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
      <Text style={styles.subtitulo}>Lista de despesas</Text>
      <FlatList
        data={despesas}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.despesaBox}>
            <Text style={styles.despesaDesc}>{item.descricao}</Text>
            <Text style={styles.despesaValor}>R$ {item.valor.toFixed(2)}</Text>
            <Text style={styles.despesaInfo}>Pagou: {participantes.find(p => p.id === item.quemPagou)?.nome || 'Desconhecido'}</Text>
            <Text style={styles.despesaInfo}>Dividido entre: {item.participantes.map(pid => participantes.find(p => p.id === pid)?.nome || 'Desconhecido').join(', ')}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <TouchableOpacity onPress={() => editar(item)}>
                <Text style={styles.acao}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => excluir(item.id)}>
                <Text style={[styles.acao, { color: '#e74c3c' }]}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: '#888', textAlign: 'center', marginTop: 24 }}>Nenhuma despesa</Text>}
        style={{ marginTop: 16 }}
      />
    </ScrollView>
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
  subtitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 8,
    color: '#4f8cff',
  },
  form: {
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    color: '#222',
    marginTop: 8,
    marginBottom: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  botao: {
    backgroundColor: '#4f8cff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 8,
    alignSelf: 'flex-end',
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
  participanteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  participanteBtnAtivo: {
    borderColor: '#4f8cff',
    backgroundColor: '#eaf2ff',
  },
  corBox: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  participanteNome: {
    fontSize: 15,
    color: '#2d2d2d',
  },
  despesaBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  despesaDesc: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  despesaValor: {
    fontSize: 15,
    color: '#4f8cff',
    fontWeight: 'bold',
  },
  despesaInfo: {
    fontSize: 14,
    color: '#555',
  },
  acao: {
    color: '#4f8cff',
    fontWeight: 'bold',
    marginRight: 16,
  },
});
