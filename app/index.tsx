import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../src/stores/auth';
import { colors } from '../src/lib/theme';

export default function Index() {
  const { session, isLoading, isOnboarded } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.amber} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (!isOnboarded) {
    return <Redirect href="/(auth)/select-way" />;
  }

  return <Redirect href="/(tabs)/map" />;
}
