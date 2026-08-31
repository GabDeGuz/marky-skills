---
name: add-expandable-sidebar-module
description: Step-by-step procedure for adding a new module with expandable sidebar nav, including types, seed data, Zustand stores, and pages — with common pitfalls
source: auto-skill
extracted_at: '2026-05-28T06:29:14.127Z'
---

## Adding a New Expandable Sidebar Module

This procedure covers adding a new module (like Attendance) that appears as an expandable item in the sidebar with multiple sub-pages.

### Procedure (follow this exact order)

#### 1. Add TypeScript types to `lib/types.ts`

Define all interfaces and type unions needed. Example for Attendance:
```typescript
export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  // ... all fields
}
export type EmployeeStatus = "active" | "on_leave" | "resigned";
```

#### 2. Create seed data files in `lib/data/`

Create realistic mock data that matches the types. Each file should export a `seed<Name>` array:
```typescript
// lib/data/employees.ts
import type { Employee } from "@/lib/types";
export const seedEmployees: Employee[] = [ /* 10-20 records */ ];
```

#### 3. Create Zustand stores in `lib/store/`

Create a new store file with full CRUD operations:
```typescript
// lib/store/attendance.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BRAND } from "@/lib/config/brand";
import type { Employee } from "@/lib/types";
import { seedEmployees } from "@/lib/data/employees";

export const useEmployeeStore = create<EmployeeState>()(
  persist(
    (set, get) => ({
      employees: seedEmployees,
      addEmployee: (e) => { /* ... */ },
      updateEmployee: (id, patch) => { /* ... */ },
      deleteEmployee: (id) => { /* ... */ },
      reset: () => set({ employees: seedEmployees }),
    }),
    { name: `${BRAND.storeKey}-employees` }
  )
);
```

#### 4. Export stores from `lib/store/index.ts`

Add to the bottom of the file:
```typescript
export { useEmployeeStore, useDriverHelperStore } from "./attendance";
```

**Also add to `resetAllDemoData()` function** in the same file — add the new store key to the array of localStorage keys to clear:
```typescript
[
  // ... existing keys
  `${p}-employees`, `${p}-driver-helpers`, `${p}-maxicare`,
].forEach((k) => localStorage.removeItem(k));
```

#### 5. Update navigation in `lib/auth/roles.ts`

The parent nav item must have `roles` array defining which roles can see it. The `href` should match the expandable `basePath` in Sidebar.

#### 6. Update Sidebar in `components/layout/Sidebar.tsx`

This requires 4 changes:

**a) Add imports for new icons:**
```typescript
import { CalendarClock, Users, ShieldCheck, Heart } from "lucide-react";
```

**b) Define the CHILDREN array (after other CHILDREN arrays):**
```typescript
const ATTENDANCE_CHILDREN = [
  { label: "Daily Attendance", href: "/attendance/daily", icon: CalendarClock },
  { label: "SKL Employee Masterlist", href: "/attendance/employees", icon: Users },
  { label: "SKIS Driver/Helper", href: "/attendance/driver-helpers", icon: ShieldCheck },
  { label: "Maxicare", href: "/attendance/maxicare", icon: Heart },
];
```

**c) Add the `isX` check in the nav render logic:**
```typescript
const isAttendance = item.href === "/attendance";
const active =
  pathname === item.href || (item.href !== "/dashboard" && !isBilling && !isDocuments && !isClientPortal && !isPayroll && !isAttendance && pathname.startsWith(item.href));
```

**d) Add the ExpandableNav case:**
```typescript
) : isAttendance ? (
  <ExpandableNav collapsed={collapsed} pathname={pathname} item={item} childrenItems={ATTENDANCE_CHILDREN} basePath="/attendance" />
) : (
```

#### 7. Create page files

- Move existing page to a sub-route if needed (e.g., `/attendance/page.tsx` → `/attendance/daily/page.tsx`)
- Create an index redirect at `/attendance/page.tsx`:
  ```typescript
  import { redirect } from "next/navigation";
  export default function AttendanceIndexPage() {
    redirect("/attendance/daily");
  }
  ```
- Create new page files for each child route

#### 8. Verify with build

```bash
npx tsc --noEmit  # Check types first
npx next build    # Then full build
```

### 4b. Add feature flag to `lib/store/features.ts` (if using featureKey)

If the nav item in `lib/auth/roles.ts` uses a `featureKey`, you MUST add it to two places in `lib/store/features.ts`:

**a) Add to the `FeatureKey` type union:**
```typescript
export type FeatureKey =
  | "fleet_management"
  // ... existing keys
  | "hr_documents";  // ← Add new key
```

**b) Add to the `FEATURE_META` array:**
```typescript
{ key: "hr_documents", label: "HR Quick Actions", description: "HR documents, incident reports, NTE, NOD, warnings, payslips", group: "Finance & HR" },
```

Without both additions, the TypeScript compiler will error on the `featureKey` reference in `lib/auth/roles.ts`.

### Common Pitfalls (from trial and error)

#### Missing shadcn/ui components
The project does NOT have all shadcn components installed. Common missing ones:
- **`Label`** — Does NOT exist. Create `components/ui/label.tsx` using `@radix-ui/react-label`
- **`Textarea`** — Is exported from `components/ui/input.tsx`, NOT as a separate file. Import as:
  ```typescript
  import { Input, Textarea } from "@/components/ui/input";
  ```
  Alternatively, create `components/ui/textarea.tsx` as a standalone file (using `type` not `interface` to avoid ESLint `no-empty-object-type` error):
  ```typescript
  export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>
  ```

#### `useAuthStore` is NOT exported from `lib/store/index.ts`
The auth store lives in `lib/store/auth.ts` but is **not** re-exported from the barrel `lib/store/index.ts`. If a page needs it, either:
- Import directly: `import { useAuthStore } from "@/lib/store/auth";`
- Or add it to the exports in `lib/store/index.ts`:
  ```typescript
  export { useAuthStore } from "./auth";
  ```

#### TypeScript JSX errors with dynamic icons
When rendering icons from a config object, TypeScript may complain about `.icon` not existing on a string type. Use an IIFE:
```typescript
// ❌ Error: Property 'icon' does not exist on type 'string'
{TYPE_BADGE[detail.type].icon && <detail.type.icon className="w-5 h-5" />}

// ✅ Correct: Use IIFE to extract the icon component
{(() => {
  const Icon = TYPE_BADGE[detail.type].icon;
  return Icon ? <Icon className="w-5 h-5" /> : null;
})()}
```

#### Missing icon imports
Always explicitly import all icons used in the file — even if they seem like they should be auto-available:
```typescript
import { Users } from "lucide-react"; // Required even though it's a common icon
```

#### Build errors don't show full output
If `npm run build` fails silently, run these in order:
1. `npx tsc --noEmit` — Shows TypeScript errors
2. `npx next build` — Shows Next.js compilation errors

### File Checklist

Before running build, verify these files exist/are updated:
- [ ] Types added to `lib/types.ts`
- [ ] Seed data file(s) in `lib/data/`
- [ ] Store file(s) in `lib/store/`
- [ ] Stores exported from `lib/store/index.ts`
- [ ] Store keys added to `resetAllDemoData()` in `lib/store/index.ts`
- [ ] Nav items updated in `lib/auth/roles.ts`
- [ ] Sidebar updated in `components/layout/Sidebar.tsx` (imports, CHILDREN, isX check, ExpandableNav)
- [ ] Index redirect page created
- [ ] All child pages created
- [ ] All required shadcn components exist (Label, Textarea, etc.)
