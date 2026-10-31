"use strict";

/**
 * Catalogue seed data transcribed from Annexures A, B, C, D.
 * 161 total records:
 *   - Annexure A: 34 English courses
 *   - Annexure B: 24 Hindi courses
 *   - Annexure C1: 18 Future Skill Academy courses
 *   - Annexure C2: 11 AVGC courses
 *   - Annexure D1: 9 Internships
 *   - Annexure D2: 65 Student Projects
 *
 * Fields not present in source are left null/unspecified.
 * Status defaults to 'published' for public visibility.
 */

const ANNEXURE_A = "Annexure A";
const ANNEXURE_B = "Annexure B";
const ANNEXURE_C = "Annexure C";
const ANNEXURE_D = "Annexure D";

const CAT_ENGLISH = "English Courses";
const CAT_HINDI = "Hindi Courses";
const CAT_FSA = "Future Skill Academy";
const CAT_AVGC = "AVGC Courses";
const CAT_INTERNSHIP = "Internships";
const CAT_PROJECT = "Student Projects";

const LANG_EN = "English";
const LANG_HI = "Hindi";

const TYPE_COURSE = "course";
const TYPE_INTERNSHIP = "internship";
const TYPE_PROJECT = "project";

// ---------------------------------------------------------------------------
// ANNEXURE A — 34 English Courses
// Format: Title | Credits | Hours | Weeks
// ---------------------------------------------------------------------------
const ANNEXURE_A_DATA = [
  ["Digital Marketing Advance Certificate Course", 4, 120, 12],
  ["Careers & Certifications In Digital Marketing", 2, 60, 6],
  ["Google Ads And Analytics For Lead Generation", 2, 60, 6],
  ["Certificate In Affiliate Marketing", 2, 60, 6],
  ["Professional Certificate In Content Marketing", 2, 60, 6],
  ["Professional Certificate In Web Analytics", 2, 60, 6],
  ["Mastering Email Marketing And Funnel Strategies", 2, 60, 6],
  ["The Ultimate SEO Mastery Course", 2, 60, 6],
  ["Mastering Social Media Marketing Strategies", 2, 60, 6],
  ["Digital Marketing Certificate Course", 4, 120, 12],
  ["Data Science Using Python Certificate Course", 4, 120, 12],
  ["Python For Data Science Certificate Course", 4, 120, 12],
  ["Robotic Process Automation", 4, 120, 12],
  ["R for Data Analysis and Machine Learning", 4, 120, 12],
  ["Natural Language Processing Certificate Course", 4, 120, 12],
  ["Certificate Course in Network Security Professional (CCNSP)", 4, 120, 12],
  ["Certificate Course in Security Management (CCSM)", 4, 120, 12],
  ["Security Operations Centre Certified Course (SOCCC)", 4, 120, 12],
  ["Cloud Security Professional Certified Course (CSPCC)", 4, 120, 12],
  ["Cybersecurity Using Python Certificate Course (CUPCC)", 4, 120, 12],
  ["Master Modern Security & Cryptography", 4, 120, 12],
  ["Fundamentals Of Cyber Security - Self-paced", 4, 120, 12],
  ["Certificate Course in Ethical Hacker (CCEH)", 4, 120, 12],
  ["Field Technician Other Home Appliances", 4, 120, 12],
  ["Health and Safety Course", 4, 120, 12],
  ["Digital Marketing Basic Course (NEPDM1)", 4, 120, 12],
  ["Certificate in Electric Vehicle Sales Executive", 4, 120, 12],
  ["Creative Content Writing", 4, 120, 12],
  ["Certificate in Entrepreneurship Skills", 4, 120, 12],
  ["Certificate in Emotional Intelligence", 4, 120, 12],
  ["Personal Finance for Well Being", 4, 120, 12],
  ["Personality Development and Interpersonal Skills", 4, 120, 12],
  ["Organic Grower", 4, 120, 12],
  ["Certificate Course In Word Processing", 4, 120, 12],
];

// ---------------------------------------------------------------------------
// ANNEXURE B — 24 Hindi Courses
// Format: Title | Credits | Hours | Weeks
// ---------------------------------------------------------------------------
const ANNEXURE_B_DATA = [
  ["Digital Marketing Skills Hindi", 4, 120, 12],
  ["Certificate in Social Media Marketing -Hindi", 2, 60, 6],
  ["\u092b\u093e\u0938\u094d\u091a\u092c \u092a\u094d\u0930\u0902\u0926 \u0915\u0947\u0928\u094d\u0926\u094d\u0930\u093e\u0930\u0923 \u090f\u0935\u0902 \u0905\u0926\u094d\u092f\u0924\u094d\u0930\u0928\u0902\u092c\u0930", 2, 60, 6],
  ["WhatsApp Page Creation And Advertising Certificate Course In Hindi", 2, 60, 6],
  ["Personality Development and Interpersonal Skills", 4, 120, 12],
  ["Communication Skills", 2, 60, 6],
  ["GST Tax Invoices In Hindi", 2, 60, 6],
  ["Certificate in Goods and Service Tax", 4, 120, 12],
  ["Accounting Using Tally Prime", 4, 120, 12],
  ["Domestic Data Entry Operator", 4, 120, 12],
  ["Fundamental of Computer Applications", 4, 120, 12],
  ["IT Help Desk Attendant", 4, 120, 12],
  ["Computer Programming and Database", 4, 120, 12],
  ["Basic Computing Skills", 4, 120, 12],
  ["Communication Skills and Personality Development", 4, 120, 12],
  ["Certificate in Entrepreneurship Skills -Hindi", 4, 120, 12],
  ["\u0928\u093e\u091f\u094d\u091f \u0936\u093e\u0938\u094d\u0924\u0930 \u0915\u0947\u0928\u094d\u0926\u094d\u0930\u093e\u0930\u0923 /\u0926\u093f\u093e\u0928\u094d\u092a\u092a\u094d\u0930\u0947\u0928\u094d\u0926\u094d\u0930 \u090f\u0935\u0902 \u092a\u093e\u0930\u094d\u091a\u093e\u0923", 4, 120, 12],
  ["\u092a\u094c\u0927\u0941\u0930\u0940\u092f (\u0915\u0930\u092d\u0915\u093e\u0902\u0921)", 4, 120, 12],
  ["\u0932\u0917\u0941\u0915\u093e\u0924\u094d\u0924\u093e \u0932\u094b\u0928\u093e \u0915\u0947\u0928\u094d\u0926\u094d\u0930\u093e\u0930\u0923 Certificate Course", 2, 60, 6],
  ["Spoken Sanskrit", 2, 60, 6],
  ["Machine learning ki mool bate", 2, 60, 6],
  ["Foundation course in Yoga", 4, 120, 12],
  ["Ashtanga Yoga - The eight limbs of yoga", 2, 60, 6],
  ["Udhyamita ki mool samajh", 2, 60, 6],
];

// ---------------------------------------------------------------------------
// ANNEXURE C1 — 18 Future Skill Academy Courses
// Format: Title | Course Vertical | Credits
// No hours/weeks provided
// ---------------------------------------------------------------------------
const ANNEXURE_C1_DATA = [
  ["Diploma in AI-ML", "AIML", 40],
  ["Diploma in Data Science", "Data Science", 40],
  ["Diploma in Big Data Technology", "Big Data", 40],
  ["Diploma in Computer programming", "Computer Programming", 40],
  ["Diploma in IOT using AI-ML", "AIML", 40],
  ["Diploma in Full Stack Development", "Programming Language", 40],
  ["Diploma in Cyber security", "Cyber security", 40],
  ["Certificate in Data science", "Data Science", 20],
  ["Certificate in Computer Programming", "Computer Programming", 20],
  ["Certificate in Web Development", "Programming Language", 20],
  ["Certificate in IOT", "IOT", 20],
  ["Certificate in Data Analytics Using Excel & Power BI", "Programming Language", 20],
  ["Certificate in Big Data", "Big Data", 20],
  ["Certificate in Cyber Security", "Cyber security", 20],
  ["Certificate in Ethical Hacking (Skill India Foundation)", "Cyber security", 10],
  ["Certificate in Python Programming", "Programming Language", 20],
  ["Certificate in Junior Software Developer (Skill India Foundation)", "Programming Language", 10],
  ["Certificate in Programming with Python (Skill India Foundation)", "Cyber Security", 10],
];

// ---------------------------------------------------------------------------
// ANNEXURE C2 — 11 AVGC Courses
// Format: Title | Course Vertical | Credits
// No hours/weeks provided
// ---------------------------------------------------------------------------
const ANNEXURE_C2_DATA = [
  ["Diploma in Animation & Visual Effects (VFX)", "VFX", 40],
  ["Certificate in Animation", "VFX", 20],
  ["Certificate in 3D Animation", "VFX", 20],
  ["Certificate in Visual Effects (VFX)", "VFX", 20],
  ["Certificate in Digital Marketing", "VFX", 20],
  ["Certificate in Graphics Design", "VFX", 20],
  ["Certificate in Blender", "VFX", 20],
  ["Certificate in Video Editing and Motion Graphics", "VFX", 20],
  ["Certificate in Drawing And Digital Art", "VFX", 20],
  ["Certificate in Graphic Designer (Skill India Foundation)", "VFX", 10],
  ["Certificate in Drawing & Digital Art (Skill India Foundation)", "VFX", 10],
];

// ---------------------------------------------------------------------------
// ANNEXURE D1 — 9 Internships
// Format: Title | Skills | Credits | Hours
// ---------------------------------------------------------------------------
const ANNEXURE_D1_DATA = [
  ["Digital Marketing Internship", "Digital Marketing, Entrepreneurship skills", 4, 120],
  ["Python Internship", "Python, Entrepreneurship Skills", 4, 120],
  ["Cyber Security Internship", "Cyber Security, Entrepreneurship Skills", 4, 120],
  ["Flutter Developer Internship", "Flutter, Entrepreneurship Skills", 4, 120],
  ["Azure Internship", "Azure, Entrepreneurship Skills", 4, 120],
  ["AWS Academy Cloud Foundations Internship", "AWS Academy Cloud Foundations, Entrepreneurship skills", 4, 120],
  ["AWS Academy Machine Learning Foundations Internship", "AWS Academy Machine Learning Foundations, Entrepreneurship skills", 4, 120],
  ["AWS Academy Cloud Security Foundations Internship", "AWS Academy Cloud Security Foundations, Entrepreneurship skills", 4, 120],
  ["AWS Academy Cloud Architecting Internship", "AWS Academy Cloud Architecting, Entrepreneurship skills", 4, 120],
];

// ---------------------------------------------------------------------------
// ANNEXURE D2 — 65 Student Projects
// Format: Title | Credits | Delivery Mode
// ---------------------------------------------------------------------------
const ANNEXURE_D2_DATA = [
  ["12 Volt Battery Charging System", 2],
  ["Aarti Pooja Website", 2],
  ["AC Power Strength Controller System", 2],
  ["AI Multi Agent Shopping System", 2],
  ["Android Controlled Notice Board Project", 2],
  ["Android Controlled Spy Robot With Night Vision Camera", 2],
  ["Car Over Speeding Detection Project", 2],
  ["Career Guidance Project", 2],
  ["Cargo Booking Software", 2],
  ["Configurable Medication Reminding System", 2],
  ["Controlling Solar Energy Charge", 2],
  ["Credit Card Fraud Detection System", 2],
  ["Android Controlled Pick And Place Robotic Arm Vehicle Project", 2],
  ["Customer Behavior Prediction Using Web Usage Mining", 2],
  ["Daily Expense Tracker System", 2],
  ["Displaying Moving Message On Notice Board Using PC", 2],
  ["Employee Goal Tracking System", 2],
  ["Energy Management System With Programmable Numbers Using GSM", 2],
  ["GPS + GSM Based Advanced Vehicle Tracking System Project", 2],
  ["Industrial Load Switcher Based On Touch Screen", 2],
  ["2WD Vehicle Drone Air + Land Surveillance", 2],
  ["Detect Irregular moving objects and tracking based on color and shape in real-time", 2],
  ["Device Load Monitor with Programmable Meter for Energy Audit", 2],
  ["Industry Process Automation Using Programmable Switching", 2],
  ["Instant Electric Circuit Breaker", 2],
  ["Internet-Based Live Courier Tracking and Delivery System", 2],
  ["System to Measure Solar Power", 2],
  ["Tab-Based Library Book Availability & Location Finder On Wifi", 2],
  ["TV Remote Controlled Robotic Vehicle", 2],
  ["Vehicle Movement-Based Street Lights Project", 2],
  ["Web Agent for Teaching Content UPDATING", 2],
  ["Shuttling Metro Train Between Stations Project", 2],
  ["Single Phase Induction Motor with Smooth Start", 2],
  ["SMS-CONTROLLED RAILWAY LEVEL GATE CONTROL WITH PROGRAMMABLE NUMBERS", 2],
  ["Stock Market Analysis and Prediction", 2],
  ["Student Portal Project", 2],
  ["Irrigation System running on solar power", 2],
  ["MC-Based Line Follower Robot", 2],
  ["Monthly Electricity Billing Display With Bill SMS Features", 2],
  ["On-demand remote PC Monitoring system Through the Internet", 2],
  ["Online AI Shopping with Wallet System", 2],
  ["Online Election System", 2],
  ["PC Configuration Retrieval System on Online Server", 2],
  ["Postage Stamp Value Calculator", 2],
  ["Power Meter Reader Plus Load Control Using GSM", 2],
  ["Power Supply with Auto Switching", 2],
  ["Remote User Recognition And Access Provision", 2],
  ["RFID-Based Passport Project", 2],
  ["Seo Suggestion Search Engine Project", 2],
  ["Session Password-Based Authentication System", 2],
  ["Advanced Wireless Power Transfer System", 2],
  ["Car Speed Checker with LCD Display", 2],
  ["Home Appliances Controlled By TV Remote", 2],
  ["UNDERGROUND CABLE FAULT DISTANCE CALCULATOR", 2],
  ["Paid Car Parking Project Based on RFID", 2],
  ["Doctor Appointment Booking System", 2],
  ["Motor driving school system", 2],
  ["Three-Level Password System", 2],
  ["Question Paper Generator Project", 2],
  ["MLM Project", 2],
  ["Electricity online bill payment", 2],
  ["Clinic Management System", 2],
  ["Hotel Management System", 2],
  ["Online Cake Shop System", 2],
  ["Two-Wheeler Catalogue Project", 2],
];

// ---------------------------------------------------------------------------
// Build normalized records
// ---------------------------------------------------------------------------
function buildRecords() {
  const records = [];
  let order = 0;

  // Annexure A - English courses
  ANNEXURE_A_DATA.forEach(([title, credits, hours, weeks]) => {
    order += 1;
    records.push({
      source_annexure: ANNEXURE_A,
      source_category: CAT_ENGLISH,
      source_order: order,
      item_type: TYPE_COURSE,
      language: LANG_EN,
      title,
      vertical: null,
      skills: null,
      delivery_mode: null,
      credits,
      duration_hours: hours,
      duration_weeks: weeks,
      duration: `${weeks} Weeks`,
      description: null,
      fee: null,
      domain: null,
      status: "published",
    });
  });

  // Annexure B - Hindi courses
  ANNEXURE_B_DATA.forEach(([title, credits, hours, weeks]) => {
    order += 1;
    records.push({
      source_annexure: ANNEXURE_B,
      source_category: CAT_HINDI,
      source_order: order,
      item_type: TYPE_COURSE,
      language: LANG_HI,
      title,
      vertical: null,
      skills: null,
      delivery_mode: null,
      credits,
      duration_hours: hours,
      duration_weeks: weeks,
      duration: `${weeks} Weeks`,
      description: null,
      fee: null,
      domain: null,
      status: "published",
    });
  });

  // Annexure C1 - Future Skill Academy
  ANNEXURE_C1_DATA.forEach(([title, vertical, credits]) => {
    order += 1;
    records.push({
      source_annexure: ANNEXURE_C,
      source_category: CAT_FSA,
      source_order: order,
      item_type: TYPE_COURSE,
      language: LANG_EN,
      title,
      vertical,
      skills: null,
      delivery_mode: null,
      credits,
      duration_hours: null,
      duration_weeks: null,
      duration: null,
      description: null,
      fee: null,
      domain: null,
      status: "published",
    });
  });

  // Annexure C2 - AVGC
  ANNEXURE_C2_DATA.forEach(([title, vertical, credits]) => {
    order += 1;
    records.push({
      source_annexure: ANNEXURE_C,
      source_category: CAT_AVGC,
      source_order: order,
      item_type: TYPE_COURSE,
      language: LANG_EN,
      title,
      vertical,
      skills: null,
      delivery_mode: null,
      credits,
      duration_hours: null,
      duration_weeks: null,
      duration: null,
      description: null,
      fee: null,
      domain: null,
      status: "published",
    });
  });

  // Annexure D1 - Internships
  ANNEXURE_D1_DATA.forEach(([title, skills, credits, hours]) => {
    order += 1;
    records.push({
      source_annexure: ANNEXURE_D,
      source_category: CAT_INTERNSHIP,
      source_order: order,
      item_type: TYPE_INTERNSHIP,
      language: LANG_EN,
      title,
      vertical: null,
      skills,
      delivery_mode: null,
      credits,
      duration_hours: hours,
      duration_weeks: null,
      duration: `${hours} Hours`,
      description: null,
      fee: null,
      domain: null,
      status: "published",
    });
  });

  // Annexure D2 - Projects
  ANNEXURE_D2_DATA.forEach(([title, credits]) => {
    order += 1;
    records.push({
      source_annexure: ANNEXURE_D,
      source_category: CAT_PROJECT,
      source_order: order,
      item_type: TYPE_PROJECT,
      language: LANG_EN,
      title,
      vertical: null,
      skills: null,
      delivery_mode: "Self-paced",
      credits,
      duration_hours: null,
      duration_weeks: null,
      duration: null,
      description: null,
      fee: null,
      domain: null,
      status: "published",
    });
  });

  return records;
}

const RECORDS = buildRecords();

console.log(`Seed data prepared: ${RECORDS.length} total records`);
console.log(`  Annexure A (English): ${ANNEXURE_A_DATA.length}`);
console.log(`  Annexure B (Hindi): ${ANNEXURE_B_DATA.length}`);
console.log(`  Annexure C1 (Future Skill Academy): ${ANNEXURE_C1_DATA.length}`);
console.log(`  Annexure C2 (AVGC): ${ANNEXURE_C2_DATA.length}`);
console.log(`  Annexure D1 (Internships): ${ANNEXURE_D1_DATA.length}`);
console.log(`  Annexure D2 (Projects): ${ANNEXURE_D2_DATA.length}`);
console.log(`  Total: ${RECORDS.length}`);

module.exports = { RECORDS };
