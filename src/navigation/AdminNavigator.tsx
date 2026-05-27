import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AdminScreen } from '../screens/admin/AdminScreen';
import { CreateAccountScreen } from '../screens/admin/CreateAccountScreen';
import { AdminStackParamList } from './types';
import { colors } from '../theme';

const Stack = createStackNavigator<AdminStackParamList>();

export const AdminNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: colors.background,
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: colors.text,
      headerTitleStyle: {
        fontWeight: '600',
      },
    }}
  >
    <Stack.Screen
      name="AdminHome"
      component={AdminScreen}
      options={{ title: 'Dashboard' }}
    />
    <Stack.Screen
      name="CreateAccount"
      component={CreateAccountScreen}
      options={{ title: 'Create Account' }}
    />
  </Stack.Navigator>
);
