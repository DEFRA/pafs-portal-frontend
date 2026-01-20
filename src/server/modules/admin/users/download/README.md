# Admin Users Download - Excel Export

## Overview

This module provides Excel export functionality for downloading all users data from the admin panel, regardless of status or pagination.

## Features

### Excel File Contents

The exported Excel file includes the following columns:

1. **User ID** - Decoded numeric user ID
2. **User Email** - User's email address
3. **Last Name** - User's last name
4. **First Name** - User's first name
5. **Main Area** - Primary area assigned to the user
6. **Additional Areas** - Secondary areas separated by pipe symbol (|)
7. **Administrator?** - Yes/No indicator
8. **Status** - Active (for approved/active) or Pending
9. **Disabled?** - Yes/No indicator
10. **Invitation Sent** - Date & time in dd/MM/yyyy HH:mm format
11. **Account Creation** - Date & time in dd/MM/yyyy HH:mm format
12. **Invitation Accepted** - Date & time in dd/MM/yyyy HH:mm format
13. **Last Sign In** - Date & time in dd/MM/yyyy HH:mm format

### Styling & Formatting

#### Header Row

- **Background Color**: Dark green (#0B6623)
- **Font**: Bold, white text, size 11
- **Alignment**: Center aligned
- **Height**: 25px
- **Frozen**: Header row is frozen for scrolling

#### Data Rows

- **Alternating Colors**: Light gray (#F5F5F5) for even rows
- **Borders**: Thin borders on all cells (#CCCCCC)
- **Alignment**: Left aligned, vertically middle

#### Conditional Formatting

- **Status Column**:
  - Active: Dark green (#006400), bold
  - Pending: Dark orange (#FF8C00), bold
- **Disabled Column**:
  - Yes: Crimson red (#DC143C), bold
- **Administrator Column**:
  - Yes: Royal blue (#4169E1), bold

## Route

**Endpoint**: `GET /admin/users/download`

**Authentication**: Requires admin authentication

**Response**: Excel file download with filename format `users_export_YYYY-MM-DD_HHmmss.xlsx`

## Usage

### From Frontend

Add a download button/link in the admin users interface:

```html
<a href="/admin/users/download" class="govuk-button">
  Download All Users (Excel)
</a>
```

### Programmatic Usage

```javascript
const response = await fetch('/admin/users/download', {
  headers: {
    Authorization: `Bearer ${accessToken}`
  }
})

const blob = await response.blob()
const url = window.URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = 'users_export.xlsx'
a.click()
```

## Implementation Details

### Dependencies

- **exceljs**: ^4.4.0 - Excel file generation and manipulation

### Data Fetching

- Fetches all active users (pageSize: 10000)
- Fetches all pending users (pageSize: 10000)
- Combines both datasets for export

### Error Handling

- Returns 500 status with error message if generation fails
- Logs errors to server logger for debugging

## Testing

Run tests with:

```bash
npm test src/server/modules/admin/users/download/controller.test.js
```

Test coverage includes:

- User data fetching and combination
- Excel file generation
- Column formatting and styling
- Date/time formatting
- Status mapping (approved → Active)
- Error handling
- Empty data handling

## Installation

1. Install ExcelJS dependency:

```bash
npm install exceljs
```

2. The module is automatically registered in the router configuration.

## Future Enhancements

Potential improvements:

- Add filters (by status, date range, area)
- Add column selection options
- Support for CSV export
- Scheduled automated exports
- Export history tracking
