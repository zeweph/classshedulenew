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
} from "@heroicons/react/24/outline";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

import { Authentication, Found } from "@/app/auth/auth";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { setActiveSection } from "@/store/slices/uiSlice";

interface InstSidebarProps {
  onItemClick?: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
}

export const InstSidebar = ({ 
  onItemClick, 
  collapsed = false, 
  onToggle 
}: InstSidebarProps) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { activeSection } = useAppSelector((state) => state.ui);
  const { sidebarOpened } = useAppSelector((state) => state.ui);
  const [user, setUser] = useState<any>(null);
  
  // Use pathname to determine active section for faster updates
  const currentActiveSection = useMemo(() => {
    const pathToSection: Record<string, string> = {
      '/dashboard/instructor/dashboard': 'dashboard',
      '/dashboard/instructor/view': 'myschedule',
      '/dashboard/instructor/announcement': 'announcements',
      '/dashboard/instructor/feedback': 'SubmitFeedback',
      '/dashboard/instructor/help': 'helpSupport',
      '/dashboard/chat': 'chat',
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

  // Instructor data
  const instructorInfo = useMemo(() => ({
    name: user?.full_name || "Instructor",
    code: user?.full_name?.charAt(0) || "I",
    department: user?.department_name || "Department",
  }), [user]);

  // Memoize menu definitions
  const menuDefinitions = useMemo(() => ({
    singleItems: [
      { key: "dashboard", Icon: HomeIcon, label: "Dashboard" },
      { key: "myschedule", Icon: CalendarDaysIcon, label: "My Teaching Schedule" },
      { key: "announcements", Icon: BellIcon, label: "Announcements" },
      { key: "chat", Icon: ChatBubbleLeftRightIcon, label: "Chat" },
      { key: "SubmitFeedback", Icon: ChatBubbleLeftRightIcon, label: "Submit Feedback" },
      { key: "helpSupport", Icon: QuestionMarkCircleIcon, label: "Help & Support" },
    ]
  }), []);

  // Optimized handler for setting active section
  const handleSetActiveSection = useCallback((section: string) => {
    dispatch(setActiveSection(section));
    
    const pathMap: Record<string, string> = {
      "dashboard": "/dashboard/instructor/dashboard",
      "myschedule": "/dashboard/instructor/view",
      "announcements": "/dashboard/instructor/announcement",
      "SubmitFeedback": "/dashboard/instructor/feedback",
      "helpSupport": "/dashboard/instructor/help",
      'chat':'/dashboard/chat',
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
  }, [collapsed, currentActiveSection, handleSetActiveSection, user]);

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
                  {instructorInfo.department}
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
                Assignments
              </Badge>
              <Badge color="orange" variant="light" size="sm">
                Office Hours
              </Badge>
            </Group>
          </Box>
        )}
      </ScrollArea>

      {/* Status Footer */}
      <Box className="p-3 border-t border-gray-100">
        {collapsed ? (
          <div className="flex justify-center">
            <Badge color="blue" variant="dot" size="sm" />
          </div>
        ) : (
          <Group gap="xs">
            <Badge color="blue" variant="light" size="sm">
              Instructor
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