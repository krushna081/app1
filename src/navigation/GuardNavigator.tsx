import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { GuardScreen } from '../screens/guard/GuardScreen';
import { HeaderSignOut } from '../components/common/HeaderSignOut';
import { GuardStackParamList } from './types';
import { colors } from '../theme';

const Stack = createStackNavigator<GuardStackParamList>();

export const GuardNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: colors.background,
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: colors.text,
      headerTitleStyle: { fontWeight: '600' },
    }}
  >
    <Stack.Screen
      name="GuardHome"
      component={GuardScreen}
      options={{ title: 'Guard Terminal', headerRight: () => <HeaderSignOut /> }}
    />
  </Stack.Navigator>
);
