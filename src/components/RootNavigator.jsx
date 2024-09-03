import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Login from '../screens/Login';
import AppNavigator from './AppNavigator';

const Stack = createStackNavigator();

const RootNavigator = () => (
    <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="App" component={AppNavigator} />
        </Stack.Navigator>
    </NavigationContainer>
);

export default RootNavigator;
