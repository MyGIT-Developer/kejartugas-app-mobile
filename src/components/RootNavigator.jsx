import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Login from '../screens/Login'; // Assuming you have a Login screen
import AppNavigator from './AppNavigator';

const Stack = createStackNavigator();

const RootNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
  {/* Uncomment the line below if you want a Login screen */}
  <Stack.Screen name="Login" component={Login} />
  <Stack.Screen name="App" component={AppNavigator} />
  {/* Add other screens if necessary */}
</Stack.Navigator>
);

export default RootNavigator;
