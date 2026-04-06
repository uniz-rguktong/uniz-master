import os
import re

DOCS_DIR = "/Users/sreecharandesu/Projects/uniz-master/apps/uniz-docs"

def convert_md_to_tex(text):
    # Very basic MD to LaTeX conversion for technical docs
    text = re.sub(r'# (.*?)\n', r'\\subsection{\1}\n', text)
    text = re.sub(r'## (.*?)\n', r'\\subsubsection{\1}\n', text)
    text = re.sub(r'### (.*?)\n', r'\\paragraph{\1}\n', text)
    text = re.sub(r'\*\*(.*?)\*\*', r'\\textbf{\1}', text)
    text = re.sub(r'\*(.*?)\*', r'\\textit{\1}', text)
    text = re.sub(r'`(.*?)`', r'\\texttt{\1}', text)
    # Convert Note/Warn blocks
    text = re.sub(r'<Note>(.*?)</Note>', r'\\begin{center}\\fbox{\\parbox{0.9\\linewidth}{\\textbf{Note:} \1}}\\end{center}', text, flags=re.DOTALL)
    text = re.sub(r'<Warning>(.*?)</Warning>', r'\\begin{center}\\fbox{\\parbox{0.9\\linewidth}{\\textbf{Warning:} \1}}\\end{center}', text, flags=re.DOTALL)
    # Convert code blocks
    text = re.sub(r'```(.*?)\n(.*?)```', r'\\begin{lstlisting}[language=\1]\n\2\\end{lstlisting}', text, flags=re.DOTALL)
    # Convert lists
    text = re.sub(r'^\s*-\s+(.*)$', r'\\begin{itemize}\n\\item \1\n\\end{itemize}', text, flags=re.MULTILINE)
    # Clean up empty itemize
    text = re.sub(r'\\end{itemize}\n\\begin{itemize}', r'', text)
    
    # Escape special TeX chars
    text = text.replace('&', '\\&').replace('%', '\\%').replace('$', '\\$').replace('#', '\\#').replace('_', '\\_')
    return text

def read_dir_files(sys_dir):
    full_path = os.path.join(DOCS_DIR, sys_dir)
    content = []
    if os.path.isdir(full_path):
        for root, dirs, files in os.walk(full_path):
            # sort files for consistency
            for f in sorted(files):
                if f.endswith('.md') or f.endswith('.mdx'):
                    with open(os.path.join(root, f), 'r') as file:
                        c = file.read()
                        # translate UI concepts to System terminology as requested
                        c = c.replace('Click button', 'System ingests explicit POST command payload')
                        c = c.replace('Submit form', 'Client dispatches serialized JSON packet to authoritative endpoint')
                        c = c.replace('User sees', 'State resolution binds directly to localized DOM UI element')
                        content.append(r"\subsection{" + f.replace('.mdx', '').replace('.md', '').capitalize() + " Component Operations}\n")
                        content.append(convert_md_to_tex(c))
    return "\n".join(content)

TEMPLATE = r"""\documentclass[journal,onecolumn,10pt,draftclsnofoot]{IEEEtran}

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
\usepackage{setspace}
\usepackage{geometry}
\usepackage{tikz}
\usepackage{listings}
\usetikzlibrary{shapes.geometric, arrows, positioning, calc, chains, arrows.meta}
\geometry{left=1in, right=1in, top=1in, bottom=1in}

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
\setstretch{1.5} 
\pagenumbering{roman}

\title{\LARGE \textbf{UniZ: A Distributed University Administration Platform with Role-Based Access Control and Automated Approval Workflows}}

\author{
    \IEEEauthorblockN{SreeCharan Desu}\\
    \IEEEauthorblockA{ID No. O210008\\
    Department of Computer Science and Engineering\\
    Rajiv Gandhi University of Knowledge Technologies, Ongole\\
    Email: o210008@rguktong.ac.in}
}

\begin{document}
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
\tableofcontents
\newpage
\pagenumbering{arabic}

% =========================================================================
% CHAPTER 1: STUDENT MODULE
% =========================================================================
\section{Student Module Subsystem Integration}
{STUDENT_CONTENT}
\newpage

% =========================================================================
% CHAPTER 2: ADMIN MODULE
% =========================================================================
\section{Admin Module Subsystem Integration}
{ADMIN_CONTENT}
\newpage

% =========================================================================
% CHAPTER 3: FACULTY MODULE
% =========================================================================
\section{Faculty Module Subsystem Integration}
{FACULTY_CONTENT}
\newpage

% =========================================================================
% CHAPTER 4: CORE API REFERENCES
% =========================================================================
\section{Core API Architectures}
{API_CONTENT}
\newpage

\section{System Architecture and RBAC Core Models}
\subsection{Distributed RBAC State Machine}
The comprehensive role architecture utilizes the discrete matrix equation limit $|R_{active}| \leq 1$.
The outpass flow behaves as a fully defined Markov chain restricted via directional logic:
\begin{equation}
\text{Created} \rightarrow \text{Caretaker} \rightarrow \text{Warden} \rightarrow \text{SWO} \rightarrow \text{Approved}
\end{equation}

\end{document}
"""

def generate():
    student = read_dir_files("students")
    admin = read_dir_files("admin")
    faculty = read_dir_files("faculty")
    api = read_dir_files("api")
    
    out = TEMPLATE.replace('{STUDENT_CONTENT}', student)
    out = out.replace('{ADMIN_CONTENT}', admin)
    out = out.replace('{FACULTY_CONTENT}', faculty)
    out = out.replace('{API_CONTENT}', api)
    
    with open('/Users/sreecharandesu/Projects/uniz-master/docs/doc.tex', 'w') as f:
        f.write(out)

if __name__ == "__main__":
    generate()
    print("Injected entire student, admin, faculty, and api modules directly into doc.tex!")
