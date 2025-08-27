
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Platform } from 'react-native';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { AppProvider } from './context/AppContext';
import { useColorScheme } from './context/hooks/useColorScheme';

import ItensScreen from './src/screens/ItensScreen';
import PessoasScreen from './src/screens/PessoasScreen';
import ResumoScreen from './src/screens/ResumoScreen';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useFonts } from 'expo-font';

const Tab = createBottomTabNavigator();

export default function App() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('./assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) return null;

  return (
    <AppProvider>
      <NavigationContainer theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Tab.Navigator
          initialRouteName="Pessoas"
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: (Colors as any)[colorScheme ?? 'light'].tint,
            tabBarButton: HapticTab as any,
            tabBarBackground: TabBarBackground as any,
            tabBarStyle: Platform.select({
              ios: { position: 'absolute' },
              default: {},
            }),
          }}
        >
          <Tab.Screen
            name="Pessoas"
            component={PessoasScreen}
            options={{
              tabBarIcon: ({ color }) => (
                <IconSymbol size={28} name="person.2.fill" color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Itens"
            component={ItensScreen}
            options={{
              tabBarIcon: ({ color }) => (
                <IconSymbol size={28} name="cart.fill" color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Resumo"
            component={ResumoScreen}
            options={{
              tabBarIcon: ({ color }) => (
                <IconSymbol size={28} name="doc.text.magnifyingglass" color={color} />
              ),
            }}
          />
        </Tab.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </AppProvider>
  );
}
