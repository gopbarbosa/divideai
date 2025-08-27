
import { useMemo, useState } from 'react';
import { FlatList, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useApp } from '../../context/AppContext';

interface Item {
  nome: string;
  preco: number;
  pessoas: string[];
}

// Em breve: dados virão do contexto global (AppContext)

export default function ResumoScreen() {
  const [servico, setServico] = useState('10');
  const [erro, setErro] = useState('');
  const { participantes, despesas } = useApp();
  const pessoas: string[] = participantes.map(p => p.nome);
  const itens: Item[] = despesas.map(d => ({
    nome: d.descricao,
    preco: d.valor,
    pessoas: d.participantes.map(pid => {
      const p = participantes.find(pp => pp.id === pid);
      return p ? p.nome : 'Desconhecido';
    })
  }));

  function calcularDivisao() {
    const valores: Record<string, number> = {};
    pessoas.forEach((p: string) => (valores[p] = 0));
    itens.forEach((item: Item) => {
      const valorPorPessoa = item.preco / item.pessoas.length;
      item.pessoas.forEach((p: string) => {
        valores[p] += valorPorPessoa;
      });
    });
    return valores;
  }

  const valores = calcularDivisao();
  const servicoNum = Number(servico);
  const servicoValido = !isNaN(servicoNum) && servicoNum >= 0 && servicoNum <= 100;

  // Cálculo de saldos reais (quem pagou - quanto deveria pagar)
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

  // Algoritmo simples para gerar transferências mínimas (quem deve para quem)
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
        dev.saldo += valor;
        cred.saldo -= valor;
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
    pessoas.forEach((p: string) => {
      texto += `- ${p}: R$ ${(valores[p] || 0).toFixed(2)}\n`;
    });
    texto += '\nQuem deve para quem:\n';
    if (transferencias.length === 0) {
      texto += 'Tudo certo! Ninguém deve nada.\n';
    } else {
      transferencias.forEach((t: any) => {
        texto += `- ${t.de} deve pagar R$ ${t.valor.toFixed(2)} para ${t.para}\n`;
      });
    }
    return texto;
  }

  async function compartilharResumo() {
    try {
      await Share.share({
        message: gerarTextoResumo(),
      });
    } catch (e) {
      setErro('Erro ao compartilhar');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Resumo</Text>
      <View style={styles.servicoRow}>
        <Text style={styles.label}>Serviço (%)</Text>
        <TextInput
          style={[styles.input, !servicoValido ? styles.inputErro : null]}
          value={servico}
          onChangeText={v => { setServico(v.replace(/[^0-9.]/g, '')); setErro(''); }}
          keyboardType="numeric"
          maxLength={5}
        />
      </View>
      {!servicoValido && <Text style={styles.erro}>Digite uma porcentagem válida (0-100)</Text>}
      <TouchableOpacity style={styles.botaoExportar} onPress={compartilharResumo}>
        <Text style={styles.botaoExportarTexto}>Exportar/Compartilhar resumo</Text>
      </TouchableOpacity>
      <FlatList
        data={pessoas}
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <View style={styles.pessoaBox}>
            <Text style={styles.pessoaNome}>{item}</Text>
            <Text style={styles.valor}>Sem serviço: <Text style={styles.valorNum}>R$ {valores[item]?.toFixed(2) || '0.00'}</Text></Text>
            <Text style={styles.valor}>Com serviço: <Text style={styles.valorNum}>R$ {servicoValido ? ((valores[item] || 0) * (1 + servicoNum / 100)).toFixed(2) : '--'}</Text></Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: '#888', textAlign: 'center', marginTop: 24 }}>Nenhuma pessoa</Text>}
        style={{ marginTop: 16 }}
      />
      <Text style={[styles.titulo, { fontSize: 20, marginTop: 24 }]}>Quem deve para quem</Text>
      {transferencias.length === 0 ? (
        <Text style={{ color: '#888', textAlign: 'center', marginTop: 12 }}>Tudo certo! Ninguém deve nada.</Text>
      ) : (
        transferencias.map((t, idx) => (
          <Text key={idx} style={{ color: '#222', fontSize: 16, textAlign: 'center', marginVertical: 2 }}>
            {`${t.de} deve pagar R$ ${t.valor.toFixed(2)} para ${t.para}`}
          </Text>
        ))
      )}
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
  servicoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  label: {
    fontSize: 16,
    color: '#222',
    minWidth: 90,
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
  inputErro: {
    borderColor: '#e74c3c',
  },
  erro: {
    color: '#e74c3c',
    marginBottom: 8,
    textAlign: 'center',
  },
  pessoaBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pessoaNome: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4f8cff',
    marginBottom: 4,
  },
  valor: {
    fontSize: 15,
    color: '#222',
  },
  valorNum: {
    fontWeight: 'bold',
    color: '#2d2d2d',
  },
  botaoExportar: {
    backgroundColor: '#27ae60',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  botaoExportarTexto: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
