---
name: crud-module-page-pattern
description: Standardized pattern for building CRUD module pages with tables, filters, dialogs, and badges in SK Logistics FMS
source: auto-skill
extracted_at: '2026-05-28T07:00:05.759Z'
---

## CRUD Module Page Pattern

This skill documents the standardized pattern for building full CRUD module pages in the SK Logistics FMS project. This pattern has been successfully used 10+ times for modules like Incident Reports, NTE, NOD, Warnings, Suspensions, Terminations, Payslips, Employee Masterlist, Driver/Helper Masterlist, and Maxicare.

### Page Structure Overview

Every CRUD module page follows this structure:
1. **PageHeader** with title, subtitle, breadcrumbs, and action button
2. **Summary Cards** (optional) — KPI cards showing totals
3. **Filters Card** — Search input + status/type filter dropdowns
4. **Data Table Card** — Table with all records
5. **Create/Edit Dialog** — Form for creating or editing records
6. **View Dialog** — Read-only detail view

### Complete Template

```typescript
"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Eye, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/layout/PageHeader";
import { useYourStore } from "@/lib/store";
import type { YourType } from "@/lib/types";
import { format } from "date-fns";

// Status badge config
const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pending: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200" },
  // ... more statuses
};

export default function YourModulePage() {
  const records = useYourStore((s) => s.records);
  const addRecord = useYourStore((s) => s.addRecord);
  const updateRecord = useYourStore((s) => s.updateRecord);
  const deleteRecord = useYourStore((s) => s.deleteRecord);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<YourType | null>(null);
  const [viewingRecord, setViewingRecord] = useState<YourType | null>(null);

  // Filter records
  const filtered = useMemo(() => {
    return records.filter((r) => {
      const matchesSearch =
        searchQuery === "" ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [records, searchQuery, statusFilter]);

  const handleSave = (formData: Partial<YourType>) => {
    if (editingRecord) {
      updateRecord(editingRecord.id, formData);
    } else {
      const newRecord: YourType = {
        id: `record-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: "active",
        ...formData,
      } as YourType;
      addRecord(newRecord);
    }
    setDialogOpen(false);
    setEditingRecord(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Your Module"
        subtitle="Manage your records"
        breadcrumbs={[
          { label: "Category" },
          { label: "Subcategory" },
          { label: "Module Name" },
        ]}
        actions={
          <Button
            onClick={() => {
              setEditingRecord(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Record
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={STATUS_BADGES[record.status].className}
                      >
                        {STATUS_BADGES[record.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(record.createdAt), "MMM dd, yyyy")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setViewingRecord(record)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingRecord(record);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            confirm(`Delete "${record.name}"?`) && deleteRecord(record.id)
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? "Edit Record" : "New Record"}
            </DialogTitle>
            <DialogDescription>
              {editingRecord
                ? "Update the record details"
                : "Create a new record"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={editingRecord?.name || ""}
                onChange={(e) =>
                  setEditingRecord(
                    editingRecord
                      ? { ...editingRecord, name: e.target.value }
                      : ({ name: e.target.value } as any)
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={4}
                value={editingRecord?.description || ""}
                onChange={(e) =>
                  setEditingRecord(
                    editingRecord
                      ? { ...editingRecord, description: e.target.value }
                      : ({ description: e.target.value } as any)
                  )
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleSave(editingRecord || {})}>
              {editingRecord ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewingRecord} onOpenChange={() => setViewingRecord(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Details</DialogTitle>
            <DialogDescription>
              Viewing record: {viewingRecord?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {viewingRecord && (
              <>
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium">{viewingRecord.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="font-medium whitespace-pre-wrap">
                    {viewingRecord.description || "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge
                    variant="outline"
                    className={STATUS_BADGES[viewingRecord.status].className}
                  >
                    {STATUS_BADGES[viewingRecord.status].label}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p className="font-medium">
                    {format(new Date(viewingRecord.createdAt), "MMM dd, yyyy HH:mm")}
                  </p>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingRecord(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

### Key Patterns

#### 1. Badge Configuration
Define badge configs as constants at the top of the file:
```typescript
const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pending: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200" },
};
```

#### 2. Filter Logic with useMemo
Always use `useMemo` for filtered data to avoid recalculating on every render:
```typescript
const filtered = useMemo(() => {
  return records.filter((r) => {
    const matchesSearch = searchQuery === "" || r.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
}, [records, searchQuery, statusFilter]);
```

#### 3. Dialog State Management
Use three state variables for dialogs:
- `dialogOpen` — Controls visibility
- `editingRecord` — The record being edited (null = create mode)
- `viewingRecord` — The record being viewed (null = dialog closed)

#### 4. Conditional Form Rendering
In the create/edit dialog, check if `editingRecord` exists to determine mode:
```typescript
<DialogTitle>{editingRecord ? "Edit Record" : "New Record"}</DialogTitle>
```

#### 5. Action Button Pattern
Standard action buttons in table rows (always in this order):
1. **View** (Eye icon) — Opens view dialog
2. **Edit** (Pencil icon) — Opens edit dialog
3. **Delete** (Trash icon) — Shows confirm, then deletes

#### 6. Empty State
Always handle empty filtered results:
```typescript
{filtered.length === 0 ? (
  <TableRow>
    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
      No records found
    </TableCell>
  </TableRow>
) : (
  filtered.map((record) => ( /* render rows */ ))
)}
```

### SK Logistics Branding Compliance

- Use `text-brand-charcoal` for primary text
- Use `text-muted-foreground` for secondary text
- Use `bg-brand-offwhite` for subtle backgrounds
- Use `border-brand-border` for borders
- Status badges should use semantic colors (emerald for success, amber for pending, red for errors)
- All dialogs use `max-h-[90vh] overflow-y-auto` for scrollable content

### Common Enhancements

#### Summary Cards
Add KPI cards before the filters:
```typescript
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <Card>
    <CardContent className="p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-brand-red/10 flex items-center justify-center">
        <IconComponent className="w-5 h-5 text-brand-red" />
      </div>
      <div>
        <p className="text-2xl font-bold text-brand-charcoal">{total}</p>
        <p className="text-xs text-muted-foreground">Total Records</p>
      </div>
    </CardContent>
  </Card>
</div>
```

#### File Upload
For modules requiring file attachments, use the FileUpload component:
```typescript
import { FileUpload } from "@/components/hr/FileUpload";

<FileUpload
  onFilesChange={setFiles}
  accept=".pdf,.jpg,.png"
  multiple={true}
  maxFiles={5}
/>
```

#### Acknowledgment Workflow
For payslips or documents requiring acknowledgment:
```typescript
const handleAcknowledge = (record: YourType) => {
  if (confirm("Are you sure you have received this?")) {
    acknowledgeRecord(record.id, user?.id || "employee");
  }
};
```

### Checklist Before Implementation

- [ ] Types defined in `lib/types.ts`
- [ ] Seed data created in `lib/data/`
- [ ] Zustand store created in `lib/store/`
- [ ] Store exported from `lib/store/index.ts`
- [ ] Route created in `app/(app)/your-module/page.tsx`
- [ ] Navigation added to sidebar (if needed)
- [ ] All required shadcn/ui components imported
- [ ] Badge configs defined at top of file
- [ ] Filter logic uses `useMemo`
- [ ] Dialog states properly managed
- [ ] Empty state handled in table
- [ ] Build passes with `npm run build`
