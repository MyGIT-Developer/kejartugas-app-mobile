import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, Dimensions, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTask } from '../api/projectTask';
const { height, width: SCREEN_WIDTH } = Dimensions.get('window');
import { Feather } from '@expo/vector-icons';

const TaskItem = ({ task, onPress }) => (
  <View style={styles.taskItem} onPress={() => onPress(task)}>
    <Text style={styles.taskTitle}>{task.task_name}</Text>
    {/* <Text style={[styles.taskStatus, 
      { color: task.task_status === 'workingOnIt' ? '#FFA500' : '#FF0000' }]}>
      {task.task_status === 'workingOnIt' ? 'In Progress' : 'Rejected'}
    </Text> */}
    <TouchableOpacity>
        <Text>Detail</Text>
    </TouchableOpacity>
  </View>
);

const ProjectTasksGroup = ({ projectName, tasks, onTaskPress }) => (
  <View style={styles.projectGroup}>
    <Text style={styles.projectTitle}>{projectName}</Text>
    {tasks.map(task => (
      <TaskItem key={task.id} task={task} onPress={onTaskPress} />
    ))}
  </View>
);

const ProjectOnWorking = () => {
  const [taskData, setTaskData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  const fetchTasks = useCallback(async () => {
    try {
      const companyId = await AsyncStorage.getItem('companyId');
      if (companyId) {
        const response = await getTask(companyId);
        setTaskData(response);
      } else {
        throw new Error('Company ID not found');
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredAndGroupedTasks = useMemo(() => {
    const filteredTasks = taskData.filter(task => 
      task.task_status === 'workingOnIt' || task.task_status === 'rejected'
    );

    return filteredTasks.reduce((grouped, task) => {
      const key = task.project_name || task.project_id || 'Ungrouped';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(task);
      return grouped;
    }, {});
  }, [taskData]);

  const handleTaskPress = useCallback((task) => {
    // Navigate to task detail screen or show task detail modal
    console.log('Task pressed:', task);
    // Example: navigation.navigate('TaskDetail', { taskId: task.id });
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text>Error: {error}</Text>
      </View>
    );
  }

  const projectsWithTasks = Object.entries(filteredAndGroupedTasks);

  if (projectsWithTasks.length === 0) {
    return (
      <View style={styles.centered}>
        <Text>No projects with tasks in progress or rejected.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.backgroundBox}>
                <LinearGradient
                    colors={['#0E509E', '#5FA0DC', '#9FD2FF']}
                    style={styles.linearGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            </View>
            <View style={styles.headerSection}>
                <Feather name="chevron-left" style={styles.backIcon} onPress={() => navigation.goBack()} />
                <Text style={styles.header}>Detail Projek</Text>
            </View>
      <FlatList
        data={projectsWithTasks}
        style={styles.contentContainer}
        keyExtractor={([projectName]) => projectName}
        renderItem={({ item: [projectName, tasks] }) => (
          <ProjectTasksGroup
            projectName={projectName}
            tasks={tasks}
            onTaskPress={handleTaskPress}
          />
        )}
      />
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
    container: {
        minHeight: height, // Ensure the content is at least as tall as the screen
        flexGrow: 1,
    },
    backgroundBox: {
        height: 155,
        width: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
    },
    linearGradient: {
        flex: 1,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    contentContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
    },
    headerSection: {
        justifyContent: 'center',
        alignItems: 'center',
        width: SCREEN_WIDTH,
        marginTop: 20,
        gap: 20,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        alignSelf: 'center',
        fontFamily: 'Poppins-Bold',
        marginTop: 30,
        letterSpacing: -1,
    },
    backIcon: {
        position: 'absolute',
        top: 35,
        left: 20,
        color: 'white',
        fontSize: 24,
    },
    contentContainer: {
        display: 'flex',
        flexDirection: 'column',
        paddingHorizontal: 20,
        gap: 20,
    },
    safeArea: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    header: {
        height: 80,
        paddingTop: 10,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        fontFamily: 'Poppins-Bold',
        alignSelf: 'center',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButton: {
        position: 'absolute',
        left: 0,
        top: 5,
    },
    mainContainer: {
        height: '200vh',
        borderRadius: 20,
        margin: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
    },
    sectionContainer: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
    },
    subHeader: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    subHeaderTextLeft: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    subHeaderTextRight: {
        fontSize: 14,
        color: 'gray',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
      projectGroup: {
        marginBottom: 20,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
      projectTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
      },
      taskItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        borderRadius: 10,
      },
      taskTitle: {
        fontSize: 16,
        color: '#444',
        flex: 1,
      },
      taskStatus: {
        fontSize: 14,
        fontWeight: 'bold',
      },
});

export default ProjectOnWorking;
