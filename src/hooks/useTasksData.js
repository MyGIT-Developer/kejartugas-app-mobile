import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchTotalTasksForEmployee } from '../api/task';

export const useTasksData = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [tasks, setTasks] = useState({
        inProgress: [],
        inReview: [],
        rejected: [],
        postponed: [],
        completed: [],
    });
    const [projects, setProjects] = useState([]);
    const [error, setError] = useState(null);

    const fetchTasks = useCallback(async () => {
        setRefreshing(true);
        setError(null);

        try {
            const employeeId = await AsyncStorage.getItem('employeeId');
            if (!employeeId) {
                throw new Error('ID Karyawan tidak ditemukan');
            }

            const data = await fetchTotalTasksForEmployee(employeeId);

            const sortedTasks = data.employeeTasks.sort((a, b) => {
                return new Date(b.start_date) - new Date(a.start_date);
            });

            const tasksByStatus = {
                inProgress: sortedTasks.filter((task) => task.task_status === 'workingOnIt'),
                inReview: sortedTasks.filter((task) => task.task_status === 'onReview'),
                rejected: sortedTasks.filter((task) => task.task_status === 'rejected'),
                postponed: sortedTasks.filter((task) => task.task_status === 'onHold'),
                completed: sortedTasks.filter((task) => task.task_status === 'Completed'),
            };

            setTasks(tasksByStatus);

            // Create projects map
            const projectsMap = new Map();
            sortedTasks.forEach((task) => {
                if (!projectsMap.has(task.project_id)) {
                    projectsMap.set(task.project_id, {
                        project_id: task.project_id,
                        project_name: task.project_name,
                        tasks: [],
                    });
                }
                projectsMap.get(task.project_id).tasks.push(task);
            });
            setProjects(Array.from(projectsMap.values()));

            // Store task IDs in AsyncStorage
            for (const status in tasksByStatus) {
                tasksByStatus[status].forEach(async (task) => {
                    if (task.id) {
                        await AsyncStorage.setItem(`task_${task.id}`, JSON.stringify(task.id));
                    }
                });
            }
        } catch (error) {
            setError('Gagal mengambil tugas. Silakan coba lagi nanti.');
            throw error;
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    return {
        tasks,
        projects,
        isLoading,
        refreshing,
        error,
        fetchTasks,
        setError,
    };
};
