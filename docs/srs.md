COMSATS University, Islamabad Pakistan 

MediFusion Vision 

By 

AIZA KHADIM        FA22-BCS-010 

AREEBA NIAZI       FA22-BCS-014 

                                 AREEHA NAYAB     FA22-BCS-015 

Supervisor 

Dr. Rasool Bukhsh 

Bachelor of Science in Computer Science (2022-2026) 

The  candidate  confirms  that  the  work  submitted  is  their  own  and  appropriate 

 credit has been given where reference has been made to the work of others.

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
COMSATS University, Islamabad Pakistan 

MediFusion Vision 

A project presented to 

COMSATS University, Islamabad 

In partial fulfillment 

of the requirement for the degree of 

Bachelors of Science in Computer Science (2022-2026) 

By 

Aiza Khadim     CIIT/FA22-BCS-010/ISB 

Areeba Niazi      CIIT/FA22-BCS-014/ISB 

Areeha Nayab    CIIT/FA22-BCS-015/ISB 

1 

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
EXECUTIVE SUMMARY 

In today’s healthcare environment, there is a growing need for accessible, timely, and accurate 

diagnostics and remote consultations, especially in public clinics, hospitals, and underserved areas. 

Traditional  methods  of  consulting  doctors,  reviewing  patient  reports,  and  managing  medical 

appointments  are  often  fragmented,  slow,  and  depend  heavily  on  manual  processes.  These 

inefficiencies  may  lead  to  delayed  diagnosis,  limited  patient-doctor  interaction,  data  silos,  and 

increased workload for healthcare providers. 

To address these challenges, MediFusion Vision is developed. MediFusion Vision is an integrated, 

AI-powered medical platform  that  combines patient,  doctor, and admin interfaces  for seamless 

healthcare management. The system enables patients to upload medical scans, book virtual or in-

person appointments, and receive AI-assisted diagnostic reports. Doctors can access consolidated 

patient data, leverage AI insights for diagnosis, and conduct telemedicine consultations—all from 

a unified dashboard. 

MediFusion Vision utilizes advanced AI models to analyze medical images, generate diagnostic 

findings,  and  highlight  risk  assessments,  all  presented  in  easy-to-understand  reports  for  both 

clinicians and patients. The web and mobile applications provide role-based access and tailored 

experiences  for  patients,  doctors,  and  healthcare  administrators,  streamlining  the  end-to-end 

process from diagnosis to follow-up. 

The platform is built using modular web and mobile technology, secure cloud infrastructure, and 

adheres to healthcare data privacy standards. AI model monitoring, appointment logs, feedback 

review,  and  notification  management  are  embedded  for  reliability  and  transparency.  Patients 

benefit from reduced wait times, reliable records, and continuous access to expert advice, while 

doctors  and  admins  save  time  on  repetitive  tasks  and  gain  actionable  insights  from  centralized 

analytics. 

MediFusion Vision aims to bridge the gap between automated diagnostics and human expertise, 

bringing affordable, high-quality  healthcare to  diverse populations,  and shaping  a future where 

accurate, timely medical care is accessible to all. 

2 

 
 
 
Abstract 

The proposal aims to create an intelligent system that assists doctors in detecting and diagnosing 
multiple critical diseases such as Brain Tumors, Alzheimer's, Stroke, Diabetic Retinopathy, AMD  
and Glaucoma through AI-powered analysis of medical  images and patient  data. The proposed 
system  will  analyse  brain  Magnetic  Resonance  Image  MRI  scans,  retinal  images  and  textual 
medical reports using advanced AI for efficient and accurate diagnosis of  these diseases and will 
generate  detailed  reports.  Both  doctors  and  patients  will  be  able  to  access  these  reports  and 
additional features such as follow-up scheduling, doctor’s feedback, and the patient’s medical data. 
This  platform  will  act  as  a  comprehensive  management  system,  organizing  patient  data  and 
enabling easy access for both users. As far as we know, no system currently exists that can detect 
multiple  diseases  from  one  scan,  while  also  managing  patients  and  doctors  in  one  place.  This 
project aims to provide an efficient, accessible, and comprehensive solution that will improve the 
overall healthcare experience for users nationwide 

3 

 
 
 
 
 
 
 
 
 
 
Table of Contents 

Abstract ........................................................................................................................................... 3 

1  Chapter 1: Introduction and Problem Definition .................................................................... 6 

1.1  Overview of the Project ................................................................................................................ 6 
1.2  Vision Statement ........................................................................................................................... 6 
Problem Statement ........................................................................................................................ 7 
1.3 
1.4 
Problem Solution .......................................................................................................................... 7 
1.5  Objectives of the Proposed System ............................................................................................... 8 
Scope ............................................................................................................................................. 8 
1.6 
1.6.1  Limitations/Constraints ........................................................................................................... 9 
1.7 Modules .............................................................................................................................................. 9 
1.7.1 Module 1: User, Role & Admin Management ............................................................................ 9 
1.7.2 Module 2: Patient Medical History & Consultation Notes ......................................................... 9 
1.7.3 Module 3: Appointment & Schedule Management ..................................................................... 9 
1.7.4 Module 4: Diagnostic & Scan Management ............................................................................. 10 
1.7.5 Module 5: AI Diagnostic Engine............................................................................................... 10 
1.7.6 Module 6: Explainable AI & Transparency .............................................................................. 10 
1.7.7 Module 7: Final Report & Summary Generation ...................................................................... 10 
1.7.8 Module 8: Virtual Consultation Management ........................................................................... 10 
1.7.9 Module 9: Payment Gateway Integration .................................................................................. 10 
1.7.10 Module 10: Multi-language Support ....................................................................................... 11 
1.7.11 Module 11: Feedback & Continuous Learning Module .......................................................... 11 
1.7.12 Module 12: Accessibility & Assistive Tools ........................................................................... 11 
1.8 Related System Analysis/Literature Review .................................................................................... 11 
1.7.1  Literature Review .................................................................................................................. 11 
1.7.2  Related System Analysis ....................................................................................................... 12 
1.9 Tools and Technologies ................................................................................................................... 13 
1.10 Project Contribution ....................................................................................................................... 14 
1.11 Relevance to Course Modules ........................................................................................................ 15 

2  Chapter 2: Requirement Analysis ......................................................................................... 16 

2.2 

2.1 User Classes and Characteristics ...................................................................................................... 16 
2.1.1  Use case Diagram .................................................................................................................. 17 
2.1.2  Requirement Identifying Technique ...................................................................................... 21 
2.1.3  Backend Process Requirements (Event–Response Table Technique) .................................. 22 
Functional Requirements ............................................................................................................ 24 
2.2.1  Recommended Format: ......................................................................................................... 24 
2.3  Non-Functional Requirements .................................................................................................... 65 
2.3.1  Reliability .............................................................................................................................. 65 
2.3.2  Usability ................................................................................................................................ 66 
2.3.3  Performance .......................................................................................................................... 66 
2.3.4  Security ................................................................................................................................. 66 
External Interface Requirements ................................................................................................. 66 
2.4.1  User Interfaces Requirements ............................................................................................... 67 
2.4.2  Software interfaces ................................................................................................................ 67 
2.4.3  Hardware interfaces .............................................................................................................. 69 
2.4.4  Communications interfaces ................................................................................................... 69 

2.4 

4 

 
 
List of Figures 

Figure 2-1: Use Case Diagram for Admin .................................................................................... 18 
Figure 2-2: Use Case Diagram for Doctor .................................................................................... 19 
Figure 2-3: Use Case Diagram for Patient .................................................................................... 20 
Figure 2‑4:  Login Page ................................................................................................................ 24 
Table 2-3: Functional Requirements derived from Mockup M1 .................................................. 25 
Figure 2‑6: Dashboard Screen – Doctor Web ............................................................................... 26 
Figure 2‑7: AI Diagnostic Workflow Screen ................................................................................ 27 
Figure 2-8: Appointment Management Screen ............................................................................. 28 
Figure 2-9: AI Note Taker Screen ................................................................................................ 29 
Figure 2-10: Virtual Consultation Screen ..................................................................................... 30 
Figure 2-11: Patient Details Screen .............................................................................................. 31 
Figure 2-12: Patient List Screen ................................................................................................... 32 
Figure 2-13: Final Diagnostic Report Screen ............................................................................... 34 
Figure 2-14: Patient Registration Screen ...................................................................................... 35 
Figure 2-15: Patient Dashboard Screen ........................................................................................ 36 
Figure 2-16: Doctor Search Screen ............................................................................................... 37 
Figure 2-17: Doctor Profile Screen ............................................................................................... 38 
Figure 2-18: Appointment Booking Screen .................................................................................. 39 
Figure 2-19: Payment Confirmation Screen ................................................................................. 40 
Figure 2-20: Scan Upload Screen ................................................................................................. 41 
Figure 2-21: AI Analysis Results Screen ...................................................................................... 42 
Figure 2-22: Feedback Screen ...................................................................................................... 43 
Figure 2-23: Dashboard Overview – Admin ................................................................................ 44 
Figure 2-24: Doctor Management Screen ..................................................................................... 45 
Figure 2-25: Patient Management Screen ..................................................................................... 46 
Figure 2-26: Appointment Logs Screen ........................................................................................ 48 
Figure 2-27: Scan Repository Screen ........................................................................................... 49 
Figure 2-28: AI Model Monitoring Screen ................................................................................... 50 
Figure 2-29: Notification Management Screen ............................................................................. 51 
Figure 2-30: Payment & Transaction History Screen ................................................................... 52 
Figure 2-31: Feedback Review Screen ......................................................................................... 53 
Figure 2-32: System Settings Screen ............................................................................................ 54 
Figure2-33: Splash Screen – Mobile............................................................................................. 55 
Figure 2-34: Authentication Screen – Mobile .............................................................................. 56 
Figure 2-35: Home Dashboard Screen – Mobile .......................................................................... 57 
Figure 2-36: Find a Doctor Screen – Mobile ................................................................................ 58 
Figure 2-37: My Appointments Screen – Mobile ......................................................................... 60 
Figure 2-38: Book Appointment Screen – Mobile ....................................................................... 60 
Figure 2-39: Upload Scan Screen – Mobile .................................................................................. 61 
Figure 2-40: AI Report Screen – Mobile ...................................................................................... 62 
Figure 2-41: Notifications & Profile Settings – Mobile ............................................................... 64 
Figure 2-42: Consultation Chat Screen ......................................................................................... 64 

5 

 
 
1  Chapter 1: Introduction and Problem Definition 

This chapter provides an overview of the MediFusion Vision project, describing its purpose, 
background, and the healthcare challenges it seeks to address. It introduces the motivation 
behind developing an AI-powered medical diagnostic system that combines image analysis and 
report interpretation to assist doctors in making faster and more accurate decisions. The chapter 
discusses the growing need for intelligent diagnostic tools in hospitals due to the increasing 
number of patients, shortage of specialists, and limitations of manual diagnosis. It highlights the 
shortcomings of existing systems that often lack automation, transparency, and integration 
between multiple disease detection processes. Furthermore, it defines the main problem, the 
targeted users — including doctors, patients, and hospital administrators — and the core 
objectives that guide the development of MediFusion Vision. Overall, this chapter lays the 
foundation for understanding the system’s importance, innovation, and the intelligent approach 
used in its design and implementation. 

1.1  Overview of the Project 

MediFusion  Vision  is  an  intelligent,  AI-driven  medical  diagnostic  platform  designed  to  assist 
doctors  and  patients  in  improving  diagnostic  accuracy,  efficiency,  and  collaboration  through 
multimodal data analysis, explainable AI, and automated clinical documentation. The system falls 
under the domain of healthcare technology and artificial intelligence in medical diagnostics and is 
targeted toward healthcare professionals, patients, and clinical administrators seeking faster and 
more transparent diagnostic processes. 

The  proposed  system  integrates  AI-based  image  and  report  analysis,  virtual  and  physical 
consultations, and real-time speech-to-text transcription to enhance medical decision-making and 
reduce manual workloads. It leverages advanced deep learning models to analyze brain MRI and 
retinal  scans  for  conditions  such  as  Brain  Tumor,  Stroke,  Alzheimer’s,  Diabetic  Retinopathy, 
Glaucoma,  and  Age-Related  Macular  Degeneration  (AMD).  Through  explainable  AI  tools  like 
Grad-CAM and SHAP visualizations, doctors can interpret the reasoning behind AI predictions, 
fostering trust and accountability in diagnosis. 

In  addition,  the  platform  allows  patients  to  book  appointments,  upload  scans,  view  diagnostic 
reports,  and  communicate  directly  with  doctors 
through  secure  virtual  consultations. 
Administrators  oversee  the  system  by  managing  user  registrations,  linking  hospital  scans,  and 
monitoring overall performance. By unifying diagnostic intelligence, patient-doctor interaction, 
and  administrative  oversight  into  a  single  platform,  MediFusion  Vision  enhances  healthcare 
accessibility,  accuracy,  and  transparency,  setting  a  foundation  for  next-generation  AI-assisted 
medical systems. 

1.2  Vision Statement 

For  doctors  and  patients  who  need  a  faster  and  more  reliable  way  to  detect  and  manage 
neurological and retinal diseases, Medi Fusion Vision is a web and mobile-enabled system that 

6 

 
 
 
 
 
assists doctors in making accurate, timely diagnoses while also providing patients with an easy-
to-use interface for booking appointments, viewing medical reports, and maintaining their health 
records in one place. Unlike traditional diagnostic practices that often involve delays and heavy 
reliance on manual effort,  our system uses advanced AI models to  automate disease detection, 
reduce diagnostic errors, and improve overall healthcare efficiency. By minimizing the workload 
on doctors and accelerating the diagnostic process, the tool aims to increase survival rates through 
early detection and better patient engagement. 

1.3  Problem Statement 

In the medical field, one of the most overlooked issues is the occurrence of diagnostic errors. 
According to a study by Johns Hopkins University, nearly every individual is likely to experience 
at least one significant diagnostic error in their lifetime. It is estimated that 800,000 people in the 
United States alone either dying or becoming seriously disabled each year due to such errors. 
Neurological  and  vision-related  disorders  are  particularly  impacted  by  delayed  or  incorrect 
diagnoses.  For  example,  Multiple  Sclerosis  (MS)  affects  over  2.8  million  people  worldwide, 
where late diagnosis can lead to irreversible nerve damage. Similarly, Alzheimer’s Disease, a 
Neurogoical  disorder,  currently  impacts  more  than  55  million  people  globally.  Hence,  early 
diagnosis  is  essential  for  effective  intervention  and  care  planning.  Another  similar  disease 
‘Stroke’ remains  the second leading  cause of death  worldwide and the third leading  cause of 
death and disability combined, accounting for approximately 11% of total global deaths. Prompt 
detection plays a vital role in improving patient recovery and survival outcomes.  

Similarly retinal diseases major cause of low vision or blindness which effects huge population 
globally. These also can be cured if detected early. According to the World Health Organization, 
diabetic retinopathy is a major cause of adult-onset blindness, significantly affecting the diabetic 
population. Glaucoma, another widespread condition, impacts over 80 million individuals globally 
and can result in permanent vision loss if not detected in time. Furthermore, age-related macular 
degeneration (AMD) is  expected to  affect  nearly 196 million  people by 2020, with  projections 
indicating further growth. It highlights the importance of early diagnosis for vision preservation. 
Despite the urgency, healthcare professionals often face challenges in diagnosing these conditions 
accurately  due  to  rising  workloads,  limited  time,  and  the  complexity  of  interpreting  diverse 
medical data. In the era of AI, there is an increasing demand for an intelligent diagnostic support 
system  that  can  assist  doctors  by  detecting  these  diseases  early—before  they  lead  to  severe  or 
irreversible harm 

1.4  Problem Solution 

The  proposed  system  provides  an  AI-backed  medical  diagnostic  solution  that  addresses  the 
challenging  task  of  detecting  and  diagnosing  neurological  and  retinal  diseases  in  their  early 
stages. The system design is developed in a way that it assists doctors in analyzing retinal images, 
MRI  scans  and  clinical  reports  which  not  only  allows  accurate  diagnosis  but  also  provide 
descriptive diagnostic reports. The application helps doctors detect serious diseases like brain 
tumour, Alzheimer’s disease, stroke, diabetic retinopathy, glaucoma, and AMD more quickly 
and accurately, so that treatment can start on time and serious damage can be prevented.    

7 

 
 
1.5  Objectives of the Proposed System 

●  BO-1: Facilitate disease detection in early stages and offer descriptive diagnostic reports, 

improving overall treatment outcomes and patient survival rates.    

●  BO-2: Reduce the diagnostic burden on healthcare professionals by providing intelligent 

support for faster and more accurate decision-making. 

●  BO-3:Reduce the cost, time and human error for diagnosis of critical diseases.  

1.6  Scope 

Our  project  aims  to  develop  both  a  web-based  and  mobile-based  medical  diagnostic 
application  to  detect  and  diagnose  acute  diseases  like  brain  tumors,  Alzheimer,  Diabetic 
Retinopathy, Glaucoma and Age-related Macular Degeneration. It will also support diagnosis 
through textual medical reports. 
The scope includes core functionalities for doctors, patients and admin users. The Admin 
will handle system setup and user management, including registering doctors and patients 
and managing  internal  scan uploads. Doctors  will register based on their specialization 
(e.g.,  neurologist,  ophthalmologist)  and  will  have  personalized  dashboards  showing 
appointments, patient profiles and their diagnostic reports. 
Patients  will  register  independently,  create  a  basic  profile,  and  book  either  physical  or 
virtual  appointments  with  doctors  based  on  specialization,  experience,  and  availability. 
The system will support both internal scan uploads by the admin and external uploads by 
patients via the portal. All relevant data, including appointments, reports and scans, will 
be securely stored and linked to the patient’s profile in the database.  
During  consultations,  doctors  will  record  the  patient’s  medical  history  if  required,  add 
notes, and request further diagnostic scans or tests. On follow-up visits, doctors can review 
the scans and run integrated AI models that analyze medical  images or textual reports. 
These models detect and diagnose multiple diseases at once. With the help of Explainable 
AI (like GradCAM), they also show highlighted areas in medical scans that influenced the 
result.  This  helps  doctors  understand  the  AI's  reasoning,  validate  it,  and  finalize  the 
diagnosis with confidence.  
The system then generates a comprehensive diagnostic report, combining AI output and the 
doctor’s expert interpretation. Both are saved in the database and made available to patients 
through their portal.  
The application enforces role-based access control to ensure that sensitive information is 
accessed  only  by  authorized  users.  Doctors  have  the  authority  to  review  and  update 
diagnostic  outcomes,  while  patients  have  controlled  access  to  reports,  summaries,  and 
doctor  notes.  Additionally,  patients  can  initiate  follow-up  appointments  and  view  their 
diagnostic reports.   

8 

 
 
 
 
 
1.6.1  Limitations/Constraints 

●  LI-1: Image and Data Quality Dependency 

The diagnostic accuracy of MediFusion Vision heavily relies on the clarity and resolution of uploaded 
medical scans or reports. Poor-quality MRI or retinal images may reduce AI performance and lead to less 
reliable diagnostic outcomes. 

●  LI-2: Connectivity and System Performance 

Since the system depends on cloud-based AI inference, real-time consultations, and data synchronization, 
a stable internet connection is essential. Network interruptions or limited bandwidth may impact the 
responsiveness of virtual consultations and delay diagnostic report generation. 

●  LI-3: Dataset and Model Generalization Constraints 

AI models are trained on publicly available and institutionally approved datasets. While they perform 
well across general medical cases, variations in demographic or regional data may affect model 
generalization and diagnostic precision for underrepresented populations. 

1.7 Modules 

1.7.1 Module 1: User, Role & Admin Management   

FE-1.1: Patient Registration & Login   
FE-1.2: Doctor Registration & Login (with specialization & experience; approval by Admin)  
FE-1.3: Admin Login and full access to user and system controls   
FE-1.4: Role-Based Dashboard Access (Patient, Doctor, Admin) 
FE-1.5: Admin can approve, reject, or manage registered doctors  
FE-1.6: Patients can view/search doctors by specialization, experience, and availability  
 FE-1.7: Secure logout, session management, and profile editing  
FE-1.8: Admin can review patient profiles, upload internal test reports, and monitor activity logs  
FE-1.9: Admin can perform database backups and audit trails   

1.7.2 Module 2: Patient Medical History & Consultation Notes   

FE-2.1: AI note-taker record doctor-patient conversation during appointments, including 
symptoms and history.  
FE-2.2: AI generates consultation notes and observations, which doctors can review and edit. 
FE-2.3: Patients can view their finalized diagnostic reports and associated patient-friendly summaries in chronological order. Doctor-verified consultation notes are accessible only to the treating doctor and administrators.
FE-2.4: Patient profile shows scan history and finalized diagnostic reports; internal clinical notes and AI-generated drafts are restricted to authorized medical personnel.

1.7.3 Module 3: Appointment & Schedule Management   

FE-3.1: Patients book physical or virtual appointments with selected specialists 
FE-3.2: Admin can view, edit, or delete any appointment 
FE-3.3: Doctors view upcoming appointments and patient profiles 
FE-3.4: Appointment rescheduling, cancellation, and confirmation notifications.  
FE-3.5: View appointment history and real-time status.   

9 

 
 
1.7.4 Module 4: Diagnostic & Scan Management   

FE-4.1: Doctors recommends scans/tests during consultations 
FE-4.2: Patients upload external scans via portal or app   
FE-4.3: Admin uploads scans for in-hospital tests   
FE-4.4: All scans linked to patient ID and accessible by assigned doctors   
FE-4.5: Secure upload with format/size validation and preview   

1.7.5 Module 5: AI Diagnostic Engine   

FE-5.1: Doctor presses a “Start Diagnosis” button after uploading a scan or report. 
FE-5.2: System auto-selects the relevant model (MRI, Retinal or Textual)   
FE-5.3: Brain MRI model analyzes tumor, Alzheimer’s   
FE-5.4: Retinal model analyzes diabetic retinopathy, glaucoma, AMD, hypertensive retinopathy   
FE-5.5: Doctors view AI-generated insights based on the input 
FE-5.6: Doctors can edit, verify, or reject the model output  
FE-5.7: Diagnostic output linked to patient report for further review  

1.7.6 Module 6: Explainable AI & Transparency   

FE-6.1: Visual maps (GradCAM, SHAP) highlight important image regions   
FE-6.2: Short text explanations of why the AI focused on specific areas 
FE-6.3: Helps doctors approve or modify results confidently  
FE-6.4: All explainability data saved with report history 

1.7.7 Module 7: Final Report & Summary Generation   

FE-7.1: Doctor confirms or modifies AI-generated diagnosis   
FE-7.2: Final report includes both AI and doctor inputs   
FE-7.3: System auto-generates a simplified summary for patients   
FE-7.4: Report and summary uploaded to patient portal  

1.7.8 Module 8: Virtual Consultation Management   

FE-8.1: Secure video link/chat room generated for online appointments   
FE-8.2: Logs doctor-patient discussion notes during virtual consultation   
FE-8.3: Real-time note exchange in a shared comment section   
FE-8.4: Comments saved per appointment and linked to report   

1.7.9 Module 9: Payment Gateway Integration   

FE-9.1: Show consultation fee before booking   
FE-9.2: Support multiple payment modes (cards, wallets, transfers) 
FE-9.3: Secure transaction and confirmation invoice   

10 

 
FE-9.4: Patient can view payment history in dashboard   

1.7.10 Module 10: Multi-language Support     

FE-10.1: Interface available in English + Urdu  
FE-10.2: Patient reports and summaries translated for easy understanding  
FE-10.3: Language toggle in settings  
FE-10.4: Doctor notes stay in English for consistency   

1.7.11 Module 11: Feedback & Continuous Learning Module  

FE-11.1: Doctors can flag incorrect or low-confidence AI predictions (e.g., false 
positives/negatives)  
FE-11.2: Flagged cases (including scans/reports, AI output, and doctor comments) are stored in 
a structured feedback database  
FE-11.3: Admins can review flagged cases and validate, correct, or annotate them with ground 
truth  
FE-11.4: The system groups flagged entries and visualizes recurring error patterns by disease or 
modality  
FE-11.5: Analytics dashboard highlights common misclassifications and feedback frequency for 
quality monitoring  
 FE-11.6: Verified feedback cases can be exported as a curated dataset for future retraining of AI 
models   

1.7.12 Module 12: Accessibility & Assistive Tools   

 FE-12.1: Enable screen reader support across all patient interfaces  
 FE-12.2: Add text-to-speech for diagnostic summaries and doctor messages  
 FE-12.3: Provide high-contrast and large-text display options in user profile settings  
 FE-12.4: Voice command support for key actions (e.g., “Book Appointment”, “Read Report”)   

1.8 Related System Analysis/Literature Review 

1.7.1  Literature Review 

Previous  research  in  AI-assisted  medical  diagnostics  and  healthcare  automation  has  focused 
primarily on developing disease-specific detection systems. Studies in medical imaging (e.g., MRI, 
CT, and retinal scan analysis) demonstrate that artificial intelligence can effectively identify early 
disease indicators with high accuracy (Kermany et al., 2018; Pereira et al., 2016). However, most 

11 

 
 
 
 
of these systems  operate within narrow clinical  domains and lack integration  between multiple 
diagnostic sources, such as brain imaging, and retinal data. 
Existing  AI-based  diagnostic  tools  such  as  the  RAIDS  (Retinal  AI  Diagnosis  System),  BTDS 
(Brain Tumor Detection System), and MediScanAI illustrate these limitations. 

●  RAIDS focuses exclusively on retinal disease detection only. 
●  BTDS specializes in MRI-based tumor analysis but does not extend to other neurological 

or retinal conditions. 

●  MediScanAI,  while  capable  of  textual  report  interpretation,  lacks  image-processing 

capabilities and cross-modal analysis. 

Most available systems also fail to provide a centralized medical workflow, where doctors and 
patients can interact seamlessly within the same platform. These tools often require manual data 
transfer between diagnostic models, medical professionals, and patients, reducing efficiency and 
increasing the risk of human error. 
Recent  advancements 
learning 
interpretability tools (e.g., GradCAM and SHAP) have emphasized the need for transparent AI 
decision-making in medical contexts. Research indicates that interpretability is crucial for clinical 
adoption, as it allows healthcare professionals to validate AI outputs and build trust in automated 
systems  (Tjoa  &  Guan,  2020).  Furthermore,  integration  of  speech  recognition  and  automated 
transcription 
improving 
documentation accuracy and reducing physician workload. 

in  Explainable  Artificial  Intelligence  (XAI)  and  deep 

in  medical  consultations  has  shown  promise 

technologies 

in 

The proposed MediFusion Vision system directly addresses these gaps by introducing a multi-
modal AI diagnostic framework that unifies medical imaging and consultation management in a 
single platform. It combines AI-powered disease detection, explainable visualization tools, and an 
AI note-taking assistant to create a transparent, collaborative, and efficient diagnostic ecosystem. 
By  merging  deep  learning,  explainable  AI,  and  real-time  consultation  tools  into  one  solution, 
MediFusion Vision contributes a comprehensive and scalable model for next-generation intelligent 
healthcare systems. 

1.7.2  Related System Analysis 

Application 
Name 
RAIDS  

BTDS   

Table 1.1   Related System Analysis with proposed project solution 

Weakness 

Proposed Project Solution 

 Only  handles  eye  diseases  via  retinal 
images; no support for  other inputs     

Supports retina-based diagnosis alongside 
brain, chest, and lab report analysis 

Only detects brain tumors; lacks support 
for other brain diseases or modalities     

Covers multiple brain-related diseases and 
integrates with chest, eye, and text data     

12 

 
 
 
 
 
 
  
 
 
1.9 Tools and Technologies  

Table 1.2 Tools and Technologies for Proposed Project 

Tools 

Version 

Rationale 

Visual Studio Code 

Android Studio 

2024 

2024 

Figma 

CSC 6 

Docker   

MS Word 

24.x 

2021 

IDE 

For Android app 
testing/emulation 
Design Work 

Deployment &   
Containerization    

Documentation and report writing 

Python 

3.123 

AI Model Development    

Tools 

And 

Technologies 

Pytorch 

2.15    

Analyze MRIs, retinal images   

Jitsi Meet API    

Web-based    

Virtual Video Consultations    

Git    

2.43    

Version Control    

Open AI 

Chatgpt-4 

AI-powered conversational 

assistant for parents and basic 
sign communication 

SHAP/GradCAM    

Latest 

Explainable AI Visuals    

React JS    

17    

Web Development    

PostgreSQL    

Latest 

DBMS    

13 

 
 
 
   
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
                     Flutter 

       0.74+ 

 Cross-platform mobile 
development framework 

1.10 Project Contribution 

The  MediFusion  Vision  system  introduces  several  technical  and  conceptual  contributions  that 
distinguish it from existing AI-based healthcare and diagnostic platforms. 
It integrates artificial intelligence, multimodal medical data processing, and real-time consultation 
management  into  a  unified  web  and  mobile  solution  designed  for  patients,  doctors,  and 
administrators within a secure and explainable diagnostic environment. 
• AI-Powered Multi-Disease Detection: 
Utilizes advanced deep learning models to analyze brain MRI scans and retinal images. The system 
can detect multiple conditions such as Brain Tumor, Stroke, Alzheimer’s, Diabetic Retinopathy, 
Glaucoma, and AMD with improved accuracy and efficiency. 
• Explainable AI Visualization: 
Integrates interpretability tools such as GradCAM and SHAP to visually explain AI predictions. 
This transparency helps doctors validate diagnostic outcomes and enhances clinical trust in AI-
assisted decisions. 
• AI Consultation Note-Taker: 
Employs  speech  recognition  to  automatically  capture  consultation  details,  summarizing  key 
medical  observations.  This  reduces  manual  documentation  effort  for  doctors  and  ensures 
comprehensive, accurate consultation records. 
• Unified Diagnostic Platform: 
Combines multimodal diagnostic capabilities (image, text, and report analysis) into one integrated 
system accessible through both web and mobile applications, reducing dependency on multiple 
separate tools. 
• Role-Based Access Management: 
Implements  secure  access  control  with  dedicated  dashboards  for  patients,  doctors,  and 
administrators,  ensuring  data  confidentiality  and  regulatory  compliance  within  healthcare 
standards. 
• Comprehensive Diagnostic Reporting: 
Generates AI-assisted diagnostic summaries verified by medical professionals, producing reports 
that combine machine intelligence and human expertise for higher reliability. 
• Continuous Learning and Feedback Loop: 
Supports an automated system feedback mechanism that collects post-diagnosis validation data 
from doctors to progressively enhance AI performance through self-learning and retraining. 

Contribution Impact: 
By combining artificial intelligence, explainable visualizations, multimodal diagnostics, and 

14 

 
 
 
 
 
 
automation, MediFusion Vision transforms traditional healthcare workflows into an intelligent, 
transparent, and patient-centered diagnostic experience. 
These contributions improve diagnostic speed, accuracy, and collaboration between patients and 
medical professionals, setting a strong foundation for the future of AI-assisted healthcare 
systems. 

1.11 Relevance to Course Modules 

●  Software Engineering: Applied all major SDLC phases including requirement analysis, system 
design, implementation, and testing to ensure structured and maintainable system development. 

●  Artificial Intelligence & Machine Learning: Implemented deep learning models for disease 
detection and classification using MRI and retinal medical data. Integrated Explainable AI 
(GradCAM and SHAP) for visual interpretation and validation of diagnostic results. 

●  Web & Mobile Application Development: Developed web application using React.js  and 

Flutter for the mobile application, following responsive design and cross-platform UI principles 
for seamless user experience across devices. 

●  Database Systems: Utilized PostgreSQL for secure storage and retrieval of patient records, 
doctor data, appointment details, and diagnostic reports, ensuring relational integrity and 
optimized data management. 

●  Human-Computer Interaction (HCI): Designed patient-friendly and accessible user interfaces 

with features such as Urdu translation, voice assistance, and simplified navigation to 
accommodate users with varying technical proficiency. 

●  Computer Networks & Cloud Computing: Implemented secure, real-time data communication 
for virtual consultations and AI-based report synchronization through cloud deployment and 
encrypted network connections. 

●  Data Science: Applied preprocessing, normalization, and data augmentation techniques on 

multimodal medical datasets to improve model performance and ensure diagnostic reliability. 

15 

 
 
 
2  Chapter 2: Requirement Analysis 

This chapter presents the requirement analysis for the MediFusion Vision system. It defines the 
system’s primary user classes, their interactions  with  the web and mobile applications, and the 
core functional requirements derived from AI-assisted diagnostic modeling and prototype-based 
design. The analysis focuses on how patients, doctors, and administrators utilize key modules such 
as AI diagnosis, consultation management, medical report generation, and system monitoring to 
ensure accurate, transparent, and efficient healthcare delivery. 

2.1 User Classes and Characteristics 

The MediFusion Vision system serves multiple user classes, each with specific goals, roles, and 
interaction patterns.These include Patients, Doctors, and an Administrator. Their characteristics, 
technical proficiency, frequency of system use, and privileges are described below. 

Table 2-1: User Classes of the Proposed System 

User Class 
Patient 

Doctor 

Description 
Patients  are 
the  primary  end-users  who  use 
MediFusion  Vision  to  access  healthcare  services 
through AI-assisted diagnostics. They can register, 
log  in,  search  for  doctors  by  specialization,  and 
schedule  either  virtual  or  in-person  consultations. 
Patients  can  upload  external  medical  scans,  view 
diagnostic  reports,  download  or  share  results,  and 
make  secure  online  payments.  The  interface  is 
designed for simplicity and accessibility, supporting 
Urdu  translation  and  voice-based  navigation  to 
assist users with limited technical experience. 
•  Technical  Proficiency:  Basic 
(general smartphone or web users). 
•  Interaction  Frequency:  Occasional  to  frequent, 
depending on medical needs. 
• Access Mode: Web and mobile application. 
•  Privileges:  Can  register,  log  in,  update  profile, 
book/reschedule/cancel 
search 
appointments, upload scans, make payments, view 
diagnostic 
feedback  or 
complaints. 

reports,  and  submit 

to  moderate 

doctors, 

Doctors  are  verified  medical  professionals  who 
utilize  MediFusion  Vision  to  review  AI-generated 
diagnostic  outcomes,  conduct  consultations,  and 
finalize patient reports. They access detailed patient 
histories, view consultation schedules, and interact 

16 

 
 
 
Administrator 

automatically 

with  the  AI  diagnostic  system  to  verify  findings. 
The  AI  Note-Taker 
records 
consultation details, reducing manual entry. Doctors 
can  view  Explainable  AI  visuals  (GradCAM  and 
SHAP)  to  ensure  diagnostic  transparency  and 
reliability before confirming reports. 
•  Technical  Proficiency:  High 
(trained 
professionals  with  experience  in  digital  tools). 
• Interaction Frequency: Daily, during work shifts 
or 
hours. 
•  Access  Mode:  Web  and  mobile  dashboards. 
•  Privileges:  Can  log  in,  manage  appointments, 
view  patient  data,  conduct  consultations,  use  AI 
diagnostic 
reports, 
communicate  with  patients,  and  provide  medical 
feedback. 

review  and  verify 

consultation 

active 

tools, 

The  Administrator  manages  and  monitors  the 
overall  MediFusion  Vision  platform.  Admins 
approve or reject doctor registrations, oversee user 
management,  monitor  appointments,  and  ensure 
proper  system  operation.  They  are  responsible  for 
uploading  hospital-generated  scans,  maintaining 
audit logs, handling user feedback, and generating 
performance  and  compliance  reports.  The  Admin 
ensures that all AI, data, and consultation modules 
function securely and smoothly across the system. 
•  Technical  Proficiency:  Experienced  system 
operator 
administrator. 
healthcare 
•  Interaction  Frequency:  Daily,  for  system 
monitoring 
administrative  management. 
•  Access  Mode:  Web-based  administrative 
preferred). 
(desktop 
dashboard 
•  Privileges:  Can  approve/reject  doctor  accounts, 
manage  users,  monitor  appointments,  upload 
hospital scans, maintain audit logs, handle feedback 
and  complaints,  and  generate  system  performance 
insights. 

and 

or 

2.1.1  Use case Diagram 

The  following  Use  Case  Diagrams  illustrate  the  interactions  between  the  main  users  of  the 
MediFusion  Vision  system  and  its  core  functionalities.  Each  diagram  represents  how  patients, 
doctors, and the administrator interact with different modules to perform diagnostic, consultation, 

17 

 
 
 
 
and  administrative  tasks,  ensuring  accurate  medical  evaluation  and  efficient  healthcare 
management. 

                                                            Figure 2-1: Use Case Diagram for Admin 

18 

 
 
 
 
                                                             Figure 2-2: Use Case Diagram for Doctor 

19 

 
 
                                                  Figure 2-3: Use Case Diagram for Patient 

20 

 
 
 
2.1.2  Requirement Identifying Technique 

This section describes the techniques used to identify and document the functional requirements 
of the MediFusion Vision system. 

For this project, a Mockup-Based Requirement Analysis approach is used. This method was 
selected because the system involves multiple user roles that are Admin, Doctor, and Patient 
interacting through distinct dashboards and medical diagnostic interfaces. Using mockups 
enables a clear understanding of how each user will interact with the system and allows 
functional requirements to be derived directly from visible interface behaviors. 

1. Mockup-Based Requirement Analysis 

This technique captures all functional requirements triggered by user interactions. 
 User interface mockups were created to visualize how doctors, patients, and admins perform 
their respective tasks, such as uploading scans, running diagnostic models, booking 
consultations, and generating reports. 

Each screen was assigned a unique Mockup ID (e.g., M1 for Login Page, M2 for Doctor 
Dashboard, M3 for Patient Portal, M4 for AI Diagnosis Screen, M5 for Final Report Page). 
 Every interactive element—buttons, forms, menus, upload fields, and charts—was examined, 
and a corresponding Functional Requirement (FR) was derived, describing the system’s 
expected response. 

Steps Followed 

1.  Identify all major system features and group them into separate mockup screens. 
2.  Assign a unique Mockup ID to each screen. 
3.  Create interactive mockups using Figma to represent real-world workflows. 
4.  Identify all actionable UI components on each mockup (e.g., “Upload Scan,” “Run AI 

Model,” “Book Appointment”). 

5.  Derive a testable functional requirement for each interaction describing what the system 

should do. 

6.  Document all requirements in a structured table (Section 2.2) linking each FR to its 

mockup ID and element.  

This process ensures complete alignment between user interface design and functional 
behavior, maintaining traceability between visual design elements and their underlying system 
functionality 

21 

 
 
2.1.3  Backend Process Requirements (Event–Response Table Technique) 

While  mockups  capture  the  front-end  interactions  of  the  MediFusion  Vision,  many  critical 
operations  take  place  entirely  in  the  backend.  These  include  user  authentication,  doctor 
verification,  medical  scan  validation,  AI-driven  diagnosis,  consultation  note  generation,  report 
creation, and model retraining based on flagged cases. To accurately represent these system-driven 
workflows, the Event–Response Table Technique was applied. 

This  technique  identifies  key  backend  events,  the  system  state  during  each  event,  and  the 
automated responses triggered by the system. It ensures that real-time and background processes 
such  as  AI  inference,  data  storage,  and  automated  notifications,are  clearly  defined  during  the 
requirements phase without delving into implementation details. 

Steps Followed: 
• Identify backend or automated events such as doctor approval, scan uploads, consultation 
sessions, AI diagnosis execution, and model retraining triggers. 
• Define the system state during each event. 
• Specify the automated system response, including data validation, AI processing, report 
generation, and user notifications. 

Table 2-2: Event Response Table of the Proposed System 

Event 
Patient registers 

Doctor registers with 
qualifications 
Admin reviews 
doctor registration. 
Patient logs in 

Doctor logs in 

Patient books 
appointment (virtual 
or physical) 
Patient or Doctor 
cancels or 

System State 
Registration service 
active 
Registration service 
active 
Doctor marked as 
Pending Approval. 
Valid credentials 
provided 
Valid credentials 
provided 
Doctor available 
and slot open. 

Response / System Behavior 
1. Store patient details in database. 
2. Send confirmation message/email. 
1. Save doctor data and qualifications. 
2. Mark status as Pending Approval. 
1. Approve or reject doctor. 
2. Update status accordingly and notify doctor 
Authenticate and redirect to doctor dashboard. 

Authenticate and redirect to doctor dashboard. 

1. Confirm appointment. 
2. Update both doctor and patient schedules. 

Appointment exists.  1. Update appointment status in database. 

2. Notify all concerned users (patient, doctor, and 
admin). 

22 

 
 
 
 
 
 
 
reschedules 
appointment 
Patient uploads an 
image file for 
diagnosis 

Patient 
authenticated; 
upload service 
active. 

Doctor starts 
consultation session 

Patient scans 
available; doctor 
authenticated. 

AI Note Taker 
detects speech or 
discussion. 

Consultation 
ongoing; AI 
transcription service 
running. 

Doctor triggers AI 
diagnosis on patient 
scans 

Scans validated; AI 
model idle; 
consultation active. 

Doctor reviews and 
verifies the AI 
diagnosis 

Consultation active; 
AI result displayed. 

Final report 
generation triggered 

Doctor verification 
complete 

Doctor flags a case as 
‘AI Incorrect’ 
(Flagged case). 

Doctor verification 
step 

Patient requests 
report download. 

Report status is 
“Verified” and 
available 

1. Validate file type  and size. 
2. If file fails validation → reject upload, log 
error, and return “Invalid file format or size” to 
patient. 
3. If validation passes → store image securely in 
database/cloud storage. 
4. Update patient record status to “Uploaded 
(Awaiting Consultation)” 
1. Activate AI Note Taker to transcribe consultation 
in real-time. 
2. Load patient’s uploaded scans for review. 
3. Begin consultation timer/session tracking. 
1. Continuously transcribe speech into text. 
2. Generate consultation notes draft in background. 
3. Save progressive transcript to to database under 
patient’s profile 

1.Send scan to AI model for inference. 
2. Generate diagnostic result + explainable 
visualization (e.g., Grad-CAM heatmap). 
3. Store results and confidence score in DB. 
4. Display to doctor within session. 
1. Doctor confirms or modifies AI findings. 
2. Final verification status saved (“Verified by 
Doctor”). 
3. AI notes and doctor remarks merged. 
1. Combine AI results, doctor’s notes, and 
explainable visuals into one report. 
2. Generate PDF with digital signature and 
timestamp. 
3. Store in secure records. 
4. Notify patient that the final report is available for 
download. 
1. Mark record with FlaggedForRetrain + reason + 
doctor comments. 
 2. Collect all relevant artifacts (scan, AI output, 
doctor-corrected label, notes). 
3. Add flagged-cases dataset queue. 
4. Notify ML team/admin dashboard.  
1. Retrieve report from storage. 
2. Generate PDF and audit trail entry. 
3. Send secure download link via email. 

23 

 
 
2.2  Functional Requirements 

This section describes the functional requirements of the MediFusion Vision system, derived 
from user interactions and mockups. To ensure clarity and maintain a stable specification, each 
requirement is documented at the feature level. Each functional requirement includes: 

●  A unique identifier (e.g., FR-1.1, FR-3.2). 
●  A clear and testable requirement statement. 
●  A reference to the originating mockup screen. 
●  An optional Business Rule, if the behavior is governed by a domain-specific policy, 

condition, or constraint. 

2.2.1  Recommended Format: 

This  subsection  presents  the  standard  format  used  to  record  and  organize  all  functional 
requirements identified through the Mockup-Based Requirement Analysis. Each requirement is 
derived from specific UI elements or interactions and is documented in a consistent, tabular form 
to ensure traceability, clarity, and ease of verification. 

M1-Login Screen 

                                                  Figure 2‑4:  Login Page  

24 

 
 
 
 
 
 
 
 
                                                      Table 2-3: Functional Requirements derived from Mockup M1 

Feature (from 
UI element) 

Functional Requirement (FR-ID 
Statement) 

Business Rule 

Email input 
field 

FR1.1 The system shall allow users to 
enter their registered email address to log 
in. 

Email must be in a valid 
format and already registered. 

Password 
input field 

FR1.2 The system shall allow users to 
enter their password to log in. 

Password must match the 
email address provided. 

Password 
visibility 
toggle 

FR1.3 The system shall allow users to 
toggle the visibility of the entered 
password. 

For user convenience only; 
visibility does not affect 
authentication. 

Login as radio 
buttons 

FR1.4 The system shall allow users to 
select their login type: Patient, Doctor, or 
Admin. 

User role determines 
dashboard and access rights. 

Login button 

FR1.5 The system shall authenticate users 
and redirect them to their respective 
dashboards upon successful login. 

Only active, verified accounts 
can log in. 

Register link 

FR1.6 The system shall provide a link to 
the registration page for new account 
creation. 

Only for users who do not 
have an account yet. 

Forgot 
password link 

FR1.7 The system shall provide a link for 
users to initiate the password recovery 
process. 

Password reset process must 
verify user identity. 

M2-Dashboard Screen (Doctor Web) 
The Dashboard screen provides doctors an at-a-glance overview of their upcoming appointments, 
recent  AI  diagnostic  results,  and  pending  medical  reports  for  review.  It  allows  navigation 
todetailed views and one-click actions for core clinical tasks. 

25 

 
                                        
                                               Figure 2‑6: Dashboard Screen – Doctor Web                                                                                       

                                   Table 2-4: Functional Requirements derived from Mockup M2 

Feature (from UI 
element) 

Functional Requirement (FR-ID 
Statement) 

Business Rule 

Upcoming 
Appointments list 

FR2.1 The system shall display the doctor's 
scheduled upcoming appointments with 
basic patient details. 

Only appointments assigned 
to the logged-in doctor are 
shown. 

View All 
Appointments link 

FR2.2 The system shall provide a link to 
the full appointments calendar for the 
doctor. 

Link accessible only to 
authorized users. 

AI Analysis 
Results panel 

FR2.3 The system shall summarize recent 
AI analyses performed for the doctor's 
patients. 

Only results for patients 
under this doctor's care are 
shown. 

Run New Analysis 
button 

FR2.4 The system shall allow the doctor to 
initiate a new AI diagnostic workflow. 

Only accessible to doctors 
with required permissions. 

View All Results 
button 

FR2.5 The system shall provide access to a 
complete list of AI analysis results. 

Accessible to doctors for 
their own patients only. 

Pending Medical 
Reports list 

FR2.6 The system shall display a list of 
medical reports needing the doctor’s 
review. 

Only reports assigned for the 
logged-in doctor's review. 

26 

 
 
Feature (from UI 
element) 

Functional Requirement (FR-ID 
Statement) 

Business Rule 

Review All 
Reports link 

FR2.7 The system shall provide navigation 
to a page for reviewing all pending reports. 

Only accessible to authorized 
users. 

M3-AI Diagnostic Workflow Screen 
This screen allows doctors to upload patient medical scans, run AI-powered diagnostic analysis, 
view results and insights, and review patient details. It streamlines the AI diagnostics process for 
clinical decision support. 

                                   Figure 2‑7: AI Diagnostic Workflow Screen 

                                                 Table 2‑5: Functional Requirements derived from Mockup M3 

Feature (from UI 
element) 

Functional Requirement (FR-ID 
Statement) 

Business Rule 

Patient Information 
panel 

FR3.1 The system shall display patient 
demographic and identifier details for 
reference. 

Only accessible for 
authorized patients. 

View Patient Details 
button 

FR3.2 The system shall allow navigation 
to a detailed patient profile view. 

Profile access follows 
hospital data privacy 
policies. 

27 

 
 
 
Feature (from UI 
element) 

Functional Requirement (FR-ID 
Statement) 

Business Rule 

Upload Medical Scan 
(drag/drop & browse) 

FR3.3 The system shall allow doctors to 
upload medical scans in supported formats. 

Run AI Model button 

FR3.4 The system shall start the AI 
diagnostic analysis on the uploaded scan. 

Only DICOM, JPEG, 
PNG, or TIFF formats 
allowed. 

Button enabled only 
when a valid scan is 
selected. 

AI Analysis Summary 
panel 

FR3.5 The system shall display the 
predicted diagnosis, confidence score, and 
key findings from AI. 

Results shown only after 
completion of analysis. 

AI Insight 
Visualization section 

FR3.6 The system shall show AI 
visualizations (e.g., GradCAM heatmaps) 
to explain model attention. 

Available only for 
compatible scan types. 

M4-Appointment Management Screen 
Doctors manage appointments using a calendar interface, which shows all scheduled, upcoming, 
and past appointments. The screen allows adding new appointments, switching calendar views, 
and viewing appointment details. 

                                                          Figure 2-8: Appointment Management Screen 

28 

 
 
 
                                   Table 2-6: Functional Requirements derived from Mockup M4 

Feature (from UI 
element) 

Functional Requirement (FR-ID 
Statement) 

Business Rule 

Add New Appointment 
button 

FR4.1 The system shall allow doctors 
to schedule new patient appointments 
via a form. 

Only doctors with 
scheduling privileges may 
use. 

Calendar view 
(Month/Week/Day 
toggle) 

FR4.2 The system shall let users 
switch between monthly, weekly, and 
daily calendar views. 

Default view is Month on 
page load. 

Appointment entries on 
calendar 

FR4.3 The system shall display 
individual appointment details as 
entries on the calendar. 

Only appointments for the 
logged-in doctor appear. 

Navigate 
month/week/day and 
'Today' 

FR4.4 The system shall allow users to 
navigate to different dates using 
arrows and the Today button. 

Cannot view appointments 
beyond their assigned 
role/date scope. 

M5-AI Note Taker Screen 
On  this  screen,  the  system  auto-generates  consultation  notes  from  patient-doctor  dialogue,  and 
allows doctors to add edits or corrections. This helps in maintaining accurate, comprehensive visit 
records efficiently. 

                                                                  Figure 2-9: AI Note Taker Screen   

29 

 
 
 
 
                                       Table 2-7: Functional Requirements derived from Mockup M5 

Feature (from UI 
element) 

Functional Requirement (FR-ID 
Statement) 

Business Rule 

AI-Generated Consultation 
Notes 

FR5.1 The system shall transcribe and 
display consultation dialogue as 
structured notes using AI. 

Only available for active, 
ongoing consultations. 

Doctor's 
Corrections/Additions 
editor 

FR5.2 The system shall allow the 
doctor to edit or append to the AI-
generated notes. 

Changes must be saved 
for inclusion in final 
report. 

AI Status toggle 
(Manual/Auto Summary) 

FR5.3 The system shall let the doctor 
switch between manual note entry and 
AI-powered auto-summary. 

Default is AI Summary 
but can be changed at 
any time. 

Save Notes, Attach to 
Report, Discard 

FR5.4 The system shall allow doctors 
to save notes, attach them to reports, or 
discard unsaved changes. 

Attaching is only 
possible after notes are 
saved. 

M6-Virtual Consultation Screen 
This  screen supports secure video consultations between doctors and patients. Features include 
live video, chat, call status, and controls for muting, ending the call, or adjusting the video view. 

                                                             Figure 2-10: Virtual Consultation Screen  

30 

 
 
 
 
                                            Table 2-8: Functional Requirements derived from Mockup M6 

Feature (from 
UI element) 

Functional Requirement (FR-ID 
Statement) 

Business Rule 

Live video call 
interface 

FR6.1 The system shall provide real-time 
video and audio communication between 
doctor and patient. 

Only scheduled/authorized 
consultations. 

Call duration 
display 

FR6.2 The system shall track and display 
current call duration. 

Shows duration in hh:mm:ss 
format. 

Mute, Video 
On/Off, End Call 
buttons 

FR6.3 The system shall allow real-time 
muting/unmuting, camera toggle, and 
ending of calls. 

Only participants may 
control their own stream. 

Text chat panel 

FR6.4 The system shall enable secure text-
based messaging during the call. 

Messages are accessible only 
during the call. 

Message input 
field 

FR6.5 The system shall provide a field to 
send messages during the consultation. 

Disabled if call is 
ended/disconnected. 

M7-Patient Details Screen 
Displays detailed demographic, contact, and medical history information for an individual patient, 
with quick actions to view reports or start AI diagnostics. For use by doctors and clinical staff. 

                                                             Figure 2-11: Patient Details Screen    

31 

 
 
 
 
                                         Table 2-9: Functional Requirements derived from Mockup M7 

Feature  (from  UI 
element) 

Functional 
Statement) 

Requirement 

(FR-ID 

Business Rule 

Patient 
Demographics 
panel 

View Reports 
button 

FR7.1 The system shall display age, 
gender, contact details, and patient ID. 

Data only for the 
selected/authorized patient. 

FR7.2 The system shall provide quick 
access to all of the patient's diagnostic 
reports. 

Only doctors/authorized staff 
can access reports. 

Initiate AI 
Diagnostic button 

FR7.3 The system shall allow the doctor 
to start a new AI diagnostic workflow for 
the patient. 

Only accessible if sufficient 
patient data exists. 

Medical History 
(expandable) 

FR7.4 The system shall show the patient's 
detailed medical history in expandable 
sections. 

Entries updated by authorized 
medical staff only. 

M8-Patient List Screen 
Allows  clinicians  to  view,  filter,  and  search  all  patients  assigned  to  their  care,  with  status 
indicators, action buttons, and patient summary info in a sortable table. 

                                                            Figure 2-12: Patient List Screen 

32 

 
 
 
 
 
 
 
                               Table 2-10: Functional Requirements derived from Mockup M8 

Feature 
UI element) 

(from 

Functional Requirement (FR-ID Statement)  Business Rule 

Search bar 

FR8.1 The system  shall  allow users to  search 
patients by name or ID. 

Search  applies  only 
to 
patients under clinical care. 

Filter buttons 

FR8.2  The  system  shall  allow  filtering  by 
recent  visits,  critical  conditions,  and  new 
patients. 

Only  one  filter  active  at  a 
time. 

Patient List table 

FR8.3  The  system  shall  show  a  table  with 
name, ID, date of birth, appointment date, and 
condition. 

Only  authorized  patients 
shown. 

Add New Patient 
button 

FR8.4  The  system  shall  allow  clinicians  to 
register new patients into the system. 

Registration requires unique 
email or ID. 

Condition 
indicator badges 

FR8.5 The system shall visually display patient 
health status (e.g., Stable, Critical). 

Condition  is  updated  based 
on clinical records. 

View 
button 

Details 

FR8.6 The system shall provide navigation to 
the full details screen for the selected patient. 

with 
clinicians 
Only 
clearance can access details. 

Pagination 
controls 

FR8.7  The  system  shall  paginate  the  list, 
showing  navigation  for  previous  and  next 
pages. 

Default  page  size  set  by 
system configuration. 

M9-Final Diagnostic Report Screen 
Presents the finalized, detailed report of a patient’s diagnosis, findings, and AI-generated analysis 
to the doctor for review or sharing. Ensures delivery of accurate results, including radiological and 
AI-authored sections. 

33 

 
 
 
                                                       Figure 2-13: Final Diagnostic Report Screen 

                                          Table 2-11: Functional Requirements derived from Mockup M9 

Feature (from 
UI element) 

Functional Requirement (FR-ID 
Statement) 

Business Rule 

Patient Report 
panel 

FR9.1 The system shall display finalized 
diagnostic reports including patient and 
physician details. 

Only viewable once 
finalized and by authorized 
staff. 

Diagnosis & 
Findings section 

FR9.2 The system shall display clinical 
diagnosis and radiographic findings in detail. 

Entries are write-protected 
after finalization. 

AI Analysis 
Summary section 

FR9.3 The system shall present AI-generated 
explanations and probabilities for diagnoses. 

AI summary shown only for 
supported scan/reports. 

Finalized status 
badge 

FR9.4 The system shall display a clear 
indicator when a report is finalized. 

Report cannot be edited 
once finalized. 

M10-Patient Registration Screen 
This screen enables new patients to create an account by entering personal and contact information 
(name, age, national ID, email, password). 

34 

 
 
                                  
 
 
 
                                                  Figure 2-14: Patient Registration Screen 

                              Table 2-12: Functional Requirements derived from Mockup M10 

Feature (from 
UI element) 

Full Name, Age, 
CNIC fields 

Functional Requirement (FR-ID Statement)  Business Rule 

FR10.1 The system shall allow patients to 
provide their name, age, and national ID 
during registration. 

CNIC must be valid and 
unique in the system. 

Email field 

FR10.2 The system shall allow patients to 
enter an email address for account creation. 

Email must be unique and 
in a valid format. 

Password field 

FR10.3 The system shall allow patients to set 
a secure password during registration. 

Password must meet system 
security criteria. 

Register button 

FR10.4 The system shall create a new patient 
account upon valid registration submission. 

Registration is successful 
only when all fields are 
valid. 

M11-Patient Dashboard Screen 
On login, the patient dashboard displays a welcome message, shortcuts (book appointment, upload 
scan, view reports), upcoming appointments, and yearly report count. 

35 

 
 
 
 
                                              Figure 2-15: Patient Dashboard Screen 

                              Table 2-13: Functional Requirements derived from Mockup M11 

Feature (from UI 
element) 

Functional Requirement (FR-ID 
Statement) 

Business Rule 

Welcome message 

FR11.1 The system shall greet the patient 
and summarize recent activity on dashboard 
load. 

Only authenticated 
patients view this content. 

Book New 
Appointment 
button 

FR11.2 The system shall provide a shortcut 
to initiate appointment booking. 

Visible only to active 
patients. 

Upload New Scan 
button 

FR11.3 The system shall permit scan upload 
access for AI diagnostics. 

Upload allowed for 
verified users only. 

View All Reports 
button 

FR11.4 The system shall navigate to the 
patient’s full diagnostic report history. 

Access limited to patient's 
own records. 

Upcoming 
Appointments list 

FR11.5 The system shall display all 
scheduled future consultations for the 
patient. 

Only future appointments 
for logged-in patient 
shown. 

36 

 
 
 
Feature (from UI 
element) 

Functional Requirement (FR-ID 
Statement) 

Business Rule 

Appointment status 
badges 

FR11.6 The system shall indicate status of 
each appointment (Confirmed/Pending). 

Total Reports 
indicator 

FR11.7 The system shall show the total 
number of reports for the year. 

Status updated 
dynamically from 
backend. 

Count includes only 
finalized, available 
reports. 

M12-Doctor Search Screen 
Patients  can  search,  filter,  and  browse  for  doctors  using  search  and  specialty  filters,  and  view 
trending searches and doctor cards. 

                                                     Figure 2-16: Doctor Search Screen 

                                        Table 2-14: Functional Requirements derived from Mockup M12 

Feature (from UI 
element) 

Functional Requirement (FR-ID 
Statement) 

Business Rule 

Search bar 

FR12.1 The system shall allow 
searching for doctors by name, 
specialization, or condition. 

Only verified users may 
search doctors. 

37 

 
 
 
 
Feature (from UI 
element) 

Functional Requirement (FR-ID 
Statement) 

Business Rule 

Specialization, Degree, 
Availability filters 

FR12.2 The system shall offer filters to 
refine doctor searches. 

Only one filter category 
may be active at once. 

Trending Doctor 
Searches 

FR12.3 The system shall show popular 
or trending search terms for quick 
selection. 

Suggestions based on 
recent search analytics. 

Available Doctors list 

FR12.4 The system shall display brief 
profiles for each available doctor. 

Only currently available 
doctors accepting patients 
shown. 

View Profile button 

FR12.5 The system shall display full 
doctor profile details when selected. 

Only patient users can view 
doctor profiles. 

M13-Doctor Profile Screen 
Patients view a detailed doctor profile (photo, specialty, reviews, background, qualifications), and 
can book an appointment. 

                                                                  Figure 2-17: Doctor Profile Screen 

38 

 
 
 
 
 
 
 
 
                                       Table 2-15: Functional Requirements derived from Mockup M13 

Feature (from UI 
element) 

Functional Requirement (FR-ID 
Statement) 

Business Rule 

Doctor photo, name, 
specialty 

FR13.1 The system shall display 
doctor’s image, full name, and specialty. 

Shown only for active 
doctors. 

Ratings and reviews 

FR13.2 The system shall show average 
rating and review count per doctor. 

Reviews only by verified 
patients. 

Experience, education, 
work history 

FR13.3 The system shall show doctor's 
experience and education background. 

Data editable only by 
doctor/admin. 

Book Appointment 
button 

FR13.4 The system shall allow initiating 
booking for a listed doctor. 

Enabled only if doctor has 
available time slots. 

M14-Appointment Booking Screen 
Patients  select  their  doctor,  date,  and  consultation  slot,  record  the  reason,  and  confirm  with 
payment details. 

                                                            Figure 2-18: Appointment Booking Screen 

39 

 
 
 
 
 
 
 
 
 
                                   Table 2-16: Functional Requirements derived from Mockup M14 

Feature (from UI 
element) 

Functional Requirement (FR-ID 
Statement) 

Business Rule 

Doctor card (name, 
specialty) 

FR14.1 The system shall show selected 
doctor details for appointment. 

Only active and available 
doctors are eligible. 

Select Date field 

FR14.2 The system shall let patients pick a 
valid consultation date. 

Only future, available dates 
are selectable. 

Select Time Slot 
buttons 

FR14.3 The system shall present free time 
slots for appointments. 

Only unbooked slots are 
shown. 

Reason for 
Consultation field 

FR14.4 The system shall require the reason 
for visit entry. 

Field required for 
submission. 

Payment Method 
option 

FR14.5 The system shall collect and 
process payment method for appointments. 

Payment required prior to 
confirmation. 

M15-Payment Confirmation Screen 
Patients receive payment summary, transaction info, method used, receipt and service details after 
booking. 

                                                             Figure 2-19: Payment Confirmation Screen  

40 

 
 
 
 
 
 
 
 
                                   Table 2-17: Functional Requirements derived from Mockup M15 

Feature (from UI 
element) 

Functional Requirement (FR-ID 
Statement) 

Business Rule 

Transaction 
Summary section 

FR15.1 The system shall show payment 
transaction summary and confirmation. 

Receipt only after 
payment is completed. 

Service Details 
section 

FR15.2 The system shall display details of the 
purchased consultation. 

Details only of the current 
payment. 

Payment Method 
info 

FR15.3 The system shall present card type, 
masked card number, and expiry date. 

Sensitive information is 
masked for privacy. 

Patient Info card 

FR15.4 The system shall display patient’s 
name, ID, email, and phone for verification. 

Info visible only to 
logged-in patient. 

M16-Scan Upload Screen 
Patients upload supported medical scans (MRI, Retina, etc.), choose file, and trigger AI analysis 
for diagnostics. 

                                                                         Figure 2-20: Scan Upload Screen 

41 

 
 
 
 
 
 
 
 
                                       Table 2-18: Functional Requirements derived from Mockup M16 

Feature (from UI 
element) 

Functional Requirement (FR-ID 
Statement) 

Business Rule 

Scan type tabs 
(MRI/Retina/Report) 

FR16.1 The system shall let patients 
select the scan type before uploading a 
file. 

Only supported scan 
types can be chosen. 

Drag & drop/Browse file 
area 

FR16.2 The system shall accept scans 
dragged-and-dropped or selected for 
upload. 

Formats must be .dcm, 
.nii, .nrrd only. 

Upload Scan button 

FR16.3 The system shall upload the 
chosen scan to the server. 

Upload button enabled 
only for supported 
formats. 

Run AI Analysis button 

FR16.4 The system shall enable AI 
analysis after successful upload. 

Only possible after 
upload is complete. 

M17-AI Analysis Results Screen 
Shows  AI  diagnostic  results  for  uploaded  scan:  visualization,  probability  score,  downloadable 
report, and sharing options. 

                                                                 Figure 2-21: AI Analysis Results Screen 

42 

 
 
 
 
 
                                    Table 2-19: Functional Requirements derived from Mockup M17 

Feature (from UI 
element) 

Functional Requirement (FR-ID 
Statement) 

Business Rule 

GradCAM 
Visualization panel 

FR17.1 The system shall display AI 
GradCAM visualization for the scan 
analyzed. 

Only for compatible scan 
types. 

AI Prediction 
Summary 

FR17.2 The system shall show diagnostic 
label, probability, and summary. 

Displayed only after 
analysis is finished. 

Download Full 
Report button 

FR17.3 The system shall let patients 
download complete AI result reports. 

Download enabled only 
after analysis completion. 

Share with Doctor 
button 

FR17.4 The system shall permit patients to 
instantly share results with their doctor. 

Functional only if report is 
available. 

Request Second 
Opinion button 

FR17.5 The system shall let patients 
request a specialist review after result. 

Button enabled only if 
initial result shown. 

Scan Information 
card 

FR17.6 The system shall display basic 
details of the scan just analyzed. 

Shows just-uploaded scan 
information only. 

M-18-Feedback Screen 
Patients  provide  overall  satisfaction  rating,  aspect  feedback  via  sliders,  and  optionally  share 
written comments. 

                                                                        Figure 2-22: Feedback Screen 

43 

 
 
 
 
 
 
                             Table 2-20: Functional Requirements derived from Mockup M18 

Feature (from UI 
element) 

Functional Requirement (FR-ID 
Statement) 

Business Rule 

Overall Satisfaction 
stars 

FR18.1 The system shall allow patients to 
rate their experience with star ratings. 

Only completed 
consultations can be rated. 

Navigation, Doctor, 
AI sliders 

FR18.2 The system shall allow detailed 
scores for navigation, doctor, and AI clarity. 

Sliders set before 
feedback submission. 

Detailed Comments 
field 

FR18.3 The system shall let patients enter 
freetext comments about their experience. 

Optional; field can be left 
blank. 

Submit Feedback 
button 

FR18.4 The system shall store and submit 
patient’s feedback in the system. 

Only stores if mandatory 
fields are filled. 

M19-Dashboard Overview (Admin) 
The admin dashboard shows high-level stats (doctors, patients, appointments, reports) and visual 
analytics on clinic activity and scan distributions. 

                                                               Figure 2-23: Dashboard Overview – Admin  

44 

 
                             
 
 
 
 
 
 
                                          Table 2-21: Functional Requirements derived from Mockup M19 

Feature (from UI 
element) 

Functional Requirement (FR-ID 
Statement) 

Business Rule 

Total Doctors, Active 
Patients, etc. cards 

FR19.1 The system shall display real-time 
counts for doctors, patients, appointments, 
and reports. 

Counts pulled from 
backend databases. 

Recent Patient & 
Appointment Activity 
chart 

FR19.2 The system shall show time-series 
charts for patient registrations and 
appointments. 

Chart data refreshed 
periodically. 

Scan Type Distribution 
chart 

FR19.3 The system shall visualize the 
breakdown of scan types stored on 
platform. 

Visuals update in sync 
with current scan 
repository. 

M20-Doctor Management Screen 
Facilitates admin review, approval, editing, or rejection of doctors, with stats and searchable doctor 
cards. 

                                                                      Figure 2-24: Doctor Management Screen 

                                           Table 2-22: Functional Requirements derived from Mockup M20 

45 

 
 
 
 
 
Feature (from UI element) 

Functional Requirement 
(FR-ID Statement) 

Business Rule 

Stats (Total, Approved, etc.) 

Doctor search bar 

Doctor status badges 
(Approved/Pending/Rejected) 

Approve / Reject buttons 

Edit button 

Add Doctor button 

FR20.1 The system shall show 
total, approved, pending, and 
rejected doctor counts. 

Doctor status auto-
calculates based on 
verification. 

FR20.2 The system shall 
allow searching doctors by 
name or email. 

FR20.3 The system shall 
display status indicators per 
doctor card. 

FR20.4 The system shall 
enable admin to approve or 
reject a doctor's registration. 

Search returns matches on 
key fields only. 

Badge updates as admin 
actions occur. 

Only pending doctors can 
be approved/rejected. 

FR20.5 The system shall let 
admin edit doctor profile 
details. 

Editable only for 
approved/pending 
doctors. 

FR20.6 The system shall 
provide a button for 
registering a new doctor in the 
system. 

Only admins can use this 
function. 

M21-Patient Management Screen 
Enables admins to search, list, update, and manage all patients, with filtering and status indicators. 

                                                    Figure 2-25: Patient Management Screen 

46 

 
 
 
                                       Table 2-23: Functional Requirements derived from Mockup M21 

Feature (from UI 
element) 

Search bar 

Functional Requirement (FR-ID Statement)  Business Rule 

FR21.1 The system shall enable searching of 
patients by name or ID. 

Search limited to 
authorized admin only. 

Apply Filters 
button 

FR21.2 The system shall let admin filter 
patient list by various criteria (status, date). 

Only one filter set can be 
active at a time. 

All Patients table 

FR21.3 The system shall display a paginated 
table of patient profiles and contact info. 

List refreshes on 
new/edited data entry. 

Patient status 
badges 

FR21.4 The system shall display current status 
(Active, Pending, Inactive) for patients. 

Status reflects record and 
appointment state. 

Edit, Delete icons  FR21.5 The system shall let admin edit or 

remove a patient profile. 

Deletion may require 
confirmation dialog. 

Add New Patient 
button 

FR21.6 The system shall provide an option to 
add a new patient manually. 

Only admins can perform 
patient addition. 

Pagination 
controls 

FR21.7 The system shall paginate patient list 
as per system page size configuration. 

Default page size set in 
settings. 

M22-Appointment Logs 
Grants admins access to all appointment history, with powerful filters and direct action viewing. 

47 

 
 
 
                                                   Figure 2-26: Appointment Logs Screen 

                                                 Table 2-24: Functional Requirements derived from Mockup M22 

Feature (from UI 
element) 

Functional Requirement (FR-ID Statement) 

Business Rule 

Date/Doctor/Status 
filters 

FR22.1 The system shall let admin filter 
appointments by date range, doctor, or status. 

Search box 

FR22.2 The system shall provide search for 
appointments by patient or doctor name. 

Apply Filters button  FR22.3 The system shall update the log view 

with matching appointment results. 

Appointments table 

FR22.4 The system shall display a detailed log of 
all appointments, with core fields shown. 

Filters may be 
combined for 
complex queries. 

Only authorized 
admins can access 
all records. 

Results update in 
real time. 

Table supports 
pagination and 
sorting. 

48 

 
 
 
 
 
 
Feature (from UI 
element) 

Appointment status 
badges 

Functional Requirement (FR-ID Statement) 

Business Rule 

FR22.5 The system shall indicate state of each 
appointment 
(Confirmed/Pending/Completed/etc). 

Status pulled from 
backend for 
accuracy. 

View Details action 

FR22.6 The system shall provide action to see 
detailed view of a selected appointment. 

Only for 
appointments in 
admin's permitted 
scope. 

M23-Scan Repository Screen 
Shows and manages all patient scan files in the system, with filters, views, and direct actions. 

                                                       Figure 2-27: Scan Repository Screen 

                                 Table 2-25: Functional Requirements derived from Mockup M23 

Feature (from UI 
element) 

Functional Requirement (FR-ID 
Statement) 

Business Rule 

Scan Type & Time 
filters 

FR23.1 The system shall filter scan records 
by type and upload date. 

Only supported types can 
filter data. 

Search bar 

FR23.2 The system shall enable searching 
by patient name or scan ID. 

Search matches current 
filter selection. 

49 

 
 
 
 
 
 
 
Feature (from UI 
element) 

Functional Requirement (FR-ID 
Statement) 

Business Rule 

Grid/List view 
toggle 

FR23.3 The system shall offer grid or list 
presentations of the scan records. 

Preference may be saved 
per admin. 

Scan cards (ID, 
Status, Patient, etc.) 

FR23.4 The system shall display scan with 
visual details and metadata. 

Scan ID and Patient 
reference mandatory on 
display. 

View Details 
button 

FR23.5 The system shall provide a details 
view for each scan. 

Details may include full 
scan metadata. 

Delete scan button 

FR23.6 The system shall give the option to 
delete scan records after confirmation. 

Only admins can delete, and 
deletion is irreversible. 

Add New Scan 
button 

FR23.7 The system shall provide a function 
to upload/ingest a new scan into repository. 

Only supported formats 
allowed. 

M24-AI Model Monitoring 
Admins  monitor  real-time  and  historical  AI  model  metrics  (accuracy,  latency,  loss,  F1  score), 
analyze trends, and investigate deployments. 

                                                         Figure 2-28: AI Model Monitoring Screen 

                                     Table 2-26: Functional Requirements derived from Mockup M24 

50 

 
 
 
 
Feature (from UI 
element) 

Functional Requirement (FR-ID 
Statement) 

Business Rule 

Model metrics cards 
(Accuracy, etc.) 

FR24.1 The system shall show current model 
performance metrics (accuracy, latency, loss, 
F1 score). 

Metrics update in real 
time from AI backend. 

Performance Trends 
chart 

FR24.2 The system shall visualize model 
performance trend over custom time windows. 

Chart time windows 
selectable by admin. 

Distribution charts 

FR24.3 The system shall display prediction 
distribution by class for all recent scans. 

Chart data includes 
only completed AI 
results. 

M25-Notification Management 
Notification  center  enables  admins  to  review,  search,  and  manage  all  system/user  notifications 
with bulk actions and filtering. 

                                         Figure 2-29: Notification Management Screen 

                               Table 2-27: Functional Requirements derived from Mockup M25 

51 

 
 
 
 
 
 
 
 
Feature (from UI 
element) 

Functional Requirement (FR-ID 
Statement) 

Business Rule 

Search & filter 
controls 

FR25.1 The system shall permit search and 
filter of notifications by text, type, or status. 

Only records in current 
filter shown. 

Notification list 

FR25.2 The system shall display status, type, 
message, date, and actions for each 
notification. 

Supports paging and real 
time updates. 

Mark all as Read, 
Dismiss All 

FR25.3 The system shall provide bulk actions 
to mark all as read or dismiss all notifications. 

Actions affect only items 
visible to current admin. 

Individual 
notification 
actions 

FR25.4 The system shall let admin perform 
actions on specific notifications (read, 
archive, etc.). 

Only appropriate actions 
available per status. 

M26-Payment & Transaction History 
Admins can track, filter, and export the payment and transaction records for all activities in the 
system. 

                                       Figure 2-30: Payment & Transaction History Screen 

52 

 
 
 
 
 
 
                            Table 2-28: Functional Requirements derived from Mockup M26 

Feature (from 
UI element) 

Transaction 
summary cards 

Functional Requirement (FR-ID Statement) 

Business Rule 

FR26.1 The system shall show counts of total, 
succeeded, failed, pending, and refunded 
transactions. 

Cards refresh as records 
are added or updated. 

Filter, Export 
controls 

FR26.2 The system shall enable filtering by date, 
status, and export of selected transactions. 

Export only allowed for 
authorized admin roles. 

Transaction table  FR26.3 The system shall list transaction details 

with ID, date/time, method, amount, description, 
customer, and status. 

Table supports sorting 
and pagination. 

Add Transaction 
button 

FR26.4 The system shall allow adding a 
transaction manually, subject to proper validation. 

Used for adjustments or 
error corrections. 

M27-Feedback Review 
Admins  review,  search,  filter,  and  export  user  and  staff  feedback  for  response  and  reporting 
purposes. 

                                                      Figure 2-31: Feedback Review Screen 

53 

 
 
 
 
 
 
                              Table 2-28: Functional Requirements derived from Mockup M27 

Feature (from 
UI element) 

Functional Requirement (FR-ID 
Statement) 

Business Rule 

Search & filter 
controls 

FR27.1 The system shall support searching 
and filtering by status, type, or sentiment. 

Multiple criteria can be 
combined for filtering. 

Recent User 
Feedback table 

FR27.2 The system shall display feedback 
details (ID, date, user, subject, status, 
sentiment). 

Feedback updated as new 
records arrive. 

Export Data 
button 

FR27.3 The system shall permit exporting 
feedback data for records review. 

Export is restricted to admin 
role users only. 

View Feedback 
action 

FR27.4 The system shall allow viewing the 
complete details of feedback entries. 

Only admins/staff with 
permission may view all 
data. 

M28-System Settings 
Admins  manage  global  settings,  localization,  user  roles,  security  preferences,  and  the  data 
retention policy for MediFusion Vision. 

                                                    Figure 2-32: System Settings Screen  

54 

 
 
 
 
 
 
                                      Table 2-30: Functional Requirements derived from Mockup M28 

Feature (from UI 
element) 

Functional Requirement (FR-ID 
Statement) 

Business Rule 

Application Details 
section 

FR28.1 The system shall show and allow 
editing of application name, language, 
and timezone. 

Only admin-level users may 
modify these settings. 

Tabs for User Roles, 
Security, etc. 

FR28.2 The system shall categorize 
settings by general, roles, security, and 
notifications. 

Only valid settings can be 
submitted. 

Data Management & 
Retention section 

FR28.3 The system shall display and let 
admin set retention policy for stored 
data. 

Policy changes apply to new 
and existing records. 

Save Settings button 

FR28.4 The system shall save all 
changes upon confirmation by admin. 

Changes take effect 
immediately unless 
otherwise specified. 

M29-Splash Screen (Mobile) 
Displays the MediFusion Vision logo and tagline during app startup. 

                                                                 Figure2-33: Splash Screen – Mobile         

55 

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
                               
 
 
 
 
 
             Table 2-31: Functional Requirements derived from Mockup M29 

Feature (from 
UI element) 

Functional Requirement (FR-ID Statement) 

Business Rule 

Splash logo and 
tagline 

FR29.1 The system shall display the MediFusion 
Vision logo and tagline during app launch. 

Shown until initial 
loading completes. 

M30-Authentication Screen (Mobile) 
Allows  patients  to  log  in  or  register  using  email/password  or  external  providers;  also  supports 
password recovery. 

                                                        Figure 2-34: Authentication Screen – Mobile 

56 

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
                                       Table 2-32: Functional Requirements derived from Mockup M30 

Feature (from UI element) 

Functional Requirement (FR-ID 
Statement) 

Business Rule 

Email and Password fields 

Login button 

Forgot Password link 

Login/Register tabs 

FR30.1 The system shall let users 
enter an email and password for 
authentication. 

Both fields 
required for login. 

FR30.2 The system shall 
authenticate users and grant access 
to the app upon valid credentials. 

Only active, 
verified accounts 
can log in. 

FR30.3 The system shall provide 
access to password reset 
workflow. 

Security 
verification is 
required for reset. 

FR30.4 The system shall allow 
switching between login and 
registration forms. 

Only one form 
active at a time. 

Continue with 
Email/Apple/Google/Facebook 

FR30.5 The system shall provide 
alternate social login options. 

Only available for 
supported 
providers. 

M31-Home Dashboard Screen (Mobile) 
Welcomes  the  patient  after  login  and  provides  quick  access  to  appointments,  AI  reports,  scan 
upload, and doctor messages. 

                                                    Figure 2-35: Home Dashboard Screen – Mobile 

57 

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
                                               Table 2-33: Functional Requirements derived from Mockup M31 

Feature (from UI 
element) 

Functional Requirement (FR-ID 
Statement) 

Business Rule 

Welcome message 
with user name 

FR31.1 The system shall display a 
personalized greeting to the logged-in 
patient. 

Visible only to 
authenticated users. 

Upcoming 
Appointments 
shortcut 

Latest AI Reports 
shortcut 

FR31.2 The system shall show a count of 
upcoming appointments and link to details. 

Count updates in real-time 
based on scheduled visits. 

FR31.3 The system shall show recent AI 
diagnostic reports and link to full report 
history. 

Only patient’s own 
reports are displayed. 

Upload Medical 
Scan shortcut 

FR31.4 The system shall provide access to 
scan upload functionality. 

Only enabled for verified 
user accounts. 

Doctor Messages 
shortcut 

FR31.5 The system shall indicate unread 
messages and link to chat with doctors. 

New message count 
updates dynamically. 

Bottom navigation 
bar 

FR31.6 The system shall provide navigation 
to Home, Doctors, Reports, Appointments, 
Profile screens. 

All pages accessible 
according to user session. 

M32-Find a Doctor Screen (Mobile) 
Patients can search for doctors, filter by specialization, and view top-rated doctors with profile and 
booking options. 

                                                    Figure 2-36: Find a Doctor Screen – Mobile  

58 

 
                                      
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
                                  Table 2-34: Functional Requirements derived from Mockup M32 

Feature (from UI 
element) 

Functional Requirement (FR-ID 
Statement) 

Business Rule 

Doctor search bar 

FR32.1 The system shall let patients 
search for doctors by name or 
specialization. 

Search results limited to 
active doctors only. 

Specialization filter 
buttons 

FR32.2 The system shall provide filters 
(e.g. Cardiology, Dermatology) to narrow 
doctor results. 

Only one filter active at a 
time. 

Top Rated Doctors 
cards 

FR32.3 The system shall display top-
rated doctor cards with name, specialty, 
rating, and profile. 

Ratings based on verified 
patient feedback. 

View Profile button 

FR32.4 The system shall open the 
selected doctor’s profile on tap. 

Only for doctors 
currently accepting 
appointments. 

Doctor Profile section 
& Book Appointment 

FR32.5 The system shall show detailed 
doctor profiles and allow booking 
appointments if available. 

Booking enabled only for 
available time slots. 

M33-My Appointments Screen (Mobile) 
Lists  all  upcoming  and  past  appointments  with  doctor,  specialty,  status,  as  well  as  options  to 
reschedule or cancel. 

59 

 
  
 
 
 
                                                   
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
                                                       Figure 2-37: My Appointments Screen – Mobile 

                                           Table 2-35: Functional Requirements derived from Mockup M33 

Feature (from UI 
element) 

Functional Requirement (FR-ID 
Statement) 

Business Rule 

Appointment cards 
(doctor, date, time, 
specialty) 

FR33.1 The system shall display all 
appointments with doctor name, 
specialty, status, date, and time. 

Only patient’s own 
appointments shown. 

Appointment status 
badges (Confirmed, 
Pending, Cancelled) 

Reschedule button 

FR33.2 The system shall visually 
indicate appointment status. 

Badge updates according to 
backend status. 

FR33.3 The system shall allow 
rescheduling an appointment to a 
new date and time. 

Reschedule allowed only if 
status is Pending/Confirmed 

Cancel button 

FR33.4 The system shall allow the 
patient to cancel an upcoming 
appointment. 

Cannot cancel if 
appointment is already 
completed. 

M34-Book Appointment Screen (Mobile) 
Handles selection of doctor, date, and available time slots for booking a new appointment, with 
confirmation. 

                                                    Figure 2-38: Book Appointment Screen – Mobile 

60 

 
 
 
 
 
                  
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
                                     Table 2-36: Functional Requirements derived from Mockup M34 

Feature (from 
UI element) 

Functional Requirement (FR-ID Statement)  Business Rule 

Doctor profile 
card 

FR34.1 The system shall display selected 
doctor’s name, specialty, location, and rating. 

Only available doctors are 
shown. 

Date selection 
calendar 

FR34.2 The system shall provide a calendar to 
pick the desired appointment date. 

Only future dates and 
available slots selectable. 

Time slot buttons  FR34.3 The system shall list and allow 

selection of available time slots. 

Only unbooked and valid 
slots enabled. 

Confirm Booking 
button 

FR34.4 The system shall finalize the booking 
after user confirms date and time. 

Booking processed only if 
slot is still available. 

M35-Upload Scan Screen (Mobile) 
Enables the patient to select scan type, drag-and-drop or browse for files, and upload a medical 
scan for further analysis. 

Figure 2-39: Upload Scan Screen – Mobile 

61 

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
                                                   
                                 Table 2-37: Functional Requirements derived from Mockup M35 

Feature (from UI 
element) 

Functional Requirement (FR-ID 
Statement) 

Business Rule 

Select Scan Type 
dropdown 

FR35.1 The system shall allow patients to 
select the scan type from a dropdown 
menu. 

Only supported scan types 
appear. 

Drag & drop / 
Browse Files area 

FR35.2 The system shall support drag-
and-drop and file selection from device 
storage. 

Only files matching accepted 
types and size limit are 
allowed. 

Max file size and 
format info 

FR35.3 The system shall display file type 
and size restrictions to the patient. 

Upload enabled only for 
compliant files. 

Upload Scan 
button 

FR35.4 The system shall upload the 
selected file to the server on user 
command. 

Button is enabled only when a 
valid file is selected. 

M36-AI Report Screen (Mobile) 
Displays  a  specific  AI-generated  health  report,  with  patient  info,  risk  assessment,  diagnostic 
findings, and status indicators for each section. 

                                                              Figure 2-40: AI Report Screen – Mobile 

62 

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
      
                              Table 2-38: Functional Requirements derived from Mockup M36 

Feature (from 
UI element) 

Functional Requirement (FR-ID 
Statement) 

Business Rule 

Report title and 
metadata 

FR36.1 The system shall display the 
AI report title, patient name, and 
report date. 

Only accessible to report owner and 
authorized roles. 

Overall Risk 
Assessment with 
label 

FR36.2 The system shall present the 
report’s overall AI risk assessment 
with status badge. 

Status label reflects AI analysis 
severity. 

Diagnostic 
Findings section 

FR36.3 The system shall list each 
diagnostic finding with explanation 
and result label. 

Each finding status 
(Normal/Abnormal/Pending) as 
strong badge. 

Status badges for 
findings 

FR36.4 The system shall visually 
indicate normal, abnormal, or 
pending review for each diagnostic 
result. 

Status is updated in real time on 
results. 

Section for 
explanatory 
notes 

FR36.5 The system shall display 
detailed explanations or 
recommendations for each finding. 

Recommendations included as 
provided by system or doctor. 

M37-Notifications & Profile Settings (Mobile) 
Aggregates  system  notifications  (appointments,  reports,  app  updates)  and  allows  toggling  alert 
settings for different notification types.  

63 

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
                                               Figure 2-41: Notifications & Profile Settings – Mobile  

                                   Table 2-39: Functional Requirements derived from Mockup M37 

Feature (from UI 
element) 

Functional Requirement (FR-ID 
Statement) 

Business Rule 

System notifications 
list 

FR37.1 The system shall display all user 
notifications by type, date, and status. 

New notifications are 
highlighted visually. 

Appointment and 
Report Alert toggles 

FR37.2 The system shall allow patients 
to enable/disable notification types. 

App Updates & 
Promotions toggle 

FR37.3 The system shall allow opting 
in/out of feature and promotional 
notifications. 

App applies changes 
immediately; persistent per 
user. 

Changes reflect for future 
notifications only. 

M38-Consultation Chat Screen (Mobile) 
Provides a chat interface between patient and doctor for consultation and follow-up discussions, 
including support for text messages and timestamps. 

Figure 2-42: Consultation Chat Screen 

64 

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
                                      Table 2-40: Functional Requirements derived from Mockup M38 

Feature (from UI 
element) 

Functional Requirement (FR-ID 
Statement) 

Business Rule 

Chat message bubbles 
(sent/received) 

FR38.1 The system shall display all 
messages in a threaded conversation 
format. 

Only chat for current 
consultation/session shown. 

Message input field 
and send button 

FR38.2 The system shall allow the 
patient to type and send messages 
instantly. 

Send button enabled only with 
non-empty message. 

Doctor and patient 
avatars 

FR38.3 The system shall display 
avatar images for each participant in 
the chat. 

Avatars reflect profile photos 
where set. 

Timestamps on 
messages 

FR38.4 The system shall show the 
time each message was sent or 
received. 

Times shown in user's local 
timezone. 

2.3  Non-Functional Requirements 

This  section  outlines  the  non-functional  requirements  of  the  MediFusion  Vision,  covering  key 
quality attributes such as reliability, usability, performance, security, availability, scalability, and 
maintainability. Each requirement is defined in clear, measurable, and verifiable terms to ensure 
effective testing and validation during system evaluation. 

2.3.1  Reliability  

REL-1: The system shall  be deployed on a cloud-based, containerized infrastructure to  ensure 
continuous operation and scalability across all hospital services.. 
REL-2: The system shall maintain an estimated Mean Time Between Failures (MTBF) of at least 
300 hours under normal operating conditions. 
REL-3:  Any  unexpected  downtime  or  interruption  in  the  backend,  database,  or  AI  diagnostic 
service shall be automatically detected and handled as a system failure event. 
REL-4: In case of a server or database crash, all incomplete transactions shall be automatically 
rolled back to maintain data integrity. 
REL-5:  Once  the  system  is  restored,  all  previously  committed  records  shall  remain  safe, 
consistent, and recoverable to ensure data durability. 
REL-6: If the AI diagnostic model encounters an error, the system shall log the issue and display 
a user-friendly error message, allowing the doctor to retry or re-upload the scan. 
REL-7: If the AI diagnostic model encounters an error, the system shall log the issue and display 
a user-friendly error message, allowing the doctor to retry or re-upload the scan. 

65 

 
                                     
 
REL-8:  Automated  monitoring  and  restart  policies  shall  ensure  that  any  affected  service  is 
recovered within 5 minutes of a detected failure, maintaining overall system reliability. 

2.3.2  Usability 

USE-1:  New  users  (patients  or  doctors)  shall  be  able  to  learn  to  use  the  core  features  (login, 
upload scan, view report) within 3 minutes of guided onboarding. 
USE-2: The user interface shall follow a consistent color scheme, iconography, and layout across 
both web and mobile platforms. 
USE-3: The system shall support two languages (English and Urdu) for all patient-facing content. 
USE-4:Accessibility  options  shall  include  text-to-speech,  screen  reader  support,  and  high-
contrast display modes for visually impaired users 
USE-5:  Error  messages  shall  be  displayed  in  plain,  user-understandable  language  with 
suggestions for corrective actions. 

2.3.3  Performance 

PER-1: The AI diagnostic engine shall generate disease predictions for a single scan within 10 
seconds on a standard GPU-enabled server. 
PER-2: 95% of all pages and dashboard views shall load within 4 seconds on a 20 Mbps or faster 
internet connection. 
PER-3:  The  system  shall  support  at  least  500  concurrent  active  users  without  performance 
degradation greater than 10%. 
PER-4: System response time for database queries shall not exceed 2 seconds for standard patient 
record retrieval. 

2.3.4  Security  

SEC-1: All patient and doctor data shall be encrypted both in transit (HTTPS) and at rest (AES-
256 encryption).  
SEC-2:  Each  user  shall  have  access  only  to  their  authorized  modules  using  role-based  access 
control (RBAC). 
SEC-3: The system shall automatically log out users after 15 minutes of inactivity. 
SEC-4: All login attempts, data uploads, and diagnosis events shall be recorded in a secure audit 
log. 
SEC-5: The system shall require multi-factor authentication for doctors and admins. 

2.4  External Interface Requirements 

This section defines the external interfaces required for the MediFusion Vision system to interact 
effectively  with  users,  AI  services,  and  external  APIs.  These  interfaces  ensure  smooth 
communication, secure data handling, and a consistent user experience across all platforms and 
devices..  

66 

 
 
 
2.4.1  User Interfaces Requirements 

This section defines the logical characteristics of the user interfaces required by the MediFusion 
Vision system. Some possible items to include are 

UI-1:The system will notify the User and Doctors before appointment 
UI-2:The system shall display a pop-up box to tell the User when an error has occurred. 
UI-3:The User shall be easily able to navigate through the system. 
UI-4:The  interface  shall  maintain  consistency  in  fonts,  color  palette  and  icon  styles  across  all 
screens. 
UI-5:Standard navigation elements (Dashboard, Appointments, Reports, Logout) shall appear on 
every page. 
UI-6:Screen  layouts  shall  support  a  minimum  resolution  of  1366x768  (web)  and  responsive 
scaling for mobile devices 

2.4.2  Software interfaces 

The MediFusion Vision depends on several external software services and components to 
provide its core functionality, including database management, AI model integration, video 
consultation, payment processing, cloud deployment, and data visualization. These interfaces 
ensure seamless interaction between system modules and third-party APIs while maintaining 
performance, reliability, and data security. The following software interface requirements specify 
how the system interacts with these components: 
SI-1: PostgreSQL v15 (Database Management System) 
SI-1.1: The system shall use PostgreSQL v15 as the primary relational database to store patient, 
doctor, and administrative data securely. 
SI-1.2: All medical records, diagnosis logs, and audit trails shall be stored using encrypted 
tablespaces to ensure HIPAA-compliant data protection. 
SI-1.3: PostgreSQL has been selected because it offers strong relational integrity, advanced 
indexing, and compliance with healthcare data security standards, including HIPAA and 
Pakistan’s PDPA 2023. 
SI-1.4:Selected as the main database because it offers strong relational integrity, advanced 
indexing, and compliance with healthcare data security requirements 
SI-2: PyTorch 2.x (AI Diagnostic Framework) 
SI-2.1: The backend shall integrate with PyTorch models for disease detection from MRI, 
retinal, and X-ray images. 
SI-3: Jitsi Meet API (Virtual Consultation Service) 
SI-3.1: The system shall integrate Jitsi Meet API v2.0 to enable secure, real-time video 
consultations between patients and doctors. 
SI-3.2: The backend shall generate unique meeting links per session with role-based access 
(doctor/patient). 
SI-3.3:All video sessions shall be encrypted using Jitsi’s E2E encryption and shall not store 
media data on the system. 
SI-3.4: Used for virtual doctor–patient consultations because it is an open-source and HIPAA-
compliant video conferencing API that ensures end-to-end encryption and privacy. 

67 

 
 
 
SI-4: Stripe API (Payment Gateway Service) 
SI-4.1: The system shall integrate with the Stripe API to handle secure online payments for 
consultations and medical reports. 
SI-4.2:  The backend shall use Stripe’s Payment Intents to create, confirm, and verify 
transactions through API calls. 
SI-4.3:The frontend (React/Flutter) shall use Stripe Checkout to collect payment details without 
storing card data locally. 
SI-4.4:All transactions shall use SSL encryption and follow PCI-DSS security standards 
SI-4.5:Chosen for secure online payments and subscription management. It supports encrypted 
transactions and global payment standards suitable for medical platforms. 
SI-5: Docker Engine & Docker Compose v26 (Deployment Environment) 
SI-5.1: The system shall use Docker containers for modular deployment of backend, frontend, AI 
model service, and database. 
SI-5.2: Docker Compose shall manage multi-container orchestration to ensure version control 
and consistent environment replication. 
SI-5.3: Each service shall have a dedicated container image with isolated dependencies to 
prevent conflicts across environments. 
SI-5.4:Used for deployment and environment isolation. It provides modular, scalable, and 
reproducible containers for each service (frontend, backend, AI model). 
SI-6: Flask / Node.js Backend Framework 
SI-6.1:The backend shall be implemented using Flask (Python) or Node.js (Express) for 
managing API routes, authentication, and AI model communication. 
SI-6.2:The backend shall expose RESTful APIs for data exchange with frontend and mobile 
applications. 
SI-6.3:The system shall use JWT-based token authentication for secure access control across all 
user roles. 
SI-6.4:Preferred for backend API handling due to lightweight performance, integration ease, 
and compatibility with AI model services. 
SI-7: React / Flutter Framework (Frontend Platform) 
SI-7.1: The system shall employ React (web) and/or Flutter (mobile) frameworks to provide 
cross-platform accessibility. 
SI-7.2:The frontend shall consume REST APIs exposed by the backend to display diagnostic 
reports, appointment data, and payment status. 
SI-7.3: The interface shall support responsive layouts for desktop, tablet, and mobile devices. 
SI-7.4:Used for building responsive and interactive user interfaces across devices while ensuring 
maintainability and component reuse. 
SI-9: Cloud Storage Service (AWS S3 / Google Cloud Storage) 
SI-9.1: The system shall store medical images, reports, and diagnostic outputs on secure cloud 
storage. 
SI-9.2: The backend shall handle file upload/download using pre-signed URLs to prevent 
unauthorized access. 
SI-9.3: All stored data shall be encrypted at rest using AES-256 encryption. 

68 

 
 
2.4.3  Hardware interfaces 

This section describes the characteristics of each interface between the software and hardware 
components used by the MediFusion Vision. These interfaces define how the system interacts 
with device hardware to support image uploads, AI-based analysis, and real-time communication 
among patients, doctors, and administrators. 
HI-1: The system shall support patient devices (PCs, laptops, or smartphones) for registration, 
image upload, and report viewing. 
HI-2: The system shall support doctor devices (computers or tablets) for accessing AI results 
and managing consultations. 
HI-3: The system shall support admin computers for user management, data monitoring, and 
system control. 
HI-4: The backend shall run on cloud or local servers with GPU support for AI model execution 
and data storage. 

2.4.4  Communications interfaces 

The MediFusion Vision requires reliable and secure communication channels to ensure smooth 
interaction among patients, doctors, and administrators. Notifications, alerts, and updates shall be 
transmitted using in-app messaging, email, or SMS services to keep users informed about 
appointments, reports, and account activities. The following communication interface 
requirements define how the system will handle these communications: 
CI-1: The system shall send an appointment reminder to the patient one day before their 
scheduled consultation with the doctor. 
CI-2: The system shall display an in-app message or notification to the patient once their 
diagnostic report becomes available for viewing. 
CI-3: The system shall send a confirmation email to users upon successful registration to the 
system. 

69 

 
 
 
