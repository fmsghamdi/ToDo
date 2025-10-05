export interface Translation {
  // Navigation
  board: string;
  dashboard: string;
  controlPanel: string;
  chat: string;
  calendar: string;
  systemSettings: string;
  logout: string;
  welcome: string;

  // Common
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  add: string;
  close: string;
  loading: string;
  search: string;
  filter: string;
  clear: string;
  yes: string;
  no: string;
  ok: string;
  error: string;
  success: string;

  // Tasks
  tasks: string;
  addTask: string;
  taskTitle: string;
  taskDescription: string;
  dueDate: string;
  priority: string;
  high: string;
  medium: string;
  low: string;
  members: string;
  labels: string;
  attachments: string;
  subtasks: string;
  comments: string;
  progress: string;
  completed: string;
  defaultTaskBoard: string;

  // Columns
  todo: string;
  inProgress: string;
  done: string;

  // Auth
  login: string;
  register: string;
  email: string;
  password: string;
  name: string;
  loginButton: string;
  registerButton: string;
  showRegister: string;
  showLogin: string;
  invalidEmail: string;
  passwordTooShort: string;
  emailExists: string;
  invalidCredentials: string;
  nameRequired: string;
  fieldRequired: string;

  // System Settings
  systemSettingsTitle: string;
  systemSettingsDesc: string;
  databaseSettings: string;
  databaseSettingsDesc: string;
  activeDirectorySettings: string;
  activeDirectorySettingsDesc: string;
  emailSettings: string;
  emailSettingsDesc: string;
  generalSettings: string;
  generalSettingsDesc: string;
  
  // Database
  databaseType: string;
  serverAddress: string;
  port: string;
  databaseName: string;
  username: string;
  customConnectionString: string;
  testConnection: string;
  testing: string;
  connectionSuccess: string;
  connectionFailed: string;

  // Active Directory
  enableAD: string;
  domain: string;
  adServer: string;
  baseDN: string;
  bindUsername: string;
  useSSL: string;
  adConnectionSuccess: string;
  adConnectionFailed: string;

  // Email
  enableEmailTasks: string;
  emailProvider: string;
  emailServer: string;
  taskEmailAddress: string;
  useTLS: string;
  autoCreateTasks: string;
  emailInstructions: string;
  emailConnectionSuccess: string;
  emailConnectionFailed: string;
  emailInstruction1: string;
  emailInstruction2: string;
  emailInstruction3: string;
  emailInstruction4: string;

  // General
  organizationName: string;
  systemUrl: string;
  defaultLanguage: string;
  timezone: string;
  dateFormat: string;
  allowSelfRegistration: string;
  requireEmailVerification: string;
  sessionTimeout: string;
  sessionTimeoutMinutes: string;
  organizationPlaceholder: string;
  systemUrlPlaceholder: string;
  connectionStringPlaceholder: string;
  emailServerPlaceholder: string;
  taskEmailPlaceholder: string;

  // Actions
  saveSettings: string;
  saving: string;
  cancelChanges: string;
  settingsSaved: string;
  settingsError: string;
  lastSaved: string;
  notSavedYet: string;

  // Language
  arabic: string;
  english: string;
  changeLanguage: string;

  // Chat
  chats: string;
  newChat: string;
  startNewChat: string;
  noChatsYet: string;
  selectChatToStart: string;
  selectChatFromList: string;
  startConversation: string;
  typeMessage: string;
  send: string;
  online: string;
  chatMembers: string;
  createChat: string;

  // Password Management
  changePassword: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  forgotPassword: string;
  resetPassword: string;
  passwordChanged: string;
  passwordMismatch: string;
  currentPasswordIncorrect: string;
  passwordResetSent: string;
  enterEmailForReset: string;
  backToLogin: string;
  resetPasswordTitle: string;
  sendResetLink: string;

  // New Planner Features
  // Recurring Tasks
  recurring: string;
  recurrence: string;
  repeatTask: string;
  daily: string;
  weekly: string;
  monthly: string;
  yearly: string;
  every: string;
  days: string;
  weeks: string;
  months: string;
  years: string;
  endDate: string;
  endAfter: string;
  occurrences: string;
  daysOfWeek: string;
  dayOfMonth: string;
  createRecurring: string;
  
  // Time Tracking
  timeTracking: string;
  startTimer: string;
  stopTimer: string;
  logTime: string;
  estimatedHours: string;
  actualHours: string;
  timeSpent: string;
  duration: string;
  startTime: string;
  endTime: string;
  timeEntries: string;
  addTimeEntry: string;
  editTimeEntry: string;
  deleteTimeEntry: string;
  totalTime: string;
  todayTime: string;
  thisWeekTime: string;
  
  // Timeline/Gantt
  timeline: string;
  ganttChart: string;
  startDate: string;
  
  // Templates
  templates: string;
  projectTemplates: string;
  useTemplate: string;
  createTemplate: string;
  saveAsTemplate: string;
  templateName: string;
  templateDescription: string;
  
  // Reports
  reports: string;
  generateReport: string;
  productivity: string;
  burndown: string;
  velocity: string;
  customReport: string;
  dateRange: string;
  exportReport: string;
  
  // Advanced Features
  approval: string;
  approvals: string;
  approvalWorkflow: string;
  pending: string;
  approved: string;
  rejected: string;
  approve: string;
  reject: string;
  requestApproval: string;

  // Premium Features
  // Dependencies
  dependencies: string;
  addDependency: string;
  removeDependency: string;
  dependencyType: string;
  finishToStart: string;
  startToStart: string;
  finishToFinish: string;
  startToFinish: string;
  lag: string;
  
  // Milestones
  milestones: string;
  addMilestone: string;
  milestone: string;
  milestoneDue: string;
  dependentTasks: string;
  
  // Resources & Budget
  resources: string;
  budget: string;
  addResource: string;
  resourceType: string;
  person: string;
  equipment: string;
  material: string;
  costPerHour: string;
  availability: string;
  skills: string;
  totalBudget: string;
  spentBudget: string;
  remainingBudget: string;
  currency: string;
  category: string;
  
  // Risk Management
  risks: string;
  addRisk: string;
  riskTitle: string;
  riskDescription: string;
  probability: string;
  impact: string;
  riskStatus: string;
  identified: string;
  analyzing: string;
  mitigating: string;
  closed: string;
  mitigation: string;
  riskOwner: string;
  
  // Automation
  automation: string;
  automationRules: string;
  addRule: string;
  ruleName: string;
  trigger: string;
  conditions: string;
  actions: string;
  taskCreated: string;
  taskMoved: string;
  dueDateApproaching: string;
  taskCompleted: string;
  assignUser: string;
  setPriority: string;
  addLabel: string;
  sendNotification: string;
  createTask: string;
  isActive: string;

  // Integrations
  integrations: string;
  integrationsTitle: string;
  integrationsDesc: string;
  availableIntegrations: string;
  configureIntegration: string;
  enableIntegration: string;
  disableIntegration: string;
  integrationSettings: string;
  connectionStatus: string;
  connected: string;
  disconnected: string;
  testIntegration: string;
  
  // Workflows
  workflows: string;
  workflowsTitle: string;
  workflowsDesc: string;
  createWorkflow: string;
  editWorkflow: string;
  deleteWorkflow: string;
  workflowName: string;
  workflowDescription: string;
  workflowTrigger: string;
  workflowActions: string;
  workflowConditions: string;
  enableWorkflow: string;
  disableWorkflow: string;
  workflowStatus: string;
  active: string;
  inactive: string;
  workflowTemplates: string;
  useWorkflowTemplate: string;
  workflowExecution: string;
  executionHistory: string;
  lastExecuted: string;
  executionCount: string;
  workflowLogs: string;
  
  // Reports specific translations
  projects: string;
  completionRate: string;
  overdue: string;
  needsAttention: string;
  avgPerTask: string;
}

export const translations: Record<'ar' | 'en', Translation> = {
  ar: {
    // Navigation
    board: 'اللوحة',
    dashboard: 'لوحة المعلومات',
    controlPanel: 'لوحة التحكم',
    chat: 'المحادثة',
    calendar: 'التقويم',
    systemSettings: 'إعدادات النظام',
    logout: 'تسجيل الخروج',
    welcome: 'مرحباً',

    // Common
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    add: 'إضافة',
    close: 'إغلاق',
    loading: 'جاري التحميل...',
    search: 'بحث',
    filter: 'تصفية',
    clear: 'مسح',
    yes: 'نعم',
    no: 'لا',
    ok: 'موافق',
    error: 'خطأ',
    success: 'نجح',

    // Tasks
    tasks: 'المهام',
    addTask: 'إضافة مهمة',
    taskTitle: 'عنوان المهمة',
    taskDescription: 'وصف المهمة',
    dueDate: 'تاريخ الاستحقاق',
    priority: 'الأولوية',
    high: 'عالية',
    medium: 'متوسطة',
    low: 'منخفضة',
    members: 'الأعضاء',
    labels: 'التسميات',
    attachments: 'المرفقات',
    subtasks: 'المهام الفرعية',
    comments: 'التعليقات',
    progress: 'التقدم',
    completed: 'مكتملة',
    defaultTaskBoard: 'لوحة المهام الافتراضية',

    // Columns
    todo: 'للقيام',
    inProgress: 'قيد التنفيذ',
    done: 'مكتمل',

    // Auth
    login: 'تسجيل الدخول',
    register: 'إنشاء حساب',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    name: 'الاسم',
    loginButton: 'دخول',
    registerButton: 'إنشاء حساب',
    showRegister: 'إنشاء حساب جديد',
    showLogin: 'لديك حساب؟ سجل دخولك',
    invalidEmail: 'البريد الإلكتروني غير صحيح',
    passwordTooShort: 'كلمة المرور قصيرة جداً',
    emailExists: 'البريد الإلكتروني مستخدم بالفعل',
    invalidCredentials: 'بيانات الدخول غير صحيحة',
    nameRequired: 'الاسم مطلوب',
    fieldRequired: 'هذا الحقل مطلوب',

    // System Settings
    systemSettingsTitle: 'إعدادات النظام',
    systemSettingsDesc: 'إدارة إعدادات النظام والتكوين',
    databaseSettings: 'إعدادات قاعدة البيانات',
    databaseSettingsDesc: 'تكوين اتصال قاعدة البيانات',
    activeDirectorySettings: 'إعدادات Active Directory',
    activeDirectorySettingsDesc: 'تكوين مصادقة Active Directory',
    emailSettings: 'إعدادات البريد الإلكتروني',
    emailSettingsDesc: 'تكوين إعدادات البريد الإلكتروني',
    generalSettings: 'الإعدادات العامة',
    generalSettingsDesc: 'الإعدادات العامة للنظام',

    // Database
    databaseType: 'نوع قاعدة البيانات',
    serverAddress: 'عنوان الخادم',
    port: 'المنفذ',
    databaseName: 'اسم قاعدة البيانات',
    username: 'اسم المستخدم',
    customConnectionString: 'نص الاتصال المخصص',
    testConnection: 'اختبار الاتصال',
    testing: 'جاري الاختبار...',
    connectionSuccess: 'تم الاتصال بنجاح',
    connectionFailed: 'فشل الاتصال',

    // Active Directory
    enableAD: 'تفعيل Active Directory',
    domain: 'النطاق',
    adServer: 'خادم AD',
    baseDN: 'Base DN',
    bindUsername: 'اسم مستخدم الربط',
    useSSL: 'استخدام SSL',
    adConnectionSuccess: 'تم الاتصال بـ AD بنجاح',
    adConnectionFailed: 'فشل الاتصال بـ AD',

    // Email
    enableEmailTasks: 'تفعيل مهام البريد الإلكتروني',
    emailProvider: 'مزود البريد الإلكتروني',
    emailServer: 'خادم البريد الإلكتروني',
    taskEmailAddress: 'عنوان بريد المهام',
    useTLS: 'استخدام TLS',
    autoCreateTasks: 'إنشاء المهام تلقائياً',
    emailInstructions: 'تعليمات البريد الإلكتروني',
    emailConnectionSuccess: 'تم الاتصال بالبريد الإلكتروني بنجاح',
    emailConnectionFailed: 'فشل الاتصال بالبريد الإلكتروني',
    emailInstruction1: 'أرسل بريد إلكتروني إلى العنوان أعلاه لإنشاء مهمة',
    emailInstruction2: 'موضوع البريد سيصبح عنوان المهمة',
    emailInstruction3: 'محتوى البريد سيصبح وصف المهمة',
    emailInstruction4: 'المرفقات ستُضاف إلى المهمة',

    // General
    organizationName: 'اسم المؤسسة',
    systemUrl: 'رابط النظام',
    defaultLanguage: 'اللغة الافتراضية',
    timezone: 'المنطقة الزمنية',
    dateFormat: 'تنسيق التاريخ',
    allowSelfRegistration: 'السماح بالتسجيل الذاتي',
    requireEmailVerification: 'طلب تأكيد البريد الإلكتروني',
    sessionTimeout: 'انتهاء الجلسة',
    sessionTimeoutMinutes: 'دقائق انتهاء الجلسة',
    organizationPlaceholder: 'اسم مؤسستك',
    systemUrlPlaceholder: 'https://yourdomain.com',
    connectionStringPlaceholder: 'Server=localhost;Database=TaqTask;...',
    emailServerPlaceholder: 'mail.yourdomain.com',
    taskEmailPlaceholder: 'tasks@yourdomain.com',

    // Actions
    saveSettings: 'حفظ الإعدادات',
    saving: 'جاري الحفظ...',
    cancelChanges: 'إلغاء التغييرات',
    settingsSaved: 'تم حفظ الإعدادات',
    settingsError: 'خطأ في حفظ الإعدادات',
    lastSaved: 'آخر حفظ',
    notSavedYet: 'لم يتم الحفظ بعد',

    // Language
    arabic: 'العربية',
    english: 'English',
    changeLanguage: 'تغيير اللغة',

    // Chat
    chats: 'المحادثات',
    newChat: 'محادثة جديدة',
    startNewChat: 'بدء محادثة جديدة',
    noChatsYet: 'لا توجد محادثات بعد',
    selectChatToStart: 'اختر محادثة للبدء',
    selectChatFromList: 'اختر محادثة من القائمة',
    startConversation: 'بدء المحادثة',
    typeMessage: 'اكتب رسالة...',
    send: 'إرسال',
    online: 'متصل',
    chatMembers: 'أعضاء المحادثة',
    createChat: 'إنشاء محادثة',

    // Password Management
    changePassword: 'تغيير كلمة المرور',
    currentPassword: 'كلمة المرور الحالية',
    newPassword: 'كلمة المرور الجديدة',
    confirmPassword: 'تأكيد كلمة المرور',
    forgotPassword: 'نسيت كلمة المرور؟',
    resetPassword: 'إعادة تعيين كلمة المرور',
    passwordChanged: 'تم تغيير كلمة المرور',
    passwordMismatch: 'كلمات المرور غير متطابقة',
    currentPasswordIncorrect: 'كلمة المرور الحالية غير صحيحة',
    passwordResetSent: 'تم إرسال رابط إعادة التعيين',
    enterEmailForReset: 'أدخل بريدك الإلكتروني لإعادة تعيين كلمة المرور',
    backToLogin: 'العودة لتسجيل الدخول',
    resetPasswordTitle: 'إعادة تعيين كلمة المرور',
    sendResetLink: 'إرسال رابط الإعادة',

    // New Planner Features
    // Recurring Tasks
    recurring: 'متكررة',
    recurrence: 'التكرار',
    repeatTask: 'تكرار المهمة',
    daily: 'يومياً',
    weekly: 'أسبوعياً',
    monthly: 'شهرياً',
    yearly: 'سنوياً',
    every: 'كل',
    days: 'أيام',
    weeks: 'أسابيع',
    months: 'أشهر',
    years: 'سنوات',
    endDate: 'تاريخ الانتهاء',
    endAfter: 'انتهاء بعد',
    occurrences: 'مرات',
    daysOfWeek: 'أيام الأسبوع',
    dayOfMonth: 'يوم من الشهر',
    createRecurring: 'إنشاء مهمة متكررة',
    
    // Time Tracking
    timeTracking: 'تتبع الوقت',
    startTimer: 'بدء المؤقت',
    stopTimer: 'إيقاف المؤقت',
    logTime: 'تسجيل الوقت',
    estimatedHours: 'الساعات المقدرة',
    actualHours: 'الساعات الفعلية',
    timeSpent: 'الوقت المستغرق',
    duration: 'المدة',
    startTime: 'وقت البداية',
    endTime: 'وقت النهاية',
    timeEntries: 'إدخالات الوقت',
    addTimeEntry: 'إضافة إدخال وقت',
    editTimeEntry: 'تعديل إدخال الوقت',
    deleteTimeEntry: 'حذف إدخال الوقت',
    totalTime: 'إجمالي الوقت',
    todayTime: 'وقت اليوم',
    thisWeekTime: 'وقت هذا الأسبوع',
    
    // Timeline/Gantt
    timeline: 'الخط الزمني',
    ganttChart: 'مخطط جانت',
    startDate: 'تاريخ البداية',
    dependencies: 'التبعيات',
    addDependency: 'إضافة تبعية',
    removeDependency: 'إزالة التبعية',
    
    // Templates
    templates: 'القوالب',
    projectTemplates: 'قوالب المشاريع',
    useTemplate: 'استخدام القالب',
    createTemplate: 'إنشاء قالب',
    saveAsTemplate: 'حفظ كقالب',
    templateName: 'اسم القالب',
    templateDescription: 'وصف القالب',
    
    // Reports
    reports: 'التقارير',
    generateReport: 'إنشاء تقرير',
    productivity: 'الإنتاجية',
    burndown: 'مخطط الإنجاز',
    velocity: 'السرعة',
    customReport: 'تقرير مخصص',
    dateRange: 'نطاق التاريخ',
    exportReport: 'تصدير التقرير',
    
    // Advanced Features
    approval: 'الموافقة',
    approvals: 'الموافقات',
    approvalWorkflow: 'سير عمل الموافقة',
    pending: 'في الانتظار',
    approved: 'موافق عليه',
    rejected: 'مرفوض',
    approve: 'موافقة',
    reject: 'رفض',
    requestApproval: 'طلب موافقة',

    // Premium Features - Arabic
    dependencyType: 'نوع التبعية',
    finishToStart: 'انتهاء إلى بداية',
    startToStart: 'بداية إلى بداية',
    finishToFinish: 'انتهاء إلى انتهاء',
    startToFinish: 'بداية إلى انتهاء',
    lag: 'التأخير',
    
    milestones: 'المعالم',
    addMilestone: 'إضافة معلم',
    milestone: 'معلم',
    milestoneDue: 'استحقاق المعلم',
    dependentTasks: 'المهام التابعة',
    
    resources: 'الموارد',
    budget: 'الميزانية',
    addResource: 'إضافة مورد',
    resourceType: 'نوع المورد',
    person: 'شخص',
    equipment: 'معدات',
    material: 'مواد',
    costPerHour: 'التكلفة بالساعة',
    availability: 'التوفر',
    skills: 'المهارات',
    totalBudget: 'إجمالي الميزانية',
    spentBudget: 'الميزانية المنفقة',
    remainingBudget: 'الميزانية المتبقية',
    currency: 'العملة',
    category: 'الفئة',
    
    risks: 'المخاطر',
    addRisk: 'إضافة مخاطرة',
    riskTitle: 'عنوان المخاطرة',
    riskDescription: 'وصف المخاطرة',
    probability: 'الاحتمالية',
    impact: 'التأثير',
    riskStatus: 'حالة المخاطرة',
    identified: 'محددة',
    analyzing: 'قيد التحليل',
    mitigating: 'قيد التخفيف',
    closed: 'مغلقة',
    mitigation: 'التخفيف',
    riskOwner: 'مالك المخاطرة',
    
    automation: 'الأتمتة',
    automationRules: 'قواعد الأتمتة',
    addRule: 'إضافة قاعدة',
    ruleName: 'اسم القاعدة',
    trigger: 'المحفز',
    conditions: 'الشروط',
    actions: 'الإجراءات',
    taskCreated: 'إنشاء مهمة',
    taskMoved: 'نقل مهمة',
    dueDateApproaching: 'اقتراب تاريخ الاستحقاق',
    taskCompleted: 'اكتمال مهمة',
    assignUser: 'تعيين مستخدم',
    setPriority: 'تحديد الأولوية',
    addLabel: 'إضافة تسمية',
    sendNotification: 'إرسال إشعار',
    createTask: 'إنشاء مهمة',
    isActive: 'نشط',

    // Integrations - Arabic
    integrations: 'التكاملات',
    integrationsTitle: 'التكاملات الخارجية',
    integrationsDesc: 'ربط النظام مع الخدمات الخارجية',
    availableIntegrations: 'التكاملات المتاحة',
    configureIntegration: 'تكوين التكامل',
    enableIntegration: 'تفعيل التكامل',
    disableIntegration: 'إلغاء تفعيل التكامل',
    integrationSettings: 'إعدادات التكامل',
    connectionStatus: 'حالة الاتصال',
    connected: 'متصل',
    disconnected: 'غير متصل',
    testIntegration: 'اختبار التكامل',
    
    // Workflows - Arabic
    workflows: 'سير العمل',
    workflowsTitle: 'إدارة سير العمل',
    workflowsDesc: 'أتمتة العمليات والمهام',
    createWorkflow: 'إنشاء سير عمل',
    editWorkflow: 'تعديل سير العمل',
    deleteWorkflow: 'حذف سير العمل',
    workflowName: 'اسم سير العمل',
    workflowDescription: 'وصف سير العمل',
    workflowTrigger: 'محفز سير العمل',
    workflowActions: 'إجراءات سير العمل',
    workflowConditions: 'شروط سير العمل',
    enableWorkflow: 'تفعيل سير العمل',
    disableWorkflow: 'إلغاء تفعيل سير العمل',
    workflowStatus: 'حالة سير العمل',
    active: 'نشط',
    inactive: 'غير نشط',
    workflowTemplates: 'قوالب سير العمل',
    useWorkflowTemplate: 'استخدام قالب سير العمل',
    workflowExecution: 'تنفيذ سير العمل',
    executionHistory: 'تاريخ التنفيذ',
    lastExecuted: 'آخر تنفيذ',
    executionCount: 'عدد مرات التنفيذ',
    workflowLogs: 'سجلات سير العمل',
    
    // Reports specific translations - Arabic
    projects: 'مشاريع',
    completionRate: 'معدل الإنجاز',
    overdue: 'متأخرة',
    needsAttention: 'تحتاج انتباه',
    avgPerTask: 'متوسط لكل مهمة'
  },
  en: {
    // Navigation
    board: 'Board',
    dashboard: 'Dashboard',
    controlPanel: 'Control Panel',
    chat: 'Chat',
    calendar: 'Calendar',
    systemSettings: 'System Settings',
    logout: 'Logout',
    welcome: 'Welcome',

    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    close: 'Close',
    loading: 'Loading...',
    search: 'Search',
    filter: 'Filter',
    clear: 'Clear',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    error: 'Error',
    success: 'Success',

    // Tasks
    tasks: 'Tasks',
    addTask: 'Add Task',
    taskTitle: 'Task Title',
    taskDescription: 'Task Description',
    dueDate: 'Due Date',
    priority: 'Priority',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    members: 'Members',
    labels: 'Labels',
    attachments: 'Attachments',
    subtasks: 'Subtasks',
    comments: 'Comments',
    progress: 'Progress',
    completed: 'Completed',
    defaultTaskBoard: 'Default Task Board',

    // Columns
    todo: 'To Do',
    inProgress: 'In Progress',
    done: 'Done',

    // Auth
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    name: 'Name',
    loginButton: 'Login',
    registerButton: 'Register',
    showRegister: 'Create new account',
    showLogin: 'Already have an account? Login',
    invalidEmail: 'Invalid email address',
    passwordTooShort: 'Password is too short',
    emailExists: 'Email already exists',
    invalidCredentials: 'Invalid credentials',
    nameRequired: 'Name is required',
    fieldRequired: 'This field is required',

    // System Settings
    systemSettingsTitle: 'System Settings',
    systemSettingsDesc: 'Manage system settings and configuration',
    databaseSettings: 'Database Settings',
    databaseSettingsDesc: 'Configure database connection',
    activeDirectorySettings: 'Active Directory Settings',
    activeDirectorySettingsDesc: 'Configure Active Directory authentication',
    emailSettings: 'Email Settings',
    emailSettingsDesc: 'Configure email settings',
    generalSettings: 'General Settings',
    generalSettingsDesc: 'General system settings',

    // Database
    databaseType: 'Database Type',
    serverAddress: 'Server Address',
    port: 'Port',
    databaseName: 'Database Name',
    username: 'Username',
    customConnectionString: 'Custom Connection String',
    testConnection: 'Test Connection',
    testing: 'Testing...',
    connectionSuccess: 'Connection successful',
    connectionFailed: 'Connection failed',

    // Active Directory
    enableAD: 'Enable Active Directory',
    domain: 'Domain',
    adServer: 'AD Server',
    baseDN: 'Base DN',
    bindUsername: 'Bind Username',
    useSSL: 'Use SSL',
    adConnectionSuccess: 'AD connection successful',
    adConnectionFailed: 'AD connection failed',

    // Email
    enableEmailTasks: 'Enable Email Tasks',
    emailProvider: 'Email Provider',
    emailServer: 'Email Server',
    taskEmailAddress: 'Task Email Address',
    useTLS: 'Use TLS',
    autoCreateTasks: 'Auto Create Tasks',
    emailInstructions: 'Email Instructions',
    emailConnectionSuccess: 'Email connection successful',
    emailConnectionFailed: 'Email connection failed',
    emailInstruction1: 'Send an email to the address above to create a task',
    emailInstruction2: 'Email subject will become the task title',
    emailInstruction3: 'Email body will become the task description',
    emailInstruction4: 'Attachments will be added to the task',

    // General
    organizationName: 'Organization Name',
    systemUrl: 'System URL',
    defaultLanguage: 'Default Language',
    timezone: 'Timezone',
    dateFormat: 'Date Format',
    allowSelfRegistration: 'Allow Self Registration',
    requireEmailVerification: 'Require Email Verification',
    sessionTimeout: 'Session Timeout',
    sessionTimeoutMinutes: 'Session Timeout (Minutes)',
    organizationPlaceholder: 'Your Organization Name',
    systemUrlPlaceholder: 'https://yourdomain.com',
    connectionStringPlaceholder: 'Server=localhost;Database=TaqTask;...',
    emailServerPlaceholder: 'mail.yourdomain.com',
    taskEmailPlaceholder: 'tasks@yourdomain.com',

    // Actions
    saveSettings: 'Save Settings',
    saving: 'Saving...',
    cancelChanges: 'Cancel Changes',
    settingsSaved: 'Settings saved',
    settingsError: 'Error saving settings',
    lastSaved: 'Last saved',
    notSavedYet: 'Not saved yet',

    // Language
    arabic: 'العربية',
    english: 'English',
    changeLanguage: 'Change Language',

    // Chat
    chats: 'Chats',
    newChat: 'New Chat',
    startNewChat: 'Start New Chat',
    noChatsYet: 'No chats yet',
    selectChatToStart: 'Select a chat to start',
    selectChatFromList: 'Select a chat from the list',
    startConversation: 'Start conversation',
    typeMessage: 'Type a message...',
    send: 'Send',
    online: 'Online',
    chatMembers: 'Chat Members',
    createChat: 'Create Chat',

    // Password Management
    changePassword: 'Change Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot Password?',
    resetPassword: 'Reset Password',
    passwordChanged: 'Password changed successfully',
    passwordMismatch: 'Passwords do not match',
    currentPasswordIncorrect: 'Current password is incorrect',
    passwordResetSent: 'Password reset link sent',
    enterEmailForReset: 'Enter your email to reset password',
    backToLogin: 'Back to Login',
    resetPasswordTitle: 'Reset Password',
    sendResetLink: 'Send Reset Link',

    // New Planner Features
    // Recurring Tasks
    recurring: 'Recurring',
    recurrence: 'Recurrence',
    repeatTask: 'Repeat Task',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
    every: 'Every',
    days: 'Days',
    weeks: 'Weeks',
    months: 'Months',
    years: 'Years',
    endDate: 'End Date',
    endAfter: 'End After',
    occurrences: 'Occurrences',
    daysOfWeek: 'Days of Week',
    dayOfMonth: 'Day of Month',
    createRecurring: 'Create Recurring Task',
    
    // Time Tracking
    timeTracking: 'Time Tracking',
    startTimer: 'Start Timer',
    stopTimer: 'Stop Timer',
    logTime: 'Log Time',
    estimatedHours: 'Estimated Hours',
    actualHours: 'Actual Hours',
    timeSpent: 'Time Spent',
    duration: 'Duration',
    startTime: 'Start Time',
    endTime: 'End Time',
    timeEntries: 'Time Entries',
    addTimeEntry: 'Add Time Entry',
    editTimeEntry: 'Edit Time Entry',
    deleteTimeEntry: 'Delete Time Entry',
    totalTime: 'Total Time',
    todayTime: 'Today Time',
    thisWeekTime: 'This Week Time',
    
    // Timeline/Gantt
    timeline: 'Timeline',
    ganttChart: 'Gantt Chart',
    startDate: 'Start Date',
    dependencies: 'Dependencies',
    addDependency: 'Add Dependency',
    removeDependency: 'Remove Dependency',
    
    // Templates
    templates: 'Templates',
    projectTemplates: 'Project Templates',
    useTemplate: 'Use Template',
    createTemplate: 'Create Template',
    saveAsTemplate: 'Save as Template',
    templateName: 'Template Name',
    templateDescription: 'Template Description',
    
    // Reports
    reports: 'Reports',
    generateReport: 'Generate Report',
    productivity: 'Productivity',
    burndown: 'Burndown',
    velocity: 'Velocity',
    customReport: 'Custom Report',
    dateRange: 'Date Range',
    exportReport: 'Export Report',
    
    // Advanced Features
    approval: 'Approval',
    approvals: 'Approvals',
    approvalWorkflow: 'Approval Workflow',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    approve: 'Approve',
    reject: 'Reject',
    requestApproval: 'Request Approval',

    // Premium Features - English
    dependencyType: 'Dependency Type',
    finishToStart: 'Finish to Start',
    startToStart: 'Start to Start',
    finishToFinish: 'Finish to Finish',
    startToFinish: 'Start to Finish',
    lag: 'Lag',
    
    milestones: 'Milestones',
    addMilestone: 'Add Milestone',
    milestone: 'Milestone',
    milestoneDue: 'Milestone Due',
    dependentTasks: 'Dependent Tasks',
    
    resources: 'Resources',
    budget: 'Budget',
    addResource: 'Add Resource',
    resourceType: 'Resource Type',
    person: 'Person',
    equipment: 'Equipment',
    material: 'Material',
    costPerHour: 'Cost per Hour',
    availability: 'Availability',
    skills: 'Skills',
    totalBudget: 'Total Budget',
    spentBudget: 'Spent Budget',
    remainingBudget: 'Remaining Budget',
    currency: 'Currency',
    category: 'Category',
    
    risks: 'Risks',
    addRisk: 'Add Risk',
    riskTitle: 'Risk Title',
    riskDescription: 'Risk Description',
    probability: 'Probability',
    impact: 'Impact',
    riskStatus: 'Risk Status',
    identified: 'Identified',
    analyzing: 'Analyzing',
    mitigating: 'Mitigating',
    closed: 'Closed',
    mitigation: 'Mitigation',
    riskOwner: 'Risk Owner',
    
    automation: 'Automation',
    automationRules: 'Automation Rules',
    addRule: 'Add Rule',
    ruleName: 'Rule Name',
    trigger: 'Trigger',
    conditions: 'Conditions',
    actions: 'Actions',
    taskCreated: 'Task Created',
    taskMoved: 'Task Moved',
    dueDateApproaching: 'Due Date Approaching',
    taskCompleted: 'Task Completed',
    assignUser: 'Assign User',
    setPriority: 'Set Priority',
    addLabel: 'Add Label',
    sendNotification: 'Send Notification',
    createTask: 'Create Task',
    isActive: 'Is Active',

    // Integrations - English
    integrations: 'Integrations',
    integrationsTitle: 'External Integrations',
    integrationsDesc: 'Connect the system with external services',
    availableIntegrations: 'Available Integrations',
    configureIntegration: 'Configure Integration',
    enableIntegration: 'Enable Integration',
    disableIntegration: 'Disable Integration',
    integrationSettings: 'Integration Settings',
    connectionStatus: 'Connection Status',
    connected: 'Connected',
    disconnected: 'Disconnected',
    testIntegration: 'Test Integration',
    
    // Workflows - English
    workflows: 'Workflows',
    workflowsTitle: 'Workflow Management',
    workflowsDesc: 'Automate processes and tasks',
    createWorkflow: 'Create Workflow',
    editWorkflow: 'Edit Workflow',
    deleteWorkflow: 'Delete Workflow',
    workflowName: 'Workflow Name',
    workflowDescription: 'Workflow Description',
    workflowTrigger: 'Workflow Trigger',
    workflowActions: 'Workflow Actions',
    workflowConditions: 'Workflow Conditions',
    enableWorkflow: 'Enable Workflow',
    disableWorkflow: 'Disable Workflow',
    workflowStatus: 'Workflow Status',
    active: 'Active',
    inactive: 'Inactive',
    workflowTemplates: 'Workflow Templates',
    useWorkflowTemplate: 'Use Workflow Template',
    workflowExecution: 'Workflow Execution',
    executionHistory: 'Execution History',
    lastExecuted: 'Last Executed',
    executionCount: 'Execution Count',
    workflowLogs: 'Workflow Logs',
    
    // Reports specific translations - English
    projects: 'Projects',
    completionRate: 'Completion Rate',
    overdue: 'Overdue',
    needsAttention: 'Needs Attention',
    avgPerTask: 'Avg per Task'
  }
};
