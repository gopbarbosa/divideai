import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FlatList, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';
import { useApp } from '../../context/AppContext';

export default function ItensScreen() {
  const { participantes, despesas, addDespesa, editDespesa, removeDespesa } = useApp();
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const valorSchema = z
    .string()
    .trim()
    .refine((s) => /^[0-9]+([.,][0-9]{0,2})?$/.test(s), 'Valor inválido')
    .refine((s) => Number(s.replace(',', '.')) > 0, { message: 'Valor deve ser maior que zero' });

  const schema = z.object({
    descricao: z.string().trim().min(1, 'Digite uma descrição'),
    valor: valorSchema,
    quemPagou: z.string().min(1, 'Selecione quem pagou'),
    participantesSelecionados: z.array(z.string()).min(1, 'Selecione pelo menos uma pessoa'),
  });

  type FormData = z.infer<typeof schema>;

  const { control, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      descricao: '',
      valor: '',
      quemPagou: '',
      participantesSelecionados: [],
    },
  });

  const descricao = watch('descricao');
  const valor = watch('valor');
  const quemPagou = watch('quemPagou');
  const participantesSelecionados = watch('participantesSelecionados');

  function toggleParticipante(id: string) {
    const atual = participantesSelecionados || [];
    const novo = atual.includes(id) ? atual.filter((p: string) => p !== id) : [...atual, id];
    setValue('participantesSelecionados', novo, { shouldValidate: true, shouldDirty: true });
  }

  const onSubmit = async (data: FormData) => {
    const valorNum = Number(data.valor.replace(',', '.'));
    if (editandoId) {
      await editDespesa(editandoId, {
        valor: valorNum,
        descricao: data.descricao,
        quemPagou: data.quemPagou,
        participantes: data.participantesSelecionados,
      });
      setEditandoId(null);
    } else {
      await addDespesa({
        valor: valorNum,
        descricao: data.descricao,
        quemPagou: data.quemPagou,
        participantes: data.participantesSelecionados,
      });
    }
  reset();
  Keyboard.dismiss();
  };

  function editar(d: any) {
    setEditandoId(d.id);
    reset({
      descricao: d.descricao,
      valor: String(d.valor).replace('.', ','),
      quemPagou: d.quemPagou,
      participantesSelecionados: d.participantes,
    } as any);
  }

  async function excluir(id: string) {
    await removeDespesa(id);
    if (editandoId === id) {
      setEditandoId(null);
      reset();
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top","left","right","bottom"]}>
      <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined} >
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
          ListHeaderComponent={
            <HeaderForm
              control={control}
              errors={errors}
              participantes={participantes}
              quemPagou={quemPagou}
              participantesSelecionados={participantesSelecionados}
              setValue={setValue}
              toggleParticipante={toggleParticipante}
              handleSubmit={handleSubmit}
              onSubmit={onSubmit}
              editandoId={editandoId}
              isSubmitting={isSubmitting}
            />
          }
          keyboardShouldPersistTaps="handled"
          style={styles.list}
          contentContainerStyle={styles.contentContainer}
          removeClippedSubviews={false}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type HeaderFormProps = {
  control: any;
  errors: any;
  participantes: any[];
  quemPagou: string;
  participantesSelecionados: string[];
  setValue: (...args: any[]) => void;
  toggleParticipante: (id: string) => void;
  handleSubmit: any;
  onSubmit: any;
  editandoId: string | null;
  isSubmitting: boolean;
};

const HeaderForm = React.memo(function HeaderForm({
  control,
  errors,
  participantes,
  quemPagou,
  participantesSelecionados,
  setValue,
  toggleParticipante,
  handleSubmit,
  onSubmit,
  editandoId,
  isSubmitting,
}: HeaderFormProps) {
  return (
    <>
      <Text style={styles.titulo}>Despesas</Text>
      <View style={styles.form}>
        <Controller
          control={control}
          name="descricao"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="Descrição"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              returnKeyType="next"
              clearButtonMode="while-editing"
            />
          )}
        />
        {errors.descricao && <Text style={styles.erro}>{errors.descricao.message as string}</Text>}
        <Controller
          control={control}
          name="valor"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="Valor (ex: 10,50)"
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={() => {
                onBlur();
                const str = String(value ?? '');
                const norm = str.replace(',', '.').replace(/[^0-9.]/g, '');
                const num = Number(norm);
                if (!isNaN(num) && isFinite(num)) {
                  const fixed = num.toFixed(2).replace('.', ',');
                  setValue('valor', fixed, { shouldValidate: true, shouldDirty: true });
                }
              }}
              inputMode="decimal"
              keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
              returnKeyType="done"
              blurOnSubmit
              clearButtonMode="while-editing"
            />
          )}
        />
        {errors.valor && <Text style={styles.erro}>{errors.valor.message as string}</Text>}
        <Text style={styles.label}>Quem pagou?</Text>
        {participantes.length === 0 ? (
          <Text style={{ color: '#888', marginLeft: 8, marginBottom: 8 }}>Nenhum participante</Text>
        ) : (
          <View style={styles.chipsContainer}>
            {participantes.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.participanteBtn, quemPagou === item.id && styles.participanteBtnAtivo]}
                onPress={() => setValue('quemPagou', item.id, { shouldValidate: true, shouldDirty: true })}
              >
                <View style={[styles.corBox, { backgroundColor: item.cor || '#eee' }]} />
                <Text style={styles.participanteNome}>{item.nome}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {errors.quemPagou && <Text style={styles.erro}>{errors.quemPagou.message as string}</Text>}
        <Text style={styles.label}>Dividir entre:</Text>
        {participantes.length === 0 ? (
          <Text style={{ color: '#888', marginLeft: 8, marginBottom: 8 }}>Nenhum participante</Text>
        ) : (
          <View style={styles.chipsContainer}>
            {/* Chip TODOS */}
            <TouchableOpacity
              key="todos"
              style={[styles.participanteBtn, participantesSelecionados.length === participantes.length && participantes.length > 0 && styles.participanteBtnAtivo]}
              onPress={() => {
                const allIds = participantes.map(p => p.id);
                const allSelected = participantesSelecionados.length === participantes.length;
                setValue('participantesSelecionados', allSelected ? [] : allIds, { shouldValidate: true, shouldDirty: true });
              }}
            >
              <View style={[styles.corBox, { backgroundColor: '#ddd' }]} />
              <Text style={styles.participanteNome}>Todos</Text>
            </TouchableOpacity>
            {participantes.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.participanteBtn, participantesSelecionados.includes(item.id) && styles.participanteBtnAtivo]}
                onPress={() => toggleParticipante(item.id)}
              >
                <View style={[styles.corBox, { backgroundColor: item.cor || '#eee' }]} />
                <Text style={styles.participanteNome}>{item.nome}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {errors.participantesSelecionados && (
          <Text style={styles.erro}>{errors.participantesSelecionados.message as string}</Text>
        )}
        <TouchableOpacity style={[styles.botao, isSubmitting && { opacity: 0.6 }]} onPress={handleSubmit(onSubmit)} disabled={isSubmitting}>
          <Text style={styles.botaoTexto}>{editandoId ? 'Salvar' : 'Adicionar'}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitulo}>Lista de despesas</Text>
    </>
  );
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f7fa',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f7f7fa',
  },
  list: {
    flex: 1,
    backgroundColor: '#f7f7fa',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 20,
  },
  flex1: { flex: 1 },
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
  marginBottom: 8,
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
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    marginVertical: 8,
  },
});
