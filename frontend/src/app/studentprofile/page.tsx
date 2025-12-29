/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import {
  Container,
  Card,
  Title,
  Text,
  Stack,
  Button,
  Select,
  PasswordInput,
  Divider,
  Alert,
  ThemeIcon,
  Loader,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconUser,
  IconCheck,
  IconAlertCircle,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react";
import axios from "axios";
import { useRouter } from "next/navigation";

import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { selectUser, setUser } from "@/store/slices/authSlice";

// Import from studentSlice instead of scheduleSlice
import {
  fetchBatches,
  fetchSemesters,
  fetchDepartments,
  updateStudentFirstLogin,
} from "@/store/slices/studentSlice";

import {
  selectDepartments,
  selectBatches,
  selectSemesters,
} from "@/store/selectors/studentSelector";

const updateStudentFirstLoginProfilePage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const user = useAppSelector(selectUser);
  const departments = useAppSelector(selectDepartments);
  const batches = useAppSelector(selectBatches);
  const semesters = useAppSelector(selectSemesters);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  /* ----------------------------------
     Fetch required dropdown data
  ---------------------------------- */
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          dispatch(fetchDepartments()),
          dispatch(fetchBatches()),
          dispatch(fetchSemesters()),
        ]);
        setDataLoaded(true);
      } catch (error) {
        console.error("Failed to load dropdown data:", error);
        notifications.show({
          title: "Error",
          message: "Failed to load dropdown data",
          color: "red",
        });
      }
    };
    
    loadData();
  }, [dispatch]);

  // Format dropdown options
  const departmentOptions = departments
    .filter(dept => dept && dept.department_id && dept.department_name)
    .map(dept => ({
      value: dept.department_id.toString(),
      label: dept.department_name,
    }));

  const batchOptions = batches
    .filter(batch => batch && batch.batch_id && batch.batch_year)
    .map(batch => ({
      value: batch.batch_id.toString(),
      label: batch.batch_year.toString(),
    }));

  const semesterOptions = semesters
    .filter(sem => sem && sem.id && sem.semester)
    .map(sem => ({
      value: sem.id.toString(),
      label: sem.semester.toString(),
    }));

  const getSectionOptions = () => {
    return [
      { value: "", label: "Select Section" },
      ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))
        .map(letter => ({
          value: letter,
          label: `Section ${letter}`,
        }))
    ];
  };

  /* ----------------------------------
     Form
  ---------------------------------- */
  const form = useForm({
    initialValues: {
      batch_id: user?.batch?.toString() || "",
      semester_id: user?.current_semester?.toString() || "",
      department_id: user?.department_id?.toString() || "",
      section: user?.section || "",
      password: "",
      confirmPassword: "",
    },

    validate: {
      batch_id: (v) => (!v ? "Batch is required" : null),
      semester_id: (v) => (!v ? "Semester is required" : null),
      department_id: (v) => (!v ? "Department is required" : null),
      section: (v) => (!v ? "Section is required" : null),

      password: (v) =>
        v && v.length < 5 ? "Minimum 5 characters" : null,

      confirmPassword: (v, values) =>
        values.password && v !== values.password
          ? "Passwords do not match"
          : null,
    },
  });

  // Update form when user data or dropdown data changes
  useEffect(() => {
    if (user && dataLoaded) {
      form.setValues({
        batch_id: user?.batch?.toString() || "",
        semester_id: user?.current_semester?.toString() || "",
        department_id: user?.department_id?.toString() || "",
        section: user?.section || "",
        password: "",
        confirmPassword: "",
      });
    }
  }, [user, dataLoaded]);

  /* ----------------------------------
     Submit handler - Using Redux thunk
  ---------------------------------- */
  const handleSubmit = async (values: typeof form.values) => {
    if (!user) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setError(null);

    try {

      // Prepare the student data for Redux thunk
        const studentData = {
         newPassword: values.password,
        department_id: Number(values.department_id),
        batch_id: Number(values.batch_id),
        semester_id: Number(values.semester_id),
        section: values.section,
      };

      // Dispatch the Redux thunk action
      const result = await dispatch(updateStudentFirstLogin({
        studentId: user.id,
        studentData
      }));

      if (updateStudentFirstLogin.fulfilled.match(result)) {
        // Update was successful
        notifications.show({
          title: "Profile Updated",
          message: "Student profile updated successfully",
          color: "green",
          icon: <IconCheck size={18} />,
        });

        // Get updated department name
        const department = departments.find(d => 
          d.department_id === Number(values.department_id)
        );
        
        // Get updated batch year
        const batch = batches.find(b => 
          b.batch_id === Number(values.batch_id)
        );
        
        // Get updated semester name
        const semester = semesters.find(s => 
          s.id === Number(values.semester_id)
        );

        // Update user in auth slice
        dispatch(
          setUser({
            ...user,
            batch: batch?.batch_year?.toString() || values.batch_id,
            current_semester: semester?.semester?.toString() || values.semester_id,
            department_id: Number(values.department_id),
            department_name: department?.department_name || user.department_name,
            section: values.section,
          })
        );

        

        // Redirect after successful update
        setTimeout(() => {
          router.push("/dashboard/student/dashboard");
        }, 1500);
      } else if (updateStudentFirstLogin.rejected.match(result)) {
        // Update failed
        throw new Error(result.payload as string || "Update failed");
      }
    } catch (err: any) {
      console.error("Update error:", err);
      setError(err.message || err.response?.data?.message || "Update failed. Please try again.");
      notifications.show({
        title: "Error",
        message: err.message || err.response?.data?.message || "Update failed",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------------
     Debug logging
  ---------------------------------- */
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (dataLoaded) {
      console.log("Departments:", departments);
      console.log("Department options:", departmentOptions);
      console.log("Batches:", batches);
      console.log("Batch options:", batchOptions);
      console.log("Semesters:", semesters);
      console.log("Semester options:", semesterOptions);
      console.log("User data:", user);
      
      // Check for any invalid options
      const checkOptions = (options: any[], name: string) => {
        const invalid = options.filter(opt => 
          !opt.value || typeof opt.value !== 'string' || opt.value.trim() === ''
        );
        if (invalid.length > 0) {
          console.error(`Invalid ${name} options:`, invalid);
        }
      };
      
      checkOptions(departmentOptions, "department");
      checkOptions(batchOptions, "batch");
      checkOptions(semesterOptions, "semester");
    }
  }, [dataLoaded, departments, batches, semesters, departmentOptions, batchOptions, semesterOptions, user]);

  // Show loading if user not loaded or data not ready
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="xl" />
      </div>
    );
  }

  if (!dataLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader size="xl" />
        <Text mt="md">Loading dropdown data...</Text>
      </div>
    );
  }

  /* ----------------------------------
     Render
  ---------------------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
      <Container size="sm">
        <Card shadow="xl" radius="xl" p="xl">
          <Stack align="center" mb="md">
            <ThemeIcon size={56} radius="xl">
              <IconUser size={28} />
            </ThemeIcon>
            <Title order={2}>Update Student Profile</Title>
            <Text size="sm" c="dimmed">
              Update your academic details and password
            </Text>
          </Stack>

          {error && (
            <Alert
              color="red"
              icon={<IconAlertCircle />}
              withCloseButton
              onClose={() => setError(null)}
              mb="md"
            >
              {error}
            </Alert>
          )}

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              {/* Department */}
              <Select
                label="Department"
                placeholder="Select department"
                data={departmentOptions}
                required
                {...form.getInputProps('department_id')}
                radius="md"
                size="md"
                searchable
                nothingFoundMessage="No departments found"
              />

              {/* Batch */}
              <Select
                label="Batch"
                placeholder="Select batch"
                data={batchOptions}
                required
                {...form.getInputProps('batch_id')}
                radius="md"
                size="md"
                searchable
                nothingFoundMessage="No batches found"
              />
              
              {/* Semester */}
              <Select
                label="Semester"
                placeholder="Select semester"
                data={semesterOptions}
                required
                {...form.getInputProps('semester_id')}
                radius="md"
                size="md"
                searchable
                nothingFoundMessage="No semesters found"
              />

              {/* Section */}
              <Select
                label="Section"
                placeholder="Select section"
                data={getSectionOptions()}
                required
                {...form.getInputProps('section')}
                radius="md"
                size="md"
              />

              <Divider label="Change Password (Optional)" />

              <PasswordInput
                label="New Password"
                placeholder="Leave empty to keep current"
                visibilityToggleIcon={({ reveal }) =>
                  reveal ? <IconEyeOff size={16} /> : <IconEye size={16} />
                }
                {...form.getInputProps("password")}
              />

              <PasswordInput
                label="Confirm Password"
                placeholder="Confirm new password"
                {...form.getInputProps("confirmPassword")}
              />

              <Button 
                type="submit" 
                size="lg" 
                loading={loading}
                fullWidth
                mt="md"
                disabled={!dataLoaded}
              >
                {loading ? "Updating..." : "Update Profile"}
              </Button>
              
              <Button 
                variant="light"
                onClick={() => router.push("/dashboard/student/dashboard")}
                fullWidth
              >
                Cancel
              </Button>
            </Stack>
          </form>
        </Card>
      </Container>
    </div>
  );
};

export default updateStudentFirstLoginProfilePage;