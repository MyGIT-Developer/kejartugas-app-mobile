import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { CardStyleInterpolators } from '@react-navigation/stack';
import AppNavigator from '../components/AppNavigator';
import SplashScreen from '../screens/SplashScreen';
import Login from '../screens/Login';
import DetailKehadiran from '../screens/DetailKehadiran';
import LunchCamera from '../screens/LunchCamera';
import ForgotPassword from '../screens/ForgotPassword';
import BoardingScreen from '../screens/BoardingScreen';
import Step1 from '../screens/Step1';
import Step2 from '../screens/Step2';
import DetailProjek from '../screens/DetailProjek';
import ProjectList from '../screens/ProjectList';
import ProjectOnWorking from '../screens/ProjectOnWorking';
import SubmitTugas from '../screens/SubmitTugas';
import DetailTaskSection from '../screens/DetailTaskSection';
import ProjectForm from '../screens/ProjectForm';
import ChatInterface from '../screens/ChatInterface';
import TaskForm from '../screens/TaskForm';
import AdhocDashboard from '../screens/AdhocDashboard';
import AddAdhocTask from '../screens/AddAdhocTask';
import SubmitForm from '../components/SubmitForm';
import EditAdhoc from '../screens/EditAdhoc';
import PersonalInformation from '../screens/PersonalInformation';
import NotificationScreen from '../screens/NotificationScreen';
import Profile from '../screens/Profile';
import ProjectDashboard from '../screens/ProjectDashboard';
import WebViewScreen from '../screens/WebViewScreen';

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
    { name: 'LunchCamera', component: LunchCamera },
    { name: 'ForgotPassword', component: ForgotPassword },
    { name: 'BoardingScreen', component: BoardingScreen },
    { name: 'Step1', component: Step1 },
    { name: 'Step2', component: Step2 },
    { name: 'DetailProjek', component: DetailProjek },
    { name: 'ProjectList', component: ProjectList },
    { name: 'ProjectOnWorking', component: ProjectOnWorking },
    { name: 'SubmitTugas', component: SubmitTugas },
    { name: 'DetailTaskSection', component: DetailTaskSection },
    { name: 'ProjectForm', component: ProjectForm },
    { name: 'TaskForm', component: TaskForm },
    { name: 'ChatInterface', component: ChatInterface },
    { name: 'AdhocDashboard', component: AdhocDashboard },
    { name: 'SubmitForm', component: SubmitForm },
    { name: 'AddAdhocTask', component: AddAdhocTask },
    { name: 'EditAdhoc', component: EditAdhoc },
    { name: 'PersonalInformation', component: PersonalInformation },
    { name: 'NotificationScreen', component: NotificationScreen },
    { name: 'Profile', component: Profile },
    { name: 'ProjectDashboard', component: ProjectDashboard },
    { name: 'WebViewScreen', component: WebViewScreen },
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
