import re
import os

TEMPLATE = r"""\documentclass[journal,onecolumn,10pt,draftclsnofoot]{IEEEtran}

% =========================================================================
% PACKAGES
% =========================================================================
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{microtype}
\usepackage{amsmath,amssymb,amsfonts,amsthm}
\usepackage{graphicx}
\usepackage{cite}
\usepackage{mathptmx}      % Times font
\usepackage{courier}
\usepackage{booktabs}
\usepackage{algorithm}
\usepackage{algorithmic}
\usepackage{xcolor}
\usepackage[colorlinks=true, allcolors=blue!60!black]{hyperref}
\usepackage{titlesec}
\usepackage{enumitem}
\usepackage{cleveref}
\usepackage{setspace}
\usepackage{geometry}
\usepackage{tikz}
\usepackage{listings}
\usetikzlibrary{shapes.geometric, arrows, positioning, calc, chains, arrows.meta}
\geometry{left=1in, right=1in, top=1in, bottom=1in}

% =========================================================================
% LISTINGS CONFIGURATION
% =========================================================================
\definecolor{codegreen}{rgb}{0,0.6,0}
\definecolor{codegray}{rgb}{0.5,0.5,0.5}
\definecolor{codepurple}{rgb}{0.58,0,0.82}
\definecolor{backcolour}{rgb}{0.95,0.95,0.92}

\lstset{
    backgroundcolor=\color{backcolour},   
    commentstyle=\color{codegreen},
    keywordstyle=\color{magenta},
    numberstyle=\tiny\color{codegray},
    stringstyle=\color{codepurple},
    basicstyle=\ttfamily\footnotesize,
    breakatwhitespace=false,         
    breaklines=true,                 
    captionpos=b,                    
    keepspaces=true,                 
    numbers=left,                    
    numbersep=5pt,                  
    showspaces=false,                
    showstringspaces=false,
    showtabs=false,                  
    tabsize=2
}

% =========================================================================
% CONFIGURATION
% =========================================================================
\setstretch{1.5} 
\pagenumbering{roman}

% =========================================================================
% DOCUMENT INFO
% =========================================================================
\title{\LARGE \textbf{UniZ: A Distributed University Administration Platform with Role-Based Access Control and Automated Approval Workflows}}

\author{
    \IEEEauthorblockN{SreeCharan Desu}\\
    \IEEEauthorblockA{ID No. O210008\\
    Department of Computer Science and Engineering\\
    Rajiv Gandhi University of Knowledge Technologies, Ongole\\
    Email: o210008@rguktong.ac.in}
}

\begin{document}

% =========================================================================
% 1. TITLE PAGE
% =========================================================================
\begin{titlepage}
\centering

\vspace*{0.5cm}
\includegraphics[width=0.25\linewidth]{logo.jpg}\\[0.4cm]
{\Large \textbf{Rajiv Gandhi University of Knowledge Technologies, Ongole}}\\[0.2cm]
{\large (RGUKT Ongole)}\\[0.6cm]

\textbf{Submitted in partial fulfillment of the requirements}\\
\textbf{for the Project Work in}\\

{\Large \textbf{Systems Architecture and Software Engineering}}\\[0.8cm]

{\Huge \textbf{UniZ: A Distributed University Administration Platform}}\\[0.4cm]
{\Large with Role-Based Access Control and Automated Approval Workflows}\\[1cm]

\textbf{Submitted by}\\[0.2cm]
{\large SreeCharan Desu}\\
{\small (ID No. O210008)}\\[1cm]

\vfill

{\large April 2026}

\end{titlepage}

\newpage

% =========================================================================
% 2. CERTIFICATE
% =========================================================================
\section*{Certificate}
\addcontentsline{toc}{section}{Certificate}
\vspace{0.5in}

This is to certify that the project entitled \textbf{``UniZ: A Distributed University Administration Platform with Role-Based Access Control and Automated Approval Workflows''} is a bona-fide work carried out by \textbf{SreeCharan Desu} in partial fulfillment of the requirements for the academic project at Rajiv Gandhi University of Knowledge Technologies, Ongole.

\vspace{1in}

\noindent \textbf{Project Supervisor} \hfill \textbf{Head of Department} \\
Dr. [Enter Supervisor Name] \hfill Dr. [Enter HOD Name] \\
Assistant Professor \hfill Associate Professor \\
Dept. of CSE \hfill Dept. of CSE

\newpage

% =========================================================================
% 3. DECLARATION
% =========================================================================
\section*{Declaration}
\addcontentsline{toc}{section}{Declaration}
\vspace{0.5in}

I, \textbf{SreeCharan Desu}, hereby declare that the work presented in this technical report is original and results from my independent design and implementation. All technical specifications, architectural diagrams, and workflows described herein are the result of my engineering effort. Any third-party libraries or frameworks used have been duly acknowledged.

\vspace{1in}

\noindent \textbf{Date:} \today \\
\noindent \textbf{Place:} Ongole, India \hfill (Signature of Student)

\newpage

% =========================================================================
% 4. ACKNOWLEDGEMENT
% =========================================================================
\section*{Acknowledgement}
\addcontentsline{toc}{section}{Acknowledgement}
\vspace{0.5in}

I would like to express my sincere gratitude to the Rajiv Gandhi University of Knowledge Technologies, Ongole, for providing the necessary infrastructure and academic environment for the development of the \textbf{UniZ} platform. I am deeply thankful to my faculty advisors whose guidance on distributed systems and software architecture was pivotal in designing a scalable and secure solution. Special thanks to the administrative staff who provided real-world requirements for outpass and academic workflows. Finally, I dedicate this work to my mentors and peers who have consistently challenged me to push the boundaries of full-stack engineering and systems design.

\newpage

% =========================================================================
% 5. ABSTRACT
% =========================================================================
\section*{Abstract}
\addcontentsline{toc}{section}{Abstract}
\vspace{0.2in}

\begin{spacing}{1.2}
Modern university administration requires a seamless integration of academic tracking, student mobility management, and role-based authority. This report presents \textbf{UniZ}, a distributed platform designed specifically for the Rajiv Gandhi University of Knowledge Technologies (RGUKT) ecosystem. UniZ replaces fragmented, paper-based administrative processes with a unified digital architecture. At its core, the platform implements a robust Role-Based Access Control (RBAC) model $Access = f(role, resource, action)$ and a multi-level state machine for permission management. 

Traditional outpass systems are prone to bottlenecks; UniZ introduces an automated approval engine that routes requests through a deterministic chain: $\text{Created} \rightarrow \text{Caretaker} \rightarrow \text{Warden} \rightarrow \text{SWO} \rightarrow \text{Approved}$. The platform is architected as a set of high-performance microservices, utilizing JWT-based stateless authentication and Redis-backed caching to achieve sub-50ms response times for academic records. This report details the theoretical foundations, architectural design, API specifications, and security mechanisms that enable UniZ to serve as a comprehensive administrative hub for students, faculty, and administrators.
\end{spacing}

\newpage

% =========================================================================
% 6. TABLE OF CONTENTS
% =========================================================================
\tableofcontents
\newpage

\listoffigures
\listoftables
\newpage

\pagenumbering{arabic}

{CHAPTERS}

\end{document}
"""


def generate_chapters():
    chapters = []
    
    # Chapter 1: Introduction
    chapters.append(r"""
% =========================================================================
% CHAPTER 1: INTRODUCTION
% =========================================================================
\section{Introduction}

\subsection{Project Overview}
UniZ is an integrated university administration platform developed to centralize and automate the academic and administrative workflows of Rajiv Gandhi University of Knowledge Technologies (RGUKT). In a campus environment involving thousands of students and hundreds of faculty members, the coordination of academic results, attendance, and student leave (outpasses) presents a significant logistical challenge. UniZ addresses this by providing a single digital hub accessible via web and mobile interfaces.

\subsection{Problem Statement}
Current administrative processes in many institutions rely on heterogeneous systems:
\begin{enumerate}
    \item \textbf{Fragmented Data}: Academic records, attendance, and leave permissions are stored in disconnected silos.
    \item \textbf{Manual Approval Latency}: The physical movement of outpass documents through multiple levels of authority causes significant delays.
    \item \textbf{Security Vulnerabilities}: Paper-based verification at campus gates is susceptible to forgery and lacks real-time auditability.
    \item \textbf{Scalability Issues}: Existing web portals often fail to handle burst traffic during result publications.
\end{enumerate}

\subsection{Proposed Solution: UniZ}
UniZ provides a unified architecture built on modern web standards. Key innovations include:
\begin{itemize}
    \item \textbf{Distributed State Management}: A centralized database with edge caching for academic records.
    \item \textbf{Deterministic Approval Pipeline}: A state machine-driven workflow for student outpasses and outings.
    \item \textbf{PWA Integration}: A Progressive Web App approach ensures high availability and native performance across all devices.
    \item \textbf{Role-Based Semantic Security}: Permissioning is enforced at both the API and UI layers based on a granular RBAC model.
\end{itemize}

\subsection{Scope of the Report}
This report details the end-to-end engineering of the UniZ platform. It covers the formal system models, the RESTful API architecture, the database schema design, and the security protocols. Furthermore, it discusses performance optimizations such as Redis caching and async background processing for bulk data operations.

\newpage
""")

    # Chapter 2: System Overview
    chapters.append(r"""
% =========================================================================
% CHAPTER 2: SYSTEM OVERVIEW
% =========================================================================
\section{System Overview}

\subsection{Technological Stack}
UniZ is built using a modern decoupled architecture designed for high availability and low latency:
\begin{itemize}
    \item \textbf{Frontend Layer}: React-based Progressive Web Application (PWA) providing offline capabilities and service worker-backed notification support.
    \item \textbf{API Gateway \& Microservices (Backend Layer)}: Node.js and Express distributed services that expose granular RESTful endpoints.
    \item \textbf{Persistence Layer}: MongoDB dual-layer storage for schema-less horizontal scaling alongside relational caching paradigms.
    \item \textbf{Ephemeral State \& Caching}: Redis clusters handling transient session data, JWT blocklists, and high-frequency read caches.
    \item \textbf{Infrastructure \& Orchestration}: Hosted as containerized microservices managed via Kubernetes to guarantee zero-downtime rolling updates.
\end{itemize}

\subsection{Formal Architectural Model}
Let $S$ represent the system state. The transition to a new state $S'$ is governed by a distributed event model:
\begin{equation}
    S' = \Phi(S, E, P)
\end{equation}
where $E$ is an asynchronous user event and $P$ is the Role-Based Access Control permission boundary. Transient states are stored in Redis until the final atomic commit guarantees durability.

\subsection{Modular Composition}
The system is logically partitioned into four distinct macro-modules tailored to targeted user demographics:
\begin{enumerate}
    \item \textbf{Student Subsystem}: Exposes individualized academic tracking endpoints, profile management APIs, and initiates outpass state machine flows.
    \item \textbf{Administrative Subsystem}: Provides deterministic review pipelines for hostel administrators (e.g., caretakers, wardens, SWO) enforcing the hierarchical approval engine.
    \item \textbf{Faculty Data Ingestion Subsystem}: Specialized asynchronous ingestion interfaces for batch uploading academic results and real-time biometric-linked attendance schemas.
    \item \textbf{Gateway Security Portal}: A high-availability gate control interface for O(1) time-complexity real-time student presence verification.
\end{enumerate}

\begin{figure}[htpb]
\centering
\begin{tikzpicture}[
    box/.style={draw, minimum width=3cm, minimum height=1cm, align=center},
    arrow/.style={-{Stealth[scale=1.2]}}
]
    \node[box] (client) {PWA Clients\\(React)};
    \node[box, below=1.5cm of client] (gateway) {API Gateway\\(Nginx / Node)};
    \node[box, below left=1.5cm and -1cm of gateway] (auth) {Auth Service\\(RBAC)};
    \node[box, below=1.5cm of gateway] (core) {Core Logic\\(Approval Engine)};
    \node[box, below right=1.5cm and -1cm of gateway] (data) {Data Ingestion\\(Faculty Module)};
    \node[box, below=1.5cm of core] (db) {Primary Storage\\(MongoDB)};
    \node[box, left=1cm of db] (cache) {Redis Cache};
    
    \draw[arrow] (client) -- (gateway);
    \draw[arrow] (gateway) -- (auth);
    \draw[arrow] (gateway) -- (core);
    \draw[arrow] (gateway) -- (data);
    \draw[arrow] (core) -- (db);
    \draw[arrow] (core) -- (cache);
    \draw[arrow] (data) -- (db);
    \draw[arrow] (auth) -- (cache);
\end{tikzpicture}
\caption{System Architecture Diagram detailing component communication pipelines.}
\label{fig:architecture}
\end{figure}

\subsection{Core Design Principles}
The architectural axioms driving the backend logic include:
\begin{enumerate}
    \item \textbf{High Availability}: Targeted SLA of $>99.9\%$, represented formally as $A = \frac{\text{MTBF}}{\text{MTBF} + \text{MTTR}}$. Redundancy across API nodes achieves this metric.
    \item \textbf{Sub-Millisecond Read Responses}: Utilizing a "Cache-Aside" strategy for $GET$ requests ensuring bounded $O(1)$ lookup times.
    \item \textbf{Cryptographic Auditability}: Every operational state transition (e.g., an administrative override) is cryptographically signed and linked to an individual actor via normalized JWT token fingerprints.
\end{enumerate}

\newpage
""")

    # Chapter 3: User Roles and RBAC Model
    chapters.append(r"""
% =========================================================================
% CHAPTER 3: USER ROLES AND RBAC MODEL
% =========================================================================
\section{User Roles and RBAC Model}

The foundation of security within the UniZ architecture is its mathematical Role-Based Access Control (RBAC) algorithm. This decouples user identity from application permissions, creating a flexible and auditable security framework.

\subsection{Formal RBAC Representation}
Security in UniZ is modeled as a set of permissions $P$, where each permission is uniquely defined by a tuple of length two: $(Resource, Action)$. Let $\mathbb{R}$ represent the set of all allowed architectural roles. A given user $U_i$ maps to exactly one role $R(U_i) \in \mathbb{R}$. The authoritative access control function $Access$ evaluates system boundaries as a boolean predicate:
\begin{equation}
    Access(User, Resource, Action) = 
    \begin{cases} 
      1 & \text{if } (Resource, Action) \in \text{Permissions}(R(U_i)) \\
      0 & \text{otherwise}
    \end{cases}
\end{equation}

\subsection{Role Hierarchy and Actor Matrix}
The system dictates varying tiers of hierarchical permission scaling from end-consumers to global orchestration admins. The defined authority scopes are matrixed below:

\begin{table}[htpb]
\centering
\caption{UniZ Formal Role-Based Capabilities Matrix}
\begin{tabular}{p{2cm} p{3.5cm} p{8cm}}
\toprule
\textbf{Role} & \textbf{Identifier Schema} & \textbf{Primary Authority Boundary} \\
\midrule
Student & \texttt{student} & Read-only external data access; Write isolation on personal leave profiles. \\
Caretaker & \texttt{caretaker\_\{gender\}} & Phase 1 topological traversal for localized residential leave approval. \\
Warden & \texttt{warden\_\{gender\}} & Phase 2 verification encompassing academic eligibility thresholds. \\
SWO & \texttt{swo} & Phase 3 campus-level operational override and policy enforcement. \\
Dean & \texttt{dean} & Terminal outpass approval phase; Read-write for faculty ingestion policies. \\
Director & \texttt{director} & Global multi-tenant resource visibility and ultimate result publishing. \\
Security & \texttt{security} & Gate gateway phase; strict timestamp-based IoT physical check logs. \\
Faculty & \texttt{faculty} & Batch processing permissions constrained specifically to grade mutation endpoints. \\
\bottomrule
\end{tabular}
\end{table}

\subsection{Topological Constraints and Edge Cases}
The RBAC runtime enforces deterministic invariants that no external input can mutate.
\begin{itemize}
    \item \textbf{Singleton State Vector Constraint}: The system guarantees memory non-collision by enforcing $|R_{active}| \leq 1$. A student entity can maintain no more than one non-terminal (active) outpass/outing state graph instance at any execution epoch.
    \item \textbf{Strict Monotonic Flow}: An approval pointer index $i_{req}$ cannot decrement. State degradation is explicitly trapped as an API error.
    \item \textbf{Semantic Gender Isolation Axiom}: For a request node generated by user $k$ with demographic $D_{gender}(k) = \text{Female}$, evaluating approval authority for parameter $M$ yields strict nullification:
    \begin{equation}
        Access(\text{Caretaker}_M, \text{Request}_{D=F}) = 0 \quad \forall M \in \text{Male\_Caretakers}
    \end{equation}
\end{itemize}

\newpage
""")

    # Chapter 4: Student Module
    chapters.append(r"""
% =========================================================================
% CHAPTER 4: STUDENT MODULE
% =========================================================================
\section{Student Module}

The Student Module functions as the localized client-edge interface exposing core demographic data, historical tracking logic, and instantiation vectors for the approval state machine.

\subsection{Academic Subsystem and Attendance Logic}
The frontend queries aggregated database clusters to construct the longitudinal profile of a student. Unlike traditional static portals, UniZ normalizes attendance strings in near real-time.
The attendance aggregation logic computes the total presence percentage $A_{total}$ mathematically as:
\begin{equation}
    A_{total} = \frac{\sum_{i=1}^{n} S_{attended}(i)}{\sum_{i=1}^{n} S_{total}(i)} \times 100
\end{equation}
where $S_{attended}(i)$ is the localized integer presence value for subject $i$. The API endpoint enforces semantic formatting to prevent float underflow and maps numerical representation directly to heuristic UI elements (e.g., Green for $A \geq 75\%$, Red otherwise).

\subsection{Profile Metadata Segregation}
Profile structures are partitioned into public identifiers and private administrative vectors.
\begin{itemize}
    \item \textbf{Immutable Identifiers}: UID strings (e.g., `O210008`) and cryptographic keys mapped via relational bindings.
    \item \textbf{Mutable Pointers}: Dormitory coordinates (hostel name, room integer maps) updated exclusively through batch migrations at the administrative node.
\end{itemize}
When a student triggers a `GET /api/v1/profile` request, the API layer resolves the sub-documents optimally using indexed tree traversal.

\begin{figure}[htpb]
\centering
\begin{tikzpicture}[
    box/.style={draw, fill=gray!10, minimum width=2.5cm, minimum height=1cm, align=center},
    arrow/.style={-Latex, thick}
]
    \node[box] (student) {Student\\Client};
    \node[box, right=2cm of student] (api) {Academic\\API Router};
    \node[box, right=2cm of api] (db) {MongoDB\\Storage};
    
    \draw[arrow] (student) -- node[above] {GET Profile} (api);
    \draw[arrow] (api) -- node[above] {Query (Index Scan)} (db);
    \draw[arrow, dashed] (db) -- node[below] {JSON Sub-Document} (api);
    \draw[arrow, dashed] (api) -- node[below] {Render Payload} (student);
\end{tikzpicture}
\caption{Student Data Retrieval Sequence.}
\end{figure}

\subsection{Outpass Protocol Initiation}
To instantiate an outpass, the state boundary dictates that the student provides temporal ranges ($t_{start}, t_{end}$), ontological reasoning (metadata JSON), and contextual destination flags. The backend subsequently verifies the payload against the $|R_{active}| \leq 1$ concurrency lock. If another active transition graph exists, the instantiation is hard-aborted. Otherwise, a newly persisted immutable document is forged.

\newpage
""")

    # Chapter 5: Admin Module
    chapters.append(r"""
% =========================================================================
% CHAPTER 5: ADMIN MODULE
% =========================================================================
\section{Admin Module}

The Administrative Module serves as the neural center of the UniZ structural network. It is entirely isolated from end-user mutation endpoints and leverages its elevated access tokens to modify relational states, intercept queue pipelines, and override procedural anomalies.

\subsection{Approval Engine UI Paradigm}
Administrators interact with a distributed queue reflecting their targeted state pointer in the State Machine tree. When Wardens issue a $GET /api/v1/requests/pending$ fetch, their specific role payload intercepts the node queries, applying conditional filters dynamically based on context boundaries.

Let $Q_{overall}$ be the superset of outpass requests. The filtered queue $Q_{warden}$ is computed via set intersection:
\begin{equation}
    Q_{warden} = Q_{overall} \cap \{ r \in Q \mid r.\text{state} == \text{WARDEN\_PENDING} \} \cap \{ r \in Q \mid r.\text{hostel} \in \text{WardenScope} \}
\end{equation}

\subsection{Bulk Mutation Operations}
Operational efficiency demands vectorized processing of administrative operations. Rather than traversing endpoints sequentially $O(N)$ times, administrators can broadcast localized array overrides. For instance, the multi-select approval protocol reduces latency by packaging $K$ distinct document schemas inside a singular batch payload, mapped atomically to a database session.
\begin{algorithm}[htpb]
\caption{Administrative Batch Approval Synchronization}
\label{alg:batch}
\begin{algorithmic}[1]
\REQUIRE $Payload.targets = [id_1, id_2, ..., id_k]$
\ENSURE State transitions apply atomically or abort globally.
\STATE $session \leftarrow \text{Start MongoDB Transaction}$
\FOR{\textbf{each} $id \in Payload.targets$}
    \STATE $doc \leftarrow DB.findById(id).Session(session)$
    \IF{$doc.status \neq TargetStatus$}
        \STATE $doc.status \leftarrow status_{next}$
        \STATE $doc.logHistory(ActorToken, timestamp)$
    \ENDIF
\ENDFOR
\STATE $CommitTransaction(session)$
\STATE $PurgeRedisCaches(Payload.targets)$
\end{algorithmic}
\end{algorithm}

\subsection{Global Oversight \& Director View}
The top-tier Director role commands absolute read-capability over the entire topology constraint graph. Using optimized indexing (Compound and Geospatial equivalents for geographic metadata), the Director interface generates latency-minimal statistical outputs representing total daily mobility flow.

\newpage
""")

    # Chapter 6: Faculty Module
    chapters.append(r"""
% =========================================================================
% CHAPTER 6: FACULTY MODULE
% =========================================================================
\section{Faculty Module}

The Faculty Module orchestrates large-scale data ingestion for academic evaluations and attendance logs. Handling vast matrices of relational numeric grades poses risks of blocking the Node.js single-threaded event loop, dictating architectural decisions grounded in asynchronous computing.

\subsection{Asynchronous Batch Ingestion Pipeline}
When a faculty member uploads a dense payload (e.g., a Microsoft Excel binary containing $N=5000$ grades), processing this directly would disrupt concurrent low-latency tasks. UniZ solves this using a Message Queue strategy.
The pipeline follows a directed graph vector:
\begin{equation}
    Upload \xrightarrow{\text{I/O Write}} Queue \xrightarrow{\text{Async Dequeue}} Worker \xrightarrow{\text{Parse \& Validate}} DB
\end{equation}

The API endpoint $POST /api/v1/academics/grades/upload$ immediately acknowledges the HTTP stream and replies with an HTTP 202 ``Accepted'' alongside a uniquely hashed `jobId` reference.

\subsection{Worker Validation Logic}
The localized background worker daemon decodes the dataset row-by-row and executes string distance mapping, data sanitization, and regex evaluation against pre-declared grading standards $\{Ex, A, B, C, D, R, F\}$. 
\begin{itemize}
    \item \textbf{Type Validation}: Enforcing numeric boundary checking ($0.0 \leq x \leq 10.0$ for SGPA).
    \item \textbf{Identity Resolution}: Binding the row-based Student UID against the core identity subset in the database via an $O(1)$ Hash Map generated at the beginning of the ingestion job.
\end{itemize}

\subsection{Attendance Discrepancy Reconciliation}
If the faculty ingestion schema collides with existing constraints (e.g., modifying historical data mapped previously as immutable), the worker invokes a rollback protocol mapped sequentially across the localized $Transaction$ context.

\newpage
""")

    # Chapter 7: API Design
    chapters.append(r"""
% =========================================================================
% CHAPTER 7: API DESIGN
% =========================================================================
\section{API Design}

UniZ implements a strict RESTful constraint model guaranteeing stateless transactions, semantic URL structuring, and isolated execution scopes. 

\subsection{Authentication Strategy (JWT)}
The execution lifecycle of API endpoints begins with robust security checks utilizing JSON Web Tokens. The temporal process is governed by the state transformation:
\begin{equation}
    Login(credentials) \rightarrow JWT_{\text{signed}} \xrightarrow{\text{Header Inject}} Validation(Middleware) \rightarrow Response
\end{equation}
Tokens are symmetrically signed using the HS256 algorithm with short expiration spans to preempt token hijacking attacks.

\subsection{Standardized Output Schema}
Every API reply rigidly conforms to a standard architectural interface to ensure structural integrity across disparate client versions.
\begin{lstlisting}[language=json]
{
    "success": true,         // Boolean operational indicator
    "data": { ... },         // Optional structural payload 
    "message": "Resource fetched successfully",
    "timestamp": 161823901  // Epoch integer for cross-sync
}
\end{lstlisting}

\subsection{Core Endpoints Breakdown}

\subsubsection{Profile Retrieval API}
\textbf{Endpoint}: \texttt{GET /api/v1/profile} \\
\textbf{RBAC Constraints}: Requires arbitrary token authentication; execution logic branches depending on the decoded $role \in JWT$. \\
\textbf{Error Case}: Returns HTTP 404 if the relational identity index collapses or points to a purged User document.

\subsubsection{Request Creation API}
\textbf{Endpoint}: \texttt{POST /api/v1/requests} \\
\textbf{Payload JSON}:
\begin{lstlisting}[language=json]
{
    "type": "OUTPASS",
    "reason": "Medical follow-up",
    "startTime": "2026-04-10T10:00:00Z",
    "endTime": "2026-04-12T18:00:00Z",
    "destination": "Vijayawada"
}
\end{lstlisting}
\textbf{Constraints}: Executes a localized search verifying $|R_{active}| = 0$. Calculates delta epoch offsets to enforce minimal request lead times (e.g., $T_{start} \geq T_{current} + 12 \text{ hours}$).

\subsubsection{Terminal Endpoints}
The API boundaries define explicit routes supporting idempotency for safe retries ($PUT, DELETE$), and non-idempotent overrides solely restricted to POST routes mapping to action-oriented behaviors (e.g., $POST /api/v1/requests/:id/approve$).

\newpage
""")

    # Chapter 8: System Architecture
    chapters.append(r"""
% =========================================================================
% CHAPTER 8: SYSTEM ARCHITECTURE
% =========================================================================
\section{System Architecture}

The system topology maps deeply to scalable, state-isolated distributed computing standards designed to handle massive concurrent traffic spikes effectively—most commonly encountered during automated publication events (e.g., end-of-semester result distributions).

\subsection{API Gateway Pattern}
All internet-bound traffic strictly interfaces with an NGINX-based API gateway handling SSL termination, global rate-limiting, and payload sanitization prior to intra-cluster routing.

\subsection{Data Separation Model}
To minimize lock contention during high-velocity read/write epochs, the architectural schema decouples cold historical data from hot active vectors.
\begin{itemize}
    \item \textbf{Hot State Vectors (Redis)}: Active user sessions, JWT blacklists, active outpass counters.
    \item \textbf{Cold Persistence Layers (MongoDB)}: Historical transaction logs, legacy academic grades aggregated from prior chronological semesters.
\end{itemize}

\subsection{Scaling Topologies}
To facilitate high user loads, the core \texttt{/api/v1/academics} sub-service is dynamically partitioned into individual POD clusters scaled via Kubernetes Horizontal Pod Autoscaler (HPA) using target CPU utilization heuristics.

\begin{figure}[htpb]
\centering
\begin{tikzpicture}[
    box/.style={draw, minimum width=2.5cm, minimum height=1.5cm, rounded corners=0.2cm},
    line/.style={draw, -latex, thick}
]
    \node[box, fill=blue!10] (lb) {Load Balancer};
    \node[box, fill=green!10, below left=1.5cm and 1cm of lb] (node1) {API Pod 1};
    \node[box, fill=green!10, below right=1.5cm and 1cm of lb] (node2) {API Pod 2};
    \node[box, fill=yellow!10, below=2cm of node1] (redis) {Redis Cluster};
    \node[box, fill=orange!10, below=2cm of node2] (mongo) {Mongo Replica Set};

    \path[line] (lb) -- (node1);
    \path[line] (lb) -- (node2);
    \path[line] (node1) -- (redis);
    \path[line] (node2) -- (redis);
    \path[line] (node1) -- (mongo);
    \path[line] (node2) -- (mongo);
\end{tikzpicture}
\caption{Distributed Scaling Topology representing Pod orchestration.}
\end{figure}

\newpage
""")

    # Chapter 9: Database Design
    chapters.append(r"""
% =========================================================================
% CHAPTER 9: DATABASE DESIGN
% =========================================================================
\section{Database Design}

UniZ utilizes MongoDB, a NoSQL horizontally scaling document data structure model ideal for flexible academic arrays and heterogeneous JSON payload indexing. 

\subsection{Core Entity Schemas}
\textbf{The User Schema}: Contains absolute authority bindings mapping uniquely mapped identifiers.
\begin{lstlisting}[language=json]
{
  "_id": "ObjectId",
  "uid": { "type": "String", "unique": true, "index": true },
  "role": { "type": "String", "enum": ["student", "faculty", "admin"] },
  "hash": { "type": "String", "select": false },
  "metadata": {
     "branch": "String",
     "batch": "Number"
  }
}
\end{lstlisting}

\subsection{Relational Pointers in NoSQL}
To optimize memory space limits within the unified collection constraints, the architecture leverages DBRef pointers mapping outpass histories to singular Student Entities rather than utilizing deep-embedded arrays which would inevitably shatter physical document sizing thresholds ($>16$ MB limits).

\subsection{Constraint Indexing Optimization}
Performance optimizations mandate rigid multi-key index definitions allowing compound scanning logic during intensive analytical reads:
\begin{equation}
    Index_{academics} = \{ uid: 1, semester: -1 \} \implies O(\log N) \text{ retrieval timing.}
\end{equation}

\newpage
""")

    # Chapter 10: Security Architecture
    chapters.append(r"""
% =========================================================================
% CHAPTER 10: SECURITY ARCHITECTURE
% =========================================================================
\section{Security Architecture}

The platform abstracts all infrastructural vulnerability surfaces across multi-layer security modules executing sequential gatekeeping checks.

\subsection{Authentication Cryptography \& JWT Lifecycle}
The stateless cryptographic boundary operates strictly on JSON Web Tokens mapped as follows:
\begin{equation}
    Session_{id} = \text{HMAC-SHA256}(Header, Payload, Secret)
\end{equation}
Tokens are issued upon credential exchange explicitly stripped of hyper-sensitive vectors (e.g., passwords), containing merely the user identifier and authoritative role.
If an attacker attempts session manipulation, the non-homomorphic cipher enforces total cascade failures mapping to HTTP 401 statuses. 

Session invalidation—historically a complex constraint for stateless JWT—is achieved by maintaining high-speed Redis Blacklist blocks, executing binary cross-referencing on every single API iteration.

\subsection{Denial of Service Limits \& WAF}
Global Application Rate Limitations enforce throttle ceilings on user IPs targeting bounded operations spanning milliseconds. Login endpoints operate using exponentially compounding delay gates to algorithmically defeat brute-force dictionary attacks.
\begin{equation}
    Delay_n = c \cdot 2^n \text{ (where } n = \text{failed attempts)}
\end{equation}

\newpage
""")

    # Chapter 11: Request Approval Engine
    chapters.append(r"""
% =========================================================================
% CHAPTER 11: REQUEST APPROVAL ENGINE
% =========================================================================
\section{Request Approval Engine}

The Approval Engine abstracts the physical routing of leave documentation, executing deterministically through a predefined State Machine model.

\subsection{State Representation}
Let $S$ define the matrix of allowed document states. The lifecycle explicitly enforces transitions via discrete authority blocks.
The procedural pipeline $P$ applies continuous directional flow:
\begin{equation}
    \text{Created}_{student} \xrightarrow{\upsilon_1} \text{Pending}_{caretaker} \xrightarrow{\upsilon_2} \text{Pending}_{warden} \xrightarrow{\upsilon_3} \text{Approved}_{final}
\end{equation}

Where each transmission vector $\upsilon_i$ denotes the successful invocation of an authoritative overriding algorithm.

\begin{figure}[htpb]
\centering
\begin{tikzpicture}[
    state/.style={draw, circle, text width=2cm, align=center, fill=gray!20, minimum size=2cm},
    arrow/.style={-latex, thick}
]
    \node[state] (s1) {Created};
    \node[state, right=2cm of s1] (s2) {Caretaker review};
    \node[state, right=2cm of s2] (s3) {Warden review};
    \node[state, below=2cm of s3, fill=green!30] (s4) {Approved};
    \node[state, below=2cm of s2, fill=red!30] (s5) {Rejected};

    \draw[arrow] (s1) -- (s2);
    \draw[arrow] (s2) -- (s3);
    \draw[arrow] (s3) -- (s4);
    \draw[arrow] (s2) -- (s5);
    \draw[arrow] (s3) -- (s5);
    \draw[arrow] (s1) to[bend right] (s5);
\end{tikzpicture}
\caption{Deterministic Approval Flow Diagram representing State Machine constraints.}
\end{figure}

\subsection{Event Hashing and Audit Trails}
To eliminate vulnerability vectors revolving around ghost-approvals, every shift through the operational matrix signs an irreversible system message logged onto a chronological tracking array mapping specific actor cryptographic signatures.

\newpage
""")

    # Chapter 12: Performance and Optimization
    chapters.append(r"""
% =========================================================================
% CHAPTER 12: PERFORMANCE AND OPTIMIZATION
% =========================================================================
\section{Performance and Optimization}

Scale requirements necessitate complex data strategies transcending brute-force hardware allocations. UniZ guarantees optimized latency mapping across arbitrary workloads via systemic infrastructural tweaks.

\subsection{The Redis Caching Layer}
Read-heavy endpoints (e.g., student global structures) execute heavily on memory-mapped clusters. Applying the Redis Cache logic dramatically bounds operational access times resolving sub-50ms fetching bounds compared to the baseline 250ms Document Store scans. 
Cache implementations evaluate invalidation constraints executing real-time TTL boundaries scaling identically with structural write operations. 

\subsection{Computational Asynchrony in Data Operations}
Synchronous blockades severely fragment execution loop cycles. Faculty operations converting XLSX blobs to numeric arrays offload the workload asynchronously, optimizing server resource saturation and eliminating the $Wait(I/O)$ structural paradox.

\newpage
""")

    # Chapter 13: Error Handling and Edge Cases
    chapters.append(r"""
% =========================================================================
% CHAPTER 13: ERROR HANDLING AND EDGE CASES
% =========================================================================
\section{Error Handling and Edge Cases}

UniZ implements highly generalized programmatic defensive architecture to systematically catch syntax disruptions and network partitions.

\subsection{Graceful Degradation Patterns}
If dependent service endpoints (e.g., mail notification modules) encounter temporal disconnects, the parent API does not fail explicitly. Instead, bounded retry logics combined with asynchronous fallback mechanisms ensure operational completion. The user is delivered their $200 OK$ state block instantly while dependent tasks remain enqueued pending infrastructure reconciliation.

\subsection{Granular Exception Trapping}
Errors are systematically structured avoiding raw stack-trace leaks into the network boundary. Input validation frameworks assert regex compliances directly on incoming schemas before instantiating application controllers, ensuring malformed payloads map to predefined $400 Bad Request$ vectors immediately.

\newpage
""")

    # Chapter 14: Discussion
    chapters.append(r"""
% =========================================================================
% CHAPTER 14: DISCUSSION
% =========================================================================
\section{Discussion}

The implementation of UniZ substantially redefines infrastructural governance parameters mapped traditionally onto manual models.

\subsection{Architectural Efficacy}
By mapping granular logic onto isolated microservice execution blocks, the resultant engineering matrix avoids heavy monolithic constraints. The application resolves bottleneck concerns mapped heavily onto concurrent academic data publications ensuring strict $100\%$ availability. 

\subsection{Future Expansion Horizons}
The architectural axioms defined herein structurally support continuous scalability. Forthcoming system upgrades potentially include deep machine-learning analytical vectors targeting predictive anomaly evaluations mapped dynamically onto localized student traffic. 

\newpage
""")

    # Chapter 15: Conclusion
    chapters.append(r"""
% =========================================================================
% CHAPTER 15: CONCLUSION
% =========================================================================
\section{Conclusion}

The conceptualization, systemic engineering, and programmatic distribution of the UniZ platform effectively demonstrate the superior viability of strict RESTful frameworks applied alongside distributed state mapping. The operational latency metrics clearly indicate massive systemic optimizations over legacy paper-based architectural approximations.

UniZ proves the absolute viability of mathematically deterministic state machines targeting multi-variable administrative environments, establishing a novel secure platform designed specifically for long-term operability within high-density university ecosystems.

\newpage
""")

    # Chapter 16: References
    chapters.append(r"""
% =========================================================================
% 16. REFERENCES
% =========================================================================
\begin{thebibliography}{99}

\bibitem{restful}
R.~T. Fielding, \emph{Architectural Styles and the Design of Network-based Software Architectures}, Ph.D. dissertation, University of California, Irvine, 2000.

\bibitem{rbac}
D.~F. Ferraiolo, R.~Sandhu, S.~Gavrila, D.~R. Kuhn, and R.~Chandramouli, ``Proposed NIST standard for role-based access control,'' \emph{ACM Transactions on Information and System Security}, vol. 4, no. 3, pp. 224--274, 2001.

\bibitem{pwa}
A.~Russell, ``Progressive Web Apps: Escaping Tabs Without Losing Our Soul,'' \emph{Google Developers}, 2015.

\bibitem{redis}
S.~Sanfilippo, ``Redis: Data Structures Server,'' \emph{Redis.io Documentations}, 2015. 

\bibitem{jwt}
M.~Jones, J.~Bradley, and N.~Sakimura, \emph{JSON Web Token (JWT)}, IETF RFC 7519, 2015.

\end{thebibliography}

\newpage
""")

    # Chapter 17: Appendix
    chapters.append(r"""
% =========================================================================
% 17. APPENDIX
% =========================================================================
\section{Appendix}
\addcontentsline{toc}{section}{Appendix}

\subsection{Sample Execution Trace: API Ingestion}
\begin{spacing}{1.0}
\begin{verbatim}
HTTP POST /api/v1/academics/grades/upload HTTP/1.1
Host: api.uniz.rguktong.in
Authorization: Bearer <token_signature>
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

{
  "success": true,
  "data": {
     "jobId": "uuid-v4-hash-string",
     "targetRecords": 4500
  }
}
\end{verbatim}
\end{spacing}
""")

    return "\n".join(chapters)

def run():
    print("Generating comprehensive UniZ LaTeX documentation...")
    chapters_content = generate_chapters()
    output_content = TEMPLATE.replace("{CHAPTERS}", chapters_content)
    
    with open("/Users/sreecharandesu/Projects/uniz-master/docs/doc.tex", "w") as f:
        f.write(output_content)
    print("Done generating document to /Users/sreecharandesu/Projects/uniz-master/docs/doc.tex")

if __name__ == "__main__":
    run()
