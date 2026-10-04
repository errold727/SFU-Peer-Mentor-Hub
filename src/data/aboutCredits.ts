export type Credit = { name: string; description: string; url: string };

// Credits-only inventory, audited against actual Resource Hub provider/source records
// on 2026-10-04. This file changes no resource facts, imports or service behavior.
// Parent-level rows combine Library/SLC/Research Commons, ISS/Study Abroad,
// Residence variants, Food/Dining Commons, SFSS variants and Science name variants.
// CourSys and Course Outlines belong to the separate course-data credits. The
// Hub-authored referral guide is not attributed to a fictional "SFU support offices"
// publisher. WriteAway and Alumo are cited information sources, not integrated APIs.
export const resourceCreditGroups: { title: string; credits: Credit[] }[] = [
  {
    title: 'SFU services',
    credits: [
      {
        name: 'SFU Student Services',
        description: 'Academic Calendar, Dates & Deadlines, involvement and participation records.',
        url: 'https://www.sfu.ca/students.html',
      },
      {
        name: 'SFU Enrolment Services',
        description: 'Enrolment, student records, exams and academic procedures.',
        url: 'https://www.sfu.ca/students/enrolment-services.html',
      },
      {
        name: 'SFU Convocation and Enrolment Services',
        description: 'Graduation application and convocation guidance.',
        url: 'https://www.sfu.ca/convocation/checklist/undergraduate-checklist.html',
      },
      {
        name: 'SFU Academic Advising',
        description: 'Advisor access, program selection and degree planning.',
        url: 'https://www.sfu.ca/students/academicadvising/contact.html',
      },
      {
        name: 'SFU Back on Track Program',
        description: 'Academic-standing support and program access information.',
        url: 'https://www.sfu.ca/students/bot/program-overview.html',
      },
      {
        name: 'SFU Library',
        description:
          'Library spaces, research help, Student Learning Commons and Research Commons.',
        url: 'https://www.lib.sfu.ca/',
      },
      {
        name: 'SFU Information Systems / IT Services',
        description:
          'Accounts, software, printing, connectivity and technical-support documentation.',
        url: 'https://sfu.teamdynamix.com/TDClient/255/ITServices/Requests/Service/2190/Service-Desk',
      },
      {
        name: 'SFU Recreation',
        description: 'Membership, facilities, sports and participation information.',
        url: 'https://www.sfu.ca/recreation.html',
      },
      {
        name: 'SFU Campus Public Safety',
        description: 'Safety contacts, Safe Walk, lost property and reporting guidance.',
        url: 'https://www.sfu.ca/srs/campus-safety-security/public-safety.html',
      },
      {
        name: 'SFU Safety & Risk Services',
        description: 'Official alerts, road reports and traffic notices.',
        url: 'https://www.sfu.ca/srs/risk-emergency-planning/emergency-preparedness/sfu-alerts.html',
      },
      {
        name: 'SFU Health & Counselling',
        description: 'Medical, counselling and wellbeing-service information.',
        url: 'https://www.sfu.ca/students/health.html',
      },
      {
        name: 'SFU Centre for Accessible Learning',
        description: 'Accommodation, registration and accessibility-service guidance.',
        url: 'https://www.sfu.ca/students/accessible-learning/establishing-accommodations.html',
      },
      {
        name: 'SFU International Services for Students',
        description:
          'International advising, arrival, Global Student Centre and study-abroad information.',
        url: 'https://www.sfu.ca/students/iss.html',
      },
      {
        name: 'SFU Medical Insurance',
        description: 'Official student insurance pathways and provider referrals.',
        url: 'https://www.sfu.ca/medical-insurance.html',
      },
      {
        name: 'SFU Indigenous Student Centre',
        description: 'Indigenous student support and community information.',
        url: 'https://www.sfu.ca/students/indigenous.html',
      },
      {
        name: 'SFU Black Student Centre',
        description: 'Black student support and community information.',
        url: 'https://www.sfu.ca/students/black-student-centre.html',
      },
      {
        name: 'SFU Multifaith Centre',
        description: 'Spiritual communities and prayer-space information.',
        url: 'https://www.sfu.ca/students/multifaith.html',
      },
      {
        name: 'SFU Residence and Housing',
        description: 'Residence, accessible accommodation and off-campus housing guidance.',
        url: 'https://www.sfu.ca/students/residences.html',
      },
      {
        name: 'SFU Food',
        description: 'Dining directories, Dining Commons, meal plans and dietary information.',
        url: 'https://www.sfu.ca/food/wheretoeat.html',
      },
      {
        name: 'SFU Bookstore & Spirit Shop',
        description: 'Course-material lookup and textbook guidance.',
        url: 'https://shop.sfu.ca/course-materials/course-materials--faqs',
      },
      {
        name: 'SFU Student Accounts',
        description: 'Tuition statements, payments and refund procedures.',
        url: 'https://www.sfu.ca/students/enrolment-services/fees.html',
      },
      {
        name: 'SFU Financial Aid and Awards',
        description: 'Funding programs, budgeting and financial-aid advising.',
        url: 'https://www.sfu.ca/students/financial-aid/contact.html',
      },
      {
        name: 'SFU Facilities Services',
        description: 'Campus maps, building directories and wayfinding.',
        url: 'https://www.sfu.ca/fs/campus-maps.html',
      },
      {
        name: 'SFU Parking and Sustainable Mobility',
        description: 'Parking, cycling and campus-shuttle information.',
        url: 'https://www.sfu.ca/parking.html',
      },
      {
        name: 'SFU Career and Volunteer Services',
        description: 'Career advising, preparation, workshops and opportunity information.',
        url: 'https://www.sfu.ca/students/career/advising.html',
      },
      {
        name: 'SFU Co-operative Education',
        description: 'Co-op programs and participation guidance.',
        url: 'https://www.sfu.ca/coop/programs.html',
      },
      {
        name: 'SFU Research',
        description: 'Undergraduate research-participation information.',
        url: 'https://www.sfu.ca/research/for-students/participate-in-research.html',
      },
      {
        name: 'SFU Charles Chang Institute for Entrepreneurship',
        description: 'Entrepreneurship and Incubator program information.',
        url: 'https://www.sfu.ca/chang-institute/Programs/incubator.html',
      },
      {
        name: 'SFU Graduate Studies',
        description: 'Graduate-specific academic deadline information.',
        url: 'https://www.sfu.ca/gradstudies/graduate-students/managing-your-program/deadlines.html',
      },
      {
        name: 'SFU event organizers',
        description: 'Official event calendars and discovery sources.',
        url: 'https://events.sfu.ca/',
      },
      {
        name: 'SFU Office of the Ombudsperson',
        description: 'Fairness, appeals and university-process guidance.',
        url: 'https://www.sfu.ca/ombudsperson.html',
      },
      {
        name: 'SFU Office of Student Support, Rights and Responsibilities',
        description: 'Student-support and conduct-related referral information.',
        url: 'https://www.sfu.ca/students/studentsupport.html',
      },
      {
        name: 'SFU Human Rights Office',
        description: 'Discrimination and harassment-support information.',
        url: 'https://www.sfu.ca/humanrights.html',
      },
      {
        name: 'SFU Sexual Violence Support and Prevention Office',
        description: 'Sexual-violence support and official contact information.',
        url: 'https://www.sfu.ca/sexual-violence.html',
      },
    ],
  },
  {
    title: 'SFU faculties & teaching departments',
    credits: [
      {
        name: 'SFU Applied Sciences',
        description: 'Faculty and departmental advising routes.',
        url: 'https://www.sfu.ca/students/academicadvising/contact/departmental-advisors/fas.html',
      },
      {
        name: 'SFU Arts and Social Sciences',
        description: 'Faculty and departmental advising routes.',
        url: 'https://www.sfu.ca/students/academicadvising/contact/departmental-advisors/fass.html',
      },
      {
        name: 'SFU Beedie School of Business',
        description: 'Business advising and program-planning routes.',
        url: 'https://www.sfu.ca/students/academicadvising/contact/departmental-advisors/business.html',
      },
      {
        name: 'SFU Communication, Art and Technology',
        description: 'Faculty and departmental advising routes.',
        url: 'https://www.sfu.ca/students/academicadvising/contact/departmental-advisors/fcat.html',
      },
      {
        name: 'SFU Education',
        description: 'Education advising and program-planning routes.',
        url: 'https://www.sfu.ca/students/academicadvising/contact/departmental-advisors/education.html',
      },
      {
        name: 'SFU Environment',
        description: 'Faculty and departmental advising routes.',
        url: 'https://www.sfu.ca/students/academicadvising/contact/departmental-advisors/environment.html',
      },
      {
        name: 'SFU Health Sciences',
        description: 'Health Sciences advising and program-planning routes.',
        url: 'https://www.sfu.ca/students/academicadvising/contact/departmental-advisors/health-sciences.html',
      },
      {
        name: 'SFU Faculty of Science',
        description: 'Faculty advising and science peer-support information.',
        url: 'https://www.sfu.ca/students/academicadvising/contact/departmental-advisors/faculty-of-science.html',
      },
      {
        name: 'SFU School of Computing Science',
        description: 'Computing Science peer-tutoring information.',
        url: 'https://www.sfu.ca/fas/computing/current-students/undergraduates/student-resources/CSPeerTutoring.html',
      },
      {
        name: 'SFU Department of Mathematics',
        description: 'Mathematics workshop and learning-support information.',
        url: 'https://www.sfu.ca/math/undergraduate/current-students/workshops.html',
      },
      {
        name: 'SFU Department of Economics',
        description: 'Economics workshop and writing-support information.',
        url: 'https://www.sfu.ca/economics/undergraduate/workshops.html',
      },
      {
        name: 'SFU Department of French',
        description: 'French Tutorat service information.',
        url: 'https://www.sfu.ca/french/student-resources/tutorat.html',
      },
      {
        name: 'SFU Department of Linguistics',
        description: 'Linguistics writing-support information in SFU’s support directory.',
        url: 'https://www.sfu.ca/students/enrolment-services/academic-integrity/support-and-resources.html',
      },
      {
        name: 'SFU Publishing',
        description: 'Publishing and creative-space information.',
        url: 'https://www.sfu.ca/vancouver/students/study-spaces.html',
      },
      {
        name: 'SFU course instructors and teaching assistants',
        description: 'Course-specific support and office-hour guidance.',
        url: 'https://www.sfu.ca/students/enrolment-services/academic-integrity/support-and-resources.html',
      },
    ],
  },
  {
    title: 'Student organizations',
    credits: [
      {
        name: 'Simon Fraser Student Society',
        description: 'Clubs, student centres, food pantry and food-assistance information.',
        url: 'https://sfss.ca/',
      },
      {
        name: 'Graduate Student Society at SFU',
        description: 'Graduate representation, support and grocery-assistance information.',
        url: 'https://sfugradsociety.ca/',
      },
      {
        name: 'Embark Sustainability Society',
        description: 'Food Rescue participation and distribution information.',
        url: 'https://www.embarksustainability.org/programs/food-rescue/',
      },
    ],
  },
  {
    title: 'External services',
    credits: [
      {
        name: 'TELUS Health Student Support through SFU',
        description: 'Student-support access information through the SFU MySSP guide.',
        url: 'https://www.sfu.ca/students/wellbeing-services/myssp.html',
      },
      {
        name: 'TransLink',
        description: 'Official transit-planning information.',
        url: 'https://www.translink.ca/trip-planner',
      },
      {
        name: 'WriteAway',
        description: 'Online writing-support service information.',
        url: 'https://writeaway.ca/',
      },
      {
        name: 'Alumo',
        description: 'Student health-plan finder cited by the insurance resource.',
        url: 'https://alumo.ca/?lang=en',
      },
    ],
  },
];
