import re

with open('/Users/sreecharandesu/Desktop/uniz_report.tex', 'r') as f:
    content = f.read()

# Extract from \begin{document}
doc_start = content.find('\\begin{document}')
if doc_start == -1:
    print("Could not find document start")
    exit(1)

body = content[doc_start:]

# Convert chapter to section
body = body.replace('\\chapter{', '\\section{')
body = body.replace('\\chapter*{', '\\section*{')
# Convert section to subsection
body = body.replace('\\section{', '\\subsection{')
body = body.replace('\\section*{', '\\subsection*{')
# We need to do this carefully so we don't mix them up.
# Better to use regex.

def transform_body(text):
    text = re.sub(r'\\section(\*?)\{', r'\\subsection\1{', text)
    text = re.sub(r'\\chapter(\*?)\{', r'\\section\1{', text)
    text = re.sub(r'\\subsection(\*?)\{', r'\\subsubsection\1{', text) # Wait, original \subsection needs to be \subsubsection!
    # Wait, simple replace will cascade: chapter -> section -> subsection -> subsubsection.
    # We must do it safely.
    return text

# Safe replace:
def convert_tags(text):
    # Replace subsection -> subsubsection
    text = re.sub(r'\\subsection(\*?)\{', r'\\subsubsection\1{', text)
    # Replace section -> subsection
    text = re.sub(r'\\section(\*?)\{', r'\\subsection\1{', text)
    # Replace chapter -> section
    text = re.sub(r'\\chapter(\*?)\{', r'\\section\1{', text)
    return text

body = convert_tags(body)

# Prepare the beautiful preamble from doc.tex.
preamble = r"""\documentclass[journal,onecolumn,10pt,draftclsnofoot]{IEEEtran}

% =========================================================================
% PACKAGES
% =========================================================================
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{microtype}
\usepackage{amsmath,amssymb,amsfonts,amsthm}
\usepackage{graphicx}
\usepackage{cite}
\usepackage{mathptmx}
\usepackage{courier}
\usepackage{booktabs,longtable,multirow}
\usepackage{algorithm}
\usepackage{algorithmicx}
\usepackage{algpseudocode}
\usepackage{xcolor}
\usepackage[colorlinks=true, allcolors=blue!60!black, urlcolor=blue!80!black]{hyperref}
\usepackage{titlesec}
\usepackage{enumitem}
\usepackage{setspace}
\usepackage{geometry}
\usepackage{tikz}
\usepackage{tabularx}
\usepackage{listings}
\usepackage{mdframed}
\usepackage{float}
\usepackage{pdflscape}
\usetikzlibrary{shapes.geometric, arrows, positioning, calc, chains, arrows.meta, fit, backgrounds, decorations.pathreplacing, matrix}
\geometry{left=1in, right=1in, top=1in, bottom=1in}

% =========================================================================
% LISTINGS CONFIGURATION
% =========================================================================
\definecolor{codegreen}{rgb}{0,0.6,0}
\definecolor{codegray}{rgb}{0.5,0.5,0.5}
\definecolor{codepurple}{rgb}{0.58,0,0.82}
\definecolor{backcolour}{rgb}{0.96,0.97,0.98}
\definecolor{primaryblue}{rgb}{0.1, 0.3, 0.6}
\definecolor{primaryred}{rgb}{0.7, 0.1, 0.1}

\lstset{
    backgroundcolor=\color{backcolour},   
    commentstyle=\color{codegray}\itshape,
    keywordstyle=\color{primaryblue}\bfseries,
    numberstyle=\tiny\color{codegray},
    stringstyle=\color{codepurple},
    basicstyle=\ttfamily\small,
    breakatwhitespace=false,         
    breaklines=true,                 
    captionpos=b,                    
    keepspaces=true,                 
    numbers=left,                    
    showspaces=false,                
    showstringspaces=false,
    showtabs=false,                  
    tabsize=2,
    frame=single,
    rulecolor=\color{black!15},
    xleftmargin=1em,
    xrightmargin=1em
}

% =========================================================================
% SECTION STYLES
% =========================================================================
\titleformat{\section}{\Large\bfseries\color{primaryblue}}{\thesection.}{1em}{}
\titleformat{\subsection}{\large\bfseries\color{black!80}}{\thesubsection}{1em}{}
\titleformat{\subsubsection}{\normalsize\bfseries\color{primaryred}}{\thesubsubsection}{0.8em}{}

% =========================================================================
% CONFIGURATION
% =========================================================================
\setstretch{1.6} 
\pagenumbering{roman}

% =========================================================================
% CUSTOM COMMANDS FROM UNIZ_REPORT.TEX
% =========================================================================
\newcommand{\api}[1]{\texttt{\small #1}}
\newcommand{\role}[1]{\texttt{#1}}
\newcommand{\field}[1]{\texttt{\textit{#1}}}
\newcommand{\code}[1]{\texttt{#1}}
"""

final_tex = preamble + "\n" + body

# IEEETran does not use \chapter anywhere, and \appendix changes behaviour.
# Let's clean up \chapter*{References} to \section*{References}
# and \appendix which might behave differently. 
final_tex = final_tex.replace('\\newpage\\listoffigures', '% \\newpage\\listoffigures')
final_tex = final_tex.replace('\\newpage\\listoftables', '% \\newpage\\listoftables')

with open('/Users/sreecharandesu/Projects/uniz-master/docs/doc.tex', 'w') as f:
    f.write(final_tex)

print("Merged uniz_report.tex into doc.tex with IEEEtran styling.")
