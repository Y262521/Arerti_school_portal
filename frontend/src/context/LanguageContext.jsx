import { createContext, useContext, useState, useCallback } from 'react'

const translations = {
  en: {
    // Nav
    dashboard: 'Dashboard',
    students: 'Students',
    teachers: 'Teachers',
    classes: 'Classes',
    subjects: 'Subjects',
    gradebook: 'Gradebook',
    attendance: 'Attendance',
    noticeboard: 'Notice Board',
    resources: 'Resources',
    auditlog: 'Audit Log',
    registration: 'Registration',
    regrade: 'Regrade',
    userlookup: 'User Lookup',
    account: 'Account',
    logout: 'Logout',
    myGrades: 'My Grades',
    myAttendance: 'Attendance',
    notices: 'Notices',
    myChildren: 'My Children',
    reportCards: 'Report Cards',

    // Login
    signIn: 'Sign in',
    signInSubtitle: 'Use your username or email address.',
    usernameEmail: 'Username / Email',
    password: 'Password',
    signingIn: 'Signing in…',
    troubleSignIn: 'Trouble signing in? Contact the school office.',
    forDirectors: 'For Directors',
    forTeachers: 'For Teachers',
    forStudents: 'For Students',
    forParents: 'For Parents',
    manageSchool: 'Manage the whole school',
    gradesAttendance: 'Grades, attendance, materials',
    viewResults: 'View results, get materials',
    trackChild: "Track your child's progress",

    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    loading: 'Loading…',
    noData: 'No data found.',
    required: 'This field is required',
    confirm: 'Confirm',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    done: 'Done',
    register: 'Register',
    submit: 'Submit',
    update: 'Update',

    // Registration
    studentRegistration: 'Student Registration',
    registrationOpened: 'Registration Opened',
    registrationClosed: 'Registration Closed',
    openRegistration: 'Open Registration Window',
    closeRegistration: 'Close Registration',
    postponeRegistration: 'Postpone Registration',
    newEndDate: 'New End Date & Time',
    postponeReason: 'Reason for Postponement',
    assignTeacher: 'Assign Teacher',
    allowedGrades: 'Allowed Grades',
    gradeNewEntrant: 'New Entrant',
    gradeReEnroll: 'Re-enroll',
    gradeTransfer: 'Transfer Student',
    step1Personal: 'Personal Info',
    step2Academic: 'Academic',
    step3Guardian: 'Guardian',
    step4Payment: 'Payment',
    firstName: 'First Name',
    fatherName: "Father's Name",
    grandfatherName: "Grandfather's Name",
    gender: 'Gender',
    dateOfBirth: 'Date of Birth',
    email: 'Email',
    region: 'Region',
    city: 'City / Woreda',
    kebele: 'Kebele',
    houseNo: 'House No.',
    studentPhoto: 'Student Photo',
    idDocument: 'Resident ID / Birth Certificate',
    previousSchool: 'Previous School',
    grade8Score: 'Grade 8 Exam Score (avg)',
    grade8Certificate: 'Grade 8 Certificate / Transcript',
    releaseLetter: 'Official Release Letter',
    stream: 'Stream',
    naturalScience: 'Natural Science',
    socialScience: 'Social Science',
    parentName: 'Parent / Guardian Full Name',
    relationship: 'Relationship',
    parentPhone: 'Phone Number',
    paymentMethod: 'Payment Method',
    transactionRef: 'Transaction Reference No.',
    paymentReceipt: 'Payment Receipt Photo',
    completeRegistration: 'Complete Registration',
    sectionPending: 'Section will be auto-assigned by the director after registration closes.',

    // Grade Entry Window
    gradeEntryWindow: 'Grade Entry Window',
    openGradeEntry: 'Open Grade Entry',
    closeGradeEntry: 'Close Grade Entry',
    postponeGradeEntry: 'Postpone Grade Entry',
    gradeEntryOpen: 'Grade entry is open',
    gradeEntryClosed: 'Grade entry is closed. Contact the director to open it.',

    // Classes
    addClass: 'Add Class',
    grade: 'Grade',
    section: 'Section',
    academicYear: 'Academic Year',
    homeroomTeacher: 'Homeroom Teacher',
    maxCapacity: 'Max Capacity',
    subjectAssignments: 'Subject Assignments',
    gradeCurriculum: 'Grade Curriculum',
    endTerm: 'End Term',
    autoAssignStudents: 'Auto-Assign Students',

    // Gradebook
    semester: 'Semester',
    year: 'Year',
    midExam: 'Mid Exam',
    finalExam: 'Final Exam',
    assignment: 'Assignment',
    testQuiz: 'Test/Quiz',
    total: 'Total',
    average: 'Average',
    saveMarks: 'Save Marks',
    marksLocked: 'Marks are locked. Request regrade permission from the director to edit.',
    requestRegrade: 'Request Regrade',

    // Roles
    ADMIN: 'Director',
    TEACHER: 'Teacher',
    STUDENT: 'Student',
    PARENT: 'Parent',
  },

  am: {
    // Nav
    dashboard: 'ዳሽቦርድ',
    students: 'ተማሪዎች',
    teachers: 'አስተማሪዎች',
    classes: 'ክፍሎች',
    subjects: 'ትምህርቶች',
    gradebook: 'የውጤት ደብተር',
    attendance: 'ክትትል',
    noticeboard: 'ማስታወቂያ ሰሌዳ',
    resources: 'ግብዓቶች',
    auditlog: 'የኦዲት መዝገብ',
    registration: 'ምዝገባ',
    regrade: 'ዳግም ምዘና',
    userlookup: 'ተጠቃሚ ፈልግ',
    account: 'መለያ',
    logout: 'ውጣ',
    myGrades: 'ውጤቶቼ',
    myAttendance: 'ክትትሌ',
    notices: 'ማስታወቂያዎች',
    myChildren: 'ልጆቼ',
    reportCards: 'የሪፖርት ካርዶች',

    // Login
    signIn: 'ግባ',
    signInSubtitle: 'የተጠቃሚ ስምዎን ወይም ኢሜልዎን ይጠቀሙ።',
    usernameEmail: 'የተጠቃሚ ስም / ኢሜል',
    password: 'የይለፍ ቃል',
    signingIn: 'በመግባት ላይ…',
    troubleSignIn: 'ለመግባት ችግር አለዎት? ትምህርት ቤቱን ያነጋግሩ።',
    forDirectors: 'ለዳይሬክተሮች',
    forTeachers: 'ለአስተማሪዎች',
    forStudents: 'ለተማሪዎች',
    forParents: 'ለወላጆች',
    manageSchool: 'ሙሉ ትምህርት ቤቱን ያስተዳድሩ',
    gradesAttendance: 'ውጤቶች፣ ክትትልና ቁሳቁሶች',
    viewResults: 'ውጤቶችን ይዩ፣ ቁሳቁሶች ያግኙ',
    trackChild: 'የልጅዎን እድገት ይከታተሉ',

    // Common
    save: 'አስቀምጥ',
    cancel: 'ሰርዝ',
    delete: 'አጥፋ',
    edit: 'አስተካክል',
    add: 'ጨምር',
    search: 'ፈልግ',
    loading: 'በመጫን ላይ…',
    noData: 'ምንም መረጃ አልተገኘም።',
    required: 'ይህ መስክ ያስፈልጋል',
    confirm: 'አረጋግጥ',
    close: 'ዝጋ',
    back: 'ተመለስ',
    next: 'ቀጥል',
    done: 'ተጠናቀቀ',
    register: 'ምዝገባ',
    submit: 'አስገባ',
    update: 'አዘምን',

    // Registration
    studentRegistration: 'የተማሪ ምዝገባ',
    registrationOpened: 'ምዝገባ ተጀምሯል',
    registrationClosed: 'ምዝገባ ተዘግቷል',
    openRegistration: 'የምዝገባ መስኮት ክፈት',
    closeRegistration: 'ምዝገባ ዝጋ',
    postponeRegistration: 'ምዝገባ አራዝም',
    newEndDate: 'አዲስ የማጠናቀቂያ ቀን እና ሰዓት',
    postponeReason: 'የማራዘሚያ ምክንያት',
    assignTeacher: 'አስተማሪ ሰይም',
    allowedGrades: 'የሚፈቀዱ ክፍሎች',
    gradeNewEntrant: 'አዲስ ተማሪ',
    gradeReEnroll: 'ድጋሚ ምዝገባ',
    gradeTransfer: 'ዝውውር ተማሪ',
    step1Personal: 'የግል መረጃ',
    step2Academic: 'ትምህርታዊ',
    step3Guardian: 'አሳዳጊ',
    step4Payment: 'ክፍያ',
    firstName: 'የራስ ስም',
    fatherName: 'የአባት ስም',
    grandfatherName: 'የአያት ስም',
    gender: 'ጾታ',
    dateOfBirth: 'የልደት ቀን',
    email: 'ኢሜል',
    region: 'ክልል',
    city: 'ከተማ / ወረዳ',
    kebele: 'ቀበሌ',
    houseNo: 'የቤት ቁጥር',
    studentPhoto: 'የተማሪ ፎቶ',
    idDocument: 'መታወቂያ / የልደት ምስክርወረቀት',
    previousSchool: 'ቀደሚ ትምህርት ቤት',
    grade8Score: 'የ8ኛ ክፍል ፈተና ውጤት (አማካይ)',
    grade8Certificate: 'የ8ኛ ክፍል ምስክርወረቀት',
    releaseLetter: 'ሥምረት ደብዳቤ',
    stream: 'ዘርፍ',
    naturalScience: 'ተፈጥሮ ሳይንስ',
    socialScience: 'ማህበራዊ ሳይንስ',
    parentName: 'የወላጅ / አሳዳጊ ሙሉ ስም',
    relationship: 'ዝምድና',
    parentPhone: 'ስልክ ቁጥር',
    paymentMethod: 'የክፍያ ዘዴ',
    transactionRef: 'የ거래 ማጣቀሻ ቁጥር',
    paymentReceipt: 'የክፍያ ደረሰኝ ፎቶ',
    completeRegistration: 'ምዝገባ አጠናቅ',
    sectionPending: 'ምዝገባ ከተዘጋ በኋላ ዳይሬክተሩ ክፍልን ይመድባሉ።',

    // Grade Entry Window
    gradeEntryWindow: 'የውጤት ማስገቢያ መስኮት',
    openGradeEntry: 'ውጤት ማስገቢያ ክፈት',
    closeGradeEntry: 'ውጤት ማስገቢያ ዝጋ',
    postponeGradeEntry: 'ውጤት ማስገቢያ አራዝም',
    gradeEntryOpen: 'ውጤት ማስገቢያ ክፍት ነው',
    gradeEntryClosed: 'ውጤት ማስገቢያ ተዘግቷል። ለዳይሬክተሩ ያሳውቁ።',

    // Classes
    addClass: 'ክፍል ጨምር',
    grade: 'ክፍል',
    section: 'ክፍለ ትምህርት',
    academicYear: 'ትምህርት ዓመት',
    homeroomTeacher: 'የክፍል አስተማሪ',
    maxCapacity: 'ከፍተኛ ቁጥር',
    subjectAssignments: 'የትምህርት ምደባ',
    gradeCurriculum: 'የክፍል ሥርዓተ ትምህርት',
    endTerm: 'ዓመቱን ጨርስ',
    autoAssignStudents: 'ተማሪዎችን ልዩ ምደባ',

    // Gradebook
    semester: 'ሴሜስተር',
    year: 'ዓመት',
    midExam: 'የወቅት ፈተና',
    finalExam: 'የዓመት ፈተና',
    assignment: 'የቤት ሥራ',
    testQuiz: 'ፈተና/ጥያቄ',
    total: 'ጠቅላላ',
    average: 'አማካይ',
    saveMarks: 'ውጤት አስቀምጥ',
    marksLocked: 'ውጤቶቹ ተቆልፈዋል። ለማስተካከል ከዳይሬክተሩ ፈቃድ ይጠይቁ።',
    requestRegrade: 'ድጋሚ ምዘና ጠይቅ',

    // Roles
    ADMIN: 'ዳይሬክተር',
    TEACHER: 'አስተማሪ',
    STUDENT: 'ተማሪ',
    PARENT: 'ወላጅ',
  }
}

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() =>
    localStorage.getItem('arerti_lang') || 'en'
  )

  const toggleLang = useCallback(() => {
    setLang(l => {
      const next = l === 'en' ? 'am' : 'en'
      localStorage.setItem('arerti_lang', next)
      return next
    })
  }, [])

  const t = useCallback((key) => {
    return translations[lang]?.[key] || translations['en']?.[key] || key
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t, isAmharic: lang === 'am' }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>')
  return ctx
}
