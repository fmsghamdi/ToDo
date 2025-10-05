export type Role = "admin" | "employee";

export type Permission = 
  | "view_board"
  | "create_task"
  | "edit_task"
  | "delete_task"
  | "move_task"
  | "view_dashboard"
  | "view_control_panel"
  | "manage_users"
  | "manage_board";

export const ALL_PERMISSIONS: Permission[] = [
  "view_board",
  "view_dashboard",
  "view_control_panel",
  "create_task",
  "edit_task",
  "delete_task",
  "move_task",
  "manage_users",
  "manage_board",
];

export const DEFAULT_ADMIN_PERMISSIONS: Permission[] = [...ALL_PERMISSIONS];

export const DEFAULT_EMPLOYEE_PERMISSIONS: Permission[] = [
  "view_board",
  "view_dashboard",
  "create_task",
  "edit_task",
  "move_task",
];

export type User = {
  id: string;
  name: string;
  email: string;
  password: string; // Demo only: stored in plain text in localStorage
  role: Role;
  permissions: Permission[];
  avatar?: string; // optional emoji or URL
  department?: string; // AD user department
  title?: string; // AD user job title
  isADUser?: boolean; // Flag to identify AD users
};
