/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useMemo } from "react";
import {
  TextInput,
  Select,
  Button,
  Group,
  Stack,
  PasswordInput,
  Box,
  Text,
  Paper,
  Grid,
  Loader,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAppDispatch } from "@/hooks/redux";
import { addUser, addDepartment } from "@/store/slices/usersSlice";
import { notifications } from "@mantine/notifications";
import { CheckCircleIcon, ExclamationCircleIcon, BuildingOfficeIcon } from "@heroicons/react/24/outline";

interface AddUserFormProps {
  departments: any[];
  onUserAdded: () => void;
  loading: boolean;
  error: string | null;
}

const AddUserForm: React.FC<AddUserFormProps> = ({
  departments,
  onUserAdded,
  loading,
  error,
}) => {
  const dispatch = useAppDispatch();
  const [submitLoading, setSubmitLoading] = useState(false);

  const form = useForm({
    initialValues: {
      role: "instructor" as "admin" | "instructor" | "student",
      departmentType: "existing" as "existing" | "createNew",
      existingDepartment: "",
      newDepartmentName: "",
      idNumber: "",
      username: "",
      email: "",
      name: "",
      password: "",
      confirmPassword: "",
    },

    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      name: (value) => (value.trim().length < 2 ? 'Name must be at least 2 characters' : null),
      username: (value) => (value.trim().length < 3 ? 'Username must be at least 3 characters' : null),
      idNumber: (value) => (value.trim().length < 1 ? 'ID Number is required' : null),
      password: (value) => {
        if (!value) return "Password is required";
        if (value.length < 6) return "Password must be at least 6 characters";
        return null;
      },
      confirmPassword: (value, values) =>
        value !== values.password ? "Passwords do not match" : null,
      existingDepartment: (value, values) => 
        values.role !== "admin" && values.departmentType === "existing" && !value 
          ? "Please select a department" 
          : null,
      newDepartmentName: (value, values) =>
        values.role !== "admin" && values.departmentType === "createNew" && !value.trim()
          ? "Please enter a department name"
          : null,
    },
  });

  // Check for duplicate users
  const isDuplicateUser = (
    email: string,
    username: string,
    idNumber: string
  ) => {
    // This would typically check against existing users from your store
    // For now, we'll return false since we don't have access to users list here
    return false;
  };

  // Get specific duplicate field information
  const getDuplicateFields = (
    email: string,
    username: string,
    idNumber: string
  ) => {
    // This would check which fields are duplicates
    // For now, return empty array
    return [];
  };

  const handleSubmit = async (values: typeof form.values) => {
    setSubmitLoading(true);
    
    let finalDepartment: number | null = null;
    
    // Handle department creation/selection for non-admin users
    if (values.role !== "admin") {
      if (values.departmentType === "existing" && values.existingDepartment) {
        finalDepartment = Number(values.existingDepartment);
      } else if (values.departmentType === "createNew" && values.newDepartmentName.trim()) {
        try {
          // Add new department first
          const result = await dispatch(addDepartment(values.newDepartmentName.trim())).unwrap();
          finalDepartment = result.department_id;
        } catch (err: any) {
          notifications.show({
            title: 'Error',
            message: err.message || 'Failed to create new department',
            color: 'red',
          });
          setSubmitLoading(false);
          return;
        }
      } else {
        notifications.show({
          title: 'Error',
          message: 'Please select or enter a department.',
          color: 'red',
        });
        setSubmitLoading(false);
        return;
      }
    }

    // Check for duplicates (you might want to pass users list as prop or fetch here)
    if (isDuplicateUser(values.email, values.username, values.idNumber)) {
      const duplicateFields = getDuplicateFields(values.email, values.username, values.idNumber);
      notifications.show({
        title: 'Error',
        message: `User with this ${duplicateFields.join(', ')} already exists.`,
        color: 'red',
      });
      setSubmitLoading(false);
      return;
    }

    try {
      // Dispatch the addUser action
      await dispatch(addUser({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password.trim(),
        role: values.role,
        department: finalDepartment || null,
        idNumber: values.idNumber.trim(),
        username: values.username.trim(),
      })).unwrap();

      // Success
      form.reset();
      onUserAdded();
      
      notifications.show({
        title: 'Success',
        message: 'User created successfully',
        color: 'green',
        icon: <CheckCircleIcon className="h-5 w-5" />,
      });
    } catch (err: any) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Failed to create user',
        color: 'red',
        icon: <ExclamationCircleIcon className="h-5 w-5" />,
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const roleOptions = [
    { value: "admin", label: "Administrator" },
    { value: "instructor", label: "Instructor" },
    { value: "student", label: "Student" },
  ];

  const departmentOptions = departments.map(dept => ({
    value: dept.department_id.toString(),
    label: dept.department_name,
  }));

  const departmentTypeOptions = [
    { value: "existing", label: "Select Existing Department" },
    { value: "createNew", label: "Create New Department" },
  ];

  // Role description
  const roleDescription = useMemo(() => {
    switch (form.values.role) {
      case "admin":
        return "Administrators have full system access and can manage all users, departments, courses, and system settings.";
      case "instructor":
        return "Instructors can manage courses, schedules, view student information, and create announcements within their department.";
      case "student":
        return "Students can view their schedules, courses, submit assignments, and access course materials.";
      default:
        return "Select a role to see detailed permissions and capabilities.";
    }
  }, [form.values.role]);

  return (
    <Box>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="lg">
          {/* Role Selection */}
          <Paper withBorder p="md" radius="md">
            <Text fw={600} size="lg" mb="md">Account Type</Text>
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  label="User Role"
                  placeholder="Select user role"
                  data={roleOptions}
                  required
                  {...form.getInputProps('role')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Box>
                  <Text fw={500} size="sm" mb="xs">Role Description</Text>
                  <Text size="sm" c="dimmed">
                    {roleDescription}
                  </Text>
                </Box>
              </Grid.Col>
            </Grid>
          </Paper>

          {/* Department Section - Only show for non-admin users */}
          {form.values.role !== "admin" && (
            <Paper withBorder p="md" radius="md">
              <Text fw={600} size="lg" mb="md">Department Assignment</Text>
              <Grid gutter="md">
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Select
                    label="Department Option"
                    data={departmentTypeOptions}
                    required
                    {...form.getInputProps('departmentType')}
                  />
                </Grid.Col>

                {form.values.departmentType === "existing" && (
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select
                      label="Select Department"
                      placeholder={departments.length === 0 ? "Loading departments..." : "Choose a department"}
                      data={departmentOptions}
                      required
                      leftSection={
                        departments.length === 0 ? 
                          <Loader size="xs" /> : 
                          <BuildingOfficeIcon className="h-4 w-4 text-gray-500" />
                      }
                      disabled={departments.length === 0}
                      {...form.getInputProps('existingDepartment')}
                    />
                    {departments.length === 0 && (
                      <Text size="xs" c="orange" mt="xs">
                        No departments available. You may need to create a new one.
                      </Text>
                    )}
                  </Grid.Col>
                )}

                {form.values.departmentType === "createNew" && (
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="New Department Name"
                      placeholder="e.g., Computer Science Department"
                      required
                      {...form.getInputProps('newDepartmentName')}
                    />
                  </Grid.Col>
                )}
              </Grid>
            </Paper>
          )}

          {/* Personal Information */}
          <Paper withBorder p="md" radius="md">
            <Text fw={600} size="lg" mb="md">Personal Information</Text>
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Full Name"
                  placeholder="Enter full name"
                  required
                  {...form.getInputProps('name')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Email Address"
                  placeholder="user@example.com"
                  type="email"
                  required
                  {...form.getInputProps('email')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="ID Number"
                  placeholder="e.g., 2023-001"
                  required
                  {...form.getInputProps('idNumber')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Username"
                  placeholder="Choose a username"
                  required
                  {...form.getInputProps('username')}
                />
              </Grid.Col>
            </Grid>
          </Paper>

          {/* Account Security */}
          <Paper withBorder p="md" radius="md">
            <Text fw={600} size="lg" mb="md">Account Security</Text>
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <PasswordInput
                  label="Password"
                  placeholder="Enter secure password"
                  required
                  {...form.getInputProps('password')}
                />
                <Text size="xs" c="dimmed" mt="xs">
                  Password must be at least 6 characters long
                </Text>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <PasswordInput
                  label="Confirm Password"
                  placeholder="Re-enter password"
                  required
                  {...form.getInputProps('confirmPassword')}
                />
              </Grid.Col>
            </Grid>
          </Paper>

          {/* Form Actions */}
          <Group justify="flex-end" mt="lg">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              disabled={submitLoading}
              size="md"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitLoading}
              className="bg-blue-600 hover:bg-blue-700"
              size="md"
            >
              Create User Account
            </Button>
          </Group>
        </Stack>
      </form>
    </Box>
  );
};

export default AddUserForm;