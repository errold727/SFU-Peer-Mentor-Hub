import type { SFUResource, ResourceCategory } from './types';
import { deadlines } from './deadlines';
import { library } from './library';
import { recreation } from './recreation';
function resource(id:string,title:string,category:ResourceCategory,summary:string,sourceUrl:string,tags:string[]=[],facts:SFUResource['facts']=[],campus:SFUResource['campus']='All',lastVerified:string|null='2026-10-03'):SFUResource { return {id,title,category,summary,sourceUrl,tags,facts,campus,lastVerified,sourceName:category==='library'||sourceUrl.includes('lib.sfu.ca')?'SFU Library':'Simon Fraser University',posterCompatible:true}; }
export const resources: SFUResource[] = [
 library,
 resource('campus-safety','Campus Public Safety','safety','Emergency, urgent security, and first aid contacts.', 'https://www.sfu.ca/srs/contact/report/report-incident.html',['emergency','security','first aid'],[{label:'Emergency',value:'911'},{label:'Urgent security / first aid',value:'778-782-4500'},{label:'Non-emergency',value:'778-782-7991'}]),
 resource('safe-walk','Safe Walk','safety','Contact Campus Public Safety to request a Safe Walk. See the official page for campus-specific coverage.', 'https://www.sfu.ca/srs/campus-safety-security/public-safety/safe-walk.html',['safe walk','security'],[{label:'Non-Emergency / Safe Walk',value:'778-782-7991'}]),
 recreation,
 resource('lost-found','Lost & Found — Burnaby','safety','Contact the Burnaby information kiosk about lost items.', 'https://www.sfu.ca/srs/campus-safety-security/public-safety/lost-found.html',['lost','found'],[{label:'Phone',value:'778-782-5451'},{label:'Email',value:'lost@sfu.ca'}],'Burnaby'),
 resource('computing-id','SFU Computing ID','student-essential','Your digital key to Canvas, SFU Mail, goSFU, computer labs and online library services.', 'https://sfu.teamdynamix.com/TDClient/255/ITServices/Requests/Service/2440/Computing-Account',['computing ID','email','canvas','wifi']),
 resource('id-card','SFU ID Card','student-essential','Find official guidance on getting and using your SFU ID card.', 'https://www.sfu.ca/students/enrolment-services/id-card/',['student card','ID']),
 resource('upass','U-Pass BC','student-essential','Find SFU guidance on U-Pass BC eligibility and using your transit pass.', 'https://www.sfu.ca/students/upass.html',['transit','U-Pass','bus']),
 resource('advising','Academic Advising','academic-support','Find general and departmental advising for degree planning and program requirements.', 'https://www.sfu.ca/students/academicadvising.html',['academic advising','degree']),
 resource('slc','Student Learning Commons','academic-support','Visit the official Student Learning Commons for learning support.', 'https://www.lib.sfu.ca/about/branches-depts/slc',['study','learning'],[],'All',null),
 resource('writing','Writing Support','academic-support','Find writing support through the SFU Library.', 'https://www.lib.sfu.ca/about/branches-depts/slc/writing',['writing','essay'],[],'All',null),
 resource('research','Library Research Help','academic-support','Use SFU Library’s official research assistance directory.', 'https://www.lib.sfu.ca/help/research-assistance/ask-us',['research','librarian'],[],'All',null),
 resource('office-hours','Professor / TA office-hour guidance','academic-support','Consult your course outline or course site for instructor and TA contact arrangements. No office hours are assumed here.', 'https://www.sfu.ca/outlines.html',['office hours','professor','TA']),
 resource('iss','International Services for Students','international','Start with SFU’s official international student services directory.', 'https://www.sfu.ca/students/iss.html',['international student']),
 resource('immigration','Official immigration resources','international','Follow SFU’s official immigration guidance and consult an international student advisor for your circumstances.', 'https://www.sfu.ca/students/isap.html',['immigration','permit']),
 resource('insurance','Medical insurance resources','international','Find official SFU medical insurance information for international students.', 'https://www.sfu.ca/students/isap.html',['medical','insurance']),
 resource('international-advising','International student advising','international','Connect with SFU International Services for Students for advising information.', 'https://www.sfu.ca/students/iss/contact.html',['international','advising']),
 resource('myinvolvement','myInvolvement','student-essential','Explore campus opportunities, volunteering, events and student involvement.', 'https://www.sfu.ca/students/get-involved/myinvolvement.html',['volunteer','events','involvement']),
 resource('course-outlines','Official Course Outlines','course-planning','Find official course offering information and published course outlines.', 'https://www.sfu.ca/outlines.html',['course','planning','outline']),
 ...deadlines,
];

