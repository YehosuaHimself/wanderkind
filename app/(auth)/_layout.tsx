import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#FAFAF5' },
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="role-select" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="signin" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="trail-name" />
      <Stack.Screen name="select-way" />
      <Stack.Screen name="photo-upload" />
      <Stack.Screen name="host-setup" />
      <Stack.Screen name="home-photo" />
      <Stack.Screen name="permissions" />
      <Stack.Screen name="onboarding-complete" />
    </Stack>
  );
}
