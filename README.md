# LabExplain

**AI-assisted platform for preparing medical consultations**

LabExplain is an inclusive digital health application designed to help patients prepare for medical consultations by structuring their symptoms, medical history and current treatments before meeting a healthcare professional.

The platform uses artificial intelligence and natural language processing to transform patient-provided information into a structured summary and suggest relevant questions to discuss with a doctor.

**LabExplain does not provide medical diagnoses or replace healthcare professionals.**

---

## Key Results

* **15 participants** involved in usability testing
* **82.3/100 SUS usability score**
* **3 languages** supported in the prototype: French, English and Spanish
* **5/5 target accessibility profiles** successfully tested
* **6/6 GDPR criteria** validated in the prototype
* Prototype developed up to **TRL 6**

---

## Project Context

This project was developed at **EFREI Paris** as part of an engineering project focused on digital health, artificial intelligence and inclusive technology.

The objective was to address a common problem in healthcare: patients may struggle to clearly communicate important information during a consultation because of stress, language barriers, learning difficulties or difficulty structuring their symptoms.

LabExplain was designed to support:

* Non-native speakers
* Patients experiencing stress or anxiety
* People with dyslexia or ADHD
* Children
* Older adults
* Patients who have difficulty organising health information

---

## Main Features

### Patient Information

Patients can provide:

* Symptoms
* Medical history
* Current treatments
* Consultation-related information

The information is then structured before the medical appointment.

### AI-assisted Structuring

The AI module processes unstructured patient input and generates:

* Structured medical information
* A consultation summary
* Relevant questions to discuss with the doctor

The system is designed to assist communication only and does **not** generate a medical diagnosis.

### Multilingual Support

The prototype supports:

* French
* English
* Spanish

The architecture was designed to allow additional languages to be integrated later.

### Accessibility

Accessibility was integrated into the project from the design stage.

Features include:

* Dyslexia-friendly display options
* Simplified interfaces for users with ADHD
* High-contrast visual elements
* Child-friendly visual scales
* Simplified navigation

### Consultation Management

The application includes functionality for:

* Patient accounts
* Doctor accounts
* Consultations
* Appointments
* Prescriptions
* AI-generated summaries

---

## Architecture

LabExplain follows a full-stack architecture:

```text
LabExplain
│
├── frontend-web
│   └── React + TypeScript
│
├── frontend-mobile
│   └── React Native / Expo
│
├── backend
│   └── Python + Flask REST API
│
├── AI / NLP Module
│   └── Patient information analysis and structuring
│
└── database
    └── MySQL
```

---

## Backend

The backend is implemented using **Python and Flask**.

It exposes a REST API connecting the frontend, database and AI module.

Main API modules include:

```text
/api/auth
/api/users
/api/doctors
/api/consultations
/api/rendezvous
/api/ai
```

The backend architecture separates:

* Routes
* Services
* Models / database access
* AI processing
* Authentication
* Business logic
* Utility functions

### Backend Technologies

* Python
* Flask
* Flask-CORS
* MySQL
* bcrypt
* cryptography
* REST APIs
* Google GenAI
* ReportLab

---

## Web Frontend

The web interface is built using:

* React
* TypeScript
* Vite
* React Router
* Leaflet / React Leaflet

The application includes pages for:

* Home
* Login and registration
* Email confirmation
* Patient questionnaire
* Dashboard
* Results
* Appointments
* Settings
* About

Protected routes require the user to be authenticated.

---

## AI and NLP

The AI component is used to structure patient-provided health information.

The project compared multiple language models during the prototype phase using **40 representative use cases**.

The models considered included:

* Llama 3
* Meditron
* Gemma
* Mistral-family models
* Phi-4
* Qwen

The evaluation considered:

* Safety
* Factual accuracy
* Use-case coverage
* Execution speed

The AI is constrained to information structuring and reformulation and is not intended for diagnosis.

---

## My Contribution

**Role: Backend Developer**

My responsibilities included:

* Developing and maintaining the Flask REST API
* Implementing backend business logic
* Connecting the AI module with the application
* Developing API routes and services
* Managing communication between the frontend, backend and database
* Contributing to technical feasibility studies and prototype development

---

## Usability Evaluation

The prototype was evaluated with **15 participants** representing five different user profiles:

* 3 students aged 18–25
* 3 seniors aged 65+
* 3 non-French-speaking users
* 3 parents with children aged 6–12
* 3 participants with dyslexia or ADHD

Each test session lasted approximately **30 minutes**.

The evaluation used the **System Usability Scale (SUS)**.

### Results

| Metric                 |   Target |       Result |
| ---------------------- | -------: | -----------: |
| SUS Score              | > 70/100 | **82.3/100** |
| Languages supported    |        3 |      **3/3** |
| GDPR criteria          |        6 |      **6/6** |
| Accessibility profiles |        5 |      **5/5** |

The SUS score of **82.3/100** indicates excellent usability according to the evaluation criteria used in the project.

---

## Data Protection

Because LabExplain handles potentially sensitive health-related information, privacy was considered from the beginning of the project.

The prototype includes principles such as:

* Explicit user consent
* Data minimisation
* User access and deletion rights
* Controlled data sharing
* Use of fictional medical information during testing
* GDPR-oriented design

No real patient medical dataset was required for prototype testing.

---

## Installation

### Backend

Clone the repository and navigate to the backend folder:

```bash
cd backend
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure the required environment variables in a `.env` file.

Then run:

```bash
python app.py
```

The Flask API will start locally.

---

## Frontend

Navigate to the web frontend:

```bash
cd frontend-web
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

---

## Project Structure

```text
LabExplain/
├── backend/
│   ├── ai/
│   ├── database/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── app.py
│   └── requirements.txt
│
├── frontend-web/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.tsx
│   └── package.json
│
└── frontend-mobile/
```

---

## Limitations

The current version is a student prototype and has several limitations:

* User testing was limited to **15 participants**
* Only three languages were implemented in the prototype
* Integration with external healthcare platforms is not yet available
* The system still relies on external AI services
* The application has not been clinically validated
* The prototype is not a certified medical device

---

## Future Work

Planned improvements include:

* Increasing NLP accuracy
* Supporting additional languages
* Expanding user testing to a larger population
* Migrating toward open-source AI models hosted in Europe
* Developing deeper integration with healthcare platforms
* Improving professional healthcare dashboards
* Strengthening privacy and deployment infrastructure
* Extending the mobile application

---

## Technologies

**Python · Flask · REST API · MySQL · React · TypeScript · React Native · NLP · AI · GitHub · Postman**

---

## Team

* Inès Mehadhebi
* Maël Le Bris
* Maxime Cerruti
* Kiroshan Sivakumar
* Camille Tura Durand
* Bastien Franja

---

## Disclaimer

LabExplain is a student research and engineering prototype.

It is designed to help users prepare medical consultations and organise information.

**It does not provide medical advice, diagnosis or treatment recommendations.**
