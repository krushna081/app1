import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../hooks/useAuth';
import { AuthNavigator } from './AuthNavigator';
import { GuardNavigator } from './GuardNavigator';
import { ResidentNavigator } from './ResidentNavigator';
import { AdminNavigator } from './AdminNavigator';
import { LoadingOverlay } from '../components/common/LoadingOverlay';
import { AuthErrorScreen } from '../screens/auth/AuthErrorScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

export const Navigation: React.FC = () => {
  const { user, isLoading, error, isPasswordRecovery } = useAuth();

  if (isLoading) {
    return <LoadingOverlay visible />;
  }

  if (isPasswordRecovery) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="PasswordRecovery" component={ResetPasswordScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  if (error) {
    return <AuthErrorScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <>
            {user.role === 'guard' && <Stack.Screen name="Guard" component={GuardNavigator} />}
            {user.role === 'resident' && (
              <Stack.Screen name="Resident" component={ResidentNavigator} />
            )}
            {user.role === 'admin' && <Stack.Screen name="Admin" component={AdminNavigator} />}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
