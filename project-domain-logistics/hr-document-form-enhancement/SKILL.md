---
name: hr-document-form-enhancement
description: Pattern for systematically adding Date Release, Date Received, and FileUpload fields to multiple HR document forms
source: auto-skill
extracted_at: '2026-05-28T07:43:20.139Z'
---

## HR Document Form Enhancement Pattern

This skill documents the pattern for systematically enhancing multiple HR document forms with standardized fields like Date Release, Date Received, and FileUpload components. This pattern was successfully applied to 6 HR forms (Incident Reports, NTE, NOD, Written Warnings, Suspensions, Terminations).

### When to Use This Pattern

- Adding the same set of fields to multiple related forms
- Enhancing existing forms with attachment support
- Implementing document tracking (release/received dates)
- Standardizing form structure across a module

### Standard Fields to Add

#### 1. Date Release and Date Received Fields

Add these as a 2-column grid after the main description field:

```typescript
<div className="grid grid-cols-2 gap-4">
  <div className="space-y-2">
    <Label>Date Release</Label>
    <Input
      type="date"
      value={editingDoc?.releaseDate || ""}
      onChange={(e) =>
        setEditingDoc(
          editingDoc
            ? { ...editingDoc, releaseDate: e.target.value }
            : ({ releaseDate: e.target.value } as any)
        )
      }
    />
  </div>
  <div className="space-y-2">
    <Label>Date Received</Label>
    <Input
      type="date"
      value={editingDoc?.receivedDate || ""}
      onChange={(e) =>
        setEditingDoc(
          editingDoc
            ? { ...editingDoc, receivedDate: e.target.value }
            : ({ receivedDate: e.target.value } as any)
        )
      }
    />
  </div>
</div>
```

**Key points:**
- Use `type="date"` for date pickers
- Always check if `editingDoc` exists before spreading
- Use `as any` for create mode to satisfy TypeScript
- Place after main content fields, before attachments

#### 2. FileUpload Component Integration

Add the FileUpload component after the date fields:

```typescript
import { FileUpload } from "@/components/hr/FileUpload";

// ... in form JSX

<div className="space-y-2">
  <Label>Attachments</Label>
  <FileUpload
    onFilesChange={(files) => {
      const attachments = files.map((file, idx) => ({
        id: `att-${Date.now()}-${idx}`,
        fileName: file.name,
        fileType: file.name.split(".").pop() as any,
        fileSize: file.size,
        fileUrl: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString(),
        documentId: "",
      }));
      setEditingDoc(
        editingDoc
          ? { ...editingDoc, attachments }
          : ({ attachments } as any)
      );
    }}
    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
    multiple={true}
    maxFiles={10}
    maxSizeMB={5}
  />
</div>
```

**Key points:**
- Import FileUpload from `@/components/hr/FileUpload`
- Transform files into attachment objects with metadata
- Use `Date.now()` + index for unique IDs
- `fileType` extracted from file extension
- `fileUrl` uses `URL.createObjectURL` for preview
- `documentId` left empty (filled on save)
- Common accept types: `.pdf,.jpg,.jpeg,.png,.doc,.docx`
- Typical limits: 10 files, 5MB each

### Systematic Enhancement Process

When adding these fields to multiple forms, follow this exact sequence:

#### Step 1: Identify All Target Forms

List all forms that need enhancement:
- `/hr/incident-reports/page.tsx`
- `/hr/notice-to-explain/page.tsx`
- `/hr/notice-of-decision/page.tsx`
- `/hr/written-warnings/page.tsx`
- `/hr/suspension-notices/page.tsx`
- `/hr/termination-notices/page.tsx`

#### Step 2: Add FileUpload Import to Each File

Add at the top with other imports:

```typescript
import { FileUpload } from "@/components/hr/FileUpload";
```

#### Step 3: Locate the Form Dialog

Find the `<Dialog>` component containing the create/edit form.

#### Step 4: Add Fields in Correct Order

Inside the form dialog, add fields in this sequence:

1. **Existing fields** (title, description, etc.)
2. **Date Release/Received** (2-column grid)
3. **FileUpload** (attachments)
4. **DialogFooter** (cancel/save buttons)

#### Step 5: Update Type Definitions

Ensure the type in `lib/types.ts` includes the new fields:

```typescript
export interface HRDocument {
  id: string;
  // ... existing fields
  releaseDate?: string;
  receivedDate?: string;
  attachments: DocumentAttachment[];
}

export interface DocumentAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  uploadedAt: string;
  documentId: string;
}
```

#### Step 6: Update Seed Data

If using seed data, add the new fields:

```typescript
export const seedHRDocuments: HRDocument[] = [
  {
    id: "doc-1",
    // ... existing fields
    releaseDate: "2026-05-20",
    receivedDate: "2026-05-22",
    attachments: [
      {
        id: "att-1",
        fileName: "evidence.pdf",
        fileType: "pdf",
        fileSize: 1024000,
        fileUrl: "/attachments/evidence.pdf",
        uploadedAt: "2026-05-20T10:00:00Z",
        documentId: "doc-1",
      },
    ],
  },
];
```

### Complete Form Example

Here's a complete example showing where to place the new fields:

```typescript
<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>{editingDoc ? "Edit Document" : "New Document"}</DialogTitle>
      <DialogDescription>Create or update a document</DialogDescription>
    </DialogHeader>
    <div className="space-y-4 py-4">
      {/* Existing fields */}
      <div className="space-y-2">
        <Label>Employee Name *</Label>
        <Input value={editingDoc?.employeeName || ""} onChange={...} />
      </div>
      
      <div className="space-y-2">
        <Label>Title *</Label>
        <Input value={editingDoc?.title || ""} onChange={...} />
      </div>
      
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea rows={4} value={editingDoc?.description || ""} onChange={...} />
      </div>
      
      {/* NEW: Date Release/Received */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date Release</Label>
          <Input
            type="date"
            value={editingDoc?.releaseDate || ""}
            onChange={(e) =>
              setEditingDoc(
                editingDoc
                  ? { ...editingDoc, releaseDate: e.target.value }
                  : ({ releaseDate: e.target.value } as any)
              )
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Date Received</Label>
          <Input
            type="date"
            value={editingDoc?.receivedDate || ""}
            onChange={(e) =>
              setEditingDoc(
                editingDoc
                  ? { ...editingDoc, receivedDate: e.target.value }
                  : ({ receivedDate: e.target.value } as any)
              )
            }
          />
        </div>
      </div>
      
      {/* NEW: FileUpload */}
      <div className="space-y-2">
        <Label>Attachments</Label>
        <FileUpload
          onFilesChange={(files) => {
            const attachments = files.map((file, idx) => ({
              id: `att-${Date.now()}-${idx}`,
              fileName: file.name,
              fileType: file.name.split(".").pop() as any,
              fileSize: file.size,
              fileUrl: URL.createObjectURL(file),
              uploadedAt: new Date().toISOString(),
              documentId: "",
            }));
            setEditingDoc(
              editingDoc
                ? { ...editingDoc, attachments }
                : ({ attachments } as any)
            );
          }}
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          multiple={true}
          maxFiles={10}
          maxSizeMB={5}
        />
      </div>
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setDialogOpen(false)}>
        Cancel
      </Button>
      <Button onClick={() => handleSave(editingDoc || {})}>
        {editingDoc ? "Update" : "Create"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Common Pitfalls

#### 1. Forgetting to Import FileUpload
**Error:** `Module not found: Can't resolve '@/components/hr/FileUpload'`

**Solution:** Add import at top of file:
```typescript
import { FileUpload } from "@/components/hr/FileUpload";
```

#### 2. TypeScript Errors with Create Mode
**Error:** `Property 'releaseDate' does not exist on type 'never'`

**Solution:** Use conditional spread with `as any`:
```typescript
setEditingDoc(
  editingDoc
    ? { ...editingDoc, releaseDate: e.target.value }
    : ({ releaseDate: e.target.value } as any)
);
```

#### 3. Date Fields Not Saving
**Error:** Dates appear in form but aren't saved to store

**Solution:** Ensure the `handleSave` function includes the new fields:
```typescript
const handleSave = (formData: Partial<HRDocument>) => {
  if (editingDoc) {
    updateRecord(editingDoc.id, formData); // formData includes releaseDate, receivedDate
  } else {
    const newDoc: HRDocument = {
      id: `doc-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: "pending",
      attachments: [],
      ...formData, // Spreads all fields including dates
    } as HRDocument;
    addDocument(newDoc);
  }
};
```

#### 4. Attachments Not Persisting
**Error:** Attachments work in form but disappear after save

**Solution:** The FileUpload component creates temporary blob URLs. For production, you need to:
1. Upload files to storage (Supabase Storage, S3, etc.)
2. Replace blob URLs with permanent URLs
3. Save permanent URLs to database

For MVP/demo, blob URLs work but won't persist across page reloads.

#### 5. View Dialog Not Showing New Fields
**Error:** Create/edit form shows dates/attachments but view dialog doesn't

**Solution:** Update the view dialog to display the new fields:
```typescript
<Dialog open={!!viewingDoc} onOpenChange={() => setViewingDoc(null)}>
  <DialogContent>
    {/* ... existing fields ... */}
    
    {/* Add date fields */}
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label className="text-muted-foreground">Date Release</Label>
        <p className="font-medium">
          {viewingDoc.releaseDate
            ? format(new Date(viewingDoc.releaseDate), "MMM dd, yyyy")
            : "-"}
        </p>
      </div>
      <div>
        <Label className="text-muted-foreground">Date Received</Label>
        <p className="font-medium">
          {viewingDoc.receivedDate
            ? format(new Date(viewingDoc.receivedDate), "MMM dd, yyyy")
            : "-"}
        </p>
      </div>
    </div>
    
    {/* Add attachments list */}
    {viewingDoc.attachments && viewingDoc.attachments.length > 0 && (
      <div>
        <Label className="text-muted-foreground">Attachments</Label>
        <div className="space-y-2 mt-2">
          {viewingDoc.attachments.map((att) => (
            <a
              key={att.id}
              href={att.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50"
            >
              <Paperclip className="w-4 h-4" />
              <span className="text-sm">{att.fileName}</span>
              <span className="text-xs text-muted-foreground">
                ({(att.fileSize / 1024).toFixed(1)} KB)
              </span>
            </a>
          ))}
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>
```

### Verification Checklist

After enhancing all forms, verify:

- [ ] All target forms have FileUpload import
- [ ] Date Release field added to all forms
- [ ] Date Received field added to all forms
- [ ] FileUpload component added to all forms
- [ ] Type definitions updated in `lib/types.ts`
- [ ] Seed data includes new fields (if applicable)
- [ ] View dialogs show new fields
- [ ] Forms can create new records with dates/attachments
- [ ] Forms can edit existing records with dates/attachments
- [ ] Build passes with `npm run build`
- [ ] No TypeScript errors with `npx tsc --noEmit`

### Performance Considerations

#### Large File Handling
For files larger than 5MB:
1. Implement client-side compression before upload
2. Show upload progress indicators
3. Use chunked uploads for very large files

#### Memory Management
`URL.createObjectURL` creates blob URLs that persist in memory. For production:
1. Call `URL.revokeObjectURL(url)` when component unmounts
2. Upload files immediately and use permanent URLs
3. Implement file cleanup on form cancel

#### Multiple Attachments
When allowing 10+ attachments:
1. Show file list with remove buttons
2. Validate total size (e.g., max 50MB total)
3. Implement drag-to-reorder
4. Show upload progress for each file

### Related Patterns

- **CRUD Module Pattern** — Base pattern for form structure
- **FileUpload Component** — See `components/hr/FileUpload.tsx` for implementation
- **Zustand Store Pattern** — For persisting attachments in store
- **Supabase Storage** — For production file uploads (future enhancement)

### Example Files

Reference these files for complete implementations:
- `app/(app)/hr/incident-reports/page.tsx` — Full implementation with all fields
- `app/(app)/hr/notice-to-explain/page.tsx` — Example with NTE-specific fields
- `app/(app)/hr/payslips/page.tsx` — Example with acknowledgment workflow
- `components/hr/FileUpload.tsx` — Reusable FileUpload component
- `lib/types.ts` — HRDocument and DocumentAttachment types

This pattern ensures consistency across all HR document forms while maintaining flexibility for form-specific fields.
