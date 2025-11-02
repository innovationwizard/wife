# Mid-Level Strategy & Operating System
> Last Updated: 2025-11-01
> This is a living document tracking strategic assets, operational context, and project inventory.

---

## 1. Idea Backlog (Distraction Inventory)

This inventory triages all active and "moonshot" project ideas against the primary goals from the "Strategic Review - Nov 2025." The status (Green/Yellow/Red) dictates priority.

| Project | Category | Status | Analysis (Based on *Strategic Review*) |
| :--- | :--- | :--- | :--- |
| **Cotizator** | Quick Win / Portfolio | **Greenlight** | A 1-week, non-monetizable "gift" project. Allowed as a small cost. |
| **Context Docs** | Quick Win / Resource | **Greenlight** | The 2-hour writing task you are currently executing. |
| **Tragaldabas** | Monetizable Contract | **Greenlight** | Monetizable work for a specific client (Marco). Not urgent; scheduled for January. |
| **Candidatos** | Monetizable Product | **Yellow Light** | A monetizable upgrade. Deferred until *after* IngePro is stable and Cotizator/Tragaldabas are delivered. |
| **Solveur** | Moonshot / R&D | **Red Light** | An R&D project from your website. This is a "moonshot" and a distraction. |
| **GIGR** | Internal Tool | **Red Light** | This is a "trap" to avoid sales. **Banned** for the rest of the year. |
| **Legislazuli** | Moonshot / R&D | **Red Light** | A 1-2 year "AI Lawyer" project. A distraction. **Banned** for the rest of the year. |
| **aieou** | Moonshot / R&D | **Red Light** | A 3-5 year "GPU-aware OS" project. A distraction. **Banned** for the rest of the year. |
| **meetmee** | Moonshot / R&D | **Red Light** | A complex software (UWB/BLE) positioning problem. A distraction. **Banned** for the rest of the year. |
| **Voynich Manuscript Decoder** | Moonshot / R&D | **Red Light** | A classic, lifelong R&D problem. This is a distraction. |

---

## 2. Strategic Contexts

This section serves as a strategic reference for capabilities, assets, and operational protocols.

### 2.1. Personal Context ("Who Am I?")

*(Placeholder: Write your 1-paragraph mission statement here. It should define your "Trusted Authority" vision and your "AI for Income" goal.)*

### 2.2. Studies Context (Current Status)

This inventories formal credentials and active learning, directly supporting "Job 2: The Authority Engine."

* **Completed: Professional Certificate in Computer Science for Artificial Intelligence**
    * **Provider:** HarvardX
    * **Issued:** September 2025
    * **Component Courses:**
        * CS50x: Introduction to Computer Science
        * CS50's Introduction to Artificial Intelligence with Python

* **In Progress: Professional Certificate in Computer Science for Data Science**
    * **Provider:** HarvardX
    * **Analysis:** Identified as "low-hanging fruit" as it shares the completed CS50x course.
    * **Status:** 1 course completed, 1 in progress.
    * **Active Course:** CS50's Introduction to Programming with R (CS50R).
    * **Current Progress:** "Lecture" module within the "Representing Data" section.

### 2.3. Workflow Context (GitHub Green: The Central Proof-of-Work)

*(Note: Both drafts are included as requested for later editing.)*

#### Draft 1 (AI-Generated Protocol)

This protocol is the tactical implementation of the strategic mandate: **"If it's not on GitHub, it didn't happen."** Its purpose is to eliminate the workflow gap between local work and public proof-of-work.

* **Core Principle:** Treat Everything as a Repository.
* **The Action Plan:**
    1.  **Initialize Immediately:** Before any other work, create the GitHub repository.
    2.  **Commit All Artifacts, Not Just Code:** Your contribution graph tracks *commits*. Planning documents, architecture notes (`README.md`), and slides are valuable work products.
    3.  **Adopt High-Frequency, Atomic Commits:** Do not wait for a feature to be "finished."
    4.  **Mandatory End-of-Day (EOD) Push:** A non-negotiable daily ritual.
        ```bash
        git add .
        git commit -m "EOD: [Brief description of progress]"
        git push
        ```
* **The Mantras (Direct & Pragmatic):**
    * If it's not on GitHub, it doesn't exist.
    * The work isn't done until it's pushed.
    * Commit is the new save.
* **Prerequisite (Confirmed 2025-11-01):**
    * Your global Git config is now correctly set to `user.name "Jorge Luis Contreras Herrera"` and your verified email. All commits are now correctly attributed to your professional identity.

#### Draft 2 (User-Provided Text)

This is the operational protocol to ensure all work contributes to the "Authority Engine." It addresses the critical gap of translating substantial project work into visible, version-controlled artifacts.

* **Core Strategy:** Treat everything as a repository from day one.
* **Core Habit:** A non-negotiable End-of-Day (EOD) push of all progress.
* **Operating Principles (The "Direct & Pragmatic" Mantras):**
    * If it's not on GitHub, it doesn't exist.
    * The work isn't done until it's pushed.
    * Commit is the new save.
* **Action Plan:**
    1.  **Initialize Repos Immediately:** Every new project, code or content, starts with a GitHub repository.
    2.  **Commit Non-Code Artifacts:** Planning documents, research notes, outlines (`.md` files), and presentation drafts are valuable commits. They are proof of work.
    3.  **High-Frequency, Atomic Commits:** Do not wait for a feature to be "finished." A single function, a configuration change, or updating a README are all valid, individual commits.
    4.  **Mandatory EOD Push:** Before finishing work daily, run `git add .`, `git commit -m "EOD progress on [task]"`, and `git push` for every active project.

### 2.4. Portfolio Context (Project Inventory)

A comprehensive inventory of project assets, detailing the problem, solution, tech stack, and strategic fit.

---
#### **AI Refill (Status: PROD)**
* **Description:** An enterprise-grade, AI-powered inventory optimization system built to solve costly inefficiencies from manual reordering and inaccurate forecasting. It provides automated demand forecasting (Facebook Prophet), calculates optimal reorder points (ROP), and delivers actionable insights via 7 role-specific BI dashboards. The system was engineered to be replicated for any retail or distribution company, replacing legacy architectures with a modern, unified API and a central ML pipeline.
* **Tech Stack:** Node.js/Fastify API (TypeScript, Prisma), Next.js 14 frontend (Shadcn/UI, Recharts), and a Dagster-orchestrated ML pipeline using AWS SageMaker and Aurora PostgreSQL. Infrastructure is managed via AWS CDK.
* **Strategic Fit:** A production-ready, highly scalable B2B SaaS product. It is a core asset for the "Income Engine" and a flagship project for the "Authority Engine," proving expertise in predictive AI and scalable cloud-native architecture.

---
#### **IngePro (Status: POC)**
* **Description:** AI-Powered Construction Management Platform for real-time project tracking, workforce optimization, and inventory control. It integrates AI analytics for predictive timelines, risk assessment, and material efficiency optimization, designed to deliver a 400% ROI to construction businesses.
* **Tech Stack:** Next.js 14 + TypeScript, PostgreSQL with Redis caching, Real-time GPS, Photo verification, OpenAI GPT-3.5-turbo for analytics, RBAC, and AWS managed infrastructure.
* **Strategic Fit:** Demonstrates mastery of building a complete B2B SaaS with complex business logic, multi-tenant systems, and meaningful AI integration for a high-value market (Income Engine).

---
#### **Carl (Status: PROD)**
* **Description:** Enterprise-grade RAG Chatbot that emulates Carl Sagan's persona to make complex scientific concepts accessible. It features a custom Retrieval-Augmented Generation (RAG) architecture, advanced semantic search, and high personality consistency.
* **Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn/UI, OpenAI GPT-4o, `text-embedding-3-small`, Pinecone vector DB, and Supabase.
* **Strategic Fit:** Demonstrates mastery of the complete AI development stack from concept to production, proving expertise in RAG, prompt engineering, and scalable infrastructure (Authority Engine).

---
#### **Candidatos (Status: V1 / Upgrade Pending)**
* **Description:** A political prediction engine designed to forecast election winners for Mayors and Congressmen at the municipal level in Guatemala. The existing machine works, but is scheduled for a V2 upgrade to incorporate new learnings and enhance its predictive accuracy.
* **Tech Stack:** (Placeholder)
* **Strategic Fit:** A monetizable product ("Income Engine") to be leveraged through a specific client (Alvaro) *after* core income projects are stable (Yellow Light).

---
#### **Cotizator (Status: DEV)**
* **Description:** A rapid-development estimation tool to replace a complex, cryptic Excel file for a solar panel business. The machine will provide the exact price of a project, enabling the sales team to generate quotes quickly and accurately.
* **Tech Stack:** (Placeholder - likely a simple web app)
* **Strategic Fit:** A "quick win" portfolio piece to be completed in one week. It is not monetizable in its first instance (Greenlight).

---
#### **Tragaldabas (Status: DEV)**
* **Description:** A "Universal Ingestor" AI tool designed to solve a specific corporate presentation bottleneck. The system will allow a user (Marco) to "drop" complex Excel files (e.g., company numbers) and receive a finished, polished PowerPoint presentation in under a minute, saving days of manual work.
* **Tech Stack:** (Placeholder - likely involves LLM data analysis and presentation generation)
* **Strategic Fit:** A monetizable contract project ("Income Engine") scheduled for delivery in January (Greenlight).

---
#### **Solveur (Status: R&D / BANNED)**
* **Description:** An AI-powered business problem-solving agent for automated customer interaction. It uses advanced RAG technology to learn from enterprise knowledge bases and respond like an expert employee.
* **Tech Stack:** RAG, Pinecone vector database, Next.js architecture.
* **Strategic Fit:** This is an R&D "moonshot" project. It is "Red Light" and a distraction from your core 2025 goals.

---
#### **GIGR (Status: R&D / BANNED)**
* **Description:** An autonomous AI sales agent. The concept is to build an agent that handles sales activities (which you find boring) on your behalf.
* **Tech Stack:** (Placeholder)
* **Strategic Fit:** This is an internal tool. Your *Strategic Review* identifies this as a "trap" to avoid sales activity. It is "Red Light" and **banned** for the rest of the year.

---
#### **Legislazuli (Status: R&D / BANNED)**
* **Description:** An "AI Lawyer" concept intended to be the first successful project of its kind in Guatemala. The project involves enormous amounts of work to process and reason over legal data.
* **Tech Stack:** (Placeholder - would involve large-scale RAG and legal data processing)
* **Strategic Fit:** This is a 1-2 year "moonshot" project. Your *Strategic Review* identifies this as a "Red Light" distraction and is **banned** for the rest of the year.

---
#### **aieou (Status: R&D / BANNED)**
* **Description:** A highly ambitious R&D project to code a GPU-aware operating system (OS) specialized for AI workloads. The primary motivation is the learning experience, with no clear monetization plan.
* **Tech Stack:** (Placeholder - OS development)
* **Strategic Fit:** This is a 3-5 year "moonshot." Your *Strategic Review* identifies this as a "Red Light" distraction and is **banned** for the rest of the year.

---
#### **meetmee (Status: R&D / BANNED)**
* **Description:** A short-range, high-precision personal locator app for iPhone (software-only). The concept is to provide a "P.K.E. meter" style interface showing distance (meters) and direction to another user in a large, complex venue, solving the "we are at the same pin but can't find each other" problem.
* **Tech Stack:** (Hypothesized: Apple's **Ultra Wideband (UWB)** chip for "Precision Finding" and **Bluetooth Low Energy (BLE)** for peer-to-peer communication.)
* **Strategic Fit:** This is a "moonshot" R&D project. Per your *Strategic Review*, this is a "Red Light" distraction and is **banned** for the rest of the year.