# Prime Study Abroad - Mobile Application

Welcome to the **Prime Study Abroad** mobile app! This React Native application allows students, advisors, and administrators to manage study abroad applications, track progress, and access resources conveniently on mobile devices.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Folder Structure](#folder-structure)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Security](#security)
- [Contributing](#contributing)
- [Contact](#contact)

---

## Project Overview

Prime Study Abroad is a cloud-connected mobile app built with React Native and Expo. It integrates with a Node.js/Express backend and MongoDB Atlas database, providing a seamless experience for managing study abroad processes.

---

## Features

- User authentication with JWT
- Role-based access for students, advisors, and admins
- Student registration and profile management
- Application tracking and status updates
- Secure document uploads with AWS S3 integration
- Advisor notes and communication tools
- Responsive, mobile-first UI styled with NativeWind (Tailwind CSS)
- Offline support and error handling

---

## Technology Stack

### Frontend

| Technology               | Purpose                                |
|--------------------------|--------------------------------------|
| React Native + Expo      | Cross-platform mobile app development |
| React Navigation         | App navigation and routing            |
| NativeWind               | Tailwind CSS styling for React Native |
| Axios                    | API communication                     |
| React Hook Form          | Form handling and validation          |
| React Native Vector Icons| UI iconography                       |

### Backend

| Technology               | Purpose                                |
|--------------------------|--------------------------------------|
| Node.js + Express        | REST API backend                      |
| MongoDB Atlas + Mongoose | Database and data modeling            |
| JWT                      | Authentication tokens                 |
| Bcrypt                   | Password hashing                      |
| Multer + Multer-S3       | File upload handling and AWS S3 storage |
| Nodemailer               | Email notifications                   |

### Cloud & Infrastructure

| Service                  | Purpose                                |
|--------------------------|--------------------------------------|
| AWS S3                   | Document storage                      |
| Render                   | Backend hosting                      |
| Expo EAS                 | Mobile app building and deployment   |
| MongoDB Atlas            | Cloud database                       |

---


## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Access to backend API and environment variables

### Installation

1. Clone the repository:
```git clone https://github.com/yourusername/prime-study-abroad.git
cd prime-study-abroad/frontend


2. Install dependencies:

``` npm install


3. Create a `.env` file in the `frontend` folder with the following variables:

``` API_BASE_URL=https://your-backend-api.com


4. Start the development server:

```expo start


5. Open the app on your device using the Expo Go app or an emulator.

---

## Available Scripts

| Script           | Description                          |
|------------------|------------------------------------|
| `expo start`     | Starts the development server       |
| `expo build:android` | Builds the Android app (via EAS) |
| `expo build:ios` | Builds the iOS app (via EAS)        |
| `npm run lint`   | Runs ESLint for code quality        |
| `npm run format` | Runs Prettier for code formatting   |

---

## Environment Variables

| Variable       | Description                     |
|----------------|---------------------------------|
| `API_BASE_URL` | URL of the backend API server   |

> Backend environment variables are managed separately in the backend project.

---

## Deployment

- Mobile app builds and deployments are managed using **Expo EAS**.
- Backend API is hosted on **Render** with continuous deployment from GitHub.
- AWS S3 is used for secure document storage.
- Environment variables are securely managed in both frontend and backend.

---

## Security

- JWT authentication with token expiration and refresh
- Passwords hashed securely using bcrypt
- All API communication encrypted via HTTPS
- CORS policy restricts API access to trusted clients
- Server-side input validation and sanitization
- Secure file upload validation and storage
- Role-based access control for different user types
- Secure token storage on device (e.g., SecureStore)

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "Add feature"`)
4. Push the branch (`git push origin feature/your-feature`)
5. Open a pull request

Please ensure your code follows the project’s linting and formatting guidelines.


---

## Contact

For questions or support, please contact:

- **Project Maintainer:** yourname@example.com  
- **GitHub:** [https://github.com/yourusername](https://github.com/yourusername)

---

Thank you for using **Prime Study Abroad**! 🚀

