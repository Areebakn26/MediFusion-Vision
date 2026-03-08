4.5.1 Deployment Environment

The system is deployed using the following setup:

• Backend Server: Node.js v18+ with Express v5.1.0
• Database Service: PostgreSQL 14+ with Sequelize ORM v6.37.7
• Authentication Service: JWT (JSON Web Tokens) via jsonwebtoken v9.0.2
• Frontend Framework: React v19.2.0 with Vite v7.2.4 build system
• Real-Time Communication: Socket.io v4.8.1 for WebSocket connections
• File Storage: Local filesystem (server/uploads/) with Multer v2.0.2
• Deployment Method: Local development environment (cloud hosting not currently configured)

**Current Deployment Status:**
- **Cloud Hosting**: ❌ Not currently deployed to cloud
- **Hosting Type**: Local development environment
- **Database**: PostgreSQL running on localhost:5432
- **File Storage**: Local filesystem directory (server/uploads/)

**Development Environment:**
- Backend: `npm run dev` (Nodemon for auto-restart)
- Frontend: `npm run dev` (Vite dev server on port 5173)
- Database: PostgreSQL running on localhost:5432
- Environment: Development mode with hot-reload enabled

**Production Deployment Recommendations:**
- **Backend**: `npm start` (Node.js production server)
- **Frontend**: `npm run build` (Vite production build to dist/ folder)
- **Cloud Hosting Options**: AWS EC2, DigitalOcean, Heroku, Railway, or Render
- **Database**: Managed PostgreSQL service (AWS RDS, DigitalOcean Managed Database, or Supabase)
- **Process Manager**: PM2 for Node.js process management
- **Reverse Proxy**: Nginx for load balancing and SSL termination
- **File Storage**: AWS S3, Cloudinary, or DigitalOcean Spaces (instead of local storage)
- **SSL Certificate**: Let's Encrypt for HTTPS
- **CDN**: CloudFlare for static asset delivery

**Technology Stack:**
- Runtime: Node.js v18+
- Web Framework: Express.js v5.1.0
- Database ORM: Sequelize v6.37.7
- Frontend Build Tool: Vite v7.2.4
- UI Framework: React v19.2.0
- Styling: Tailwind CSS v4.1.17
- Payment Processing: Stripe v20.0.0
- Email Service: Nodemailer v7.0.11 (SMTP)

