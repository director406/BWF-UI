import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera, Upload, Medal, TrendingUp, MapPin, Clock, Award, Users, Heart,
  CheckCircle, BarChart3, X, Maximize2, ChevronLeft, ChevronRight, Plus, Images,
  Filter, Search, Grid, Layers, Sparkles, Check, ArrowRight, RotateCcw
} from "lucide-react";
import { Button, Card } from "../../components";
import { getCurrentUser, isAuthenticated } from "../../services/authService";
import { saveCheckIn, getCheckIns, getAllCheckIns } from "../../services/firestoreService";
import { formatCityName } from "../volunteer/VolunteerPage";
import { ROUTES } from "../../utils/constants";

export const BADGES = [
  { name: "Spark", drives: 1, icon: "✨", color: "bg-slate-500" },
  { name: "Flame", drives: 10, icon: "🔥", color: "bg-teal-500" },
  { name: "Beacon", drives: 50, icon: "💡", color: "bg-purple-500" },
  { name: "Sun", drives: 100, icon: "☀️", color: "bg-amber-500" },
];

export const IMPACT_AREAS = [
  {
    id: "all",
    label: "All Impact Areas",
    shortLabel: "All Causes",
    icon: "🌍",
    badgeBg: "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700",
    gradient: "from-green-500 to-emerald-600",
  },
  {
    id: "child-care",
    label: "Child Care & Education",
    shortLabel: "Child Care",
    icon: "📚",
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50",
    gradient: "from-blue-500 to-indigo-600",
    description: "Book distribution, school supplies, tutoring, and children welfare drives.",
  },
  {
    id: "healthcare",
    label: "Healthcare & Medical Camps",
    shortLabel: "Healthcare",
    icon: "🏥",
    badgeBg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50",
    gradient: "from-rose-500 to-red-600",
    description: "Mobile clinics, free checkups, blood donation, and medicine distribution.",
  },
  {
    id: "food-relief",
    label: "Food & Nutrition Relief",
    shortLabel: "Food Relief",
    icon: "🍲",
    badgeBg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50",
    gradient: "from-amber-500 to-orange-600",
    description: "Cooked meals, dry ration kits, and nutritional snack distributions.",
  },
  {
    id: "women-empowerment",
    label: "Women Empowerment & Skills",
    shortLabel: "Women Empowerment",
    icon: "🌸",
    badgeBg: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50",
    gradient: "from-purple-500 to-pink-600",
    description: "Vocational skill training, sewing/crafts, and self-help group mentorship.",
  },
  {
    id: "old-age-care",
    label: "Old Age People Care",
    shortLabel: "Elder Care",
    icon: "🤝",
    badgeBg: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900/50",
    gradient: "from-teal-500 to-emerald-600",
    description: "Elders companionship, healthcare assistance, and old-age home visits.",
  },
  {
    id: "animal-welfare",
    label: "Animal Welfare",
    shortLabel: "Animal Welfare",
    icon: "🐾",
    badgeBg: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900/50",
    gradient: "from-yellow-500 to-amber-600",
    description: "Stray feeding, rescue assistance, medical aid, and animal shelter support.",
  },
  {
    id: "community-drives",
    label: "Community Cleanup & Environment",
    shortLabel: "Community Drives",
    icon: "🌱",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50",
    gradient: "from-green-500 to-teal-600",
    description: "Cleanliness drives, tree plantations, plastic-free campaigns, and civic drives.",
  },
];

export function resolveImpactArea(checkInOrActivity) {
  if (!checkInOrActivity) return IMPACT_AREAS[1];
  const combined = (
    typeof checkInOrActivity === "string"
      ? checkInOrActivity
      : `${checkInOrActivity.impactArea || ""} ${checkInOrActivity.activity || ""} ${checkInOrActivity.notes || ""}`
  ).toLowerCase();

  if (/child|education|school|notebook|book|teach|study|student|stationery|balak|vidya/.test(combined)) {
    return IMPACT_AREAS.find((a) => a.id === "child-care");
  }
  if (/health|medic|doctor|clinic|camp|hospital|check-up|checkup|blood|eye|swasthya/.test(combined)) {
    return IMPACT_AREAS.find((a) => a.id === "healthcare");
  }
  if (/food|nutrition|ration|meal|snack|feed|annadanam|grain|rice|bhandara|bowl/.test(combined)) {
    return IMPACT_AREAS.find((a) => a.id === "food-relief");
  }
  if (/women|female|girl|skill|tailor|sewing|craft|shakti|mahila/.test(combined)) {
    return IMPACT_AREAS.find((a) => a.id === "women-empowerment");
  }
  if (/old|elder|senior|grand|age|vridh|ashram|dada|dadi/.test(combined)) {
    return IMPACT_AREAS.find((a) => a.id === "old-age-care");
  }
  if (/animal|dog|cat|cow|bird|paws|shelter|pet|stray|veterinary|gau/.test(combined)) {
    return IMPACT_AREAS.find((a) => a.id === "animal-welfare");
  }
  if (/clean|cleanup|swachh|tree|plant|sapling|waste|trash|plastic|environment|sanitation|drive|awareness/.test(combined)) {
    return IMPACT_AREAS.find((a) => a.id === "community-drives");
  }

  return IMPACT_AREAS.find((a) => a.id === "community-drives");
}

const FALLBACK_CHECKINS = [
  {
    id: "fb-1",
    userId: "bwf-vol-1",
    userName: "Gaurav Sharma",
    activity: "Child Care & Education",
    location: "Delhi NCR",
    beneficiaries: 120,
    hours: 4,
    notes: "Distributed notebooks, pencils, and educational kits to primary school students.",
    photo: "/images/activity-notebook-distribution-1.jpeg",
    photos: [
      "/images/activity-notebook-distribution-1.jpeg",
      "/images/activity-notebook-distribution-2.jpeg",
      "/images/activity-notebook-distribution-3.jpeg",
      "/images/activity-notebook-distribution-4.jpeg",
    ],
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "fb-2",
    userId: "bwf-vol-2",
    userName: "Dr. Ananya Roy",
    activity: "Healthcare & Medical Camps",
    location: "Lucknow",
    beneficiaries: 240,
    hours: 6,
    notes: "Conducted community blood pressure checkup and free medicine distribution.",
    photo: "/images/healthcamp-01.jpeg",
    photos: [
      "/images/healthcamp-01.jpeg",
      "/images/healthcamp-03.jpeg",
      "/images/healthcamp-06.jpeg",
      "/images/healthcamp-08.jpeg",
    ],
    timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: "fb-3",
    userId: "bwf-vol-3",
    userName: "Sampurn Patel",
    activity: "Food & Nutrition Relief",
    location: "Mumbai",
    beneficiaries: 350,
    hours: 5,
    notes: "Nutritious hot meal bowls distributed across slum settlements.",
    photo: "/images/activity-food-bowls.jpeg",
    photos: [
      "/images/activity-food-bowls.jpeg",
      "/images/activity-snack-distribution.jpeg",
      "/images/activity-food-field.jpeg",
    ],
    timestamp: new Date(Date.now() - 3600000 * 28).toISOString(),
  },
  {
    id: "fb-4",
    userId: "bwf-vol-4",
    userName: "Pooja Verma",
    activity: "Women Empowerment & Skills",
    location: "Jaipur",
    beneficiaries: 45,
    hours: 3.5,
    notes: "Workshop on self-help tailoring skills, stitching, and financial independence.",
    photo: "/images/slider3.jpeg",
    photos: ["/images/slider3.jpeg"],
    timestamp: new Date(Date.now() - 3600000 * 42).toISOString(),
  },
  {
    id: "fb-5",
    userId: "bwf-vol-5",
    userName: "Nitin Kumar",
    activity: "Old Age People Care",
    location: "Delhi NCR",
    beneficiaries: 60,
    hours: 4,
    notes: "Spent quality time and conducted general health checkup for senior citizens.",
    photo: "/images/healthcamp-15.jpeg",
    photos: ["/images/healthcamp-15.jpeg", "/images/healthcamp-16.jpeg"],
    timestamp: new Date(Date.now() - 3600000 * 55).toISOString(),
  },
  {
    id: "fb-6",
    userId: "bwf-vol-6",
    userName: "Arif Khan",
    activity: "Animal Welfare",
    location: "Bengaluru",
    beneficiaries: 75,
    hours: 3,
    notes: "Daily feeding drive and first-aid treatment for stray dogs and community animals.",
    photo: "/images/slider2.jpeg",
    photos: ["/images/slider2.jpeg"],
    timestamp: new Date(Date.now() - 3600000 * 68).toISOString(),
  },
  {
    id: "fb-7",
    userId: "bwf-vol-7",
    userName: "Santosh Mehra",
    activity: "Community Cleanup & Environment",
    location: "Delhi NCR",
    beneficiaries: 500,
    hours: 4.5,
    notes: "Neighborhood clean-up drive and sapling plantation alongside community volunteers.",
    photo: "/images/community-volunteers-group.jpeg",
    photos: [
      "/images/community-volunteers-group.jpeg",
      "/images/community-team-selfie.jpeg",
    ],
    timestamp: new Date(Date.now() - 3600000 * 82).toISOString(),
  },
  {
    id: "fb-8",
    userId: "bwf-vol-8",
    userName: "Mayan Sengupta",
    activity: "Child Care & Education",
    location: "Kolkata",
    beneficiaries: 90,
    hours: 3,
    notes: "Fun learning, rhymes, games, and birthday celebration drive with shelter children.",
    photo: "/images/activity-birthday-celebration-1.jpeg",
    photos: [
      "/images/activity-birthday-celebration-1.jpeg",
      "/images/activity-birthday-celebration-2.jpeg",
    ],
    timestamp: new Date(Date.now() - 3600000 * 96).toISOString(),
  },
];

function CheckInPage() {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const galleryRef = useRef(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false);
  const [submittedCategoryName, setSubmittedCategoryName] = useState("");

  const [checkInData, setCheckInData] = useState({
    activity: "",
    location: "",
    beneficiaries: "",
    hours: "",
    notes: "",
  });
  const [previewImages, setPreviewImages] = useState([]);
  const [recentCheckIns, setRecentCheckIns] = useState([]);
  const [allCheckIns, setAllCheckIns] = useState([]);
  const [userStats, setUserStats] = useState({ totalDrives: 0, currentBadge: null });
  const [modalImage, setModalImage] = useState(null);

  // Gallery Filters & View States
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "grouped"

  // Carousel keyboard navigation & body overflow lock
  useEffect(() => {
    if (!modalImage) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setModalImage(null);
      if (modalImage.photos && modalImage.photos.length > 1) {
        if (e.key === "ArrowLeft") {
          setModalImage((prev) => ({
            ...prev,
            activeIndex: (prev.activeIndex - 1 + prev.photos.length) % prev.photos.length,
          }));
        } else if (e.key === "ArrowRight") {
          setModalImage((prev) => ({
            ...prev,
            activeIndex: (prev.activeIndex + 1) % prev.photos.length,
          }));
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [modalImage]);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate(ROUTES.LOGIN);
      return;
    }
    const user = getCurrentUser();
    setCurrentUser(user);
    loadCheckInData(user.id);
  }, [navigate]);

  const loadCheckInData = async (userId) => {
    try {
      const userCheckIns = await getCheckIns(userId);
      const totalDrives = userCheckIns.length;
      const currentBadge = BADGES.filter((b) => totalDrives >= b.drives).pop() || null;
      setUserStats({ totalDrives, currentBadge });

      const everyone = await getAllCheckIns();
      const dataset = everyone && everyone.length > 0 ? everyone : FALLBACK_CHECKINS;
      setAllCheckIns(dataset);
      setRecentCheckIns(dataset.slice(0, 36));
    } catch {
      const stored = JSON.parse(localStorage.getItem("iiwc_checkins") || "[]");
      const dataset = stored.length > 0 ? stored : FALLBACK_CHECKINS;
      const userCheckIns = dataset.filter((c) => c.userId === userId);
      const totalDrives = userCheckIns.length;
      const currentBadge = BADGES.filter((b) => totalDrives >= b.drives).pop() || null;
      setUserStats({ totalDrives, currentBadge });
      setAllCheckIns(dataset);
      setRecentCheckIns(dataset.slice(0, 36));
    }
  };

  const handleOpenCheckInForm = () => {
    setShowCheckInForm(true);
    setSubmittedSuccessfully(false);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleCloseCheckInForm = () => {
    setShowCheckInForm(false);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = Math.max(0, 6 - previewImages.length);
    if (remainingSlots === 0) {
      alert("You can upload a maximum of 6 images per check-in.");
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);
    const readers = filesToProcess.map((file) => {
      return new Promise((resolve) => {
        if (file.size > 8 * 1024 * 1024) {
          resolve(null);
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then((newImages) => {
      const validImages = newImages.filter(Boolean);
      setPreviewImages((prev) => [...prev, ...validImages]);
    });

    e.target.value = "";
  };

  const handleRemoveImage = (indexToRemove) => {
    setPreviewImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleChange = (e) => {
    setCheckInData({ ...checkInData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const normalizedLocation = formatCityName(checkInData.location);
    const parsedHours = parseFloat(checkInData.hours) || 0;
    const primaryPhoto = previewImages[0] ?? null;
    const matchedCategory = resolveImpactArea(checkInData.activity);

    const checkIn = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email || "",
      activity: checkInData.activity,
      impactArea: matchedCategory.label,
      location: normalizedLocation,
      beneficiaries: parseInt(checkInData.beneficiaries, 10) || 0,
      hours: parsedHours,
      notes: checkInData.notes,
      photo: primaryPhoto,
      photos: previewImages,
      timestamp: new Date().toISOString(),
    };

    try {
      await saveCheckIn({
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email || "",
        activity: checkInData.activity,
        impactArea: matchedCategory.label,
        location: normalizedLocation,
        beneficiaries: checkInData.beneficiaries,
        hours: parsedHours,
        notes: checkInData.notes,
        photo: primaryPhoto,
        photos: previewImages,
      });
    } catch {
      const stored = JSON.parse(localStorage.getItem("iiwc_checkins") || "[]");
      stored.unshift(checkIn);
      localStorage.setItem("iiwc_checkins", JSON.stringify(stored));
    }

    // Prepend to live state
    setAllCheckIns((prev) => [checkIn, ...prev]);
    setRecentCheckIns((prev) => [checkIn, ...prev.slice(0, 35)]);

    // Update user stats
    setUserStats((prev) => {
      const newTotal = prev.totalDrives + 1;
      const newBadge = BADGES.filter((b) => newTotal >= b.drives).pop() || null;
      return { totalDrives: newTotal, currentBadge: newBadge };
    });

    setSubmittedCategoryName(matchedCategory.label);
    setSubmittedSuccessfully(true);
    setShowCheckInForm(false);
    setCheckInData({ activity: "", location: "", beneficiaries: "", hours: "", notes: "" });
    setPreviewImages([]);
    setIsSubmitting(false);

    // If submitted under a specific category, switch filter to that category so user sees their new post immediately
    if (matchedCategory.id) {
      setSelectedCategory(matchedCategory.id);
    }
  };

  const getNextBadge = () => {
    return BADGES.find((b) => b.drives > userStats.totalDrives);
  };

  const getBadgeProgress = () => {
    const nextBadge = getNextBadge();
    if (!nextBadge) return 100;
    return (userStats.totalDrives / nextBadge.drives) * 100;
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return `${Math.max(1, diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // Unique normalized cities
  const allCities = useMemo(() => {
    const cities = new Set();
    allCheckIns.forEach((c) => {
      if (c.location) cities.add(formatCityName(c.location));
    });
    return Array.from(cities).sort((a, b) => a.localeCompare(b));
  }, [allCheckIns]);

  // Counts by impact area
  const impactCounts = useMemo(() => {
    const counts = { all: allCheckIns.length };
    IMPACT_AREAS.forEach((area) => {
      if (area.id !== "all") counts[area.id] = 0;
    });

    allCheckIns.forEach((checkIn) => {
      const matched = resolveImpactArea(checkIn);
      if (matched && counts[matched.id] !== undefined) {
        counts[matched.id] = (counts[matched.id] || 0) + 1;
      }
    });
    return counts;
  }, [allCheckIns]);

  // Filtered check-ins for the gallery
  const filteredCheckIns = useMemo(() => {
    return allCheckIns.filter((checkIn) => {
      // 1. Impact category filter
      if (selectedCategory !== "all") {
        const area = resolveImpactArea(checkIn);
        if (area.id !== selectedCategory) return false;
      }

      // 2. City filter
      if (selectedCity !== "all") {
        if (formatCityName(checkIn.location) !== selectedCity) return false;
      }

      // 3. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = checkIn.userName?.toLowerCase().includes(q);
        const matchesLoc = checkIn.location?.toLowerCase().includes(q);
        const matchesAct = checkIn.activity?.toLowerCase().includes(q);
        const matchesNotes = checkIn.notes?.toLowerCase().includes(q);
        if (!matchesName && !matchesLoc && !matchesAct && !matchesNotes) return false;
      }

      return true;
    });
  }, [allCheckIns, selectedCategory, selectedCity, searchQuery]);

  // Grouped check-ins by impact area (for grouped view mode)
  const groupedCheckIns = useMemo(() => {
    const groups = {};
    IMPACT_AREAS.filter((a) => a.id !== "all").forEach((area) => {
      groups[area.id] = { area, items: [] };
    });

    filteredCheckIns.forEach((checkIn) => {
      const matched = resolveImpactArea(checkIn);
      if (groups[matched.id]) {
        groups[matched.id].items.push(checkIn);
      }
    });

    return Object.values(groups).filter((g) => g.items.length > 0);
  }, [filteredCheckIns]);

  // Weekly Stats calculation
  const weeklyStats = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const dataToUse =
      selectedCity === "all"
        ? allCheckIns
        : allCheckIns.filter((c) => formatCityName(c.location) === selectedCity);
    const weeklyCheckIns = dataToUse.filter((c) => new Date(c.timestamp) > oneWeekAgo);

    const totalVolunteers = new Set(weeklyCheckIns.map((c) => c.userId)).size;
    const totalBeneficiaries = weeklyCheckIns.reduce((sum, c) => sum + (c.beneficiaries || 0), 0);
    const totalHours = weeklyCheckIns.reduce((sum, c) => sum + (c.hours || 0), 0);

    return {
      volunteers: totalVolunteers,
      beneficiaries: totalBeneficiaries,
      hours: totalHours,
      activities: weeklyCheckIns.length,
    };
  }, [allCheckIns, selectedCity]);

  // City Leaderboard
  const cityStats = useMemo(() => {
    const cityMap = {};
    allCheckIns.forEach((checkIn) => {
      const city = formatCityName(checkIn.location);
      cityMap[city] = (cityMap[city] || 0) + 1;
    });
    return Object.entries(cityMap)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [allCheckIns]);

  // Activity breakdown
  const activityBreakdown = useMemo(() => {
    const activityMap = {};
    allCheckIns.forEach((checkIn) => {
      const area = resolveImpactArea(checkIn);
      const label = area.label;
      activityMap[label] = (activityMap[label] || 0) + 1;
    });
    return Object.entries(activityMap)
      .map(([activity, count]) => ({ activity, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [allCheckIns]);

  // Top volunteers
  const topVolunteers = useMemo(() => {
    const volunteerMap = {};
    allCheckIns.forEach((checkIn) => {
      if (!volunteerMap[checkIn.userId]) {
        volunteerMap[checkIn.userId] = {
          id: checkIn.userId,
          name: checkIn.userName,
          count: 0,
          photo: checkIn.photo,
        };
      }
      volunteerMap[checkIn.userId].count++;
    });

    return Object.values(volunteerMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map((v) => ({
        ...v,
        badge: BADGES.filter((b) => v.count >= b.drives).pop() || BADGES[0],
      }));
  }, [allCheckIns]);

  if (!currentUser) return null;

  return (
    <>
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-600 via-green-700 to-green-800 py-16 sm:py-20 text-white">
        <div className="container-max">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold tracking-wide backdrop-blur-sm">
                <Sparkles size={14} className="text-yellow-300" />
                <span>BWF Volunteer Field Network</span>
              </div>

              <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-5xl">
                Check-In & Share Your Field Impact
              </h1>
              <p className="mt-4 text-base sm:text-lg text-green-100 max-w-xl">
                Upload photos from your drives, categorize by impact area, and earn milestone badges that celebrate your grassroots dedication.
              </p>

              {/* 1-Click Form Open at the Top */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={handleOpenCheckInForm}
                  className="inline-flex items-center gap-2.5 rounded-full bg-white px-7 py-3.5 text-base sm:text-lg font-bold text-green-800 shadow-xl transition-all duration-200 hover:bg-green-50 hover:scale-105 active:scale-95"
                >
                  <Camera size={22} className="text-green-600" />
                  {showCheckInForm ? "Check-In Form (Open)" : "Check-In Now"}
                </button>

                <button
                  type="button"
                  onClick={() => galleryRef.current?.scrollIntoView({ behavior: "smooth" })}
                  className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-6 py-3.5 text-sm sm:text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  <Images size={18} />
                  Explore Impact Gallery ↓
                </button>
              </div>
            </div>

            {/* Badges Display */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-4">
              {BADGES.map((badge) => (
                <div
                  key={badge.name}
                  className="rounded-2xl border border-white/15 bg-white/10 p-4 text-center backdrop-blur-sm transition hover:bg-white/15"
                >
                  <div className="relative mx-auto mb-2 flex h-16 w-16 items-center justify-center">
                    <div
                      className={`absolute inset-0 ${badge.color} opacity-30`}
                      style={{
                        clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
                      }}
                    />
                    <div
                      className={`absolute inset-1.5 ${badge.color}`}
                      style={{
                        clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
                      }}
                    />
                    <span className="relative z-10 text-2xl">{badge.icon}</span>
                  </div>
                  <p className="font-bold text-sm text-white">{badge.name}</p>
                  <p className="text-xs text-green-200">
                    {badge.drives} {badge.drives === 1 ? "Activity" : "Activities"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Top Inline Check-In Form Section (Inline, Not a Popup!) */}
      <section ref={formRef} id="checkin-inline-form-card" className="scroll-mt-10 bg-slate-50 dark:bg-slate-900/50 py-8 border-b border-slate-200 dark:border-slate-800">
        <div className="container-max">
          {/* Case A: Form is Closed & No Recent Submission */}
          {!showCheckInForm && !submittedSuccessfully && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border-2 border-dashed border-green-300 dark:border-green-800/80 bg-white dark:bg-slate-800 p-5 shadow-sm transition hover:border-green-400">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 shadow-sm">
                  <Camera size={24} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Completed a Volunteer Drive or Field Activity?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Upload photos, select the impact area created, and add your service hours right here.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleOpenCheckInForm}
                className="inline-flex items-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 font-bold text-sm shadow-md transition hover:shadow-lg active:scale-95 whitespace-nowrap"
              >
                <Plus size={18} /> Open Check-In Form
              </button>
            </div>
          )}

          {/* Case B: Success Confirmation Card */}
          {submittedSuccessfully && (
            <div className="rounded-2xl border-2 border-green-300 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-800/80 p-6 sm:p-8 shadow-md">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-green-500 text-white shadow-lg animate-bounce">
                    <Check size={28} />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-200/80 dark:bg-green-900/60 px-3 py-0.5 text-xs font-bold text-green-900 dark:text-green-200">
                      🎉 Check-In Successful!
                    </span>
                    <h3 className="mt-1 text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                      Your Activity Has Been Categorized & Logged
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      Categorized under <strong className="text-green-700 dark:text-green-400">{submittedCategoryName}</strong>. Your photos are now featured in the Impact Gallery below.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      galleryRef.current?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 text-sm font-bold shadow transition"
                  >
                    <Images size={16} /> View in Gallery Below ↓
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenCheckInForm}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <Plus size={16} /> Log Another Drive
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubmittedSuccessfully(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Dismiss"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Case C: Inline Form Expanded (No Popup, Responsive & Smooth) */}
          {showCheckInForm && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <Card className="border-2 border-green-200 dark:border-green-800/80 shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
                {/* Form Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-gradient-to-r from-green-50/60 to-emerald-50/40 dark:from-slate-800 dark:to-slate-800/60">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-green-600 p-2.5 text-white shadow-md">
                      <Camera size={22} />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                        Log Volunteer Activity
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        Upload drive photos, choose impact area, and record volunteer hours.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseCheckInForm}
                    className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition"
                    title="Close form"
                    aria-label="Close form"
                  >
                    <X size={22} />
                  </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
                  {/* Photo Upload Area (Up to 6 images) */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        <Camera size={17} className="text-green-600" />
                        Activity Photos (Max 6 photos)
                      </label>
                      {previewImages.length > 0 && previewImages.length < 6 && (
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/40 px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-300 transition hover:bg-green-100">
                          <Plus size={14} /> Add More
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {previewImages.length > 0 ? (
                      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                          {previewImages.map((img, idx) => (
                            <div
                              key={idx}
                              className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm"
                            >
                              <img
                                src={img}
                                alt={`Upload ${idx + 1}`}
                                onClick={() =>
                                  setModalImage({
                                    photo: img,
                                    photos: previewImages,
                                    activeIndex: idx,
                                    activity: checkInData.activity || "Uploaded Drive Photo",
                                    location: checkInData.location || "Preview",
                                    notes: checkInData.notes || "",
                                  })
                                }
                                className="h-full w-full object-cover cursor-pointer transition duration-300 group-hover:scale-105"
                              />
                              <div
                                onClick={() =>
                                  setModalImage({
                                    photo: img,
                                    photos: previewImages,
                                    activeIndex: idx,
                                    activity: checkInData.activity || "Uploaded Drive Photo",
                                    location: checkInData.location || "Preview",
                                    notes: checkInData.notes || "",
                                  })
                                }
                                className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100 cursor-pointer"
                              >
                                <span className="rounded-full bg-black/60 p-1.5 text-white shadow-md">
                                  <Maximize2 size={15} />
                                </span>
                              </div>

                              <div className="absolute top-1.5 left-1.5 pointer-events-none">
                                <span className="rounded-md bg-black/70 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
                                  {idx === 0 ? "Cover" : `#${idx + 1}`}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveImage(idx)}
                                className="absolute top-1.5 right-1.5 rounded-full bg-red-500 p-1 text-white shadow-lg transition hover:bg-red-600 hover:scale-110"
                                title="Remove photo"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}

                          {previewImages.length < 6 && (
                            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-green-300 dark:border-green-800 bg-white/80 dark:bg-slate-800/60 p-2 text-center transition hover:border-green-500 hover:bg-green-50/50">
                              <Plus size={20} className="text-green-600" />
                              <span className="mt-1 text-[11px] font-bold text-green-700 dark:text-green-300">
                                Add
                              </span>
                              <span className="text-[9px] text-slate-400">
                                {6 - previewImages.length} left
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>

                        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-700/60 pt-2.5">
                          <span className="flex items-center gap-1 font-medium">
                            <Images size={13} className="text-green-600" />
                            {previewImages.length} of 6 photos selected
                          </span>
                          <button
                            type="button"
                            onClick={() => setPreviewImages([])}
                            className="text-xs text-red-500 hover:text-red-700 transition font-medium"
                          >
                            Clear all
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-green-300 dark:border-green-800/80 bg-green-50/40 dark:bg-slate-800/40 transition hover:border-green-500 hover:bg-green-50/80 dark:hover:bg-slate-800/80">
                        <div className="rounded-full bg-green-100 dark:bg-green-900/60 p-4 shadow-sm">
                          <Upload size={32} className="text-green-600 dark:text-green-300" />
                        </div>
                        <p className="mt-3 text-base font-bold text-slate-800 dark:text-slate-100">
                          Click to upload activity photos
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Select 1 to 6 photos from your drive (JPEG, PNG, WebP)
                        </p>
                        <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/50 px-3 py-0.5 text-xs font-semibold text-green-800 dark:text-green-300">
                          <Images size={12} /> Multiple selection supported
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Form Fields Grid */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Impact Area Dropdown */}
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Impact Area / Cause *
                      </label>
                      <select
                        name="activity"
                        value={checkInData.activity}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white outline-none ring-green-500 focus:ring-2"
                        required
                      >
                        <option value="">Select an Impact Area…</option>
                        {IMPACT_AREAS.filter((a) => a.id !== "all").map((area) => (
                          <option key={area.id} value={area.label}>
                            {area.icon} {area.label}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Pictures will be automatically organized into this category in the gallery.
                      </p>
                    </div>

                    {/* Location */}
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Drive Location / City *
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={checkInData.location}
                        onChange={handleChange}
                        placeholder="e.g. Delhi NCR, Lucknow, Mumbai"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none ring-green-500 focus:ring-2"
                        required
                      />
                    </div>

                    {/* Beneficiaries */}
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Beneficiaries Served *
                      </label>
                      <input
                        type="number"
                        name="beneficiaries"
                        value={checkInData.beneficiaries}
                        onChange={handleChange}
                        placeholder="e.g. 50"
                        min="1"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none ring-green-500 focus:ring-2"
                        required
                      />
                    </div>

                    {/* Hours */}
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Hours Volunteered *
                      </label>
                      <input
                        type="number"
                        name="hours"
                        value={checkInData.hours}
                        onChange={handleChange}
                        placeholder="e.g. 3.5"
                        min="0.5"
                        step="0.5"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none ring-green-500 focus:ring-2"
                        required
                      />
                    </div>
                  </div>

                  {/* Notes / Experience */}
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Drive Experience / Impact Notes (Optional)
                    </label>
                    <textarea
                      name="notes"
                      value={checkInData.notes}
                      onChange={handleChange}
                      placeholder="Briefly describe what you achieved, stories from the field, or volunteer reflections…"
                      rows={3}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none ring-green-500 focus:ring-2"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={handleCloseCheckInForm}
                      className="w-full sm:w-auto rounded-xl border border-slate-300 dark:border-slate-700 px-6 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      Cancel / Hide Form
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-green-700 px-8 py-3 text-sm sm:text-base font-bold text-white shadow-lg transition hover:from-green-700 hover:to-green-800 active:scale-95 disabled:opacity-60"
                    >
                      <Camera size={20} />
                      {isSubmitting ? "Submitting Check-In..." : "Submit Check-In"}
                    </button>
                  </div>
                </form>
              </Card>
            </div>
          )}
        </div>
      </section>

      {/* 3. Weekly Impact Stats & Volunteer Progress */}
      <section className="bg-white dark:bg-slate-900 py-12">
        <div className="container-max">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-green-50 to-white dark:from-slate-800 dark:to-slate-900 border-l-4 border-green-600">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40 text-green-600">
                  <Users size={28} />
                </div>
                <p className="text-3xl font-extrabold text-green-600">{weeklyStats.volunteers}</p>
                <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300">Volunteers Active</p>
                <p className="text-xs text-slate-400">Last 7 days</p>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-teal-50 to-white dark:from-slate-800 dark:to-slate-900 border-l-4 border-teal-600">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-600">
                  <Heart size={28} />
                </div>
                <p className="text-3xl font-extrabold text-teal-600">
                  {weeklyStats.beneficiaries.toLocaleString()}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300">Lives Impacted</p>
                <p className="text-xs text-slate-400">Last 7 days</p>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-white dark:from-slate-800 dark:to-slate-900 border-l-4 border-amber-600">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600">
                  <Award size={28} />
                </div>
                <p className="text-3xl font-extrabold text-amber-600">{weeklyStats.activities}</p>
                <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300">Activities Completed</p>
                <p className="text-xs text-slate-400">Last 7 days</p>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-slate-800 dark:to-slate-900 border-l-4 border-purple-600">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600">
                  <Clock size={28} />
                </div>
                <p className="text-3xl font-extrabold text-purple-600">{weeklyStats.hours.toFixed(0)}</p>
                <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300">Hours Contributed</p>
                <p className="text-xs text-slate-400">Last 7 days</p>
              </div>
            </Card>
          </div>

          {/* User Personal Progress */}
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card className="border-2 border-green-100 dark:border-green-950">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-green-100 dark:bg-green-900/40 p-3 text-green-600">
                    <Award size={26} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Your Activity Total</p>
                    <p className="text-3xl font-bold text-green-600">{userStats.totalDrives}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current Badge</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {userStats.currentBadge ? `${userStats.currentBadge.icon} ${userStats.currentBadge.name}` : "✨ Spark"}
                  </p>
                </div>
              </div>

              {getNextBadge() && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs font-semibold mb-2">
                    <span className="text-slate-600 dark:text-slate-400">
                      Next Milestone: {getNextBadge().icon} {getNextBadge().name}
                    </span>
                    <span className="text-green-600">
                      {userStats.totalDrives} / {getNextBadge().drives} drives
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                      style={{ width: `${getBadgeProgress()}%` }}
                    />
                  </div>
                </div>
              )}

              {userStats.currentBadge && (
                <button
                  type="button"
                  onClick={() =>
                    navigate(ROUTES.CERTIFICATE, {
                      state: {
                        volunteerName: currentUser?.name || "Volunteer",
                        badgeName: userStats.currentBadge.name,
                        badgeIcon: userStats.currentBadge.icon,
                        totalDrives: userStats.totalDrives,
                      },
                    })
                  }
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-green-600/30 bg-green-50 dark:bg-green-950/30 px-4 py-2.5 text-xs font-bold text-green-700 dark:text-green-300 transition hover:bg-green-100"
                >
                  <Award size={15} /> View & Print Volunteer Certificate
                </button>
              )}
            </Card>

            <Card className="border-2 border-green-100 dark:border-green-950 bg-gradient-to-br from-green-50/70 to-emerald-50/30 dark:from-slate-800 dark:to-slate-800/80">
              <div className="text-center py-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-200/70 dark:bg-green-900/50 px-3 py-1 text-xs font-bold text-green-800 dark:text-green-300">
                  🌟 On-Ground Service
                </span>
                <h3 className="mt-2 text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Log your next drive in 30 seconds
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  Every photo inspires dozens more to join and support community causes.
                </p>
                <button
                  type="button"
                  onClick={handleOpenCheckInForm}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-600 hover:bg-green-700 px-6 py-2.5 text-sm font-bold text-white shadow transition hover:shadow-md active:scale-95"
                >
                  <CheckCircle size={17} />
                  Check-In Now (Top Form)
                </button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 4. Categorized Impact Gallery Section */}
      <section ref={galleryRef} id="impact-gallery" className="bg-slate-50 dark:bg-slate-900/70 py-16 scroll-mt-10">
        <div className="container-max">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-8">
            <span className="rounded-full bg-green-100 dark:bg-green-950/60 px-3.5 py-1 text-xs font-extrabold uppercase tracking-widest text-green-700 dark:text-green-300">
              FIELD IMPACT BY FOCUS AREA
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              Categorized Volunteer Impact Gallery
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Browse pictures from our volunteers across India, organized by the specific cause and area in which impact was created.
            </p>
          </div>

          {/* Impact Area Category Pills Bar */}
          <div className="mb-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1 scrollbar-thin">
              {IMPACT_AREAS.map((area) => {
                const count = impactCounts[area.id] || 0;
                const isSelected = selectedCategory === area.id;

                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => setSelectedCategory(area.id)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap shadow-sm ${
                      isSelected
                        ? "bg-green-600 text-white shadow-md scale-105 ring-2 ring-green-600 ring-offset-2 dark:ring-offset-slate-900"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span className="text-base">{area.icon}</span>
                    <span>{area.shortLabel || area.label}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                        isSelected
                          ? "bg-white/25 text-white"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Secondary Controls Bar: City filter, Search, and View Mode */}
          <div className="mb-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-slate-200/80 dark:border-slate-700/80">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by volunteer name, location, or drive notes…"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 pl-10 pr-8 py-2 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-green-500 focus:bg-white dark:focus:bg-slate-900"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* City Selector */}
            <div className="flex items-center gap-2">
              <MapPin size={17} className="text-green-600 flex-shrink-0" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-green-500 cursor-pointer"
              >
                <option value="all">All Cities ({allCities.length})</option>
                {allCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle: Grid vs Grouped */}
            <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200/60 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-slate-800 text-green-700 dark:text-green-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
                title="All photos in uniform grid"
              >
                <Grid size={14} /> Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grouped")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  viewMode === "grouped"
                    ? "bg-white dark:bg-slate-800 text-green-700 dark:text-green-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
                title="Group photos by impact area sections"
              >
                <Layers size={14} /> By Cause
              </button>
            </div>

            {/* Reset Filters (if active) */}
            {(selectedCategory !== "all" || selectedCity !== "all" || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("all");
                  setSelectedCity("all");
                  setSearchQuery("");
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 transition"
              >
                <RotateCcw size={13} /> Reset
              </button>
            )}
          </div>

          {/* Active Filter Headline */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 px-1">
            <p>
              Showing <strong className="text-green-600">{filteredCheckIns.length}</strong> activity pictures
              {selectedCategory !== "all" && (
                <> in <strong className="text-slate-900 dark:text-white">{IMPACT_AREAS.find((a) => a.id === selectedCategory)?.label}</strong></>
              )}
              {selectedCity !== "all" && (
                <> • City: <strong className="text-slate-900 dark:text-white">{selectedCity}</strong></>
              )}
              {searchQuery && (
                <> • Matching: "<em>{searchQuery}</em>"</>
              )}
            </p>
          </div>

          {/* Gallery Items */}
          {filteredCheckIns.length === 0 ? (
            <Card className="text-center py-16">
              <Camera size={64} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-xl font-bold text-slate-700 dark:text-slate-200">No activity pictures found</p>
              <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                No check-ins match the selected impact area or city. Try resetting filters or be the first to log a check-in!
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("all");
                    setSelectedCity("all");
                    setSearchQuery("");
                  }}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200"
                >
                  View All Check-Ins
                </button>
                <button
                  type="button"
                  onClick={handleOpenCheckInForm}
                  className="rounded-xl bg-green-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-green-700"
                >
                  + Log Check-In
                </button>
              </div>
            </Card>
          ) : viewMode === "grouped" && selectedCategory === "all" ? (
            /* Mode 1: Grouped by Cause / Impact Area */
            <div className="space-y-12">
              {groupedCheckIns.map(({ area, items }) => (
                <div key={area.id} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-800/60 p-6 shadow-sm">
                  {/* Category Header */}
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-green-50 to-emerald-100 dark:from-slate-700 dark:to-slate-800 text-2xl shadow-sm">
                        {area.icon}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                            {area.label}
                          </h3>
                          <span className="rounded-full bg-green-100 dark:bg-green-900/40 px-2.5 py-0.5 text-xs font-extrabold text-green-700 dark:text-green-300">
                            {items.length} {items.length === 1 ? "activity" : "activities"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {area.description}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedCategory(area.id)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-green-600 hover:text-green-700"
                    >
                      Filter this cause <ArrowRight size={13} />
                    </button>
                  </div>

                  {/* Photos Grid for this category */}
                  <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {items.map((checkIn) => renderPhotoCard(checkIn))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Mode 2: Uniform Responsive Grid */
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {filteredCheckIns.map((checkIn) => renderPhotoCard(checkIn))}
            </div>
          )}
        </div>
      </section>

      {/* 5. Analytics & Top Focus Areas */}
      <section className="bg-white dark:bg-slate-900 py-16">
        <div className="container-max">
          <div className="mb-8 text-center">
            <span className="rounded-full bg-amber-100 dark:bg-amber-950/60 px-3.5 py-1 text-xs font-extrabold uppercase tracking-widest text-amber-700 dark:text-amber-300">
              COMMUNITY ANALYTICS
            </span>
            <h2 className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
              {selectedCity === "all" ? "Impact Footprint Across India" : `Impact in ${selectedCity}`}
            </h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Top Cities */}
            <Card className="p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-2xl bg-amber-100 dark:bg-amber-900/40 p-3 text-amber-600">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Top Active Cities</h3>
                  <p className="text-xs text-slate-500">Most active locations by volunteer check-ins</p>
                </div>
              </div>

              {cityStats.length > 0 ? (
                <div className="space-y-4">
                  {cityStats.map((city, index) => {
                    const maxCount = cityStats[0]?.count || 1;
                    const percentage = (city.count / maxCount) * 100;
                    return (
                      <div key={city.city}>
                        <div className="flex justify-between items-center mb-1.5 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50 text-xs font-bold text-green-700 dark:text-green-300">
                              {index + 1}
                            </span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{city.city}</span>
                          </div>
                          <span className="font-bold text-green-600">{city.count} drives</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-600"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-slate-400 py-8">No data available yet</p>
              )}
            </Card>

            {/* Impact Area Breakdown */}
            <Card className="p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-2xl bg-green-100 dark:bg-green-900/40 p-3 text-green-600">
                  <BarChart3 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Impact Area Breakdown</h3>
                  <p className="text-xs text-slate-500">Distribution of volunteer drives across causes</p>
                </div>
              </div>

              {activityBreakdown.length > 0 ? (
                <div className="space-y-4">
                  {activityBreakdown.map((item, index) => {
                    const maxCount = activityBreakdown[0]?.count || 1;
                    const percentage = (item.count / maxCount) * 100;
                    const areaInfo = resolveImpactArea(item.activity);

                    return (
                      <div key={item.activity}>
                        <div className="flex justify-between items-center mb-1.5 text-sm">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <span>{areaInfo.icon}</span> {item.activity}
                          </span>
                          <span className="font-bold text-green-600">{item.count} drives</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${areaInfo.gradient}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-slate-400 py-8">No data available yet</p>
              )}
            </Card>
          </div>
        </div>
      </section>

      {/* 6. Champions of Change / Top Volunteers */}
      {topVolunteers.length > 0 && (
        <section className="bg-gradient-to-br from-green-50/60 via-slate-50 to-orange-50/40 dark:from-slate-900 dark:to-slate-800 py-16">
          <div className="container-max">
            <div className="mb-8 text-center">
              <span className="rounded-full bg-green-100 dark:bg-green-950/60 px-3.5 py-1 text-xs font-extrabold uppercase tracking-widest text-green-700 dark:text-green-300">
                CHAMPIONS OF CHANGE
              </span>
              <h2 className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
                Most Active Volunteers
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Celebrating our passionate changemakers leading grassroots drives.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              {topVolunteers.map((volunteer) => (
                <Card
                  key={volunteer.id}
                  className="relative overflow-hidden text-center transition hover:shadow-xl dark:border-slate-800"
                >
                  {volunteer.photo ? (
                    <div
                      className="group relative aspect-square cursor-pointer overflow-hidden"
                      onClick={() =>
                        setModalImage({
                          photo: volunteer.photo,
                          photos: [volunteer.photo],
                          userName: volunteer.name,
                          activity: `${volunteer.badge.icon} ${volunteer.badge.name} Volunteer`,
                          location: `${volunteer.count} activities completed`,
                        })
                      }
                    >
                      <img
                        src={volunteer.photo}
                        alt={volunteer.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition group-hover:opacity-100">
                        <span className="rounded-full bg-black/60 p-1.5 text-white shadow-md backdrop-blur-sm">
                          <Maximize2 size={16} />
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-square flex items-center justify-center bg-gradient-to-br from-green-500 to-green-700">
                      <span className="text-5xl font-extrabold text-white">
                        {volunteer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Badge overlay */}
                  <div className="absolute top-2 right-2">
                    <div className="relative flex h-12 w-12 items-center justify-center">
                      <div
                        className={`absolute inset-0 ${volunteer.badge.color}`}
                        style={{
                          clipPath:
                            "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
                        }}
                      />
                      <span className="relative z-10 text-xl">{volunteer.badge.icon}</span>
                    </div>
                  </div>

                  <div className="p-3.5">
                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {volunteer.name}
                    </p>
                    <p className="text-xs font-semibold text-green-600 dark:text-green-400">
                      {volunteer.badge.name} Tier
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {volunteer.count} {volunteer.count === 1 ? "Activity" : "Activities"}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7. Full Image Modal Lightbox with Multi-Image Carousel */}
      {modalImage && (() => {
        const photosList =
          modalImage.photos && modalImage.photos.length > 0
            ? modalImage.photos
            : modalImage.photo
            ? [modalImage.photo]
            : modalImage.url
            ? [modalImage.url]
            : [];
        const activeIdx = Math.min(
          Math.max(0, modalImage.activeIndex || 0),
          Math.max(0, photosList.length - 1)
        );
        const currentPhoto = photosList[activeIdx] || modalImage.photo || modalImage.url;
        const hasMultiple = photosList.length > 1;
        const areaInfo = resolveImpactArea(modalImage.activity || modalImage.impactArea);

        const handlePrev = (e) => {
          e.stopPropagation();
          setModalImage((prev) => ({
            ...prev,
            activeIndex: (activeIdx - 1 + photosList.length) % photosList.length,
          }));
        };

        const handleNext = (e) => {
          e.stopPropagation();
          setModalImage((prev) => ({
            ...prev,
            activeIndex: (activeIdx + 1) % photosList.length,
          }));
        };

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setModalImage(null)}
          >
            <div
              className="relative flex max-h-[92vh] max-w-5xl w-full flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setModalImage(null)}
                className="absolute -right-2 -top-2 sm:-right-4 sm:-top-4 z-20 rounded-full bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-white shadow-2xl transition hover:bg-slate-100 hover:scale-105"
                aria-label="Close full image view"
              >
                <X size={20} />
              </button>

              {/* Main Photo Frame */}
              <div className="relative overflow-hidden rounded-2xl bg-black/50 shadow-2xl max-w-full flex items-center justify-center min-h-[320px]">
                {currentPhoto && (
                  <img
                    src={currentPhoto}
                    alt={modalImage.activity || modalImage.location || `Photo ${activeIdx + 1}`}
                    className="max-h-[70vh] w-auto max-w-full rounded-2xl object-contain select-none transition-all duration-200"
                  />
                )}

                {/* Left / Right Carousel Controls */}
                {hasMultiple && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/60 p-2.5 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/80 hover:scale-110 active:scale-95"
                      title="Previous photo (Left arrow)"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/60 p-2.5 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/80 hover:scale-110 active:scale-95"
                      title="Next photo (Right arrow)"
                    >
                      <ChevronRight size={24} />
                    </button>
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <span className="rounded-full bg-black/70 backdrop-blur-sm px-3 py-1 text-xs font-bold text-white shadow-sm">
                        {activeIdx + 1} / {photosList.length}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails Row for Multiple Images */}
              {hasMultiple && (
                <div className="mt-3 flex items-center gap-2 overflow-x-auto max-w-full py-1 scrollbar-none">
                  {photosList.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setModalImage((prev) => ({ ...prev, activeIndex: idx }))}
                      className={`relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${
                        activeIdx === idx
                          ? "border-green-400 scale-105 shadow-md"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={p} alt={`Thumb ${idx + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Details & Impact Metadata */}
              <div className="mt-4 max-w-2xl text-center text-white">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="rounded-full bg-green-600 px-3.5 py-1 text-xs font-bold text-white shadow-sm flex items-center gap-1">
                    <span>{areaInfo.icon}</span>
                    <span>{modalImage.activity || areaInfo.label}</span>
                  </span>

                  {modalImage.location && (
                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-slate-100 backdrop-blur-sm">
                      📍 {modalImage.location}
                    </span>
                  )}
                  {modalImage.userName && (
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
                      Volunteer: {modalImage.userName}
                    </span>
                  )}
                  {modalImage.beneficiaries > 0 && (
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
                      👥 {modalImage.beneficiaries} Beneficiaries
                    </span>
                  )}
                  {modalImage.hours > 0 && (
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
                      ⏱️ {modalImage.hours}h Contributed
                    </span>
                  )}
                </div>

                {modalImage.notes && (
                  <p className="mt-2.5 text-xs sm:text-sm italic text-slate-300 px-4">
                    "{modalImage.notes}"
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );

  // Helper to render individual photo cards in the gallery
  function renderPhotoCard(checkIn) {
    const hasPhoto = Boolean(checkIn.photo || (checkIn.photos && checkIn.photos.length > 0));
    const displayPhoto = checkIn.photo || (checkIn.photos && checkIn.photos[0]);
    const photoCount =
      checkIn.photos && checkIn.photos.length > 0 ? checkIn.photos.length : checkIn.photo ? 1 : 0;
    const photosList =
      checkIn.photos && checkIn.photos.length > 0
        ? checkIn.photos
        : checkIn.photo
        ? [checkIn.photo]
        : [];
    const area = resolveImpactArea(checkIn);

    return (
      <div
        key={checkIn.id}
        onClick={() => hasPhoto && setModalImage({ ...checkIn, photos: photosList, activeIndex: 0 })}
        className={`group relative aspect-square overflow-hidden rounded-2xl shadow-md transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
          hasPhoto ? "cursor-pointer" : ""
        }`}
      >
        {hasPhoto ? (
          <>
            <img
              src={displayPhoto}
              alt={checkIn.activity}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition group-hover:opacity-100">
              <span className="rounded-full bg-black/60 p-2 text-white shadow-lg backdrop-blur-sm">
                <Maximize2 size={18} />
              </span>
            </div>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-green-500 to-teal-700">
            <Camera size={44} className="text-white/60" />
          </div>
        )}

        {/* Top-Left: Multi-photo badge */}
        {photoCount > 1 && (
          <div className="absolute top-2 left-2 pointer-events-none z-10">
            <span className="inline-flex items-center gap-1 rounded-full bg-black/75 backdrop-blur-sm px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
              <Images size={11} /> {photoCount} photos
            </span>
          </div>
        )}

        {/* Top-Right: Impact Area Badge with Icon */}
        <div className="absolute top-2 right-2 pointer-events-none z-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 dark:bg-slate-900/90 backdrop-blur-sm px-2 py-0.5 text-[10px] font-bold text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
            <span>{area.icon}</span>
            <span className="truncate max-w-[85px] sm:max-w-[100px]">{area.shortLabel || area.label}</span>
          </span>
        </div>

        {/* Bottom Metadata Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white pointer-events-none">
          <p className="font-bold text-xs sm:text-sm truncate drop-shadow-sm">{checkIn.location}</p>
          <div className="flex items-center justify-between text-[11px] text-white/80 mt-0.5">
            <span className="truncate max-w-[90px]">{checkIn.userName || "Volunteer"}</span>
            <span className="flex items-center gap-0.5 flex-shrink-0 text-white/70">
              <Clock size={11} /> {formatTimeAgo(checkIn.timestamp)}
            </span>
          </div>
        </div>
      </div>
    );
  }
}

export default CheckInPage;
