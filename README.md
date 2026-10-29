**Aura Safe**

A privacy-conscious digital platform connecting people affected by gender-based violence (GBV) with support information and safer pathways to help in South Africa.

**About the Project**

Gender-based violence affects individuals, families and communities across South Africa.
People seeking help may face fear, stigma, uncertainty about where to turn, or difficulty finding relevant support.
Aura Safe aims to make support information easier to access and to provide a more discreet way to explore help options, document an incident
and find relevant resources. The project is being developed with privacy, accessibility and user safety in mind.

**Key Features**

The application codebase includes or is being developed around the following features:
- Emergency information: Quick access to South African emergency and support contact options.
- Support directory: Browse and search support-service information.
- Incident reporting: An authenticated form for submitting an incident report.
- SOS flow: A confirmation flow that can create an alert record for authorised administrators when configured and used by a signed-in user.
- Optional location sharing: Browser location access is requested only after a user takes an action that requires it.
- Safety planning: A checklist to help users consider practical safety steps.
- Educational resources: Information about different forms of GBV and related abuse.
- Administrator area: A role-restricted area for reviewing reports, SOS records and directory entries.

 **Important Safety Boundaries**
 
- The SOS feature does not automatically dispatch police, ambulance, security, SMS or push notifications.
- Do not describe the SOS queue as monitored or the app as a 24/7 response service unless staffing, notification delivery, escalation procedures and monitoring have been implemented and tested.
- Aura Safe is not a replacement for emergency services. If someone is in immediate danger, they should contact emergency services directly where it is safe to do so.

**Technology Stack**

- Next.js 15 — React framework and application routing
- React 19 — User interface
- TypeScript — Type-safe JavaScript
- Supabase Auth — Authentication
- Supabase Postgres — Database
- Supabase Row Level Security (RLS) — Database access policies
- CSS — Responsive styling
- Lucide React — Interface icons
- npm — Package and script management
- Git and GitHub — Version control and collaboration
- Vercel — Project deployment target
- Android - APK deployment

**Getting Started**

**Prerequisites**

- Node.js 20.9 or later (Node.js 22 LTS is suitable)
- npm
- A Supabase project
- Git (optional, for cloning and version control)

  **1. Clone the repository**
  git clone https://github.com/sidon59/FNB_AOTY_Aura_Safe.git
cd FNB_AOTY_Aura_Safe/aura-safe-app

**2. install dependencies**
npm install

**Contributing**

Contributions and feedback are welcome while the project is being developed.
1. Fork the repository.
2. Create a feature branch.
3. Make and test your changes.
4. Submit a pull request describing the change and any testing performed.
   
Please do not include secrets, private records, or identifying survivor information in issues, commits, screenshots, or test fixtures.

**Current Limitations**
Aura Safe is still under implementation. Not every feature may be fully configured, deployed, independently verified or ready for public use.

**Acknowledgements**
Created as a technology for-social-impact project focused on improving access to GBV support pathways and safety information in South Africa.
