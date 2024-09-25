import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Dimensions, StyleSheet, ScrollView } from 'react-native';
import axios from 'axios';
import { LineChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
const LineChartExample = ({ width, taskData, selectedProjectId }) => {
  const [tasksData, setTasksData] = useState([]);
  const token = AsyncStorage.getItem("token");

  const fetchTasks = useCallback(async () => {
    if (!selectedProjectId) return; // Early return if selectedProjectId is not set
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/projects/${selectedProjectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setTasksData(response.data.data.tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  let data = selectedProjectId ? tasksData : taskData;

  const getStatusText = (status, completedDate, endDate) => {
    if (!completedDate || !endDate) return "-";
    const completed = new Date(completedDate);
    const end = new Date(endDate);

    switch (status) {
      case "earlyFinish":
        const daysLeft = Math.ceil((end - completed) / (1000 * 60 * 60 * 24));
        return `Early for ${daysLeft} days`;
      case "finish":
        return "On Time";
      case "finish in delay":
        const extraDays = Math.ceil((completed - end) / (1000 * 60 * 60 * 24));
        return `Delay for ${extraDays} days`;
      case "overdue":
        const overdueDays = Math.ceil((new Date() - end) / (1000 * 60 * 60 * 24));
        return `Late for ${overdueDays} days`;
      default:
        return "-";
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Prepare separate formatted data for baseline and actual calculations
  const formattedBaselineData = data
    .sort((a, b) => new Date(a.end_date) - new Date(b.end_date))
    .map((item, index) => {
      const cumulativeBaselineWeight = data
        .slice(0, index + 1)
        .reduce((acc, curr) => acc + Number(curr.baseline_weight), 0);

      return {
        ...item,
        task_name: item.task_name,
        assign_to: item.assigned_employees
          .map((employee) => employee.employee_name)
          .join(", "),
        start_date: new Date(item.start_date).toLocaleDateString("en-US"),
        end_date: new Date(item.end_date).toLocaleDateString("en-US"),
        task_submit_date: item.task_submit_date
          ? new Date(item.task_submit_date).toLocaleDateString("en-US")
          : null,
        cumulativeBaselineWeight: cumulativeBaselineWeight,
        status: item.task_submit_status,
      };
    });

  const formattedActualData = data
    .sort((a, b) => new Date(a.task_submit_date) - new Date(b.task_submit_date))
    .map((item, index) => {
      // Calculate cumulative actual weights
      const cumulativeActualWeight = data
        .slice(0, index + 1)
        .reduce((acc, curr) => acc + Number(curr.actual_weight), 0);

      return {
        ...item,
        task_name: item.task_name,
        assign_to: item.assigned_employees
          .map((employee) => employee.employee_name)
          .join(", "),
        start_date: new Date(item.start_date).toLocaleDateString("en-US"),
        end_date: new Date(item.end_date).toLocaleDateString("en-US"),
        task_submit_date: item.task_submit_date
          ? new Date(item.task_submit_date).toLocaleDateString("en-US")
          : null,
        cumulativeActualWeight: cumulativeActualWeight,
        status: item.task_submit_status,
      };
    });

  // Prepare data points for baseline line
  const targetDataPoints = formattedBaselineData
    .sort((a, b) => new Date(a.end_date) - new Date(b.end_date))
    .map((item) => ({
      x: new Date(item.end_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
      y: item.cumulativeBaselineWeight,
    }));

  // Prepare data points for actual line
  const actualDataPoints = formattedActualData
    .filter(
      (item) =>
        item.task_submit_date !== null &&
        new Date(item.task_submit_date).toString() !==
          new Date("Thu Jan 01 1970 07:00:00 GMT+0700 (Western Indonesia Time)").toString()
    )
    .sort((a, b) => new Date(a.task_submit_date) - new Date(b.task_submit_date))
    .map((item) => {
      let markerColor = ""; // Default color

      const endDate = new Date(item.end_date);
      const completedDate = new Date(item.task_submit_date);
      const formattedEndDate = formatDate(endDate);
      const formattedCompletedDate = formatDate(completedDate);

      if (endDate.getTime() === completedDate.getTime()) {
        markerColor = "#2baa17"; // Color for on time
      } else if (endDate.getTime() > completedDate.getTime()) {
        markerColor = "#4fdf10"; // Color for early finish
      } else if (endDate.getTime() < completedDate.getTime()) {
        markerColor = "#FF5733"; // Color for late finish
      }

      return {
        x: new Date(item.task_submit_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        y: item.cumulativeActualWeight,
        color: markerColor,
      };
    });

  // Prepare the chart data
  const chartData = {
    labels: targetDataPoints.map(point => point.x),
    datasets: [
      {
        data: targetDataPoints.map(point => point.y),
        color: (opacity = 1) => `rgba(35, 143, 186, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: actualDataPoints.map(point => point.y),
        color: (opacity = 1) => `rgba(43, 186, 23, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal contentContainerStyle={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={width || Dimensions.get("window").width} // from react-native
          height={300}
          yAxisLabel="$"
          yAxisSuffix="%"
          yAxisInterval={1} // optional
          chartConfig={{
            backgroundColor: "#fff",
            backgroundGradientFrom: "#fff",
            backgroundGradientTo: "#fff",
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(0, 0,0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16
            },
            propsForDots: {
              r: "6",
              strokeWidth: "2",
              stroke: "#ffa726"
            }
          }}
          bezier
          style={styles.chart}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  chartContainer: {
    width: '100%',
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16
  }
});

export default LineChartExample;
