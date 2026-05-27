import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { GuardScreen } from '../screens/guard/GuardScreen';
import { GuardStackParamList } from './types';

const Stack = createStackNavigator<GuardStackParamList>();

export const GuardNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="GuardHome"
      component={GuardScreen}
      options={{ title: 'Guard Terminal' }}
    />
  </Stack.Navigator>
);
