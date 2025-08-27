import { Redirect } from 'expo-router';

// Redireciona "/tabs" para a primeira aba desejada
export default function TabsIndex() {
  return <Redirect href="/(tabs)/pessoas" />;
}
