// src/app/course-batch-management/page.tsx
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

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
  Menu,
  Select,
  Avatar,
  ThemeIcon,
  Paper,
  Grid,
  Center,
  MultiSelect,
  Tabs,
  Tooltip,
  NumberInput,
  Divider,
  Checkbox,
} from "@mantine/core";
import {
  PencilSquareIcon,
  TrashIcon,
  PlusCircleIcon,
  AcademicCapIcon,
  CalendarIcon,
  BookOpenIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ClockIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  UsersIcon,
  DocumentDuplicateIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { notifications } from "@mantine/notifications";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { Authentication, Found } from "@/app/auth/auth";


// Import slices
import { fetchDepartments, Department } from "@/store/slices/departmentsSlice";
import { fetchSemesters, Semester } from "@/store/slices/semesterSlice";
import { fetchBatches, Batch } from "@/store/slices/batchSlice";
import { fetchCourses, Course } from "@/store/slices/coursesSlice";
import { 
  fetchCourseBatches, 
  createCourseBatch, 
  updateCourseBatch, 
  deleteCourseBatch,
  clearError,
  clearSuccessMessage,
  CourseBatch,
  CourseBatchFormData
} from "@/store/slices/courseBatchSlice";



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

// Course Batch Modal Component - UPDATED FOR MULTIPLE COURSES
interface CourseBatchModalProps {
  opened: boolean;
  onClose: () => void;
  courseBatch: CourseBatch | null;
  onSave: (id: number | null, data: CourseBatchFormData) => Promise<void>;
  onSaveMultiple: (assignments: CourseBatchFormData[]) => Promise<void>;
  courses: Course[];
  departments: Department[];
  batches: Batch[];
  semesters: Semester[];
}

const CourseBatchModal: React.FC<CourseBatchModalProps> = ({
  opened,
  onClose,
  courseBatch,
  onSave,
  onSaveMultiple,
  courses,
  departments,
  batches,
  semesters,
}) => {
  const [formData, setFormData] = useState<CourseBatchFormData>({
    course_id: 0,
    batch: 0,
    semester_id: '',
    department_id: 0,
  });
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [assignmentMode, setAssignmentMode] = useState<'single' | 'multiple'>('multiple');

  // Initialize form when modal opens or courseBatch changes
  useEffect(() => {
    if (courseBatch) {
      setFormData({
        course_id: courseBatch.course_id,
        batch: courseBatch.batch,
        semester_id: courseBatch.semester_id,
        department_id: courseBatch.department_id,
      });
      setSelectedCourseIds([courseBatch.course_id.toString()]);
      setAssignmentMode('single');
    } else {
      setFormData({
        course_id: 0,
        batch: 0,
        semester_id: '',
        department_id: 0,
      });
      setSelectedCourseIds([]);
      setAssignmentMode('multiple');
    }
  }, [courseBatch, opened]);

  // Filter courses by selected department
  const departmentCourses = useMemo(() => {
    if (!formData.department_id) return courses;
      return courses;
          //filter(course => course.department_id === formData.department_id);
  }, [courses, formData.department_id]);

  // Filter batches by selected department
  const departmentBatches = useMemo(() => {
    if (!formData.department_id) return batches;
    return batches.filter(batch => true); // Modify based on your batch-department relationship
  }, [batches, formData.department_id]);

  // Filter semesters by selected department
  const departmentSemesters = useMemo(() => {
    if (!formData.department_id) return semesters;
      return semesters;
      //.filter(semester => semester.department_id === formData.department_id);
  }, [semesters, formData.department_id]);

  const handleSubmit = async () => {
    if (assignmentMode === 'single') {
      // Single course assignment (edit mode)
      if (!formData.course_id || !formData.batch || !formData.semester_id || !formData.department_id) {
        notifications.show({
          color: "red",
          title: "Error",
          message: "All fields are required",
        });
        return;
      }
    } else {
      // Multiple courses assignment
      if (selectedCourseIds.length === 0 || !formData.batch || !formData.semester_id || !formData.department_id) {
        notifications.show({
          color: "red",
          title: "Error",
          message: "Please select at least one course and fill all required fields",
        });
        return;
      }
    }

    setLoading(true);
    try {
      if (assignmentMode === 'single' && courseBatch) {
        // Update single assignment
        await onSave(courseBatch.id, formData);
      } else if (assignmentMode === 'multiple') {
        // Create multiple assignments
        const assignments = selectedCourseIds.map(courseId => ({
          course_id: parseInt(courseId),
          batch: formData.batch,
          semester_id: formData.semester_id,
          department_id: formData.department_id,
        }));
        await onSaveMultiple(assignments);
      }
      onClose();
    } catch (error: any) {
      notifications.show({
        color: "red",
        title: "Error",
        message: error.message || "Failed to save course batch",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get selected courses data
  const selectedCoursesData = useMemo(() => {
    return selectedCourseIds.map(id => 
      departmentCourses.find(course => course.course_id.toString() === id)
    ).filter(Boolean) as Course[];
  }, [selectedCourseIds, departmentCourses]);

  return (
    <Modal 
      opened={opened} 
      onClose={onClose}
      title={
        <Group gap="sm">
          <ThemeIcon size="md" radius="lg" color="blue" variant="light">
            {assignmentMode === 'multiple' ? 
              <DocumentDuplicateIcon className="h-5 w-5" /> : 
              <BookOpenIcon className="h-5 w-5" />
            }
          </ThemeIcon>
          <div>
            <Text fw={600} component="div">{courseBatch ? "Edit Course Assignment" : "Assign Courses to Batch"}</Text>
            <Text size="sm" c="dimmed" component="div">
              {courseBatch ? "Update course details" : "Link multiple courses with batch and semester"}
            </Text>
          </div>
        </Group>
      }
      centered
      size="lg"
      radius="lg"
    >
      <Stack gap="lg">
        <Paper withBorder p="md" radius="md" className="bg-blue-50 border-blue-100">
          <Text size="sm" c="blue" fw={500} component="div">
            {courseBatch 
              ? "Update course assignment to batch and semester"
              : "Select multiple courses to assign to a specific batch and semester"}
          </Text>
        </Paper>

        {/* Assignment Mode Toggle (only for new assignments) */}
        {!courseBatch && (
          <Paper withBorder p="md" radius="md">
            <Group justify="space-between">
              <Text fw={600} component="div">Assignment Mode</Text>
              <Group gap="xs">
                <Button
                  variant={assignmentMode === 'single' ? 'filled' : 'light'}
                  color="blue"
                  size="sm"
                  onClick={() => setAssignmentMode('single')}
                >
                  Single Course
                </Button>
                <Button
                  variant={assignmentMode === 'multiple' ? 'filled' : 'light'}
                  color="green"
                  size="sm"
                  onClick={() => setAssignmentMode('multiple')}
                >
                  Multiple Courses
                </Button>
              </Group>
            </Group>
          </Paper>
        )}

        {/* Department Selection */}
        <Select
          label="Department"
          placeholder="Select department"
          data={departments.map(dept => ({
            value: dept.department_id.toString(),
            label: dept.department_name,
          }))}
          value={formData.department_id.toString()}
          onChange={(value) => {
            const deptId = parseInt(value || '0');
            setFormData({...formData, department_id: deptId});
            setSelectedCourseIds([]); // Clear selected courses when department changes
          }}
          required
          withAsterisk
          searchable
          clearable
          size="md"
        />

        {/* Course Selection - UPDATED FOR MULTIPLE */}
        {assignmentMode === 'multiple' ? (
          <div>
            <Group justify="space-between" mb="xs">
              <Group gap="xs">
                <BookOpenIcon className="h-4 w-4" />
                <Text fw={500} size="sm" component="span">
                  Select Courses
                </Text>
              </Group>
              <Badge color="blue" variant="light">
                {selectedCourseIds.length} selected
              </Badge>
            </Group>
            
            {!formData.department_id ? (
              <Alert color="yellow" title="Select Department First">
                Please select a department to view available courses.
              </Alert>
            ) : departmentCourses.length === 0 ? (
              <Alert color="orange" title="No Courses Available">
                No courses found for this department.
              </Alert>
            ) : (
              <MultiSelect
                data={departmentCourses.map(course => ({
                  value: course.course_id.toString(),
                  label: `${course.course_code} - ${course.course_name}`,
                  description: `${course.credit_hour} credits`
                }))}
                value={selectedCourseIds}
                onChange={setSelectedCourseIds}
                placeholder="Search and select multiple courses..."
                searchable
                clearable
                hidePickedOptions
                maxDropdownHeight={200}
                size="md"
                radius="md"
                nothingFoundMessage="No courses found"
                disabled={!formData.department_id}
              />
            )}
          </div>
        ) : (
          // Single course selection for edit mode
          <Select
            label={
              <Group gap="xs">
                <BookOpenIcon className="h-4 w-4" />
                <Text component="span">Course</Text>
              </Group>
            }
            placeholder="Select course"
            data={departmentCourses.map(course => ({
              value: course.course_id.toString(),
              label: `${course.course_code} - ${course.course_name}`,
              description: `${course.credit_hour} credits `
            }))}
            value={formData.course_id.toString()}
            onChange={(value) => setFormData({...formData, course_id: parseInt(value || '0')})}
            required
            withAsterisk
            searchable
            clearable
            disabled={!formData.department_id || courseBatch !== null}
            size="md"
          />
        )}

        {/* Batch Selection */}
        <Select
          label={
            <Group gap="xs">
              <UserGroupIcon className="h-4 w-4" />
              <Text component="span">Batch</Text>
            </Group>
          }
          placeholder="Select batch"
          data={departmentBatches.map(batch => ({
            value: batch.batch_id.toString(),
            label: `Batch ${batch.batch_year}`,
            description: `ID: ${batch.batch_id}`
          }))}
          value={formData.batch.toString()}
          onChange={(value) => setFormData({...formData, batch: parseInt(value || '0')})}
          required
          withAsterisk
          searchable
          clearable
          disabled={!formData.department_id}
          size="md"
        />

        {/* Semester Selection */}
        <Select
          label={
            <Group gap="xs">
              <CalendarDaysIcon className="h-4 w-4" />
              <Text component="span">Semester</Text>
            </Group>
          }
          placeholder="Select semester"
          data={departmentSemesters.map(semester => ({
            value: semester.id.toString(),
            label: `${semester.semester} - ${semester.academic_year}`,
            description: `${semester.start_date} to ${semester.end_date}`
          }))}
          value={formData.semester_id}
          onChange={(value) => setFormData({...formData, semester_id: value || ''})}
          required
          withAsterisk
          searchable
          clearable
          disabled={!formData.department_id}
          size="md"
        />

        {/* Selected Courses Summary (for multiple mode) */}
        {assignmentMode === 'multiple' && selectedCoursesData.length > 0 && (
          <Paper withBorder p="md" radius="md" className="bg-green-50 border-green-100">
            <Group justify="space-between" mb="md">
              <Text fw={600} size="sm" c="green" component="div">Selected Courses ({selectedCoursesData.length})</Text>
              <Badge color="green" variant="light">Ready to assign</Badge>
            </Group>
            <ScrollArea h={200}>
              <Stack gap="xs">
                {selectedCoursesData.map((course) => (
                  <Paper key={course.course_id} withBorder p="xs" radius="md">
                    <Group gap="sm">
                      <Avatar size="sm" radius="md" color="green" variant="light">
                        <BookOpenIcon className="h-3 w-3" />
                      </Avatar>
                      <div style={{ flex: 1 }}>
                        <Text fw={500} size="sm" component="div">{course.course_code}</Text>
                        <Text size="xs" c="dimmed" lineClamp={1} component="div">
                          {course.course_name} • {course.credit_hour} credits
                        </Text>
                      </div>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </ScrollArea>
          </Paper>
        )}

        {/* Summary */}
        {(formData.department_id && (formData.batch || formData.semester_id || (assignmentMode === 'multiple' ? selectedCourseIds.length > 0 : formData.course_id))) && (
          <Paper withBorder p="md" radius="md" className="bg-blue-50 border-blue-100">
            <Text size="sm" fw={500} c="blue" mb="xs" component="div">Assignment Summary</Text>
            <Stack gap="xs">
              <Text size="sm" component="div">
                <strong>Department:</strong> {departments.find(d => d.department_id === formData.department_id)?.department_name}
              </Text>
              <Text size="sm" component="div">
                <strong>Batch:</strong> {departmentBatches.find(b => b.batch_id === formData.batch)?.batch_year || 'Not selected'}
              </Text>
              <Text size="sm" component="div">
                <strong>Semester:</strong> {departmentSemesters.find(s => s.id.toString() === formData.semester_id)?.semester || 'Not selected'}
              </Text>
              {assignmentMode === 'multiple' ? (
                <Text size="sm" component="div">
                  <strong>Courses:</strong> {selectedCourseIds.length} course(s) selected
                </Text>
              ) : (
                <Text size="sm" component="div">
                  <strong>Course:</strong> {departmentCourses.find(c => c.course_id === formData.course_id)?.course_name || 'Not selected'}
                </Text>
              )}
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
            disabled={
              assignmentMode === 'single' 
                ? !formData.course_id || !formData.batch || !formData.semester_id || !formData.department_id
                : selectedCourseIds.length === 0 || !formData.batch || !formData.semester_id || !formData.department_id
            }
            size="md"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            leftSection={assignmentMode === 'multiple' ? 
              <DocumentDuplicateIcon className="h-5 w-5" /> : 
              <BookOpenIcon className="h-5 w-5" />
            }
          >
            {loading ? "Saving..." : courseBatch ? "Update Assignment" : `Assign ${assignmentMode === 'multiple' ? selectedCourseIds.length : ''} Course(s)`}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};


const CourseBatchManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // Redux selectors
  const { courseBatches, loading, error, successMessage } = useAppSelector((state) => state.courseBatches || {
    courseBatches: [],
    loading: false,
    error: null,
    successMessage: null,
  });
  
  const { departments } = useAppSelector((state) => state.departments);
  const { semesters } = useAppSelector((state) => state.semesters);
  const { batches } = useAppSelector((state) => state.batches);
   const { courses } = useAppSelector((state) => state.courses);
  
  // Local state
  const [modalState, setModalState] = useState<{
    opened: boolean;
    courseBatch: CourseBatch | null; 
  }>({
    opened: false,
    courseBatch: null
  });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
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
      dispatch(fetchCourseBatches());
      dispatch(fetchDepartments());
      dispatch(fetchSemesters());
        dispatch(fetchBatches());
        dispatch(fetchCourses());
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



  // Filter course batches
  const filteredCourseBatches = useMemo(() => {
    return courseBatches.filter(cb => {
      const matchesSearch = searchTerm ? 
        cb.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cb.course_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cb.department_name?.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      
      const matchesDepartment = selectedDepartment ? 
        cb.department_id.toString() === selectedDepartment 
        : true;
      
      const matchesBatch = selectedBatch ? 
        cb.batch.toString() === selectedBatch 
        : true;
      
      const matchesSemester = selectedSemester ? 
        cb.semester_id === selectedSemester 
        : true;
      
      return matchesSearch && matchesDepartment && matchesBatch && matchesSemester;
    });
  }, [courseBatches, searchTerm, selectedDepartment, selectedBatch, selectedSemester]);

  // Calculate statistics
  const totalAssignments = courseBatches.length;
  const uniqueDepartments = [...new Set(courseBatches.map(cb => cb.department_id))].length;
  const uniqueCourses = [...new Set(courseBatches.map(cb => cb.course_id))].length;
  const uniqueBatches = [...new Set(courseBatches.map(cb => cb.batch))].length;

  // Handle save single
  const handleSave = useCallback(async (id: number | null, data: CourseBatchFormData) => {
    try {
      if (id === null) {
        await dispatch(createCourseBatch(data)).unwrap();
      } else {
        await dispatch(updateCourseBatch({ id, data })).unwrap();
      }
      dispatch(fetchCourseBatches());
    } catch (err: any) {
      throw err;
    }
  }, [dispatch]);

  // Handle save multiple
  const handleSaveMultiple = useCallback(async (assignments: CourseBatchFormData[]) => {
    try {
      // Create all assignments in parallel
      const promises = assignments.map(assignment => 
        dispatch(createCourseBatch(assignment)).unwrap()
      );
      
      await Promise.all(promises);
      dispatch(fetchCourseBatches());
      
      notifications.show({
        color: "green",
        title: "Success",
        message: `Successfully assigned ${assignments.length} course(s) to batch`,
      });
    } catch (err: any) {
      throw err;
    }
  }, [dispatch]);

  // Handle delete
  const handleDelete = useCallback(async (id: number) => {
    if (!confirm("Are you sure you want to delete this course batch assignment?")) {
      return;
    }
    
    try {
      await dispatch(deleteCourseBatch(id)).unwrap();
      dispatch(fetchCourseBatches());
      notifications.show({
        color: "green",
        title: "Success",
        message: "Course batch assignment deleted successfully",
      });
    } catch (err: any) {
      notifications.show({
        color: "red",
        title: "Error",
        message: err.message || "Failed to delete assignment",
      });
    }
  }, [dispatch]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedDepartment(null);
    setSelectedBatch(null);
    setSelectedSemester(null);
  }, []);

  const hasFilters = useMemo(() => {
    return !!(searchTerm || selectedDepartment || selectedBatch || selectedSemester);
  }, [searchTerm, selectedDepartment, selectedBatch, selectedSemester]);
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
                <BookOpenIcon className="h-6 w-6" />
              </ThemeIcon>
              <Title order={1} className="text-white">Course Batch Management</Title>
            </Group>
            <Text className="text-blue-100 max-w-2xl" component="div">
              Assign multiple courses to specific batches and semesters across departments. 
              Manage academic schedules, track course offerings, and organize curriculum planning.
            </Text>
          </Stack>
        </Box>

        {/* Stats Dashboard */}
        <Grid gutter="lg">
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <StatCard 
              icon={BookOpenIcon}
              title="Total Assignments"
              value={totalAssignments}
              color="blue"
              description="Course-Batch links"
            />
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <StatCard 
              icon={BuildingOfficeIcon}
              title="Departments"
              value={uniqueDepartments}
              color="green"
              description="Active departments"
            />
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <StatCard 
              icon={UsersIcon}
              title="Courses"
              value={uniqueCourses}
              color="orange"
              description="Unique courses"
            />
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <StatCard 
              icon={UserGroupIcon}
              title="Batches"
              value={uniqueBatches}
              color="purple"
              description="Active batches"
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
                    <AcademicCapIcon className="h-4 w-4" />
                  </ThemeIcon>
                  <Text fw={600} component="div">Course Batch Assignments</Text>
                  <Badge variant="light" color="blue">
                    {filteredCourseBatches.length} found
                  </Badge>
                </Group>
                
                <Button 
                  onClick={() => setModalState({ opened: true, courseBatch: null })}
                  leftSection={<DocumentDuplicateIcon className="h-5 w-5" />}
                  loading={loading}
                  size="md"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  Assign Multiple Courses
                </Button>
              </Group>

              <Group gap="md" align="flex-end">
                <TextInput
                  placeholder="Search courses, departments..."
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
                  placeholder="Batch"
                  data={batches.map(b => ({
                    value: b.batch_id.toString(),
                    label: `Batch ${b.batch_year}`
                  }))}
                  value={selectedBatch}
                  onChange={setSelectedBatch}
                  clearable
                  size="md"
                  style={{ width: 150 }}
                />
                
                <Select
                  placeholder="Semester"
                  data={semesters.map(s => ({
                    value: s.id.toString(),
                    label: `${s.semester} - ${s.academic_year}`
                  }))}
                  value={selectedSemester}
                  onChange={setSelectedSemester}
                  clearable
                  size="md"
                  style={{ width: 200 }}
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

          {/* Course Batches Table */}
          <Card.Section inheritPadding py="md">
            {loading && courseBatches.length === 0 ? (
              <Center py="xl">
                <Stack align="center" gap="md">
                  <Loader size="lg" color="blue" />
                  <Text c="dimmed" component="div">Loading course batches...</Text>
                </Stack>
              </Center>
            ) : filteredCourseBatches.length === 0 ? (
              <Center py="xl">
                <Stack align="center" gap="md">
                  <ThemeIcon size="xl" radius="lg" color="gray" variant="light">
                    <BookOpenIcon className="h-8 w-8" />
                  </ThemeIcon>
                  <Text size="lg" fw={500} c="dimmed" component="div">
                    {hasFilters ? "No assignments match your filters" : "No course batch assignments found"}
                  </Text>
                  <Text c="dimmed" ta="center" maw={500} component="div">
                    {hasFilters 
                      ? "Try adjusting your search or filters"
                      : "Get started by creating your first course batch assignment"
                    }
                  </Text>
                  <Button 
                    onClick={() => setModalState({ opened: true, courseBatch: null })}
                    leftSection={<PlusCircleIcon className="h-4 w-4" />}
                    size="md"
                    className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    Create First Assignment
                  </Button>
                </Stack>
              </Center>
            ) : (
              <ScrollArea>
                <Table.ScrollContainer minWidth={1200}>
                  <Table verticalSpacing="md" highlightOnHover>
                    <Table.Thead className="bg-gray-50">
                      <Table.Tr>
                        <Table.Th style={{ width: 60 }}>
                          <Text fw={600} component="div">#</Text>
                        </Table.Th>
                        <Table.Th>
                          <Group gap="xs">
                            <BookOpenIcon className="h-4 w-4" />
                            <Text fw={600} component="span">Course</Text>
                          </Group>
                        </Table.Th>
                        <Table.Th>
                          <Group gap="xs">
                            <UserGroupIcon className="h-4 w-4" />
                            <Text fw={600} component="span">Batch</Text>
                          </Group>
                        </Table.Th>
                        <Table.Th>
                          <Group gap="xs">
                            <CalendarDaysIcon className="h-4 w-4" />
                            <Text fw={600} component="span">Semester</Text>
                          </Group>
                        </Table.Th>
                        <Table.Th>
                          <Group gap="xs">
                            <BuildingOfficeIcon className="h-4 w-4" />
                            <Text fw={600} component="span">Department</Text>
                          </Group>
                        </Table.Th>
                        <Table.Th>
                          <Group gap="xs">
                            <CalendarIcon className="h-4 w-4" />
                            <Text fw={600} component="span">Created</Text>
                          </Group>
                        </Table.Th>
                        <Table.Th style={{ width: 100 }}>
                          <Text fw={600} component="div">Actions</Text>
                        </Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {filteredCourseBatches.map((cb, index) => (
                        <Table.Tr key={cb.id} className="hover:bg-blue-50/50 transition-colors">
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
                                {cb.course_code?.charAt(0) || 'C'}
                              </Avatar>
                              <div>
                                <Text fw={600} component="div">{cb.course_code}</Text>
                                <Text size="sm" c="dimmed" lineClamp={1} component="div">
                                  {cb.course_name}
                                </Text>
                              </div>
                            </Group>
                          </Table.Td>
                          
                          <Table.Td>
                            <Badge 
                              color="orange"
                              variant="light" 
                              size="lg"
                              leftSection={<UserGroupIcon className="h-3 w-3 mr-1" />}
                            >
                              Batch {cb.batch}
                            </Badge>
                          </Table.Td>
                          
                          <Table.Td>
                            <Badge 
                              color="green"
                              variant="light" 
                              size="lg"
                              leftSection={<CalendarDaysIcon className="h-3 w-3 mr-1" />}
                            >
                              {cb.semester_name || `Semester ${cb.semester_id}`}
                            </Badge>
                          </Table.Td>
                          
                          <Table.Td>
                            <Badge 
                              color="purple"
                              variant="light" 
                              size="lg"
                              leftSection={<BuildingOfficeIcon className="h-3 w-3 mr-1" />}
                            >
                              {cb.department_name}
                            </Badge>
                          </Table.Td>
                          
                          <Table.Td>
                            <Text size="sm" c="dimmed" component="div">
                              {new Date(cb.created_at).toLocaleDateString()}
                            </Text>
                            <Text size="xs" c="dimmed" component="div">
                              {new Date(cb.created_at).toLocaleTimeString()}
                            </Text>
                          </Table.Td>
                          
                          <Table.Td>
                            <Group gap="xs">
                              <Tooltip label="Edit assignment">
                                <ActionIcon
                                  variant="light"
                                  color="blue"
                                  onClick={() => setModalState({ opened: true, courseBatch: cb })}
                                >
                                  <PencilSquareIcon className="h-4 w-4" />
                                </ActionIcon>
                              </Tooltip>
                              
                              <Tooltip label="Delete assignment">
                                <ActionIcon
                                  variant="light"
                                  color="red"
                                  onClick={() => handleDelete(cb.id)}
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

      {/* Course Batch Modal */}
      <CourseBatchModal
        opened={modalState.opened}
        onClose={() => setModalState({ opened: false, courseBatch: null })}
        courseBatch={modalState.courseBatch}
        onSave={handleSave}
        onSaveMultiple={handleSaveMultiple}
        courses={courses}
        departments={departments}
        batches={batches}
        semesters={semesters}
      />
    </Container>
  );
};

export default CourseBatchManagement;