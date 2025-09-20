˘≤,÷ 🧪 **DivvyUp Application Testing Guide**
˘≤,÷ 🧪 **DivvyUp Application Testing Guide**

## 📋 **Pre-Testing Setup**

### 1. **Environment Setup**
```bash
# Navigate to project root
cd /Users/ajtruckinginc/Desktop/divvy-up

# Install all dependencies
npm install

# Install missing dependencies
npm install lucide-react react-feather

# Create environment file
cp .env.example .env
```

### 2. **Environment Configuration**
Edit `.env` file with these values:
```env
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/divvyup
DB_NAME=divvyup
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432

# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here-make-it-long-and-random
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Client Configuration
CLIENT_URL=http://localhost:3000
VITE_API_URL=http://localhost:3001

# Email Configuration (Optional for testing)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=your-email@gmail.com
```

### 3. **Database Setup**
```bash
# Start PostgreSQL and Redis using Docker
npm run docker:up

# Wait for services to be ready (about 30 seconds)
npm run docker:status

# Run database migrations
npm run db:migrate

# Seed the database with test data
npm run db:seed
```

### 4. **Start the Application**
```bash
# Terminal 1: Start the server
npm run dev:server

# Terminal 2: Start the client
npm run dev:client
```

The application will be available at:
- **Frontend**: http://localhost:3000 (or 3001/3002/3003 if 3000 is busy)
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api

---

## 🧪 **Comprehensive Testing Suite**

### **Phase 1: Authentication Testing**

#### ✅ **Test 1.1: User Registration**
1. **Navigate to**: http://localhost:3000/register
2. **Fill out the form**:
   - First Name: `John`
   - Last Name: `Doe`
   - Email: `john.doe@example.com`
   - Password: `Password123!`
   - Confirm Password: `Password123!`
3. **Click**: "Create Account"
4. **Expected Result**: 
   - Success message appears
   - Redirected to dashboard
   - User is logged in

#### ✅ **Test 1.2: User Login**
1. **Navigate to**: http://localhost:3000/login
2. **Fill out the form**:
   - Email: `john.doe@example.com`
   - Password: `Password123!`
3. **Click**: "Sign In"
4. **Expected Result**: 
   - Success message appears
   - Redirected to dashboard
   - User is logged in

#### ✅ **Test 1.3: Logout**
1. **Click**: User menu (top right)
2. **Click**: "Logout"
3. **Expected Result**: 
   - Redirected to login page
   - User is logged out

---

### **Phase 2: Group Management Testing**

#### ✅ **Test 2.1: Create a Group**
1. **Navigate to**: Dashboard
2. **Click**: "Create Group" button
3. **Fill out the form**:
   - Group Name: `Weekend Trip`
   - Description: `Splitting expenses for our weekend getaway`
4. **Click**: "Create Group"
5. **Expected Result**: 
   - Group appears in dashboard
   - Success message shows
   - User is automatically added as admin

#### ✅ **Test 2.2: View Group Details**
1. **Click**: On the "Weekend Trip" group card
2. **Expected Result**: 
   - Group detail page opens
   - Shows group information
   - Shows member list (just you)
   - Shows tabs: Members, Expenses, Balances, Activity

#### ✅ **Test 2.3: Invite Members**
1. **In Group Detail**: Click "Invite Members" button
2. **Fill out the form**:
   - Email: `jane.smith@example.com`
   - Role: `Member`
3. **Click**: "Send Invitation"
4. **Expected Result**: 
   - Success message appears
   - Invitation is sent (check console for invitation token)

#### ✅ **Test 2.4: Edit Group Settings**
1. **In Group Detail**: Click "Settings" button
2. **Modify**:
   - Group Name: `Weekend Trip - Updated`
   - Description: `Updated description`
3. **Click**: "Save Changes"
4. **Expected Result**: 
   - Group name updates
   - Success message appears

---

### **Phase 3: Expense Management Testing**

#### ✅ **Test 3.1: Add an Expense**
1. **In Group Detail**: Click "Add Expense" button
2. **Fill out the form**:
   - Amount: `150.00`
   - Description: `Dinner at Restaurant`
   - Date: Today's date
   - Category: `Food & Dining`
   - Split Method: `Equal`
   - Participants: Select yourself
3. **Click**: "Add Expense"
4. **Expected Result**: 
   - Expense appears in expenses list
   - Success message shows
   - Balance updates

#### ✅ **Test 3.2: Add Another Expense (Different Split)**
1. **Click**: "Add Expense" button
2. **Fill out the form**:
   - Amount: `300.00`
   - Description: `Hotel Room`
   - Date: Today's date
   - Category: `Accommodation`
   - Split Method: `Percentage`
   - Participants: Select yourself (100%)
3. **Click**: "Add Expense"
4. **Expected Result**: 
   - Expense appears in expenses list
   - Shows 100% split

#### ✅ **Test 3.3: Edit an Expense**
1. **In Expenses List**: Click edit button on "Dinner at Restaurant"
2. **Modify**:
   - Amount: `175.00`
   - Description: `Dinner at Restaurant - Updated`
3. **Click**: "Update Expense"
4. **Expected Result**: 
   - Expense updates
   - Success message appears
   - Balance recalculates

#### ✅ **Test 3.4: View Expense Details**
1. **In Expenses List**: Click view button on any expense
2. **Expected Result**: 
   - Expense detail modal opens
   - Shows all expense information
   - Shows split breakdown

#### ✅ **Test 3.5: Delete an Expense**
1. **In Expenses List**: Click delete button on an expense
2. **Confirm**: Click "Delete" in confirmation modal
3. **Expected Result**: 
   - Expense is removed
   - Success message appears
   - Balance recalculates

---

### **Phase 4: Balance & Settlement Testing**

#### ✅ **Test 4.1: View Balance Summary**
1. **In Group Detail**: Click "Balances" tab
2. **Expected Result**: 
   - Shows total expenses
   - Shows total settled
   - Shows total outstanding
   - Shows member balances

#### ✅ **Test 4.2: View Settlement View**
1. **In Balances Tab**: Scroll to Settlement View
2. **Expected Result**: 
   - Shows optimal settlement transactions
   - Shows who owes whom
   - Shows amounts

#### ✅ **Test 4.3: View Balance History**
1. **In Balances Tab**: Scroll to Balance History
2. **Expected Result**: 
   - Shows balance history chart
   - Shows trend analysis
   - Shows balance changes over time

#### ✅ **Test 4.4: Validate Balances**
1. **In Balances Tab**: Scroll to Balance Validation
2. **Click**: "Validate Balances" button
3. **Expected Result**: 
   - Shows validation results
   - Shows if balances are correct
   - Shows total net balance (should be 0)

---

### **Phase 5: Advanced Features Testing**

#### ✅ **Test 5.1: Group Activity Feed**
1. **In Group Detail**: Click "Activity" tab
2. **Expected Result**: 
   - Shows recent activities
   - Shows expense additions
   - Shows member changes

#### ✅ **Test 5.2: Search and Filter Expenses**
1. **In Expenses Tab**: Use search box
2. **Search for**: "Dinner"
3. **Expected Result**: 
   - Filters expenses by search term
   - Shows only matching expenses

#### ✅ **Test 5.3: Filter by Category**
1. **In Expenses Tab**: Select category filter
2. **Choose**: "Food & Dining"
3. **Expected Result**: 
   - Shows only food expenses
   - Filters correctly

#### ✅ **Test 5.4: Sort Expenses**
1. **In Expenses Tab**: Click sort buttons
2. **Try**: Sort by amount, date, description
3. **Expected Result**: 
   - Expenses sort correctly
   - Sort order changes

---

### **Phase 6: Error Handling Testing**

#### ✅ **Test 6.1: Invalid Login**
1. **Navigate to**: Login page
2. **Enter**: Wrong email/password
3. **Expected Result**: 
   - Error message appears
   - User stays on login page

#### ✅ **Test 6.2: Duplicate Group Name**
1. **Try to create**: Another group with same name
2. **Expected Result**: 
   - Error message appears
   - Group creation fails

#### ✅ **Test 6.3: Invalid Expense Amount**
1. **Try to add expense**: With negative amount
2. **Expected Result**: 
   - Validation error appears
   - Expense creation fails

---

### **Phase 7: Responsive Design Testing**

#### ✅ **Test 7.1: Mobile View**
1. **Open**: Browser dev tools
2. **Switch to**: Mobile view (375px width)
3. **Test**: All major functions
4. **Expected Result**: 
   - UI adapts to mobile
   - All functions work
   - No horizontal scrolling

#### ✅ **Test 7.2: Tablet View**
1. **Switch to**: Tablet view (768px width)
2. **Test**: All major functions
3. **Expected Result**: 
   - UI adapts to tablet
   - All functions work
   - Good layout

---

## 🔍 **Testing Checklist**

### **Core Functionality**
- [ ] User registration works
- [ ] User login works
- [ ] User logout works
- [ ] Group creation works
- [ ] Group editing works
- [ ] Group deletion works
- [ ] Member invitation works
- [ ] Expense creation works
- [ ] Expense editing works
- [ ] Expense deletion works
- [ ] Balance calculation works
- [ ] Settlement calculation works

### **UI/UX**
- [ ] All pages load correctly
- [ ] Navigation works
- [ ] Modals open/close correctly
- [ ] Forms validate input
- [ ] Error messages display
- [ ] Success messages display
- [ ] Loading states work
- [ ] Responsive design works

### **Data Integrity**
- [ ] Balances are accurate
- [ ] Settlements are optimal
- [ ] Expense splits are correct
- [ ] Group members are tracked
- [ ] Activity feed is accurate

---

## 🐛 **Common Issues & Solutions**

### **Issue 1: Database Connection Failed**
**Solution**: 
```bash
# Check if PostgreSQL is running
npm run docker:status

# Restart services
npm run docker:down
npm run docker:up
```

### **Issue 2: Port Already in Use**
**Solution**: 
```bash
# Kill processes on ports
pkill -f tsx
pkill -f vite

# Or use different ports
PORT=3002 npm run dev:server
```

### **Issue 3: Missing Dependencies**
**Solution**: 
```bash
# Install missing packages
npm install lucide-react react-feather

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### **Issue 4: Environment Variables Not Loaded**
**Solution**: 
```bash
# Check .env file exists
ls -la .env

# Restart server after changing .env
npm run dev:server
```

---

## 📊 **Performance Testing**

### **Test 1: Load Time**
- [ ] Dashboard loads in < 2 seconds
- [ ] Group detail loads in < 1 second
- [ ] Expense list loads in < 1 second

### **Test 2: Memory Usage**
- [ ] No memory leaks during navigation
- [ ] Modals close properly
- [ ] No excessive API calls

### **Test 3: API Response Time**
- [ ] API responses < 500ms
- [ ] Database queries optimized
- [ ] No unnecessary requests

---

## 🎯 **Success Criteria**

The application is ready for production if:
1. ✅ All core functionality works
2. ✅ No critical errors occur
3. ✅ UI is responsive and intuitive
4. ✅ Data integrity is maintained
5. ✅ Performance is acceptable
6. ✅ Error handling is robust

---

## 📝 **Testing Notes**

**Date**: [Current Date]
**Tester**: [Your Name]
**Version**: 1.0.0
**Browser**: [Browser Used]
**OS**: [Operating System]

**Issues Found**:
- [ ] Issue 1: [Description]
- [ ] Issue 2: [Description]
- [ ] Issue 3: [Description]

**Recommendations**:
- [ ] Recommendation 1: [Description]
- [ ] Recommendation 2: [Description]
- [ ] Recommendation 3: [Description]

---

## 🚀 **Next Steps After Testing**

1. **Fix any critical issues** found during testing
2. **Optimize performance** if needed
3. **Improve UI/UX** based on feedback
4. **Add additional features** if required
5. **Prepare for deployment** to production

---

**Happy Testing! 🎉**
