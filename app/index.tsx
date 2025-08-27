import { Redirect } from 'expo-router';

export default function RootIndex() {
  // Redireciona "/" para a pilha de tabs
  return <Redirect href="/tabs" />;
}
