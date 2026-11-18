import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ResidentScreen } from '../screens/resident/ResidentScreen';
import { HeaderSignOut } from '../components/common/HeaderSignOut';
import { ResidentStackParamList } from './types';
import { colors } from '../theme';

const Stack = createStackNavigator<ResidentStackParamList>();

export const ResidentNavigator = () => (
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
      name="ResidentHome"
      component={ResidentScreen}
      options={{ title: 'My Visitors', headerRight: () => <HeaderSignOut /> }}
    />
  </Stack.Navigator>
);
