/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Title,
  Card,
  Table,
  Button,
  Group,
  Text,
  LoadingOverlay,
  Badge,
  ActionIcon,
  Paper,
  Stack,
  ScrollArea,
  Box,
  Select,
  SegmentedControl,
  Tooltip,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { 
  IconPlus, 
  IconEdit, 
  IconTrash, 
  IconRefresh, 
  IconCalendar,
  IconClock,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconInfoCircle,
} from '@tabler/icons-react';

import { 
  fetchSemesters,
  updateSemesterStatus,
  deleteSemester,
  autoUpdateExpiredSemesters,
  selectSemesters, 
  selectSemestersLoading, 
  selectSemestersError,
  selectSemestersSuccessMessage,
  selectCompletedSemesters,
  selectActiveSemesters,
  selectUpcomingSemesters,
  selectInactiveSemesters,
  clearError,
  clearSuccessMessage
} from '../../../../store/slices/semesterSlice';
import { fetchBatches, selectBatches } from '../../../../store/slices/batchSlice';
import SemesterForm from './SemesterForm';
import { CheckCircleIcon, XCircleIcon, ClockIcon, CalendarIcon } from '@heroicons/react/24/outline';

interface Semester {
  id: number;
  semester: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'inactive' | 'completed' | 'upcoming';
  batch_id: number;
  batch_year?: string;
}

interface Batch {
  batch_id: number;
  batch_year: string;
}

const SEMESTER_DISPLAY: { [key: string]: string } = {
  'SEMESTER_1': 'Sem 1', 'SEMESTER_2': 'Sem 2', 'SEMESTER_3': 'Sem 3', 'SEMESTER_4': 'Sem 4',
  'SEMESTER_5': 'Sem 5', 'SEMESTER_6': 'Sem 6', 'SEMESTER_7': 'Sem 7', 'SEMESTER_8': 'Sem 8',
  'FALL': 'Fall', 'SPRING': 'Spring', 'SUMMER': 'Summer', 'WINTER': 'Winter',
};

// Define filter types
type FilterType = 'all' | 'active' | 'inactive' | 'completed' | 'upcoming';

const STATUS_CONFIG = {
  active: { color: 'green', label: 'Active', icon: CheckCircleIcon },
  inactive: { color: 'gray', label: 'Inactive', icon: XCircleIcon },
  completed: { color: 'blue', label: 'Completed', icon: CalendarIcon },
  upcoming: { color: 'yellow', label: 'Upcoming', icon: ClockIcon },
} as const;

export default function SemesterManagement() {
  const dispatch = useDispatch();

  const semesters = useSelector(selectSemesters);
  const completedSemesters = useSelector(selectCompletedSemesters);
  const activeSemesters = useSelector(selectActiveSemesters);
  const upcomingSemesters = useSelector(selectUpcomingSemesters);
  const inactiveSemesters = useSelector(selectInactiveSemesters);
  
  const batches = useSelector(selectBatches);
  const loading = useSelector(selectSemestersLoading);
  const error = useSelector(selectSemestersError);
  const successMessage = useSelector(selectSemestersSuccessMessage);

  const [formOpened, setFormOpened] = useState(false);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedBatch, setSelectedBatch] = useState<string | null>('all');

  // SAFE INITIALIZATION
  const safeSemesters: Semester[] = Array.isArray(semesters) ? semesters : [];
  const safeBatches: Batch[] = Array.isArray(batches) ? batches : [];

  // Get semesters based on filter
  const getFilteredSemesters = useCallback(() => {
    const filtered = safeSemesters;
    
    if (filter === 'completed') {
      return completedSemesters;
    } else if (filter === 'active') {
      return activeSemesters;
    } else if (filter === 'upcoming') {
      return upcomingSemesters;
    } else if (filter === 'inactive') {
      return inactiveSemesters;
    }
    
    return filtered;
  }, [filter, safeSemesters, completedSemesters, activeSemesters, upcomingSemesters, inactiveSemesters]);

  // Further filter by batch if selected
  const filteredSemesters = selectedBatch && selectedBatch !== 'all' 
    ? getFilteredSemesters().filter(semester => semester.batch_id === parseInt(selectedBatch))
    : getFilteredSemesters();

  // Load data on component mount
  useEffect(() => {
    dispatch(fetchSemesters() as any);
    dispatch(fetchBatches() as any);
  }, [dispatch]);

  // Handle messages
  useEffect(() => {
    if (successMessage) {
      notifications.show({ 
        title: 'Success', 
        message: successMessage, 
        color: 'green',
        icon: <IconCheck size={16} />
      });
      dispatch(clearSuccessMessage());
    }
  }, [successMessage, dispatch]);

  useEffect(() => {
    if (error) {
      notifications.show({ 
        title: 'Error', 
        message: error, 
        color: 'red',
        icon: <IconX size={16} />
      });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleDelete = useCallback((semester: Semester) => {
  console.log('handleDelete called for semester:', semester);
  
  if (semester.status === 'completed') {
    console.log('Semester is completed, showing warning');
    notifications.show({
      title: 'Warning',
      message: 'Completed semesters cannot be deleted as they contain historical data.',
      color: 'orange',
      icon: <IconAlertCircle size={16} />
    });
    return;
  }
    // Callback functions
       if (!confirm("Are you sure you want to delete this semester?")) {
        return;
      }
        
         try {
            console.log('Deleting block with ID:', semester.id);
           dispatch(deleteSemester(semester.id) as any);
            // Refresh the blocks list after deletion
            dispatch(fetchSemesters() as any);
          } catch (err) {
            console.error('Error in handleDelete:', err);
            // Error is handled by the slice
          }
        
      
    }, [dispatch]);
    
  const handleStatusUpdate = useCallback((semester: Semester, newStatus: Semester['status']) => {
    if (semester.status === 'completed') {
      notifications.show({
        title: 'Cannot Update',
        message: 'Completed semesters cannot have their status changed.',
        color: 'orange',
      });
      return;
    }
 if (!confirm( 'Do you want to '+ newStatus +' this semester?')) return;

  dispatch(
    updateSemesterStatus({
      semesterId: semester.id,
      status: newStatus,
    }) as any
  );
}, [dispatch]);

  const handleAutoUpdateExpired = useCallback(() => {
    modals.openConfirmModal({
      title: 'Update Expired Semesters',
      children: (
        <Text size="sm">
          This will automatically update all expired semesters (end date passed) to  status. Continue?
        </Text>
      ),
      labels: { confirm: 'Update', cancel: 'Cancel' },
      onConfirm: async () => {
        try {
          await dispatch(autoUpdateExpiredSemesters() as any);
          // Refresh the list
          dispatch(fetchSemesters() as any);
        } catch (err) {
          console.error('Error updating expired semesters:', err);
        }
      },
    });
  }, [dispatch]);

  const handleEdit = useCallback((semester: Semester) => {
    if (semester.status === 'completed') {
      notifications.show({
        title: 'Cannot Edit',
        message: 'Completed semesters cannot be edited.',
        color: 'orange',
      });
      return;
    }
    setEditingSemester(semester);
    setFormOpened(true);
  }, []);

  const handleFormClose = useCallback(() => {
    setFormOpened(false);
    setEditingSemester(null);
  }, []);

  const handleFormSuccess = useCallback(() => {
    handleFormClose();
    dispatch(fetchSemesters() as any);
  }, [dispatch, handleFormClose]);

  const handleRefresh = useCallback(() => {
    dispatch(fetchSemesters() as any);
    dispatch(fetchBatches() as any);
  }, [dispatch]);

  const handleAddNew = useCallback(() => {
    setEditingSemester(null);
    setFormOpened(true);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilter('all');
    setSelectedBatch('all');
  }, []);

  // Utility functions
  const getStatusConfig = (status: Semester['status']) => {
    return STATUS_CONFIG[status];
  };

  const getBatchYear = useCallback((batchId: number) => {
    const batch = safeBatches.find(b => b.batch_id === batchId);
    return batch ? batch.batch_year : 'Unknown';
  }, [safeBatches]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isSemesterEnded = (semester: Semester) => {
    const endDate = new Date(semester.end_date);
    const today = new Date();
    return endDate < today;
  };

  // Prepare batch options for filter
  const batchOptions = [
    { value: 'all', label: 'All Batches' },
    ...safeBatches.map(batch => ({
      value: batch.batch_id.toString(),
      label: `Batch ${batch.batch_year}`
    }))
  ];

  // Stats for dashboard
  const stats = {
    total: safeSemesters.length,
    active: activeSemesters.length,
    completed: completedSemesters.length,
    upcoming: upcomingSemesters.length,
    inactive: inactiveSemesters.length,
  };

  return (
    <Box className="w-full h-full p-4">
      <Stack gap="md" className="w-full h-full">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Title order={1} className="text-2xl font-bold">Semester Management</Title>
            <Text c="dimmed">Manage academic semesters with automatic status updates</Text>
          </div>
          <Group>
            <Button 
              variant="outline" 
              leftSection={<IconRefresh size={16} />} 
              onClick={handleRefresh} 
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              variant="light"
              color="orange"
              leftSection={<IconClock size={16} />}
              onClick={handleAutoUpdateExpired}
              loading={loading}
            >
              Update Expired
            </Button>
            <Button 
              leftSection={<IconPlus size={16} />} 
              onClick={handleAddNew} 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={safeBatches.length === 0}
            >
              Add Semester
            </Button>
          </Group>
        </Group>

        {/* Stats Dashboard */}
        <Group grow>
          <Card withBorder padding="md" radius="md">
            <Group>
              <div className="bg-blue-50 p-2 rounded-lg">
                <IconCalendar className="text-blue-600" size={24} />
              </div>
              <div>
                <Text size="sm" c="dimmed">Total Semesters</Text>
                <Title order={3}>{stats.total}</Title>
              </div>
            </Group>
          </Card>
          
          <Card withBorder padding="md" radius="md">
            <Group>
              <div className="bg-green-50 p-2 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <Text size="sm" c="dimmed">Active</Text>
                <Title order={3}>{stats.active}</Title>
              </div>
            </Group>
          </Card>
          
          <Card withBorder padding="md" radius="md">
            <Group>
              <div className="bg-blue-50 p-2 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <Text size="sm" c="dimmed">Completed</Text>
                <Title order={3}>{stats.completed}</Title>
              </div>
            </Group>
          </Card>
          
          <Card withBorder padding="md" radius="md">
            <Group>
              <div className="bg-yellow-50 p-2 rounded-lg">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <Text size="sm" c="dimmed">Upcoming</Text>
                <Title order={3}>{stats.upcoming}</Title>
              </div>
            </Group>
          </Card>
        </Group>

        {/* Filter Section */}
        <Card withBorder shadow="sm" padding="md">
          <Group justify="space-between" align="flex-end">
            <Group>
              <div>
                <Text size="sm" fw={500} className="mb-1">Status Filter</Text>
                <SegmentedControl
                  value={filter}
                  onChange={(value) => setFilter(value as FilterType)}
                  data={[
                    { label: 'All', value: 'all' },
                    { label: 'Active', value: 'active' },
                    { label: 'Upcoming', value: 'upcoming' },
                    { label: 'Completed', value: 'completed' },
                    { label: 'Inactive', value: 'inactive' },
                  ]}
                />
              </div>
              
              <div>
                <Text size="sm" fw={500} className="mb-1">Batch Filter</Text>
                <Select
                  value={selectedBatch}
                  onChange={setSelectedBatch}
                  data={batchOptions}
                  placeholder="Select batch"
                  className="w-48"
                />
              </div>
              
              {(filter !== 'all' || selectedBatch !== 'all') && (
                <Button
                  variant="subtle"
                  color="gray"
                  onClick={handleClearFilters}
                  size="sm"
                >
                  Clear Filters
                </Button>
              )}
            </Group>
            
            <Badge color="blue" variant="light">
              Showing {filteredSemesters.length} of {safeSemesters.length} semesters
            </Badge>
          </Group>
        </Card>

        {/* Show warning if no batches available */}
        {safeBatches.length === 0 && (
          <Card withBorder className="bg-yellow-50 border-yellow-200">
            <Group>
              <IconAlertCircle className="text-yellow-600" size={20} />
              <Text c="orange" fw={500}>
                No batches available. Please create batches first in the Batch Management section.
              </Text>
            </Group>
          </Card>
        )}

        {/* Content */}
        <Card shadow="sm" padding="lg" radius="md" withBorder className="w-full flex-1">
          <LoadingOverlay visible={loading} />
          
          {filteredSemesters.length === 0 && !loading ? (
            <Paper className="text-center py-12">
              <IconCalendar size={48} className="mx-auto text-gray-400 mb-4" />
              <Text c="dimmed" size="lg" className="mb-4">
                {filter === 'completed' 
                  ? 'No completed semesters found' 
                  : filter === 'active'
                  ? 'No active semesters found'
                  : filter === 'upcoming'
                  ? 'No upcoming semesters found'
                  : filter === 'inactive'
                  ? 'No inactive semesters found'
                  : 'No semesters found'}
              </Text>
              {filter !== 'all' && (
                <Button 
                  onClick={handleClearFilters}
                  variant="subtle"
                  className="mb-4"
                >
                  Clear filters to see all semesters
                </Button>
              )}
              <Button 
                onClick={handleAddNew} 
                leftSection={<IconPlus size={16} />}
                disabled={safeBatches.length === 0}
              >
                Create your first semester
              </Button>
              {safeBatches.length === 0 && (
                <Text c="red" size="sm" className="mt-2">
                  You need to create batches first
                </Text>
              )}
            </Paper>
          ) : (
            <ScrollArea className="w-full">
              <Table striped highlightOnHover>
                <Table.Thead>
                    <Table.Tr>
                    <Table.Th>#</Table.Th>
                    <Table.Th>Semester</Table.Th>
                    <Table.Th>Academic Year</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Batch</Table.Th>
                    <Table.Th>Start Date</Table.Th>
                    <Table.Th>End Date</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredSemesters.map((semester, index) => {
                    const statusConfig = getStatusConfig(semester.status);
                    const isEnded = isSemesterEnded(semester);
                    const isEditable = semester.status !== 'completed';
                    const isDeletable = semester.status !== 'completed';
                    
                    return (
                      <Table.Tr key={semester.id} className="hover:bg-gray-50">
                        <Table.Td>{ index + 1}</Table.Td>
                        <Table.Td>
                          <Badge color="blue" variant="light">
                            {SEMESTER_DISPLAY[semester.semester] || semester.semester}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Badge color="indigo" variant="light">{semester.academic_year}</Badge>
                        </Table.Td>
                        <Table.Td>
                          <Badge 
                            color={statusConfig.color} 
                            variant="light"
                            leftSection={<statusConfig.icon className="h-3 w-3 mr-1" />}
                          >
                            {statusConfig.label}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Badge color="teal" variant="light">
                            {getBatchYear(semester.batch_id)}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{formatDate(semester.start_date)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" className={isEnded ? 'text-gray-500' : ''}>
                            {formatDate(semester.end_date)}
                            {isEnded && semester.status !== 'completed' && (
                              <Text size="xs" c="red" className="mt-1">
                                (Ended - will auto-update to completed)
                              </Text>
                            )}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Tooltip label={isEditable ? "Edit" : "Cannot edit completed semesters"}>
                              <span>
                                <ActionIcon 
                                  variant="subtle" 
                                  color="blue" 
                                  onClick={() => handleEdit(semester)} 
                                  disabled={!isEditable}
                                >
                                  <IconEdit size={16} />
                                </ActionIcon>
                              </span>
                            </Tooltip>
                            
                            <Tooltip label={isDeletable ? "Delete" : "Cannot delete completed semesters"}>
                              <span>
                                <ActionIcon 
                                  variant="subtle" 
                                  color="red" 
                                  onClick={() => handleDelete(semester)} 
                                  disabled={!isDeletable}
                                >
                                  <IconTrash size={16} />
                                </ActionIcon>
                              </span>
                            </Tooltip>

                            {/* Status change buttons - only show for non-completed semesters */}
                            {semester.status !== 'completed' && (
                              <>
                                {semester.status !== 'active' && (
                                  <Tooltip label="Set as Active">
                                    <ActionIcon 
                                      variant="subtle" 
                                      color="green" 
                                      onClick={() => handleStatusUpdate(semester, 'active')}
                                    >
                                      <CheckCircleIcon className="h-4 w-4" />
                                    </ActionIcon>
                                  </Tooltip>
                                )}
                                
                                {semester.status !== 'inactive' && (
                                  <Tooltip label="Set as Inactive">
                                    <ActionIcon 
                                      variant="subtle" 
                                      color="gray" 
                                      onClick={() => handleStatusUpdate(semester, 'inactive')}
                                    >
                                      <XCircleIcon className="h-4 w-4" />
                                    </ActionIcon>
                                  </Tooltip>
                                )}
                                
                                {semester.status !== 'upcoming' && (
                                  <Tooltip label="Set as Upcoming">
                                    <ActionIcon 
                                      variant="subtle" 
                                      color="yellow" 
                                      onClick={() => handleStatusUpdate(semester, 'upcoming')}
                                    >
                                      <ClockIcon className="h-4 w-4" />
                                    </ActionIcon>
                                  </Tooltip>
                                )}
                                
                                {!isEnded && semester.status !== 'completed' && (
                                  <Tooltip label="Mark as Completed">
                                    <ActionIcon 
                                      variant="subtle" 
                                      color="blue" 
                                      onClick={() => handleStatusUpdate(semester, 'completed')}
                                    >
                                      <CalendarIcon className="h-4 w-4" />
                                    </ActionIcon>
                                  </Tooltip>
                                )}
                              </>
                            )}
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          )}
        </Card>
      </Stack>

      {/* Info Banner for completed semesters */}
      {filter === 'completed' && completedSemesters.length > 0 && (
        <Card withBorder className="bg-blue-50 border-blue-200 mt-4">
          <Group>
            <IconInfoCircle className="text-blue-600" size={20} />
            <Text size="sm" c="blue">
              Completed semesters are automatically updated when their end date passes. 
              They cannot be edited or deleted to preserve historical data.
            </Text>
          </Group>
        </Card>
      )}

      {/* SemesterForm with batches prop */}
      <SemesterForm
        opened={formOpened}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        batches={safeBatches}
        semester={editingSemester}
      />
    </Box>
  );
}