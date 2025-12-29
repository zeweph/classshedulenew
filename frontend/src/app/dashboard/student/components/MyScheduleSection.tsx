/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Container,
  Card,
  Title,
  Text,
  Group,
  Stack,
  Grid,
  Loader,
  Badge,
  Paper,
  ThemeIcon,
  Center,
  TextInput,
  ActionIcon,
  MultiSelect,
  Modal,
  ScrollArea,
  SimpleGrid,
  Collapse,
  SegmentedControl,
  Timeline,
  Button,
  Avatar,
  Alert
} from "@mantine/core";
import {
  IconCalendar,
  IconSchool,
  IconUsers,
  IconClock,
  IconSearch,
  IconBook,
  IconUser,
  IconFilter,
  IconRefresh,
  IconCalendarTime,
  IconLayoutGrid,
  IconLayoutList,
  IconDownload,
  IconEye,
  IconX,
  IconMapPin,
  IconBell,
  IconCheck,
  IconCurrentLocation,
  IconTrophy,
  IconInfoCircle} from "@tabler/icons-react";

// Redux Imports
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchSchedules
} from "@/store/slices/scheduleSlice";
import {
  selectSchedules as selectAllSchedules
} from "@/store/selectors/scheduleSelectors";
import { Authentication, Found } from "@/app/auth/auth";

const StudentScheduleView: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // Redux selectors
  const allSchedules = useAppSelector(selectAllSchedules);

  const [user, setUser] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'today' | 'grid' | 'list' | 'calendar'>('today');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [detailedViewModal, setDetailedViewModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dispatch(fetchSchedules());
  }, [dispatch]);

  useEffect(() => {
    const checkAuth = async () => {
      const foundUser = await Found();
      console.log("Found user:", foundUser);
      setUser(foundUser);
      setLoading(false);
    };
    checkAuth();
  }, []);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayOptions = days.map(day => ({ value: day, label: day }));

  // Get student's specific schedule based on their batch, semester, section, and department
  const studentSchedule = useMemo(() => {
    if (!user) return null;
    
    console.log("User data:", user);
    console.log("All schedules:", allSchedules);
    
    // Find schedule that matches student's department, batch, semester, and section
    const schedule = allSchedules.find(schedule => {
      const matchesDepartment = schedule.department_id === user?.department_id;
      const matchesBatch = schedule.batch === user.batch?.toString();
      const matchesSemester = schedule.semester === user?.semester?.toString();
      const matchesSection = schedule.section === user?.section?.toString();
      
      console.log("Checking schedule:", {
        scheduleDepartment: schedule.department_id,
        userDepartment: user?.department_id,
        scheduleBatch: schedule.batch,
        userBatch: user?.batch,
        scheduleSemester: schedule.semester,
        userSemester: user?.semester,
        scheduleSection: schedule.section,
        userSection: user?.section,
        matchesAll: matchesDepartment && matchesBatch && matchesSemester && matchesSection
      });
      
      return matchesDepartment && matchesBatch && matchesSemester && matchesSection;
    });
    
    console.log("Found schedule:", schedule);
    return schedule || null;
  }, [allSchedules, user]);

  // Get today's day
  const todayDayName = useMemo(() => {
    const today = new Date();
    return days[today.getDay() === 0 ? 6 : today.getDay() - 1] || days[0];
  }, []);

  // Get today's classes from student schedule
  const todaysClasses = useMemo(() => {
    if (!studentSchedule) return [];
    
    const todaySchedule = studentSchedule.days?.find((day: any) => 
      day.day_of_week === todayDayName
    );
    
    return todaySchedule?.courses || [];
  }, [studentSchedule, todayDayName]);

  // Get upcoming classes for today
  const upcomingClasses = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    return todaysClasses
      .filter((course: any) => {
        const courseStartHour = parseInt(course.startTime?.split(':')[0] || "0");
        const courseStartMinute = parseInt(course.startTime?.split(':')[1] || "0");
        
        // Check if class hasn't started yet or is currently ongoing
        return courseStartHour > currentHour || 
               (courseStartHour === currentHour && courseStartMinute > currentMinute);
      })
      .sort((a: any, b: any) => {
        const aTime = a.startTime || "00:00";
        const bTime = b.startTime || "00:00";
        return aTime.localeCompare(bTime);
      });
  }, [todaysClasses]);

  // Get current/ongoing class
  const currentClass = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    return todaysClasses.find((course: any) => {
      const startHour = parseInt(course.startTime?.split(':')[0] || "0");
      const startMinute = parseInt(course.startTime?.split(':')[1] || "0");
      const endHour = parseInt(course.endTime?.split(':')[0] || "0");
      const endMinute = parseInt(course.endTime?.split(':')[1] || "0");
      
      const currentTime = currentHour * 60 + currentMinute;
      const startTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;
      
      return currentTime >= startTime && currentTime <= endTime;
    });
  }, [todaysClasses]);

  // Filter courses for search within student's schedule
  const filteredCourses = useMemo(() => {
    if (!studentSchedule) return [];
    
    let allCourses: any[] = [];
    
    // Collect all courses from all days
    studentSchedule.days?.forEach((day: any) => {
      day.courses?.forEach((course: any) => {
        allCourses.push({
          ...course,
          day: day.day_of_week,
          // dayColor: getDayColor(day.day_of_week)
        });
      });
    });
    
    // Apply search filter
    if (searchQuery) {
      allCourses = allCourses.filter(course =>
        course.course_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.course_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.instructor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.room_number?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply day filter
    if (selectedDays.length > 0) {
      allCourses = allCourses.filter(course => 
        selectedDays.includes(course.day)
      );
    }
    
    return allCourses;
  }, [studentSchedule, searchQuery, selectedDays]);

  // Calculate statistics
  const studentStats = useMemo(() => {
    if (!studentSchedule) return null;
    
    const totalClasses = studentSchedule.days?.reduce((total: number, day: any) => 
      total + (day.courses?.length || 0), 0
    ) || 0;
    
    const uniqueInstructors = new Set();
    const uniqueRooms = new Set();
    const uniqueCourses = new Set();
    
    studentSchedule.days?.forEach((day: any) => {
      day.courses?.forEach((course: any) => {
        if (course.instructor_name) uniqueInstructors.add(course.instructor_name);
        if (course.room_number) uniqueRooms.add(course.room_number);
        if (course.course_name) uniqueCourses.add(course.course_name);
      });
    });
    
    return {
      totalClasses,
      totalDays: studentSchedule.days?.length || 0,
      uniqueInstructors: uniqueInstructors.size,
      uniqueRooms: uniqueRooms.size,
      uniqueCourses: uniqueCourses.size,
      upcomingClasses: upcomingClasses.length,
      currentClass: currentClass ? 1 : 0,
      todaysClasses: todaysClasses.length
    };
  }, [studentSchedule, upcomingClasses, currentClass, todaysClasses]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/20">
        <Container size="xl" className="py-8">
          <Center py={80}>
            <Stack align="center" gap="lg">
              <Loader size="xl" color="blue" />
              <Text fw={600} size="lg">Loading your schedule...</Text>
            </Stack>
          </Center>
        </Container>
      </div>
    );
  }

  if (user === null) {
    return <Authentication />;
  }

  if (!studentSchedule) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/20">
        <Container size="xl" className="py-8">
          <Center py={80}>
            <Stack align="center" gap="lg">
              <ThemeIcon size={120} color="gray" variant="light" radius="xl">
                <IconCalendar size={48} />
              </ThemeIcon>
              <Stack gap="xs" align="center">
                <Title order={3} c="gray.7">
                  Schedule Not Found
                </Title>
                <Alert 
                  icon={<IconInfoCircle size={16} />} 
                  title="Your Schedule Details" 
                  color="blue" 
                  variant="light"
                  className="max-w-md"
                >
                  <Stack gap="xs">
                    <Text size="sm">
                      We couldn&apos;t find a schedule matching your current academic details:
                    </Text>
                    <Group gap="xs">
                      <Badge color="blue">Department: {user.department_name}</Badge>
                      <Badge color="orange">Batch: {user.batch}</Badge>
                      <Badge color="violet">Semester: {user.semester}</Badge>
                      <Badge color="teal">Section: {user.section}</Badge>
                    </Group>
                    <Text size="sm" mt="xs">
                      This could mean:
                    </Text>
                    <ul className="text-sm text-gray-600 list-disc pl-4">
                      <li>Your schedule hasn't been published yet</li>
                      <li>There's a mismatch in your academic information</li>
                      <li>The schedule is still being prepared</li>
                    </ul>
                    <Text size="sm" mt="xs">
                      Please contact your department administrator for assistance.
                    </Text>
                  </Stack>
                </Alert>
              </Stack>
            </Stack>
          </Center>
        </Container>
      </div>
    );
  }

  const getDayColor = (day: string) => {
    const colors: { [key: string]: string } = {
      Monday: "blue",
      Tuesday: "teal", 
      Wednesday: "violet",
      Thursday: "orange",
      Friday: "red",
      Saturday: "indigo",
    };
    return colors[day] || "gray";
  };

  const handleViewScheduleDetails = (schedule: any) => {
    setSelectedSchedule(schedule);
    setDetailedViewModal(true);
  };

  const handleRefresh = () => {
    dispatch(fetchSchedules());
  };

  const handleExportSchedule = () => {
    // Export logic here
    console.log("Exporting student schedule...");
  };

  const TodayView = () => (
    <Stack gap="lg">
      {/* Current Class Card */}
      {currentClass && (
        <Card
          shadow="md"
          padding="lg"
          radius="lg"
          className="border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-100/50"
        >
          <Group justify="space-between" mb="md">
            <Group gap="sm">
              <ThemeIcon color="green" size="lg" radius="xl">
                <IconCurrentLocation size={20} />
              </ThemeIcon>
              <Stack gap={0}>
                <Text fw={700} size="lg">Currently in Class</Text>
                <Text size="sm" c="dimmed">Happening now</Text>
              </Stack>
            </Group>
            <Badge color="green" size="lg" variant="filled">
              LIVE
            </Badge>
          </Group>
          
          <Paper p="md" className="bg-white/80" radius="md">
            <Grid>
              <Grid.Col span={8}>
                <Stack gap="xs">
                  <Text fw={700} size="xl">{currentClass.course_name}</Text>
                  <Text size="sm" c="dimmed">{currentClass.course_code}</Text>
                  <Group gap="xs">
                    <IconUser size={16} />
                    <Text>{currentClass.instructor_name}</Text>
                  </Group>
                </Stack>
              </Grid.Col>
              <Grid.Col span={4}>
                <Stack align="flex-end">
                  <Badge color="blue" size="lg" variant="light">
                    {currentClass.startTime} - {currentClass.endTime}
                  </Badge>
                  <Group gap="xs">
                    <IconMapPin size={16} />
                    <Text>{currentClass.block_code}-{currentClass.room_number}</Text>
                  </Group>
                </Stack>
              </Grid.Col>
            </Grid>
          </Paper>
        </Card>
      )}

      {/* Upcoming Classes */}
      {upcomingClasses.length > 0 && (
        <Card shadow="sm" padding="lg" radius="lg">
          <Group justify="space-between" mb="md">
            <Text fw={700} size="lg">Upcoming Classes Today</Text>
            <Badge color="blue" variant="light">
              {upcomingClasses.length} classes remaining
            </Badge>
          </Group>
          
          <Stack gap="md">
            {upcomingClasses.map((course: any, index: number) => (
              <Paper key={index} p="md" withBorder radius="md">
                <Grid align="center">
                  <Grid.Col span={1}>
                    <ThemeIcon color="blue" variant="light">
                      <IconClock size={18} />
                    </ThemeIcon>
                  </Grid.Col>
                  <Grid.Col span={5}>
                    <Stack gap={2}>
                      <Text fw={600}>{course.course_name}</Text>
                      <Text size="sm" c="dimmed">{course.course_code}</Text>
                    </Stack>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Text>{course.instructor_name}</Text>
                  </Grid.Col>
                  <Grid.Col span={2}>
                    <Badge color="blue">
                      {course.startTime} - {course.endTime}
                    </Badge>
                  </Grid.Col>
                  <Grid.Col span={1}>
                    <Text>{course.block_code}-{course.room_number}</Text>
                  </Grid.Col>
                </Grid>
              </Paper>
            ))}
          </Stack>
        </Card>
      )}

      {/* Today's Full Schedule Timeline */}
      <Card shadow="sm" padding="lg" radius="lg">
        <Group mb="md">
          <ThemeIcon color="blue" variant="light">
            <IconCalendarTime size={20} />
          </ThemeIcon>
          <Text fw={700} size="lg">Today's Schedule ({todayDayName})</Text>
        </Group>
        
        {todaysClasses.length > 0 ? (
          <Timeline active={todaysClasses.findIndex((c: any) => c === currentClass)} bulletSize={24}>
            {todaysClasses.map((course: any, index: number) => (
              <Timeline.Item 
                key={index} 
                bullet={
                  currentClass === course ? (
                    <IconCurrentLocation size={12} />
                  ) : (
                    <IconClock size={12} />
                  )
                }
                title={
                  <Group justify="space-between">
                    <Text fw={600}>{course.course_name}</Text>
                    <Badge color={currentClass === course ? "green" : "blue"} variant="light">
                      {course.startTime} - {course.endTime}
                    </Badge>
                  </Group>
                }
              >
                <Stack gap="xs">
                  <Text size="sm">{course.course_code}</Text>
                  <Group gap="lg">
                    <Group gap={4}>
                      <IconUser size={14} />
                      <Text size="sm">{course.instructor_name}</Text>
                    </Group>
                    <Group gap={4}>
                      <IconMapPin size={14} />
                      <Text size="sm">{course.block_code}-{course.room_number}</Text>
                    </Group>
                  </Group>
                </Stack>
              </Timeline.Item>
            ))}
          </Timeline>
        ) : (
          <Center py={40}>
            <Stack align="center" gap="sm">
              <IconTrophy size={48} color="var(--mantine-color-gray-4)" />
              <Text fw={600} c="dimmed">No classes scheduled for today!</Text>
              <Text size="sm" c="dimmed">Enjoy your free time</Text>
            </Stack>
          </Center>
        )}
      </Card>
    </Stack>
  );

  const GridView = () => (
    <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
      {studentSchedule.days?.map((day: any, index: number) => (
        <Card
          key={index}
          shadow="md"
          padding="lg"
          radius="lg"
          className="border-2 border-blue-200 hover:shadow-xl transition-all duration-300"
        >
          <Stack gap="md">
            <Group justify="space-between">
              <Badge
                size="lg"
                color={getDayColor(day.day_of_week)}
                variant="light"
                leftSection={<IconCalendar size={14} />}
              >
                {day.day_of_week}
              </Badge>
              <Badge color="blue" variant="light" size="sm">
                {day.courses?.length || 0} classes
              </Badge>
            </Group>

            <Stack gap="sm">
              {day.courses?.slice(0, 3).map((course: any, idx: number) => (
                <Paper key={idx} p="sm" withBorder radius="md">
                  <Stack gap="xs">
                    <Text fw={600} size="sm">{course.course_name}</Text>
                    <Group justify="space-between">
                      <Text size="xs" c="dimmed">{course.course_code}</Text>
                      <Badge size="xs" color="blue">
                        {course.startTime}
                      </Badge>
                    </Group>
                  </Stack>
                </Paper>
              ))}
              {day.courses?.length > 3 && (
                <Text size="xs" c="dimmed" className="text-center">
                  +{day.courses.length - 3} more classes
                </Text>
              )}
            </Stack>

            <ActionIcon
              variant="light"
              color="blue"
              onClick={() => handleViewScheduleDetails({
                ...studentSchedule,
                filteredDay: day
              })}
            >
              <IconEye size={16}  title="Detail view"/>
            </ActionIcon>
          </Stack>
        </Card>
      ))}
    </SimpleGrid>
  );

  const ListView = () => {
    // Group courses by day for list view
    const coursesByDay = studentSchedule.days?.map((day: any) => ({
      day: day.day_of_week,
      courses: day.courses,
      color: getDayColor(day.day_of_week)
    })) || [];

    return (
      <Stack gap="md">
        {coursesByDay.map((dayData, index) => (
          <Paper key={index} p="lg" radius="lg" withBorder>
            <Grid gutter="md" align="center">
              <Grid.Col span={2}>
                <Badge
                  color={dayData.color}
                  variant="light"
                  size="lg"
                  fullWidth
                >
                  {dayData.day}
                </Badge>
              </Grid.Col>
              
              <Grid.Col span={8}>
                <Stack gap="xs">
                  {dayData.courses?.map((course: any, idx: number) => (
                    <Group key={idx} justify="space-between" pb="xs" style={{borderBottom: idx < dayData.courses.length - 1 ? '1px solid var(--mantine-color-gray-2)' : 'none'}}>
                      <div>
                        <Text fw={600} size="sm">{course.course_name}</Text>
                        <Text size="xs" c="dimmed">{course.course_code}</Text>
                      </div>
                      <Group gap="lg">
                        <Text size="sm">{course.instructor_name}</Text>
                        <Badge size="xs">{course.startTime}-{course.endTime}</Badge>
                        <Text size="sm">{course.block_code}-{course.room_number}</Text>
                      </Group>
                    </Group>
                  ))}
                </Stack>
              </Grid.Col>
              
              <Grid.Col span={2}>
                <Badge color="blue" variant="light">
                  {dayData.courses?.length} classes
                </Badge>
              </Grid.Col>
            </Grid>
          </Paper>
        ))}
      </Stack>
    );
  };

  const CalendarView = () => {
    // Get all time slots from student's schedule
    const getStudentTimeSlots = () => {
      const timeSlots = new Set<string>();
      
      studentSchedule.days?.forEach((day: any) => {
        day.courses?.forEach((course: any) => {
          if (course.startTime && course.endTime) {
            timeSlots.add(`${course.startTime}-${course.endTime}`);
          }
        });
      });
      
      return Array.from(timeSlots)
        .sort()
        .map(slot => {
          const [startTime, endTime] = slot.split('-');
          return {
            slot,
            startTime,
            endTime,
            isMorning: startTime ? parseInt(startTime.split(':')[0]) < 12 : true
          };
        });
    };

    const studentTimeSlots = getStudentTimeSlots();

    const getScheduleForTimeSlot = (day: string, timeSlotStr: string) => {
      const [startTime, endTime] = timeSlotStr.split('-');
      
      const daySchedule = studentSchedule.days?.find((d: any) => d.day_of_week === day);
      if (!daySchedule) return [];
      
      return daySchedule.courses?.filter((course: any) => 
        course.startTime === startTime && course.endTime === endTime
      ) || [];
    };

    return (
      <Paper radius="lg" p="md" className="border border-gray-200/40">
        <ScrollArea>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-cyan-100/50">
                  <th className="border border-gray-200/60 px-6 py-4 text-left font-bold text-gray-700">
                    <Group gap="xs">
                      <IconClock size={18} />
                      <Text>Time</Text>
                    </Group>
                  </th>
                  {days.map(day => (
                    <th
                      key={day}
                      className={`border border-gray-200/60 px-4 py-4 text-center font-bold ${day === todayDayName ? 'bg-yellow-50' : ''}`}
                    >
                      <Stack gap={4} align="center">
                        <Text>{day}</Text>
                        {day === todayDayName && (
                          <Badge size="xs" color="yellow">
                            TODAY
                          </Badge>
                        )}
                      </Stack>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {studentTimeSlots.map((timeSlot, index) => (
                  <tr key={timeSlot.slot} className="border-b border-gray-200/50">
                    <td className="border border-gray-200/60 px-6 py-4 font-semibold">
                      <Stack gap="xs" align="center">
                        <Text fw={700} size="sm">{timeSlot.startTime}</Text>
                        <Text size="xs" c="dimmed">to</Text>
                        <Text fw={700} size="sm">{timeSlot.endTime}</Text>
                      </Stack>
                    </td>
                    {days.map(day => {
                      const courses = getScheduleForTimeSlot(day, timeSlot.slot);
                      
                      return (
                        <td key={day} className="border border-gray-200/60 px-3 py-3">
                          {courses.length > 0 ? (
                            courses.map((course: any, idx: number) => (
                              <Card
                                key={idx}
                                padding="xs"
                                radius="md"
                                className={`border-l-4 border-${getDayColor(day)}-500 mb-2 last:mb-0`}
                              >
                                <Stack gap={2}>
                                  <Text fw={600} size="xs">{course.course_name}</Text>
                                  <Text size="xs" c="dimmed">{course.course_code}</Text>
                                  <Text size="xs">{course.instructor_name}</Text>
                                  <Badge size="xs" color="gray">
                                    {course.block_code}-{course.room_number}
                                  </Badge>
                                </Stack>
                              </Card>
                            ))
                          ) : (
                            <Center h={60}>
                              <Text c="dimmed" size="xs">-</Text>
                            </Center>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollArea>
      </Paper>
    );
  };

  const SearchResultsView = () => (
    <Stack gap="md">
      <Card shadow="sm" padding="lg" radius="lg">
        <Group justify="space-between" mb="md">
          <Text fw={700} size="lg">Search Results</Text>
          <Badge color="blue" variant="light">
            {filteredCourses.length} courses found
          </Badge>
        </Group>
        
        {filteredCourses.length > 0 ? (
          <Stack gap="md">
            {filteredCourses.map((course: any, index: number) => (
              <Paper key={index} p="md" withBorder radius="md">
                <Grid>
                  <Grid.Col span={1}>
                    <Badge color={course.dayColor} variant="light">
                      {course.day.substring(0, 3)}
                    </Badge>
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Stack gap={2}>
                      <Text fw={600}>{course.course_name}</Text>
                      <Text size="sm" c="dimmed">{course.course_code}</Text>
                    </Stack>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Group gap="xs">
                      <IconUser size={14} />
                      <Text>{course.instructor_name}</Text>
                    </Group>
                  </Grid.Col>
                  <Grid.Col span={2}>
                    <Badge color="blue">
                      {course.startTime} - {course.endTime}
                    </Badge>
                  </Grid.Col>
                  <Grid.Col span={2}>
                    <Text>{course.block_code}-{course.room_number}</Text>
                  </Grid.Col>
                </Grid>
              </Paper>
            ))}
          </Stack>
        ) : (
          <Center py={40}>
            <Stack align="center" gap="sm">
              <IconSearch size={48} color="var(--mantine-color-gray-4)" />
              <Text fw={600} c="dimmed">No courses found</Text>
              <Text size="sm" c="dimmed">Try different search terms or clear filters</Text>
            </Stack>
          </Center>
        )}
      </Card>
    </Stack>
  );

  const viewOptions = [
    { label: 'Today', value: 'today' as const, icon: <IconBell size={16} /> },
    { label: 'Weekly Grid', value: 'grid' as const, icon: <IconLayoutGrid size={16} /> },
    { label: 'List View', value: 'list' as const, icon: <IconLayoutList size={16} /> },
    { label: 'Calendar', value: 'calendar' as const, icon: <IconCalendarTime size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/20">
      <Container size="xl" className="py-8">
        {/* Header Section */}
        <Stack gap="lg" mb="xl">
          <Group justify="space-between" align="flex-start">
            <Stack gap="xs">
              <Title order={1} className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                My Class Schedule
              </Title>
              <Text c="dimmed" size="lg">
                Welcome back, {user?.name || "Student"}!
              </Text>
              <Group gap="md" mt="sm">
                <Badge variant="light" color="blue" size="lg" leftSection={<IconSchool size={14} />}>
                  {user.department_name}
                </Badge>
                <Badge variant="light" color="orange" size="lg" leftSection={<IconBook size={14} />}>
                  Batch: {studentSchedule.batch}
                </Badge>
                <Badge variant="light" color="violet" size="lg" leftSection={<IconUsers size={14} />}>
                  Sem: {studentSchedule.semester} - Sec: {studentSchedule.section}
                </Badge>
              </Group>
            </Stack>
            
            <Card padding="md" radius="lg" className="bg-gradient-to-r from-blue-50 to-purple-50">
              <Group>
                <Avatar color="blue" radius="xl">
                  {user?.name?.charAt(0) || "S"}
                </Avatar>
                <Stack gap={2}>
                  <Text fw={600}>{user?.name || "Student"}</Text>
                  <Text size="sm" c="dimmed">ID: {user?.student_id || user?.id || "N/A"}</Text>
                </Stack>
              </Group>
            </Card>
          </Group>

          {/* Stats Cards */}
          {studentStats && (
            <SimpleGrid cols={{ base: 2, md: 3, lg: 7 }} spacing="lg">
              <Card radius="lg" className="bg-gradient-to-br from-blue-50 to-blue-100/50">
                <Stack align="center" gap="xs">
                  <Text fw={700} size="xl" className="text-blue-600">
                    {studentStats.totalClasses}
                  </Text>
                  <Text size="sm" c="dimmed">Total Classes</Text>
                </Stack>
              </Card>
              
              <Card radius="lg" className="bg-gradient-to-br from-green-50 to-green-100/50">
                <Stack align="center" gap="xs">
                  <Text fw={700} size="xl" className="text-green-600">
                    {studentStats.totalDays}
                  </Text>
                  <Text size="sm" c="dimmed">Days/Week</Text>
                </Stack>
              </Card>
              
              <Card radius="lg" className="bg-gradient-to-br from-purple-50 to-purple-100/50">
                <Stack align="center" gap="xs">
                  <Text fw={700} size="xl" className="text-purple-600">
                    {studentStats.uniqueCourses}
                  </Text>
                  <Text size="sm" c="dimmed">Courses</Text>
                </Stack>
              </Card>
              
              <Card radius="lg" className="bg-gradient-to-br from-orange-50 to-orange-100/50">
                <Stack align="center" gap="xs">
                  <Text fw={700} size="xl" className="text-orange-600">
                    {studentStats.uniqueInstructors}
                  </Text>
                  <Text size="sm" c="dimmed">Instructors</Text>
                </Stack>
              </Card>
              
              <Card radius="lg" className="bg-gradient-to-br from-cyan-50 to-cyan-100/50">
                <Stack align="center" gap="xs">
                  <Text fw={700} size="xl" className="text-cyan-600">
                    {studentStats.todaysClasses}
                  </Text>
                  <Text size="sm" c="dimmed">Today's Classes</Text>
                </Stack>
              </Card>
              
              <Card radius="lg" className="bg-gradient-to-br from-red-50 to-red-100/50">
                <Stack align="center" gap="xs">
                  <ThemeIcon color="red" variant="light" size={60}>
                    {currentClass ? <IconCurrentLocation size={24} /> : <IconCheck size={24} />}
                  </ThemeIcon>
                  <Text size="sm" c="dimmed">
                    {currentClass ? "In Class" : "No Current Class"}
                  </Text>
                </Stack>
              </Card>
              
              <Card radius="lg" className="bg-gradient-to-br from-teal-50 to-teal-100/50">
                <Stack align="center" gap="xs">
                  <Button 
                    variant="light" 
                    color="blue" 
                    leftSection={<IconDownload size={16} />}
                    onClick={handleExportSchedule}
                  >
                    Export
                  </Button>
                  <Text size="sm" c="dimmed">Download Schedule</Text>
                </Stack>
              </Card>
            </SimpleGrid>
          )}
        </Stack>

        {/* Main Content Card */}
        <Card
          shadow="xl"
          radius="xl"
          padding="xl"
          className="bg-white/90 backdrop-blur-lg border border-white/20"
        >
          <Stack gap="xl">
            {/* Search and View Controls */}
            <Paper p="lg" radius="lg" className="bg-gradient-to-r from-blue-50/50 to-purple-50/50">
              <Grid gutter="md">
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    placeholder="Search courses, instructors, or rooms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    leftSection={<IconSearch size={18} />}
                    rightSection={
                      searchQuery && (
                        <ActionIcon onClick={() => setSearchQuery("")}>
                          <IconX size={16} />
                        </ActionIcon>
                      )
                    }
                    radius="lg"
                    size="md"
                  />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <Button
                    variant={showFilters ? "filled" : "light"}
                    color="blue"
                    leftSection={<IconFilter size={18} />}
                    onClick={() => setShowFilters(!showFilters)}
                    fullWidth
                    radius="lg"
                    size="md"
                  >
                    Filter Days
                  </Button>
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <Button
                    variant="light"
                    color="blue"
                    leftSection={<IconRefresh size={18} />}
                    onClick={handleRefresh}
                    fullWidth
                    radius="lg"
                    size="md"
                  >
                    Refresh Schedule
                  </Button>
                </Grid.Col>
              </Grid>

              {/* Day Filters */}
              <Collapse in={showFilters}>
                <MultiSelect
                  label="Filter by Days"
                  placeholder="Select days to view"
                  data={dayOptions}
                  value={selectedDays}
                  onChange={setSelectedDays}
                  radius="lg"
                  size="md"
                  mt="md"
                  clearable
                />
              </Collapse>
            </Paper>

            {/* View Controls */}
            <Group justify="space-between">
              <Group>
                <Badge variant="light" color="blue" size="lg">
                  {studentStats?.totalClasses} total classes this week
                </Badge>
                <Badge variant="light" color={getDayColor(todayDayName)} size="lg">
                  Today: {todayDayName}
                </Badge>
                {(searchQuery || selectedDays.length > 0) && (
                  <Badge variant="light" color="orange" size="lg">
                    {filteredCourses.length} filtered courses
                  </Badge>
                )}
              </Group>
              
              <SegmentedControl
                value={viewMode}
                onChange={(value) => setViewMode(value as 'today' | 'grid' | 'list' | 'calendar')}
                data={viewOptions}
                radius="lg"
              />
            </Group>

            {/* Schedule Content */}
            {searchQuery || selectedDays.length > 0 ? (
              <SearchResultsView />
            ) : (
              <>
                {viewMode === 'today' && <TodayView />}
                {viewMode === 'grid' && <GridView />}
                {viewMode === 'list' && <ListView />}
                {viewMode === 'calendar' && <CalendarView />}
              </>
            )}
          </Stack>
        </Card>
      </Container>

      {/* Schedule Details Modal */}
      <Modal
        opened={detailedViewModal}
        onClose={() => setDetailedViewModal(false)}
        title="Class Schedule Details"
        size="lg"
        radius="lg"
        scrollAreaComponent={ScrollArea.Autosize}
      >
        {selectedSchedule && (
          <Stack gap="lg">
            {selectedSchedule.filteredDay ? (
              // Single day view
              <>
                <Paper p="md" className="bg-gradient-to-r from-blue-50 to-purple-50" radius="md">
                  <Group justify="space-between">
                    <Stack gap={4}>
                      <Title order={4}>{selectedSchedule.filteredDay.day_of_week} Schedule</Title>
                      <Badge color={getDayColor(selectedSchedule.filteredDay.day_of_week)}>
                        {selectedSchedule.filteredDay.courses.length} classes
                      </Badge>
                    </Stack>
                    <Badge color="blue">
                      {studentSchedule.batch} - Sem {studentSchedule.semester}
                    </Badge>
                  </Group>
                </Paper>
                
                <Stack gap="sm">
                  {selectedSchedule.filteredDay.courses.map((course: any, idx: number) => (
                    <Card key={idx} withBorder padding="md" radius="md">
                      <Grid>
                        <Grid.Col span={8}>
                          <Stack gap={4}>
                            <Text fw={600}>{course.course_name}</Text>
                            <Text size="sm" c="dimmed">{course.course_code}</Text>
                            <Group gap="xs">
                              <IconUser size={14} />
                              <Text size="sm">{course.instructor_name}</Text>
                            </Group>
                          </Stack>
                        </Grid.Col>
                        <Grid.Col span={4}>
                          <Stack align="flex-end" gap={4}>
                            <Badge color="blue">
                              {course.startTime} - {course.endTime}
                            </Badge>
                            <Group gap="xs">
                              <IconMapPin size={14} />
                              <Text size="sm">{course.block_code}-{course.room_number}</Text>
                            </Group>
                          </Stack>
                        </Grid.Col>
                      </Grid>
                    </Card>
                  ))}
                </Stack>
              </>
            ) : (
              // Full schedule view
              <>
                <Paper p="md" className="bg-gradient-to-r from-blue-50 to-purple-50" radius="md">
                  <Group justify="space-between">
                    <Stack gap={4}>
                      <Title order={4}>Complete Weekly Schedule</Title>
                      <Group>
                        <Badge color="blue">{studentSchedule.batch}</Badge>
                        <Badge color="orange">Semester {studentSchedule.semester}</Badge>
                        <Badge color="violet">Section {studentSchedule.section}</Badge>
                      </Group>
                    </Stack>
                    <Text size="sm" c="dimmed">
                      {studentStats?.totalClasses} classes, {studentStats?.totalDays} days
                    </Text>
                  </Group>
                </Paper>
                
                <Stack gap="md">
                  {studentSchedule.days?.map((day: any, index: number) => (
                    <Card key={index} withBorder radius="md">
                      <Group justify="space-between" mb="md">
                        <Badge size="lg" color={getDayColor(day.day_of_week)}>
                          {day.day_of_week}
                        </Badge>
                        <Badge color="gray">
                          {day.courses.length} classes
                        </Badge>
                      </Group>
                      
                      <Stack gap="sm">
                        {day.courses.map((course: any, idx: number) => (
                          <Paper key={idx} p="sm" withBorder className="border-l-4 border-blue-500">
                            <Grid>
                              <Grid.Col span={8}>
                                <Stack gap={4}>
                                  <Text fw={600} size="sm">{course.course_name}</Text>
                                  <Text size="xs" c="dimmed">{course.course_code}</Text>
                                </Stack>
                              </Grid.Col>
                              <Grid.Col span={4}>
                                <Stack align="flex-end" gap={4}>
                                  <Badge size="xs" color="blue">
                                    {course.startTime} - {course.endTime}
                                  </Badge>
                                  <Text size="xs">{course.instructor_name}</Text>
                                </Stack>
                              </Grid.Col>
                            </Grid>
                          </Paper>
                        ))}
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              </>
            )}
            
            <Group justify="flex-end">
              <Button variant="light" onClick={() => setDetailedViewModal(false)}>
                Close
              </Button>
              <Button leftSection={<IconDownload size={16} />} color="blue" onClick={handleExportSchedule}>
                Download Schedule
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </div>
  );
};

export default StudentScheduleView;