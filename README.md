# CarShare Project

A car sharing platform that connects car owners with renters, allowing users to rent cars and manage their rentals efficiently.

## Prerequisites

### Backend (.NET)
- Visual Studio 2022 or later
- .NET 7.0 SDK or later
- SQL Server 2019 or later
- Git

### Frontend (React)
- Node.js (v16 or later)
- npm (v8 or later)

## Project Structure
```
CarShare/
├── Backend/
│   ├── CarShare.API/           # API Controllers and Middleware
│   ├── CarShare.BLL/           # Business Logic Layer
│   ├── CarShare.DAL/           # Data Access Layer
│   └── CarShare.Common/        # Shared Models and Utilities
└── Frontend/
    ├── public/
    └── src/
        ├── components/         # Reusable UI Components
        ├── pages/             # Page Components
        ├── context/           # React Context
        ├── config/            # Configuration Files
        └── services/          # API Services
```

## Setup Instructions

### Backend Setup

1. **Configure Connection String**
- Open `CarShare.API/appsettings.json`
- Update the connection string with your SQL Server details:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER;Database=CarShareDB;Trusted_Connection=True;MultipleActiveResultSets=true"
  }
}
```

2. **Run Backend**
```bash

# Restore dependencies
dotnet restore

# Build the project
dotnet build

# Run the API
dotnet run --project CarShare.API
```

The database will be automatically created and updated using Entity Framework Core migrations when you run the application.

The API will be available at `https://localhost:5001` or `http://localhost:5000`

### Frontend Setup

1. **Install Dependencies**
```bash
# Navigate to the frontend directory
cd CarShare-main

# Install dependencies
npm install


2. **Run Frontend**
```bash
# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Features

### User Management
- User Authentication (Login/Register)
- Different user roles (Admin, Car Owner, Renter)
- ❌ Admin approval system for new Car Owner registrations
- User Profile Management

### Car Management
- Car Management (CRUD operations)
- Car Search and Filtering by:
  - Car Type
  - Price
  - Brand
  - Model
  - Year
  - Transmission Type
  - Location
- Car post details include:
  - Owner name
  - Title
  - Description
  - Car Type
  - Brand
  - Model
  - Year
  - Transmission (Automatic/Manual)
  - Location
  - Rental Status (Available/Rented)
  - ❌ Availability Dates (Start/End)
  - Rental Price

### Rental System
- Rental Management
- ❌ License verification system
- ❌ Rental proposal submission
- ❌ Proposal review and approval by Car Owners
- Rental status tracking
- ❌ Car availability management

### Admin Features
- Admin Dashboard
- ❌ Manage (accept/reject) new Car Owner registrations
- Review and approve/reject car posts
- User management
- System monitoring

### Feedback System
- ❌ Car rating system
- ❌ User feedback submission
- ❌ Feedback display on car posts
- ❌ Rental history verification for feedback
