# 🚀 **Quick Start Testing Guide**

## **One-Command Setup**

```bash
# Run the automated setup script
./setup-testing.sh
```

This script will:
- Install all dependencies
- Start Docker services (PostgreSQL + Redis)
- Run database migrations
- Seed test data
- Provide next steps

## **Manual Setup (if needed)**

### 1. **Install Dependencies**
```bash
npm install
npm install lucide-react react-feather
```

### 2. **Start Services**
```bash
# Terminal 1: Start database services
npm run docker:up

# Wait 30 seconds, then start the server
npm run dev:server

# Terminal 2: Start the client
npm run dev:client
```

### 3. **Seed Test Data**
```bash
# Run migrations
npm run db:migrate

# Seed test data
npm run db:seed:test
```

## **Access the Application**

- **Frontend**: http://localhost:3000 (or 3001/3002/3003)
- **Backend API**: http://localhost:3001
- **API Docs**: http://localhost:3001/api

## **Test User Credentials**

| Email | Password | Role |
|-------|----------|------|
| test@example.com | Password123! | Admin |
| jane@example.com | Password123! | Member |
| bob@example.com | Password123! | Member |

## **Quick Test Flow**

1. **Login** with `test@example.com` / `Password123!`
2. **View Dashboard** - should see "Weekend Trip" and "Office Lunch" groups
3. **Click on "Weekend Trip"** - view group details
4. **Go to "Expenses" tab** - see test expenses
5. **Go to "Balances" tab** - see balance calculations
6. **Add a new expense** - test the full flow
7. **Test different split methods** - equal, percentage, custom

## **Troubleshooting**

### **Port Already in Use**
```bash
npm run kill:ports
npm run dev:server
npm run dev:client
```

### **Database Issues**
```bash
npm run docker:restart
npm run db:migrate
npm run db:seed:test
```

### **Missing Dependencies**
```bash
npm install lucide-react react-feather
```

## **Full Testing Guide**

For comprehensive testing, see [TESTING_GUIDE.md](./TESTING_GUIDE.md)

---

**Happy Testing! 🎉**
