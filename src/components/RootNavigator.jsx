import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { CardStyleInterpolators } from '@react-navigation/stack';
import AppNavigator from '../components/AppNavigator';
import SplashScreen from '../screens/SplashScreen';
import Login from '../screens/Login';
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
import ProjectForm from '../screens/ProjectForm';
import ChatInterface from '../screens/ChatInterface';
import TaskForm from '../screens/TaskForm';
import AdhocDashboard from '../screens/AdhocDashboard';
import SubmitForm from '../components/SubmitForm';

const Stack = createStackNavigator();

const defaultScreenOptions = {
    headerShown: false,
    gestureEnabled: true,
    gestureDirection: 'horizontal',
    cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
};

const screens = [
    { name: 'SplashScreen', component: SplashScreen },
    { name: 'Login', component: Login },
    { name: 'App', component: AppNavigator },
    { name: 'DetailKehadiran', component: DetailKehadiran },
    { name: 'ForgotPassword', component: ForgotPassword },
    { name: 'BoardingScreen', component: BoardingScreen },
    { name: 'Step1', component: Step1 },
    { name: 'Step2', component: Step2 },
    { name: 'DetailProjek', component: DetailProjek },
    { name: 'ProjectList', component: ProjectList },
    { name: 'TaskOnReview', component: TaskOnReview },
    { name: 'ProjectOnWorking', component: ProjectOnWorking },
    { name: 'SubmitTugas', component: SubmitTugas },
    { name: 'DetailTaskSection', component: DetailTaskSection },
    { name: 'ProjectForm', component: ProjectForm },
    { name: 'TaskForm', component: TaskForm },
    { name: 'ChatInterface', component: ChatInterface },
    { name: 'AdhocDashboard', component: AdhocDashboard },
    { name: 'SubmitForm', component: SubmitForm },
];

const RootNavigator = () => (
    <Stack.Navigator screenOptions={defaultScreenOptions}>
        {screens.map(({ name, component }) => (
            <Stack.Screen
                key={name}
                name={name}
                component={component}
                options={{
                    gestureEnabled: false, // Disable swipe back gesture
                }}
            />
        ))}
    </Stack.Navigator>
);

export default RootNavigator;
