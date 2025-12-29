/* eslint-disable react/jsx-no-undef */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  PencilSquareIcon,
  TrashIcon,
  PlusCircleIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
  UserCircleIcon,
  FunnelIcon,
  XMarkIcon,
  BuildingStorefrontIcon,
  HomeModernIcon,
  KeyIcon,
  CheckCircleIcon as CheckIcon,
  EyeIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
  Card,
  Select,
  Group,
  Table,
  TextInput,
  Modal,
  Loader,
  Text,
  Title,
  Container,
  ScrollArea,
  Alert,
  Box,
  Stack,
  Badge,
  ActionIcon,
  Tooltip,
  Grid,
  Paper,
  Input,
  Avatar,
  ThemeIcon,
  Center,
  Pagination,
  MultiSelect,
  Tabs,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { Authentication, Found } from "@/app/auth/auth";
import {
  fetchDepartments,
  addDepartment,
  updateDepartment,
  deleteDepartment,
  clearError,
  clearSuccessMessage,
  Department,
} from "@/store/slices/departmentsSlice";
import { fetchFaculties } from "@/store/slices/facultySlice";
import { 
  fetchBlocks, 
  fetchRooms, 
  assignRoomToDepartment,
  fetchDepartmentRooms,
  fetchFacultyBlocks,
  removeRoomFromDepartment 
} from "@/store/slices/roomsSlice";

// Add these interfaces for room assignment
interface DepartmentRoom {
  id: number;
  department_id: number;
  room_id: number;
  status: string;
  created_at: string;
  updated_at: string;
  room_number?: string;
  room_name?: string;
  block_name?: string;
  block_code?: string;
}

interface DepartmentWithDetails extends Department {
  assigned_rooms?: DepartmentRoom[];
  room_count?: number;
}

interface Room {
  room_id: number;
  block_id: number;
  room_number: string;
  room_name?: string;
  room_type: string;
  capacity: number;
  facilities: string[];
  is_available: boolean;
  block_name?: string;
  department_assigned?: boolean;
  faculity_id?: number;
}

interface Block {
  block_id: number;
  block_name: string;
  block_code: string;
  description?: string;
  faculity_id?: number;
  faculity_name?: string;
}

// Department Modal Component
interface DepartmentModalProps {
  opened: boolean;
  onClose: () => void;
  department: Department | null;
  onSave: (id: number | null, name: string, faculity_id: number | null) => void;
}

const DepartmentModal: React.FC<DepartmentModalProps> = ({
  opened,
  onClose,
  department,
  onSave,
}) => {
  const dispatch = useAppDispatch();
  const { faculties } = useAppSelector((state) => state.faculty);
  const [departmentName, setDepartmentName] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (department) {
      setDepartmentName(department.department_name);
      setSelectedFaculty(department.faculity_id?.toString() || null);
    } else {
      setDepartmentName("");
      setSelectedFaculty(null);
    }
  }, [department, opened]);

  useEffect(() => {
    if (opened) {
      setLoading(true);
      dispatch(fetchFaculties())
        .then(() => setLoading(false))
        .catch(() => setLoading(false));
    }
  }, [dispatch, opened]);

  const handleSave = () => {
    if (!departmentName.trim()) {
      notifications.show({
        color: "red",
        title: "Error",
        message: "Department name is required",
      });
      return;
    }
    
    onSave(
      department ? department.department_id : null,
      departmentName.trim(),
      selectedFaculty ? parseInt(selectedFaculty) : null
    );
    onClose();
  };

  const handleClose = () => {
    setDepartmentName("");
    setSelectedFaculty(null);
    onClose();
  };

  return (
    <Modal 
      opened={opened} 
      onClose={handleClose}
      title={
        <Group gap="xs">
          <AcademicCapIcon className="h-5 w-5 text-blue-600" />
          <Text fw={600}>{department ? "Edit Department" : "Add New Department"}</Text>
        </Group>
      }
      centered
      size="md"
      radius="lg"
    >
      <Stack gap="md">
        <Paper withBorder p="md" radius="md" className="bg-blue-50 border-blue-100">
          <Text size="sm" c="blue" fw={500}>
            {department 
              ? "Update department information below" 
              : "Create a new department by filling the details"}
          </Text>
        </Paper>
        
        <Select
          label={
            <Group gap="xs">
              <BuildingOfficeIcon className="h-4 w-4" />
              <Text>Faculty</Text>
            </Group>
          }
          placeholder="Select faculty (optional)"
          description="You can assign the department to a faculty later"
          data={faculties.map(faculty => ({
            value: faculty.faculity_id.toString(),
            label: faculty.faculity_name
          }))}
          value={selectedFaculty}
          onChange={setSelectedFaculty}
          clearable
          disabled={loading}
          nothingFoundMessage="No faculties found"
          searchable
        />
        
        <TextInput
          label={
            <Group gap="xs">
              <AcademicCapIcon className="h-4 w-4" />
              <Text>Department Name</Text>
            </Group>
          }
          placeholder="Enter department name"
          value={departmentName}
          onChange={(e) => setDepartmentName(e.currentTarget.value)}
          required
          withAsterisk
          size="md"
        />
        
        {selectedFaculty && (
          <Paper withBorder p="sm" radius="md" className="bg-green-50 border-green-100">
            <Group gap="xs">
              <CheckIcon className="h-4 w-4 text-green-600" />
              <Text size="sm" fw={500}>
                Selected: {faculties.find(f => f.faculity_id.toString() === selectedFaculty)?.faculity_name}
              </Text>
            </Group>
          </Paper>
        )}
        
        <Group justify="flex-end" mt="md" gap="sm">
          <Button variant="light" color="gray" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!departmentName.trim() || loading}
            loading={loading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {department ? "Update Department" : "Create Department"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

// Room Assignment Modal Component
interface RoomAssignmentModalProps {
  opened: boolean;
  onClose: () => void;
  department: DepartmentWithDetails | null;
  onAssign: (departmentId: number, roomIds: number[]) => Promise<void>;
  onRemove: (departmentId: number, roomId: number) => Promise<void>;
}

// Room Assignment Modal Component
const RoomAssignmentModal: React.FC<RoomAssignmentModalProps> = ({
  opened,
  onClose,
  department,
  onAssign,
  onRemove,
}) => {
  const dispatch = useAppDispatch();
  const { faculties } = useAppSelector((state) => state.faculty);
  const { blocks, rooms, loading } = useAppSelector((state) => state.rooms);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [roomSearch, setRoomSearch] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [availableBlocks, setAvailableBlocks] = useState<Block[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [viewLoading, setViewLoading] = useState(false);
  const [assignedRooms, setAssignedRooms] = useState<DepartmentRoom[]>([]);
  const [facultyBlocks, setFacultyBlocks] = useState<Block[]>([]);
  
  // Load department's assigned rooms
  useEffect(() => {
    if (department?.department_id && opened) {
      loadAssignedRooms();
    }
  }, [department?.department_id, opened]);

  const loadAssignedRooms = async () => {
    if (!department?.department_id) return;
    
    setViewLoading(true);
    try {
      const result = await dispatch(fetchDepartmentRooms(department.department_id));
      if (fetchDepartmentRooms.fulfilled.match(result)) {
        setAssignedRooms(result.payload);
      }
    } catch (error) {
      console.error("Error loading assigned rooms:", error);
    } finally {
      setViewLoading(false);
    }
  };

  // Get faculty blocks when department or faculties change
  useEffect(() => {
    if (department?.faculity_id && opened) {
      // First, fetch faculty blocks to get the actual assigned blocks
      const fetchFacultyData = async () => {
        try {
          // Fetch blocks assigned to this faculty
          const result = await dispatch(fetchFacultyBlocks(department.faculity_id));
          if (fetchFacultyBlocks.fulfilled.match(result)) {
            const facultyAssignedBlocks = result.payload;
            setFacultyBlocks(facultyAssignedBlocks);
            
            // Now filter the main blocks list to only include faculty-assigned blocks
            const filteredBlocks = blocks.filter(block => 
              facultyAssignedBlocks.some(fb => fb.block_id === block.block_id)
            );
            setAvailableBlocks(filteredBlocks);
            
            // If filtered blocks exist, fetch rooms for those blocks
            if (filteredBlocks.length > 0) {
              const blockIds = filteredBlocks.map(b => b.block_id);
              dispatch(fetchRooms({ blockId: blockIds[0] }));
              setSelectedBlock(blockIds[0].toString());
            }
          }
        } catch (error) {
          console.error("Error fetching faculty blocks:", error);
          setFacultyBlocks([]);
          setAvailableBlocks([]);
        }
      };
      
      fetchFacultyData();
    }
  }, [department, faculties, blocks, opened, dispatch]);

  // Update available rooms when selected block changes
  useEffect(() => {
    if (selectedBlock && opened) {
      const blockId = parseInt(selectedBlock);
      const blockRooms = rooms.filter(room => 
        room.block_id === blockId && 
        room.is_available === true &&
        !assignedRooms.some(ar => ar.room_id === room.room_id) // Filter out already assigned rooms
      );
      setAvailableRooms(blockRooms);
    }
  }, [selectedBlock, rooms, opened, assignedRooms]);

  const handleAssignRooms = async () => {
    if (!department || selectedRooms.length === 0) return;
    
    setAssigning(true);
    try {
      const roomIds = selectedRooms.map(id => parseInt(id));
      await onAssign(department.department_id, roomIds);
      await loadAssignedRooms(); // Refresh assigned rooms
      setSelectedRooms([]); // Clear selection
      notifications.show({
        color: "green",
        title: "Success",
        message: `Assigned ${selectedRooms.length} room(s) to department`,
      });
    } catch (error: any) {
      notifications.show({
        color: "red",
        title: "Error",
        message: error.message || "Failed to assign rooms",
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveRoom = async (roomId: number) => {
    if (!department) return;
    
    if (!confirm("Are you sure you want to remove this room from the department?")) {
      return;
    }
    
    try {
      await onRemove(department.department_id, roomId);
      await loadAssignedRooms(); // Refresh assigned rooms
      notifications.show({
        color: "green",
        title: "Success",
        message: "Room removed from department",
      });
    } catch (error: any) {
      notifications.show({
        color: "red",
        title: "Error",
        message: error.message || "Failed to remove room",
      });
    }
  };

  const handleClose = () => {
    setSelectedRooms([]);
    setSelectedBlock(null);
    setRoomSearch("");
    setAssignedRooms([]);
    onClose();
  };

  const filteredRooms = availableRooms.filter(room => 
    roomSearch === "" || 
    room.room_number.toLowerCase().includes(roomSearch.toLowerCase()) ||
    (room.room_name && room.room_name.toLowerCase().includes(roomSearch.toLowerCase()))
  );

  const selectedRoomsData = selectedRooms.map(id => 
    availableRooms.find(room => room.room_id.toString() === id)
  ).filter(Boolean) as Room[];

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="sm">
          <ThemeIcon size="md" radius="lg" color="blue" variant="light">
            <HomeModernIcon className="h-5 w-5" />
          </ThemeIcon>
          <div>
            <Text fw={600}>Manage Department Rooms</Text>
            <Text size="sm" c="dimmed">
              {department?.department_name || "Select department"}
            </Text>
          </div>
        </Group>
      }
      centered
      size="xl"
      radius="lg"
    >
      {!department ? (
        <Alert color="red" title="Error" icon={<XMarkIcon className="h-5 w-5" />}>
          Department information is missing
        </Alert>
      ) : (
        <Stack gap="lg">
          {/* Department Info */}
          <Paper withBorder p="md" radius="md" className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <Group justify="space-between">
              <Group gap="md">
                <Avatar size="lg" radius="md" color="blue">
                  {department.department_name.charAt(0).toUpperCase()}
                </Avatar>
                <div>
                  <Text fw={600} size="lg">{department.department_name}</Text>
                  <Text size="sm" c="dimmed">
                    Faculty: {department.faculity_name || "Not assigned"}
                    {department.faculity_name && ` • ${availableBlocks.length} blocks available`}
                  </Text>
                </div>
              </Group>
              <Badge size="lg" color="blue" variant="light">
                {assignedRooms.length} assigned rooms
              </Badge>
            </Group>
          </Paper>

          <Tabs defaultValue="assigned" variant="outline">
            <Tabs.List grow>
              <Tabs.Tab value="assigned" leftSection={<CheckIcon className="h-4 w-4" />}>
                Assigned Rooms ({assignedRooms.length})
              </Tabs.Tab>
              <Tabs.Tab value="assign" leftSection={<PlusCircleIcon className="h-4 w-4" />}>
                Assign New Rooms
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="assigned" pt="md">
              {viewLoading ? (
                <Center py="xl">
                  <Loader size="md" color="blue" />
                </Center>
              ) : assignedRooms.length === 0 ? (
                <Paper withBorder p="xl" radius="md" className="text-center">
                  <HomeModernIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <Text fw={500} mb="xs">No Rooms Assigned</Text>
                  <Text size="sm" c="dimmed">
                    This department doesn&apos;t have any rooms assigned yet.
                  </Text>
                </Paper>
              ) : (
                <ScrollArea h={400}>
                  <Stack gap="sm">
                    {assignedRooms.map((room) => (
                      <Paper key={room.id} withBorder p="md" radius="md">
                        <Group justify="space-between">
                          <Group gap="sm">
                            <Avatar size="md" radius="md" color="blue" variant="light">
                              <HomeModernIcon className="h-4 w-4" />
                            </Avatar>
                            <div>
                              <Text fw={600}>{room.room_number}</Text>
                              <Text size="sm" c="dimmed">
                                {room.room_name || "Room"} • Block: {room.block_name}
                              </Text>
                              <Text size="xs" c="dimmed">
                                Status: {room.status} • Assigned: {new Date(room.created_at).toLocaleDateString()}
                              </Text>
                            </div>
                          </Group>
                          <Group gap="xs">
                            <Badge 
                              color={room.status === 'active' ? 'green' : 'orange'} 
                              variant="light"
                            >
                              {room.status}
                            </Badge>
                            <ActionIcon
                              color="red"
                              variant="subtle"
                              size="sm"
                              onClick={() => handleRemoveRoom(room.room_id)}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </ActionIcon>
                          </Group>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                </ScrollArea>
              )}
            </Tabs.Panel>

            <Tabs.Panel value="assign" pt="md">
              {!department.faculity_id ? (
                <Alert color="orange" title="Faculty Required" icon={<BuildingOfficeIcon className="h-5 w-5" />}>
                  This department needs to be assigned to a faculty first to access faculty blocks.
                </Alert>
              ) : availableBlocks.length === 0 ? (
                <Alert color="yellow" title="No Blocks Available" icon={<BuildingStorefrontIcon className="h-5 w-5" />}>
                  No building blocks are assigned to the faculty of this department. Please assign blocks to the faculty first.
                </Alert>
              ) : (
                <Stack gap="md">
                  {/* Block Selection */}
                  <Paper withBorder p="md" radius="md">
                    <Text fw={600} mb="md">Select Building Block</Text>
                    <Select
                      data={availableBlocks.map(block => ({
                        value: block.block_id.toString(),
                        label: `${block.block_name} (${block.block_code})`,
                        description: block.description
                      }))}
                      value={selectedBlock}
                      onChange={setSelectedBlock}
                      placeholder="Select a building block"
                      searchable
                      size="md"
                      radius="md"
                    />
                  </Paper>

                  {selectedBlock && (
                    <>
                      <Paper withBorder p="md" radius="md">
                        <Group justify="space-between" mb="md">
                          <div>
                            <Text fw={600}>Available Rooms</Text>
                            <Text size="sm" c="dimmed">
                              {filteredRooms.length} room(s) available in selected block
                            </Text>
                          </div>
                          <TextInput
                            placeholder="Search rooms..."
                            value={roomSearch}
                            onChange={(e) => setRoomSearch(e.target.value)}
                            leftSection={<MagnifyingGlassIcon className="h-4 w-4" />}
                            size="sm"
                            radius="md"
                            style={{ width: 200 }}
                          />
                        </Group>

                        {loading ? (
                          <Center py="xl">
                            <Loader size="md" color="blue" />
                          </Center>
                        ) : filteredRooms.length === 0 ? (
                          <Paper withBorder p="xl" radius="md" className="text-center">
                            <HomeModernIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <Text fw={500} mb="xs">No Rooms Available</Text>
                            <Text size="sm" c="dimmed">
                              {roomSearch 
                                ? "No rooms match your search"
                                : "No available rooms in this block"
                              }
                            </Text>
                          </Paper>
                        ) : (
                          <ScrollArea h={300}>
                            <MultiSelect
                              data={filteredRooms.map(room => ({
                                value: room.room_id.toString(),
                                label: `${room.room_number} - ${room.room_name || room.room_type}`,
                                description: `${room.room_type} • Capacity: ${room.capacity || "N/A"}`
                              }))}
                              value={selectedRooms}
                              onChange={setSelectedRooms}
                              placeholder="Select rooms to assign..."
                              searchable
                              clearable
                              hidePickedOptions
                              maxDropdownHeight={200}
                              size="md"
                              radius="md"
                              nothingFoundMessage="No rooms found"
                            />
                          </ScrollArea>
                        )}
                      </Paper>

                      {selectedRoomsData.length > 0 && (
                        <Paper withBorder p="md" radius="md" className="bg-green-50 border-green-100">
                          <Group justify="space-between" mb="md">
                            <Text fw={600}>Selected Rooms ({selectedRoomsData.length})</Text>
                            <Badge color="green" variant="light">Ready to assign</Badge>
                          </Group>
                          <ScrollArea h={200}>
                            <Stack gap="sm">
                              {selectedRoomsData.map((room) => (
                                <Paper key={room.room_id} withBorder p="sm" radius="md">
                                  <Group justify="space-between">
                                    <Group gap="sm">
                                      <Avatar size="sm" radius="md" color="green" variant="light">
                                        <HomeModernIcon className="h-3 w-3" />
                                      </Avatar>
                                      <div>
                                        <Text fw={500}>{room.room_number}</Text>
                                        <Text size="xs" c="dimmed">
                                          {room.room_name || room.room_type} • Block: {room.block_name}
                                        </Text>
                                      </div>
                                    </Group>
                                    <Badge size="sm" color="green" variant="light">
                                      Capacity: {room.capacity || "N/A"}
                                    </Badge>
                                  </Group>
                                </Paper>
                              ))}
                            </Stack>
                          </ScrollArea>
                        </Paper>
                      )}
                    </>
                  )}

                  <Group justify="flex-end" gap="sm">
                    <Button variant="light" color="gray" onClick={() => setSelectedRooms([])} size="md">
                      Clear Selection
                    </Button>
                    <Button
                      onClick={handleAssignRooms}
                      disabled={!department.faculity_id || selectedRooms.length === 0 || assigning}
                      loading={assigning}
                      size="md"
                      className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                      leftSection={<KeyIcon className="h-5 w-5" />}
                    >
                      {assigning ? "Assigning..." : `Assign ${selectedRooms.length} Room(s)`}
                    </Button>
                  </Group>
                </Stack>
              )}
            </Tabs.Panel>
          </Tabs>

          <Group justify="flex-end" gap="sm">
            <Button variant="light" color="gray" onClick={handleClose} size="md">
              Close
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
};

const ManageDepartments: React.FC = () => {
  const dispatch = useAppDispatch();
  const { 
    departments, 
    loading, 
    error, 
    successMessage 
  } = useAppSelector((state) => state.departments);
  
  const { faculties } = useAppSelector((state) => state.faculty);
  const { blocks, rooms } = useAppSelector((state) => state.rooms);
  
  const [departmentModal, setDepartmentModal] = useState<{
    opened: boolean;
    department: Department | null;
  }>({
    opened: false,
    department: null
  });

  const [roomAssignmentModal, setRoomAssignmentModal] = useState<{
    opened: boolean;
    department: DepartmentWithDetails | null;
  }>({
    opened: false,
    department: null
  });

  const [viewModal, setViewModal] = useState<{
    opened: boolean;
    department: DepartmentWithDetails | null;
  }>({
    opened: false,
    department: null
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFacultyFilter, setSelectedFacultyFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchDepartments());
    dispatch(fetchFaculties());
    dispatch(fetchBlocks());
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

  // Filter departments
  const filteredDepartments = useMemo(() => {
    return departments.filter(dept => {
      const matchesSearch = searchQuery ? 
        dept.department_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dept.faculity_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dept.head_name?.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      
      const matchesFaculty = selectedFacultyFilter ? 
        dept.faculity_id?.toString() === selectedFacultyFilter 
        : true;
      
      return matchesSearch && matchesFaculty;
    });
  }, [departments, searchQuery, selectedFacultyFilter]);

  // Paginated data
  const paginatedDepartments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDepartments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDepartments, currentPage]);

  // Faculty options for filter
  const facultyOptions = useMemo(() => {
    return faculties.map(faculty => ({
      value: faculty.faculity_id.toString(),
      label: faculty.faculity_name
    }));
  }, [faculties]);

  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage);

  if (user === null) { 
    return <Authentication />;
  }

  // Add department
  const handleAddDepartment = () => {
    setDepartmentModal({
      opened: true,
      department: null
    });
  };

  // Edit department
  const handleEditDepartment = (department: Department) => {
    setDepartmentModal({
      opened: true,
      department
    });
  };

  // Assign rooms to department
  const handleAssignRooms = (department: Department) => {
    const departmentWithDetails: DepartmentWithDetails = {
      ...department,
      assigned_rooms: [],
      room_count: 0
    };
    setRoomAssignmentModal({
      opened: true,
      department: departmentWithDetails
    });
  };

  // View department rooms
  const handleViewRooms = (department: Department) => {
    const departmentWithDetails: DepartmentWithDetails = {
      ...department,
      assigned_rooms: [],
      room_count: 0
    };
    setViewModal({
      opened: true,
      department: departmentWithDetails
    });
  };

  // Save department (add or edit)
  const handleSaveDepartment = async (
    id: number | null, 
    name: string, 
    faculity_id: number | null
  ) => {
    setActionLoading(true);
    try {
      if (id === null) {
        await dispatch(addDepartment({ 
          department_name: name, 
          faculity_id 
        })).unwrap();
      } else {
        await dispatch(updateDepartment({ 
          id, 
          departmentName: name, 
          faculity_id 
        })).unwrap();
      }
      dispatch(fetchDepartments());
      notifications.show({
        color: "green",
        title: "Success",
        message: id ? "Department updated successfully" : "Department created successfully",
      });
    } catch (err: any) {
      notifications.show({
        color: "red",
        title: "Error",
        message: err.message || "Failed to save department",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Assign rooms to department
  const handleAssignRoomsToDepartment = async (departmentId: number, roomIds: number[]) => {
    setActionLoading(true);
    try {
      await Promise.all(roomIds.map(roomId => 
        dispatch(assignRoomToDepartment({ departmentId, roomId, status: "active" }))
      ));
      
      // Fetch rooms for the updated block
      const department = departments.find(d => d.department_id === departmentId);
      if (department?.faculity_id) {
        const facultyBlocks = blocks.filter(block => block.faculity_id === department.faculity_id);
        if (facultyBlocks.length > 0) {
          dispatch(fetchRooms({ blockId: facultyBlocks[0].block_id }));
        }
      }
      
      return Promise.resolve();
    } catch (err: any) {
      notifications.show({
        color: "red",
        title: "Error",
        message: err.message || "Failed to assign rooms",
      });
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // Remove room from department
  const handleRemoveRoomFromDepartment = async (departmentId: number, roomId: number) => {
    setActionLoading(true);
    try {
      await dispatch(removeRoomFromDepartment({ departmentId, roomId }));
      return Promise.resolve();
    } catch (err: any) {
      notifications.show({
        color: "red",
        title: "Error",
        message: err.message || "Failed to remove room",
      });
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // Delete department
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this department? This will also remove all room assignments.")) {
      return;
    }
    
    setActionLoading(true);
    try {
      await dispatch(deleteDepartment(id)).unwrap();
      dispatch(fetchDepartments());
      notifications.show({
        color: "green",
        title: "Success",
        message: "Department deleted successfully",
      });
    } catch (err: any) {
      notifications.show({
        color: "red",
        title: "Error",
        message: err.message || "Failed to delete department",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseModal = () => {
    setDepartmentModal({
      opened: false,
      department: null
    });
  };

  const handleCloseRoomAssignmentModal = () => {
    setRoomAssignmentModal({
      opened: false,
      department: null
    });
  };

  const handleCloseViewModal = () => {
    setViewModal({
      opened: false,
      department: null
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedFacultyFilter(null);
  };

  const hasFilters = searchQuery || selectedFacultyFilter;

  return (
    <Container size="xl" py="xl" className="min-h-screen">
      <Stack gap="lg">
        {/* Header */}
        <Box className="relative overflow-hidden rounded-2xl">
          <Stack gap="xs">
            <Group align="center" gap="sm">
              <ThemeIcon size="xl" radius="lg" variant="white" color="blue">
                <AcademicCapIcon className="h-6 w-6" />
              </ThemeIcon>
              <Title order={1} className="text-blue">Department Management</Title>
            </Group>
            <Text className="text-blue-100 max-w-2xl">
              Create, organize, and manage academic departments across faculties. 
              Each department can be assigned to a faculty and have designated department heads and rooms.
            </Text>
          </Stack>
        </Box>

        {/* Stats Cards */}
        <Grid gutter="lg">
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder radius="lg" className="bg-gradient-to-br from-white to-blue-50">
              <Group gap="md">
                <ThemeIcon size="lg" radius="md" color="blue" variant="light">
                  <BuildingOfficeIcon className="h-5 w-5" />
                </ThemeIcon>
                <div>
                  <Text size="sm" c="dimmed" fw={500}>Total Departments</Text>
                  <Title order={3} className="text-blue-700">{departments.length}</Title>
                </div>
              </Group>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder radius="lg" className="bg-gradient-to-br from-white to-green-50">
              <Group gap="md">
                <ThemeIcon size="lg" radius="md" color="green" variant="light">
                  <UserCircleIcon className="h-5 w-5" />
                </ThemeIcon>
                <div>
                  <Text size="sm" c="dimmed" fw={500}>With Heads</Text>
                  <Title order={3} className="text-green-700">
                    {departments.filter(d => d.head_name).length}
                  </Title>
                </div>
              </Group>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder radius="lg" className="bg-gradient-to-br from-white to-orange-50">
              <Group gap="md">
                <ThemeIcon size="lg" radius="md" color="orange" variant="light">
                  <BuildingOfficeIcon className="h-5 w-5" />
                </ThemeIcon>
                <div>
                  <Text size="sm" c="dimmed" fw={500}>Assigned to Faculty</Text>
                  <Title order={3} className="text-orange-700">
                    {departments.filter(d => d.faculity_name).length}
                  </Title>
                </div>
              </Group>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder radius="lg" className="bg-gradient-to-br from-white to-purple-50">
              <Group gap="md">
                <ThemeIcon size="lg" radius="md" color="purple" variant="light">
                  <HomeModernIcon className="h-5 w-5" />
                </ThemeIcon>
                <div>
                  <Text size="sm" c="dimmed" fw={500}>With Rooms</Text>
                  <Title order={3} className="text-purple-700">
                    {departments.filter(d => d.faculity_name).length} {/* Update with actual room count */}
                  </Title>
                </div>
              </Group>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Search and Filter Section */}
        <Card withBorder radius="lg" shadow="sm">
          <Stack gap="md">
            <Group justify="space-between">
              <Group gap="xs">
                <Text fw={600} size="lg">Departments</Text>
                <Badge variant="light" color="blue" size="lg">
                  {filteredDepartments.length} found
                </Badge>
              </Group>
              
              <Group>
                <Button 
                  onClick={handleAddDepartment}
                  leftSection={<PlusCircleIcon className="h-5 w-5" />}
                  loading={loading}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  size="md"
                >
                  Add Department
                </Button>
              </Group>
            </Group>

            <Group gap="md" align="flex-end">
              <Input
                placeholder="Search departments, faculty, or heads..."
                leftSection={<MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
                size="md"
                radius="md"
                rightSection={
                  searchQuery && (
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      onClick={() => setSearchQuery("")}
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </ActionIcon>
                  )
                }
              />
              
              <Button
                variant="light"
                leftSection={<FunnelIcon className="h-4 w-4" />}
                onClick={() => setShowFilters(!showFilters)}
                color={showFilters ? "blue" : "gray"}
                size="md"
              >
                Filters
              </Button>
              
              {hasFilters && (
                <Button
                  variant="subtle"
                  color="red"
                  leftSection={<XMarkIcon className="h-4 w-4" />}
                  onClick={clearFilters}
                  size="md"
                >
                  Clear Filters
                </Button>
              )}
            </Group>

            {showFilters && (
              <Paper withBorder p="md" radius="md" className="bg-gray-50">
                <Select
                  label="Filter by Faculty"
                  placeholder="All faculties"
                  data={facultyOptions}
                  value={selectedFacultyFilter}
                  onChange={setSelectedFacultyFilter}
                  clearable
                  searchable
                />
              </Paper>
            )}

            {/* Active Filters */}
            {hasFilters && (
              <Paper withBorder p="sm" radius="md" className="bg-blue-50">
                <Group gap="xs">
                  <Text size="sm" fw={500}>Active Filters:</Text>
                  {searchQuery && (
                    <Badge variant="light" color="blue">
                      Search: {searchQuery}
                    </Badge>
                  )}
                  {selectedFacultyFilter && (
                    <Badge variant="light" color="green">
                      Faculty: {faculties.find(f => f.faculity_id.toString() === selectedFacultyFilter)?.faculity_name || selectedFacultyFilter}
                    </Badge>
                  )}
                </Group>
              </Paper>
            )}
          </Stack>
        </Card>

        {/* Error and Success Messages */}
        {error && (
          <Alert 
            color="red" 
            title="Error" 
            withCloseButton 
            onClose={() => dispatch(clearError())}
            radius="md"
            icon={<XMarkIcon className="h-5 w-5" />}
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
            icon={<CheckIcon className="h-5 w-5" />}
          >
            {successMessage}
          </Alert>
        )}

        {/* Departments Table */}
        <Card withBorder radius="lg" shadow="sm" className="overflow-hidden">
          {loading && departments.length === 0 ? (
            <Center py="xl">
              <Stack align="center" gap="md">
                <Loader size="lg" color="blue" />
                <Text c="dimmed">Loading departments...</Text>
              </Stack>
            </Center>
          ) : filteredDepartments.length === 0 ? (
            <Center py="xl">
              <Stack align="center" gap="md">
                <ThemeIcon size="xl" radius="lg" color="gray" variant="light">
                  <AcademicCapIcon className="h-8 w-8" />
                </ThemeIcon>
                <Text size="lg" fw={500} c="dimmed">
                  {hasFilters ? "No departments match your filters" : "No departments found"}
                </Text>
                <Text c="dimmed" ta="center">
                  {hasFilters 
                    ? "Try adjusting your search or filters"
                    : "Get started by creating your first department"
                  }
                </Text>
                <Button 
                  onClick={handleAddDepartment}
                  leftSection={<PlusCircleIcon className="h-4 w-4" />}
                  variant={hasFilters ? "light" : "filled"}
                  color={hasFilters ? "blue" : "blue"}
                >
                  Create Department
                </Button>
              </Stack>
            </Center>
          ) : (
            <>
              <ScrollArea>
                <Table verticalSpacing="md" highlightOnHover>
                  <Table.Thead className="bg-gray-50">
                    <Table.Tr>
                      <Table.Th>#</Table.Th>
                      <Table.Th style={{ minWidth: 250 }}>
                        <Group gap="xs">
                          <AcademicCapIcon className="h-4 w-4" />
                          <Text fw={600}>Department</Text>
                        </Group>
                      </Table.Th>
                      <Table.Th style={{ minWidth: 200 }}>
                        <Group gap="xs">
                          <BuildingOfficeIcon className="h-4 w-4" />
                          <Text fw={600}>Faculty</Text>
                        </Group>
                      </Table.Th>
                      <Table.Th style={{ minWidth: 200 }}>
                        <Group gap="xs">
                          <UserCircleIcon className="h-4 w-4" />
                          <Text fw={600}>Department Head</Text>
                        </Group>
                      </Table.Th>
                      <Table.Th style={{ minWidth: 150 }}>
                        <Group gap="xs">
                          <HomeModernIcon className="h-4 w-4" />
                          <Text fw={600}>Rooms</Text>
                        </Group>
                      </Table.Th>
                      <Table.Th style={{ minWidth: 150, textAlign: 'center' }}>
                        <Text fw={600}>Status</Text>
                      </Table.Th>
                      <Table.Th style={{ minWidth: 250 }}>
                        <Text fw={600}>Actions</Text>
                      </Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {paginatedDepartments.map((dept, index) => (
                      <Table.Tr key={dept.department_id} className="hover:bg-blue-50/50 transition-colors">
                        <Table.Td>{(currentPage - 1) * itemsPerPage + index + 1}</Table.Td>
                        <Table.Td>
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
                              <Text fw={600} className="text-gray-900">
                                {dept.department_name}
                              </Text>
                              <Text size="xs" c="dimmed">
                                ID: {dept.department_id}
                              </Text>
                            </div>
                          </Group>
                        </Table.Td>
                        
                        <Table.Td>
                          {dept.faculity_name ? (
                            <Badge 
                              color="blue" 
                              variant="light" 
                              size="lg"
                              leftSection={<BuildingOfficeIcon className="h-3 w-3 mr-1" />}
                              className="border border-blue-200"
                            >
                              {dept.faculity_name}
                            </Badge>
                          ) : (
                            <Badge 
                              color="gray" 
                              variant="outline" 
                              size="lg"
                              className="border-dashed"
                            >
                              Not Assigned
                            </Badge>
                          )}
                        </Table.Td>
                        
                        <Table.Td>
                          {dept.head_name ? (
                            <Group gap="sm">
                              <Avatar size="sm" radius="xl" color="green">
                                {dept.head_name.charAt(0).toUpperCase()}
                              </Avatar>
                              <div>
                                <Text fw={500}>{dept.head_name}</Text>
                                <Text size="xs" c="dimmed">Head of Department</Text>
                              </div>
                            </Group>
                          ) : (
                            <Badge 
                              color="yellow" 
                              variant="light" 
                              size="lg"
                              leftSection={<UserCircleIcon className="h-3 w-3 mr-1" />}
                            >
                              Vacant Position
                            </Badge>
                          )}
                        </Table.Td>
                        
                        <Table.Td>
                          <Group gap="xs">
                            <Button
                              variant="light"
                              color="teal"
                              size="sm"
                              onClick={() => handleAssignRooms(dept)}
                              leftSection={<KeyIcon className="h-3 w-3" />}
                              disabled={!dept.faculity_id}
                            >
                              Assign
                            </Button>
                            <Button
                              variant="subtle"
                              color="blue"
                              size="sm"
                              onClick={() => handleViewRooms(dept)}
                              leftSection={<EyeIcon className="h-3 w-3" />}
                              disabled={!dept.faculity_id}
                            >
                              View
                            </Button>
                          </Group>
                        </Table.Td>
                        
                        <Table.Td>
                          <Center>
                            <Badge 
                              color={dept.faculity_name && dept.head_name ? "green" : "orange"}
                              variant="light"
                              size="lg"
                              radius="sm"
                            >
                              {dept.faculity_name && dept.head_name ? "Complete" : "Incomplete"}
                            </Badge>
                          </Center>
                        </Table.Td>
                        
                        <Table.Td>
                          <Group gap="xs">
                            <Tooltip label="Edit department">
                              <ActionIcon
                                variant="light"
                                color="blue"
                                size="lg"
                                onClick={() => handleEditDepartment(dept)}
                                disabled={actionLoading}
                              >
                                <PencilSquareIcon className="h-4 w-4" />
                              </ActionIcon>
                            </Tooltip>
                            
                            <Tooltip label="Manage rooms">
                              <ActionIcon
                                variant="light"
                                color="teal"
                                size="lg"
                                onClick={() => handleAssignRooms(dept)}
                                disabled={actionLoading || !dept.faculity_id}
                              >
                                <HomeModernIcon className="h-4 w-4" />
                              </ActionIcon>
                            </Tooltip>
                            
                            <Tooltip label="Delete department">
                              <ActionIcon
                                variant="light"
                                color="red"
                                size="lg"
                                onClick={() => handleDelete(dept.department_id)}
                                disabled={actionLoading}
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
              </ScrollArea>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <Box p="md" className="bg-gray-50 border-t">
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                      {Math.min(currentPage * itemsPerPage, filteredDepartments.length)} of{' '}
                      {filteredDepartments.length} departments
                    </Text>
                    <Pagination
                      value={currentPage}
                      onChange={setCurrentPage}
                      total={totalPages}
                      radius="md"
                      size="sm"
                      withEdges
                    />
                  </Group>
                </Box>
              )}
            </>
          )}
        </Card>

        {/* Department Modal */}
        <DepartmentModal
          opened={departmentModal.opened}
          onClose={handleCloseModal}
          department={departmentModal.department}
          onSave={handleSaveDepartment}
        />

        {/* Room Assignment Modal */}
        <RoomAssignmentModal
          opened={roomAssignmentModal.opened}
          onClose={handleCloseRoomAssignmentModal}
          department={roomAssignmentModal.department}
          onAssign={handleAssignRoomsToDepartment}
          onRemove={handleRemoveRoomFromDepartment}
        />

        {/* View Rooms Modal */}
        <Modal
          opened={viewModal.opened}
          onClose={handleCloseViewModal}
          title={
            <Group gap="sm">
              <ThemeIcon size="md" radius="lg" color="blue" variant="light">
                <EyeIcon className="h-5 w-5" />
              </ThemeIcon>
              <div>
                <Text fw={600}>Department Rooms</Text>
                <Text size="sm" c="dimmed">
                  {viewModal.department?.department_name || "Select department"}
                </Text>
              </div>
            </Group>
          }
          centered
          size="lg"
          radius="lg"
        >
          {viewModal.department && (
            <Stack gap="md">
              <Paper withBorder p="md" radius="md" className="bg-blue-50">
                <Group gap="md">
                  <Avatar size="lg" radius="md" color="blue">
                    {viewModal.department.department_name.charAt(0).toUpperCase()}
                  </Avatar>
                  <div>
                    <Text fw={600} size="lg">{viewModal.department.department_name}</Text>
                    <Text size="sm" c="dimmed">
                      Faculty: {viewModal.department.faculity_name || "Not assigned"}
                    </Text>
                  </div>
                </Group>
              </Paper>
              
              <Button
                fullWidth
                variant="light"
                color="teal"
                onClick={() => {
                  handleCloseViewModal();
                  handleAssignRooms(viewModal.department!);
                }}
                leftSection={<KeyIcon className="h-4 w-4" />}
                disabled={!viewModal.department.faculity_id}
              >
                Manage Department Rooms
              </Button>
              
              <Text size="sm" c="dimmed" ta="center">
                Click the button above to assign or remove rooms for this department
              </Text>
            </Stack>
          )}
        </Modal>
      </Stack>
    </Container>
  );
};

export default ManageDepartments;