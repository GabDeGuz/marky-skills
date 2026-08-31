---
name: page-relocation-between-menus
description: Systematic approach to relocating pages between menu sections while maintaining functionality and backwards compatibility
source: auto-skill
extracted_at: '2026-05-28T07:43:20.140Z'
---

## Page Relocation Between Menus Pattern

This skill documents the systematic approach to moving existing pages from one menu section to another while maintaining all functionality, updating navigation, and ensuring backwards compatibility. This pattern was successfully used to relocate 3 masterlist pages from `/attendance` to `/billing`.

### When to Use This Pattern

- Client requests to reorganize menu structure
- Pages are in the wrong logical grouping
- Consolidating related functionality under one menu
- Separating concerns (e.g., HR vs Finance pages)
- Improving user navigation flow

### Decision Process

Before relocating, verify:

1. **Business Logic Alignment** — Does the new location make sense for users?
2. **Permission Consistency** — Do users who access the new menu have the right roles?
3. **Breadcrumb Hierarchy** — Will breadcrumbs make sense in the new location?
4. **Backwards Compatibility** — Are there external links or bookmarks to the old URLs?
5. **Feature Flags** — Does the new parent menu use different feature flags?

### Standard Relocation Procedure

#### Step 1: Create New Directory Structure

Create the new directory path:

```bash
# Windows PowerShell
New-Item -ItemType Directory -Path 'C:\path\to\app\(app)\new-parent\page-name' -Force

# Or using mkdir
mkdir -p app/\(app\)/new-parent/page-name
```

#### Step 2: Copy Page Files

Copy the existing page to the new location:

```bash
# Windows PowerShell
Copy-Item 'C:\path\to\app\(app)\old-parent\page-name\page.tsx' 'C:\path\to\app\(app)\new-parent\page-name\page.tsx' -Force

# Linux/Mac
cp app/\(app\)/old-parent/page-name/page.tsx app/\(app\)/new-parent/page-name/page.tsx
```

#### Step 3: Update Breadcrumbs

Open the copied page and update the breadcrumbs array:

**Before:**
```typescript
<PageHeader
  title="SKL Employee Masterlist"
  subtitle="Complete registry of SK Logistics office, garage, and admin staff"
  breadcrumbs={[
    { label: "HR & Admin" },
    { label: "Attendance" },
    { label: "Employee Masterlist" }
  ]}
/>
```

**After:**
```typescript
<PageHeader
  title="SKL Employee Masterlist"
  subtitle="Complete registry of SK Logistics office, garage, and admin staff"
  breadcrumbs={[
    { label: "Finance" },
    { label: "Billing & Invoices" },
    { label: "Employee Masterlist" }
  ]}
/>
```

**Key points:**
- Update parent category labels to match new location
- Keep the page label the same
- Ensure hierarchy makes sense (Finance > Billing & Invoices > Masterlist)

#### Step 4: Update Sidebar Navigation

Locate the sidebar file and update the navigation arrays:

**File:** `components/layout/Sidebar.tsx`

**Remove from old parent:**
```typescript
const ATTENDANCE_CHILDREN = [
  { label: "Daily Attendance", href: "/attendance/daily", icon: CalendarClock },
  // REMOVE THESE:
  // { label: "SKL Employee Masterlist", href: "/attendance/employees", icon: Users },
  // { label: "SKIS Driver/Helper", href: "/attendance/driver-helpers", icon: ShieldCheck },
  // { label: "Maxicare", href: "/attendance/maxicare", icon: Heart },
];
```

**Add to new parent:**
```typescript
const BILLING_CHILDREN = [
  { label: "Overview", href: "/billing", icon: LayoutGrid },
  { label: "Invoices", href: "/billing/invoices", icon: InvoiceIcon },
  { label: "Payments", href: "/billing/payments", icon: CreditCard },
  { label: "Customers", href: "/billing/customers", icon: CustomersIcon },
  { label: "Credit Notes", href: "/billing/credit-notes", icon: FileX2 },
  { label: "Recurring Invoices", href: "/billing/recurring", icon: RefreshCw },
  { label: "Subcon Payables", href: "/billing/payables", icon: Handshake },
  // ADD THESE:
  { label: "SKL Employee Masterlist", href: "/billing/employees", icon: Users },
  { label: "SKIS Driver/Helper", href: "/billing/driver-helpers", icon: ShieldCheck },
  { label: "Maxicare", href: "/billing/maxicare", icon: Heart },
];
```

**Key points:**
- Update `href` to match new location (`/billing/employees` not `/attendance/employees`)
- Keep the same label and icon
- Place in logical order within the new menu

#### Step 5: Decide on Old Files

Choose one of three approaches:

**Option A: Delete Old Files (Clean Break)**
```bash
# Delete the old directory
Remove-Item -Recurse -Force 'C:\path\to\app\(app)\old-parent\page-name'
```
- **Use when:** No external links or bookmarks exist
- **Pros:** Clean codebase, no confusion
- **Cons:** Breaking change for users

**Option B: Keep Old Files with Redirect (Recommended)**
Replace old page with a redirect:

```typescript
// app/(app)/old-parent/page-name/page.tsx
import { redirect } from "next/navigation";

export default function OldPageRedirect() {
  redirect("/new-parent/page-name");
}
```
- **Use when:** External links or bookmarks might exist
- **Pros:** Backwards compatible, smooth transition
- **Cons:** Extra files to maintain

**Option C: Keep Both Versions (Temporary)**
Keep both pages during transition period, then delete old one later.
- **Use when:** Gradual migration with user communication
- **Pros:** Safest approach, allows testing
- **Cons:** Duplicate code, maintenance burden

#### Step 6: Update Feature Flags (If Applicable)

If the new parent menu uses different feature flags, update the page:

**Before:**
```typescript
// Old location might use attendance feature flag
export default function EmployeeMasterlistPage() {
  const { isEnabled } = useFeatureStore();
  if (!isEnabled("attendance")) return <AccessDenied />;
  // ... rest of page
}
```

**After:**
```typescript
// New location uses billing feature flag
export default function EmployeeMasterlistPage() {
  const { isEnabled } = useFeatureStore();
  if (!isEnabled("billing_invoices")) return <AccessDenied />;
  // ... rest of page
}
```

#### Step 7: Update Role Permissions

Check if role permissions need updating in `lib/auth/roles.ts`:

**Before:**
```typescript
{
  label: "Employee Masterlist",
  href: "/attendance/employees",
  icon: Users,
  roles: ["super_admin", "company_admin", "hr", "accounting"],
  featureKey: "attendance",
}
```

**After:**
```typescript
{
  label: "Employee Masterlist",
  href: "/billing/employees",
  icon: Users,
  roles: ["super_admin", "company_admin", "accounting"], // Removed HR, added accounting
  featureKey: "billing_invoices",
}
```

**Key points:**
- Update `href` to new location
- Review which roles should access the page in new context
- Update `featureKey` if different

#### Step 8: Test Navigation Flow

Verify:
1. New menu shows the page
2. Old menu doesn't show the page (or redirects)
3. Breadcrumbs display correctly
4. Page functionality unchanged
5. Feature flags work correctly
6. Role permissions enforced

### Complete Example: Relocating Masterlists to Billing

This example shows the complete relocation of 3 pages from `/attendance` to `/billing`.

#### 1. Create New Directories

```bash
# PowerShell
New-Item -ItemType Directory -Path 'C:\Users\jcuad\OneDrive\Documents\SKLogistics\app\(app)\billing\employees' -Force
New-Item -ItemType Directory -Path 'C:\Users\jcuad\OneDrive\Documents\SKLogistics\app\(app)\billing\driver-helpers' -Force
New-Item -ItemType Directory -Path 'C:\Users\jcuad\OneDrive\Documents\SKLogistics\app\(app)\billing\maxicare' -Force
```

#### 2. Copy Page Files

```bash
# PowerShell
Copy-Item 'C:\Users\jcuad\OneDrive\Documents\SKLogistics\app\(app)\attendance\employees\page.tsx' 'C:\Users\jcuad\OneDrive\Documents\SKLogistics\app\(app)\billing\employees\page.tsx' -Force

Copy-Item 'C:\Users\jcuad\OneDrive\Documents\SKLogistics\app\(app)\attendance\driver-helpers\page.tsx' 'C:\Users\jcuad\OneDrive\Documents\SKLogistics\app\(app)\billing\driver-helpers\page.tsx' -Force

Copy-Item 'C:\Users\jcuad\OneDrive\Documents\SKLogistics\app\(app)\attendance\maxicare\page.tsx' 'C:\Users\jcuad\OneDrive\Documents\SKLogistics\app\(app)\billing\maxicare\page.tsx' -Force
```

#### 3. Update Breadcrumbs (for each file)

**billing/employees/page.tsx:**
```typescript
breadcrumbs={[
  { label: "Finance" },
  { label: "Billing & Invoices" },
  { label: "Employee Masterlist" }
]}
```

**billing/driver-helpers/page.tsx:**
```typescript
breadcrumbs={[
  { label: "Finance" },
  { label: "Billing & Invoices" },
  { label: "Driver/Helper Masterlist" }
]}
```

**billing/maxicare/page.tsx:**
```typescript
breadcrumbs={[
  { label: "Finance" },
  { label: "Billing & Invoices" },
  { label: "Maxicare" }
]}
```

#### 4. Update Sidebar Navigation

**File:** `components/layout/Sidebar.tsx`

```typescript
// Remove from ATTENDANCE_CHILDREN
const ATTENDANCE_CHILDREN = [
  { label: "Daily Attendance", href: "/attendance/daily", icon: CalendarClock },
  // Removed 3 masterlist entries
];

// Add to BILLING_CHILDREN
const BILLING_CHILDREN = [
  { label: "Overview", href: "/billing", icon: LayoutGrid },
  { label: "Invoices", href: "/billing/invoices", icon: InvoiceIcon },
  { label: "Payments", href: "/billing/payments", icon: CreditCard },
  { label: "Customers", href: "/billing/customers", icon: CustomersIcon },
  { label: "Credit Notes", href: "/billing/credit-notes", icon: FileX2 },
  { label: "Recurring Invoices", href: "/billing/recurring", icon: RefreshCw },
  { label: "Subcon Payables", href: "/billing/payables", icon: Handshake },
  // Added 3 masterlist entries
  { label: "SKL Employee Masterlist", href: "/billing/employees", icon: Users },
  { label: "SKIS Driver/Helper", href: "/billing/driver-helpers", icon: ShieldCheck },
  { label: "Maxicare", href: "/billing/maxicare", icon: Heart },
];
```

#### 5. Keep Old Files with Redirects (Backwards Compatibility)

**attendance/employees/page.tsx:**
```typescript
import { redirect } from "next/navigation";

export default function AttendanceEmployeesRedirect() {
  redirect("/billing/employees");
}
```

**attendance/driver-helpers/page.tsx:**
```typescript
import { redirect } from "next/navigation";

export default function AttendanceDriverHelpersRedirect() {
  redirect("/billing/driver-helpers");
}
```

**attendance/maxicare/page.tsx:**
```typescript
import { redirect } from "next/navigation";

export default function AttendanceMaxicareRedirect() {
  redirect("/billing/maxicare");
}
```

#### 6. Verify with Build

```bash
npx tsc --noEmit  # Check types
npm run build      # Full build
```

### Common Pitfalls

#### 1. Forgetting to Update href in Sidebar

**Error:** Page shows in new menu but clicking goes to old URL (404)

**Solution:** Always update both the location AND the sidebar href:
```typescript
// ❌ Wrong: href still points to old location
{ label: "Employee Masterlist", href: "/attendance/employees", icon: Users }

// ✅ Correct: href points to new location
{ label: "Employee Masterlist", href: "/billing/employees", icon: Users }
```

#### 2. Breadcrumbs Don't Match New Location

**Error:** User navigates to Billing > Employee Masterlist but breadcrumbs show HR & Admin > Attendance

**Solution:** Update breadcrumbs in the copied page file to match new hierarchy.

#### 3. Feature Flags Not Updated

**Error:** Page shows "Access Denied" because it checks old feature flag

**Solution:** Update feature flag checks to use new parent's flag:
```typescript
// ❌ Wrong: Still checking attendance flag
if (!isEnabled("attendance")) return <AccessDenied />;

// ✅ Correct: Check billing flag
if (!isEnabled("billing_invoices")) return <AccessDenied />;
```

#### 4. Role Permissions Not Updated

**Error:** Users who should access page in new location can't see it

**Solution:** Review and update role arrays in `lib/auth/roles.ts` to match new context.

#### 5. Old Files Not Redirected

**Error:** External links or bookmarks to old URLs show 404

**Solution:** Replace old page files with redirect components:
```typescript
import { redirect } from "next/navigation";

export default function OldPageRedirect() {
  redirect("/new-location");
}
```

#### 6. Duplicate Code Maintenance Burden

**Error:** Keeping both old and new versions leads to inconsistent updates

**Solution:** Use redirects instead of keeping full page copies. If you must keep both, add a comment:
```typescript
// DEPRECATED: This page has moved to /billing/employees
// This copy is kept for backwards compatibility during transition
// Last sync date: 2026-05-28
```

### Advanced Patterns

#### Gradual Migration with Analytics

Track usage of old vs new URLs before deleting:

```typescript
// old-location/page.tsx
import { redirect } from "next/navigation";
import { logPageView } from "@/lib/analytics";

export default function OldPageRedirect() {
  logPageView("old_location_redirect", {
    from: "/attendance/employees",
    to: "/billing/employees",
  });
  redirect("/billing/employees");
}
```

#### Conditional Redirect Based on Feature Flag

Show old page to some users, redirect others:

```typescript
// old-location/page.tsx
import { redirect } from "next/navigation";
import { useFeatureStore } from "@/lib/store/features";

export default function OldPageConditional() {
  const { isEnabled } = useFeatureStore();
  
  if (isEnabled("new_billing_menu")) {
    redirect("/billing/employees");
  }
  
  // Show old page if feature flag disabled
  return <EmployeeMasterlistPage />;
}
```

#### Preserving Query Parameters in Redirect

Maintain filters and search when redirecting:

```typescript
import { redirect } from "next/navigation";
import { useSearchParams } from "next/navigation";

export default function OldPageRedirect() {
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const newUrl = queryString
    ? `/billing/employees?${queryString}`
    : "/billing/employees";
  
  redirect(newUrl);
}
```

### Verification Checklist

After completing relocation:

- [ ] New directory structure created
- [ ] Page files copied to new location
- [ ] Breadcrumbs updated in all copied pages
- [ ] Sidebar navigation updated (old parent and new parent)
- [ ] Old files deleted OR redirects created
- [ ] Feature flags updated (if applicable)
- [ ] Role permissions updated (if applicable)
- [ ] New menu shows the page
- [ ] Old menu doesn't show the page (or redirects)
- [ ] Page functionality unchanged
- [ ] Build passes with `npm run build`
- [ ] No TypeScript errors with `npx tsc --noEmit`
- [ ] Tested navigation flow from sidebar
- [ ] Tested direct URL access (if redirects created)

### Related Patterns

- **Add Expandable Sidebar Module** — For creating new menu sections
- **CRUD Module Pattern** — For building the pages themselves
- **Feature Flag System** — For controlling menu visibility

### Example Files

Reference these files for complete implementations:
- `app/(app)/billing/employees/page.tsx` — Relocated employee masterlist
- `app/(app)/billing/driver-helpers/page.tsx` — Relocated driver/helper masterlist
- `app/(app)/billing/maxicare/page.tsx` — Relocated Maxicare page
- `components/layout/Sidebar.tsx` — Updated navigation arrays
- `app/(app)/attendance/employees/page.tsx` — Redirect example (if kept)

This pattern ensures smooth page relocations while maintaining all functionality and providing backwards compatibility when needed.
