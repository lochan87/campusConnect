import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX, FiBook, FiSliders, FiCheckCircle, FiCopy, FiCheck
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const courseCodeMapping = {
  'BEN': 'B.E (Bachelor of Engineering)',
  'MTE': 'M.Tech (Master of Technology)',
  'MBA': 'MBA (Master of Business Administration)',
  'BBA': 'BBA (Bachelor of Business Administration)',
  'BCO': 'B.Com (Bachelor of Commerce)',
  'MCO': 'M.Com (Master of Commerce)',
  'PHD': 'Ph.D (Doctor of Philosophy)',
  'BCA': 'BCA (Bachelor of Computer Applications)',
  'MCA': 'MCA (Master of Computer Applications)',
  'BDS': 'Dental (Bachelor of Dental Surgery)',
  'MBS': 'MBBS (Bachelor of Medicine and Bachelor of Surgery)',
  'BSC': 'B.Sc (Bachelor of Science)',
  'MSC': 'M.Sc (Master of Science)',
  'BAR': 'BA (Bachelor of Arts)',
  'MAR': 'MA (Master of Arts)',
  'LLB': 'LLB (Bachelor of Laws)',
  'LLM': 'LLM (Master of Laws)',
  'BED': 'B.Ed (Bachelor of Education)',
  'MED': 'M.Ed (Master of Education)',
};

const departmentCodeMapping = {
  'B.E (Bachelor of Engineering)': { '01':'Artificial Intelligence and Machine Learning','02':'Computer Science & Engineering (Data Science)','03':'Information Science and Engineering','04':'CS & Engg (IoT and Cyber Security incl. Block Chain Technology)','05':'Electronics and Instrumentation Engineering','06':'Computer Science and Design','07':'Mechanical Engineering','08':'Computer Science and Engineering','09':'Medical Electronics Engineering','10':'Computer Science and Business Systems','11':'Electronics and Telecommunication Engineering','12':'CS & Engineering (Cyber Security)','13':'Robotics and Artificial Intelligence','14':'Aeronautical Engineering','15':'Chemical Engineering','16':'Automobile Engineering','17':'Civil Engineering','18':'Biotechnology','19':'Electrical & Electronics Engineering','20':'Electronics & Communication Engineering' },
  'M.Tech (Master of Technology)': { '01':'Artificial Intelligence and Machine Learning','02':'Computer Science & Engineering (Data Science)','03':'Information Science and Engineering','04':'CS & Engg (IoT and Cyber Security)','05':'Electronics and Instrumentation Engineering','06':'Computer Science and Design','07':'Mechanical Engineering','08':'Computer Science and Engineering','09':'Medical Electronics Engineering','10':'Computer Science and Business Systems','11':'Electronics and Telecommunication Engineering','12':'CS & Engineering (Cyber Security)','13':'Robotics and Artificial Intelligence','14':'Aeronautical Engineering','15':'Chemical Engineering','16':'Automobile Engineering','17':'Civil Engineering','18':'Biotechnology','19':'Electrical & Electronics Engineering','20':'Electronics & Communication Engineering' },
  'MBA (Master of Business Administration)': { '01':'Finance','02':'Marketing','03':'Human Resources','04':'Operations Management','05':'International Business','06':'Business Analytics','07':'Entrepreneurship','08':'Supply Chain Management' },
  'BBA (Bachelor of Business Administration)': { '01':'Finance','02':'Marketing','03':'Human Resources','04':'Operations Management','05':'International Business','06':'Business Analytics','07':'Entrepreneurship','08':'Supply Chain Management' },
  'B.Com (Bachelor of Commerce)': { '01':'Accounting','02':'Banking & Finance','03':'Taxation','04':'Economics','05':'Business Mathematics','06':'Corporate Secretaryship' },
  'M.Com (Master of Commerce)': { '01':'Accounting','02':'Banking & Finance','03':'Taxation','04':'Economics','05':'Business Mathematics','06':'Corporate Secretaryship' },
  'BCA (Bachelor of Computer Applications)': { '01':'Software Development','02':'Database Management','03':'Web Technologies','04':'Mobile Application Development','05':'System Analysis and Design','06':'Network Administration' },
  'MCA (Master of Computer Applications)': { '01':'Software Development','02':'Database Management','03':'Web Technologies','04':'Mobile Application Development','05':'System Analysis and Design','06':'Network Administration' },
  'MBBS (Bachelor of Medicine and Bachelor of Surgery)': { '01':'General Medicine','02':'Surgery','03':'Pediatrics','04':'Cardiology','05':'Neurology','06':'Orthopedics','07':'Dermatology','08':'Radiology','09':'Anesthesiology','10':'Pathology' },
  'Dental (Bachelor of Dental Surgery)': { '01':'Oral & Maxillofacial Surgery','02':'Orthodontics','03':'Periodontics','04':'Endodontics','05':'Prosthodontics','06':'Oral Medicine' },
  'B.Sc (Bachelor of Science)': { '01':'Physics','02':'Chemistry','03':'Mathematics','04':'Biology','05':'Microbiology','06':'Biochemistry','07':'Zoology','08':'Botany','09':'Environmental Science','10':'Statistics' },
  'M.Sc (Master of Science)': { '01':'Physics','02':'Chemistry','03':'Mathematics','04':'Biology','05':'Microbiology','06':'Biochemistry','07':'Zoology','08':'Botany','09':'Environmental Science','10':'Statistics' },
  'BA (Bachelor of Arts)': { '01':'English Literature','02':'Hindi Literature','03':'History','04':'Political Science','05':'Sociology','06':'Philosophy','07':'Psychology','08':'Geography','09':'Journalism & Mass Communication','10':'Fine Arts','11':'Music','12':'Dance' },
  'MA (Master of Arts)': { '01':'English Literature','02':'Hindi Literature','03':'History','04':'Political Science','05':'Sociology','06':'Philosophy','07':'Psychology','08':'Geography','09':'Journalism & Mass Communication','10':'Fine Arts','11':'Music','12':'Dance' },
  'LLB (Bachelor of Laws)': { '01':'Constitutional Law','02':'Criminal Law','03':'Corporate Law','04':'International Law','05':'Civil Law','06':'Intellectual Property Law','07':'Environmental Law' },
  'LLM (Master of Laws)': { '01':'Constitutional Law','02':'Criminal Law','03':'Corporate Law','04':'International Law','05':'Civil Law','06':'Intellectual Property Law','07':'Environmental Law' },
  'B.Ed (Bachelor of Education)': { '01':'Primary Education','02':'Secondary Education','03':'Special Education','04':'Educational Psychology','05':'Curriculum Development','06':'Educational Technology','07':'Physical Education' },
  'M.Ed (Master of Education)': { '01':'Primary Education','02':'Secondary Education','03':'Special Education','04':'Educational Psychology','05':'Curriculum Development','06':'Educational Technology','07':'Physical Education' },
  'Ph.D (Doctor of Philosophy)': { '01':'Engineering & Technology','02':'Business & Management','03':'Commerce & Economics','04':'Computer Applications','05':'Medical Sciences','06':'Basic Sciences','07':'Arts & Humanities','08':'Law','09':'Education' },
};

/**
 * StudentIdModal
 * @param {() => void}           onClose          - close handler
 * @param {(id: string) => void} [onApply]         - if provided, shows "Use This ID" button (Register only)
 * @param {string}               [initialStudentId] - pre-fill builder from an existing ID
 */
const StudentIdModal = ({ onClose, onApply, initialStudentId }) => {
  const [activeTab, setActiveTab] = useState('directory');
  const [guideSelectedCourse, setGuideSelectedCourse] = useState('BEN');
  const [copiedId, setCopiedId] = useState(false);

  const prefill = (() => {
    if (initialStudentId && initialStudentId.length === 10) {
      return {
        year: initialStudentId.substring(0, 2),
        course: initialStudentId.substring(2, 5).toUpperCase(),
        dept: initialStudentId.substring(5, 7),
        roll: initialStudentId.substring(7, 10),
      };
    }
    return { year: '24', course: 'BEN', dept: '01', roll: '001' };
  })();

  const [builderYear, setBuilderYear] = useState(prefill.year);
  const [builderCourseCode, setBuilderCourseCode] = useState(prefill.course);
  const [builderDeptCode, setBuilderDeptCode] = useState(prefill.dept);
  const [builderRollNo, setBuilderRollNo] = useState(prefill.roll);

  const handleBuilderCourseChange = (code) => {
    setBuilderCourseCode(code);
    const fullName = courseCodeMapping[code];
    if (fullName && departmentCodeMapping[fullName]) {
      const depts = Object.keys(departmentCodeMapping[fullName]);
      if (!depts.includes(builderDeptCode)) setBuilderDeptCode(depts[0] || '01');
    }
  };

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    toast.success(`Copied ${id} to clipboard!`);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const formattedRoll = (builderRollNo || '001').padStart(3, '0');
  const fullGeneratedId = `${builderYear}${builderCourseCode}${builderDeptCode}${formattedRoll}`.toUpperCase();
  const currentCourseName = courseCodeMapping[builderCourseCode] || '';
  const currentDepts = departmentCodeMapping[currentCourseName] || {};
  const currentDeptName = currentDepts[builderDeptCode] || '';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-200 dark:border-blue-900/60 shadow-2xl w-full max-w-lg overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-blue-50 dark:bg-blue-950/40 border-b border-blue-200 dark:border-blue-900/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0">
              <FiSliders className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">Student ID Assistant</span>
              <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide">Helper</span>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher — same spring-animated layoutId pattern as Posts/Polls/Events */}
        <div className="px-5 pt-3 pb-0">
          <div className="bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl flex gap-1 relative">
            {[
              { id: 'directory', icon: FiBook, label: 'Codes & Directory' },
              { id: 'builder',   icon: FiSliders, label: 'ID Builder' },
            ].map(({ id, icon: Icon, label }) => {
              const isActive = activeTab === id;
              return (
                <button key={id} type="button" onClick={() => setActiveTab(id)}
                  className={`relative flex-1 py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 z-10 transition-colors ${
                    isActive
                      ? 'text-blue-700 dark:text-blue-400'
                      : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}>
                  {isActive && (
                    <motion.div
                      layoutId="studentIdTabIndicator"
                      className="absolute inset-0 bg-white dark:bg-gray-700 rounded-lg -z-10 shadow-sm border border-blue-200/50 dark:border-blue-700/30"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="px-5 pt-2 pb-5 max-h-[55vh] overflow-y-auto">
          <AnimatePresence mode="wait">

            {activeTab === 'directory' && (
              <motion.div key="dir" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                transition={{ type: 'spring', damping: 25, stiffness: 280 }} className="space-y-4">
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { code: 'YY',  name: 'Year',    eg: '24 = 2024', color: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/60',     text: 'text-amber-700 dark:text-amber-300' },
                    { code: 'CCC', name: 'Course',  eg: 'BEN = B.E', color: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800/60',           text: 'text-blue-700 dark:text-blue-300' },
                    { code: 'DD',  name: 'Dept',    eg: '08 = CSE',  color: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/60', text: 'text-emerald-700 dark:text-emerald-300' },
                    { code: 'NNN', name: 'Roll No', eg: '001',       color: 'bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800/60',    text: 'text-purple-700 dark:text-purple-300' },
                  ].map(({ code, name, eg, color, text }) => (
                    <div key={code} className={`${color} border rounded-xl p-2 text-center`}>
                      <span className={`font-mono font-bold text-sm ${text}`}>{code}</span>
                      <p className={`text-[10px] font-semibold ${text}`}>{name}</p>
                      <p className="text-[9px] text-gray-500 dark:text-gray-400">{eg}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">Select Course to View Dept Codes:</label>
                  <select value={guideSelectedCourse} onChange={e => setGuideSelectedCourse(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 transition-colors">
                    {Object.entries(courseCodeMapping).map(([code, name]) => (
                      <option key={code} value={code}>[{code}] {name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Dept Codes for {courseCodeMapping[guideSelectedCourse]}:
                  </p>
                  {(() => {
                    const entries = Object.entries(departmentCodeMapping[courseCodeMapping[guideSelectedCourse]] || {}).sort((a,b) => parseInt(a[0])-parseInt(b[0]));
                    if (!entries.length) return <p className="text-xs text-gray-400 py-3 text-center">No departments found.</p>;
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {entries.map(([dCode, dName]) => (
                          <div key={dCode}
                            onClick={() => { handleBuilderCourseChange(guideSelectedCourse); setBuilderDeptCode(dCode); setActiveTab('builder'); }}
                            className="flex items-center gap-2 p-2 bg-gray-50 hover:bg-blue-50 dark:bg-gray-800/60 dark:hover:bg-gray-700/80 rounded-lg border border-gray-200/80 dark:border-gray-700/60 hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer transition-all group">
                            <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-mono font-bold text-[11px] px-1.5 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">{dCode}</span>
                            <span className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate group-hover:text-blue-600 dark:group-hover:text-blue-400" title={dName}>{dName}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </motion.div>
            )}

            {activeTab === 'builder' && (
              <motion.div key="build" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ type: 'spring', damping: 25, stiffness: 280 }} className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700/60 p-3 space-y-3">
                  <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Configure Student ID Fields</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">1. Year (YY)</label>
                      <select value={builderYear} onChange={e => setBuilderYear(e.target.value)}
                        className="w-full px-2.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 transition-colors">
                        {['25','24','23','22','21','20'].map(y => <option key={y} value={y}>20{y} ({y})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">2. Course (CCC)</label>
                      <select value={builderCourseCode} onChange={e => handleBuilderCourseChange(e.target.value)}
                        className="w-full px-2.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 transition-colors">
                        {Object.entries(courseCodeMapping).map(([code, name]) => <option key={code} value={code}>{code} - {name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">3. Dept Code (DD)</label>
                      <select value={builderDeptCode} onChange={e => setBuilderDeptCode(e.target.value)}
                        className="w-full px-2.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 transition-colors">
                        {Object.entries(currentDepts).sort((a,b)=>parseInt(a[0])-parseInt(b[0])).map(([code, name]) => <option key={code} value={code}>{code} - {name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">4. Roll No (NNN)</label>
                      <input type="text" maxLength={3} value={builderRollNo}
                        onChange={e => setBuilderRollNo(e.target.value.replace(/\D/g,'').slice(0,3))}
                        onBlur={() => setBuilderRollNo((builderRollNo||'001').padStart(3,'0'))}
                        placeholder="001"
                        className="w-full px-2.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-blue-500 transition-colors" />
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 rounded-xl border border-blue-200/70 dark:border-gray-700 p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Generated ID
                    </span>
                    <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500">YYCCCDDNNN</span>
                  </div>
                  <div className="flex items-end justify-center gap-2 flex-wrap">
                    {[
                      { val: builderYear,       label: 'Year',   color: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40' },
                      { val: builderCourseCode, label: 'Course', color: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/40' },
                      { val: builderDeptCode,   label: 'Dept',   color: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40' },
                      { val: formattedRoll,     label: 'Roll',   color: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/40' },
                    ].map(({ val, label, color }) => (
                      <div key={label} className="text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-lg font-mono text-lg font-bold border shadow-sm ${color}`}>{val}</span>
                        <p className="text-[9px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white/70 dark:bg-gray-700/60 rounded-lg p-2.5 text-xs space-y-1 border border-blue-100 dark:border-gray-600">
                    <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Course:</span><span className="font-semibold text-blue-700 dark:text-blue-300 truncate max-w-[60%]">{currentCourseName}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Department:</span><span className="font-semibold text-emerald-700 dark:text-emerald-300 truncate max-w-[60%]" title={currentDeptName}>{currentDeptName}</span></div>
                  </div>
                  <div className="flex gap-2">
                    {onApply && (
                      <button type="button" onClick={() => onApply(fullGeneratedId)}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95">
                        <FiCheckCircle className="w-3.5 h-3.5" /> Use This ID
                      </button>
                    )}
                    <button type="button" onClick={() => handleCopy(fullGeneratedId)}
                      className={`${onApply ? '' : 'flex-1'} bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors`}>
                      {copiedId ? <FiCheck className="w-3.5 h-3.5 text-green-600" /> : <FiCopy className="w-3.5 h-3.5" />}
                      {copiedId ? 'Copied!' : 'Copy ID'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default StudentIdModal;
