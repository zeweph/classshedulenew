/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Container,
  Card,
  Title,
  Text,
  Select,
  Button,
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
  RingProgress,
  SimpleGrid,
  Pagination,
  Collapse,
  SegmentedControl,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  IconCalendar,
  IconSchool,
  IconUsers,
  IconClock,
  IconBuilding,
  IconSearch,
  IconBook,
  IconUser,
  IconFilter,
  IconRefresh,
  IconCalendarStats,
  IconCalendarTime,
  IconLayoutGrid,
  IconLayoutList,
  IconDownload,
  IconEye,
  IconX,
  IconChevronRight,
  IconCalendarPlus,
} from "@tabler/icons-react";

// Redux Imports
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  setBatchFilters,
  fetchDepartments,
  fetchBatches,
  fetchSemesters,
  fetchSchedules
} from "@/store/slices/scheduleSlice";
import {
  selectBatchFilters,
  selectBatchLoading,
  selectBatches,
  selectSemesters,
  selectSchedules as selectAllSchedules
} from "@/store/selectors/scheduleSelectors";
import { Authentication, Found } from "@/app/auth/auth";

const DepartmentScheduleView: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // Redux selectors
  const allSchedules = useAppSelector(selectAllSchedules);
  const filters = useAppSelector(selectBatchFilters);
  const loading = useAppSelector(selectBatchLoading);
  const batches = useAppSelector(selectBatches);
  const semesters = useAppSelector(selectSemesters);

  const [user, setUser] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'calendar'>('grid');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [detailedViewModal, setDetailedViewModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const form = useForm({
    initialValues: {
      department: filters.department,
      batch: filters.batch,
      semester: filters.semester,
      section: filters.section,
    },
  });

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const timeRanges = [
    { value: "all", label: "All Day" },
    { value: "morning", label: "Morning (8AM-12PM)" },
    { value: "afternoon", label: "Afternoon (1PM-5PM)" },
    { value: "evening", label: "Evening (5PM-8PM)" }
  ];

  const dayOptions = days.map(day => ({ value: day, label: day }));

  // Get user's department schedules
  const departmentSchedules = useMemo(() => {
    if (!user?.department_id) return allSchedules;
    return allSchedules.filter(schedule => 
      schedule.department_id === user.department_id
    );
  }, [allSchedules, user]);

  // Filtered schedules based on search and filters
  const filteredSchedules = useMemo(() => {
    return departmentSchedules.filter(schedule => {
      // Search filter
      const matchesSearch = searchQuery === "" || 
        schedule.batch?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        schedule.semester?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        schedule.section?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        schedule.course_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        schedule.instructor_name?.toLowerCase().includes(searchQuery.toLowerCase());

      // Day filter
      const matchesDay = selectedDays.length === 0 || 
        schedule.days?.some((day: any) => selectedDays.includes(day.day_of_week));

      // Batch filter
      const matchesBatch = !form.values.batch || schedule.batch === form.values.batch;

      // Semester filter
      const matchesSemester = !form.values.semester || schedule.semester === form.values.semester;

      // Section filter
      const matchesSection = !form.values.section || schedule.section === form.values.section;

      return matchesSearch && matchesDay && matchesBatch && matchesSemester && matchesSection;
    });
  }, [departmentSchedules, searchQuery, selectedDays, form.values]);

  // Paginated schedules for grid and list views
  const paginatedSchedules = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSchedules.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSchedules, currentPage]);

  const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage);

  // Calculate statistics
  const departmentStats = useMemo(() => {
    const totalSchedules = departmentSchedules.length;
    const publishedSchedules = departmentSchedules.filter(s => s.status === "published").length;
    const draftSchedules = departmentSchedules.filter(s => s.status === "draft").length;
    
    const uniqueBatches = [...new Set(departmentSchedules.map(s => s.batch))].length;
    const uniqueSemesters = [...new Set(departmentSchedules.map(s => s.semester))].length;
    const uniqueSections = [...new Set(departmentSchedules.map(s => s.section))].length;
    
    const today = new Date();
    const todaySchedules = departmentSchedules.filter(s => 
      s.days?.some((day: any) => {
        const todayDayName = days[today.getDay() - 1] || days[0];
        return day.day_of_week === todayDayName;
      })
    ).length;

    return {
      totalSchedules,
      publishedSchedules,
      draftSchedules,
      uniqueBatches,
      uniqueSemesters,
      uniqueSections,
      todaySchedules,
      completionRate: totalSchedules > 0 ? ((publishedSchedules / totalSchedules) * 100).toFixed(1) : "0.0"
    };
  }, [days, departmentSchedules]);


  useEffect(() => {
    dispatch(fetchDepartments());
    dispatch(fetchBatches());
    dispatch(fetchSemesters());
    dispatch(fetchSchedules());
  }, [dispatch]);

  useEffect(() => {
    const checkAuth = async () => {
      const foundUser = await Found();
      setUser(foundUser);
      // Set department filter to user's department
      if (foundUser?.department_id) {
        dispatch(setBatchFilters({ department: foundUser.department_id.toString() }));
        form.setFieldValue('department', foundUser.department_id.toString());
      }
    };
    checkAuth();
  }, []);

  // Update form when Redux filters change
  useEffect(() => {
    form.setValues({
      department: filters.department,
      batch: filters.batch,
      semester: filters.semester,
      section: filters.section,
    });
  }, [filters]);

  // Semester options from database
  const semesterOptions = Array.isArray(semesters) 
    ? semesters.map((semester: any) => ({
        value: semester.semester?.toString() || "",
        label: semester.semester?.toString() || "",
      }))
      .filter(option => option.value) 
    : [];

  if (user === null) {
    return <Authentication />;
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

  const batchOptions = Array.isArray(batches) 
    ? batches
        .map((batch: any) => ({
          value: batch.batch_year?.toString() || "",
          label: batch.batch_year?.toString() || "",
        }))
        .filter(option => option.value) 
    : [];

  const handleExportSchedule = () => {
    // Export logic here
    console.log("Exporting schedule...");
  };

  const handleRefresh = () => {
    dispatch(fetchSchedules());
  };

  const GridView = () => (
    <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
      {paginatedSchedules.map((schedule, index) => (
        <Card
          key={index}
          shadow="md"
          padding="lg"
          radius="lg"
          className={`border-2 ${
            schedule.status === "published" 
              ? "border-green-200 bg-gradient-to-br from-green-50/50 to-emerald-50/50" 
              : "border-yellow-200 bg-gradient-to-br from-yellow-50/50 to-amber-50/50"
          } hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer`}
          onClick={() => handleViewScheduleDetails(schedule)}
        >
          <Stack gap="md">
            {/* Header */}
            <Group justify="space-between">
              <Badge
                size="lg"
                color={schedule.status === "published" ? "green" : "yellow"}
                variant="light"
                leftSection={
                  schedule.status === "published" ? 
                    <IconCalendar size={14} /> : 
                    <IconCalendarPlus size={14} />
                }
              >
                {schedule.status}
              </Badge>
              <Badge color="blue" variant="light" size="sm">
                {schedule.days?.length || 0} days
              </Badge>
            </Group>

            {/* Schedule Info */}
            <Stack gap="xs">
              <Group>
                <ThemeIcon size="sm" color="blue" variant="light">
                  <IconUsers size={14} />
                </ThemeIcon>
                <Text fw={600} size="lg" className="text-blue-800">
                  {schedule.batch}
                </Text>
              </Group>
              
              <Group>
                <ThemeIcon size="sm" color="violet" variant="light">
                  <IconBook size={14} />
                </ThemeIcon>
                <Text size="sm">{schedule.semester} </Text>
              </Group>
              
              <Group>
                <ThemeIcon size="sm" color="orange" variant="light">
                  <IconSchool size={14} />
                </ThemeIcon>
                <Text size="sm">Section {schedule.section}</Text>
              </Group>
            </Stack>

            {/* Days Preview */}
            <Stack gap="sm">
              <Text size="sm" fw={500} c="dimmed">Classes:</Text>
              {schedule.days?.slice(0, 3).map((day: any, idx: number) => (
                <Group key={idx} justify="space-between">
                  <Badge color={getDayColor(day.day_of_week)} variant="light" size="sm">
                    {day.day_of_week}
                  </Badge>
                  <Badge color="gray" variant="light" size="xs">
                    {day.courses.length} courses
                  </Badge>
                </Group>
              ))}
              {schedule.days?.length > 3 && (
                <Text size="xs" c="dimmed" className="text-center">
                  +{schedule.days.length - 3} more days
                </Text>
              )}
            </Stack>

            {/* Footer */}
            <Group justify="space-between" mt="md">
              <Text size="xs" c="dimmed">
                {new Date(schedule.created_at).toLocaleDateString()}
              </Text>
              <ActionIcon
                variant="light"
                color="blue"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewScheduleDetails(schedule);
                }}
              >
                <IconEye size={16} />
              </ActionIcon>
            </Group>
          </Stack>
        </Card>
      ))}
    </SimpleGrid>
  );

  const ListView = () => (
    <Stack gap="md">
      {paginatedSchedules.map((schedule, index) => (
        <Paper
          key={index}
          p="lg"
          radius="lg"
          withBorder
          className="hover:shadow-md transition-all cursor-pointer"
          onClick={() => handleViewScheduleDetails(schedule)}
        >
          <Grid gutter="md" align="center">
            <Grid.Col span={{ base: 12, md: 2 }}>
              <Badge
                color={schedule.status === "published" ? "green" : "yellow"}
                variant="light"
                size="lg"
                fullWidth
              >
                {schedule.status}
              </Badge>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Stack gap={4}>
                <Text fw={600} size="lg">{schedule.batch}</Text>
                <Group gap="xs">
                  <Badge color="blue" variant="light" size="xs">
                    {schedule.semester}
                  </Badge>
                  <Badge color="orange" variant="light" size="xs">
                    Sec {schedule.section}
                  </Badge>
                </Group>
              </Stack>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Stack gap={4}>
                <Text size="sm" fw={500}>Class Schedule</Text>
                <Group gap="xs">
                  {schedule.days?.slice(0, 3).map((day: any, idx: number) => (
                    <Badge key={idx} color={getDayColor(day.day_of_week)} variant="light" size="xs">
                      {day.day_of_week.substring(0, 3)}
                    </Badge>
                  ))}
                  {schedule.days?.length > 3 && (
                    <Badge color="gray" variant="light" size="xs">
                      +{schedule.days.length - 3} more
                    </Badge>
                  )}
                </Group>
              </Stack>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, md: 2 }}>
              <Group justify="center">
                <Badge color="blue" variant="filled" size="md">
                  {schedule.days?.length || 0} days
                </Badge>
              </Group>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, md: 1 }}>
              <ActionIcon
                variant="light"
                color="blue"
                size="lg"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewScheduleDetails(schedule);
                }}
              >
                <IconChevronRight size={20} />
              </ActionIcon>
            </Grid.Col>
          </Grid>
        </Paper>
      ))}
    </Stack>
  );

const CalendarView = () => {
  // Get time slots from your data structure
  const getTimeSlots = () => {
    const uniqueSlots = [...new Set(
      filteredSchedules.flatMap(schedule => 
        schedule.days?.flatMap((day: any) => 
          day.courses?.map((course: any) => 
            `${course.startTime}-${course.endTime}`
          )
        )
      ).filter(Boolean)
    )].sort();
    
    return uniqueSlots.map(slot => {
      const [startTime, endTime] = slot.split('-');
      return {
        slot,
        startTime,
        endTime,
        isMorning: startTime ? parseInt(startTime.split(':')[0]) < 12 : true
      };
    });
  };

  const timeSlots = getTimeSlots();

  const getScheduleForTimeSlot = (day: string, timeSlotStr: string) => {
    const [startTime, endTime] = timeSlotStr.split('-');
    
    return filteredSchedules.filter(schedule => 
      schedule.days?.some((d: any) => 
        d.day_of_week === day && 
        d.courses?.some((c: any) => 
          c.startTime === startTime && 
          c.endTime === endTime
        )
      )
    );
  };

  return (
    <Paper
      radius="lg"
      p="md"
      className="border border-gray-200/40 shadow-lg"
    >
      <ScrollArea>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-cyan-100/50">
                <th className="border border-gray-200/60 px-6 py-4 text-left font-bold text-gray-700 sticky left-0 bg-cyan-50/80 backdrop-blur-sm">
                  <Group gap="xs">
                    <IconClock size={18} />
                    <Text>Time</Text>
                  </Group>
                </th>
                {days.map(day => (
                  <th
                    key={day}
                    className={`border border-gray-200/60 px-4 py-4 text-center font-bold text-gray-700 bg-${getDayColor(day)}-50/80 backdrop-blur-sm`}
                  >
                    <Stack gap={4} align="center">
                      <Text>{day}</Text>
                      <Badge
                        size="sm"
                        color={getDayColor(day)}
                        variant="light"
                      >
                        {filteredSchedules.filter(s => 
                          s.days?.some((d: any) => d.day_of_week === day)
                        ).length || 0} schedules
                      </Badge>
                    </Stack>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((timeSlot, index) => (
                <tr
                  key={timeSlot.slot}
                  className={`border-b border-gray-200/50 ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                  } hover:bg-cyan-50/30 transition-colors duration-200`}
                >
                  <td className="border border-gray-200/60 px-6 py-4 font-semibold bg-cyan-50/50 sticky left-0 backdrop-blur-sm">
                    <Stack gap="xs" align="center">
                      <Text fw={700} size="sm">
                        {timeSlot.startTime}
                      </Text>
                      <Text size="xs" c="dimmed">to</Text>
                      <Text fw={700} size="sm">
                        {timeSlot.endTime}
                      </Text>
                      <Badge
                        size="sm"
                        color={timeSlot.isMorning ? "blue" : "orange"}
                        variant="light"
                      >
                        {timeSlot.isMorning ? "Morning" : "Afternoon"}
                      </Badge>
                    </Stack>
                  </td>
                  {days.map(day => {
                    const schedulesForSlot = getScheduleForTimeSlot(day, timeSlot.slot);
                    
                    return (
                      <td key={day} className="border border-gray-200/60 px-3 py-3">
                        {schedulesForSlot.length > 0 ? (
                          <Stack gap="xs">
                            {schedulesForSlot.slice(0, 2).map((schedule, idx) => {
                              const daySchedule = schedule.days?.find((d: any) => d.day_of_week === day);
                              const course = daySchedule?.courses?.find((c: any) => 
                                c.startTime === timeSlot.startTime && 
                                c.endTime === timeSlot.endTime
                              );
                              
                              return (
                                <Card
                                  key={idx}
                                  padding="md"
                                  radius="md"
                                  className={`border-l-4 border-${getDayColor(day)}-500 bg-${getDayColor(day)}-50/30 hover:shadow-md transition-all duration-300 cursor-pointer`}
                                  onClick={() => handleViewScheduleDetails(schedule)}
                                >
                                  <Stack gap="xs">
                                    <Badge
                                      color={getDayColor(day)}
                                      variant="light"
                                      size="xs"
                                    >
                                      {schedule.batch}
                                    </Badge>
                                    <Text fw={700} size="sm" lineClamp={2}>
                                      {course?.course_name || "Class"}
                                    </Text>
                                    <Group gap="xs">
                                      <Text size="sm" c="dimmed">
                                        Section{schedule.section}
                                      </Text>
                                    </Group>
                                    <Group gap="xs">
                                      <Badge
                                        size="sm"
                                        variant="light"
                                        color="gray"
                                      >
                                        {course?.room_number || "Room"}
                                      </Badge>
                                    </Group>
                                  </Stack>
                                </Card>
                              );
                            })}
                            {schedulesForSlot.length > 2 && (
                              <Center>
                                <Badge color="gray" variant="light" size="xs">
                                  +{schedulesForSlot.length - 2} more
                                </Badge>
                              </Center>
                            )}
                          </Stack>
                        ) : (
                          <Center h={140}>
                            <Text c="dimmed" size="sm" fw={500}>
                              -
                            </Text>
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
  const viewOptions = [
  { label: 'Grid', value: 'grid' as const, icon: <IconLayoutGrid size={16} /> },
  { label: 'List', value: 'list' as const, icon: <IconLayoutList size={16} /> },
  { label: 'Calendar', value: 'calendar' as const, icon: <IconCalendarTime size={16} /> },
];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/20">
      <Container size="xl" className="py-8">
        {/* Header Section */}
        <Stack gap="lg" mb="xl">
          <Group justify="space-between">
            <Stack gap="xs">
              <Title order={1} className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {user?.department_name || "Department"} Schedule Dashboard
              </Title>
              <Text c="dimmed" size="lg">
                Manage and view all academic schedules for your department
              </Text>
            </Stack>
            <Group>
              <Button
                variant="light"
                color="green"
                leftSection={<IconDownload size={18} />}
                onClick={handleExportSchedule}
              >
                Export
              </Button>
              <Button
                variant="light"
                color="blue"
                leftSection={<IconRefresh size={18} />}
                onClick={handleRefresh}
                loading={loading}
              >
                Refresh
              </Button>
            </Group>
          </Group>

          {/* Stats Cards */}
          <SimpleGrid cols={{ base: 2, md: 3, lg: 6 }} spacing="lg">
            <Card radius="lg" className="bg-gradient-to-br from-blue-50 to-blue-100/50">
              <Stack align="center" gap="xs">
                <Text fw={700} size="xl" className="text-blue-600">
                  {departmentStats.totalSchedules}
                </Text>
                <Text size="sm" c="dimmed">Total Schedules</Text>
              </Stack>
            </Card>
            
            <Card radius="lg" className="bg-gradient-to-br from-green-50 to-green-100/50">
              <Stack align="center" gap="xs">
                <Text fw={700} size="xl" className="text-green-600">
                  {departmentStats.publishedSchedules}
                </Text>
                <Text size="sm" c="dimmed">Published</Text>
              </Stack>
            </Card>
            
            <Card radius="lg" className="bg-gradient-to-br from-yellow-50 to-yellow-100/50">
              <Stack align="center" gap="xs">
                <Text fw={700} size="xl" className="text-yellow-600">
                  {departmentStats.draftSchedules}
                </Text>
                <Text size="sm" c="dimmed">Draft</Text>
              </Stack>
            </Card>
            
            <Card radius="lg" className="bg-gradient-to-br from-purple-50 to-purple-100/50">
              <Stack align="center" gap="xs">
                <Text fw={700} size="xl" className="text-purple-600">
                  {departmentStats.uniqueBatches}
                </Text>
                <Text size="sm" c="dimmed">Batches</Text>
              </Stack>
            </Card>
            
            <Card radius="lg" className="bg-gradient-to-br from-orange-50 to-orange-100/50">
              <Stack align="center" gap="xs">
                <Text fw={700} size="xl" className="text-orange-600">
                  {departmentStats.uniqueSemesters}
                </Text>
                <Text size="sm" c="dimmed">Semesters</Text>
              </Stack>
            </Card>
            
            <Card radius="lg" className="bg-gradient-to-br from-teal-50 to-teal-100/50">
              <Stack align="center" gap="xs">
                <RingProgress
                  size={60}
                  thickness={6}
                  roundCaps
                  sections={[{ value: parseFloat(departmentStats.completionRate), color: 'teal' }]}
                  label={
                    <Text ta="center" fw={700} size="xs">
                      {departmentStats.completionRate}%
                    </Text>
                  }
                />
                <Text size="sm" c="dimmed">Completion</Text>
              </Stack>
            </Card>
          </SimpleGrid>
        </Stack>

        {/* Main Content Card */}
        <Card
          shadow="xl"
          radius="xl"
          padding="xl"
          className="bg-white/90 backdrop-blur-lg border border-white/20 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent pointer-events-none"></div>

          <Stack gap="xl">
            {/* Search and Filter Bar */}
            <Paper p="lg" radius="lg" className="bg-gradient-to-r from-blue-50/50 to-purple-50/50">
              <Grid gutter="md">
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput
                    placeholder="Search schedules..."
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
                  <Select
                    placeholder="Filter by batch"
                    data={[
                      { value: "", label: "All Batches" },
                      ...batchOptions,
                    ]}
                    value={form.values.batch}
                    onChange={(value) => {
                      form.setFieldValue('batch', value || "");
                      dispatch(setBatchFilters({ batch: value || "" }));
                    }}
                    radius="lg"
                    size="md"
                  />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <Select
                    placeholder="Filter by semester"
                    data={[
                      { value: "", label: "All Semesters" },
                      ...semesterOptions,
                    ]}
                    value={form.values.semester}
                    onChange={(value) => {
                      form.setFieldValue('semester', value || "");
                      dispatch(setBatchFilters({ semester: value || "" }));
                    }}
                    radius="lg"
                    size="md"
                  />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 2 }}>
                  <Button
                    variant={showFilters ? "filled" : "light"}
                    color="blue"
                    leftSection={<IconFilter size={18} />}
                    onClick={() => setShowFilters(!showFilters)}
                    fullWidth
                    radius="lg"
                    size="md"
                  >
                    Filters
                  </Button>
                </Grid.Col>
              </Grid>

              {/* Advanced Filters */}
              <Collapse in={showFilters}>
                <Grid gutter="md" mt="md">
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <MultiSelect
                      label="Filter by Days"
                      placeholder="Select days"
                      data={dayOptions}
                      value={selectedDays}
                      onChange={setSelectedDays}
                      radius="lg"
                      size="md"
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select
                      label="Time Range"
                      placeholder="Select time range"
                      data={timeRanges}
                      value={selectedTimeRange}
                      onChange={(value) => setSelectedTimeRange(value ?? "all")}
                      radius="lg"
                      size="md"
                    />
                  </Grid.Col>
                </Grid>
              </Collapse>
            </Paper>

            {/* View Controls */}
            <Group justify="space-between">
              <Group>
                <Badge variant="light" color="blue" size="lg">
                  {filteredSchedules.length} schedules found
                </Badge>
                <Badge variant="light" color="green" size="lg">
                  {departmentStats.todaySchedules} classes today
                </Badge>
              </Group>
              
              <Group>
               <SegmentedControl
                  value={viewMode}
                  onChange={(value) => setViewMode(value as 'grid' | 'list' | 'calendar')}
                  data={viewOptions}
                  radius="lg"
                />
              </Group>
            </Group>

            {/* Schedule Content */}
            {loading ? (
              <Center py={80}>
                <Stack align="center" gap="lg">
                  <Loader size="xl" color="blue" />
                  <Stack gap="xs" align="center">
                    <Text fw={600} size="lg">Loading schedules...</Text>
                    <Text c="dimmed">Fetching department timetable data</Text>
                  </Stack>
                </Stack>
              </Center>
            ) : filteredSchedules.length === 0 ? (
              <Center py={80}>
                <Stack align="center" gap="lg">
                  <ThemeIcon size={120} color="gray" variant="light" radius="xl">
                    <IconCalendar size={48} />
                  </ThemeIcon>
                  <Stack gap="xs" align="center">
                    <Title order={3} c="gray.7">
                      No Schedules Found
                    </Title>
                    <Text c="dimmed" ta="center" size="lg">
                      {searchQuery ? "Try adjusting your search terms" : "No schedules available for your department"}
                    </Text>
                    {searchQuery && (
                      <Button
                        variant="light"
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedDays([]);
                          setSelectedTimeRange("all");
                          form.setValues({
                            batch: "",
                            semester: "",
                            section: "",
                          });
                        }}
                      >
                        Clear All Filters
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Center>
            ) : (
              <>
                {viewMode === 'grid' && <GridView />}
                {viewMode === 'list' && <ListView />}
                {viewMode === 'calendar' && <CalendarView />}
                
                {/* Pagination for grid and list views only */}
                {viewMode !== 'calendar' && totalPages > 1 && (
                  <Center mt="xl">
                    <Pagination
                      value={currentPage}
                      onChange={setCurrentPage}
                      total={totalPages}
                      radius="lg"
                      withEdges
                      size="md"
                    />
                  </Center>
                )}
              </>
            )}
          </Stack>
        </Card>
      </Container>

      {/* Schedule Details Modal */}
      <Modal
        opened={detailedViewModal}
        onClose={() => setDetailedViewModal(false)}
        title={
          <Group gap="xs">
            <IconCalendarStats size={20} />
            <Text fw={600}>Schedule Details</Text>
          </Group>
        }
        size="xl"
        radius="lg"
        scrollAreaComponent={ScrollArea.Autosize}
      >
        {selectedSchedule && (
          <Stack gap="lg">
            {/* Header */}
            <Paper p="md" className="bg-gradient-to-r from-blue-50 to-purple-50" radius="md">
              <Group justify="space-between">
                <Stack gap={4}>
                  <Title order={3}>{selectedSchedule.batch}</Title>
                  <Group>
                    <Badge color="blue" variant="light">{selectedSchedule.semester} </Badge>
                    <Badge color="orange" variant="light">Section {selectedSchedule.section}</Badge>
                    <Badge color={selectedSchedule.status === "published" ? "green" : "yellow"} variant="light">
                      {selectedSchedule.status}
                    </Badge>
                  </Group>
                </Stack>
                <Text size="sm" c="dimmed">
                  Created: {new Date(selectedSchedule.created_at).toLocaleDateString()}
                </Text>
              </Group>
            </Paper>

            {/* Days Schedule */}
            <Stack gap="md">
              <Text fw={600} size="lg">Weekly Schedule</Text>
              {selectedSchedule.days?.map((day: any, index: number) => (
                <Card key={index} withBorder radius="md">
                  <Group justify="space-between" mb="md">
                    <Badge size="lg" color={getDayColor(day.day_of_week)} variant="light">
                      {day.day_of_week}
                    </Badge>
                    <Badge color="gray" variant="light">
                      {day.courses.length} courses
                    </Badge>
                  </Group>
                  
                  <Stack gap="sm">
                    {day.courses.map((course: any, idx: number) => (
                      <Paper key={idx} p="md" withBorder className="border-l-4 border-blue-500">
                        <Grid gutter="md">
                          <Grid.Col span={4}>
                            <Stack gap={4}>
                              <Text fw={600} size="sm">{course.course_name || "Course"}</Text>
                              <Text size="xs" c="dimmed">{course.course_code || ""}</Text>
                            </Stack>
                          </Grid.Col>
                          <Grid.Col span={3}>
                            <Group gap="xs">
                              <IconUser size={14} />
                              <Text size="sm">{course.instructor_name || "Instructor"}</Text>
                            </Group>
                          </Grid.Col>
                          <Grid.Col span={3}>
                            <Group gap="xs">
                              <IconBuilding size={14} />
                              <Text size="sm">{course.block_code +"-" +course.room_number || "Room"}</Text>
                            </Group>
                          </Grid.Col>
                          <Grid.Col span={2}>
                            <Badge color="blue" size="8" variant="light">
                              {course.startTime} - {course.endTime}
                            </Badge>
                          </Grid.Col>
                        </Grid>
                      </Paper>
                    ))}
                  </Stack>
                </Card>
              ))}
            </Stack>

            <Group justify="flex-end">
              <Button variant="light" onClick={() => setDetailedViewModal(false)}>
                Close
              </Button>
              <Button leftSection={<IconDownload size={16} />} color="blue">
                Download Schedule
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </div>
  );
};

export default DepartmentScheduleView;