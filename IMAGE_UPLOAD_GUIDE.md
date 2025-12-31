# Image Upload and Multimodal Analysis Guide

## Overview

BugSense AI now supports **image uploads** for bug reports, including:
- **Bug Screenshots** (up to 5 images) - UI bugs, visual artifacts, layout issues
- **Log Screenshots** (up to 3 images) - Console logs, error messages, stack traces

The LLM analyzes both text and images to provide more comprehensive bug analysis.

## Features Added

### 1. Frontend Enhancements (SubmitBug.jsx)

**New Image Upload Sections:**
- Drag-and-drop style file inputs for screenshots and log images
- Image previews with remove functionality
- File size validation (max 5MB per image)
- File type validation (images only)
- Visual feedback with hover effects

**Updated Form Handling:**
- Supports multiple file uploads
- Sends images via FormData to backend
- Real-time image preview before submission

### 2. Backend Enhancements

**Firebase Storage Integration (config/firebase.js):**
- Configured Firebase Storage bucket
- Automatic storage initialization with admin SDK
- Public URL generation for uploaded images

**Updated Bug Routes (routes/bugRoutes.js):**
- Multer middleware for handling multiple file uploads
- Separate handling for screenshots and log images
- Image upload to Firebase Storage
- Public URL generation and storage in Firestore
- Error handling for upload failures

**File Upload Function:**
```javascript
uploadImageToStorage(file, bugId, type)
```
- Uploads images to Firebase Storage
- Organizes by bug ID and type (screenshots/logs)
- Returns public URLs for image access

### 3. Multimodal LLM Analysis (services/llmService.js)

**Vision Support for Multiple Providers:**

#### OpenAI GPT-4o / GPT-4o-mini
- Uses `image_url` format with direct URLs
- Supports multiple images in single request
- Model: `gpt-4o-mini` (vision-enabled by default)

#### Anthropic Claude 3.5 Sonnet
- Downloads images and converts to base64
- Uses `image` source type with base64 data
- Supports multiple images with text
- Model: `claude-3-5-sonnet-20241022`

#### Google Gemini 1.5 Flash
- Downloads images and converts to base64
- Uses `inlineData` format with base64
- Combines text and images in single request
- Model: `gemini-1.5-flash`

#### Groq (Llama)
- Currently **does not support vision**
- Falls back to text-only analysis
- Will skip image analysis if used

**Enhanced `analyzeBug()` Method:**
- Accepts `screenshotUrls` and `logImageUrls` arrays
- Passes all images to vision-enabled LLMs
- Includes visual analysis in bug report
- New field: `visualAnalysis` in response

### 4. UI Improvements (BugDetails.jsx)

**Image Display:**
- Grid layout for screenshots (2-3 columns)
- Click to view full-size images in new tab
- Hover effects for better UX
- Separate sections for bug screenshots and log images

**Visual Analysis Display:**
- New section showing LLM's visual analysis
- Only displayed if images were provided
- Highlights UI issues, layout problems, visual bugs

## Environment Configuration

### Firebase Storage Setup

Add to your `backend/.env` file:

```env
# Firebase Storage (optional - defaults to project-id.appspot.com)
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

### Storage Rules

Update your Firebase Storage rules:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /bugs/{bugId}/{allPaths=**} {
      // Allow read for all authenticated users
      allow read: if request.auth != null;
      // Allow write for authenticated users
      allow write: if request.auth != null;
    }
  }
}
```

## Usage Examples

### 1. Submit Bug with Screenshots

```javascript
// Frontend submission
const formData = {
  description: 'Login button not working',
  logs: 'Error: Cannot POST /api/login',
  screenshots: [file1, file2],  // File objects from input
  logImages: [logFile]           // File object from input
};

await bugAPI.submitBug(formData);
```

### 2. LLM Analysis with Images

```javascript
// Backend analysis
const analysis = await llmService.analyzeBug({
  description: 'Button appears broken',
  logs: 'TypeError: undefined',
  screenshotUrls: [
    'https://storage.googleapis.com/bucket/bugs/123/screenshots/image1.png',
    'https://storage.googleapis.com/bucket/bugs/123/screenshots/image2.png'
  ],
  logImageUrls: [
    'https://storage.googleapis.com/bucket/bugs/123/logs/error.png'
  ]
});

// Response includes visualAnalysis field
console.log(analysis.visualAnalysis);
// "The screenshot shows a misaligned button with incorrect padding..."
```

## Supported Image Formats

- **JPEG** (.jpg, .jpeg)
- **PNG** (.png)
- **GIF** (.gif)
- **WebP** (.webp)

**Limitations:**
- Max file size: **5MB per image**
- Max screenshots: **5 images**
- Max log images: **3 images**

## LLM Provider Comparison

| Provider | Vision Support | Recommended Model | Notes |
|----------|----------------|-------------------|-------|
| OpenAI | ✅ Yes | gpt-4o-mini | Fast, cost-effective |
| Anthropic | ✅ Yes | claude-3-5-sonnet | Best quality analysis |
| Google Gemini | ✅ Yes | gemini-1.5-flash | Free tier available |
| Groq (Llama) | ❌ No | llama-3.3-70b | Text-only fallback |

## Benefits of Visual Analysis

1. **Better Bug Detection:** LLM can see UI issues that might not be described well in text
2. **Layout Issues:** Identifies misalignments, spacing problems, responsive design bugs
3. **Color/Visual Bugs:** Detects wrong colors, missing elements, visual artifacts
4. **Error Context:** Screenshots of error dialogs provide more context than text logs
5. **Accessibility Issues:** Can identify contrast problems, missing labels, etc.

## Technical Flow

```
1. User uploads images in bug form
   ↓
2. Frontend sends FormData with files to backend
   ↓
3. Backend uploads images to Firebase Storage
   ↓
4. Public URLs generated and stored in Firestore
   ↓
5. LLM receives bug description + image URLs
   ↓
6. LLM downloads images (Anthropic/Gemini) or uses URLs (OpenAI)
   ↓
7. LLM analyzes text + images together
   ↓
8. Enhanced analysis returned with visualAnalysis field
   ↓
9. Frontend displays images and visual analysis
```

## Error Handling

- **Upload Failures:** Bug status set to `upload_failed`, error message stored
- **Image Load Failures:** Logged but don't fail entire analysis
- **Unsupported Formats:** Rejected at frontend with toast notification
- **File Size Exceeded:** Rejected at frontend with toast notification
- **Storage Quota:** Graceful degradation to text-only analysis

## Testing

To test the image upload feature:

1. Start the backend: `cd backend && npm run dev`
2. Start the frontend: `cd frontend && npm run dev`
3. Navigate to Submit Bug page
4. Fill in bug description
5. Upload screenshots using "Choose screenshots" button
6. Upload log images using "Choose log images" button
7. Submit and view analysis with visual insights

## Future Enhancements

- [ ] Video upload support
- [ ] Image annotation tools
- [ ] OCR for extracting text from screenshots
- [ ] Automatic screenshot comparison (expected vs actual)
- [ ] Support for animated GIFs to show reproduction steps
- [ ] Image compression to reduce storage costs
