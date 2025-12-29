// src/app/dashboard/department/time_Slot/page.tsx
"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Button,
  Card,
  Group,
  Table,
  TextInput,
  Modal,
  Loader,
  Title,
  Container,
  ScrollArea,
  Alert,
  Box,
  Stack,
  Badge,
  Text,
  ActionIcon,
  Select,
  Avatar,
  ThemeIcon,
  Paper,
  Grid,
  Center,
  Tooltip,
  Switch,
} from "@mantine/core";
import {
  PencilSquareIcon,
  TrashIcon,
  PlusCircleIcon,
  ClockIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  DocumentDuplicateIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";
import { notifications } from "@mantine/notifications";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { Authentication, Found } from "@/app/auth/auth";

// Import slices
import { fetchDepartments, Department } from "@/store/slices/departmentsSlice";
import {
  fetchTimeSlots,
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot,
  createBulkTimeSlots,
  clearError,
  clearSuccessMessage,
  TimeSlot,
  TimeSlotFormData,
} from "@/store/slices/timeSlotSlice";

// Styled components
const StatCard = ({ icon: Icon, title, value, color, description }: any) => (
  <Card 
    withBorder 
    radius="lg" 
    className={`bg-gradient-to-br from-white to-${color}-50 border-${color}-100`}
    padding="lg"
  >
    <Group gap="md" align="flex-start">
      <ThemeIcon size="lg" radius="md" color={color} variant="light">
        <Icon className="h-5 w-5" />
      </ThemeIcon>
      <div style={{ flex: 1 }}>
        <Text size="sm" c="dimmed" fw={500}>{title}</Text>
        <Title order={3} className={`text-${color}-700`}>{value}</Title>
        {description && (
          <Text size="xs" c="dimmed" mt={4}>{description}</Text>
        )}
      </div>
    </Group>
  </Card>
);

// Time Slot Modal Component
interface TimeSlotModalProps {
  opened: boolean;
  onClose: () => void;
  timeSlot: TimeSlot | null;
  onSave: (id: number | null, data: TimeSlotFormData) => Promise<void>;
  departments: Department[];
}

const TimeSlotModal: React.FC<TimeSlotModalProps> = ({
  opened,
  onClose,
  timeSlot,
  onSave,
  departments,
}) => {
   const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState<TimeSlotFormData>({
    start_time: "08:00",
    end_time: "09:30",
    department_id: user?.department_id.toString(),
    slot_type: "lecture",
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

useEffect(() => {
    const checkAuth = async () => {
      try {
        const foundUser = await Found();
        setUser(foundUser);
      } catch (error) {
        console.error("Auth error:", error);
        setUser(null);
      } 
    };
    checkAuth();
  }, []);

  // Initialize form when modal opens
  useEffect(() => {
    if (timeSlot) {
      setFormData({
        start_time: timeSlot.formatted_start_time || timeSlot.start_time,
        end_time: timeSlot.formatted_end_time || timeSlot.end_time,
        department_id: user?.department_id.toString(),
        slot_type: timeSlot.slot_type,
        is_active: timeSlot.is_active,
      });
    } else {
      setFormData({
        start_time: "08:00",
        end_time: "09:30",
        department_id: user?.department_id.toString(),
        slot_type: "lecture",
        is_active: true,
      });
    }
  }, [timeSlot, opened, user?.department_id]);


  const slotTypes = [
    { value: "lecture", label: "Lecture" },
    { value: "lab", label: "Lab" },
    { value: "break", label: "Break" },
  ];

  const handleSubmit = async () => {
    if (!formData.start_time || !formData.end_time || 
        !formData.department_id || !formData.slot_type) {
      notifications.show({
        color: "red",
        title: "Error",
        message: "All fields are required",
      });
      return;
    }

    setLoading(true);
    try {
      if (timeSlot) {
        await onSave(timeSlot.id, formData);
      } else {
        await onSave(null, formData);
      }
      onClose();
    } catch (error: any) {
      notifications.show({
        color: "red",
        title: "Error",
        message: error.message || "Failed to save time slot",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = () => {
    if (!formData.start_time || !formData.end_time) return 0;
    
    const start = new Date(`1970-01-01T${formData.start_time}:00`);
    const end = new Date(`1970-01-01T${formData.end_time}:00`);
    const diff = (end.getTime() - start.getTime()) / (1000 * 60);
    return diff;
  };

  const duration = calculateDuration();

  return (
    <Modal 
      opened={opened} 
      onClose={onClose}
      title={
        <Group gap="sm">
          <ThemeIcon size="md" radius="lg" color="blue" variant="light">
            <ClockIcon className="h-5 w-5" />
          </ThemeIcon>
          <div>
            <Text fw={600} component="div">{timeSlot ? "Edit Time Slot" : "Create Time Slot"}</Text>
            <Text size="sm" c="dimmed" component="div">
              {timeSlot ? "Update time slot details" : "Define a new time period for scheduling"}
            </Text>
          </div>
        </Group>
      }
      centered
      size="md"
      radius="lg"
    >
      <Stack gap="lg">
        <Paper withBorder p="md" radius="md" className="bg-blue-50 border-blue-100">
          <Text size="sm" c="blue" fw={500} component="div">
            Time slots define when classes, labs, or breaks can be scheduled
          </Text>
        </Paper>

        {/* Department Selection */}
        
        <Grid>
          <Grid.Col span={6}>
            <TextInput
              label="Start Time"
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData({...formData, start_time: e.target.value})}
              required
              withAsterisk
              size="md"
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label="End Time"
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData({...formData, end_time: e.target.value})}
              required
              withAsterisk
              size="md"
            />
          </Grid.Col>
        </Grid>

        {/* Duration Display */}
        {duration > 0 && (
          <Paper withBorder p="md" radius="md" className="bg-green-50 border-green-100">
            <Group justify="space-between">
              <Text size="sm" fw={500} c="green">Duration</Text>
              <Badge color="green" variant="light">
                {duration} minutes ({Math.floor(duration / 60)}h {duration % 60}m)
              </Badge>
            </Group>
          </Paper>
        )}

        {/* Slot Type */}
        <Select
          label="Slot Type"
          placeholder="Select type"
          data={slotTypes}
          value={formData.slot_type}
          onChange={(value) => setFormData({...formData, slot_type: value as 'lecture' | 'lab' | 'break'})}
          required
          withAsterisk
          size="md"
        />

        {/* Active Status */}
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between">
            <div>
              <Text fw={500} size="sm">Active Status</Text>
              <Text size="xs" c="dimmed">Enable or disable this time slot</Text>
            </div>
            <Switch
              checked={formData.is_active}
              onChange={(e) => setFormData({...formData, is_active: e.currentTarget.checked})}
              color="blue"
              size="lg"
            />
          </Group>
        </Paper>

        {/* Summary */}
        {formData.department_id && (
          <Paper withBorder p="md" radius="md" className="bg-blue-50 border-blue-100">
            <Text size="sm" fw={500} c="blue" mb="xs" component="div">Time Slot Summary</Text>
            <Stack gap="xs">
              <Text size="sm" component="div">
                <strong>Department:</strong> {departments.find(d => d.department_id === formData.department_id)?.department_name}
              </Text>
              <Text size="sm" component="div">
                <strong>Time:</strong> {formData.start_time} - {formData.end_time}
              </Text>
              <Text size="sm" component="div">
                <strong>Type:</strong> {formData.slot_type.charAt(0).toUpperCase() + formData.slot_type.slice(1)}
              </Text>
              <Text size="sm" component="div">
                <strong>Status:</strong> {formData.is_active ? "Active" : "Inactive"}
              </Text>
            </Stack>
          </Paper>
        )}

        <Group justify="flex-end" gap="sm">
          <Button variant="light" color="gray" onClick={onClose} size="md">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            loading={loading}
            disabled={ !formData.start_time || !formData.end_time || 
                     !formData.department_id || !formData.slot_type}
            size="md"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            leftSection={<ClockIcon className="h-5 w-5" />}
          >
            {loading ? "Saving..." : timeSlot ? "Update Time Slot" : "Create Time Slot"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

// Bulk Time Slot Creator Component
interface BulkTimeSlotModalProps {
  opened: boolean;
  onClose: () => void;
  onSave: (department_id: number, time_slots: TimeSlotFormData[]) => Promise<void>;
  departments: Department[];
}

const BulkTimeSlotModal: React.FC<BulkTimeSlotModalProps> = ({
  opened,
  onClose,
  onSave,
  departments,
}) => {
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedDays, setSelectedDays] = useState<string[]>(["1", "2", "3", "4", "5"]);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:30");
  const [slotType, setSlotType] = useState("lecture");
  // const [gapMinutes, setGapMinutes] = useState(15);
  const [loading, setLoading] = useState(false);
  const [generatedSlots, setGeneratedSlots] = useState<TimeSlotFormData[]>([]);

 

  const slotTypes = [
    { value: "lecture", label: "Lecture" },
    { value: "lab", label: "Lab" },
    { value: "break", label: "Break" },
  ];

  const generateTimeSlots = () => {
    if (!selectedDepartment || selectedDays.length === 0) {
      notifications.show({
        color: "red",
        title: "Error",
        message: "Please select department and at least one day",
      });
      return;
    }

    const slots: TimeSlotFormData[] = [];
    
   

    setGeneratedSlots(slots);
  };

  const handleSubmit = async () => {
    if (generatedSlots.length === 0 || !selectedDepartment) {
      notifications.show({
        color: "red",
        title: "Error",
        message: "No time slots generated",
      });
      return;
    }

    setLoading(true);
    try {
      await onSave(parseInt(selectedDepartment), generatedSlots);
      onClose();
      // Reset form
      setSelectedDepartment("");
      setSelectedDays(["1", "2", "3", "4", "5"]);
      setStartTime("08:00");
      setEndTime("09:30");
      setSlotType("lecture");
      setGeneratedSlots([]);
    } catch (error: any) {
      notifications.show({
        color: "red",
        title: "Error",
        message: error.message || "Failed to create time slots",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      opened={opened} 
      onClose={onClose}
      title={
        <Group gap="sm">
          <ThemeIcon size="md" radius="lg" color="green" variant="light">
            <DocumentDuplicateIcon className="h-5 w-5" />
          </ThemeIcon>
          <div>
            <Text fw={600} component="div">Bulk Create Time Slots</Text>
            <Text size="sm" c="dimmed" component="div">
              Generate multiple time slots at once
            </Text>
          </div>
        </Group>
      }
      centered
      size="lg"
      radius="lg"
    >
      <Stack gap="lg">
        <Paper withBorder p="md" radius="md" className="bg-green-50 border-green-100">
          <Text size="sm" c="green" fw={500} component="div">
            Create multiple time slots with the same time period across different days
          </Text>
        </Paper>

        <Select
          label="Department"
          placeholder="Select department"
          data={departments.map(dept => ({
            value: dept.department_id.toString(),
            label: dept.department_name,
          }))}
          value={selectedDepartment}
          onChange={(value)=>setSelectedDepartment(value || "")}
          required
          withAsterisk
          searchable
          clearable
          size="md"
        />
        <Grid>
          <Grid.Col span={6}>
            <TextInput
              label="Start Time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              withAsterisk
              size="md"
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label="End Time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              withAsterisk
              size="md"
            />
          </Grid.Col>
        </Grid>
        <Select
          label="Slot Type"
          placeholder="Select type"
          data={slotTypes}
          value={slotType}
          onChange={(value)=>setSlotType(value|| "" )}
          required
          withAsterisk
          size="md"
        />

        <Button
          onClick={generateTimeSlots}
          variant="light"
          color="blue"
          size="md"
          leftSection={<ArrowPathIcon className="h-5 w-5" />}
        >
          Generate Time Slots Preview
        </Button>

        {/* Generated Slots Preview */}
        {generatedSlots.length > 0 && (
          <Paper withBorder p="md" radius="md" className="bg-blue-50 border-blue-100">
            <Group justify="space-between" mb="md">
              <Text fw={600} size="sm" c="blue" component="div">
                Generated Time Slots ({generatedSlots.length})
              </Text>
              <Badge color="blue" variant="light">Preview</Badge>
            </Group>
            <ScrollArea h={200}>
              <Stack gap="xs">
                {generatedSlots.map((slot, index) => (
                  <Paper key={index} withBorder p="xs" radius="md">
                    <Group gap="sm">
                      <Avatar size="sm" radius="md" color="blue" variant="light">
                        <ClockIcon className="h-3 w-3" />
                      </Avatar>
                      <div style={{ flex: 1 }}>
                        <Text size="xs" c="dimmed" component="div">
                          {slot.start_time} - {slot.end_time} • {slot.slot_type}
                        </Text>
                      </div>
                      <Badge size="xs" color="green" variant="light">
                        Active
                      </Badge>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </ScrollArea>
          </Paper>
        )}

        <Group justify="flex-end" gap="sm">
          <Button variant="light" color="gray" onClick={onClose} size="md">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            loading={loading}
            disabled={generatedSlots.length === 0}
            size="md"
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            leftSection={<DocumentDuplicateIcon className="h-5 w-5" />}
          >
            {loading ? "Creating..." : `Create ${generatedSlots.length} Time Slots`}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

const TimeSlotManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // Redux selectors
  const { timeSlots, loading, error, successMessage } = useAppSelector((state) => state.timeSlots || {
    timeSlots: [],
    loading: false,
    error: null,
    successMessage: null,
  });
  
  const { departments } = useAppSelector((state) => state.departments);
  
  // Local state
  const [modalState, setModalState] = useState<{
    opened: boolean;
    timeSlot: TimeSlot | null; 
  }>({
    opened: false,
    timeSlot: null
  });

  const [bulkModalOpened, setBulkModalOpened] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const foundUser = await Found();
        setUser(foundUser);
      } catch (error) {
        console.error("Auth error:", error);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    if (!authLoading && user) {
      dispatch(fetchTimeSlots());
      dispatch(fetchDepartments());
    }
  }, [dispatch, authLoading, user]);

  // Clear messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        dispatch(clearSuccessMessage());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, dispatch]);

  // Filter time slots
  const filteredTimeSlots = useMemo(() => {
    return timeSlots.filter(ts => {
      const matchesSearch = searchTerm ? 
        ts.department_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ts.day_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ts.slot_type?.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      
      const matchesDepartment = selectedDepartment ? 
        ts.department_id.toString() === selectedDepartment 
        : true;
      
     
      const matchesType = selectedType ? 
        ts.slot_type === selectedType 
        : true;
      
      return matchesSearch && matchesDepartment  && matchesType;
    });
  }, [timeSlots, searchTerm, selectedDepartment, selectedType]);

  // Calculate statistics
  const totalSlots = timeSlots.length;
  const activeSlots = timeSlots.filter(ts => ts.is_active).length;
  const lectureSlots = timeSlots.filter(ts => ts.slot_type === 'lecture').length;
  const labSlots = timeSlots.filter(ts => ts.slot_type === 'lab').length;

  // Handle save
  const handleSave = useCallback(async (id: number | null, data: TimeSlotFormData) => {
    try {
      if (id === null) {
        await dispatch(createTimeSlot(data)).unwrap();
      } else {
        await dispatch(updateTimeSlot({ id, data })).unwrap();
      }
      dispatch(fetchTimeSlots());
    } catch (err: any) {
      throw err;
    }
  }, [dispatch]);

  // Handle bulk save
  const handleBulkSave = useCallback(async (department_id: number, time_slots: TimeSlotFormData[]) => {
    try {
      await dispatch(createBulkTimeSlots({ department_id, time_slots })).unwrap();
      dispatch(fetchTimeSlots());
      
      notifications.show({
        color: "green",
        title: "Success",
        message: `Successfully created ${time_slots.length} time slots`,
      });
    } catch (err: any) {
      throw err;
    }
  }, [dispatch]);

  // Handle delete
  const handleDelete = useCallback(async (id: number) => {
    if (!confirm("Are you sure you want to delete this time slot?")) {
      return;
    }
    
    try {
      await dispatch(deleteTimeSlot(id)).unwrap();
      dispatch(fetchTimeSlots());
      notifications.show({
        color: "green",
        title: "Success",
        message: "Time slot deleted successfully",
      });
    } catch (err: any) {
      notifications.show({
        color: "red",
        title: "Error",
        message: err.message || "Failed to delete time slot",
      });
    }
  }, [dispatch]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedDepartment(null);
    setSelectedDay(null);
    setSelectedType(null);
  }, []);

  const hasFilters = useMemo(() => {
    return !!(searchTerm || selectedDepartment || selectedDay || selectedType);
  }, [searchTerm, selectedDepartment, selectedDay, selectedType]);

 
  const slotTypes = [
    { value: "lecture", label: "Lecture" },
    { value: "lab", label: "Lab" },
    { value: "break", label: "Break" },
  ];

  if (authLoading) {
    return (
      <Container size="xl" py="xl" className="min-h-screen">
        <Center h="100vh">
          <Loader size="xl" color="blue" />
        </Center>
      </Container>
    );
  }

  if (user === null) { 
    return <Authentication />;
  }

  return (
    <Container size="xl" py="xl" className="min-h-screen">
      <Stack gap="lg">
        {/* Header */}
        <Box className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8">
          <Stack gap="xs">
            <Group align="center" gap="sm">
              <ThemeIcon size="xl" radius="lg" variant="white" color="white">
                <ClockIcon className="h-6 w-6" />
              </ThemeIcon>
              <Title order={1} className="text-white">Time Slot Management</Title>
            </Group>
            <Text className="text-blue-100 max-w-2xl" component="div">
              Define and manage time periods for scheduling classes, labs, and breaks. 
              Configure availability across departments and days.
            </Text>
          </Stack>
        </Box>

        {/* Stats Dashboard */}
        <Grid gutter="lg">
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <StatCard 
              icon={ClockIcon}
              title="Total Time Slots"
              value={totalSlots}
              color="blue"
              description="Defined periods"
            />
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <StatCard 
              icon={CheckCircleIcon}
              title="Active Slots"
              value={activeSlots}
              color="green"
              description="Available for scheduling"
            />
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <StatCard 
              icon={CalendarDaysIcon}
              title="Lecture Slots"
              value={lectureSlots}
              color="orange"
              description="Class periods"
            />
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <StatCard 
              icon={AdjustmentsHorizontalIcon}
              title="Lab Slots"
              value={labSlots}
              color="purple"
              description="Practical sessions"
            />
          </Grid.Col>
        </Grid>

        {/* Search and Filters */}
        <Card withBorder radius="lg" shadow="sm">
          <Card.Section withBorder inheritPadding py="md">
            <Stack gap="md">
              <Group justify="space-between">
                <Group gap="xs">
                  <ThemeIcon size="sm" radius="lg" color="blue" variant="light">
                    <ClockIcon className="h-4 w-4" />
                  </ThemeIcon>
                  <Text fw={600} component="div">Time Slots</Text>
                  <Badge variant="light" color="blue">
                    {filteredTimeSlots.length} found
                  </Badge>
                </Group>
                
                <Group gap="xs">
                  <Button 
                    onClick={() => setBulkModalOpened(true)}
                    leftSection={<DocumentDuplicateIcon className="h-5 w-5" />}
                    variant="light"
                    color="green"
                    size="md"
                  >
                    Bulk Create
                  </Button>
                  <Button 
                    onClick={() => setModalState({ opened: true, timeSlot: null })}
                    leftSection={<PlusCircleIcon className="h-5 w-5" />}
                    loading={loading}
                    size="md"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    New Time Slot
                  </Button>
                </Group>
              </Group>

              <Group gap="md" align="flex-end">
                <TextInput
                  placeholder="Search departments, days, types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftSection={<MagnifyingGlassIcon className="h-4 w-4" />}
                  size="md"
                  radius="md"
                  style={{ flex: 1 }}
                />
                
                <Select
                  placeholder="Department"
                  data={departments.map(d => ({
                    value: d.department_id.toString(),
                    label: d.department_name
                  }))}
                  value={selectedDepartment}
                  onChange={setSelectedDepartment}
                  clearable
                  size="md"
                  style={{ width: 200 }}
                />
                
                
                <Select
                  placeholder="Type"
                  data={slotTypes}
                  value={selectedType}
                  onChange={setSelectedType}
                  clearable
                  size="md"
                  style={{ width: 150 }}
                />
                
                {hasFilters && (
                  <Button
                    variant="subtle"
                    color="red"
                    leftSection={<XCircleIcon className="h-4 w-4" />}
                    onClick={clearFilters}
                    size="md"
                  >
                    Clear Filters
                  </Button>
                )}
              </Group>
            </Stack>
          </Card.Section>

          {/* Error and Success Messages */}
          {(error || successMessage) && (
            <Card.Section inheritPadding py="md">
              <Stack gap="sm">
                {error && (
                  <Alert 
                    color="red" 
                    title="Error" 
                    withCloseButton 
                    onClose={() => dispatch(clearError())}
                    radius="md"
                    icon={<XCircleIcon className="h-5 w-5" />}
                  >
                    {error}
                  </Alert>
                )}
                
                {successMessage && (
                  <Alert 
                    color="green" 
                    title="Success" 
                    withCloseButton 
                    onClose={() => dispatch(clearSuccessMessage())}
                    radius="md"
                    icon={<CheckCircleIcon className="h-5 w-5" />}
                  >
                    {successMessage}
                  </Alert>
                )}
              </Stack>
            </Card.Section>
          )}

          {/* Time Slots Table */}
          <Card.Section inheritPadding py="md">
            {loading && timeSlots.length === 0 ? (
              <Center py="xl">
                <Stack align="center" gap="md">
                  <Loader size="lg" color="blue" />
                  <Text c="dimmed" component="div">Loading time slots...</Text>
                </Stack>
              </Center>
            ) : filteredTimeSlots.length === 0 ? (
              <Center py="xl">
                <Stack align="center" gap="md">
                  <ThemeIcon size="xl" radius="lg" color="gray" variant="light">
                    <ClockIcon className="h-8 w-8" />
                  </ThemeIcon>
                  <Text size="lg" fw={500} c="dimmed" component="div">
                    {hasFilters ? "No time slots match your filters" : "No time slots found"}
                  </Text>
                  <Text c="dimmed" ta="center" maw={500} component="div">
                    {hasFilters 
                      ? "Try adjusting your search or filters"
                      : "Get started by creating your first time slot"
                    }
                  </Text>
                  <Button 
                    onClick={() => setModalState({ opened: true, timeSlot: null })}
                    leftSection={<PlusCircleIcon className="h-4 w-4" />}
                    size="md"
                    className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    Create First Time Slot
                  </Button>
                </Stack>
              </Center>
            ) : (
              <ScrollArea>
                <Table.ScrollContainer minWidth={1000}>
                  <Table verticalSpacing="md" highlightOnHover>
                    <Table.Thead className="bg-gray-50">
                      <Table.Tr>
                        <Table.Th style={{ width: 60 }}>
                          <Text fw={600} component="div">#</Text>
                        </Table.Th>
                        <Table.Th>
                          <Group gap="xs">
                            <BuildingOfficeIcon className="h-4 w-4" />
                            <Text fw={600} component="span">Department</Text>
                          </Group>
                        </Table.Th>
                        <Table.Th>
                          <Group gap="xs">
                            <ClockIcon className="h-4 w-4" />
                            <Text fw={600} component="span">Time</Text>
                          </Group>
                        </Table.Th>
                        <Table.Th>
                          <Group gap="xs">
                            <AdjustmentsHorizontalIcon className="h-4 w-4" />
                            <Text fw={600} component="span">Type</Text>
                          </Group>
                        </Table.Th>
                        <Table.Th>
                          <Group gap="xs">
                            <CheckCircleIcon className="h-4 w-4" />
                            <Text fw={600} component="span">Status</Text>
                          </Group>
                        </Table.Th>
                        <Table.Th style={{ width: 100 }}>
                          <Text fw={600} component="div">Actions</Text>
                        </Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {filteredTimeSlots.map((ts, index) => (
                        <Table.Tr key={ts.id} className="hover:bg-blue-50/50 transition-colors">
                          <Table.Td>
                            <Text fw={500} className="text-gray-700" component="div">{index + 1}</Text>
                          </Table.Td>
                          
                          <Table.Td>
                            <Group gap="sm">
                              <Avatar 
                                size="md" 
                                radius="md" 
                                color="blue" 
                                variant="light"
                              >
                                {ts.department_name?.charAt(0) || 'D'}
                              </Avatar>
                              <div>
                                <Text fw={600} component="div">{ts.department_name}</Text>
                              </div>
                            </Group>
                          </Table.Td>
                          
                          
                          <Table.Td>
                            <Badge 
                              color="blue"
                              variant="light" 
                              size="lg"
                              leftSection={<ClockIcon className="h-3 w-3 mr-1" />}
                            >
                              {ts.formatted_start_time} - {ts.formatted_end_time}
                            </Badge>
                            <Text size="xs" c="dimmed" mt={4} component="div">
                              {ts.duration_minutes} minutes
                            </Text>
                          </Table.Td>
                          
                          <Table.Td>
                            <Badge 
                              color={ts.slot_type === 'lecture' ? 'green' : ts.slot_type === 'lab' ? 'purple' : 'yellow'}
                              variant="light" 
                              size="lg"
                            >
                              {ts.slot_type.charAt(0).toUpperCase() + ts.slot_type.slice(1)}
                            </Badge>
                          </Table.Td>
                          
                          <Table.Td>
                            {ts.is_active ? (
                              <Badge color="green" variant="light" size="lg">
                                Active
                              </Badge>
                            ) : (
                              <Badge color="red" variant="light" size="lg">
                                Inactive
                              </Badge>
                            )}
                          </Table.Td>
                          
                          <Table.Td>
                            <Group gap="xs">
                              <Tooltip label="Edit time slot">
                                <ActionIcon
                                  variant="light"
                                  color="blue"
                                  onClick={() => setModalState({ opened: true, timeSlot: ts })}
                                >
                                  <PencilSquareIcon className="h-4 w-4" />
                                </ActionIcon>
                              </Tooltip>
                              
                              <Tooltip label="Delete time slot">
                                <ActionIcon
                                  variant="light"
                                  color="red"
                                  onClick={() => handleDelete(ts.id)}
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </ActionIcon>
                              </Tooltip>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              </ScrollArea>
            )}
          </Card.Section>
        </Card>
      </Stack>

      {/* Time Slot Modal */}
      <TimeSlotModal
        opened={modalState.opened}
        onClose={() => setModalState({ opened: false, timeSlot: null })}
        timeSlot={modalState.timeSlot}
        onSave={handleSave}
        departments={departments}
      />

      {/* Bulk Time Slot Modal */}
      <BulkTimeSlotModal
        opened={bulkModalOpened}
        onClose={() => setBulkModalOpened(false)}
        onSave={handleBulkSave}
        departments={departments}
      />
    </Container>
  );
};

export default TimeSlotManagement;