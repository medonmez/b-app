## Product Requirements Document: BÜSASapp

**1. Introduction**

BÜSASapp is a mobile-compatible website designed to streamline operations and communication within the BÜSAS diving club. It will serve as a central hub for members to access training schedules, dive plans, announcements, and manage their diving activities, accessible via web browsers on desktop and mobile devices.

**2. Goals**

*   Improve communication and information dissemination within the club.
*   Simplify the management of training sessions (theoretical, practical pool sessions, lessons).
*   Provide members with easy access to daily dive plans and announcements.
*   Enable efficient logging of dives conducted under club supervision.
*   Offer a personalized profile section for members to track their progress and activities.
*   Establish a clear role-based access system for different member types.

**3. User Roles & Permissions**

The application will support the following user roles with distinct permissions:

*   **Admin:**
    *   Manages all aspects of the application.
    *   Approves new member registrations.
    *   Assigns roles to members.
    *   Creates and manages announcements.
    *   Adds and manages theoretical training content.
    *   Creates and manages practical training schedules (pool sessions, lessons).
    *   Views all user data and activity logs.
*   **Eğitmen (Instructor):**
    *   (Permissions TBD - likely similar to Leader, potentially with access to manage specific training content). Needs further definition.
*   **Lider (Leader):**
    *   Views announcements and dive plans.
    *   Accesses training materials.
    *   Views practical training schedules.
    *   Confirms attendance for lessons they lead.
    *   Logs dives for members via QR code scanning or manual entry.
    *   Views their own profile and dive log.
*   **Asistan (Assistant):**
    *   (Permissions TBD - likely a subset of Leader permissions). Needs further definition.
*   **1\* (One Star Diver):**
    *   Views announcements.
    *   Views the daily dive plan.
    *   Accesses training materials.
    *   Views practical training schedules (pool, lessons) and can sign up/indicate participation.
    *   Views their own profile and dive log.
    *   Generates a QR code for dive logging.
*   **Kursiyer (Trainee):**
    *   Views announcements.
    *   Accesses training materials relevant to their level.
    *   Views practical training schedules (pool, lessons) and can sign up/indicate participation.
    *   Views their own profile: attended lessons, absence count, attended pool sessions, dive log.
    *   Generates a QR code for dive logging.

**4. Features**

*   **4.1. User Authentication & Registration:**
    *   Users can register for an account within the app.
    *   Registrations require Admin approval before the account becomes active.
    *   Secure login system (using Firebase Authentication).
*   **4.2. Dashboard/Home:**
    *   Displays key information like upcoming dives (for relevant roles), recent announcements.
*   **4.3. Announcements:**
    *   A dedicated section listing announcements posted by the Admin.
    *   Push notifications for new announcements (optional, via Firebase Cloud Messaging if needed).
*   **4.4. Daily Dive Plan (for 1\* and above):**
    *   Displays the diving plan for the current day, managed by Admin/Leaders.
*   **4.5. Training Section:**
    *   **4.5.1. Theoretical Training:**
        *   Access to theoretical materials (e.g., documents, videos) managed by Admin/Instructors.
    *   **4.5.2. Practical Training:**
        *   **Pool Sessions:**
            *   Admin creates pool session schedules.
            *   Displayed in a table/grid format showing available slots.
            *   Members (Kursiyer, 1\*, etc.) can sign up for available slots.
        *   **Lessons:**
            *   Admin creates lesson schedules (dates, times, topics).
            *   Members can view upcoming lessons and mark their intention to attend ("Katıl" button).
            *   Leaders assigned to a lesson can view the list of attendees and confirm their actual participation after the lesson.
*   **4.6. Profile:**
    *   Displays user information (Name, Role, etc.).
    *   **For Kursiyer:** Displays statistics like attended lessons, absence count, attended pool sessions.
    *   Access to the user's personal Dive Log.
    *   Option to generate a personal QR code for dive logging.
*   **4.7. Dive Log:**
    *   Lists all dives recorded for the user (stored in Firebase Firestore/Realtime Database).
    *   **Add Dive Functionality (for Leaders):**
        *   Option to initiate adding a new dive.
        *   Choice between scanning a member's QR code or manual entry.
        *   When scanning, the app reads the member's QR code (generated from their profile).
        *   Ability to add multiple members to a single dive log entry (up to 5 total participants per dive).
        *   Dive details (date, location, depth, duration, participants) are saved to the database.
    *   **QR Code Generation (for Kursiyer, 1\*):**
        *   Users can generate their unique QR code within their profile to be scanned by a Leader for dive logging.

**5. Non-Functional Requirements**

*   **Platform:** Mobile-compatible website built using standard web technologies (HTML, CSS, JavaScript).
*   **Backend/Database:** Firebase will be used for backend services like authentication and database storage.
*   **Performance:** The application should be responsive, load quickly, and handle data operations efficiently.
*   **Scalability:** The backend (Firebase) should be designed to handle a growing number of users and data.
*   **Security:** Secure storage of user data and authentication tokens. Role-based access control must be strictly enforced (using Firebase Security Rules).
*   **Usability:** Intuitive and easy-to-navigate user interface.

**6. Development & Testing Environment**

*   **Development OS:** Arch Linux
*   Testing should cover major modern web browsers (e.g., Chrome, Firefox, Safari) on desktop and mobile.

**7. Future Considerations**

*   Offline support features (potentially using service workers, though less critical than for a PWA).
*   More detailed dive planning features.
*   Equipment management/tracking.
*   In-app messaging or forum.
*   Integration with calendar apps.
*   Defining specific permissions for Eğitmen and Asistan roles.