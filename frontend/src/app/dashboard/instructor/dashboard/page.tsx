/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import {
  IconBook,
  IconCalendar,
  IconBell,
  IconEdit,
  IconDownload,
  IconUserCircle,
  IconChevronRight,
  IconSparkles,
  IconClock,
  IconAlertCircle,
  IconCalendarEvent,
  IconCalendarTime,
  IconCalendarStats,
  IconFileDownload,
  IconUser,
  IconBook2,
  IconBellRinging,
} from "@tabler/icons-react";
import {
  Card,
  Text,
  Group,
  Stack,
  Grid,
  Badge,
  Button,
  Skeleton,
  Container,
  Title,
  Paper,
  Divider,
  Avatar,
  Progress,
  SimpleGrid,
  ThemeIcon,
  Box,
} from "@mantine/core";
import { useShallowEffect } from "@mantine/hooks";

// Redux Imports
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchTodaySchedule,
  fetchAnnouncements,
  selectTodaySchedules,
  selectAnnouncements,
  selectScheduleLoading,
} from "@/store/slices/dashboardSlice";
import { Authentication, Found } from "@/app/auth/auth";

interface Props {
  setActiveSection: (section: string) => void;
}

const DashboardSection: React.FC<Props> = ({ setActiveSection }) => {
  const dispatch = useAppDispatch();

  // Redux selectors with safe defaults
  const todaySchedules = useAppSelector(selectTodaySchedules);
  const announcements = useAppSelector(selectAnnouncements);
  const scheduleLoading = useAppSelector(selectScheduleLoading);

  // Fetch today's schedule and announcements on component mount
  useShallowEffect(() => {
    dispatch(fetchTodaySchedule());
    dispatch(fetchAnnouncements());
  }, [dispatch]);

  const [user, setUser] = useState<any>(null);
  useShallowEffect(() => {
    const checkAuth = async () => {
      const foundUser = await Found();
      setUser(foundUser);
    };
    checkAuth();
  }, []);

  if (user === null) {
    return <Authentication />;
  }

  const handleClick = (section: string) => {
    setActiveSection(section);
  };

  // Get today's day name
  const getTodayDayName = () => {
    const days = [
      { name: 'Sunday', color: 'indigo' },
      { name: 'Monday', color: 'blue' },
      { name: 'Tuesday', color: 'cyan' },
      { name: 'Wednesday', color: 'teal' },
      { name: 'Thursday', color: 'green' },
      { name: 'Friday', color: 'orange' },
      { name: 'Saturday', color: 'grape' }
    ];
    const today = new Date().getDay();
    return days[today];
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    try {
      return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return timeString;
    }
  };

  const cards = [
    {
      label: "My Courses",
      icon: IconBook,
      section: "myCourses",
      color: "blue",
      gradient: { from: 'blue', to: 'cyan' },
      description: "Manage your courses and materials",
      badge: todaySchedules?.length > 0 ? todaySchedules.length.toString() : undefined
    },
    {
      label: "Class Schedule",
      icon: IconCalendarEvent,
      section: "classSchedule",
      color: "indigo",
      gradient: { from: 'indigo', to: 'violet' },
      description: "View and manage timetable"
    },
    {
      label: "Class Availability",
      icon: IconEdit,
      section: "classAvailability",
      color: "teal",
      gradient: { from: 'teal', to: 'green' },
      description: "Set your availability"
    },
    {
      label: "Notifications",
      icon: IconBellRinging,
      section: "notifications",
      color: "orange",
      gradient: { from: 'orange', to: 'yellow' },
      description: "View updates and announcements",
      badge: announcements?.length > 0 ? announcements.length.toString() : undefined
    },
    {
      label: "Account Update",
      icon: IconUserCircle,
      section: "accountUpdate",
      color: "grape",
      gradient: { from: 'grape', to: 'pink' },
      description: "Update profile and settings"
    },
    {
      label: "Downloads",
      icon: IconDownload,
      section: "downloads",
      color: "red",
      gradient: { from: 'red', to: 'pink' },
      description: "Resources and files"
    },
  ];

  // Safe array checks
  const safeTodaySchedules = Array.isArray(todaySchedules) ? todaySchedules : [];
  const safeAnnouncements = Array.isArray(announcements) ? announcements : [];
  const todayInfo = getTodayDayName();
  const upcomingClasses = safeTodaySchedules.filter(s => {
    try {
      return new Date(`1970-01-01T${s.start_time}`) > new Date();
    } catch {
      return false;
    }
  }).length;

  return (
   <Container size="xl" p="md">
  <Stack gap="lg">
    {/* Header */}
    <Paper 
      withBorder 
      p="xl" 
      radius="lg"
      className="bg-gradient-to-r from-blue-600 to-indigo-600"
    >
      <Group justify="space-between" align="center">
        <Stack gap="xs">
          <Group gap="sm">
            <ThemeIcon size="lg" radius="xl" color="white" className="bg-white/20">
              <IconSparkles size={20} />
            </ThemeIcon>
            <Title order={2} className="text-white">
              Instructor Dashboard
            </Title>
          </Group>
          {/* FIXED: Added component="div" to Text */}
          <Text className="text-blue-100" component="div">
            Welcome back! Here&apos;s your teaching overview for{" "}
            <Badge color={todayInfo.color} variant="filled" className="ml-2">
              {todayInfo.name}
            </Badge>
          </Text>
        </Stack>
        <Badge 
          size="lg" 
          variant="filled" 
          color="white" 
          className="text-blue-600"
        >
          {new Date().toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric',
            year: 'numeric' 
          })}
        </Badge>
      </Group>
    </Paper>

    <Grid>
      {/* Main Content - Left Column */}
      <Grid.Col span={{ base: 12, lg: 8 }}>
        <Stack gap="md">
          {/* Quick Stats */}
          <SimpleGrid cols={{ base: 1, sm: 3 }}>
            <Card withBorder radius="md" padding="lg">
              <Group justify="space-between">
                <Stack gap={5}>
                  <Text size="sm" color="dimmed">
                    Today&apos;s Classes
                  </Text>
                  <Text size="xl" fw={700}>
                    {safeTodaySchedules.length}
                  </Text>
                </Stack>
                <ThemeIcon size="lg" color="blue" variant="light">
                  <IconCalendar size={20} />
                </ThemeIcon>
              </Group>
              <Progress 
                value={100} 
                color="blue" 
                mt="md" 
                size="sm" 
                className="rounded-full"
              />
            </Card>

            <Card withBorder radius="md" padding="lg">
              <Group justify="space-between">
                <Stack gap={5}>
                  <Text size="sm" color="dimmed">
                    Announcements
                  </Text>
                  <Text size="xl" fw={700}>
                    {safeAnnouncements.length}
                  </Text>
                </Stack>
                <ThemeIcon size="lg" color="orange" variant="light">
                  <IconBell size={20} />
                </ThemeIcon>
              </Group>
              <Progress 
                value={100} 
                color="orange" 
                mt="md" 
                size="sm" 
                className="rounded-full"
              />
            </Card>

            <Card withBorder radius="md" padding="lg">
              <Group justify="space-between">
                <Stack gap={5}>
                  <Text size="sm" color="dimmed">
                    Upcoming Today
                  </Text>
                  <Text size="xl" fw={700}>
                    {upcomingClasses}
                  </Text>
                </Stack>
                <ThemeIcon size="lg" color="teal" variant="light">
                  <IconClock size={20} />
                </ThemeIcon>
              </Group>
              <Progress 
                value={100} 
                color="teal" 
                mt="md" 
                size="sm" 
                className="rounded-full"
              />
            </Card>
          </SimpleGrid>

          {/* Dashboard Cards */}
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            {cards.map(({ label, icon: Icon, section, color, gradient, description, badge }) => (
              <Card 
                key={section}
                withBorder 
                radius="md" 
                padding="lg"
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleClick(section)}
              >
                <Stack gap="sm">
                  <Group justify="space-between" align="flex-start">
                    <ThemeIcon 
                      size="lg" 
                      radius="md"
                      variant="gradient"
                      gradient={gradient}
                    >
                      <Icon size={18} />
                    </ThemeIcon>
                    {badge && (
                      <Badge 
                        size="sm" 
                        color="red" 
                        variant="filled"
                        className="animate-pulse"
                      >
                        {badge}
                      </Badge>
                    )}
                  </Group>
                  
                  <div>
                    <Text fw={600} size="lg">
                      {label}
                    </Text>
                    <Text size="sm" color="dimmed" mt={4}>
                      {description}
                    </Text>
                  </div>
                  
                  <Group justify="space-between" align="center" mt="sm">
                    <Text 
                      size="sm" 
                      color={color} 
                      fw={500}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Go to section
                    </Text>
                    <IconChevronRight size={16} className="text-gray-400" />
                  </Group>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      </Grid.Col>

      {/* Sidebar - Right Column */}
      <Grid.Col span={{ base: 12, lg: 4 }}>
        <Stack gap="md">
          {/* Today's Schedule */}
          <Card withBorder radius="md" padding="md">
            <Stack gap="md">
              <Group justify="space-between">
                <Text fw={600} size="lg">
                  Today&apos;s Schedule
                </Text>
                <Badge color={todayInfo.color} variant="light">
                  {todayInfo.name}
                </Badge>
              </Group>
              
              <Divider />
              
              {scheduleLoading ? (
                <Stack gap="md">
                  {[1, 2, 3].map(i => (
                    <Group key={i}>
                      <Skeleton height={40} circle />
                      <Stack gap="xs" style={{ flex: 1 }}>
                        <Skeleton height={12} width="70%" radius="xl" />
                        <Skeleton height={8} width="40%" radius="xl" />
                      </Stack>
                    </Group>
                  ))}
                </Stack>
              ) : safeTodaySchedules.length > 0 ? (
                <Stack gap="xs">
                  {safeTodaySchedules.slice(0, 4).map((schedule, index) => (
                    <Paper 
                      key={index}
                      withBorder 
                      p="sm" 
                      radius="sm"
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <Group justify="space-between">
                        <Stack gap={2}>
                          <Text fw={500} size="sm">
                            {schedule.course_name}
                          </Text>
                          <Group gap="xs">
                            <IconClock size={12} className="text-gray-400" />
                            <Text size="xs" color="dimmed">
                              {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                            </Text>
                          </Group>
                        </Stack>
                        <Badge 
                          size="sm" 
                          variant="light" 
                          color={
                            new Date(`1970-01-01T${schedule.start_time}`) > new Date() 
                              ? "blue" 
                              : "gray"
                          }
                        >
                          {new Date(`1970-01-01T${schedule.start_time}`) > new Date() 
                            ? "Upcoming" 
                            : "Completed"}
                        </Badge>
                      </Group>
                    </Paper>
                  ))}
                  
                  {safeTodaySchedules.length > 4 && (
                    <Button 
                      variant="light" 
                      fullWidth
                      onClick={() => handleClick("classSchedule")}
                      rightSection={<IconChevronRight size={14} />}
                    >
                      View all {safeTodaySchedules.length} classes
                    </Button>
                  )}
                </Stack>
              ) : (
                <Stack align="center" gap="sm" py="xl">
                  <IconCalendar size={48} className="text-gray-300" />
                  <Text color="dimmed">No classes scheduled</Text>
                  <Text size="sm" color="dimmed">Enjoy your day!</Text>
                </Stack>
              )}
            </Stack>
          </Card>

          {/* Announcements */}
          {safeAnnouncements.length > 0 && (
            <Card 
              withBorder 
              radius="md" 
              padding="md"
              className="border-l-4 border-l-orange-500"
            >
              <Stack gap="md">
                <Group>
                  <ThemeIcon size="md" color="orange" variant="light">
                    <IconAlertCircle size={16} />
                  </ThemeIcon>
                  <Text fw={600} size="lg">
                    Latest Announcement
                  </Text>
                </Group>
                
                <Paper withBorder p="md" radius="sm">
                  <Stack gap="xs">
                    <Text fw={500} lineClamp={2}>
                      {safeAnnouncements[0].title}
                    </Text>
                    <Text size="sm" color="dimmed" lineClamp={3}>
                      {safeAnnouncements[0].content || "No content available"}
                    </Text>
                    <Button 
                      variant="light" 
                      color="orange"
                      fullWidth
                      onClick={() => handleClick("notifications")}
                      mt="sm"
                    >
                      View All Announcements
                    </Button>
                  </Stack>
                </Paper>
              </Stack>
            </Card>
          )}

          {/* Quick Actions */}
          <Card withBorder radius="md" padding="md">
            <Text fw={600} size="lg" mb="md">
              Quick Actions
            </Text>
            <Stack gap="xs">
              <Button 
                variant="light" 
                color="blue"
                leftSection={<IconFileDownload size={16} />}
                fullWidth
                onClick={() => handleClick("downloads")}
              >
                Download Resources
              </Button>
              <Button 
                variant="light" 
                color="green"
                leftSection={<IconCalendarStats size={16} />}
                fullWidth
                onClick={() => handleClick("classAvailability")}
              >
                Set Availability
              </Button>
              <Button 
                variant="light" 
                color="grape"
                leftSection={<IconUser size={16} />}
                fullWidth
                onClick={() => handleClick("accountUpdate")}
              >
                Update Profile
              </Button>
            </Stack>
          </Card>
        </Stack>
      </Grid.Col>
    </Grid>

    {/* Bottom Stats */}
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
      <Paper withBorder p="md" radius="md">
        <Group>
          <Avatar color="blue" radius="xl">
            <IconBook2 size={20} />
          </Avatar>
          <div>
            <Text size="sm" color="dimmed">Active Courses</Text>
            <Text fw={700} size="lg">12</Text>
          </div>
        </Group>
      </Paper>
      
      <Paper withBorder p="md" radius="md">
        <Group>
          <Avatar color="green" radius="xl">
            <IconCalendarTime size={20} />
          </Avatar>
          <div>
            <Text size="sm" color="dimmed">This Week</Text>
            <Text fw={700} size="lg">8 Classes</Text>
          </div>
        </Group>
      </Paper>
      
      <Paper withBorder p="md" radius="md">
        <Group>
          <Avatar color="orange" radius="xl">
            <IconBell size={20} />
          </Avatar>
          <div>
            <Text size="sm" color="dimmed">Pending</Text>
            <Text fw={700} size="lg">3 Items</Text>
          </div>
        </Group>
      </Paper>
      
      <Paper withBorder p="md" radius="md">
        <Group>
          <Avatar color="grape" radius="xl">
            <IconUserCircle size={20} />
          </Avatar>
          <div>
            <Text size="sm" color="dimmed">Last Login</Text>
            <Text fw={700} size="lg">Today</Text>
          </div>
        </Group>
      </Paper>
    </SimpleGrid>
  </Stack>
</Container>
  );
};

export default DashboardSection;