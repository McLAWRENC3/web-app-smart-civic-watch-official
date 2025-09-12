**Web App Prerequisites**
Node.js (version 14 or higher)

npm or yarn package manager

Firebase Account (same project as mobile app)

Modern web browser (Chrome, Firefox, Safari, or Edge)

**Web Application Setup Instructions**
1. Navigate to Web App Directory
   cd web-app
2. Install Dependencies
   npm install
3. Firebase Configuration
Use the same Firebase project as your mobile app

Create a .env file in the web-app directory
Add your Firebase configuration:
REACT_APP_API_KEY=your_api_key_here
REACT_APP_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_PROJECT_ID=your_project_id
REACT_APP_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_APP_ID=your_app_id

4. Start Development Server
   npm start
   
**The application will open in your browser at http://localhost:3000**

Web App Features
Admin Dashboard
View real-time incident reports from mobile users

Monitor emergency alerts and community activity

Manage user accounts and permissions

Analyze trends through data visualization

Incident Management
Review and verify reported incidents

Update incident status (pending, in-progress, resolved)

Communicate with reporters through comment system

Export incident data for reporting purposes
User Administration
View registered user accounts
Analytics and Reporting
Visualize incident trends on interactive charts

Generate reports on community engagement

Monitor system usage statistics

Export data for external analysis

