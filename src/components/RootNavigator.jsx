import React from 'react';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import AppNavigator from '../components/AppNavigator';
import Login from '../screens/Login';
import SplashScreen from '../screens/SplashScreen';
import DetailKehadiran from '../screens/DetailKehadiran';
import ForgotPassword from '../screens/ForgotPassword';
import BoardingScreen from '../screens/BoardingScreen';
import Step1 from '../screens/Step1';
import Step2 from '../screens/Step2';
import DetailProjek from '../screens/DetailProjek';
import ProjectList from '../screens/ProjectList';
import TaskOnReview from '../screens/TaskOnReview';
import ProjectOnWorking from '../screens/ProjectOnWorking';
import SubmitTugas from '../screens/SubmitTugas';
import DetailTaskSection from '../screens/DetailTaskSection';
import AddProjectForm from '../screens/AddProjectForm';

const Stack = createStackNavigator();

const RootNavigator = () => (
    <Stack.Navigator
        screenOptions={{
            headerShown: false,
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        }}
    >
        <Stack.Screen name="SplashScreen" component={SplashScreen} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="App" component={AppNavigator} />
        <Stack.Screen name="DetailKehadiran" component={DetailKehadiran} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        <Stack.Screen name="BoardingScreen" component={BoardingScreen} />
        <Stack.Screen name="Step1" component={Step1} />
        <Stack.Screen name="Step2" component={Step2} />
        <Stack.Screen name="DetailProjek" component={DetailProjek} />
        <Stack.Screen name="ProjectList" component={ProjectList} />
        <Stack.Screen name="TaskOnReview" component={TaskOnReview} />
        <Stack.Screen name="ProjectOnWorking" component={ProjectOnWorking} />
        <Stack.Screen name="SubmitTugas" component={SubmitTugas} />
        <Stack.Screen name="DetailTaskSection" component={DetailTaskSection} />
        <Stack.Screen name="AddProjectForm" component={AddProjectForm} />
    </Stack.Navigator>
);

export default RootNavigator;
