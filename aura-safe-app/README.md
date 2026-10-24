# Aura Safe — South Africa

A responsive Next.js + Supabase application for GBV support pathways, emergency guidance, optional GPS, incident submissions, education and a role-restricted admin console. The visual language follows the supplied concept: forest green, mint, warm cream and coral, with a mobile bottom bar and large action cards.

## Important scope and safety boundary

This is a deployable full-stack codebase, not a claim that a live public service has already been launched. It requires a Supabase project and a hosting account. The SOS button can create a database alert for authorised Aura Safe admins when a signed-in user submits it; **it does not dispatch police, ambulance, security, SMS or push notifications**. Do not advertise it as a 24/7 monitored service until a staffed response protocol, escalation process, monitoring, on-call coverage and notification integration have been implemented and tested. The app always presents direct emergency calling options.

The directory is seeded with national public contact information. It is not a vetted shelter map or a complete province-by-province referral network. A named administrator must verify each record, record verification notes/date and update availability before promoting it as a verified service.

Incident reports and optional SOS coordinates are sensitive data. Before public launch, obtain South African privacy/legal review (including POPIA), establish a lawful basis, retention/deletion process, access logging, breach response, safeguarding policy and trained staff. The included schema uses Supabase row-level security, but a production deployment should also add MFA for admins, rate limiting, abuse prevention, audit logs, encrypted backups, alerting and a reviewed retention workflow. Do not use this app as a replacement for emergency services.

## Stack

- Next.js App Router + TypeScript + React
- Supabase Auth + Postgres + Row Level Security
- Responsive CSS; browser geolocation only after the user taps a location action
- Admin portal at `/admin`

## Setup

1. Install Node.js 20.9+ and npm.
2. Create a Supabase project.
3. In Supabase SQL Editor, run `supabase/schema.sql`.
4. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Supabase project settings. `SUPABASE_SERVICE_ROLE_KEY` is not used by this app's runtime; never expose it in a `NEXT_PUBLIC_` variable.
5. In Supabase Auth settings, configure your site's URL and redirect URLs (local: `http://localhost:3000`; production: your HTTPS domain). For testing, email confirmation can remain enabled; confirm the address before signing in.
6. Run `npm install`, then `npm run dev`. Visit `http://localhost:3000`.
7. Create your admin account through the app, then run the final SQL statement in `supabase/schema.sql`, replacing `YOUR_ADMIN_EMAIL` with that account's email. Verify `/admin` is blocked for ordinary users and works only for the promoted admin.
8. Deploy to a Node-compatible host such as Vercel. Add the same public Supabase environment variables in hosting settings. Set the production HTTPS URL in Supabase Auth settings. Test GPS on HTTPS.

## Features

- Responsive home page based on the Aura Safe screenshot concept
- South African emergency calling links: 112 mobile, 10111 police, GBV Command Centre 0800 428 428, Childline 116
- Optional browser GPS and map link; location permission requested only after a user action
- SOS confirmation modal; optional coordinates only when explicitly checked; database alert to admin for signed-in users
- Authenticated incident reporting with consent acknowledgement
- Support directory, search and filters; admins can mark entries active/inactive and verified/unverified
- Education on physical, sexual, emotional/verbal, financial, digital, stalking, coercive control, harassment, spiritual abuse, child abuse and accountability
- Session-only safety-plan checklist
- Admin dashboard for SOS queue, report review/status and service directory maintenance
- Supabase RLS policies for user-owned reports/SOS and admin operations

## Operational items still required for a real public launch

- Verify all contacts, local services, addresses, accessibility, languages, operating hours and referral eligibility in every province.
- Implement monitored admin notifications (e.g. a secured email/SMS provider) only after staffing and escalation SLAs exist. Never send sensitive incident detail in email/SMS.
- Add rate limits, CAPTCHA/bot protection where appropriate, MFA for administrators, audit logs, data retention/deletion controls, user export/deletion workflows and security testing.
- Add a real service-verification workflow and review date requirements.
- Complete POPIA, safeguarding, clinical/legal and security review. Pen-test before collecting real survivor data.
- Add secure evidence uploads only after threat modelling and encrypted object storage/access controls are implemented. The current form is text-only; it is not an evidence vault.
- Add a documented response process before calling any SOS queue “monitored”.

## GPS and SOS

Browser GPS needs permission and a secure context (HTTPS or localhost). Location is not requested in the background. The SOS feature is not an emergency dispatch integration. When signed in, it writes an alert record; without a deployed staff workflow, no one is guaranteed to see it promptly. Users in immediate danger should call emergency services directly.
