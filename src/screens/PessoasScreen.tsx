import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ColorPicker, { colorKit, HueSlider, OpacitySlider, Panel1, PreviewText, Swatches } from 'reanimated-color-picker';
import { useApp } from '../../context/AppContext';

export default function PessoasScreen() {
  const { participantes, addParticipante, editParticipante, removeParticipante } = useApp();
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState('');
  const [erro, setErro] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [usarCor, setUsarCor] = useState(false);
  const [abrirPersonalizada, setAbrirPersonalizada] = useState(false);

  const PALETA = useMemo(
    () => [
      '#E57373', '#F06292', '#BA68C8', '#9575CD', '#7986CB', '#64B5F6',
      '#4DD0E1', '#4DB6AC', '#81C784', '#AED581', '#DCE775', '#FFF176',
      '#FFD54F', '#FFB74D', '#A1887F', '#90A4AE'
    ],
    []
  )

  // Swatches para o color picker
  const customSwatches = useMemo(
    () => new Array(6).fill('#fff').map(() => colorKit.randomRgbColor().hex()),
    []
  );

  async function salvar() {
    if (!nome.trim()) {
      setErro('Digite um nome');
      return;
    }
    if (!editandoId && participantes.some(p => p.nome === nome.trim())) {
      setErro('Nome já adicionado');
      return;
    }
  // valida opção de cor personalizada
    let chosen = '';
    const hexOk = /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(cor || '');
    if (usarCor) {
      if (!cor) {
        // Sugerir cor não usada
        const usadas = participantes.map(p => (p.cor || '').toLowerCase());
        const livre = PALETA.find(c => !usadas.includes(c.toLowerCase()));
        if (livre) {
          chosen = livre;
        } else {
          // Gera cor aleatória
          const rand = () => Math.floor(Math.random() * 200 + 30).toString(16).padStart(2, '0');
          chosen = `#${rand()}${rand()}${rand()}`;
        }
      } else if (!hexOk) {
        setErro('Cor inválida. Use formato #RRGGBB.');
        return;
      } else {
        chosen = cor;
      }
    } else {
      // Sempre atribui cor padrão se não usar cor customizada
      const usadas = participantes.map(p => (p.cor || '').toLowerCase());
      const livre = PALETA.find(c => !usadas.includes(c.toLowerCase()));
      if (livre) {
        chosen = livre;
      } else {
        const rand = () => Math.floor(Math.random() * 200 + 30).toString(16).padStart(2, '0');
        chosen = `#${rand()}${rand()}${rand()}`;
      }
    }
    if (editandoId) {
      await editParticipante(editandoId, { nome, cor: chosen });
      setEditandoId(null);
    } else {
      await addParticipante({ nome, cor: chosen });
    }
    setNome('');
    setCor('');
    setErro('');
    setUsarCor(false);
    setAbrirPersonalizada(false);
  }

  function editar(p: { id: string; nome: string; cor?: string }) {
    setEditandoId(p.id);
    setNome(p.nome);
    const temCor = !!p.cor;
    setUsarCor(temCor);
    setCor(p.cor || '');
    setAbrirPersonalizada(temCor && !(PALETA.includes(p.cor || '')));
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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
      <Text style={styles.titulo}>Participantes</Text>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Nome"
          value={nome}
          onChangeText={setNome}
        />
        <TouchableOpacity style={styles.botao} onPress={salvar}>
          <Text style={styles.botaoTexto}>{editandoId ? 'Salvar' : 'Adicionar'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.colorSection}>
        <View style={styles.colorHeaderRow}>
          <Text style={styles.colorLabel}>Cor</Text>
          <TouchableOpacity
            onPress={() => { setUsarCor(!usarCor); if (usarCor) { setAbrirPersonalizada(false); setCor(''); } }}
            style={[styles.toggleChip, usarCor && styles.toggleChipOn]}
          >
            <Text style={[styles.toggleChipText, usarCor && styles.toggleChipTextOn]}>{usarCor ? 'Remover cor' : 'Definir cor'}</Text>
          </TouchableOpacity>
        </View>
        {usarCor && (
          <>
            <View style={styles.palette}>
              {PALETA.map((c) => {
                const selected = (cor || '') === c && !abrirPersonalizada;
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => { setCor(c); setAbrirPersonalizada(false); }}
                    style={[styles.colorChip, selected && styles.colorChipSelected, { backgroundColor: c }]}
                    accessibilityLabel={`Selecionar cor ${c}`}
                  />
                );
              })}
              <TouchableOpacity
                onPress={() => setAbrirPersonalizada(!abrirPersonalizada)}
                style={[styles.colorChipCustom, abrirPersonalizada && styles.colorChipCustomOn]}
              >
                <Text style={styles.colorChipCustomText}>Outra cor…</Text>
              </TouchableOpacity>
            </View>
            {abrirPersonalizada && (
              <View style={styles.customRow}>
                <View style={[styles.customPreview, { backgroundColor: /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(cor) ? cor : '#ddd' }]} />
                <View style={{ flex: 1, minWidth: 220 }}>
                  <ColorPicker
                    value={cor || customSwatches[0]}
                    sliderThickness={22}
                    thumbSize={24}
                    thumbShape="circle"
                    boundedThumb
                    style={{ width: '100%', minHeight: 220 }}
                    onChange={c => {
                      'worklet';
                    }}
                    onCompleteJS={(c: { hex: string }) => setCor(c.hex)}
                  >
                    <Panel1 style={{ borderRadius: 12, marginBottom: 8 }} />
                    <HueSlider style={{ marginVertical: 8 }} />
                    <OpacitySlider style={{ marginBottom: 8 }} />
                    <Swatches
                      style={{ marginVertical: 8, flexWrap: 'wrap' }}
                      swatchStyle={{ margin: 2, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', width: 28, height: 28 }}
                      colors={customSwatches}
                    />
                    <PreviewText style={{ marginTop: 8, fontWeight: 'bold', color: '#222', fontSize: 15 }} colorFormat="hex" />
                  </ColorPicker>
                </View>
              </View>
            )}
          </>
        )}
      </View>
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
      <View style={{ marginTop: 16 }}>
        {participantes.length === 0 ? (
          <Text style={{ color: '#888', textAlign: 'center', marginTop: 24 }}>Nenhum participante</Text>
        ) : (
          participantes.map(item => (
            <View style={styles.participanteBox} key={item.id}>
              {item.cor ? (
                <View style={[styles.corBox, { backgroundColor: item.cor }]} />
              ) : null}
              <Text style={styles.nome}>{item.nome}</Text>
              <TouchableOpacity onPress={() => editar(item)}>
                <Text style={styles.acao}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => excluir(item.id)}>
                <Text style={[styles.acao, { color: '#e74c3c' }]}>Excluir</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
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
  colorSection: {
    marginBottom: 8,
  },
  colorLabel: {
    fontSize: 15,
    color: '#222',
    marginTop: 8,
    marginBottom: 6,
  },
  colorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  palette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorChip: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorChipSelected: {
    borderColor: '#4f8cff',
  },
  toggleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  toggleChipOn: {
    borderColor: '#4f8cff',
    backgroundColor: '#eaf2ff',
  },
  toggleChipText: {
    color: '#222',
    fontWeight: '600',
  },
  toggleChipTextOn: {
    color: '#4f8cff',
  },
  colorChipCustom: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  colorChipCustomOn: {
    borderColor: '#4f8cff',
    backgroundColor: '#eaf2ff',
  },
  colorChipCustomText: {
    color: '#2d2d2d',
    fontSize: 13,
    fontWeight: '600',
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  customPreview: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#ddd',
  },
});
