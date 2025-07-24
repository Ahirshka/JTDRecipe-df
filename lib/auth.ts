export interface User {
  id: string
  username: string
  email: string
  password?: string
  avatar?: string
  provider?: string
  socialId?: string
  role: UserRole
  status: UserStatus
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
  moderationNotes?: ModerationNote[]
  favorites: string[]
  ratings: UserRating[]
  myRecipes: string[]
  isVerified: boolean
  isSuspended: boolean
  suspensionReason?: string
  suspensionExpiresAt?: string
  warningCount: number
}

export type UserRole = "user" | "moderator" | "admin" | "owner"
export type UserStatus = "active" | "suspended" | "banned" | "pending"

export interface ModerationNote {
  id: string
  moderatorId: string
  moderatorName: string
  note: string
  action: ModerationAction
  createdAt: string
}

export type ModerationAction = "warning" | "suspension" | "ban" | "note" | "verification" | "role_change"

export interface UserRating {
  recipeId: string
  rating: number
  createdAt: string
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
}

// Define role hierarchy with explicit levels
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 1,
  moderator: 2,
  admin: 3,
  owner: 4,
} as const

// Define role permissions
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  user: ["view_recipes", "create_recipes", "rate_recipes", "favorite_recipes"],
  moderator: [
    "view_recipes",
    "create_recipes",
    "rate_recipes",
    "favorite_recipes",
    "moderate_recipes",
    "moderate_comments",
    "view_reports",
  ],
  admin: [
    "view_recipes",
    "create_recipes",
    "rate_recipes",
    "favorite_recipes",
    "moderate_recipes",
    "moderate_comments",
    "view_reports",
    "manage_users",
    "manage_categories",
    "view_analytics",
  ],
  owner: [
    "view_recipes",
    "create_recipes",
    "rate_recipes",
    "favorite_recipes",
    "moderate_recipes",
    "moderate_comments",
    "view_reports",
    "manage_users",
    "manage_categories",
    "view_analytics",
    "manage_system",
    "manage_admins",
  ],
} as const

// Permission checking functions with proper error handling
export const hasPermission = (userRole: UserRole | string | undefined, requiredRole: UserRole | string): boolean => {
  // Handle undefined or null roles
  if (!userRole || !requiredRole) {
    return false
  }

  // Ensure roles are valid
  const validRoles: UserRole[] = ["user", "moderator", "admin", "owner"]

  if (!validRoles.includes(userRole as UserRole) || !validRoles.includes(requiredRole as UserRole)) {
    return false
  }

  const userLevel = ROLE_HIERARCHY[userRole as UserRole] || 0
  const requiredLevel = ROLE_HIERARCHY[requiredRole as UserRole] || 0

  return userLevel >= requiredLevel
}

export const canModerateUser = (
  moderatorRole: UserRole | string | undefined,
  targetRole: UserRole | string | undefined,
): boolean => {
  // Handle undefined roles
  if (!moderatorRole || !targetRole) {
    return false
  }

  const validRoles: UserRole[] = ["user", "moderator", "admin", "owner"]

  if (!validRoles.includes(moderatorRole as UserRole) || !validRoles.includes(targetRole as UserRole)) {
    return false
  }

  const moderatorLevel = ROLE_HIERARCHY[moderatorRole as UserRole] || 0
  const targetLevel = ROLE_HIERARCHY[targetRole as UserRole] || 0

  return moderatorLevel > targetLevel
}

// Check if user has specific permission
export const hasSpecificPermission = (userRole: UserRole | string | undefined, permission: string): boolean => {
  if (!userRole) {
    return false
  }

  const validRoles: UserRole[] = ["user", "moderator", "admin", "owner"]

  if (!validRoles.includes(userRole as UserRole)) {
    return false
  }

  const permissions = ROLE_PERMISSIONS[userRole as UserRole] || []
  return permissions.includes(permission)
}

// Get user role level
export const getRoleLevel = (role: UserRole | string | undefined): number => {
  if (!role) {
    return 0
  }

  return ROLE_HIERARCHY[role as UserRole] || 0
}

// Check if role is valid
export const isValidRole = (role: string | undefined): role is UserRole => {
  if (!role) {
    return false
  }

  const validRoles: UserRole[] = ["user", "moderator", "admin", "owner"]
  return validRoles.includes(role as UserRole)
}

// Get default role
export const getDefaultRole = (): UserRole => {
  return "user"
}

// Simple storage functions (in production, use a proper database)
export const saveUser = (
  userData: Omit<
    User,
    | "id"
    | "createdAt"
    | "updatedAt"
    | "favorites"
    | "ratings"
    | "myRecipes"
    | "isVerified"
    | "isSuspended"
    | "warningCount"
  >,
): User => {
  const users = getUsers()
  const newUser: User = {
    ...userData,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    favorites: [],
    ratings: [],
    myRecipes: [],
    isVerified: false,
    isSuspended: false,
    warningCount: 0,
    role: userData.role || "user",
    status: userData.status || "active",
  }

  users.push(newUser)
  if (typeof window !== "undefined") {
    localStorage.setItem("recipe_users", JSON.stringify(users))
  }
  return newUser
}

export const updateUser = (userId: string, updates: Partial<User>): User | null => {
  const users = getUsers()
  const userIndex = users.findIndex((user) => user.id === userId)

  if (userIndex === -1) return null

  users[userIndex] = {
    ...users[userIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  if (typeof window !== "undefined") {
    localStorage.setItem("recipe_users", JSON.stringify(users))
  }

  // Update current user if it's the same user
  const currentUser = getCurrentUser()
  if (currentUser && currentUser.id === userId) {
    setCurrentUser(users[userIndex])
  }

  return users[userIndex]
}

export const getUsers = (): User[] => {
  if (typeof window === "undefined") return []
  const users = localStorage.getItem("recipe_users")
  return users ? JSON.parse(users) : []
}

export const getAllUsersForModeration = (): User[] => {
  return getUsers().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export const findUser = (email: string, password: string): User | null => {
  const users = getUsers()
  const user = users.find((user) => user.email === email && user.password === password) || null

  if (user) {
    // Update last login
    updateUser(user.id, { lastLoginAt: new Date().toISOString() })
    return { ...user, lastLoginAt: new Date().toISOString() }
  }

  return null
}

export const findUserByEmail = (email: string): User | null => {
  const users = getUsers()
  return users.find((user) => user.email === email) || null
}

export const findUserById = (id: string): User | null => {
  const users = getUsers()
  return users.find((user) => user.id === id) || null
}

export const getCurrentUser = (): User | null => {
  if (typeof window === "undefined") return null
  const currentUser = localStorage.getItem("current_user")
  return currentUser ? JSON.parse(currentUser) : null
}

export const setCurrentUser = (user: User | null): void => {
  if (typeof window === "undefined") return

  if (user) {
    localStorage.setItem("current_user", JSON.stringify(user))
  } else {
    localStorage.removeItem("current_user")
  }
}

export const logout = (): void => {
  if (typeof window === "undefined") return
  localStorage.removeItem("current_user")
}

// Check if user is authenticated
export function isAuthenticated(user: User | null): boolean {
  return user !== null && user.status === "active"
}

// Check if user is admin
export function isAdmin(user: User | null): boolean {
  return user !== null && hasPermission(user.role, "admin")
}

// Check if user is moderator or higher
export function isModerator(user: User | null): boolean {
  return user !== null && hasPermission(user.role, "moderator")
}

// Get user display name
export function getUserDisplayName(user: User | null): string {
  if (!user) return "Guest"
  return user.username || user.email || "User"
}

// Get user initials for avatar
export function getUserInitials(user: User | null): string {
  if (!user || !user.username) return "U"

  const names = user.username.split(" ")
  if (names.length >= 2) {
    return `${names[0][0]}${names[1][0]}`.toUpperCase()
  }

  return user.username.charAt(0).toUpperCase()
}

// Role display functions
export function getRoleDisplayName(role: UserRole | string | undefined): string {
  if (!role || !isValidRole(role)) {
    return "User"
  }

  const roleNames: Record<UserRole, string> = {
    user: "User",
    moderator: "Moderator",
    admin: "Administrator",
    owner: "Owner",
  }

  return roleNames[role as UserRole] || "User"
}

export function getRoleBadgeColor(role: UserRole | string | undefined): string {
  if (!role || !isValidRole(role)) {
    return "bg-gray-100 text-gray-800"
  }

  const roleColors: Record<UserRole, string> = {
    user: "bg-gray-100 text-gray-800",
    moderator: "bg-blue-100 text-blue-800",
    admin: "bg-red-100 text-red-800",
    owner: "bg-purple-100 text-purple-800",
  }

  return roleColors[role as UserRole] || "bg-gray-100 text-gray-800"
}

// Missing exports that were required
export async function suspendUser(userId: string, reason: string, durationDays: number): Promise<boolean> {
  try {
    const users = getUsers()
    const userIndex = users.findIndex((user) => user.id === userId)

    if (userIndex === -1) return false

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + durationDays)

    users[userIndex] = {
      ...users[userIndex],
      status: "suspended",
      isSuspended: true,
      suspensionReason: reason,
      suspensionExpiresAt: expiresAt.toISOString(),
      updatedAt: new Date().toISOString(),
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("recipe_users", JSON.stringify(users))
    }

    return true
  } catch (error) {
    console.error("Error suspending user:", error)
    return false
  }
}

export async function unsuspendUser(userId: string): Promise<boolean> {
  try {
    const users = getUsers()
    const userIndex = users.findIndex((user) => user.id === userId)

    if (userIndex === -1) return false

    users[userIndex] = {
      ...users[userIndex],
      status: "active",
      isSuspended: false,
      suspensionReason: undefined,
      suspensionExpiresAt: undefined,
      updatedAt: new Date().toISOString(),
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("recipe_users", JSON.stringify(users))
    }

    return true
  } catch (error) {
    console.error("Error unsuspending user:", error)
    return false
  }
}

export async function banUser(userId: string, reason: string): Promise<boolean> {
  try {
    const users = getUsers()
    const userIndex = users.findIndex((user) => user.id === userId)

    if (userIndex === -1) return false

    users[userIndex] = {
      ...users[userIndex],
      status: "banned",
      suspensionReason: reason,
      updatedAt: new Date().toISOString(),
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("recipe_users", JSON.stringify(users))
    }

    return true
  } catch (error) {
    console.error("Error banning user:", error)
    return false
  }
}

export async function changeUserRole(userId: string, newRole: UserRole): Promise<boolean> {
  try {
    const users = getUsers()
    const userIndex = users.findIndex((user) => user.id === userId)

    if (userIndex === -1) return false

    users[userIndex] = {
      ...users[userIndex],
      role: newRole,
      updatedAt: new Date().toISOString(),
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("recipe_users", JSON.stringify(users))
    }

    return true
  } catch (error) {
    console.error("Error changing user role:", error)
    return false
  }
}

export async function verifyUser(userId: string): Promise<boolean> {
  try {
    const users = getUsers()
    const userIndex = users.findIndex((user) => user.id === userId)

    if (userIndex === -1) return false

    users[userIndex] = {
      ...users[userIndex],
      isVerified: true,
      updatedAt: new Date().toISOString(),
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("recipe_users", JSON.stringify(users))
    }

    return true
  } catch (error) {
    console.error("Error verifying user:", error)
    return false
  }
}

export async function warnUser(userId: string, reason: string): Promise<boolean> {
  try {
    const users = getUsers()
    const userIndex = users.findIndex((user) => user.id === userId)

    if (userIndex === -1) return false

    users[userIndex] = {
      ...users[userIndex],
      warningCount: (users[userIndex].warningCount || 0) + 1,
      updatedAt: new Date().toISOString(),
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("recipe_users", JSON.stringify(users))
    }

    return true
  } catch (error) {
    console.error("Error warning user:", error)
    return false
  }
}
