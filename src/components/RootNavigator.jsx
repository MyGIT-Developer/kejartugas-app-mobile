import React from 'react';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import AppNavigator from '../components/AppNavigator';
import Login from '../screens/Login';
import WaitingMail from '../screens/WaitingMail';
import SentEmail from '../screens/SentEmail';
import SplashScreen from '../screens/SplashScreen';
import DetailKehadiran from '../screens/DetailKehadiran';
import ForgotPassword from '../screens/ForgotPassword';
import BoardingScreen from '../screens/BoardingScreen';
import Step1 from '../screens/Step1'; // Add this import
import Step2 from '../screens/Step2'; // Add this import
import success from '../components/SuccessRegist'; // Add this import
import DetailProjek from '../screens/DetailProjek'; // Add this import
import ProjectList from '../screens/ProjectList'; // Add this import
import TaskOnReview from '../screens/TaskOnReview'; // Add this import
import ProjectOnWorking from '../screens/ProjectOnWorking'; // Add this import
import SubmitTugas from '../screens/SubmitTugas'; // Add this import
import DetailTaskSection from '../screens/DetailTaskSection'; // Add this import
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
        <Stack.Screen name="DetailProjek" component={DetailProjek} options={{
          gestureEnabled: false, // Disable swipe back gesture
        }}/>
        <Stack.Screen name="ProjectList" component={ProjectList} />
        <Stack.Screen name="TaskOnReview" component={TaskOnReview} />
        <Stack.Screen name="ProjectOnWorking" component={ProjectOnWorking} />
        <Stack.Screen name="SubmitTugas" component={SubmitTugas} />
        <Stack.Screen name="DetailTaskSection" component={DetailTaskSection} />
        <Stack.Screen name="AddProjectForm" component={AddProjectForm} />
    </Stack.Navigator>
);

export default RootNavigator;
