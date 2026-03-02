# MongoDB Setup for Magnus Copo

Your login isn't working because **MongoDB is not running**. Choose one of these options:

---

## Option 1: Install MongoDB Locally (Recommended for Development)

### Windows Installation:

1. **Download MongoDB Community Server:**
   - Go to: https://www.mongodb.com/try/download/community
   - Select: Windows, latest version, MSI
   - Download and run the installer

2. **Installation Steps:**
   - Choose "Complete" installation
   - ✅ Check "Install MongoDB as a Service"
   - ✅ Check "Run service as Network Service user"
   - Keep default data and log directories
   - Optionally install MongoDB Compass (GUI tool)

3. **Verify Installation:**
   ```powershell
   # Check if MongoDB service is running
   Get-Service MongoDB
   
   # Start MongoDB if not running
   net start MongoDB
   ```

4. **Test Connection:**
   ```powershell
   # Run from project directory
   npm run db:seed
   ```

5. **Start Your App:**
   ```powershell
   npm run dev
   ```

---

## Option 2: Use MongoDB Atlas (Cloud - No Installation Required)

### Quick Setup (5 minutes):

1. **Create Free Account:**
   - Go to: https://www.mongodb.com/cloud/atlas/register
   - Sign up (free tier available)

2. **Create Cluster:**
   - Click "Build a Database"
   - Choose FREE tier (M0 Sandbox)
   - Select a cloud provider and region (choose closest to you)
   - Click "Create"

3. **Setup Database Access:**
   - Go to "Database Access" (left sidebar)
   - Click "Add New Database User"
   - Username: `magnuscopo`
   - Password: Generate a secure password (save it!)
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

4. **Setup Network Access:**
   - Go to "Network Access" (left sidebar)
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

5. **Get Connection String:**
   - Go back to "Database" (left sidebar)
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (looks like):
     ```
     mongodb+srv://magnuscopo:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```

6. **Update .env File:**
   Replace `<password>` with your actual password and update your `.env`:
   ```env
   DATABASE_URL="mongodb+srv://magnuscopo:YOUR_PASSWORD_HERE@cluster0.xxxxx.mongodb.net/mmdss?retryWrites=true&w=majority"
   NEXTAUTH_SECRET="change-this-to-a-secure-random-secret"
   NEXTAUTH_URL="http://localhost:3000"
   ```

7. **Restart Your Application:**
   ```powershell
   # Stop the current server (Ctrl+C in the terminal)
   # Then restart:
   npm start
   ```

---

## Troubleshooting

### "MongooseServerSelectionError: connect ECONNREFUSED"
- MongoDB is not running
- For **local**: Run `net start MongoDB`
- For **Atlas**: Check your connection string and password

### "Authentication failed"
- Wrong username/password in connection string
- Verify credentials in MongoDB Atlas

### "Connection timeout"
- Check Network Access whitelist in MongoDB Atlas
- Ensure 0.0.0.0/0 is allowed

---

## Quick Test

After setting up MongoDB, test the connection:

```powershell
# Seed default users
npm run db:seed

# Start the application
npm start
```

Then try logging in with:
- **Email:** `admin@magnuscopo.com`
- **Password:** `Admin123!`

---

## Current Status

✅ Application built successfully  
✅ All TypeScript errors fixed  
✅ Server running on http://localhost:3000  
❌ **MongoDB not connected** ← You are here

**Choose Option 1 (local) or Option 2 (cloud) above to fix this.**
