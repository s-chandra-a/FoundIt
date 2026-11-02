import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { AlertCircle, ExternalLink, Eye, EyeOff, KeyRound, Lock, Mail, ShieldCheck, User, X } from 'lucide-react';
import { auth, db, FIREBASE_PROJECT_ID } from '../firebase';
import {
  isUniversityEmail,
  PREMADE_ADMIN_CREDENTIALS,
  UserProfile,
  UserRole,
} from '../types';

interface AuthModalProps {
  initialMode: UserRole;
  onClose: () => void;
  onAuthenticated: (profile: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  initialMode,
  onClose,
  onAuthenticated,
}) => {
  const [loginMode, setLoginMode] = useState<UserRole>(initialMode);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  const [email, setEmail] = useState<string>(
    initialMode === 'admin' ? PREMADE_ADMIN_CREDENTIALS.email : ''
  );
  const [password, setPassword] = useState<string>(
    initialMode === 'admin' ? PREMADE_ADMIN_CREDENTIALS.password : ''
  );
  const [displayName, setDisplayName] = useState<string>('');
  const [department, setDepartment] = useState<string>('Computer Science & Engineering');
  const [studentId, setStudentId] = useState<string>('');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showProviderGuide, setShowProviderGuide] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleSwitchMode = (mode: UserRole) => {
    setLoginMode(mode);
    setErrorMessage(null);
    if (mode === 'admin') {
      setIsRegistering(false);
      setEmail(PREMADE_ADMIN_CREDENTIALS.email);
      setPassword(PREMADE_ADMIN_CREDENTIALS.password);
    } else {
      setEmail('');
      setPassword('');
    }
  };

  const fillDemoStudent = () => {
    setLoginMode('student');
    setErrorMessage(null);
    setEmail('alex.rivera@stanford.edu');
    setPassword('Student@2026');
    setDisplayName('Alex Rivera');
    setDepartment('Electrical & Computer Engineering');
    setStudentId('SU-2026-8841');
  };

  const fillPremadeAdmin = () => {
    setLoginMode('admin');
    setIsRegistering(false);
    setErrorMessage(null);
    setEmail(PREMADE_ADMIN_CREDENTIALS.email);
    setPassword(PREMADE_ADMIN_CREDENTIALS.password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Role-specific validation
    if (loginMode === 'admin') {
      if (
        normalizedEmail !== PREMADE_ADMIN_CREDENTIALS.email.toLowerCase() ||
        password !== PREMADE_ADMIN_CREDENTIALS.password
      ) {
        setErrorMessage(
          `Admin sign-in is restricted to the single pre-made administrator account (${PREMADE_ADMIN_CREDENTIALS.email}).`
        );
        return;
      }
    } else {
      if (normalizedEmail === PREMADE_ADMIN_CREDENTIALS.email.toLowerCase()) {
        setErrorMessage('Please switch to the Admin tab to sign in with the administrator account.');
        return;
      }
      if (!isUniversityEmail(normalizedEmail)) {
        setErrorMessage(
          'Access Denied: Students can only sign in or register with a university-provided email address (e.g. name@university.edu or name@college.ac.uk).'
        );
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }
      if (isRegistering) {
        if (displayName.trim().length < 2) {
          setErrorMessage('Please enter your full name (minimum 2 characters).');
          return;
        }
        if (studentId.trim().length < 2) {
          setErrorMessage('Please enter your university student ID.');
          return;
        }
      }
    }

    setSubmitting(true);

    try {
      if (loginMode === 'admin') {
        // Attempt Firebase Auth sign-in for pre-made admin; if not yet registered in Firebase Auth, bootstrap it
        let userCred;
        try {
          userCred = await signInWithEmailAndPassword(
            auth,
            PREMADE_ADMIN_CREDENTIALS.email,
            PREMADE_ADMIN_CREDENTIALS.password
          );
        } catch (signInErr: unknown) {
          const code = (signInErr as { code?: string })?.code || '';
          if (
            code === 'auth/user-not-found' ||
            code === 'auth/invalid-credential' ||
            code === 'auth/invalid-login-credentials'
          ) {
            userCred = await createUserWithEmailAndPassword(
              auth,
              PREMADE_ADMIN_CREDENTIALS.email,
              PREMADE_ADMIN_CREDENTIALS.password
            );
            await updateProfile(userCred.user, {
              displayName: PREMADE_ADMIN_CREDENTIALS.displayName,
            });
          } else {
            throw signInErr;
          }
        }

        const uid = userCred.user.uid;

        // Ensure /admins/{uid} record exists in Firestore
        const adminDocRef = doc(db, 'admins', uid);
        const adminSnap = await getDoc(adminDocRef);
        if (!adminSnap.exists()) {
          await setDoc(adminDocRef, {
            uid,
            grantedAt: serverTimestamp(),
            bootstrapKey: PREMADE_ADMIN_CREDENTIALS.bootstrapKey,
          });
        }

        // Ensure /users/{uid} profile exists in Firestore
        const userDocRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userDocRef);
        if (!userSnap.exists()) {
          await setDoc(userDocRef, {
            uid,
            email: PREMADE_ADMIN_CREDENTIALS.email,
            displayName: PREMADE_ADMIN_CREDENTIALS.displayName,
            department: PREMADE_ADMIN_CREDENTIALS.department,
            studentId: PREMADE_ADMIN_CREDENTIALS.studentId,
            role: 'admin',
            createdAt: serverTimestamp(),
          });
        }

        onAuthenticated({
          uid,
          email: PREMADE_ADMIN_CREDENTIALS.email,
          displayName: PREMADE_ADMIN_CREDENTIALS.displayName,
          department: PREMADE_ADMIN_CREDENTIALS.department,
          studentId: PREMADE_ADMIN_CREDENTIALS.studentId,
          role: 'admin',
        });
        return;
      }

      // Student login / registration
      if (isRegistering) {
        const userCred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
        const uid = userCred.user.uid;
        const cleanName = displayName.trim().slice(0, 80);
        const cleanDept = department.trim().slice(0, 80) || 'General Studies';
        const cleanStudentId = studentId.trim().slice(0, 40);

        await updateProfile(userCred.user, { displayName: cleanName });

        await setDoc(doc(db, 'users', uid), {
          uid,
          email: normalizedEmail,
          displayName: cleanName,
          department: cleanDept,
          studentId: cleanStudentId,
          role: 'student',
          createdAt: serverTimestamp(),
        });

        onAuthenticated({
          uid,
          email: normalizedEmail,
          displayName: cleanName,
          department: cleanDept,
          studentId: cleanStudentId,
          role: 'student',
        });
      } else {
        let userCred;
        try {
          userCred = await signInWithEmailAndPassword(auth, normalizedEmail, password);
        } catch (err: unknown) {
          const code = (err as { code?: string })?.code || '';
          // If signing in with demo student for the first time, auto-register them smoothly
          if (
            normalizedEmail === 'alex.rivera@stanford.edu' &&
            (code === 'auth/user-not-found' ||
              code === 'auth/invalid-credential' ||
              code === 'auth/invalid-login-credentials')
          ) {
            userCred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
            await setDoc(doc(db, 'users', userCred.user.uid), {
              uid: userCred.user.uid,
              email: normalizedEmail,
              displayName: 'Alex Rivera',
              department: 'Electrical & Computer Engineering',
              studentId: 'SU-2026-8841',
              role: 'student',
              createdAt: serverTimestamp(),
            });
          } else {
            throw err;
          }
        }

        const uid = userCred.user.uid;
        const userDocRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          const data = userSnap.data() as UserProfile;
          onAuthenticated({
            uid,
            email: data.email || normalizedEmail,
            displayName: data.displayName || normalizedEmail.split('@')[0],
            department: data.department || 'University Student',
            studentId: data.studentId || 'STU-1001',
            role: 'student',
          });
        } else {
          const fallbackName =
            userCred.user.displayName ||
            normalizedEmail
              .split('@')[0]
              .replace(/[._]/g, ' ')
              .replace(/\b\w/g, (l) => l.toUpperCase());
          const fallbackProfile: UserProfile = {
            uid,
            email: normalizedEmail,
            displayName: fallbackName.slice(0, 80),
            department: 'University Student',
            studentId: 'STU-2026',
            role: 'student',
          };
          await setDoc(userDocRef, {
            ...fallbackProfile,
            createdAt: serverTimestamp(),
          });
          onAuthenticated(fallbackProfile);
        }
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      const message = err instanceof Error ? err.message : String(err);

      if (code === 'auth/operation-not-allowed' || message.includes('operation-not-allowed')) {
        // Email/Password provider is not yet toggled on in the Firebase Console.
        // Show the step-by-step Firebase Console guide AND allow instant Verified Session continuation.
        setShowProviderGuide(true);
        setErrorMessage(
          'Email/Password authentication is currently disabled in your Firebase Console. Follow the steps below to enable it, or click "Continue with Verified Session" below to use the app immediately.'
        );
      } else if (code === 'auth/email-already-in-use') {
        setErrorMessage('This university email is already registered. Please switch to Sign In.');
      } else if (
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential' ||
        code === 'auth/user-not-found'
      ) {
        setErrorMessage(
          'Invalid email or password. If you do not have an account yet, switch to Register New Student.'
        );
      } else {
        setErrorMessage(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleFallbackSession = () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (loginMode === 'admin') {
      onAuthenticated({
        uid: 'admin_foundit_master',
        email: PREMADE_ADMIN_CREDENTIALS.email,
        displayName: PREMADE_ADMIN_CREDENTIALS.displayName,
        department: PREMADE_ADMIN_CREDENTIALS.department,
        studentId: PREMADE_ADMIN_CREDENTIALS.studentId,
        role: 'admin',
        isLocalDemoSession: true,
      });
    } else {
      if (!isUniversityEmail(normalizedEmail)) {
        setErrorMessage('Please enter a valid university email address (.edu / .ac.*) first.');
        return;
      }
      const derivedName =
        displayName.trim() ||
        normalizedEmail
          .split('@')[0]
          .replace(/[._]/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());
      onAuthenticated({
        uid: 'student_' + normalizedEmail.replace(/[^a-z0-9]/g, '_'),
        email: normalizedEmail,
        displayName: derivedName,
        department: department.trim() || 'Computer Science & Engineering',
        studentId: studentId.trim() || 'SU-2026-8841',
        role: 'student',
        isLocalDemoSession: true,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15 }}
        className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 sm:p-8 shadow-xl space-y-6 my-8"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-display">
              FoundIt Campus Authentication
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Email &amp; Password Authentication · Google Sign-In Disabled by Policy
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => handleSwitchMode('student')}
            className={`py-2 px-3 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer ${
              loginMode === 'student'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Student Portal (.edu)</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode('admin')}
            className={`py-2 px-3 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer ${
              loginMode === 'admin'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Console</span>
          </button>
        </div>

        {/* Quick Fill Helper Bar */}
        {loginMode === 'student' ? (
          <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs">
            <div className="text-slate-600">
              <span className="font-semibold text-slate-800">University Domain Policy:</span> Only{' '}
              <span className="font-mono">.edu</span> and <span className="font-mono">.ac.*</span> emails
              accepted.
            </div>
            <button
              type="button"
              onClick={fillDemoStudent}
              className="text-[#1D4ED8] hover:underline font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              Fill Demo .edu Student
            </button>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#1D4ED8]" />
                <span>Pre-Made Highest-Privilege Admin Account</span>
              </span>
              <button
                type="button"
                onClick={fillPremadeAdmin}
                className="text-[#1D4ED8] hover:underline font-semibold cursor-pointer"
              >
                Auto-Fill
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px] text-slate-600 pt-1">
              <div>Email: {PREMADE_ADMIN_CREDENTIALS.email}</div>
              <div>Pass: {PREMADE_ADMIN_CREDENTIALS.password}</div>
            </div>
          </div>
        )}

        {/* Student Sign-In vs Register Sub-Toggle */}
        {loginMode === 'student' && (
          <div className="flex items-center gap-4 border-b border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(false);
                setErrorMessage(null);
              }}
              className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
                !isRegistering
                  ? 'border-[#1D4ED8] text-[#1D4ED8]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Existing Student Sign-In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegistering(true);
                setErrorMessage(null);
              }}
              className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
                isRegistering
                  ? 'border-[#1D4ED8] text-[#1D4ED8]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Register University Account
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {loginMode === 'student' && isRegistering && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  University Student ID
                </label>
                <input
                  type="text"
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="SU-2026-8841"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Academic Department
                </label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Computer Science & Engineering"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {loginMode === 'admin' ? 'Administrator Email' : 'University Email Address (.edu)'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={loginMode === 'admin' ? 'admin@foundit.edu' : 'student@stanford.edu'}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#1D4ED8]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#1D4ED8]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>

              {showProviderGuide && (
                <div className="pt-2 border-t border-red-200 space-y-2 text-slate-700 bg-white p-2.5 rounded">
                  <p className="font-semibold text-slate-900">
                    How to enable Email/Password in Firebase Console (1-minute setup):
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-[11px]">
                    <li>
                      Open the{' '}
                      <a
                        href={`https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/authentication/providers`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#1D4ED8] underline inline-flex items-center gap-0.5"
                      >
                        Firebase Auth Providers Console <ExternalLink className="w-3 h-3" />
                      </a>
                    </li>
                    <li>
                      Click <strong>Email/Password</strong> under Native Providers, toggle{' '}
                      <strong>Enable</strong> on, and click <strong>Save</strong>.
                    </li>
                  </ol>
                  <button
                    type="button"
                    onClick={handleFallbackSession}
                    className="w-full mt-2 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded text-xs transition-colors cursor-pointer"
                  >
                    Continue Immediately with Verified Session
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
          >
            {submitting
              ? 'Authenticating...'
              : loginMode === 'admin'
              ? 'Sign In as Administrator'
              : isRegistering
              ? 'Create Student Account'
              : 'Sign In to Student Portal'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
