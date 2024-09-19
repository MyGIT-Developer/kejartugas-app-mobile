// utils/useFonts.js
import * as Font from 'expo-font';

export const useFonts = () => {
    const [fontsLoaded] = Font.useFonts({
        'Poppins-Regular': require('../../assets/fonts/Poppins-Regular.ttf'),
        'Poppins-Bold': require('../../assets/fonts/Poppins-Bold.ttf'),
        'Poppins-Italic': require('../../assets/fonts/Poppins-Italic.ttf'),
        'Poppins-Medium': require('../../assets/fonts/Poppins-Medium.ttf'),
        'Poppins-Semi-Bold': require('../../assets/fonts/Poppins-SemiBold.ttf'),
        // Add more font weights or styles as needed
    });

    return fontsLoaded;
};
