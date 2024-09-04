import React from 'react';
import { View } from 'react-native';
import ColorList from '../components/ColorList';
import FloatingButton from '../components/FloatingButtonProject';

const Project = () => {
    return (
        <View style={{ flex: 1 }}>
            <ColorList color="#0891b2" />
            <FloatingButton />
        </View>
    );
};

export default Project;
