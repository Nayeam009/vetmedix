

# Upload Integrity Report -- Vetmedix

## 1. BROKEN FLOWS

### BRK-1: Video Size Limit Mismatch in Social Feed (Medium)
**File:** `src/components/social/CreatePostCard.tsx` (lines 34, 85)

The code defines `MAX_VIDEO_SIZE = 50 * 1024 * 1024` (50MB) but the error message on line 85 says "exceeds 20MB limit". Users are shown a misleading error. The actual check allows up to 50MB but the toast says 20MB.

**Fix:** Align the error message with the constant, or lower the constant to match the intended limit.

---

### BRK-2: EditPetPage Has No File Validation (High)
**File:** `src/pages/EditPetPage.tsx` (lines 112-126)

Both `handleAvatarChange` and `handleCoverChange` accept files with **zero validation** -- no file type check (`file.type.startsWith('image/')`) and no file size check. A user could select a 20MB `.exe` file as a pet avatar. The file would be uploaded raw without compression validation.

Compare this to `CreatePetPage.tsx` which correctly enforces a 5MB limit on avatar uploads.

**Fix:** Add `file.type.startsWith('image/')` and size limit checks mirroring `CreatePetPage`.

---

### BRK-3: DoctorVerificationPage Has No File Type Validation (High)
**File:** `src/pages/doctor/DoctorVerificationPage.tsx` (lines 57-66)

The `handleFileChange` function only checks size (5MB limit) but does NOT validate file type. Any file type (`.exe`, `.js`, `.bat`) can be uploaded to the `doctor-documents` bucket as a "BVC certificate". The file input does not even specify an `accept` attribute in the HTML.

Compare this to `ClinicVerificationPage.tsx` which correctly limits to `.pdf,.jpg,.jpeg,.png,.webp` and validates `file.type` against an allowlist.

**Fix:** Add `accept=".pdf,.jpg,.jpeg,.png,.webp"` to the input and validate `file.type` against an allowlist.

---

### BRK-4: StoriesBar Allows 50MB Uploads Without Compression (Medium)
**File:** `src/components/social/StoriesBar.tsx` (lines 48-49)

Story uploads allow files up to 50MB with no compression applied. The `createStory` function is called directly with the raw file. For images, this wastes bandwidth and storage. The main post composer compresses images but stories do not.

**Fix:** Apply `compressImage(file, 'story')` before upload for image stories.

---

## 2. SECURITY GAPS

### SEC-1: `doctor-documents` Bucket Returns `publicUrl` for Private Bucket (Critical)
**File:** `src/pages/doctor/DoctorVerificationPage.tsx` (lines 99-103)

The `doctor-documents` bucket is configured as **private** (`Is Public: No`), but the code calls `getPublicUrl()` which generates a URL that will return a 400/403 error for unauthenticated users. This is technically secure (the file is not actually accessible), but the stored URL in the database is a dead link. Admins reviewing verification documents will see broken images.

The correct approach for private buckets is to use `createSignedUrl()` at read-time.

**Fix:** Store only the storage path (not the full public URL) and generate signed URLs when displaying documents on the admin panel.

---

### SEC-2: `clinic-documents` Same Issue as SEC-1 (Critical)
**File:** `src/pages/clinic/ClinicVerificationPage.tsx` (lines 97-101)

Same pattern -- `getPublicUrl()` is called on a private bucket (`clinic-documents`). The BVC certificate and trade license URLs stored in the `clinics` table are non-functional links.

**Fix:** Same as SEC-1 -- use signed URLs at read-time.

---

### SEC-3: `accept="image/*"` Does Not Block Non-Image Files (Medium)
**Files:** `ProfileHeader.tsx`, `CreatePetPage.tsx`, `EditPetPage.tsx`, `CreatePostCard.tsx`

All image uploaders use `accept="image/*"` on the HTML `<input>` element. This provides a UI hint to the file picker but does NOT prevent a user from selecting "All Files" and choosing a `.js` or `.exe` file. Only `ProfileHeader.tsx` and `CreatePostCard.tsx` additionally validate `file.type.startsWith('image/')` in JavaScript.

`EditPetPage.tsx` does **not** validate file type in JavaScript, so a non-image file would pass through to the upload.

**Fix:** Ensure all upload handlers validate `file.type` in JavaScript, not just via the `accept` attribute.

---

## 3. STORAGE HYGIENE

### HYG-1: Profile Avatar/Cover Updates Create Orphaned Files (High)
**File:** `src/components/profile/ProfileHeader.tsx` (lines 86-97, 139-148)

When a user updates their avatar or cover photo, a new file is uploaded with a timestamped name (e.g., `user-id/avatar-1234567.webp`), but the **old file is never deleted** from the `avatars` bucket. Over time, each user accumulates orphaned files.

**Fix:** Before uploading a new avatar/cover, call `removeStorageFiles([oldUrl], 'avatars')` to clean up the previous file.

---

### HYG-2: Pet Avatar/Cover Updates Create Orphaned Files (High)
**File:** `src/pages/EditPetPage.tsx` (lines 143-165, 168-190)

Same pattern as HYG-1. When editing a pet profile, new avatar and cover files are uploaded but old ones are not deleted from `pet-media`.

Note: The `handleDelete` function at line 221 correctly cleans up all files when the pet is deleted. The issue is only with updates.

**Fix:** Before uploading new avatar/cover, delete the old file using `removeStorageFiles([pet.avatar_url], 'pet-media')`.

---

### HYG-3: Doctor Verification Document Re-uploads Orphan Previous Files (Medium)
**File:** `src/pages/doctor/DoctorVerificationPage.tsx` (line 91)

The `upsert: true` flag means the same path is overwritten (good -- since the path is always `{userId}/bvc_certificate.{ext}`). However, if the file extension changes (e.g., from `.pdf` to `.jpg`), the old file with the previous extension remains orphaned.

**Fix:** Use a fixed filename without extension in the path, or delete the old file first.

---

### HYG-4: Post Deletion Cleans Up Storage Correctly (Good)
**File:** `src/components/social/PostCard.tsx` (lines 61-64)

Post deletion correctly calls `removeStorageFiles(post.media_urls)` before deleting the database row. This is the correct pattern and should be replicated in the areas identified above.

---

## 4. MISSING FEATURES

### MISS-1: No Optimistic Preview for Profile Avatar Upload
**File:** `src/components/profile/ProfileHeader.tsx`

Unlike `CreatePetPage.tsx` which shows an instant local preview via `URL.createObjectURL()`, the profile avatar upload shows only a spinner. The avatar visually disappears during upload and reappears when complete.

**Fix:** Set a local preview URL immediately on file selection, then replace with the server URL after upload.

---

### MISS-2: No PDF-Specific Download Feature for Products
**Architecture Gap**

There is no "Digital Product" or "Manual/Guide" upload feature for products. The `products` table has no column for downloadable files. The PDF import system (`parse-product-pdf`) is an admin tool for bulk product creation, not a customer-facing download.

This feature does not exist yet and would need to be designed from scratch.

---

## SUMMARY MATRIX

| ID | Severity | Category | Issue |
|---|---|---|---|
| SEC-1 | Critical | Security | `doctor-documents` stores dead `publicUrl` for private bucket |
| SEC-2 | Critical | Security | `clinic-documents` stores dead `publicUrl` for private bucket |
| BRK-2 | High | Broken Flow | `EditPetPage` has zero file validation |
| BRK-3 | High | Broken Flow | `DoctorVerificationPage` has no file type validation |
| HYG-1 | High | Storage Hygiene | Profile avatar/cover updates orphan old files |
| HYG-2 | High | Storage Hygiene | Pet avatar/cover updates orphan old files |
| BRK-1 | Medium | Broken Flow | Video size limit error message mismatch |
| BRK-4 | Medium | Broken Flow | Stories skip image compression |
| SEC-3 | Medium | Security | `accept="image/*"` not enforced in JS on some uploaders |
| HYG-3 | Medium | Storage Hygiene | Doctor verification re-upload may orphan files |
| MISS-1 | Low | UX | No optimistic preview for profile avatar |
| MISS-2 | N/A | Feature Gap | No digital product download feature exists |

## RECOMMENDED FIX PRIORITY

1. **SEC-1 + SEC-2** -- Switch private bucket URL storage to path-only, generate signed URLs at read-time (prevents broken admin review screens)
2. **BRK-2 + BRK-3 + SEC-3** -- Add file type and size validation to all upload handlers
3. **HYG-1 + HYG-2** -- Add old file cleanup before new uploads (use existing `removeStorageFiles` utility)
4. **BRK-1 + BRK-4** -- Fix video error message and add story image compression
5. **MISS-1** -- Add optimistic preview for profile avatar

No code changes will be made until approval is received.

