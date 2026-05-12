# OrthoFlow MVP Implementation Plan

- Stack: Angular PWA + Spring Boot + PostgreSQL + Redis + Keycloak
- Scope: Auth/RBAC, practice onboarding, patient dossier, region config, security, roadmap
- Regions: Morocco, France, United States
- MVP timing: 4 sprints over 8 weeks
- Post-MVP: simulation viewer, billing, patient portal, DICOM viewer, AI suggestions, mobile app

## MVP Pillars

- Auth & Onboarding
  - Secure multi-role login
  - Practice setup wizard
  - Staff invitation flow
  - Region-aware configuration for MA, FR, US
- Patient Dossier
  - Patient registration
  - Medical history
  - Treatment plan
  - Appointments
  - Clinical notes
  - Documents and imaging references
  - Simulation preview metadata
- Config & i18n
  - Region profiles
  - Locale bundles: ar, fr, en
  - Legislation rules engine
  - Field visibility by region
  - Insurance schema adapters

## Architecture

### Frontend

- Angular 18+ PWA
- Feature-based structure
- Lazy-loaded modules
- Angular Signals
- Route guards and HTTP interceptors

### Frontend Structure

```text
src/
  app/
    core/
    shared/
    features/
      auth/
      onboarding/
      patients/
      settings/
    config/
  environments/
    environment.ma.ts
    environment.fr.ts
    environment.us.ts
```

### Backend

- Spring Boot 3.3
- Multi-module Maven
- Spring Security 6
- Spring Data JPA
- DDD-style patient module

### Backend Structure

```text
orthoflow-backend/
  orthoflow-common/
  orthoflow-config/
  orthoflow-auth/
  orthoflow-practice/
  orthoflow-patient/
    domain/
    application/
    infrastructure/
    presentation/
  orthoflow-imaging/
  orthoflow-notification/
  orthoflow-api-gateway/
```

## Key Tech Choices

- Angular 18+
- PWA / Service Worker
- Angular Signals
- Spring Boot 3.3
- Spring Security 6
- Spring Data JPA
- PostgreSQL
- Redis for sessions
- Docker + Compose
- Keycloak for IAM

## SOLID Approach

- S: one use-case class per service
- O: region rules via interfaces
- L: repository interfaces with replaceable implementations
- I: separate reader and writer ports
- D: domain does not depend on infrastructure

## Auth and RBAC

- Keycloak handles SSO, MFA, refresh tokens
- Spring Security validates JWTs
- Angular guards protect routes
- HTTP interceptors attach tokens

### Roles

- ADMIN: full access
- ORTHODONTIST: full clinical access
- ASSISTANT: patient updates, scheduling, uploads
- RECEPTIONIST: registration and appointments only
- PATIENT: future read-only portal

### Auth Flows

- Login
  - Angular -> Keycloak OIDC -> JWT tokens -> Spring Security -> role-based access
- Onboarding
  - Practice info
  - Region selection
  - Legislation profile
  - Admin account
  - Staff invitations
  - Subscription plan
- Staff invite
  - Signed invite link
  - Password setup
  - Keycloak user creation
  - Role assignment
  - Practice link

## Patient Dossier

- Administrative
  - Identity
  - DOB
  - Contact
  - Insurance
  - Referring dentist
  - Family links
- Medical history
  - General health
  - Allergies
  - Medications
  - Previous ortho treatment
  - Chief complaint
- Diagnostic
  - Skeletal class
  - Malocclusion
  - Transverse/sagittal/vertical issues
  - Facial analysis
  - Smile assessment
- Treatment plan
  - Goals
  - Appliance choice
  - Extraction plan
  - Stripping
  - Duration
  - Version history
- Appointments
  - Visit history
  - Appliance step
  - Elastic prescription
  - Clinical notes
  - Next instructions
- Imaging and docs
  - CBCT/STL metadata
  - Photos
  - Radiographs
  - Consent forms
  - Prescriptions
- Simulation
  - External simulation link
  - Metadata
  - Snapshot images
- Progress monitoring
  - Aligner step tracking
  - Compliance notes
  - Timeline

## Region Config

- One RegionConfig JSON drives:
  - visible fields
  - required insurance fields
  - locale formatting
  - consent templates
  - billing codes
  - legislation rules

### Region Profiles

- Morocco
  - CNOPS, CNAM, RAMED
  - Arabic + French
  - MAD
  - CIN field
- France
  - Carte Vitale
  - RPPS
  - RGPD
  - CCAM
  - EUR
- United States
  - NPI
  - HIPAA + BAA
  - Primary/secondary insurance
  - CDT codes
  - USD

### Example Config

```json
{
  "region": "MA",
  "locale": "fr-MA",
  "currency": "MAD",
  "practitioner": {
    "idField": "INPE",
    "label": "N° INPE"
  },
  "patient": {
    "insuranceSchemes": ["CNOPS","CNAM","RAMED","Privée"],
    "idField": "CIN",
    "consentTemplate": "consent-ma-v1"
  },
  "billing": {
    "codeSystem": "CNOPS_ACTS",
    "taxRate": 0
  },
  "legislation": {
    "dataRetentionYears": 10,
    "requireSignedConsent": true,
    "auditLogEnabled": true
  },
  "features": {
    "dentalMonitoringIntegration": false,
    "patientPortal": false
  }
}
```

## Security

- TLS 1.3
- HSTS
- Reverse proxy in front of backend
- Short-lived JWTs
- Refresh token rotation
- AES-256-GCM for sensitive fields
- PostgreSQL row-level isolation
- Audit logging for all PHI actions
- DTO validation
- OpenAPI schema validation
- CSP headers
- HttpOnly cookies fallback
- HIPAA and RGPD controls

## Sprint Roadmap

### Sprint 1

- Monorepo setup
- Keycloak + Spring Security
- JWT flow
- Angular shell
- Region config loader
- Login + onboarding steps 1 to 3
- PostgreSQL schema
- Flyway migrations
- Docker Compose dev setup

### Sprint 2

- Role model
- Staff invites
- Practice settings
- User management UI
- Route guards
- i18n bundles
- Auth unit tests

### Sprint 3

- Patient entity and API
- Search and list
- Dossier tabs
- Appointment CRUD
- Calendar view
- Document upload
- SOAP notes
- Audit logging

### Sprint 4

- Treatment plan CRUD
- Versioning
- Simulation metadata
- Progress timeline
- Region-specific toggles
- E2E tests
- Lighthouse audit
- Staging deploy
- Security checklist

## Post-MVP

- 3D aligner simulation viewer
- DentalMonitoring integration
- Patient portal
- Billing and invoicing
- CBCT DICOM viewer
- AI treatment suggestions
- Mobile native app
- Multi-cabinet SaaS
