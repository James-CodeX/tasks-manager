# Phase 5: Payment Management System - Testing Guide

## Overview

Phase 5 implements a complete payment management system that allows managers to generate payment records from completed work sessions, mark payments as paid, and export payroll data to CSV.

## Features Implemented

### Backend API Endpoints (7 endpoints)

1. **POST /api/payments/generate** - Generate payment records from work sessions
2. **GET /api/payments** - List all payments with filters and totals
3. **GET /api/payments/[id]** - Get single payment with related sessions
4. **PUT /api/payments/[id]/mark-paid** - Mark payment as paid
5. **PUT /api/payments/[id]/cancel** - Cancel payment
6. **GET /api/payments/pending** - Get pending payments (manager only)
7. **GET /api/payments/export** - Export payments to CSV

### Frontend Components

1. **PaymentStatusBadge** - Display payment status (Pending/Paid/Cancelled)
2. **PaymentStats** - Summary cards showing totals, pending, and paid amounts
3. **Payment Generation Page** - Form to create payment records
4. **Payments Dashboard** - View, filter, and manage all payments

### Dashboard Updates

- Added "Payment Management" card for managers
- Added "My Payments" card for taskers
- Integrated payment links in navigation

## Test Credentials

**Manager Account:**

- Email: manager@workertracking.com
- Password: manager123

**Tasker Account:**

- Email: tasker@workertracking.com
- Password: tasker123

## Testing Steps

### 1. Create Work Sessions (Prerequisite)

Before testing payments, ensure there are completed work sessions:

1. Login as tasker (tasker@workertracking.com / tasker123)
2. Go to Dashboard → My Work Sessions
3. Start a work session
4. Let it run for a few minutes or stop it immediately
5. Create 2-3 sessions to have data for payment generation

### 2. Test Payment Generation (Manager)

1. **Login as Manager**

   - Email: manager@workertracking.com
   - Password: manager123

2. **Navigate to Payments**

   - Click "Payment Management" card on dashboard
   - Or go to: http://localhost:3000/dashboard/payments

3. **Generate Payment Record**

   - Click "Generate Payment" button
   - Select tasker from dropdown
   - Select period start date (e.g., first day of current month)
   - Select period end date (e.g., today)
   - Add optional notes
   - Click "Generate Payment"
   - Should see success message with total hours and amount

4. **Verify Payment Created**
   - Should redirect to payments list
   - New payment should appear with status "Pending"
   - Verify total hours and amount are correct

### 3. Test Payment Listing and Filtering

1. **View All Payments**

   - Check payment stats cards show correct totals
   - Verify payment table displays all records

2. **Filter by Status**

   - Select "Pending" from status dropdown
   - Should only show pending payments
   - Try "Paid" and "Cancelled" filters

3. **Filter by Date Range**
   - Set start date to last month
   - Set end date to today
   - Should show payments within date range

### 4. Test Mark as Paid

1. **Mark Payment as Paid**

   - Find a pending payment in the list
   - Click "Mark Paid" button
   - Payment status should update to "Paid"
   - Paid date should appear in table

2. **Verify Cannot Mark Paid Again**
   - "Mark Paid" button should disappear
   - Payment remains in "Paid" status

### 5. Test CSV Export

1. **Export All Payments**

   - Click "Export CSV" button
   - File should download: `payments_YYYY-MM-DD.csv`
   - Open CSV in Excel/Google Sheets
   - Verify all payment fields are present

2. **Export Filtered Payments**
   - Apply status or date filters
   - Click "Export CSV"
   - Verify CSV contains only filtered payments

### 6. Test Tasker View

1. **Login as Tasker**

   - Email: tasker@workertracking.com
   - Password: tasker123

2. **View My Payments**

   - Click "My Payments" card on dashboard
   - Should only see own payment records
   - Should NOT see "Generate Payment" button
   - Should NOT see "Mark Paid" buttons

3. **Verify Payment Stats**
   - Stats cards should show tasker's totals only
   - Pending amount should match unpaid payments

### 7. Test Edge Cases

1. **Duplicate Payment Prevention**

   - Try to generate payment for same tasker and period twice
   - Should get error: "Payment already exists for this period"

2. **No Sessions in Period**

   - Try to generate payment for period with no work sessions
   - Should get error: "No completed work sessions found"

3. **Invalid Date Range**

   - Try period end before period start
   - Should get validation error

4. **Mark Paid on Cancelled Payment**
   - Cancel a payment via API (if endpoint implemented)
   - Try to mark as paid
   - Should fail with appropriate error

## Expected Results

### Payment Generation

- ✅ Aggregates all completed work sessions for tasker in period
- ✅ Calculates total hours from all sessions
- ✅ Calculates total amount based on hourly rates
- ✅ Prevents duplicate payments for same period
- ✅ Records session count in payment

### Payment Listing

- ✅ Shows all payments with correct totals
- ✅ Filters work correctly (status, date range)
- ✅ Role-based access (managers see all, taskers see own)
- ✅ Stats cards show accurate summaries

### Mark as Paid

- ✅ Updates payment status to PAID
- ✅ Records paid date and manager who marked it
- ✅ Prevents marking cancelled payments as paid
- ✅ Updates stats cards after marking

### CSV Export

- ✅ Exports all payment data
- ✅ Respects filters when exporting
- ✅ Downloads with timestamped filename
- ✅ Opens correctly in spreadsheet software

## Database Verification

To verify data directly in the database:

```bash
# Open SQLite database
sqlite3 db/custom.db

# View payment records
SELECT * FROM PaymentRecords;

# View payment with related sessions
SELECT
  pr.id, pr.totalHours, pr.totalAmount, pr.status,
  COUNT(ws.id) as sessionCount
FROM PaymentRecords pr
LEFT JOIN WorkSessions ws ON
  ws.taskerId = pr.taskerId AND
  ws.startTime >= pr.periodStart AND
  ws.endTime <= pr.periodEnd
GROUP BY pr.id;
```

## Known Limitations

1. **Payment Cancellation**: Frontend UI for cancelling payments not implemented (API exists)
2. **Payment Notes Editing**: Cannot edit payment notes after creation
3. **Partial Periods**: No handling for partial pay periods or prorated amounts
4. **Multiple Hourly Rates**: Assumes single hourly rate per tasker (from latest account)

## API Testing with cURL

### Generate Payment

```bash
curl -X POST http://localhost:3000/api/payments/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_JWT_TOKEN" \
  -d '{
    "taskerId": 2,
    "periodStart": "2025-01-01",
    "periodEnd": "2025-01-31",
    "notes": "January 2025 payroll"
  }'
```

### List Payments

```bash
curl http://localhost:3000/api/payments \
  -H "Cookie: token=YOUR_JWT_TOKEN"
```

### Mark as Paid

```bash
curl -X PUT http://localhost:3000/api/payments/1/mark-paid \
  -H "Cookie: token=YOUR_JWT_TOKEN"
```

### Export CSV

```bash
curl http://localhost:3000/api/payments/export \
  -H "Cookie: token=YOUR_JWT_TOKEN" \
  -o payments.csv
```

## Success Criteria

Phase 5 is complete when:

- [x] All 7 payment API endpoints functional
- [x] Payment generation aggregates sessions correctly
- [x] Payment listing shows accurate totals
- [x] Mark as paid updates status and records date
- [x] CSV export downloads with all data
- [x] Manager can generate and manage payments
- [x] Tasker can view own payment history
- [x] Dashboard includes payment management links
- [x] Role-based access control enforced
- [x] Duplicate payment prevention works

## Next Steps

After Phase 5 completion:

1. Add payment approval workflow (require manager approval)
2. Implement payment cancellation UI
3. Add payment notifications (email when marked paid)
4. Support multiple payment methods (bank transfer, PayPal, etc.)
5. Generate PDF payment receipts
6. Add payment disputes/adjustments
7. Implement automatic recurring payment generation
8. Add payment analytics and reports
