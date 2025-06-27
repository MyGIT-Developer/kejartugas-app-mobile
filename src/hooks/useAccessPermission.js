import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAccessPermission = (permissionKey) => {
    const [hasAccess, setHasAccess] = useState(null);

    useEffect(() => {
        const checkAccessPermission = async () => {
            try {
                const accessPermissions = await AsyncStorage.getItem('access_permissions');
                const permissions = JSON.parse(accessPermissions);
                setHasAccess(permissions?.[permissionKey] === true);
            } catch (error) {
                console.error('Error checking access permission:', error);
                setHasAccess(false);
            }
        };

        checkAccessPermission();
    }, [permissionKey]);

    return hasAccess;
};
