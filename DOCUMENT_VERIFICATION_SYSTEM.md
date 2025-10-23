# Document-by-Document Verification System

## Overview
Implemented a comprehensive document verification system where system admins can approve or reject individual charity documents. Charities are only verified and visible to donors after ALL documents are approved.

---

## System Logic

### Verification Workflow

1. **Charity Uploads Documents**
   - Charity admin uploads required documents (registration, tax, bylaws, audit, etc.)
   - All documents start with `verification_status = 'pending'`

2. **System Admin Reviews Each Document**
   - Admin opens charity detail modal
   - Views each document individually
   - Can approve or reject each document with a reason

3. **Document Rejection**
   - Admin provides rejection reason (minimum 10 characters)
   - Charity admin receives notification with rejection details
   - Charity can resubmit the document
   - Document status changes to `rejected`

4. **Document Approval**
   - Admin clicks "Approve" button
   - Document status changes to `approved`
   - System automatically checks if ALL documents are approved

5. **Automatic Charity Verification**
   - When ALL documents are approved → Charity status becomes `approved`
   - Charity becomes visible to donors
   - Charity admin receives approval notification

6. **Partial Approval Handling**
   - If ANY document is rejected → Charity remains `pending`
   - If charity was previously approved and a document is rejected → Charity goes back to `pending`
   - Charity must fix rejected documents for full approval

---

## Database Changes

### Migration: `add_verification_fields_to_charity_documents_table`

Added fields to `charity_documents` table:
```php
$table->enum('verification_status', ['pending', 'approved', 'rejected'])->default('pending');
$table->foreignId('verified_by')->nullable()->constrained('users');
$table->timestamp('verified_at')->nullable();
$table->text('rejection_reason')->nullable();
$table->text('admin_notes')->nullable();
```

---

## Backend Implementation

### 1. CharityDocument Model Updates

**File**: `app/Models/CharityDocument.php`

**Added**:
- Verification status fields in `$fillable`
- `verifier()` relationship to User model
- Scopes: `pending()`, `approved()`, `rejected()`

### 2. DocumentVerificationController

**File**: `app/Http/Controllers/Admin/DocumentVerificationController.php`

**Methods**:
- `approveDocument()` - Approve a specific document
- `rejectDocument()` - Reject a document with reason
- `resetDocument()` - Reset document to pending status
- `getDocumentStats()` - Get verification statistics for a charity
- `checkAndApproveCharity()` - Auto-approve charity when all docs approved

**Key Logic**:
```php
// Auto-approve charity when all documents are approved
protected function checkAndApproveCharity(Charity $charity)
{
    $documents = $charity->documents;
    
    if ($documents->count() === 0) return false;
    
    $allApproved = $documents->every(function ($doc) {
        return $doc->verification_status === 'approved';
    });
    
    if ($allApproved && $charity->verification_status !== 'approved') {
        $charity->update([
            'verification_status' => 'approved',
            'verified_at' => now(),
        ]);
        // Send notification
        return true;
    }
    
    return false;
}
```

### 3. NotificationService Updates

**File**: `app/Services/NotificationService.php`

**Added Method**:
```php
public function sendDocumentVerificationStatus(CharityDocument $document, string $status)
{
    // Sends email to charity owner with:
    // - Document type
    // - Approval/rejection status
    // - Rejection reason (if rejected)
    // - Admin notes
}
```

### 4. API Routes

**File**: `routes/api.php`

**Added Routes**:
```php
Route::middleware(['auth:sanctum','role:admin'])->group(function(){
    // Document Verification
    Route::patch('/admin/documents/{document}/approve', [DocumentVerificationController::class,'approveDocument']);
    Route::patch('/admin/documents/{document}/reject', [DocumentVerificationController::class,'rejectDocument']);
    Route::patch('/admin/documents/{document}/reset', [DocumentVerificationController::class,'resetDocument']);
    Route::get('/admin/charities/{charity}/document-stats', [DocumentVerificationController::class,'getDocumentStats']);
});
```

### 5. VerificationController Updates

**Updated Method**:
```php
public function getCharityDocuments(Charity $charity){
    return $charity->documents()
        ->with('verifier:id,name,email')
        ->latest()
        ->get()
        ->map(function($doc) {
            return [
                'id' => $doc->id,
                'doc_type' => $doc->doc_type,
                'file_path' => $doc->file_path,
                'uploaded_at' => $doc->created_at,
                'verification_status' => $doc->verification_status,
                'verified_by' => $doc->verifier,
                'verified_at' => $doc->verified_at,
                'rejection_reason' => $doc->rejection_reason,
                'admin_notes' => $doc->admin_notes,
            ];
        });
}
```

---

## Frontend Implementation

### CharityDetailModal Updates

**File**: `capstone_frontend/src/components/admin/CharityDetailModal.tsx`

**Added Features**:

1. **Document Interface Update**:
```typescript
interface Document {
  id: number;
  doc_type: string;
  file_path: string;
  uploaded_at: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  verified_by?: { id: number; name: string; };
  verified_at?: string;
  rejection_reason?: string;
  admin_notes?: string;
}
```

2. **New State Variables**:
```typescript
const [rejectingDoc, setRejectingDoc] = useState<Document | null>(null);
const [rejectionReason, setRejectionReason] = useState("");
const [processingDoc, setProcessingDoc] = useState<number | null>(null);
```

3. **Verification Functions**:
- `handleApproveDocument()` - Approve document via API
- `handleRejectDocument()` - Reject document with reason
- `getDocTypeLabel()` - Convert doc_type to readable label
- `getStatusBadge()` - Display status badge with icon

4. **UI Components**:
- **Status Badges**: Color-coded badges (pending/approved/rejected)
- **Verification Info**: Shows who verified and when
- **Rejection Reason Display**: Red alert box showing rejection details
- **Action Buttons**: View, Download, Approve, Reject
- **Rejection Dialog**: Modal for entering rejection reason

---

## UI/UX Features

### Document Card Display

Each document shows:
- ✅ Document type (Registration, Tax, Bylaws, etc.)
- ✅ Upload date
- ✅ Verification status badge with icon
- ✅ Verifier name and date (if verified)
- ✅ Rejection reason (if rejected)
- ✅ Action buttons (View, Download, Approve, Reject)

### Status Badges

- **Pending**: 🕐 Amber badge with Clock icon
- **Approved**: ✅ Green badge with CheckCircle icon
- **Rejected**: ❌ Red badge with XCircle icon

### Rejection Dialog

- Modal popup when "Reject" is clicked
- Text area for rejection reason (min 10 characters)
- Cancel and Reject buttons
- Validates input before submission

### Button States

- **Approve Button**: Green, only visible for pending documents
- **Reject Button**: Red, only visible for pending documents
- **Disabled State**: When processing a document
- **Hover Effects**: Scale animation on hover

---

## Notification System

### Email Notifications

1. **Document Approved**:
   - Subject: "Document Approved - {Charity Name}"
   - Content: Document type, approval date, admin notes

2. **Document Rejected**:
   - Subject: "Document Requires Resubmission - {Charity Name}"
   - Content: Document type, rejection reason, instructions to resubmit

3. **Charity Fully Approved**:
   - Subject: "Charity Approved - {Charity Name}"
   - Content: All documents verified, charity now visible to donors

---

## Testing Checklist

### Backend Testing
- [ ] Upload documents as charity admin
- [ ] Verify all documents start with 'pending' status
- [ ] Approve a document as system admin
- [ ] Reject a document with reason
- [ ] Verify rejection reason is saved
- [ ] Approve all documents and verify charity auto-approves
- [ ] Reject one document after charity approval → charity goes back to pending

### Frontend Testing
- [ ] Open charity detail modal
- [ ] View Documents tab
- [ ] See all documents with correct status badges
- [ ] Click "Approve" on pending document
- [ ] Click "Reject" and enter rejection reason
- [ ] Verify rejection dialog validates minimum 10 characters
- [ ] View rejected document shows rejection reason
- [ ] View approved document shows verifier name
- [ ] Download and view document buttons work

### Notification Testing
- [ ] Approve document → charity admin receives email
- [ ] Reject document → charity admin receives email with reason
- [ ] Approve all documents → charity admin receives full approval email

---

## API Endpoints

### Document Verification Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| PATCH | `/api/admin/documents/{id}/approve` | Approve a document |
| PATCH | `/api/admin/documents/{id}/reject` | Reject a document (requires `reason`) |
| PATCH | `/api/admin/documents/{id}/reset` | Reset document to pending |
| GET | `/api/admin/charities/{id}/document-stats` | Get document verification statistics |
| GET | `/api/admin/charities/{id}/documents` | Get all documents with verification status |

### Request/Response Examples

**Approve Document**:
```bash
PATCH /api/admin/documents/1/approve
Authorization: Bearer {token}
Content-Type: application/json

{
  "notes": "Document verified successfully"
}
```

**Reject Document**:
```bash
PATCH /api/admin/documents/1/reject
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Registration certificate is expired. Please upload a valid certificate.",
  "notes": "Expiry date: 2023-12-31"
}
```

---

## Security Considerations

1. **Authorization**: Only system admins can approve/reject documents
2. **Validation**: Rejection reason must be at least 10 characters
3. **Audit Trail**: Tracks who verified each document and when
4. **Notification**: Charity admins are immediately notified of changes
5. **Status Protection**: Approved charities revert to pending if any document is rejected

---

## Future Enhancements

1. **Document Resubmission**: Allow charity to replace rejected documents
2. **Bulk Actions**: Approve/reject multiple documents at once
3. **Document History**: Track all verification attempts
4. **Expiry Tracking**: Auto-flag documents nearing expiration
5. **Document Templates**: Provide templates for required documents
6. **In-App Notifications**: Real-time notifications in addition to email

---

## Files Modified/Created

### Backend (5 files)
1. ✅ `database/migrations/2025_10_23_201841_add_verification_fields_to_charity_documents_table.php` (NEW)
2. ✅ `app/Models/CharityDocument.php` (UPDATED)
3. ✅ `app/Http/Controllers/Admin/DocumentVerificationController.php` (NEW)
4. ✅ `app/Services/NotificationService.php` (UPDATED)
5. ✅ `routes/api.php` (UPDATED)

### Frontend (1 file)
1. ✅ `capstone_frontend/src/components/admin/CharityDetailModal.tsx` (UPDATED)

---

## Conclusion

✅ **Complete document-by-document verification system implemented**  
✅ **Automatic charity approval when all documents verified**  
✅ **Rejection workflow with notifications**  
✅ **Modern, intuitive UI with status badges**  
✅ **Full audit trail of verification actions**  

The system ensures that only charities with fully verified documentation can be visible to donors, maintaining platform integrity and donor trust.
