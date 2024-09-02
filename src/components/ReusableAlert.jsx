import React from 'react';
import AwesomeAlert from 'react-native-awesome-alerts';
import { StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';

// Adjust these paths based on your project structure
import successAnimation from '../../assets/animations/success.json';
import errorAnimation from '../../assets/animations/error.json';

const ReusableAlert = ({ show, alertType, message, onConfirm }) => {
    const isSuccess = alertType === 'success';

    return (
        <AwesomeAlert
            show={show}
            showProgress={false}
            title={isSuccess ? 'Sukses' : 'Kesalahan'}
            message={message}
            closeOnTouchOutside={true}
            closeOnHardwareBackPress={false}
            showConfirmButton={true}
            confirmText="Confirm"
            confirmButtonColor={isSuccess ? '#148FFF' : '#FF3D00'}
            onConfirmPressed={onConfirm}
            titleStyle={[styles.title, { color: isSuccess ? '#148FFF' : '#FF3D00' }]}
            messageStyle={styles.message}
            contentContainerStyle={styles.container}
            overlayStyle={styles.overlay}
            customView={
                <View style={styles.animationContainer}>
                    <LottieView
                        source={isSuccess ? successAnimation : errorAnimation}
                        autoPlay
                        loop={false}
                        style={styles.animation}
                    />
                </View>
            }
        />
    );
};

const styles = StyleSheet.create({
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    message: {
        fontSize: 16,
        color: '#333',
    },
    container: {
        borderRadius: 10,
        backgroundColor: '#fff',
        elevation: 10,
        padding: 20,
        alignItems: 'center',
    },
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Slightly darker background to make alert stand out
    },
    animationContainer: {
        width: 100,
        height: 100,
        marginBottom: 10,
    },
    animation: {
        width: '100%',
        height: '100%',
    },
});

export default ReusableAlert;
