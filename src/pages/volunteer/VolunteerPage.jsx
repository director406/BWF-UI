import { useState, useEffect, useMemo } from "react";
import {
  CheckCircle, Heart, Users, Clock, Award, Camera,
  Upload, X, Flame, UserPlus, Search, MapPin, Maximize2, Sparkles, ChevronDown, ChevronUp
} from "lucide-react";
import { saveVolunteerApplication, getAllVolunteers, getAllCheckIns } from "../../services/firestoreService";
import { notifyAdminSubmission } from "../../services/emailService";
import { PageHeader } from "../../components/common";

const INPUT = "w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400 dark:placeholder:text-slate-500";

const perks = [
  { icon: Heart, title: "Make Real Impact", desc: "Directly serve communities and see the change you create." },
  { icon: Users, title: "Join a Family", desc: "Become part of 1,200+ passionate volunteers across India." },
  { icon: Clock, title: "Flexible Commitment", desc: "Contribute as many or as few hours as your schedule allows." },
  { icon: Award, title: "Earn Badges", desc: "Track your volunteer hours and unlock achievement badges." },
];

const BADGE_MAP = [
  { name: "Spark", drives: 1, icon: "✨", color: "bg-slate-500", text: "text-slate-600 dark:text-slate-300" },
  { name: "Flame", drives: 10, icon: "🔥", color: "bg-teal-500", text: "text-teal-600 dark:text-teal-400" },
  { name: "Beacon", drives: 50, icon: "💡", color: "bg-purple-500", text: "text-purple-600 dark:text-purple-400" },
  { name: "Sun", drives: 100, icon: "☀️", color: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
];

function getBadgeForCount(count = 0) {
  if (count <= 0) return null;
  return [...BADGE_MAP].reverse().find(b => count >= b.drives) || null;
}

// Canonical city names dictionary to eliminate duplicates caused by casing/spacing/typos
const CANONICAL_CITIES = {
  "delhi": "Delhi NCR",
  "new delhi": "Delhi NCR",
  "newdelhi": "Delhi NCR",
  "delhi ncr": "Delhi NCR",
  "delhincr": "Delhi NCR",
  "ncr": "Delhi NCR",
  "noida": "Noida",
  "greater noida": "Greater Noida",
  "gurugram": "Gurugram",
  "gurgaon": "Gurugram",
  "lucknow": "Lucknow",
  "bengaluru": "Bengaluru",
  "bangalore": "Bengaluru",
  "hyderabad": "Hyderabad",
  "hyderabad-bellandur": "Hyderabad",
  "hyderbad-bellandur": "Hyderabad",
  "hyderbad": "Hyderabad",
  "mumbai": "Mumbai",
  "bombay": "Mumbai",
  "pune": "Pune",
  "kolkata": "Kolkata",
  "chennai": "Chennai",
  "jaipur": "Jaipur",
  "varanasi": "Varanasi",
  "banaras": "Varanasi",
  "kanpur": "Kanpur",
  "chandigarh": "Chandigarh",
  "patna": "Patna",
  "bhopal": "Bhopal",
  "indore": "Indore",
  "ahmedabad": "Ahmedabad",
};

/**
 * Normalizes city names to prevent duplicates:
 * - Trims whitespace and strips invisible unicode characters
 * - Maps aliases (e.g. "bengaluru" -> "Bengaluru", "New delhi" -> "Delhi NCR", "hyderbad-bellandur" -> "Hyderabad")
 * - Title-cases each word as fallback
 */
export function formatCityName(rawCity) {
  if (!rawCity || typeof rawCity !== "string") return "Delhi NCR";

  const cleaned = rawCity
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .replace(/\s+/g, " ");
  if (!cleaned) return "Delhi NCR";

  const lower = cleaned.toLowerCase();
  if (CANONICAL_CITIES[lower]) {
    return CANONICAL_CITIES[lower];
  }

  const sanitized = lower.replace(/[-_/]/g, " ").replace(/\s+/g, " ").trim();
  if (CANONICAL_CITIES[sanitized]) {
    return CANONICAL_CITIES[sanitized];
  }

  // Title Case each word
  return cleaned
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Deduplicates volunteers strictly:
 * - Identifies duplicates across Firestore, localStorage, and seeds by email, phone, or normalized name
 * - Merges duplicate records: keeps highest streak, photo, and richer metadata
 * - Ensures each volunteer appears exactly once
 */
export function deduplicateVolunteers(list = []) {
  const mergedMap = new Map();
  const emailToKey = new Map();
  const phoneToKey = new Map();
  const nameToKey = new Map();

  list.forEach((rawVol, idx) => {
    if (!rawVol || typeof rawVol !== "object") return;

    const rawName = (rawVol.name || "").trim().replace(/\s+/g, " ");
    const rawEmail = (rawVol.email || "").trim().toLowerCase();
    const rawPhone = (rawVol.phone || "").replace(/\D/g, "");

    // Ignore completely empty records
    if (!rawName && !rawEmail && !rawPhone) return;

    const normName = rawName.toLowerCase();

    // Check if we've already seen this volunteer by email, phone, or name
    let existingKey = null;
    if (rawEmail && emailToKey.has(rawEmail)) {
      existingKey = emailToKey.get(rawEmail);
    } else if (rawPhone && rawPhone.length >= 10 && phoneToKey.has(rawPhone)) {
      existingKey = phoneToKey.get(rawPhone);
    } else if (normName && nameToKey.has(normName)) {
      existingKey = nameToKey.get(normName);
    }

    const isSeed = Boolean(
      rawVol.isSeed ||
      (typeof rawVol.id === "string" && rawVol.id.startsWith("init-"))
    );

    const city = formatCityName(rawVol.city);

    // Drives and hours: 0 by default until check-in uploaded, unless pre-seeded
    const parsedDrives = Number(rawVol.totalDrives !== undefined ? rawVol.totalDrives : rawVol.streak);
    const drives = Number.isFinite(parsedDrives) ? Math.max(0, parsedDrives) : (isSeed ? 1 : 0);

    const parsedHours = Number(rawVol.hours);
    const hours = Number.isFinite(parsedHours) ? Math.max(0, parsedHours) : (isSeed ? drives * 3 : 0);

    const normalizedVol = {
      ...rawVol,
      id: rawVol.id || `vol-${idx}`,
      name: rawName || "Volunteer",
      email: rawEmail || "",
      phone: rawPhone || "",
      city,
      area: rawVol.area || "General / Community",
      photo: rawVol.photo || null,
      streak: drives,
      totalDrives: drives,
      hours,
      badge: getBadgeForCount(drives),
      message: rawVol.message || "",
      isSeed,
    };

    if (existingKey && mergedMap.has(existingKey)) {
      // Merge with existing record
      const existing = mergedMap.get(existingKey);
      const mergedDrives = Math.max(existing.totalDrives || 0, normalizedVol.totalDrives || 0);
      const mergedHours = Math.max(existing.hours || 0, normalizedVol.hours || 0);

      const merged = {
        ...existing,
        name: existing.name || normalizedVol.name,
        email: existing.email || normalizedVol.email,
        phone: existing.phone || normalizedVol.phone,
        city: existing.city || normalizedVol.city,
        area: existing.area || normalizedVol.area,
        photo: existing.photo || normalizedVol.photo,
        message: existing.message || normalizedVol.message,
        streak: mergedDrives,
        totalDrives: mergedDrives,
        hours: mergedHours,
        badge: getBadgeForCount(mergedDrives),
        isSeed: existing.isSeed || normalizedVol.isSeed,
      };

      mergedMap.set(existingKey, merged);

      // Update lookup indices
      if (merged.email) emailToKey.set(merged.email, existingKey);
      if (merged.phone && merged.phone.length >= 10) phoneToKey.set(merged.phone, existingKey);
      if (normName) nameToKey.set(normName, existingKey);
    } else {
      // Create new unique volunteer entry
      const key = rawEmail || (rawPhone && rawPhone.length >= 10 ? rawPhone : null) || normName || `vol-${idx}`;
      mergedMap.set(key, normalizedVol);

      if (rawEmail) emailToKey.set(rawEmail, key);
      if (rawPhone && rawPhone.length >= 10) phoneToKey.set(rawPhone, key);
      if (normName) nameToKey.set(normName, key);
    }
  });

  return Array.from(mergedMap.values());
}

const INITIAL_VOLUNTEERS = [

];

function VolunteerPage() {
  const [showForm, setShowForm] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const [volunteers, setVolunteers] = useState(() => deduplicateVolunteers(INITIAL_VOLUNTEERS));
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("All");

  // Registration Form State
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    area: "",
    message: "",
    photo: null,
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load volunteers and sync streaks with check-in records
  useEffect(() => {
    async function fetchVolunteersData() {
      try {
        const [firestoreVols, firestoreCheckIns] = await Promise.all([
          getAllVolunteers().catch(() => []),
          getAllCheckIns().catch(() => []),
        ]);

        const localVols = JSON.parse(localStorage.getItem("iiwc_volunteers") || "[]");
        const localCheckIns = JSON.parse(localStorage.getItem("iiwc_checkins") || "[]");

        const allCheckIns = [...firestoreCheckIns, ...localCheckIns];

        // Combine firestore, local volunteer registrations, and initial seed volunteers
        const rawAll = [...localVols, ...firestoreVols, ...INITIAL_VOLUNTEERS];

        // Build map of check-in activity counts & photos by user
        // An activity count and hours are only granted when check-ins are logged!
        const checkInStats = {};
        allCheckIns.forEach((c) => {
          const nameKey = (c.userName || "").toLowerCase().trim();
          const idKey = (c.userId || "").toLowerCase().trim();
          const emailKey = (c.userEmail || "").toLowerCase().trim();
          const keys = [nameKey, idKey, emailKey].filter(Boolean);
          if (keys.length === 0) return;

          const hrs = parseFloat(c.hours) || 0;
          const photo = c.photo || null;

          // Find if we already have an aggregator entry for any of these keys
          let stat = null;
          for (const k of keys) {
            if (checkInStats[k]) {
              stat = checkInStats[k];
              break;
            }
          }

          if (!stat) {
            stat = { count: 0, hours: 0, photo: null };
          }

          stat.count += 1;
          stat.hours += hrs;
          if (photo && !stat.photo) {
            stat.photo = photo;
          }

          keys.forEach((k) => {
            checkInStats[k] = stat;
          });
        });

        // Format raw entries: ONLY users who have uploaded check-in(s) get hours/drives!
        const formatted = rawAll.map((v) => {
          const nameKey = (v.name || "").toLowerCase().trim();
          const idKey = (v.id || "").toLowerCase().trim();
          const emailKey = (v.email || "").toLowerCase().trim();

          const stat = checkInStats[nameKey] || checkInStats[idKey] || (emailKey && checkInStats[emailKey]);
          const isSeed = Boolean(v.isSeed || (typeof v.id === "string" && v.id.startsWith("init-")));

          let drives = 0;
          let hours = 0;

          if (stat && stat.count > 0) {
            // User has uploaded check-in activity!
            drives = stat.count;
            hours = stat.hours;
          } else if (isSeed) {
            drives = Number(v.totalDrives || v.streak) || 1;
            hours = Number(v.hours) || drives * 3;
          } else {
            // User has registered but has NOT uploaded in check-in page yet -> 0h contributed
            drives = 0;
            hours = 0;
          }

          return {
            ...v,
            city: formatCityName(v.city),
            totalDrives: drives,
            streak: drives,
            hours,
            badge: getBadgeForCount(drives),
            photo: v.photo || (stat && stat.photo) || null,
            isSeed,
          };
        });

        // Strictly deduplicate all volunteers
        const deduplicated = deduplicateVolunteers(formatted);
        setVolunteers(deduplicated);

        // Also update local storage if local entries were refreshed with 0h
        if (localVols.length > 0) {
          const updatedLocal = deduplicated.filter((v) => !v.isSeed);
          localStorage.setItem("iiwc_volunteers", JSON.stringify(updatedLocal));
        }
      } catch (err) {
          console.warn("Could not load dynamic volunteer list, using deduplicated community list:", err);
        }
      }

    fetchVolunteersData();
    }, []);

  // Modal ESC & Scroll Lock for Lightbox only
  useEffect(() => {
    if (!modalImage) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setModalImage(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [modalImage]);

  // Form input handlers
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Please select an image smaller than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
      setForm((prev) => ({ ...prev, photo: reader.result }));
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setForm((prev) => ({ ...prev, photo: null }));
  };

  const handleOpenForm = () => {
    setShowForm(true);
    setTimeout(() => {
      document.getElementById("volunteer-registration-form")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
        const normalizedCity = formatCityName(form.city);

        await saveVolunteerApplication({
          ...form,
          city: normalizedCity,
        }).catch((err) => {
          console.warn("Firestore save fallback to local:", err);
        });

        // Save locally to display immediately in community list (0h until check-in is uploaded)
        const newVolunteer = {
          id: `vol-${Date.now()}`,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          city: normalizedCity,
          area: form.area,
          message: form.message,
          photo: form.photo,
          streak: 0,
          totalDrives: 0,
          hours: 0,
          badge: null,
          submittedAt: new Date().toISOString(),
          isSeed: false,
        };

        const existingLocal = JSON.parse(localStorage.getItem("iiwc_volunteers") || "[]");
        const updatedLocal = deduplicateVolunteers([newVolunteer, ...existingLocal]);
        localStorage.setItem("iiwc_volunteers", JSON.stringify(updatedLocal));

        // Update state immediately with strict deduplication
        setVolunteers((prev) => deduplicateVolunteers([newVolunteer, ...prev]));

        notifyAdminSubmission("volunteer", { ...form, city: normalizedCity });
        setSubmitted(true);
      } catch (err) {
        setError(err.message || "Registration failed. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    // Filtered unique cities list (each city appears EXACTLY ONCE)
    const cities = useMemo(() => {
      const citySet = new Set();

      volunteers.forEach((v) => {
        const formatted = formatCityName(v.city);
        if (formatted) citySet.add(formatted);
      });

      const sorted = Array.from(citySet).sort((a, b) => a.localeCompare(b));
      return ["All", ...sorted];
    }, [volunteers]);

    // Keep selectedCity valid if list updates
    useEffect(() => {
      if (selectedCity !== "All" && !cities.includes(selectedCity)) {
        setSelectedCity("All");
      }
    }, [cities, selectedCity]);

    // Filtered Volunteers: Search & City Filter
    const filteredVolunteers = useMemo(() => {
      const normSelected = selectedCity.trim().toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      return volunteers.filter((v) => {
        const vCityFormatted = formatCityName(v.city);
        const matchesCity =
          normSelected === "all" ||
          vCityFormatted.toLowerCase() === normSelected;

        const matchesSearch =
          !query ||
          v.name?.toLowerCase().includes(query) ||
        vCityFormatted.toLowerCase().includes(query) ||
          v.area?.toLowerCase().includes(query) ||
          v.email?.toLowerCase().includes(query);

        return matchesCity && matchesSearch;
      });
    }, [volunteers, selectedCity, searchQuery]);

    return (
      <>
        <PageHeader
          eyebrow="Get Involved"
          title="Volunteer With Us"
          description="Join our growing family of volunteers and contribute your time, skills, and passion toward transforming communities across India."
        />

        {/* Perks Section */}
        <section className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-12">
          <div className="container-max grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {perks.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex items-start gap-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 shadow-sm"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20 text-primary">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Join Call to Action Banner with Inline Form Trigger Button */}
        <section className="py-10 bg-white dark:bg-slate-900">
          <div className="container-max">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 rounded-2xl bg-gradient-to-r from-primary via-primary/95 to-teal-800 p-8 text-white shadow-xl">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent backdrop-blur-sm">
                  <Sparkles size={14} /> Become a Changemaker
                </div>
                <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Ready to Make a Real Impact?</h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-green-100">
                  Join our family of dedicated volunteers across India. Earn milestone badges, build your active streak, and upload your profile photo.
                </p>
              </div>
              <button
                onClick={() => {
                  if (!showForm) {
                    handleOpenForm();
                  } else {
                    setShowForm(false);
                  }
                }}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-accent px-7 py-3.5 text-sm font-bold text-slate-900 shadow-lg transition hover:bg-accent/90 hover:scale-105 active:scale-95"
              >
                <UserPlus size={18} />
                <span>{showForm ? "Hide Registration Form" : "Register as a Volunteer"}</span>
                {showForm ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          </div>
        </section>

        {/* ── INLINE REGISTRATION FORM (EXPANDS INLINE ON PAGE) ───── */}
        {showForm && (
          <section
            id="volunteer-registration-form"
            className="scroll-mt-12 py-10 bg-slate-100/70 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 transition-all duration-300"
          >
            <div className="container-max">
              <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 sm:p-10 shadow-lg">
                {/* Header with Close / Collapse Button */}
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-5">
                  <div>
                    <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                      Volunteer Application
                    </span>
                    <h2 className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">
                      Register as a Volunteer
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Takes less than 2 minutes. Fill in your details below to start your volunteer journey and active streak!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-white transition"
                    title="Close form"
                  >
                    <X size={20} />
                  </button>
                </div>

                {submitted ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="rounded-full bg-green-100 dark:bg-green-900/40 p-4 text-green-600">
                      <CheckCircle size={52} />
                    </div>
                    <h3 className="mt-5 text-2xl font-bold text-slate-900 dark:text-white">
                      Welcome to the Family, {form.name.split(" ")[0]}! 🎉
                    </h3>
                    <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">
                      Your volunteer profile has been created! Check out your new card in the community directory below. When you complete your first drive, log your hours in the Check-In page to build your streak and activities.
                    </p>

                    {photoPreview && (
                      <div className="mt-5 flex items-center gap-3 rounded-xl border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/20 p-3">
                        <img src={photoPreview} alt={form.name} className="h-12 w-12 rounded-full object-cover shadow-sm" />
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{form.name}</p>
                          <p className="text-xs text-green-600 font-semibold">🌱 Registered Volunteer • 0h (Log check-ins to build streak)</p>
                        </div>
                      </div>
                    )}

                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                      <button
                        onClick={() => {
                          setShowForm(false);
                          document.getElementById("volunteers-directory")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90"
                      >
                        View in Community Directory
                      </button>
                      <button
                        onClick={() => {
                          setSubmitted(false);
                          setForm({ name: "", email: "", phone: "", city: "", area: "", message: "", photo: null });
                          setPhotoPreview(null);
                        }}
                        className="rounded-lg border border-slate-300 dark:border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        Register Another
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                    {error && (
                      <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                        {error}
                      </div>
                    )}

                    {/* Photo Upload Option */}
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                        Profile / Avatar Photo (Optional)
                      </label>

                      {photoPreview ? (
                        <div className="flex items-center gap-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3.5">
                          <img
                            src={photoPreview}
                            alt="Preview"
                            className="h-16 w-16 rounded-full object-cover border-2 border-primary shadow-sm"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                              Photo uploaded
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              This will appear on your volunteer card &amp; streak badge
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label className="flex cursor-pointer items-center gap-3.5 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 p-4 transition hover:border-primary hover:bg-primary/5">
                          <div className="rounded-full bg-primary/10 p-2.5 text-primary">
                            <Camera size={22} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                              Click to upload your profile photo
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Optional — PNG, JPG, or JPEG up to 5MB
                            </p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {/* Grid Fields */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      {[
                        { name: "name", type: "text", label: "Full Name *", ph: "Rahul Verma" },
                        { name: "email", type: "email", label: "Email Address *", ph: "rahul@example.com" },
                        { name: "phone", type: "tel", label: "Phone Number *", ph: "+91 98765 43210" },
                        { name: "city", type: "text", label: "City *", ph: "Delhi NCR / Lucknow" },
                      ].map(({ name, type, label, ph }) => (
                        <div key={name}>
                          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                            {label}
                          </label>
                          <input
                            name={name}
                            type={type}
                            required
                            value={form[name]}
                            onChange={handleChange}
                            placeholder={ph}
                            className={INPUT}
                          />
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                        Area of Interest *
                      </label>
                      <select
                        name="area"
                        required
                        value={form.area}
                        onChange={handleChange}
                        className={INPUT}
                      >
                        <option value="">Select an area…</option>
                        {[
                          "Child Care & Education",
                          "Healthcare & Medical Camps",
                          "Women Empowerment",
                          "Old Age People Care",
                          "Animal Welfare",
                          "General / Any Community Drive",
                        ].map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                        How would you like to contribute? (Optional)
                      </label>
                      <textarea
                        name="message"
                        rows={3}
                        value={form.message}
                        onChange={handleChange}
                        placeholder="Tell us about your skills, availability, or what inspired you to join…"
                        className={INPUT + " resize-none"}
                      />
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="rounded-lg border border-slate-300 dark:border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        Cancel / Hide Form
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-7 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-primary/90 disabled:opacity-60 active:scale-95"
                      >
                        {loading ? "Registering…" : "Complete Registration"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── VOLUNTEER COMMUNITY & STREAKS DIRECTORY ──────────────── */}
        <section
          id="volunteers-directory"
          className="py-12 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 scroll-mt-10"
        >
          <div className="container-max">
            {/* Section Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.18em] text-accent">
                  <Flame size={14} className="text-amber-500" /> Active Changemakers
                </span>
                <h2 className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
                  Our Volunteer Community &amp; Streaks
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Meet the active volunteers driving grassroots change. Track their streaks and community drives.
                </p>
              </div>

              <button
                onClick={handleOpenForm}
                className="inline-flex items-center gap-2 self-start md:self-auto rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary dark:text-accent transition hover:bg-primary/10"
              >
                <UserPlus size={16} /> {showForm ? "Form Active Above ↑" : "Join the Leaderboard"}
              </button>
            </div>

            {/* Search & City Filter Bar */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Search Input */}
              <div className="relative w-full sm:max-w-xs">
                <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search volunteer or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* City Filter Pills (Strictly unique, canonical cities) */}
              <div className="flex w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 gap-1.5 scrollbar-none">
                {cities.map((city) => (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(city)}
                    className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition ${selectedCity === city
                        ? "bg-primary text-white shadow-sm"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                      }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            {/* Volunteers Grid */}
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredVolunteers.map((vol) => (
                <div
                  key={vol.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition hover:shadow-lg hover:-translate-y-1"
                >
                  {/* Volunteer Photo / Avatar Header */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {vol.photo ? (
                      <>
                        <img
                          src={vol.photo}
                          alt={vol.name}
                          onClick={() => setModalImage(vol)}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105 cursor-pointer"
                        />
                        <div
                          onClick={() => setModalImage(vol)}
                          className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition group-hover:opacity-100 cursor-pointer"
                        >
                          <span className="rounded-full bg-black/60 p-2 text-white shadow-md backdrop-blur-sm">
                            <Maximize2 size={16} />
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-teal-500 to-primary text-white">
                        <span className="text-4xl font-extrabold tracking-tight">
                          {vol.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="mt-1 text-xs font-medium text-white/80">Volunteer</span>
                      </div>
                    )}

                    {/* Streak Fire Pill */}
                    <div className="absolute top-3 right-3">
                      {vol.streak > 0 ? (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-950/80 border border-amber-500/40 px-3 py-1 text-xs font-bold text-amber-300 shadow-lg backdrop-blur-md">
                          <Flame size={14} className="text-amber-400 animate-pulse fill-amber-400" />
                          <span>{vol.streak} {vol.streak === 1 ? "Drive" : "Drives"} Streak</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-950/80 border border-slate-700/60 px-3 py-1 text-xs font-medium text-slate-300 shadow-lg backdrop-blur-md">
                          <span>🌱 New Volunteer</span>
                        </div>
                      )}
                    </div>

                    {/* Badge Tag */}
                    <div className="absolute bottom-3 left-3">
                      {vol.badge ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/95 dark:bg-slate-900/90 px-2.5 py-0.5 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-md backdrop-blur-sm">
                          <span>{vol.badge?.icon || "✨"}</span>
                          <span>{vol.badge?.name || "Spark"}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/95 dark:bg-slate-900/90 px-2.5 py-0.5 text-xs font-medium text-slate-500 dark:text-slate-400 shadow-md backdrop-blur-sm">
                          <span>🌱</span>
                          <span>Member</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Volunteer Card Body */}
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-primary transition">
                        {vol.name}
                      </h3>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
                        <MapPin size={13} className="text-primary" /> {formatCityName(vol.city)}
                      </span>
                      <span>•</span>
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 font-medium text-primary dark:text-accent">
                        {vol.area || "Community"}
                      </span>
                    </div>

                    {vol.message && (
                      <p className="mt-3 flex-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-2">
                        "{vol.message}"
                      </p>
                    )}

                    {/* Activity Stats Footer */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{vol.totalDrives ?? 0}</span> activities
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{(vol.hours !== undefined && vol.hours !== null) ? vol.hours : 0}h</span> contributed
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredVolunteers.length === 0 && (
              <div className="mt-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
                <Users size={40} className="mx-auto text-slate-400" />
                <h3 className="mt-3 text-base font-bold text-slate-800 dark:text-slate-200">No volunteers match your search</h3>
                <p className="mt-1 text-sm text-slate-500">Try adjusting your filters or search keywords.</p>
                <button
                  onClick={() => { setSearchQuery(""); setSelectedCity("All"); }}
                  className="mt-4 text-xs font-semibold text-primary underline"
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── FULL IMAGE LIGHTBOX MODAL ─────────────────────────────── */}
        {modalImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setModalImage(null)}
          >
            <div
              className="relative flex max-h-[92vh] max-w-4xl w-full flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setModalImage(null)}
                className="absolute -right-2 -top-2 sm:-right-4 sm:-top-4 z-10 rounded-full bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white shadow-2xl transition hover:bg-slate-100 dark:hover:bg-slate-700 hover:scale-105"
                aria-label="Close full image view"
              >
                <X size={20} />
              </button>

              <div className="relative overflow-hidden rounded-2xl bg-black/40 shadow-2xl max-w-full flex items-center justify-center">
                <img
                  src={modalImage.photo || modalImage.url}
                  alt={modalImage.name || "Volunteer photo"}
                  className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain"
                />
              </div>

              <div className="mt-4 max-w-xl text-center text-white">
                <p className="text-lg font-bold">{modalImage.name}</p>
                <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-xs">
                  {modalImage.streak > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-3 py-1 font-bold text-slate-950">
                      <Flame size={13} className="fill-slate-950" /> {modalImage.streak} Streak
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-700 px-3 py-1 font-medium text-slate-200">
                      🌱 New Volunteer
                    </span>
                  )}
                  <span className="rounded-full bg-white/20 px-3 py-1 font-medium text-slate-200">
                    📍 {formatCityName(modalImage.city)}
                  </span>
                  <span className="rounded-full bg-primary/80 px-3 py-1 font-medium text-white">
                    {modalImage.area}
                  </span>
                  <span className="rounded-full bg-slate-800 px-3 py-1 font-medium text-slate-300">
                    {(modalImage.hours !== undefined && modalImage.hours !== null) ? modalImage.hours : 0}h contributed
                  </span>
                </div>
                {modalImage.message && (
                  <p className="mt-2 text-xs italic text-slate-300">"{modalImage.message}"</p>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  export default VolunteerPage;
