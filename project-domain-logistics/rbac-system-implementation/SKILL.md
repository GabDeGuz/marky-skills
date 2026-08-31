---
name: rbac-system-implementation
description: Complete pattern for implementing Role-Based Access Control with permission matrices, stores, hooks, guards, and admin UI
source: auto-skill
extracted_at: '2026-05-28T07:17:05.151Z'
---

## RBAC System Implementation Pattern

This skill documents the complete pattern for implementing a Role-Based Access Control (RBAC) system with permission matrices, suitable for applications requiring fine-grained access control across multiple roles and resources.

### Architecture Overview

The RBAC system consists of 7 key components:
1. **Type definitions** — Roles, resources, permissions, and access levels
2. **Configuration file** — Permission matrices and metadata
3. **Zustand store** — State management with persistence
4. **Permission hooks** — React hooks for checking access
5. **Guard components** — Conditional rendering based on permissions
6. **Admin UI** — Interface for managing permissions
7. **Integration** — Connecting to existing navigation and settings

### Step 1: Define Types (`lib/types/rbac.ts`)

Create comprehensive type definitions for the entire RBAC system:

```typescript
// Define all possible roles
export type RoleId = 
  | "owner"
  | "executive"
  | "compliance"
  | "finance"
  | "client_relations"
  | "hr"
  | "garage_coordinator"
  | "employee"
  | "partner";

// Define all resources that can be accessed
export type Resource =
  // Forms
  | "trip_dispatch"
  | "additional_partner"
  | "fleet_management"
  // Monitoring
  | "current_trip_monitoring"
  | "previous_trip_monitoring"
  // System
  | "settings"
  | "users"
  | "audit_logs";

// Define access levels
export type AccessLevel =
  | "view_comment"
  | "view_only"
  | "input_edit"
  | "first_approval"
  | "second_approval"
  | "final_approval"
  | "records"
  | "originate";

// Permission matrix structure
export interface PermissionMatrix {
  [roleId: string]: {
    [resource in Resource]?: AccessLevel[];
  };
}

// Resource metadata for UI
export interface ResourceMetadata {
  id: Resource;
  label: string;
  description: string;
  category: "Forms" | "Monitoring" | "System";
  group?: string;
}

// Access level metadata for UI
export interface AccessLevelMetadata {
  id: AccessLevel;
  label: string;
  description: string;
  color: string;
}
```

**Key patterns:**
- Use union types for strict type checking
- Separate runtime IDs from metadata
- Include descriptions for UI tooltips

### Step 2: Create Configuration (`lib/config/rbac.ts`)

Define the default permission matrix and all metadata:

```typescript
import type { PermissionMatrix, ResourceMetadata, AccessLevelMetadata } from "@/lib/types/rbac";

// Role constants with mapping
export const ROLE_IDS = {
  OWNER: "owner",
  EXECUTIVE: "executive",
  COMPLIANCE: "compliance",
  // ... all roles
} as const;

// Resource metadata array
export const RESOURCE_METADATA: ResourceMetadata[] = [
  {
    id: "trip_dispatch",
    label: "Trip Dispatch Form",
    description: "Create and manage trip dispatches",
    category: "Forms",
    group: "Operations"
  },
  // ... all resources
];

// Access level metadata with colors
export const ACCESS_LEVEL_METADATA: AccessLevelMetadata[] = [
  {
    id: "view_comment",
    label: "View & Comment",
    description: "Can view and add comments",
    color: "bg-blue-100 text-blue-800"
  },
  // ... all access levels
];

// Default permission matrix
export const DEFAULT_PERMISSION_MATRIX: PermissionMatrix = {
  owner: {
    trip_dispatch: ["final_approval", "view_comment"],
    current_trip_monitoring: ["view_comment"],
    settings: ["input_edit"],
    // ... all permissions
  },
  executive: {
    trip_dispatch: ["second_approval", "view_comment"],
    // ... all permissions
  },
  // ... all roles
};

// Helper functions
export function hasPermission(
  roleId: string,
  resource: Resource,
  accessLevel: AccessLevel,
  matrix: PermissionMatrix = DEFAULT_PERMISSION_MATRIX
): boolean {
  return matrix[roleId]?.[resource]?.includes(accessLevel) ?? false;
}
```

**Key patterns:**
- Use `as const` for role ID constants
- Include all metadata in one file for easy maintenance
- Provide helper functions for common checks
- Use optional chaining (`?.`) for safe property access

### Step 3: Create Zustand Store (`lib/store/rbac.ts`)

Implement persistent state management:

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PermissionMatrix, Resource, AccessLevel } from "@/lib/types/rbac";
import { DEFAULT_PERMISSION_MATRIX } from "@/lib/config/rbac";
import { BRAND } from "@/lib/config/brand";

interface RBACState {
  permissionMatrix: PermissionMatrix;
  updatePermission: (roleId: string, resource: Resource, accessLevels: AccessLevel[]) => void;
  resetToDefault: () => void;
  hasPermission: (roleId: string, resource: Resource, accessLevel: AccessLevel) => boolean;
}

export const useRBACStore = create<RBACState>()(
  persist(
    (set, get) => ({
      permissionMatrix: DEFAULT_PERMISSION_MATRIX,

      updatePermission: (roleId, resource, accessLevels) =>
        set((state) => {
          const newMatrix = { ...state.permissionMatrix };
          if (!newMatrix[roleId]) {
            newMatrix[roleId] = {};
          }
          newMatrix[roleId][resource] = accessLevels;
          return { permissionMatrix: newMatrix };
        }),

      resetToDefault: () =>
        set({ permissionMatrix: DEFAULT_PERMISSION_MATRIX }),

      hasPermission: (roleId, resource, accessLevel) => {
        const matrix = get().permissionMatrix;
        return matrix[roleId]?.[resource]?.includes(accessLevel) ?? false;
      },
    }),
    {
      name: `${BRAND.storeKey}-rbac`, // e.g., "skl-rbac"
    }
  )
);
```

**Key patterns:**
- Use `persist` middleware for localStorage
- Prefix storage key with brand store key
- Initialize with default matrix
- Provide reset functionality
- Use `get()` to access current state in methods

### Step 4: Create Permission Hooks (`lib/hooks/usePermission.ts`)

Build React hooks that integrate with the auth store:

```typescript
import { useAuthStore } from "@/lib/store/auth";
import { useRBACStore } from "@/lib/store/rbac";
import type { Resource, AccessLevel } from "@/lib/types/rbac";
import { ROLE_IDS } from "@/lib/config/rbac";

// Map existing user roles to RBAC role IDs
const ROLE_MAPPING: Record<string, string> = {
  super_admin: ROLE_IDS.OWNER,
  company_admin: ROLE_IDS.EXECUTIVE,
  dispatcher: ROLE_IDS.CLIENT_RELATIONS,
  // ... all mappings
};

export function usePermission() {
  const user = useAuthStore((s) => s.user);
  const hasPermission = useRBACStore((s) => s.hasPermission);
  const permissionMatrix = useRBACStore((s) => s.permissionMatrix);

  // Get RBAC role ID from user role
  const rbacRoleId = user ? ROLE_MAPPING[user.role] : null;

  return {
    // Direct permission check
    can: (resource: Resource, accessLevel: AccessLevel) => {
      if (!rbacRoleId) return false;
      return hasPermission(rbacRoleId, resource, accessLevel);
    },

    // Check any of multiple access levels
    canAny: (resource: Resource, accessLevels: AccessLevel[]) => {
      if (!rbacRoleId) return false;
      return accessLevels.some((level) => 
        hasPermission(rbacRoleId, resource, level)
      );
    },

    // Convenience methods
    canView: (resource: Resource) => {
      if (!rbacRoleId) return false;
      return (
        hasPermission(rbacRoleId, resource, "view_comment") ||
        hasPermission(rbacRoleId, resource, "view_only") ||
        hasPermission(rbacRoleId, resource, "input_edit")
      );
    },

    canEdit: (resource: Resource) => {
      if (!rbacRoleId) return false;
      return hasPermission(rbacRoleId, resource, "input_edit");
    },

    canApprove: (resource: Resource) => {
      if (!rbacRoleId) return false;
      return (
        hasPermission(rbacRoleId, resource, "first_approval") ||
        hasPermission(rbacRoleId, resource, "second_approval") ||
        hasPermission(rbacRoleId, resource, "final_approval")
      );
    },

    // Get all permissions for current role
    getPermissions: (resource: Resource): AccessLevel[] => {
      if (!rbacRoleId) return [];
      return permissionMatrix[rbacRoleId]?.[resource] ?? [];
    },
  };
}
```

**Key patterns:**
- Map existing auth roles to RBAC roles
- Provide both low-level (`can`) and high-level (`canView`) methods
- Return false if user not authenticated
- Use memoized selectors for performance

### Step 5: Create Guard Components (`components/rbac/PermissionGuard.tsx`)

Build reusable guard components:

```typescript
"use client";

import { usePermission } from "@/lib/hooks/usePermission";
import type { Resource, AccessLevel } from "@/lib/types/rbac";

interface PermissionGuardProps {
  resource: Resource;
  requiredAccess: AccessLevel;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

export function PermissionGuard({
  resource,
  requiredAccess,
  children,
  fallback = null,
  showFallback = false,
}: PermissionGuardProps) {
  const { can } = usePermission();

  if (!can(resource, requiredAccess)) {
    return showFallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

// Guard for checking any of multiple access levels
export function PermissionGuardAny({
  resource,
  requiredAccessLevels,
  children,
  fallback = null,
  showFallback = false,
}: {
  resource: Resource;
  requiredAccessLevels: AccessLevel[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}) {
  const { canAny } = usePermission();

  if (!canAny(resource, requiredAccessLevels)) {
    return showFallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}
```

**Key patterns:**
- Support both single and multiple access level checks
- Allow custom fallback UI
- Use fragments (`<>`) to avoid extra DOM nodes
- Provide sensible defaults

### Step 6: Create Admin UI (`app/(app)/settings/rbac/page.tsx`)

Build a comprehensive admin interface:

```typescript
"use client";

import { useState } from "react";
import { useRBACStore } from "@/lib/store/rbac";
import { RESOURCE_METADATA, ACCESS_LEVEL_METADATA, ROLE_IDS } from "@/lib/config/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, RotateCcw, Download } from "lucide-react";

export default function RBACSettingsPage() {
  const { permissionMatrix, updatePermission, resetToDefault } = useRBACStore();
  const [selectedRole, setSelectedRole] = useState(ROLE_IDS.OWNER);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "Forms" | "Monitoring" | "System">("all");

  // Filter resources
  const filteredResources = RESOURCE_METADATA.filter((resource) => {
    const matchesSearch = resource.label.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || resource.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Update permission handler
  const handlePermissionChange = (
    resource: Resource,
    accessLevel: AccessLevel,
    checked: boolean
  ) => {
    const current = permissionMatrix[selectedRole]?.[resource] ?? [];
    const updated = checked
      ? [...current, accessLevel]
      : current.filter((level) => level !== accessLevel);
    updatePermission(selectedRole, resource, updated);
  };

  return (
    <div className="space-y-6">
      {/* Role selector tabs */}
      <Tabs value={selectedRole} onValueChange={setSelectedRole}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-9">
          <TabsTrigger value={ROLE_IDS.OWNER}>Owner</TabsTrigger>
          <TabsTrigger value={ROLE_IDS.EXECUTIVE}>Executive</TabsTrigger>
          {/* ... all roles */}
        </TabsList>
      </Tabs>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex gap-4">
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Forms">Forms</SelectItem>
              <SelectItem value="Monitoring">Monitoring</SelectItem>
              <SelectItem value="System">System</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={resetToDefault}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </CardContent>
      </Card>

      {/* Permission matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredResources.map((resource) => (
            <div key={resource.id} className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">{resource.label}</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {resource.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {ACCESS_LEVEL_METADATA.map((accessLevel) => {
                  const isChecked = permissionMatrix[selectedRole]?.[resource.id]?.includes(accessLevel.id);
                  return (
                    <div key={accessLevel.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`${resource.id}-${accessLevel.id}`}
                        checked={isChecked}
                        onCheckedChange={(checked) =>
                          handlePermissionChange(resource.id, accessLevel.id, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={`${resource.id}-${accessLevel.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {accessLevel.label}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
```

**Key patterns:**
- Use tabs for role selection
- Provide search and filter functionality
- Use checkboxes for permission toggles
- Show current permissions with badges
- Include reset to default button

### Step 7: Integrate with Navigation and Settings

**Add to settings page** (`app/(app)/settings/page.tsx`):

```typescript
<TabsTrigger value="rbac">
  <Shield className="w-4 h-4 mr-2" />
  Access Control
</TabsTrigger>

<TabsContent value="rbac">
  <Card>
    <CardContent className="pt-6">
      <p className="mb-4">
        Manage role-based permissions and access levels for all system roles.
      </p>
      <Button asChild>
        <Link href="/settings/rbac">Open RBAC Manager</Link>
      </Button>
    </CardContent>
  </Card>
</TabsContent>
```

**Export store** from `lib/store/index.ts`:

```typescript
export { useRBACStore } from "./rbac";
```

### Usage Examples

#### In Page Components

```typescript
"use client";

import { usePermission } from "@/lib/hooks/usePermission";
import { PermissionGuard } from "@/components/rbac/PermissionGuard";

export default function FleetPage() {
  const { canEdit, canApprove } = usePermission();

  return (
    <div>
      <h1>Fleet Management</h1>
      
      {/* Conditional rendering with hook */}
      {canEdit("fleet_management") && (
        <Button>Add Vehicle</Button>
      )}

      {/* Conditional rendering with guard */}
      <PermissionGuard
        resource="fleet_management"
        requiredAccess="input_edit"
        fallback={<p>You don't have edit permissions</p>}
        showFallback
      >
        <VehicleForm />
      </PermissionGuard>
    </div>
  );
}
```

#### In Navigation

```typescript
// lib/auth/roles.ts
export const NAV_ITEMS: NavItem[] = [
  {
    label: "Fleet Management",
    href: "/fleet",
    icon: Truck,
    group: "operations",
    roles: ["super_admin", "company_admin", "dispatcher"],
    // RBAC check happens in component
  },
];

// components/layout/Sidebar.tsx
function Sidebar() {
  const { canView } = usePermission();
  const items = navForRole(user?.role).filter(
    (item) => !item.featureKey || canView(item.featureKey as Resource)
  );
  // ... render items
}
```

### Common Pitfalls

#### 1. Missing Role Mapping
If a user role isn't in `ROLE_MAPPING`, they'll have no permissions. Always include all possible roles:

```typescript
const ROLE_MAPPING: Record<string, string> = {
  super_admin: ROLE_IDS.OWNER,
  company_admin: ROLE_IDS.EXECUTIVE,
  // Don't forget platform_owner, client, partner, etc.
  client: ROLE_IDS.CLIENT,
  partner: ROLE_IDS.PARTNER,
};
```

#### 2. TypeScript Errors with Dynamic Resource Keys
When using variables as resource keys, TypeScript may complain:

```typescript
// ❌ Error: Type 'string' is not assignable to type 'Resource'
const resource = "fleet_management";
canView(resource);

// ✅ Cast to Resource type
const resource = "fleet_management" as Resource;
canView(resource);

// ✅ Or use literal
canView("fleet_management");
```

#### 3. Permission Matrix Not Persisting
If changes don't persist, check:
- Store is using `persist` middleware
- Storage key is unique (use brand prefix)
- No other code is resetting the store

#### 4. Admin UI Not Updating
If the admin UI doesn't reflect changes:
- Ensure you're using `useRBACStore` selectors, not local state
- Check that `updatePermission` is being called with correct parameters
- Verify the store is exported from `lib/store/index.ts`

### Testing Checklist

- [ ] All roles have permissions defined in matrix
- [ ] Permission hooks return correct values for each role
- [ ] Guard components show/hide content correctly
- [ ] Admin UI can modify permissions
- [ ] Changes persist across page reloads
- [ ] Reset to default works correctly
- [ ] Navigation respects permissions
- [ ] Settings page links to RBAC manager
- [ ] Build passes with `npm run build`

### File Checklist

- [ ] `lib/types/rbac.ts` — Type definitions
- [ ] `lib/config/rbac.ts` — Permission matrix and metadata
- [ ] `lib/store/rbac.ts` — Zustand store
- [ ] `lib/hooks/usePermission.ts` — Permission hooks
- [ ] `components/rbac/PermissionGuard.tsx` — Guard components
- [ ] `app/(app)/settings/rbac/page.tsx` — Admin UI
- [ ] `lib/store/index.ts` — Store export added
- [ ] `app/(app)/settings/page.tsx` — Link to RBAC manager

### Documentation

Always create comprehensive documentation in `docs/RBAC-SYSTEM.md` including:
- System overview and architecture
- Permission matrix tables
- Usage examples
- Integration guide
- Troubleshooting tips

This pattern scales well to hundreds of resources and dozens of roles while maintaining type safety and providing a user-friendly admin interface.
