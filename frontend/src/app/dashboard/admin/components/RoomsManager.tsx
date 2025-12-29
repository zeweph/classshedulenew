/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Title,
  Text,
  Table,
  Button,
  Group,
  ActionIcon,
  Modal,
  TextInput,
  Select,
  NumberInput,
  MultiSelect,
  Loader,
  Alert,
  Badge,
  Stack,
  Grid,
  Paper,
  Input,
} from "@mantine/core";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  HomeModernIcon,
  CheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useForm } from "@mantine/form";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchRooms,
  fetchBlocks,
  addRoom,
  updateRoom,
  deleteRoom,
  clearError,
  clearSuccessMessage,
  Room,
  RoomFormData,
} from "@/store/slices/roomsSlice";

const RoomsManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const { rooms, blocks, loading, error, successMessage } = useAppSelector((state) => state.rooms);
  
  const [modalOpened, setModalOpened] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [selectedRoomType, setSelectedRoomType] = useState<string | null>(null);
  const [minCapacity, setMinCapacity] = useState<number | "">("");
  const [maxCapacity, setMaxCapacity] = useState<number | "">("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"room_number" | "capacity" | "block_name">("room_number");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const form = useForm({
    initialValues: {
      block_id: "",
      room_number: "",
      room_name: "",
      room_type: "classroom",
      capacity: 30,
      facilities: [] as string[],
      is_available: true,
    },
    validate: {
      block_id: (value) => (value ? null : "Block is required"),
      room_number: (value) => (value.trim().length < 1 ? "Room number is required" : null),
      room_type: (value) => (value ? null : "Room type is required"),
    },
  });

  // Room type options
  const roomTypeOptions = [
    { value: "classroom", label: "Classroom" },
    { value: "lab", label: "Laboratory" },
    { value: "office", label: "Office" },
    { value: "conference", label: "Conference Room" },
    { value: "library", label: "Library" },
    { value: "auditorium", label: "Auditorium" },
    { value: "other", label: "Other" },
  ];

  // Facilities options
  const facilitiesOptions = [
    { value: "projector", label: "Projector" },
    { value: "ac", label: "Air Conditioning" },
    { value: "computers", label: "Computers" },
    { value: "whiteboard", label: "Whiteboard" },
    { value: "sound_system", label: "Sound System" },
    { value: "lab_equipment", label: "Lab Equipment" },
    { value: "fume_hood", label: "Fume Hood" },
    { value: "wifi", label: "WiFi" },
  ];

  // Block options for filter
  const blockOptions = [
  // Always include "All blocks" option
  { value: '', label: 'All blocks' },
  // Map your blocks with safety checks
  ...(Array.isArray(blocks) 
    ? blocks
        .filter(block => block && (block.block_name || block.block_id))
        .map(block => ({
          value: String(block.block_id || block.block_name || ''),
          label: block.block_name || `Block ${block.block_id || 'Unknown'}`
        }))
    : []
  )
];

  // Facilities options for filter
  const allFacilities = useMemo(() => {
    const facilities = new Set<string>();
    rooms.forEach(room => {
      if (room.facilities) {
        room.facilities.forEach(facility => facilities.add(facility));
      }
    });
    return Array.from(facilities).map(facility => ({
      value: facility,
      label: facility.charAt(0).toUpperCase() + facility.slice(1).replace('_', ' '),
    }));
  }, [rooms]);

  // Fetch data on component mount
  useEffect(() => {
    console.log("Dispatching fetch actions...");
    dispatch(fetchRooms());
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

  // Handle form submission
  const handleSubmit = async (values: typeof form.values) => {
    setActionLoading(true);
    try {
      const payload: RoomFormData = {
        block_id: parseInt(values.block_id),
        room_number: values.room_number.trim(),
        room_name: values.room_name?.trim() || undefined,
        room_type: values.room_type,
        capacity: values.capacity && values.capacity > 0 ? values.capacity : undefined,
        facilities: values.facilities || [],
        is_available: values.is_available,
      };

      console.log('Submitting room data:', payload);

      if (editingRoom) {
        await dispatch(updateRoom({
          roomId: editingRoom.room_id,
          roomData: payload
        })).unwrap();
      } else {
        await dispatch(addRoom(payload)).unwrap();
      }
      
      setModalOpened(false);
      form.reset();
      setEditingRoom(null);
      dispatch(fetchRooms());
    } catch (err) {
      console.error('Error in handleSubmit:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Block options for form
  const blockOption = blocks.map(block => ({
    value: block.block_id.toString(),
    label: `${block.block_name} (${block.block_code})`
  }));

  // Handle edit
  const handleEdit = (room: Room) => {
    console.log('Editing room:', room);
    setEditingRoom(room);
    form.setValues({
      block_id: room.block_id?.toString(),
      room_number: room.room_number,
      room_name: room.room_name || "",
      room_type: room.room_type,
      capacity: room.capacity || 30,
      facilities: room.facilities || [],
      is_available: room.is_available,
    });
    setModalOpened(true);
  };

  // Handle delete
  const handleDelete = async (roomId: number) => {
    if (!confirm("Are you sure you want to delete this room?")) {
      return;
    }

    setActionLoading(true);
    try {
      console.log('Deleting room with ID:', roomId);
      await dispatch(deleteRoom(roomId)).unwrap();
      dispatch(fetchRooms());
    } catch (err) {
      console.error('Error in handleDelete:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpened(false);
    setEditingRoom(null);
    form.reset();
  };

  const getRoomTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      classroom: "blue",
      lab: "green",
      office: "orange",
      conference: "purple",
      library: "cyan",
      auditorium: "red",
      other: "gray",
    };
    return colors[type] || "gray";
  };

  // Format room type for display
  const formatRoomType = (type: string) => {
    const typeMap: { [key: string]: string } = {
      classroom: "Classroom",
      lab: "Laboratory",
      office: "Office",
      conference: "Conference Room",
      library: "Library",
      auditorium: "Auditorium",
      other: "Other",
    };
    return typeMap[type] || type;
  };

  // Filter rooms based on all criteria
  const filteredRooms = useMemo(() => {
    let filtered = [...rooms];

    // Search query filter
   if (searchQuery) {
  const query = searchQuery.toLowerCase();
  filtered = filtered.filter(room => {
    const roomNumber = room.room_number?.toLowerCase() || '';
    const roomName = room.room_name?.toLowerCase() || '';
    const blockName = room.block_name?.toLowerCase() || '';
    
    return (
      roomNumber.includes(query) ||
      roomName.includes(query) ||
      blockName.includes(query)
    );
  });
}

    // Block filter
    if (selectedBlock) {
      filtered = filtered.filter(room => room.block_name === selectedBlock);
    }

    // Room type filter
    if (selectedRoomType) {
      filtered = filtered.filter(room => room.room_type === selectedRoomType);
    }

    // Capacity filters
    if (minCapacity !== "") {
      filtered = filtered.filter(room => (room.capacity || 0) >= minCapacity);
    }
    if (maxCapacity !== "") {
      filtered = filtered.filter(room => (room.capacity || 0) <= maxCapacity);
    }

    // Status filter
    if (selectedStatus) {
      const isAvailable = selectedStatus === "available";
      filtered = filtered.filter(room => room.is_available === isAvailable);
    }

    // Facilities filter
    if (selectedFacilities.length > 0) {
      filtered = filtered.filter(room =>
        selectedFacilities.every(facility =>
          room.facilities?.includes(facility)
        )
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case "room_number":
          aValue = a.room_number;
          bValue = b.room_number;
          break;
        case "capacity":
          aValue = a.capacity || 0;
          bValue = b.capacity || 0;
          break;
        case "block_name":
          aValue = a.block_name;
          bValue = b.block_name;
          break;
        default:
          aValue = a.room_number;
          bValue = b.room_number;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [
    rooms,
    searchQuery,
    selectedBlock,
    selectedRoomType,
    minCapacity,
    maxCapacity,
    selectedStatus,
    selectedFacilities,
    sortBy,
    sortOrder
  ]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedBlock(null);
    setSelectedRoomType(null);
    setMinCapacity("");
    setMaxCapacity("");
    setSelectedStatus(null);
    setSelectedFacilities([]);
  };

  // Check if any filter is active
  const hasActiveFilters = () => {
    return searchQuery ||
      selectedBlock ||
      selectedRoomType ||
      minCapacity !== "" ||
      maxCapacity !== "" ||
      selectedStatus ||
      selectedFacilities.length > 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Group justify="space-between">
        <div>
          <Title order={2} className="text-gray-900">
            Rooms Management
          </Title>
          <Text c="dimmed">Manage rooms across all floors and blocks</Text>
        </div>
        <Button
          leftSection={<PlusIcon className="h-5 w-5" />}
          onClick={() => setModalOpened(true)}
          loading={loading}
        >
          Add Room
        </Button>
      </Group>

      {/* Search and Filter Section */}
      <Card withBorder radius="md" className="relative">
        <Stack gap="md">
          {/* Search Bar */}
          <Group>
            <Input
              placeholder="Search by room number, name, or block..."
              leftSection={<MagnifyingGlassIcon className="h-4 w-4" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
              rightSection={
                searchQuery && (
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    onClick={() => setSearchQuery("")}
                  >
                    <XCircleIcon className="h-4 w-4" />
                  </ActionIcon>
                )
              }
            />
            <Button
              variant="light"
              leftSection={<FunnelIcon className="h-4 w-4" />}
              onClick={() => setShowFilters(!showFilters)}
              color={showFilters ? "blue" : "gray"}
            >
              Filters {hasActiveFilters() && `(${filteredRooms.length}/${rooms.length})`}
            </Button>
            <Button
              variant="subtle"
              leftSection={<ArrowsUpDownIcon className="h-4 w-4" />}
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              Sort {sortOrder === "asc" ? "↑" : "↓"}
            </Button>
            {hasActiveFilters() && (
              <Button
                variant="subtle"
                color="red"
                leftSection={<XCircleIcon className="h-4 w-4" />}
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            )}
          </Group>

          {/* Filters Panel */}
          {showFilters && (
            <Paper withBorder p="md" className="bg-gray-50">
              <Stack gap="md">
                <Group align="flex-start" grow>
                  {/* Block Filter */}
                  <Select
                    label="Filter by Block"
                    placeholder="All blocks"
                    data={blockOptions}
                    value={selectedBlock}
                    onChange={setSelectedBlock}
                    clearable
                    searchable
                  />

                  {/* Room Type Filter */}
                  <Select
                    label="Filter by Room Type"
                    placeholder="All types"
                    data={roomTypeOptions}
                    value={selectedRoomType}
                    onChange={setSelectedRoomType}
                    clearable
                  />

                  {/* Status Filter */}
                  <Select
                    label="Filter by Status"
                    placeholder="All statuses"
                    data={[
                      { value: "available", label: "Available" },
                      { value: "unavailable", label: "Unavailable" },
                    ]}
                    value={selectedStatus}
                    onChange={setSelectedStatus}
                    clearable
                  />
                </Group>

                <Group align="flex-start" grow>
                  {/* Capacity Range */}
                  <div>
                    <Text size="sm" fw={500} mb="xs">Capacity Range</Text>
                    <Group>
                      <NumberInput
                        placeholder="Min"
                        value={minCapacity}
                        onChange={(value) => setMinCapacity(value === '' ? '' : Number(value))}                        min={1}
                        className="flex-1"
                      />
                      <Text size="sm">to</Text>
                      <NumberInput
                        placeholder="Max"
                        value={maxCapacity}
                         onChange={(value) => setMaxCapacity(value === '' ? '' : Number(value))}
                        min={1}
                        className="flex-1"
                      />
                    </Group>
                  </div>

                  {/* Facilities Filter */}
                  <MultiSelect
                    label="Filter by Facilities"
                    placeholder="Select facilities"
                    data={allFacilities}
                    value={selectedFacilities}
                    onChange={setSelectedFacilities}
                    clearable
                    searchable
                  />
                </Group>

                {/* Sort Options */}
                <div>
                  <Text size="sm" fw={500} mb="xs">Sort By</Text>
                  <Group>
                    {[
                      { value: "room_number", label: "Room Number" },
                      { value: "capacity", label: "Capacity" },
                      { value: "block_name", label: "Block Name" },
                    ].map((option) => (
                      <Button
                        key={option.value}
                        variant={sortBy === option.value ? "filled" : "light"}
                        size="xs"
                        onClick={() => setSortBy(option.value as any)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </Group>
                </div>
              </Stack>
            </Paper>
          )}

          {/* Active Filters Summary */}
          {hasActiveFilters() && (
            <Paper withBorder p="sm" className="bg-blue-50">
              <Group gap="xs">
                <Text size="sm" fw={500}>Active Filters:</Text>
                {searchQuery && (
                  <Badge variant="light" color="blue">
                    Search: {searchQuery}
                  </Badge>
                )}
                {selectedBlock && (
                  <Badge variant="light" color="green">
                    Block: {selectedBlock}
                  </Badge>
                )}
                {selectedRoomType && (
                  <Badge variant="light" color="orange">
                    Type: {formatRoomType(selectedRoomType)}
                  </Badge>
                )}
                {selectedStatus && (
                  <Badge variant="light" color={selectedStatus === "available" ? "green" : "red"}>
                    Status: {selectedStatus === "available" ? "Available" : "Unavailable"}
                  </Badge>
                )}
                {(minCapacity !== "" || maxCapacity !== "") && (
                  <Badge variant="light" color="cyan">
                    Capacity: {minCapacity !== "" ? `≥${minCapacity}` : ""}
                    {minCapacity !== "" && maxCapacity !== "" && " - "}
                    {maxCapacity !== "" ? `≤${maxCapacity}` : ""}
                  </Badge>
                )}
                {selectedFacilities.length > 0 && (
                  <Badge variant="light" color="purple">
                    Facilities: {selectedFacilities.length}
                  </Badge>
                )}
              </Group>
            </Paper>
          )}
        </Stack>
      </Card>

      {/* Stats Summary */}
      <Group grow>
        <Card withBorder padding="md" radius="md">
          <Text size="sm" c="dimmed">Total Rooms</Text>
          <Title order={3}>{rooms.length}</Title>
        </Card>
        <Card withBorder padding="md" radius="md">
          <Text size="sm" c="dimmed">Filtered Rooms</Text>
          <Title order={3}>{filteredRooms.length}</Title>
        </Card>
        <Card withBorder padding="md" radius="md">
          <Text size="sm" c="dimmed">Available Rooms</Text>
          <Title order={3}>{rooms.filter(r => r.is_available).length}</Title>
        </Card>
        <Card withBorder padding="md" radius="md">
          <Text size="sm" c="dimmed">Blocks</Text>
          <Title order={3}>{blockOptions.length}</Title>
        </Card>
      </Group>

      {/* Error Alert */}
      {error && (
        <Alert color="red" title="Error" withCloseButton onClose={() => dispatch(clearError())}>
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {successMessage && (
        <Alert color="green" title="Success" withCloseButton onClose={() => dispatch(clearSuccessMessage())}>
          {successMessage}
        </Alert>
      )}

      {/* Rooms Table */}
      <Card withBorder radius="md">
        {loading && rooms.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <Loader size="lg" />
            <Text ml="md">Loading rooms...</Text>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center py-12">
            <HomeModernIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <Text c="dimmed" size="lg" mb="md">
              {hasActiveFilters() ? "No rooms match your filters" : "No rooms found"}
            </Text>
            {hasActiveFilters() ? (
              <Button
                variant="light"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            ) : (
              <Button
                leftSection={<PlusIcon className="h-5 w-5" />}
                onClick={() => setModalOpened(true)}
                disabled={blocks.length === 0}
                loading={loading}
              >
                Add Your First Room
              </Button>
            )}
          </div>
        ) : (
          <Table.ScrollContainer minWidth={800}>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>#</Table.Th>
                  <Table.Th>Room Number</Table.Th>
                  <Table.Th>Room Name</Table.Th>
                  <Table.Th>Location</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Capacity</Table.Th>
                  <Table.Th>Facilities</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredRooms.map((room, index) => (
                  <Table.Tr key={room.room_id}>
                    <Table.Td>
                      <Text fw={500}>{index + 1}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={500}>{room.room_number}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text>{room.room_name || "—"}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" color="blue">
                        {room.block_name}-({room.block_code})
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" color={getRoomTypeColor(room.room_type)}>
                        {formatRoomType(room.room_type)}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text>{room.capacity || "—"}</Text>
                    </Table.Td>
                    <Table.Td>
                      {room.facilities && room.facilities.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {room.facilities.slice(0, 2).map((facility, idx) => (
                            <Badge key={idx} variant="dot" size="xs">
                              {facility}
                            </Badge>
                          ))}
                          {room.facilities.length > 2 && (
                            <Badge variant="light" size="xs">
                              +{room.facilities.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <Text c="dimmed" size="sm">None</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={room.is_available ? "green" : "red"}
                        variant="light"
                        leftSection={
                          room.is_available ? (
                            <CheckIcon className="h-3 w-3" />
                          ) : (
                            <XMarkIcon className="h-3 w-3" />
                          )
                        }
                      >
                        {room.is_available ? "Available" : "Unavailable"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          color="blue"
                          variant="light"
                          onClick={() => handleEdit(room)}
                          disabled={actionLoading}
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </ActionIcon>
                        <ActionIcon
                          color="red"
                          variant="light"
                          onClick={() => handleDelete(room.room_id)}
                          disabled={actionLoading}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        opened={modalOpened}
        onClose={handleCloseModal}
        title={editingRoom ? `Edit Room - ${editingRoom.room_number}` : "Add New Room"}
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <Select
              label="Block"
              placeholder="Select a block"
              data={blockOption}
              required
              searchable
              nothingFoundMessage="No block found"
              {...form.getInputProps("block_id")}
            />
            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  label="Room Number"
                  placeholder="e.g., 101, A12"
                  required
                  {...form.getInputProps("room_number")}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Select
                  label="Room Type"
                  data={roomTypeOptions}
                  required
                  {...form.getInputProps("room_type")}
                />
              </Grid.Col>
            </Grid>

            <TextInput
              label="Room Name"
              placeholder="e.g., Chemistry Lab, Main Hall"
              {...form.getInputProps("room_name")}
            />

            <NumberInput
              label="Capacity"
              placeholder="Number of people"
              min={1}
              {...form.getInputProps("capacity")}
            />

            <MultiSelect
              label="Facilities"
              placeholder="Select facilities"
              data={facilitiesOptions}
              clearable
              searchable
              nothingFoundMessage="Nothing found"
              {...form.getInputProps("facilities")}
            />

            <Select
              label="Availability"
              data={[
                { value: "true", label: "Available" },
                { value: "false", label: "Unavailable" },
              ]}
              value={form.values.is_available.toString()}
              onChange={(value) => form.setFieldValue("is_available", value === "true")}
            />

            <Group justify="flex-end" mt="md">
              <Button 
                variant="outline" 
                onClick={handleCloseModal}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                loading={actionLoading}
              >
                {editingRoom ? "Update Room" : "Add Room"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </div>
  );
};

export default RoomsManager;