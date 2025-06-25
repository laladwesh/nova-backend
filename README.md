# 🎓 Nova Backend

![Nova Backend Logo](https://pplx-res.cloudinary.com/image/upload/v1750827032/gpt4o_images/xotggtad0yunkerhndzq.png)

A modern, full-stack school management system backend built with Node.js, Express, MongoDB, and Firebase integration. Nova Backend provides a comprehensive API solution for educational institutions to manage students, teachers, classes, attendance, assignments, and more.

[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://www.javascript.com/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)

## 📋 Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation & Setup](#installation--setup)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Authentication](#authentication)
- [Database Models](#database-models)
- [Firebase Integration](#firebase-integration)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🌟 Overview

Nova Backend is a comprehensive school management system API that streamlines administrative processes, academic operations, and communication within educational institutions. It serves as the core backend for a school management application, providing robust APIs for handling various aspects of school management including user authentication, student and teacher management, class scheduling, attendance tracking, fee management, and more.

The system is designed with scalability in mind, ensuring it can handle educational institutions of all sizes while maintaining performance and reliability.

## 🏗️ System Architecture

![System Architecture](https://pplx-res.cloudinary.com/image/upload/v1750827089/gpt4o_images/ipoip8kr94yt5tfkpdsu.png)

Nova Backend follows a modern microservices-inspired architecture with the following components:

- **API Layer**: Express.js routes and controllers handling HTTP requests
- **Service Layer**: Business logic separated into reusable services
- **Data Access Layer**: MongoDB models for data persistence
- **Notification System**: Firebase Cloud Messaging (FCM) for real-time push notifications
- **Authentication**: JWT-based secure authentication with refresh tokens
- **Middleware**: Request validation, error handling, and authorization

## ✨ Features

Nova Backend provides a comprehensive set of features to manage all aspects of school operations:

### 👥 User Management
- Multi-role authentication (Admin, Teacher, Student, Parent)
- Secure JWT authentication with refresh tokens
- Password reset functionality
- User profile management

### 🏫 School Administration
- School registration and profile management
- Multiple schools support (for SaaS model)
- Customizable school settings

### 👨‍🏫 Teacher Management
- Teacher onboarding and profile management
- Class and subject assignment
- Schedule management
- Performance tracking

### 👨‍🎓 Student Management
- Student registration and enrollment
- Parent association
- Academic record management
- Attendance tracking
- Performance monitoring

### 📚 Academic Management
- Class and section creation
- Subject management
- Curriculum planning
- Lesson plan creation and tracking
- Assignment creation and grading
- Exam scheduling and grading
- Report card generation

### 📅 Scheduling
- Timetable generation
- Event management
- Calendar synchronization
- Parent-Teacher Meeting (PTM) scheduling

### 📊 Attendance System
- Student attendance tracking
- Teacher attendance management
- Real-time attendance reporting
- Absence notifications to parents

### 💰 Fee Management
- Fee structure configuration
- Fee collection tracking
- Payment history
- Receipt generation

### 📣 Communication
- Announcements and notices
- Direct messaging between users
- Push notifications via Firebase Cloud Messaging
- Email notifications
- Story/news feed for school updates

### 📝 Forms & Resources
- Custom form creation
- Document/resource management
- Resource sharing

### 📈 Analytics & Reporting
- Performance analytics
- Attendance reports
- Financial reports
- Custom report generation

### 🔍 Search Functionality
- Advanced search across all entities
- Filtered and faceted search

## 🛠️ Tech Stack

Nova Backend is built using modern technologies to ensure scalability, performance, and maintainability:

### Core Technologies
- **Node.js**: JavaScript runtime for server-side execution
- **Express.js**: Web framework for creating robust APIs
- **MongoDB**: NoSQL database for flexible data storage
- **Mongoose**: ODM for MongoDB schema modeling
- **Firebase**: For push notifications and real-time features

### Authentication & Security
- **JWT (JSON Web Tokens)**: For secure authentication
- **bcrypt**: For password hashing
- **Express Rate Limit**: For API rate limiting

### Development Tools
- **ESLint**: For code quality and consistency
- **Nodemon**: For development server auto-restart
- **Postman**: For API testing

### Additional Libraries
- **Moment.js**: For date manipulation
- **Multer**: For file uploads
- **Nodemailer**: For email notifications

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14.x or higher)
- MongoDB (v4.x or higher)
- Firebase project and configuration

### Installation Steps

1. **Clone the repository**
git clone https://github.com/laladwesh/nova-backend.git
cd nova-backend

 

2. **Install dependencies**
npm install

 

3. **Environment Configuration**

Create a `.env` file in the root directory with the following variables:
Server Configuration
PORT=3000
NODE_ENV=development

MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/nova_school

JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

Firebase Configuration
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=your_client_cert_url

Email Configuration (if using email notifications)
EMAIL_SERVICE=gmail
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_email_password

 

4. **Database Setup**

The application will automatically set up the database collections when it first starts.

Optionally, you can seed the database with initial data:
node adminSeed.js

 

5. **Start the Server**

For development with auto-restart:
npm run dev

 

For production:
npm start

 

6. **Verify Installation**

The server should be running at `http://localhost:3000` (or the port you specified in the `.env` file).

Test the API with a simple health check:
curl http://localhost:3000/api/

 

## 📁 Project Structure

The Nova Backend follows a structured, modular approach for better organization and maintainability:

nova-backend/
├── client/ # Client-side related files
├── config/ # Configuration files
│ ├── db.js # Database connection
│ ├── firebase.js # Firebase configuration
│ └── ...
├── controllers/ # API route controllers
│ ├── authController.js # Authentication logic
│ ├── userController.js # User management
│ ├── schoolController.js # School management
│ └── ...
├── middleware/ # Custom middleware
│ ├── auth.js # Authentication middleware
│ ├── error.js # Error handling
│ └── ...
├── models/ # Database models
│ ├── User.js # User model
│ ├── School.js # School model
│ └── ...
├── routes/ # API routes
│ ├── authRoutes.js # Authentication routes
│ ├── userRoutes.js # User management routes
│ └── ...
├── services/ # Business logic
│ ├── authService.js # Authentication services
│ ├── emailService.js # Email notification services
│ └── ...
├── utils/ # Utility functions
│ ├── apiResponse.js # API response formatter
│ ├── validators.js # Input validation
│ └── ...
├── .env # Environment variables
├── .gitignore # Git ignore file
├── adminSeed.js # Admin user seeding script
├── app.js # Express app setup
├── index.js # Application entry point
├── package.json # Project dependencies
├── package-lock.json # Dependency lock file
└── server.js # Server configuration

 

## 📚 API Documentation

### API Endpoints

Below is a summary of the main API endpoints. For detailed documentation, refer to the API documentation section.

#### Authentication

| Method | Endpoint              | Description                       |
|--------|------------------------|-----------------------------------|
| POST   | /api/auth/register    | Register a new user               |
| POST   | /api/auth/login       | Login user                        |
| POST   | /api/auth/refresh     | Refresh access token              |
| POST   | /api/auth/logout      | Logout user                       |
| POST   | /api/auth/forgot-password | Request password reset        |
| POST   | /api/auth/reset-password  | Reset password with token     |

#### User Management

| Method | Endpoint              | Description                       |
|--------|------------------------|-----------------------------------|
| GET    | /api/users            | Get all users (admin only)        |
| GET    | /api/users/:id        | Get user by ID                    |
| PUT    | /api/users/:id        | Update user                       |
| DELETE | /api/users/:id        | Delete user                       |

#### School Management

| Method | Endpoint              | Description                       |
|--------|------------------------|-----------------------------------|
| POST   | /api/schools          | Create a new school               |
| GET    | /api/schools          | Get all schools                   |
| GET    | /api/schools/:id      | Get school by ID                  |
| PUT    | /api/schools/:id      | Update school                     |
| DELETE | /api/schools/:id      | Delete school                     |

#### Student Management

| Method | Endpoint                    | Description                       |
|--------|----------------------------|-----------------------------------|
| POST   | /api/students              | Add a new student                 |
| GET    | /api/students              | Get all students                  |
| GET    | /api/students/:id          | Get student by ID                 |
| PUT    | /api/students/:id          | Update student                    |
| DELETE | /api/students/:id          | Delete student                    |
| GET    | /api/students/class/:classId | Get students by class          |

#### Teacher Management

| Method | Endpoint                    | Description                       |
|--------|----------------------------|-----------------------------------|
| POST   | /api/teachers              | Add a new teacher                 |
| GET    | /api/teachers              | Get all teachers                  |
| GET    | /api/teachers/:id          | Get teacher by ID                 |
| PUT    | /api/teachers/:id          | Update teacher                    |
| DELETE | /api/teachers/:id          | Delete teacher                    |

#### Class Management

| Method | Endpoint                    | Description                       |
|--------|----------------------------|-----------------------------------|
| POST   | /api/classes               | Create a new class                |
| GET    | /api/classes               | Get all classes                   |
| GET    | /api/classes/:id           | Get class by ID                   |
| PUT    | /api/classes/:id           | Update class                      |
| DELETE | /api/classes/:id           | Delete class                      |

#### Attendance Management

| Method | Endpoint                               | Description                       |
|--------|--------------------------------------|-----------------------------------|
| POST   | /api/attendance                       | Record attendance                 |
| GET    | /api/attendance/class/:classId/date/:date | Get attendance by class and date |
| GET    | /api/attendance/student/:studentId    | Get attendance by student         |

#### Assignment Management

| Method | Endpoint                           | Description                       |
|--------|------------------------------------|-----------------------------------|
| POST   | /api/assignments                   | Create a new assignment           |
| GET    | /api/assignments                   | Get all assignments               |
| GET    | /api/assignments/:id               | Get assignment by ID              |
| PUT    | /api/assignments/:id               | Update assignment                 |
| DELETE | /api/assignments/:id               | Delete assignment                 |
| GET    | /api/assignments/class/:classId    | Get assignments by class          |

#### Schedule Management

| Method | Endpoint                        | Description                       |
|--------|----------------------------------|-----------------------------------|
| POST   | /api/schedules                  | Create a new schedule             |
| GET    | /api/schedules                  | Get all schedules                 |
| GET    | /api/schedules/:id              | Get schedule by ID                |
| PUT    | /api/schedules/:id              | Update schedule                   |
| DELETE | /api/schedules/:id              | Delete schedule                   |
| GET    | /api/schedules/class/:classId   | Get schedules by class            |
| GET    | /api/schedules/teacher/:teacherId | Get schedules by teacher        |

#### Grade Management

| Method | Endpoint                      | Description                       |
|--------|-------------------------------|-----------------------------------|
| POST   | /api/grades                   | Add a new grade                   |
| GET    | /api/grades/student/:studentId | Get grades by student            |
| GET    | /api/grades/class/:classId    | Get grades by class               |
| PUT    | /api/grades/:id               | Update grade                      |
| DELETE | /api/grades/:id               | Delete grade                      |

#### Fee Management

| Method | Endpoint                      | Description                       |
|--------|-------------------------------|-----------------------------------|
| POST   | /api/fees                     | Create a new fee record           |
| GET    | /api/fees                     | Get all fees                      |
| GET    | /api/fees/:id                 | Get fee by ID                     |
| PUT    | /api/fees/:id                 | Update fee                        |
| DELETE | /api/fees/:id                 | Delete fee                        |
| GET    | /api/fees/student/:studentId  | Get fees by student               |

#### Notification Management

| Method | Endpoint                          | Description                       |
|--------|----------------------------------|-----------------------------------|
| POST   | /api/notifications                | Send a new notification           |
| GET    | /api/notifications                | Get all notifications             |
| GET    | /api/notifications/user/:userId   | Get notifications by user         |
| PUT    | /api/notifications/:id/read       | Mark notification as read         |
| DELETE | /api/notifications/:id            | Delete notification               |

#### Story/News Management

| Method | Endpoint                      | Description                       |
|--------|-------------------------------|-----------------------------------|
| POST   | /api/stories                  | Create a new story                |
| GET    | /api/stories                  | Get all stories                   |
| GET    | /api/stories/:id              | Get story by ID                   |
| PUT    | /api/stories/:id              | Update story                      |
| DELETE | /api/stories/:id              | Delete story                      |

#### Resource Management

| Method | Endpoint                      | Description                       |
|--------|-------------------------------|-----------------------------------|
| POST   | /api/resources                | Upload a new resource             |
| GET    | /api/resources                | Get all resources                 |
| GET    | /api/resources/:id            | Get resource by ID                |
| PUT    | /api/resources/:id            | Update resource                   |
| DELETE | /api/resources/:id            | Delete resource                   |
| GET    | /api/resources/class/:classId | Get resources by class            |

#### Form Management

| Method | Endpoint                      | Description                       |
|--------|-------------------------------|-----------------------------------|
| POST   | /api/forms                    | Create a new form                 |
| GET    | /api/forms                    | Get all forms                     |
| GET    | /api/forms/:id                | Get form by ID                    |
| PUT    | /api/forms/:id                | Update form                       |
| DELETE | /api/forms/:id                | Delete form                       |
| POST   | /api/forms/:id/submit         | Submit a form response            |
| GET    | /api/forms/:id/responses      | Get form responses                |

#### Analytics

| Method | Endpoint                           | Description                       |
|--------|------------------------------------|-----------------------------------|
| GET    | /api/analytics/attendance          | Get attendance analytics          |
| GET    | /api/analytics/performance         | Get performance analytics         |
| GET    | /api/analytics/fees                | Get fee collection analytics      |

#### Search

| Method | Endpoint                      | Description                       |
|--------|-------------------------------|-----------------------------------|
| GET    | /api/search                   | Search across all entities        |

### API Response Format

All API responses follow a consistent format:

{
"success": true,
"status": 200,
"message": "Operation successful",
"data": {
// Response data here
},
"pagination": {
"total": 100,
"page": 1,
"limit": 10,
"pages": 10
}
}

 

For error responses:

{
"success": false,
"status": 400,
"message": "Error message",
"error": {
"code": "ERROR_CODE",
"details": "Detailed error information"
}
}

 

## 🔐 Authentication

Nova Backend implements a secure JWT-based authentication system:

### Authentication Flow

1. **Registration**: Users register with email/password or social auth
2. **Login**: Users login and receive an access token and a refresh token
3. **Token Usage**: Access token is used for API requests
4. **Token Refresh**: When the access token expires, the refresh token is used to get a new one
5. **Logout**: Tokens are invalidated on logout

### Token Configuration

- Access tokens expire after 24 hours (configurable)
- Refresh tokens expire after 7 days (configurable)
- Tokens are signed with different secrets for added security

### Role-Based Access Control

The system implements role-based access control with the following roles:

- **Super Admin**: Has access to all schools and functionalities
- **School Admin**: Has administrative access within a specific school
- **Teacher**: Has access to assigned classes, students, and related functionalities
- **Student**: Has access to their own information, classes, and assignments
- **Parent**: Has access to their children's information and related functionalities

## 📊 Database Models

Nova Backend uses MongoDB with Mongoose ODM for data modeling. Here's an overview of the main models:

### User Model

{
name: String,
email: String,
password: String,
role: {
type: String,
enum: ['super_admin', 'admin', 'teacher', 'student', 'parent']
},
school: { type: ObjectId, ref: 'School' },
profile: {
avatar: String,
phone: String,
address: String,
// Additional profile fields
},
isActive: Boolean,
lastLogin: Date,
createdAt: Date,
updatedAt: Date
}

 

### School Model

{
name: String,
code: String,
address: String,
phone: String,
email: String,
website: String,
logo: String,
admin: { type: ObjectId, ref: 'User' },
settings: {
// School-specific settings
},
isActive: Boolean,
createdAt: Date,
updatedAt: Date
}

 

### Student Model

{
user: { type: ObjectId, ref: 'User' },
school: { type: ObjectId, ref: 'School' },
registrationNumber: String,
class: { type: ObjectId, ref: 'Class' },
section: String,
rollNumber: String,
admissionDate: Date,
parents: [{ type: ObjectId, ref: 'User' }],
// Additional student-specific fields
createdAt: Date,
updatedAt: Date
}

 

### Teacher Model

{
user: { type: ObjectId, ref: 'User' },
school: { type: ObjectId, ref: 'School' },
employeeId: String,
qualifications: [String],
subjects: [{ type: ObjectId, ref: 'Subject' }],
classes: [{ type: ObjectId, ref: 'Class' }],
joiningDate: Date,
// Additional teacher-specific fields
createdAt: Date,
updatedAt: Date
}

 

### Class Model

{
name: String,
school: { type: ObjectId, ref: 'School' },
grade: String,
section: String,
subjects: [{ type: ObjectId, ref: 'Subject' }],
classTeacher: { type: ObjectId, ref: 'Teacher' },
students: [{ type: ObjectId, ref: 'Student' }],
schedule: { type: ObjectId, ref: 'Schedule' },
// Additional class-specific fields
createdAt: Date,
updatedAt: Date
}

 

### Schedule Model

{
school: { type: ObjectId, ref: 'School' },
class: { type: ObjectId, ref: 'Class' },
dayOfWeek: {
type: String,
enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
},
periods: [{
name: String,
subject: { type: ObjectId, ref: 'Subject' },
teacher: { type: ObjectId, ref: 'Teacher' },
startTime: String,
endTime: String
}],
createdAt: Date,
updatedAt: Date
}

 

### Attendance Model

{
school: { type: ObjectId, ref: 'School' },
class: { type: ObjectId, ref: 'Class' },
date: Date,
records: [{
student: { type: ObjectId, ref: 'Student' },
status: {
type: String,
enum: ['present', 'absent', 'late', 'excused']
},
remark: String
}],
takenBy: { type: ObjectId, ref: 'User' },
createdAt: Date,
updatedAt: Date
}

 

### Assignment Model

{
title: String,
description: String,
school: { type: ObjectId, ref: 'School' },
class: { type: ObjectId, ref: 'Class' },
subject: { type: ObjectId, ref: 'Subject' },
teacher: { type: ObjectId, ref: 'Teacher' },
dueDate: Date,
attachments: [String],
// Additional assignment-specific fields
createdAt: Date,
updatedAt: Date
}

 

### Grade Model

{
student: { type: ObjectId, ref: 'Student' },
class: { type: ObjectId, ref: 'Class' },
subject: { type: ObjectId, ref: 'Subject' },
examType: String,
marks: Number,
totalMarks: Number,
percentage: Number,
grade: String,
remarks: String,
gradedBy: { type: ObjectId, ref: 'User' },
// Additional grade-specific fields
createdAt: Date,
updatedAt: Date
}

 

### FCMToken Model

{
user: { type: ObjectId, ref: 'User' },
token: String,
device: String,
isActive: Boolean,
createdAt: Date,
updatedAt: Date
}

 

### Story Model

{
title: String,
content: String,
school: { type: ObjectId, ref: 'School' },
author: { type: ObjectId, ref: 'User' },
images: [String],
isPublished: Boolean,
publishedAt: Date,
// Additional story-specific fields
createdAt: Date,
updatedAt: Date
}

 

## 🔥 Firebase Integration

Nova Backend integrates with Firebase for several key features:

### Firebase Cloud Messaging (FCM)

FCM is used for sending push notifications to mobile and web clients. The integration includes:

- Token management for different devices
- Topic-based notifications for group messaging
- Direct notifications to specific users
- Scheduled notifications

### Setup

1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/)
2. Generate a service account key in Project Settings > Service Accounts
3. Configure environment variables with the service account details
4. Use the FCM service in your application for sending notifications

### FCM Service

// Example of how to send a notification to a user
const sendNotification = async (userId, title, body, data = {}) => {
try {
// Get user's FCM tokens
const tokens = await FCMToken.find({ user: userId, isActive: true }).select('token');

 
if (tokens.length === 0) {
  return { success: false, message: 'No active FCM tokens found for user' };
}

const message = {
  notification: {
    title,
    body
  },
  data,
  tokens: tokens.map(t => t.token)
};

const response = await admin.messaging().sendMulticast(message);

return {
  success: true,
  successCount: response.successCount,
  failureCount: response.failureCount
};
} catch (error) {
console.error('FCM notification error:', error);
return { success: false, error: error.message };
}
};

 

## 🚢 Deployment

### Production Deployment Considerations

1. **Environment Configuration**
   - Use environment variables for all sensitive information
   - Configure appropriate values for production

2. **Security Measures**
   - Enable CORS with appropriate restrictions
   - Set up rate limiting
   - Use HTTPS for all communications
   - Implement proper input validation and sanitization

3. **Performance Optimization**
   - Enable compression for API responses
   - Implement caching where appropriate
   - Configure connection pooling for MongoDB

4. **Monitoring and Logging**
   - Set up application monitoring
   - Configure error logging and alerting
   - Implement request logging

### Deployment Options

1. **Traditional Hosting**
   - Set up a Node.js environment on a VPS or dedicated server
   - Use PM2 for process management
   - Set up Nginx as a reverse proxy

2. **Docker Deployment**
   - Build a Docker image of the application
   - Deploy using Docker Compose or Kubernetes

3. **Cloud Deployment**
   - Deploy to AWS, Google Cloud, or Azure
   - Use managed services for MongoDB and other components

4. **Serverless Deployment**
   - Adapt the application for serverless platforms
   - Deploy using AWS Lambda, Google Cloud Functions, or similar services

## 👨‍💻 Contributing

We welcome contributions to Nova Backend! Here's how you can contribute:

1. **Fork the Repository**
git clone https://github.com/laladwesh/nova-backend.git

 

2. **Create a Branch**
git checkout -b feature/your-feature-name


3. **Make Changes**
- Implement your feature or fix
- Add tests if applicable
- Ensure code quality and formatting

4. **Commit Changes**
git commit -m "Add feature: your feature description"

 

5. **Push to your Fork**
git push origin feature/your-feature-name

 

6. **Create a Pull Request**
- Submit a pull request from your fork to the main repository
- Provide a clear description of the changes
- Reference any related issues

### Development Guidelines

- Follow the established code style and structure
- Write clear, descriptive commit messages
- Add appropriate comments and documentation
- Write tests for new features
- Update the README with any necessary information

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

© 2025 Nova Backend. All rights reserved.
