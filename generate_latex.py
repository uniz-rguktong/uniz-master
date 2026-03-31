import os
import re

# ===== PROFESSIONAL LATEX TEMPLATE (SUPER MINIMAL & ELEGANT) =====
LATEX_HEADER = r'''\documentclass[11pt,a4paper,oneside]{article}

% --- Core Packages ---
\usepackage[a4paper,margin=1.1in,footskip=0.5in]{geometry}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{amsmath,amssymb,amsfonts}
\usepackage[demo]{graphicx}
\usepackage{mathptmx}
\usepackage{courier}
\usepackage{booktabs}
\usepackage{xcolor}
\usepackage{listings}
\usepackage{tikz}
\usepackage{microtype}
\usetikzlibrary{shapes,arrows,positioning,calc,fit,shadows,backgrounds}
\usepackage[colorlinks=true, allcolors=blue!40!black, pdfborder={0 0 0}]{hyperref}

% --- Custom Colors ---
\definecolor{unizblue}{HTML}{003366}
\definecolor{unizlight}{HTML}{F1F5F9}
\definecolor{accent}{HTML}{334155}
\definecolor{divider}{HTML}{CBD5E1}

% --- Typography & Section Styling ---
\makeatletter
\renewcommand{\section}{\@startsection{section}{1}{\z@}%
    {-5ex \@plus -1ex \@minus -.2ex}%
    {3ex \@plus.2ex}%
    {\normalfont\huge\bfseries\color{unizblue}}}

\renewcommand{\subsection}{\@startsection{subsection}{2}{\z@}%
    {-4ex\@plus -1ex \@minus -.2ex}%
    {2ex \@plus .2ex}%
    {\normalfont\Large\bfseries\color{accent}}}

\newcommand{\makeuniztitle}{
  \begin{titlepage}
    \begin{tikzpicture}[remember picture,overlay]
      \node[anchor=north east, xshift=-1in, yshift=-1in] at (current page.north east) {
        \begin{tikzpicture}[scale=0.8]
          \draw[unizblue, line width=1.5pt] (0,0) -- (1,0) -- (1,1) -- (0,1) -- cycle;
          \draw[unizblue, line width=1.5pt] (0.2,0.2) rectangle (0.8,0.8);
          \fill[unizblue] (0.4,0.4) rectangle (0.6,0.6);
        \end{tikzpicture}
      };
    \end{tikzpicture}
    
    \begin{flushleft}
      \vspace*{5cm}
      {\fontsize{52}{62}\selectfont\bfseries\color{unizblue} UniZ\par}
      \vspace{0.8cm}
      {\huge\bfseries\color{accent} Systems Architecture \& Reference Manual\par}
      \vspace{1.2cm}
      {\color{divider}\rule{\linewidth}{1.5pt}}\par
      \vspace{1.2cm}
      {\large\sffamily\color{gray} Professional University Administration Ecosystem\par}
      
      \vfill
      
      {\small\sffamily\color{accent}
        \textbf{CONTRIBUTORS}\\\vspace{0.4cm}
        \begin{tabular}{@{}ll}
          \textbf{SreeCharan Desu} & --- \textit{infra and devops} \\
          \textbf{BhanuPrakash} & --- \textit{developer} \\
          \textbf{Seetharam} & --- \textit{cyber security} \\
          \textbf{Anand} & --- \textit{ai} \\
        \end{tabular}
      }
      \vspace{2cm}
      {\small\sffamily\color{gray} UPDATED: \today\par}
    \end{flushleft}
  \end{titlepage}
}
\makeatother

% --- Code Listing Style ---
\definecolor{codebg}{HTML}{F8FAFC}
\definecolor{codecomment}{HTML}{64748B}
\definecolor{codekw}{HTML}{0F172A}
\definecolor{codestr}{HTML}{334155}

\lstdefinestyle{unizstyle}{
    backgroundcolor=\color{codebg},   
    commentstyle=\color{codecomment}\itshape,
    keywordstyle=\color{unizblue}\bfseries,
    stringstyle=\color{codestr},
    basicstyle=\ttfamily\scriptsize,
    breaklines=true,                 
    numbers=left,                    
    numberstyle=\tiny\color{divider},
    numbersep=10pt,                  
    tabsize=2,
    frame=leftline,
    framerule=2pt,
    rulecolor=\color{unizblue!20},
    xleftmargin=20pt,
    showstringspaces=false
}
\lstset{style=unizstyle}

% --- Custom Info/Note Boxes ---
\usepackage[many]{tcolorbox}
\newtcolorbox{unizbox}[2]{
  colback=#1,
  colframe=gray!10,
  arc=0pt,
  boxrule=0.5pt,
  leftrule=3pt,
  title=\textbf{#2},
  coltitle=black,
  fonttitle=\small\sffamily,
  fontupper=\small,
  left=12pt,
  right=12pt,
  top=10pt,
  bottom=10pt
}

\begin{document}
\makeuniztitle

\begin{abstract}
\noindent This document provides the authoritative technical reference for the UniZ platform. UniZ is a high-performance, security-hardened university administration system designed for RGUKT. It leverages a modern microservices architecture, automated DevOps pipelines, and intelligent data processing to streamline campus operations. This manual combines high-level architectural oversight with direct implementation references.
\end{abstract}

\tableofcontents
\pagebreak

\section{System Overview \& Architecture}

\subsection{Microservices Mesh Topology}
\begin{figure}[h]
\centering
\begin{tikzpicture}[
    node distance=2.2cm,
    block/.style={rectangle, draw=unizblue!80, fill=unizlight, text width=8em, text centered, rounded corners=1pt, minimum height=3.8em, font=\bfseries\small, drop shadow={opacity=0.08}},
    db/.style={cylinder, draw=accent!50, fill=white, shape border rotate=90, aspect=0.2, text width=5.5em, text centered, minimum height=3.8em, font=\small},
    line/.style={draw, -latex, thick, color=unizblue!60}
]

% Nodes
\node [block] (gateway) {API Gateway\\(Nginx)};
\node [block, below left=of gateway] (auth) {Auth Service};
\node [block, below right=of gateway] (user) {User Service};
\node [block, below=of auth] (outpass) {Outpass Service};
\node [block, below=of user] (academics) {Academics Service};
\node [db, below=of outpass, yshift=-1cm] (db1) {PostgreSQL};
\node [db, below=of academics, yshift=-1cm] (db2) {Redis / Cache};

% Connectors
\path [line] (gateway) -- (auth);
\path [line] (gateway) -- (user);
\path [line] (auth) -- (outpass);
\path [line] (user) -- (academics);
\path [line] (outpass) -- (db1);
\path [line] (academics) -- (db2);

\end{tikzpicture}
\caption{System Component Relationship Mapping}
\end{figure}

\subsection{Approval Chain Logic}
\begin{figure}[h]
\centering
\begin{tikzpicture}[
    node distance=1.8cm,
    step/.style={rectangle, draw=accent!30, fill=white, text width=8.5em, text centered, minimum height=3.2em, rounded corners=0.5pt, font=\small, drop shadow={opacity=0.05}},
    arrow/.style={draw, -latex, thick, color=unizblue!40}
]

\node [step] (s1) {Student Submission};
\node [step, right=of s1] (s2) {Caretaker Review};
\node [step, right=of s2] (s3) {Warden Approval};
\node [step, right=of s3] (s4) {Dean / Director};

\draw [arrow] (s1) -- (s2);
\draw [arrow] (s2) -- (s3);
\draw [arrow] (s3) -- (s4);

\end{tikzpicture}
\caption{Multi-Tiered Approval Workflow}
\end{figure}

\subsection{Academic Grade Processing}
\begin{figure}[h]
\centering
\begin{tikzpicture}[
    node distance=1.8cm,
    box/.style={rectangle, draw=unizblue!30, fill=unizlight, text width=11em, text centered, minimum height=3.2em, rounded corners=1pt, font=\small},
    arrow/.style={draw, -latex, thick, color=unizblue!60}
]

\node [box] (faculty) {Faculty Uploads Data};
\node [box, below=of faculty] (worker) {Async Parser (Worker)};
\node [box, below=of worker] (db) {Database Transaction};
\node [box, below=of db] (notify) {Real-time Notifications};

\draw [arrow] (faculty) -- (worker);
\draw [arrow] (worker) -- (db);
\draw [arrow] (db) -- (notify);

\end{tikzpicture}
\caption{Data Ingestion Pipeline}
\end{figure}

\subsection{Authentication Sequence}
\begin{figure}[h]
\centering
\begin{tikzpicture}[
    node distance=3cm,
    actor/.style={rectangle, draw=black!70, fill=white, text width=6.5em, text centered, minimum height=2.8em, font=\bfseries\small},
    svc/.style={rectangle, draw=unizblue!70, fill=unizlight, text width=8em, text centered, minimum height=2.8em, font=\small},
    arrow/.style={draw, -latex, thick, color=unizblue!50}
]

\node [actor] (user) {Client App};
\node [svc, right=of user] (gateway) {Ingress Node};
\node [svc, right=of gateway] (auth) {Auth Engine};

\draw [arrow] (user.east) -- node[above, font=\tiny\sffamily] {Login REQ} (gateway.west);
\draw [arrow] (gateway.east) -- node[above, font=\tiny\sffamily] {Identity Check} (auth.west);
\draw [arrow, dashed, color=gray!80] (auth.west) -- node[below, font=\tiny\sffamily] {Access Token} (gateway.east);
\draw [arrow, dashed, color=gray!80] (gateway.west) -- node[below, font=\tiny\sffamily] {200 Authorized} (user.east);

\end{tikzpicture}
\caption{Internal Identity Negotiation Flow}
\end{figure}

'''

LATEX_FOOTER = r'''
\end{document}
'''

def convert_tables(content):
    """
    Highly robust Markdown Table to LaTeX converter with automatic wrapping.
    """
    lines = content.split('\n')
    new_lines = []
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if line.startswith('|') and i + 1 < len(lines) and re.match(r'^[|\s\-:]+$', lines[i+1].strip()):
            header_cells = [c.strip() for c in lines[i].strip('|').split('|')]
            cols = len(header_cells)
            i += 2 
            
            data_rows = []
            while i < len(lines) and lines[i].strip().startswith('|'):
                data_rows.append([c.strip() for c in lines[i].strip('|').split('|')])
                i += 1
            
            if header_cells:
                col_spec = "l" * cols
                if cols >= 3:
                     col_spec = "p{0.18\\linewidth} p{0.3\\linewidth} p{0.4\\linewidth}"
                
                latex = "\n\\begin{center}\n\\small\n\\begin{tabular}{" + col_spec + "}\n"
                latex += "\\toprule\n"
                latex += " & ".join([f"\\textbf{{{h}}}" for h in header_cells]).replace('_', '\\_') + " \\\\\n\\midrule\n"
                for row in data_rows:
                    while len(row) < cols: row.append("")
                    latex += " & ".join([c.replace('_', '\\_').replace('&', '\\&') for c in row[:cols]]) + " \\\\\n"
                latex += "\\bottomrule\n\\end{tabular}\n\\end{center}\n"
                new_lines.append(latex)
            continue
        else:
            new_lines.append(lines[i])
            i += 1
    return '\n'.join(new_lines)

def clean_mdx_content(content):
    """
    Cleans MDX/Markdown content to be LaTeX-safe.
    """
    content = re.sub(r'^---.*?---', '', content, flags=re.DOTALL)
    
    code_blocks = []
    def placeholder_code_block(match):
        idx = len(code_blocks)
        code_blocks.append(f"\n\\begin{{lstlisting}}\n{match.group(2).strip()}\n\\end{{lstlisting}}\n")
        return f"LATEXBLOCKXYZ{idx}ABC"
    content = re.sub(r'```(\w*)\n?(.*?)\n?```', placeholder_code_block, content, flags=re.DOTALL)

    replacements = {
        '≥': r'$\ge$', '≤': r'$\le$', '→': r'$\rightarrow$', '←': r'$\leftarrow$',
        '—': '---', '–': '--', '“': "``", '”': "''", '‘': "`", '’': "'",
        '©': r'\copyright{}', '…': '...'
    }
    for old, new in replacements.items():
        content = content.replace(old, new)

    content = convert_tables(content)

    content = re.sub(r'<Note>(.*?)</Note>', r'\\begin{unizbox}{unizlight}{NOTE} \1 \\end{unizbox}', content, flags=re.DOTALL)
    content = re.sub(r'<Warning>(.*?)</Warning>', r'\\begin{unizbox}{red!5}{WARNING} \1 \\end{unizbox}', content, flags=re.DOTALL)
    content = re.sub(r'<Tip>(.*?)</Tip>', r'\\begin{unizbox}{green!5}{TIP} \1 \\end{unizbox}', content, flags=re.DOTALL)
    content = re.sub(r'<Info>(.*?)</Info>', r'\\begin{unizbox}{unizblue!5}{INFO} \1 \\end{unizbox}', content, flags=re.DOTALL)

    content = re.sub(r'\*\*(.*?)\*\*', r'\\textbf{\1}', content)
    content = re.sub(r'\*(.*?)\*', r'\\textit{\1}', content)

    content = re.sub(r'<(Steps|Tabs|CardGroup|Card|Step|Tab).*?>', '', content)
    content = re.sub(r'</(Steps|Tabs|CardGroup|Card|Step|Tab)>', '', content)
    content = re.sub(r'<(Step|Tab|Card) title="(.*?)".*?>', r'\\paragraph{\2}', content)

    content = re.sub(r'^### (.*)', r'\\subsubsection*{\1}', content, flags=re.M)
    content = re.sub(r'^## (.*)', r'\\subsection*{\1}', content, flags=re.M)
    content = re.sub(r'^# (.*)', r'\\section*{\1}', content, flags=re.M)

    for i, block in enumerate(code_blocks):
        content = content.replace(f"LATEXBLOCKXYZ{i}ABC", block)

    return content

def ignore_path(path):
    ignored = ['node_modules', '.git', '.next', 'dist', 'build', 'lock', 'json', 'test', 'spec', 'html', '.github', '.gemini', 'venv', '__pycache__', 'public', 'assets']
    path_lower = path.lower()
    for ig in ignored:
        if f"{os.sep}{ig}{os.sep}" in path_lower or path_lower.startswith(f"{ig}{os.sep}"):
            return True
    return False

def main():
    root_dir = "/Users/sreecharandesu/Projects/uniz-master"
    docs_dir = os.path.join(root_dir, "uniz_docs_temp")
    output_tex = os.path.join(root_dir, "uniz_documentation_short.tex")
    with open(output_tex, "w", encoding="utf-8") as out:
        out.write(LATEX_HEADER)
        if os.path.isdir(docs_dir):
            for opt in ["introduction.mdx", "quickstart.mdx", "roles.mdx"]:
                p = os.path.join(docs_dir, opt)
                if os.path.exists(p):
                    with open(p, "r", encoding="utf-8") as f_in: out.write(clean_mdx_content(f_in.read()))
                    out.write("\n\\pagebreak\n")
        out.write(r"\section{Technical Implementation}")
        valid_files = []
        for tdir in ["apps", "infra"]:
            p = os.path.join(root_dir, tdir)
            if not os.path.isdir(p): continue
            for r, ds, fs in os.walk(p):
                # Efficiently skip ignored directories
                ds[:] = [d for d in ds if not ignore_path(os.path.join(r, d))]
                for f in fs:
                    fpath = os.path.join(r, f)
                    if any(f.endswith(ext) for ext in ['.ts', '.py', '.prisma']) and not ignore_path(fpath):
                        valid_files.append(fpath)
        
        current_service, count = "", 0
        for fpath in valid_files:
            rel = os.path.relpath(fpath, root_dir)
            parts = rel.split(os.sep)
            service = parts[1] if len(parts) > 1 else parts[0]
            if service != current_service:
                out.write(f"\n\\subsection{{{service.title().replace('-', ' ')}}}\n")
                current_service, count = service, 0
            # Increased limit for better documentation
            if count >= 8: continue
            with open(fpath, "r", encoding="utf-8") as f_in:
                lines = f_in.readlines()
                out.write(f"\\subsubsection*{{{rel.replace('_', '\\_')}}}\n")
                out.write(f"\\begin{{lstlisting}}\n{''.join(lines[:150])}\n\\end{{lstlisting}}\n")
                count += 1
        out.write(LATEX_FOOTER)

if __name__ == "__main__":
    main()
