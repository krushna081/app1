import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ResidentScreen } from '../screens/resident/ResidentScreen';
import { ResidentStackParamList } from './types';

const Stack = createStackNavigator<ResidentStackParamList>();

export const ResidentNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="ResidentHome"
      component={ResidentScreen}
      options={{ title: 'My Visitors' }}
    />
  </Stack.Navigator>
);
