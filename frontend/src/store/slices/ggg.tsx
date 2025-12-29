/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
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
} from "@mantine/core";
import {
  PencilSquareIcon,
  TrashIcon,
  PlusCircleIcon,
  BuildingLibraryIcon,
  AcademicCapIcon,
  EllipsisVerticalIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { notifications } from "@mantine/notifications";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { Authentication, Found } from "@/app/auth/auth";
import {
  fetchFaculties,
  addFaculty,
  updateFaculty,
  deleteFaculty,
  fetchFacultyDepartments,
  assignDepartmentToFaculty,
  clearError,
  clearSuccessMessage,
  Faculty,
} from "@/store/slices/facultySlice";
import { fetchDepartments } from "@/store/slices/departmentsSlice";

interface FacultyModalProps {
  opened: boolean;
  onClose: () => void;
  faculty: Faculty | null;
  onSave: (id: number | null, name: string) => void;
}

const FacultyModal: React.FC<FacultyModalProps> = ({
  opened,
  onClose,
  faculty,
  onSave,
}) => {
  const [facultyName, setFacultyName] = useState("");

  useEffect(() => {
    if (faculty) {
      setFacultyName(faculty.faculity_name);
    } else {
      setFacultyName("");
    }
  }, [faculty, opened]);

  const handleSave = () => {
    if (!facultyName.trim()) {
      notifications.show({
        color: "red",
        title: "Error",
        message: "Faculty name is required",
      });
      return;
    }
    
    onSave(faculty ? faculty.faculity_id : null, facultyName.trim());
    onClose();
  };

  const handleClose = () => {
    setFacultyName("");
    onClose();
  };

  return (
    <Modal 
      opened={opened} 
      onClose={handleClose}
      title={
        <Group gap="sm">
          <ThemeIcon size="md" radius="lg" color="blue" variant="light">
            <BuildingLibraryIcon className="h-5 w-5" />
          </ThemeIcon>
          <Text fw={600}>{faculty ? "Edit Faculty" : "Create New Faculty"}</Text>
        </Group>
      }
      centered
      size="md"
      radius="lg"
    >
      <Stack gap="md">
        <Paper withBorder p="md" radius="md" className="bg-blue-50 border-blue-100">
          <Text size="sm" c="blue" fw={500}>
            {faculty 
              ? "Update the faculty information" 
              : "Create a new faculty to organize departments"}
          </Text>
        </Paper>
        
        <TextInput
          label={
            <Group gap="xs">
              <AcademicCapIcon className="h-4 w-4" />
              <Text>Faculty Name</Text>
            </Group>
          }
          placeholder="Enter faculty name (e.g., Faculty of Engineering)"
          value={facultyName}
          onChange={(e) => setFacultyName(e.currentTarget.value)}
          required
          size="md"
          withAsterisk
          description="Provide a clear and descriptive name for the faculty"
        />
        
        <Group justify="flex-end" gap="sm">
          <Button variant="light" color="gray" onClick={handleClose} size="md">
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            size="md"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            leftSection={faculty ? <PencilSquareIcon className="h-4 w-4" /> : <PlusCircleIcon className="h-4 w-4" />}
          >
            {faculty ? "Update Faculty" : "Create Faculty"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

interface AssignDepartmentModalProps {
  opened: boolean;
  onClose: () => void;
  faculty: Faculty | null;
  onAssign: (facultyId: number, departmentId: number) => void;
}

const AssignDepartmentModal: React.FC<AssignDepartmentModalProps> = ({
  opened,
  onClose,
  faculty,
  onAssign,
}) => {
  const dispatch = useAppDispatch();
  const { departments } = useAppSelector((state) => state.departments);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (opened && faculty) {
      setLoading(true);
      dispatch(fetchDepartments())
        .then(() => setLoading(false))
        .catch(() => setLoading(false));
      setSelectedDept(null);
    }
  }, [dispatch, opened, faculty]);

  const handleAssign = () => {
    if (faculty && selectedDept) {
      onAssign(faculty.faculity_id, Number(selectedDept));
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedDept(null);
    onClose();
  };

  // Filter departments that are unassigned or assigned to this faculty
  const availableDepartments = departments.filter(dept => 
    !dept.faculity_id || dept.faculity_id === faculty?.faculity_id
  );

  // Get selected department details
  const selectedDepartment = selectedDept 
    ? departments.find(dept => dept.department_id.toString() === selectedDept)
    : null;

  return (
    <Modal 
      opened={opened} 
      onClose={handleClose}
      title={
        <Group gap="sm">
          <ThemeIcon size="md" radius="lg" color="green" variant="light">
            <PlusCircleIcon className="h-5 w-5" />
          </ThemeIcon>
          <Text fw={600}>Assign Department</Text>
        </Group>
      }
      centered
      size="lg"
      radius="lg"
    >
      <Stack gap="lg">
        {/* Faculty Info */}
        <Paper withBorder p="md" radius="md" className="bg-blue-50 border-blue-100">
          <Group justify="space-between">
            <div>
              <Text size="sm" fw={500} c="blue">Faculty</Text>
              <Text fw={600} size="lg">{faculty?.faculity_name}</Text>
            </div>
            <Badge size="lg" color="blue" variant="light">
              ID: {faculty?.faculity_id}
            </Badge>
          </Group>
        </Paper>

        {/* Department Selection */}
        <div>
          <Select
            label={
              <Group gap="xs">
                <BuildingOfficeIcon className="h-4 w-4" />
                <Text>Select Department</Text>
              </Group>
            }
            placeholder="Search for a department..."
            data={availableDepartments.map(dept => ({
              value: dept.department_id.toString(),
              label: dept.department_name,
              description: dept.faculity_name ? `Currently in: ${dept.faculity_name}` : "Unassigned"
            }))}
            value={selectedDept}
            onChange={setSelectedDept}
            searchable
            clearable
            nothingFoundMessage="No departments found"
            disabled={loading}
            size="md"
            radius="md"
          />
          {loading && (
            <Text size="sm" c="dimmed" mt="xs">Loading departments...</Text>
          )}
        </div>

        {/* Selected Department Preview */}
        {selectedDepartment && (
          <Paper withBorder p="md" radius="md" className="bg-green-50 border-green-100">
            <Group justify="space-between">
              <Group gap="md">
                <Avatar 
                  size="lg" 
                  radius="md" 
                  color="green"
                >
                  {selectedDepartment.department_name.charAt(0).toUpperCase()}
                </Avatar>
                <div>
                  <Text fw={600} size="lg">{selectedDepartment.department_name}</Text>
                  <Group gap="xs" mt={4}>
                    <Badge size="sm" variant="light" color="gray">
                      ID: {selectedDepartment.department_id}
                    </Badge>
                    {selectedDepartment.faculity_name && (
                      <Badge size="sm" variant="dot" color="orange">
                        {selectedDepartment.faculity_name}
                      </Badge>
                    )}
                  </Group>
                </div>
              </Group>
              <ThemeIcon size="xl" radius="lg" color="green" variant="light">
                <CheckCircleIcon className="h-6 w-6" />
              </ThemeIcon>
            </Group>
          </Paper>
        )}

        <Group justify="flex-end" gap="sm">
          <Button variant="light" color="gray" onClick={handleClose} size="md">
            Cancel
          </Button>
          <Button 
            onClick={handleAssign}
            disabled={!selectedDept || loading}
            loading={loading}
            size="md"
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            leftSection={<PlusIcon className="h-5 w-5" />}
          >
            Assign Department
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

const FacultyManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const { 
    faculties, 
    facultyDepartments,
    loading, 
    error, 
    successMessage 
  } = useAppSelector((state) => state.faculty);
  
  const [facultyModal, setFacultyModal] = useState<{
    opened: boolean;
    faculty: Faculty | null;
  }>({
    opened: false,
    faculty: null
  });

  const [assignModal, setAssignModal] = useState<Faculty | null>(null);
  const [viewModal, setViewModal] = useState<Faculty | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchFaculties());
  }, [dispatch]);

  // Clear messages after a delay
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
  
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const checkAuth = async () => {
      const foundUser = await Found();
      setUser(foundUser);
    };
    checkAuth();
  }, []);

  if (user === null) { 
    return <Authentication />;
  }

  // Add faculty
  const handleAddFaculty = () => {
    setFacultyModal({
      opened: true,
      faculty: null
    });
  };

  // Edit faculty
  const handleEditFaculty = (faculty: Faculty) => {
    setFacultyModal({
      opened: true,
      faculty
    });
  };

  // View faculty details
  const handleViewFaculty = async (faculty: Faculty) => {
    setViewModal(faculty);
    setViewLoading(true);
    try {
      await dispatch(fetchFacultyDepartments(faculty.faculity_id));
    } catch (error) {
      console.error("Error fetching faculty departments:", error);
    } finally {
      setViewLoading(false);
    }
  };

  // Save faculty (add or edit)
  const handleSaveFaculty = async (id: number | null, name: string) => {
    setActionLoading(true);
    try {
      if (id === null) {
        await dispatch(addFaculty(name)).unwrap();
      } else {
        await dispatch(updateFaculty({ id, faculity_name: name })).unwrap();
      }
      dispatch(fetchFaculties());
    } catch (err) {
      console.error('Error saving faculty:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete faculty
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this faculty? This will remove all department associations.")) {
      return;
    }
    
    setActionLoading(true);
    try {
      await dispatch(deleteFaculty(id)).unwrap();
      dispatch(fetchFaculties());
    } catch (err) {
      console.error('Error deleting faculty:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Assign department to faculty
  const handleAssignDepartment = async (facultyId: number, departmentId: number) => {
    setActionLoading(true);
    try {
      await dispatch(assignDepartmentToFaculty({ facultyId, departmentId })).unwrap();
      dispatch(fetchFaculties());
      if (viewModal?.faculity_id === facultyId) {
        dispatch(fetchFacultyDepartments(facultyId));
      }
    } catch (err) {
      console.error('Error assigning department:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseModal = () => {
    setFacultyModal({
      opened: false,
      faculty: null
    });
  };

  // Calculate statistics
  const facultiesWithDepartments = faculties.filter(f => f.department_count || 0 > 0).length;
  const facultiesWithoutDepartments = faculties.filter(f => !f.department_count || f.department_count === 0).length;

  return (
    <Container size="xl" py="xl" className="min-h-screen">
      <Stack gap="lg">
        {/* Header */}
        <Box className="relative overflow-hidden rounded-2xl ">
          <Stack gap="xs">
            <Group align="center" gap="sm">
              <ThemeIcon size="xl" radius="lg" variant="white" color="purple">
                <BuildingLibraryIcon className="h-6 w-6" />
              </ThemeIcon>
              <Title order={1} className="text-blue">Faculty Management</Title>
            </Group>
            <Text className="text-purple-100 max-w-2xl">
              Organize academic departments into faculties for better administration and coordination. 
              Faculties help structure the academic hierarchy and streamline department management.
            </Text>
          </Stack>
        </Box>

        {/* Stats Dashboard */}
        <Grid gutter="lg">
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Card withBorder radius="lg" className="bg-gradient-to-br from-white to-purple-50">
              <Group gap="md">
                <ThemeIcon size="lg" radius="md" color="purple" variant="light">
                  <BuildingLibraryIcon className="h-5 w-5" />
                </ThemeIcon>
                <div>
                  <Text size="sm" c="dimmed" fw={500}>Total Faculties</Text>
                  <Title order={3} className="text-purple-700">{faculties.length}</Title>
                </div>
              </Group>
            </Card>
          </Grid.Col>
          
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Card withBorder radius="lg" className="bg-gradient-to-br from-white to-green-50">
              <Group gap="md">
                <ThemeIcon size="lg" radius="md" color="green" variant="light">
                  <CheckCircleIcon className="h-5 w-5" />
                </ThemeIcon>
                <div>
                  <Text size="sm" c="dimmed" fw={500}>With Departments</Text>
                  <Title order={3} className="text-green-700">{facultiesWithDepartments}</Title>
                </div>
              </Group>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Card withBorder radius="lg" className="bg-gradient-to-br from-white to-orange-50">
              <Group gap="md">
                <ThemeIcon size="lg" radius="md" color="orange" variant="light">
                  <XCircleIcon className="h-5 w-5" />
                </ThemeIcon>
                <div>
                  <Text size="sm" c="dimmed" fw={500}>Without Departments</Text>
                  <Title order={3} className="text-orange-700">{facultiesWithoutDepartments}</Title>
                </div>
              </Group>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Error and Success Messages */}
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

        {/* Main Content */}
        <Card withBorder radius="lg" shadow="sm" className="overflow-hidden">
          <Card.Section withBorder inheritPadding py="md" className="bg-gray-50">
            <Group justify="space-between">
              <Group gap="xs">
                <ThemeIcon size="sm" radius="lg" color="purple" variant="light">
                  <AcademicCapIcon className="h-4 w-4" />
                </ThemeIcon>
                <Text fw={600} size="lg">Faculties</Text>
                <Badge variant="light" color="purple" size="lg">
                  {faculties.length} total
                </Badge>
              </Group>
              
              <Button 
                onClick={handleAddFaculty}
                leftSection={<PlusCircleIcon className="h-5 w-5" />}
                loading={loading}
                size="md"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Add Faculty
              </Button>
            </Group>
          </Card.Section>

          {loading && faculties.length === 0 ? (
            <Center py="xl">
              <Stack align="center" gap="md">
                <Loader size="lg" color="purple" />
                <Text c="dimmed">Loading faculties...</Text>
              </Stack>
            </Center>
          ) : faculties.length === 0 ? (
            <Center py="xl">
              <Stack align="center" gap="md">
                <ThemeIcon size="xl" radius="lg" color="gray" variant="light">
                  <BuildingLibraryIcon className="h-8 w-8" />
                </ThemeIcon>
                <Text size="lg" fw={500} c="dimmed">No faculties found</Text>
                <Text c="dimmed" ta="center" maw={500}>
                  Faculties help organize academic departments. Create your first faculty to get started with academic structure management.
                </Text>
                <Button 
                  onClick={handleAddFaculty}
                  leftSection={<PlusCircleIcon className="h-4 w-4" />}
                  size="md"
                  className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  Create First Faculty
                </Button>
              </Stack>
            </Center>
          ) : (
            <ScrollArea>
              <Table verticalSpacing="md" highlightOnHover>
                <Table.Thead className="bg-gray-50">
                  <Table.Tr>
                    <Table.Th style={{ minWidth: 80 }}>
                      <Text fw={600}>#</Text>
                    </Table.Th>
                    <Table.Th style={{ minWidth: 300 }}>
                      <Group gap="xs">
                        <AcademicCapIcon className="h-4 w-4" />
                        <Text fw={600}>Faculty</Text>
                      </Group>
                    </Table.Th>
                    <Table.Th style={{ minWidth: 200 }}>
                      <Group gap="xs">
                        <BuildingOfficeIcon className="h-4 w-4" />
                        <Text fw={600}>Departments</Text>
                      </Group>
                    </Table.Th>
                    <Table.Th style={{ minWidth: 150 }}>
                      <Text fw={600} ta="center">Status</Text>
                    </Table.Th>
                    <Table.Th style={{ minWidth: 200 }}>
                      <Text fw={600}>Created</Text>
                    </Table.Th>
                    <Table.Th style={{ minWidth: 100, textAlign: 'center' }}>
                      <Text fw={600}>Actions</Text>
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {faculties.map((faculty, index) => (
                    <Table.Tr 
                      key={faculty.faculity_id} 
                      className="hover:bg-purple-50/50 transition-colors"
                    >
                      <Table.Td>
                        <Text fw={500} className="text-gray-700">{index + 1}</Text>
                      </Table.Td>
                      
                      <Table.Td>
                        <Group gap="sm">
                          <Avatar 
                            size="md" 
                            radius="md" 
                            color="purple" 
                            variant="light"
                            className="border border-purple-200"
                          >
                            {faculty.faculity_name.charAt(0).toUpperCase()}
                          </Avatar>
                          <div>
                            <Text fw={600} className="text-gray-900">
                              {faculty.faculity_name}
                            </Text>
                            <Text size="xs" c="dimmed">
                              ID: {faculty.faculity_id}
                            </Text>
                          </div>
                        </Group>
                      </Table.Td>
                      
                      <Table.Td>
                        <Stack gap={4}>
                          <Group gap="xs">
                            <Badge 
                              color={faculty.department_count || 0 > 0 ? "blue" : "gray"}
                              variant="light" 
                              size="lg"
                              leftSection={<BuildingOfficeIcon className="h-3 w-3 mr-1" />}
                            >
                              {faculty.department_count || 0} departments
                            </Badge>
                          </Group>
                          {faculty.department_names && (
                            <Text size="sm" c="dimmed" lineClamp={1} title={faculty.department_names}>
                              {faculty.department_names}
                            </Text>
                          )}
                        </Stack>
                      </Table.Td>
                      
                      <Table.Td>
                        <Center>
                          <Badge 
                            color={(faculty.department_count  || 0)> 0 ? "green" : "orange"}
                            variant="light"
                            size="lg"
                            radius="sm"
                            leftSection={(faculty.department_count ||0)  > 0 ? 
                              <CheckCircleIcon className="h-3 w-3 mr-1" /> : 
                              <XCircleIcon className="h-3 w-3 mr-1" />
                            }
                          >
                            {faculty.department_count || 0 > 0 ? "Active" : "No Departments"}
                          </Badge>
                        </Center>
                      </Table.Td>
                      
                      <Table.Td>
                        <Group gap="xs">
                          <CalendarIcon className="h-4 w-4 text-gray-400" />
                          <Text size="sm">
                            {faculty.created_at ? new Date(faculty.created_at).toLocaleDateString() : 'N/A'}
                          </Text>
                        </Group>
                      </Table.Td>
                      
                      <Table.Td>
                        <Center>
                          <Menu shadow="md" width={200} position="bottom-end">
                            <Menu.Target>
                              <ActionIcon variant="subtle" color="gray" size="lg">
                                <EllipsisVerticalIcon className="h-5 w-5" />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Item
                                leftSection={<EyeIcon className="h-4 w-4" />}
                                onClick={() => handleViewFaculty(faculty)}
                                disabled={viewLoading}
                              >
                                View Details
                              </Menu.Item>
                              <Menu.Item
                                leftSection={<PlusCircleIcon className="h-4 w-4" />}
                                onClick={() => setAssignModal(faculty)}
                                disabled={actionLoading}
                              >
                                Assign Department
                              </Menu.Item>
                              <Menu.Divider />
                              <Menu.Item
                                leftSection={<PencilSquareIcon className="h-4 w-4" />}
                                onClick={() => handleEditFaculty(faculty)}
                                disabled={actionLoading}
                              >
                                Edit Faculty
                              </Menu.Item>
                              <Menu.Item
                                color="red"
                                leftSection={<TrashIcon className="h-4 w-4" />}
                                onClick={() => handleDelete(faculty.faculity_id)}
                                disabled={actionLoading}
                              >
                                Delete Faculty
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </Center>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          )}
        </Card>

        {/* Faculty Modal */}
        <FacultyModal
          opened={facultyModal.opened}
          onClose={handleCloseModal}
          faculty={facultyModal.faculty}
          onSave={handleSaveFaculty}
        />

        {/* Assign Department Modal */}
        <AssignDepartmentModal
          opened={!!assignModal}
          onClose={() => setAssignModal(null)}
          faculty={assignModal}
          onAssign={handleAssignDepartment}
        />

        {/* View Faculty Details Modal */}
        <Modal
          opened={!!viewModal}
          onClose={() => setViewModal(null)}
          title={
            <Group gap="sm">
              <ThemeIcon size="md" radius="lg" color="blue" variant="light">
                <BuildingLibraryIcon className="h-5 w-5" />
              </ThemeIcon>
              <div>
                <Text fw={600}>Faculty Details</Text>
                <Text size="sm" c="dimmed">{viewModal?.faculity_name}</Text>
              </div>
            </Group>
          }
          size="lg"
          centered
          radius="lg"
        >
          {viewModal && (
            <Stack gap="lg">
              {/* Faculty Header */}
              <Paper withBorder p="md" radius="md" className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <Group justify="space-between">
                  <Group gap="md">
                    <Avatar 
                      size="xl" 
                      radius="lg" 
                      color="blue"
                      variant="light"
                      className="border-2 border-blue-200"
                    >
                      {viewModal.faculity_name.charAt(0).toUpperCase()}
                    </Avatar>
                    <div>
                      <Text fw={600} size="xl">{viewModal.faculity_name}</Text>
                      <Group gap="lg" mt="xs">
                        <Badge size="lg" color="blue" variant="light">
                          ID: {viewModal.faculity_id}
                        </Badge>
                        <Badge 
                          size="lg" 
                          color={facultyDepartments.length > 0 ? "green" : "orange"}
                          variant="light"
                        >
                          {facultyDepartments.length} Departments
                        </Badge>
                      </Group>
                    </div>
                  </Group>
                  <Button
                    variant="light"
                    color="green"
                    onClick={() => {
                      setViewModal(null);
                      setAssignModal(viewModal);
                    }}
                    leftSection={<PlusIcon className="h-4 w-4" />}
                  >
                    Add Department
                  </Button>
                </Group>
              </Paper>

              {/* Departments Section */}
              <div>
                <Group justify="space-between" mb="md">
                  <Text fw={600} size="lg">Departments</Text>
                  <Badge variant="light" color="blue">
                    {facultyDepartments.length} total
                  </Badge>
                </Group>
                
                {viewLoading ? (
                  <Center py="xl">
                    <Loader size="md" color="blue" />
                  </Center>
                ) : facultyDepartments.length === 0 ? (
                  <Paper withBorder p="xl" radius="md" className="text-center">
                    <BuildingOfficeIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <Text fw={500} mb="xs">No Departments Assigned</Text>
                    <Text size="sm" c="dimmed" mb="md">
                      This faculty doesn&#39;t have any departments yet.
                    </Text>
                    <Button
                      variant="light"
                      color="green"
                      onClick={() => {
                        setViewModal(null);
                        setAssignModal(viewModal);
                      }}
                      leftSection={<PlusIcon className="h-4 w-4" />}
                    >
                      Assign First Department
                    </Button>
                  </Paper>
                ) : (
                  <ScrollArea h={400}>
                    <Stack gap="sm">
                      {facultyDepartments.map((dept) => (
                        <Paper key={dept.department_id} withBorder p="md" radius="md">
                          <Group justify="space-between">
                            <Group gap="sm">
                              <Avatar 
                                size="md" 
                                radius="md" 
                                color="blue"
                                variant="light"
                              >
                                {dept.department_name.charAt(0).toUpperCase()}
                              </Avatar>
                              <div>
                                <Text fw={600}>{dept.department_name}</Text>
                                <Text size="sm" c="dimmed">
                                  {dept.head_name ? `Head: ${dept.head_name}` : "No head assigned"}
                                </Text>
                              </div>
                            </Group>
                            <Badge 
                              color={dept.head_name ? "green" : "yellow"} 
                              variant="light"
                            >
                              {dept.head_name ? "Has Head" : "No Head"}
                            </Badge>
                          </Group>
                        </Paper>
                      ))}
                    </Stack>
                  </ScrollArea>
                )}
              </div>
            </Stack>
          )}
        </Modal>
      </Stack>
    </Container>
  );
};

export default FacultyManager;