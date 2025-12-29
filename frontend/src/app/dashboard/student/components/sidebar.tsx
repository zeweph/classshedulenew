/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  ScrollArea,
  Text,
  Group,
  Box,
  Badge,
  Tooltip,
  ActionIcon,
} from "@mantine/core";
import {
  HomeIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  BellIcon,
  QuestionMarkCircleIcon,
  ChevronLeftIcon,
  Bars3Icon,
  BookOpenIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

import { Authentication, Found } from "@/app/auth/auth";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { setActiveSection } from "@/store/slices/uiSlice";

interface StudSidebarProps {
  onItemClick?: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
}

export const StudSidebar = ({ 
  onItemClick, 
  collapsed = false, 
  onToggle 
}: StudSidebarProps) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { activeSection } = useAppSelector((state) => state.ui);
  const { sidebarOpened } = useAppSelector((state) => state.ui);
  const [user, setUser] = useState<any>(null);
  
  // Use pathname to determine active section for faster updates
  const currentActiveSection = useMemo(() => {
    const pathToSection: Record<string, string> = {
      '/dashboard/student/dashboard': 'dashboard',
      '/dashboard/student/view': 'myschedule',
      '/dashboard/student/announcement': 'announcements',
      '/dashboard/student/feedback': 'SubmitFeedback',
      '/dashboard/student/help': 'helpSupport',
      '/dashboard/student/courses': 'mycourses',
      '/dashboard/student/assignments': 'assignments',
      '/dashboard/student/grades': 'grades',
    };
    
    return pathToSection[pathname] || activeSection;
  }, [pathname, activeSection]);

  useEffect(() => {
    const checkAuth = async () => {
      const foundUser = await Found();
      setUser(foundUser);
    };
    checkAuth();
  }, []);

  // // Student data
  const studentInfo = useMemo(() => ({
    name: user?.full_name || "Student",
    code: user?.full_name?.charAt(0) || "S",
    department: user?.department_name || "Department",
    id: user?.student_id || "N/A",
  }), [user]);

  // Memoize menu definitions
  const menuDefinitions = useMemo(() => ({
    singleItems: [
      { key: "dashboard", Icon: HomeIcon, label: "Dashboard" },
      { key: "myschedule", Icon: CalendarDaysIcon, label: "My Class Schedule" },
      { key: "mycourses", Icon: BookOpenIcon, label: "My Courses" },
      { key: "assignments", Icon: AcademicCapIcon, label: "Assignments" },
      { key: "grades", Icon: ChartBarIcon, label: "Grades" },
      { key: "announcements", Icon: BellIcon, label: "Announcements" },
      { key: "SubmitFeedback", Icon: ChatBubbleLeftRightIcon, label: "Submit Feedback" },
      { key: "helpSupport", Icon: QuestionMarkCircleIcon, label: "Help & Support" },
    ]
  }), []);

  // Optimized handler for setting active section
  const handleSetActiveSection = useCallback((section: string) => {
    dispatch(setActiveSection(section));
    
    const pathMap: Record<string, string> = {
      "dashboard": "/dashboard/student/dashboard",
      "myschedule": "/dashboard/student/view",
      "mycourses": "/dashboard/student/courses",
      "assignments": "/dashboard/student/assignments",
      "grades": "/dashboard/student/grades",
      "announcements": "/dashboard/student/announcement",
      "SubmitFeedback": "/dashboard/student/feedback",
      "helpSupport": "/dashboard/student/help",
    };

    const path = pathMap[section];
    if (path) {
      router.push(path);
      if (onItemClick) onItemClick();
    }
  }, [dispatch, router, onItemClick]);

  // Render a single menu item
  const renderMenuItem = useCallback((item: { key: string; Icon: any; label: string }) => {
    const isActive = currentActiveSection === item.key;
    
    if (collapsed) {
      return (
        <Tooltip key={item.key} label={item.label} position="right" withArrow>
          <button
            onClick={() => handleSetActiveSection(item.key)}
            className={`w-full flex items-center justify-center p-3 mb-1 rounded-xl transition-all duration-200 ${
              isActive 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" 
                : "text-gray-600 hover:bg-blue-50"
            }`}
          >
            <item.Icon className="h-6 w-6 flex-shrink-0" />
          </button>
        </Tooltip>
      );
    }
  if (user === null) {
  return <Authentication />
}
    return (
      <button
        key={item.key}
        onClick={() => handleSetActiveSection(item.key)}
        className={`w-full flex items-center p-3 mb-1 rounded-lg transition-all duration-300 group ${
          isActive
            ? "bg-gradient-to-r from-blue-600 to-blue-600 text-white shadow-md shadow-blue-500/25"
            : "text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 hover:shadow-md"
        }`}
      >
        <Group gap="xs">
          <div className={`p-0 rounded-lg ${
            isActive 
              ? "bg-white/20" 
              : "bg-blue-50 group-hover:bg-blue-100"
          }`}>
            <item.Icon className={`h-5 w-5 ${
              isActive ? 'text-white' : 'text-blue-600 group-hover:text-blue-700'
            }`} />
          </div>
          <span className={`font-semibold text-sm transition-all duration-300 whitespace-nowrap overflow-hidden ${
            collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          }`}>
            {item.label}
          </span>
        </Group>
      </button>
    );
  }, [collapsed, user,currentActiveSection, handleSetActiveSection]);

  return (
    <div className={`flex flex-col h-full bg-gradient-to-b from-white to-gray-50/50 border-r border-gray-100 transition-all duration-300 ${
      collapsed ? "w-16" : "w-64"
    }`}>
      {/* Header */}
      {!sidebarOpened && (
        <Box className={`p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 transition-all duration-300 ${
          collapsed ? "justify-center" : ""
        }`}>
          {!collapsed && (
            <Group className="mb-4">
              <div className="flex-1 overflow-hidden">
                <Text size="sm" c="dimmed" className="mt-1 truncate">
                  {studentInfo.department}
                </Text>
              </div>
            </Group>
          )}
          
          {/* Collapse Toggle */}
          <div className="border-b dark:border-gray-800 flex items-center justify-between">
            {!collapsed && <Text fw={800} size="xs" color="blue" className="tracking-widest">MENU</Text>}
            <ActionIcon 
              variant="light" 
              color="blue" 
              onClick={onToggle}
              className={`transition-all duration-300 ${collapsed ? "w-full justify-center" : "ml-auto"}`}
            >
              {collapsed ? <Bars3Icon className="h-5 w-5" /> : <ChevronLeftIcon className="h-5 w-5" />}
            </ActionIcon>
          </div>
        </Box>
      )}

      {/* Navigation Links */}
      <ScrollArea className="flex-1 px-1 py-2">
        <div className="space-y-1">
          {/* Single Menu Items */}
          {menuDefinitions.singleItems.map(item => (
            <div key={item.key}>
              {renderMenuItem(item)}
            </div>
          ))}
        </div>

        {/* Quick Actions Footer (only show when expanded) */}
        {!collapsed && (
          <Box className="mt-8 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
            <Text fw={600} size="sm" className="text-green-800 mb-2">
              Quick Actions
            </Text>
            <Group gap="xs">
              <Badge color="green" variant="light" size="sm">
                Today&apos;s Classes
              </Badge>
              <Badge color="blue" variant="light" size="sm">
                Upcoming Assignments
              </Badge>
              <Badge color="orange" variant="light" size="sm">
                Exam Schedule
              </Badge>
            </Group>
          </Box>
        )}
      </ScrollArea>

      {/* Status Footer */}
      <Box className="p-3 border-t border-gray-100">
        {collapsed ? (
          <div className="flex justify-center">
            <Badge color="green" variant="dot" size="sm" />
          </div>
        ) : (
          <Group gap="xs">
            <Badge color="green" variant="light" size="sm">
              Student
            </Badge>
            <Text size="xs" c="dimmed" className="ml-auto">
              v1.0
            </Text>
          </Group>
        )}
      </Box>
    </div>
  );
};

// Add missing icon import
const ChartBarIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
  </svg>
);