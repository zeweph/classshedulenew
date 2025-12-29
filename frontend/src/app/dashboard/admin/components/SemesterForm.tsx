/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback } from 'react';
import { 
  Modal, 
  TextInput, 
  Button, 
  Group, 
  Text, 
  Select,
  Alert,
  Combobox,
  useCombobox,
  InputBase,
  Pill,
  CloseButton
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import axios from 'axios';
import { IconInfoCircle, IconPencil, IconChevronDown, IconPlus } from '@tabler/icons-react';

const API_BASE_URL = 'http://localhost:5000/api';

// Default semester options
const DEFAULT_SEMESTER_OPTIONS = [
  { value: 'SEMESTER_1', label: 'Semester 1' },
  { value: 'SEMESTER_2', label: 'Semester 2' },
  { value: 'SEMESTER_3', label: 'Semester 3' },
  { value: 'SEMESTER_4', label: 'Semester 4' },
  { value: 'SEMESTER_5', label: 'Semester 5' },
  { value: 'SEMESTER_6', label: 'Semester 6' },
  { value: 'SEMESTER_7', label: 'Semester 7' },
  { value: 'SEMESTER_8', label: 'Semester 8' },
  { value: 'FALL', label: 'Fall Semester' },
  { value: 'SPRING', label: 'Spring Semester' },
  { value: 'SUMMER', label: 'Summer Semester' },
  { value: 'WINTER', label: 'Winter Semester' },
];

// Status options
const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'completed', label: 'Completed' },
  { value: 'upcoming', label: 'Upcoming' },
];

// Academic year options
const ACADEMIC_YEAR_OPTIONS = [
  { value: '2020-2021', label: '2020-2021' },
  { value: '2021-2022', label: '2021-2022' },
  { value: '2022-2023', label: '2022-2023' },
  { value: '2023-2024', label: '2023-2024' },
  { value: '2024-2025', label: '2024-2025' },
  { value: '2025-2026', label: '2025-2026' },
  { value: '2026-2027', label: '2026-2027' },
  { value: '2027-2028', label: '2027-2028' },
  { value: '2028-2029', label: '2028-2029' },
  { value: '2029-2030', label: '2029-2030' },
];

interface Batch {
  batch_id: number;
  batch_year: string;
}

interface Semester {
  id: number;
  semester: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  status: string;
  batch_id: number;
}

interface SemesterFormProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
  batches: Batch[];
  semester: Semester | null;
}

export default function SemesterForm({ opened, onClose, onSuccess, batches, semester }: SemesterFormProps) {
  const isEditing = !!semester;
  const [loading, setLoading] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [semesterOptions, setSemesterOptions] = useState(DEFAULT_SEMESTER_OPTIONS);
  const [searchValue, setSearchValue] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  // Safe initialization with defaults
  const safeBatches = Array.isArray(batches) ? batches : [];

  // Check if semester value is custom (not in default options)
  const isCustomSemester = (value: string) => {
    return !DEFAULT_SEMESTER_OPTIONS.some(option => option.value === value);
  };

  // Get default values function
  const getDefaultValues = useCallback(() => {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const defaultAcademicYear = `${currentYear}-${nextYear}`;
    
    const today = new Date();
    const defaultEndDate = new Date();
    defaultEndDate.setMonth(today.getMonth() + 4);
    
    // Get default batch ID if available
    const defaultBatchId = safeBatches.length > 0 ? String(safeBatches[0].batch_id) : '';
    
    const semesterValue = semester?.semester || '';
    
    // Check if it's a custom semester
    if (semesterValue && isCustomSemester(semesterValue)) {
      setIsCustomMode(true);
    }

    return {
      semester: semesterValue,
      academic_year: semester?.academic_year || defaultAcademicYear,
      start_date: semester?.start_date || today.toISOString().split('T')[0],
      end_date: semester?.end_date || defaultEndDate.toISOString().split('T')[0],
      status: semester?.status || 'active',
      batch_id: semester?.batch_id ? String(semester.batch_id) : defaultBatchId,
    };
  }, [semester, safeBatches]);

  // Initialize form
  const form = useForm({
    initialValues: getDefaultValues(),
    validate: {
      semester: (value) => {
        if (!value) return 'Semester is required';
        if (value.length < 2) return 'Semester name must be at least 2 characters';
        if (value.length > 50) return 'Semester name is too long';
        return null;
      },
      academic_year: (value) => {
        if (!value) return 'Academic year is required';
        if (!value.match(/^\d{4}-\d{4}$/)) return 'Academic year must be in format: YYYY-YYYY';
        return null;
      },
      start_date: (value) => !value ? 'Start date is required' : null,
      end_date: (value) => !value ? 'End date is required' : null,
      batch_id: (value) => !value ? 'Batch is required' : null,
    },
  });

  // Filter options based on search
  const filteredOptions = semesterOptions.filter((item) =>
    item.label.toLowerCase().includes(searchValue.toLowerCase().trim())
  );

  // Handle adding a new custom semester
  const handleAddCustomSemester = () => {
    if (searchValue.trim().length === 0) return;
    
    const newOption = {
      value: searchValue.trim().toUpperCase(),
      label: searchValue.trim()
    };
    
    // Check if already exists
    const exists = semesterOptions.some(option => 
      option.value.toLowerCase() === newOption.value.toLowerCase()
    );
    
    if (!exists) {
      setSemesterOptions([newOption, ...semesterOptions]);
    }
    
    form.setFieldValue('semester', newOption.value);
    setSearchValue('');
    combobox.closeDropdown();
  };


  // Reset form when modal opens or semester changes
  useEffect(() => {
    if (opened) {
      const values = getDefaultValues();
      form.setValues(values);
      setFormKey(prev => prev + 1);
      setSearchValue(values.semester || '');
    }
  }, [opened, semester?.id]);

  // Toggle between custom and select mode
  const toggleCustomMode = () => {
    if (isCustomMode) {
      // Switching from custom to select
      setIsCustomMode(false);
      setSearchValue('');
      if (semesterOptions.length > 0) {
        form.setFieldValue('semester', semesterOptions[0].value);
      }
    } else {
      // Switching from select to custom
      setIsCustomMode(true);
      setSearchValue(form.values.semester || '');
    }
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setLoading(true);

      // Validate dates
      const startDate = new Date(values.start_date);
      const endDate = new Date(values.end_date);
      
      if (startDate >= endDate) {
        notifications.show({
          title: 'Error',
          message: 'End date must be after start date',
          color: 'red',
        });
        return;
      }

      // Validate that we have a batch selected
      if (!values.batch_id) {
        notifications.show({
          title: 'Error',
          message: 'Please select a batch',
          color: 'red',
        });
        return;
      }

      const payload = {
        semester: values.semester.trim(),
        academic_year: values.academic_year,
        start_date: values.start_date,
        end_date: values.end_date,
        status: values.status,
        batch_id: parseInt(values.batch_id),
      };

      if (isEditing && semester) {
        await axios.put(`${API_BASE_URL}/semesters/${semester.id}`, payload);
        notifications.show({
          title: 'Success',
          message: 'Semester updated successfully',
          color: 'green',
        });
      } else {
        await axios.post(`${API_BASE_URL}/semesters`, payload);
        notifications.show({
          title: 'Success',
          message: 'Semester created successfully',
          color: 'green',
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to save semester';
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // Get selected batch info for display
  const getSelectedBatchInfo = () => {
    if (!form.values.batch_id) return null;
    const batch = safeBatches.find(b => String(b.batch_id) === form.values.batch_id);
    return batch ? batch.batch_year : 'Unknown Batch';
  };

  // Get selected semester label
  const getSelectedSemesterLabel = () => {
    const selectedOption = semesterOptions.find(option => option.value === form.values.semester);
    return selectedOption ? selectedOption.label : form.values.semester;
  };

  // Handle semester selection from combobox
  const handleSemesterSelect = (value: string) => {
    form.setFieldValue('semester', value);
    setSearchValue('');
    combobox.closeDropdown();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text size="xl" fw={600}>
          {isEditing ? 'Edit Semester' : 'Create New Semester'}
        </Text>
      }
      size="lg"
      radius="md"
      key={formKey}
    >
      <form onSubmit={form.onSubmit(handleSubmit)} key={formKey}>
        <div className="space-y-4">
          {/* Semester Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium">Semester *</label>
              <Button
                type="button"
                variant="subtle"
                size="xs"
                leftSection={<IconPencil size={14} />}
                onClick={toggleCustomMode}
              >
                {isCustomMode ? 'Use Select' : 'Type Custom'}
              </Button>
            </div>

            {isCustomMode ? (
              // Custom input mode
              <TextInput
                placeholder="Type custom semester name (e.g., Quarter 1, Term 1)"
                value={searchValue}
                onChange={(e) => {
                  setSearchValue(e.target.value);
                  form.setFieldValue('semester', e.target.value);
                }}
                required
                disabled={loading}
                error={form.errors.semester}
                description="Type your custom semester name"
                rightSection={
                  searchValue && (
                    <CloseButton
                      onClick={() => {
                        setSearchValue('');
                        form.setFieldValue('semester', '');
                      }}
                      aria-label="Clear input"
                    />
                  )
                }
              />
            ) : (
              // Combobox select mode with custom option
              <Combobox
                store={combobox}
                withinPortal={false}
                onOptionSubmit={handleSemesterSelect}
              >
                <Combobox.Target>
                  <InputBase
                    component="button"
                    type="button"
                    pointer
                    rightSection={<IconChevronDown size={16} />}
                    onClick={() => combobox.toggleDropdown()}
                    rightSectionPointerEvents="none"
                    required
                    disabled={loading}
                    error={form.errors.semester}
                    className="w-full"
                  >
                    {form.values.semester ? (
                      <Text truncate>{getSelectedSemesterLabel()}</Text>
                    ) : (
                      <Text c="dimmed">Select semester or type to search</Text>
                    )}
                  </InputBase>
                </Combobox.Target>

                <Combobox.Dropdown>
                  <Combobox.Search
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.currentTarget.value)}
                    placeholder="Search or type new..."
                  />
                  
                  <Combobox.Options>
                    {filteredOptions.length > 0 ? (
                      filteredOptions.map((item) => (
                        <Combobox.Option value={item.value} key={item.value}>
                          {item.label}
                        </Combobox.Option>
                      ))
                    ) : (
                      <Combobox.Empty>Nothing found</Combobox.Empty>
                    )}

                    {/* Custom option */}
                    {searchValue.trim().length > 0 && (
                      <Combobox.Option
                        value={searchValue}
                        onClick={handleAddCustomSemester}
                        className="text-blue-600 font-medium"
                      >
                        <Group gap="xs">
                          <IconPlus size={14} />
                          Create &quot;{searchValue}&quot;
                        </Group>
                      </Combobox.Option>
                    )}
                  </Combobox.Options>
                </Combobox.Dropdown>
              </Combobox>
            )}

            {/* Show current selection info */}
            {form.values.semester && (
              <div className="mt-2">
                <Pill size="sm" color={isCustomSemester(form.values.semester) ? "blue" : "gray"}>
                  Selected: {getSelectedSemesterLabel()}
                  {isCustomSemester(form.values.semester) && " (Custom)"}
                </Pill>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Academic Year - using regular Select since it doesn't need creatable */}
            <Select
              label="Academic Year *"
              placeholder="Select academic year"
              data={ACADEMIC_YEAR_OPTIONS}
              required
              disabled={loading}
              searchable
              {...form.getInputProps('academic_year')}
            />

            <Select
              label="Status *"
              placeholder="Select status"
              data={STATUS_OPTIONS}
              required
              disabled={loading}
              {...form.getInputProps('status')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput
              label="Start Date *"
              type="date"
              required
              disabled={loading}
              {...form.getInputProps('start_date')}
            />

            <TextInput
              label="End Date *"
              type="date"
              required
              disabled={loading}
              {...form.getInputProps('end_date')}
            />
          </div>

          {/* Batch Selection */}
          <Select
            label="Batch *"
            placeholder={safeBatches.length === 0 ? "No batches available" : "Select batch"}
            data={safeBatches.map(batch => ({
              value: String(batch.batch_id),
              label: `Batch ${batch.batch_year}`
            }))}
            required
            disabled={loading || safeBatches.length === 0}
            description={
              safeBatches.length === 0 
                ? "No batches available. Please create batches first." 
                : `Available batches: ${safeBatches.length}`
            }
            {...form.getInputProps('batch_id')}
          />

          {/* Show warning if no batches available */}
          {safeBatches.length === 0 && (
            <Alert variant="light" color="orange" title="No Batches Available" icon={<IconInfoCircle />}>
              You need to create batches before you can create semesters. Please create batches first in the Batch Management section.
            </Alert>
          )}

          {/* Enhanced Summary Information */}
          {form.values.start_date && form.values.end_date && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <Text size="sm" fw={500} c="blue" className="mb-2">
                Semester Summary:
              </Text>
              <div className="space-y-1">
                <Text size="sm">
                  <strong>Duration:</strong> {new Date(form.values.start_date).toLocaleDateString()} to {new Date(form.values.end_date).toLocaleDateString()}
                </Text>
                {form.values.semester && (
                  <Text size="sm">
                    <strong>Semester:</strong> {getSelectedSemesterLabel()}
                    {isCustomSemester(form.values.semester) && (
                      <Text component="span" c="blue" size="xs" className="ml-1">(Custom)</Text>
                    )}
                  </Text>
                )}
                {form.values.academic_year && (
                  <Text size="sm">
                    <strong>Academic Year:</strong> {form.values.academic_year}
                  </Text>
                )}
                {form.values.batch_id && (
                  <Text size="sm">
                    <strong>Batch:</strong> {getSelectedBatchInfo()}
                  </Text>
                )}
                {form.values.status && (
                  <Text size="sm">
                    <strong>Status:</strong> {STATUS_OPTIONS.find(s => s.value === form.values.status)?.label || form.values.status}
                  </Text>
                )}
              </div>
            </div>
          )}
        </div>

        <Group justify="flex-end" className="mt-8 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700"
            loading={loading}
            disabled={safeBatches.length === 0}
          >
            {isEditing ? 'Update Semester' : 'Create Semester'}
          </Button>
        </Group>
      </form>
    </Modal>
  );
}