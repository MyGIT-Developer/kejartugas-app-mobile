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
    const [adhocTasks, setAdhocTasks] = useState({
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
        setIsLoading(true);
        try {
            const employeeId = await AsyncStorage.getItem('employeeId');
            if (!employeeId) {
                throw new Error('ID Karyawan tidak ditemukan');
            }

            const data = await fetchTotalTasksForEmployee(employeeId);

            // Process regular employee tasks
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

            // Process adhoc tasks (might not exist in some responses)
            const adhocTasksData = data.adhoc_tasks || [];
            const sortedAdhocTasks = adhocTasksData.sort((a, b) => {
                return new Date(b.start_date) - new Date(a.start_date);
            });

            const adhocTasksByStatus = {
                inProgress: sortedAdhocTasks.filter((task) => task.status === 'onPending'),
                inReview: sortedAdhocTasks.filter((task) => task.status === 'onReview'),
                rejected: sortedAdhocTasks.filter((task) => task.status === 'rejected'),
                postponed: sortedAdhocTasks.filter((task) => task.status === 'onHold'),
                completed: sortedAdhocTasks.filter((task) => task.status === 'Completed'),
            };

            setAdhocTasks(adhocTasksByStatus);

            // Create projects map from both regular and adhoc tasks
            const projectsMap = new Map();

            // Add regular tasks to projects
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

            // Add adhoc tasks to projects (they might not have project_id)
            sortedAdhocTasks.forEach((task) => {
                const projectId = task.project_id || `adhoc_${task.id}`;
                const projectName = task.project_name || 'Tugas Adhoc';

                if (!projectsMap.has(projectId)) {
                    projectsMap.set(projectId, {
                        project_id: projectId,
                        project_name: projectName,
                        tasks: [],
                    });
                }
                projectsMap.get(projectId).tasks.push({
                    ...task,
                    isAdhoc: true, // Mark as adhoc task
                });
            });

            setProjects(Array.from(projectsMap.values()));

            // Store task IDs in AsyncStorage for both regular and adhoc tasks
            for (const status in tasksByStatus) {
                tasksByStatus[status].forEach(async (task) => {
                    if (task.id) {
                        await AsyncStorage.setItem(`task_${task.id}`, JSON.stringify(task.id));
                    }
                });
            }

            for (const status in adhocTasksByStatus) {
                adhocTasksByStatus[status].forEach(async (task) => {
                    if (task.id) {
                        await AsyncStorage.setItem(`adhoc_task_${task.id}`, JSON.stringify(task.id));
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
        adhocTasks,
        projects,
        isLoading,
        refreshing,
        error,
        fetchTasks,
        setError,
    };
};
