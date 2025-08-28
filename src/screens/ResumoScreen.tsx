import React, { useMemo, useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';

interface Item { nome: string; preco: number; pessoas: string[] }

export default function ResumoScreen() {
  const [mostrarTransf, setMostrarTransf] = useState(false);
  const [erro, setErro] = useState('');
  const { participantes, despesas } = useApp();
  const pessoas: string[] = participantes.map(p => p.nome);
  const itens: Item[] = despesas.map(d => ({
    nome: d.descricao,
    preco: d.valor,
    pessoas: d.participantes.map(pid => participantes.find(pp => pp.id === pid)?.nome || 'Desconhecido')
  }));

  function calcularDivisao() {
    const valores: Record<string, number> = {};
    pessoas.forEach((p: string) => (valores[p] = 0));
    itens.forEach((item: Item) => {
      const valorPorPessoa = item.preco / item.pessoas.length;
      item.pessoas.forEach((p: string) => { valores[p] += valorPorPessoa; });
    });
    return valores;
  }

  const valores = calcularDivisao();



  const saldos = useMemo(() => {
    const val: Record<string, number> = {};
    participantes.forEach(p => (val[p.nome] = 0));
    despesas.forEach(d => {
      const valorPorPessoa = d.valor / d.participantes.length;
      d.participantes.forEach(pid => {
        const p = participantes.find(pp => pp.id === pid);
        if (p) val[p.nome] -= valorPorPessoa;
      });
      const pagador = participantes.find(pp => pp.id === d.quemPagou);
      if (pagador) val[pagador.nome] += d.valor;
    });
    return val;
  }, [participantes, despesas]);

  function calcularTransferencias(saldos: Record<string, number>) {
    const lista = Object.entries(saldos).map(([nome, saldo]) => ({ nome, saldo: Math.round(saldo * 100) / 100 }));
    const devedores = lista.filter(x => x.saldo < 0).sort((a, b) => a.saldo - b.saldo);
    const credores = lista.filter(x => x.saldo > 0).sort((a, b) => b.saldo - a.saldo);
    const transfs: { de: string; para: string; valor: number }[] = [];
    let i = 0, j = 0;
    while (i < devedores.length && j < credores.length) {
      const dev = devedores[i];
      const cred = credores[j];
      const valor = Math.min(-dev.saldo, cred.saldo);
      if (valor > 0.01) {
        transfs.push({ de: dev.nome, para: cred.nome, valor: Math.round(valor * 100) / 100 });
        dev.saldo += valor; cred.saldo -= valor;
      }
      if (Math.abs(dev.saldo) < 0.01) i++;
      if (cred.saldo < 0.01) j++;
    }
    return transfs;
  }

  const transferencias = useMemo(() => calcularTransferencias(saldos), [saldos]);

  function gerarTextoResumo() {
    let texto = 'Resumo da divisão de contas\n\n';
    texto += 'Totais por pessoa:\n';
    pessoas.forEach((p: string) => { texto += `- ${p}: R$ ${(valores[p] || 0).toFixed(2)}\n`; });
    texto += '\nQuem deve para quem:\n';
    if (transferencias.length === 0) texto += 'Tudo certo! Ninguém deve nada.\n';
    else transferencias.forEach((t: any) => { texto += `- ${t.de} deve pagar R$ ${t.valor.toFixed(2)} para ${t.para}\n`; });
    return texto;
  }

  async function compartilharResumo() {
    try { await Share.share({ message: gerarTextoResumo() }); }
    catch (e) { setErro('Erro ao compartilhar'); }
  }

  const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f7f7fa' },
    titulo: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: '#2d2d2d', textAlign: 'center' },
  // estilos de serviço removidos
    erro: { color: '#e74c3c', marginBottom: 8, textAlign: 'center' },
    pessoaBox: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    pessoaNome: { fontSize: 18, fontWeight: 'bold', color: '#4f8cff', marginBottom: 4 },
    valor: { fontSize: 15, color: '#222' },
    valorNum: { fontWeight: 'bold', color: '#2d2d2d' },
    botaoExportar: { backgroundColor: '#27ae60', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 18, alignSelf: 'center', marginTop: 8, marginBottom: 8 },
    botaoExportarTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

    safeArea: { flex: 1, backgroundColor: '#f7f7fa' },
    accordionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 24,
      marginBottom: 4,
      gap: 8
    },
    accordionIcon: {
      fontSize: 18,
      color: '#4f8cff',
      marginLeft: 8,
      marginTop: 2
    },    transfBox: {
      backgroundColor: '#fff',
      borderRadius: 8,
      padding: 16,
      marginTop: 24,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
      alignItems: 'stretch'
    },
  });




  return (
    <SafeAreaView style={styles.safeArea} edges={["top","left","right","bottom"]}>
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
  <Text style={styles.titulo}>Resumo</Text>
  <Text style={[styles.titulo, { fontSize: 20, marginTop: 12, marginBottom: 8, textAlign: 'left' }]}>Total por pessoa</Text>
  {/* Serviço removido */}
       
        <View style={{ marginTop: 8, marginBottom: 24 }}>
          {pessoas.length === 0 ? (
            <Text style={{ color: '#888', textAlign: 'left', marginTop: 24 }}>Nenhuma pessoa</Text>
          ) : (
            pessoas.map((item) => (
              <View key={item} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, marginBottom: 6, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 1, elevation: 1 }}>
                <Text style={{ fontSize: 17, color: '#4f8cff', fontWeight: 'bold' }}>{item}</Text>
                <Text style={{ fontWeight: 'bold', color: '#27ae60', fontSize: 17 }}>R$ {valores[item]?.toFixed(2) || '0.00'}</Text>
              </View>
            ))
          )}
        </View>

        <Text style={[styles.titulo, { fontSize: 20, marginTop: 0, marginBottom: 8, textAlign: 'left' }]}>Pagamentos necessários</Text>
        <View style={{ marginBottom: 16 }}>
          {transferencias.length === 0 ? (
            <Text style={{ color: '#888', textAlign: 'left' }}>Tudo certo! Ninguém deve nada.</Text>
          ) : (
            transferencias.map((t, idx) => (
              <Text key={idx} style={{ color: '#222', fontSize: 16, marginBottom: 4, textAlign: 'left' }}>
                {t.de} paga <Text style={{ color: '#27ae60', fontWeight: 'bold' }}>R$ {t.valor.toFixed(2)}</Text> para {t.para}
              </Text>
            ))
          )}
        </View>
       <TouchableOpacity style={styles.botaoExportar} onPress={compartilharResumo}>
          <Text style={styles.botaoExportarTexto}>Exportar/Compartilhar resumo</Text>
        </TouchableOpacity>
      </View>
      
      </ScrollView>
    </SafeAreaView>
  );


}