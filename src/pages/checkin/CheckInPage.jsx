import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera, Upload, Medal, TrendingUp, MapPin, Clock, Award, Users, Heart,
  CheckCircle, BarChart3, X, Maximize2, ChevronLeft, ChevronRight, Plus, Images
} from "lucide-react";
import { Button, Card, SectionWrapper } from "../../components";
import { getCurrentUser, isAuthenticated } from "../../services/authService";
import { saveCheckIn, getCheckIns, getAllCheckIns } from "../../services/firestoreService";
import { formatCityName } from "../volunteer/VolunteerPage";
import { ROUTES } from "../../utils/constants";

const BADGES = [
  { name: "Spark", drives: 1, icon: "✨", color: "bg-slate-500" },
  { name: "Flame", drives: 10, icon: "🔥", color: "bg-teal-500" },
  { name: "Beacon", drives: 50, icon: "💡", color: "bg-purple-500" },
  { name: "Sun", drives: 100, icon: "☀️", color: "bg-amber-500" },
];

function CheckInPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [checkInData, setCheckInData] = useState({
    activity: "",
    location: "",
    beneficiaries: "",
    hours: "",
    notes: ""
  });
  const [previewImages, setPreviewImages] = useState([]);
  const [recentCheckIns, setRecentCheckIns] = useState([]);
  const [allCheckIns, setAllCheckIns] = useState([]);
  const [userStats, setUserStats] = useState({ totalDrives: 0, currentBadge: null });
  const [success, setSuccess] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [modalImage, setModalImage] = useState(null);

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
      // Personal check-ins → badge & stats only
      const userCheckIns = await getCheckIns(userId);
      const totalDrives  = userCheckIns.length;
      const currentBadge = BADGES.filter(b => totalDrives >= b.drives).pop() || null;
      setUserStats({ totalDrives, currentBadge });

      // All volunteers' check-ins → public feed, city stats, leaderboard
      const everyone = await getAllCheckIns();
      setAllCheckIns(everyone);
      setRecentCheckIns(everyone.slice(0, 24));
    } catch {
      // Firebase not configured — fall back to localStorage
      const allCheckInsData = JSON.parse(localStorage.getItem("iiwc_checkins") || "[]");
      const userCheckIns    = allCheckInsData.filter(c => c.userId === userId);
      const totalDrives     = userCheckIns.length;
      const currentBadge    = BADGES.filter(b => totalDrives >= b.drives).pop() || null;
      setUserStats({ totalDrives, currentBadge });
      setAllCheckIns(allCheckInsData);
      setRecentCheckIns([...allCheckInsData].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 24));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Support up to 6 photos per check-in
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

    // Reset so same files can be re-selected if removed
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

    const normalizedLocation = formatCityName(checkInData.location);
    const parsedHours = parseFloat(checkInData.hours) || 0;
    const primaryPhoto = previewImages[0] ?? null;

    const checkIn = {
      id:            Date.now().toString(),
      userId:        currentUser.id,
      userName:      currentUser.name,
      userEmail:     currentUser.email || "",
      activity:      checkInData.activity,
      location:      normalizedLocation,
      beneficiaries: parseInt(checkInData.beneficiaries) || 0,
      hours:         parsedHours,
      notes:         checkInData.notes,
      photo:         primaryPhoto,
      photos:        previewImages,
      timestamp:     new Date().toISOString(),
    };

    try {
      await saveCheckIn({
        userId:        currentUser.id,
        userName:      currentUser.name,
        userEmail:     currentUser.email || "",
        activity:      checkInData.activity,
        location:      normalizedLocation,
        beneficiaries: checkInData.beneficiaries,
        hours:         parsedHours,
        notes:         checkInData.notes,
        photo:         primaryPhoto,
        photos:        previewImages,
      });
    } catch {
      // Firebase not configured — save locally
      const stored = JSON.parse(localStorage.getItem("iiwc_checkins") || "[]");
      stored.push(checkIn);
      localStorage.setItem("iiwc_checkins", JSON.stringify(stored));
    }

    await loadCheckInData(currentUser.id);
    setSuccess("Check-in successful!");
    setCheckInData({ activity: "", location: "", beneficiaries: "", hours: "", notes: "" });
    setPreviewImages([]);
    setTimeout(() => setSuccess(""), 3000);
  };

  const getNextBadge = () => {
    return BADGES.find(b => b.drives > userStats.totalDrives);
  };

  const getBadgeProgress = () => {
    const nextBadge = getNextBadge();
    if (!nextBadge) return 100;
    return (userStats.totalDrives / nextBadge.drives) * 100;
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diff = Math.floor((now - then) / 1000); // seconds

    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  // Get all unique cities (normalized to avoid duplicates)
  const getAllCities = () => {
    const cities = new Set();
    allCheckIns.forEach((c) => {
      if (c.location) {
        cities.add(formatCityName(c.location));
      }
    });
    return Array.from(cities).sort((a, b) => a.localeCompare(b));
  };

  // Get filtered check-ins based on selected city
  const getFilteredCheckIns = () => {
    if (selectedCity === "all") {
      return recentCheckIns;
    }
    return recentCheckIns.filter((c) => formatCityName(c.location) === selectedCity);
  };

  // Calculate weekly stats
  const getWeeklyStats = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const dataToUse = selectedCity === "all" ? allCheckIns : allCheckIns.filter(c => formatCityName(c.location) === selectedCity);
    const weeklyCheckIns = dataToUse.filter(
      c => new Date(c.timestamp) > oneWeekAgo
    );
    
    const totalVolunteers = new Set(weeklyCheckIns.map(c => c.userId)).size;
    const totalBeneficiaries = weeklyCheckIns.reduce((sum, c) => sum + (c.beneficiaries || 0), 0);
    const totalHours = weeklyCheckIns.reduce((sum, c) => sum + (c.hours || 0), 0);
    
    return { volunteers: totalVolunteers, beneficiaries: totalBeneficiaries, hours: totalHours, activities: weeklyCheckIns.length };
  };

  // Get city-wise statistics
  const getCityStats = () => {
    const cityMap = {};
    const dataToUse = selectedCity === "all" ? allCheckIns : allCheckIns.filter(c => c.location === selectedCity);
    dataToUse.forEach(checkIn => {
      const city = checkIn.location;
      cityMap[city] = (cityMap[city] || 0) + 1;
    });
    
    return Object.entries(cityMap)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  };

  // Get activity type breakdown
  const getActivityBreakdown = () => {
    const activityMap = {};
    const dataToUse = selectedCity === "all" ? allCheckIns : allCheckIns.filter(c => c.location === selectedCity);
    dataToUse.forEach(checkIn => {
      const activity = checkIn.activity;
      activityMap[activity] = (activityMap[activity] || 0) + 1;
    });
    
    return Object.entries(activityMap)
      .map(([activity, count]) => ({ activity, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  // Get top volunteers
  const getTopVolunteers = () => {
    const volunteerMap = {};
    recentCheckIns.forEach(checkIn => {
      if (!volunteerMap[checkIn.userId]) {
        volunteerMap[checkIn.userId] = {
          id: checkIn.userId,
          name: checkIn.userName,
          count: 0,
          photo: checkIn.photo
        };
      }
      volunteerMap[checkIn.userId].count++;
    });
    
    return Object.values(volunteerMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map(v => ({
        ...v,
        badge: BADGES.filter(b => v.count >= b.drives).pop() || BADGES[0]
      }));
  };

  if (!currentUser) return null;

  const allCities = getAllCities();
  const filteredCheckIns = getFilteredCheckIns();
  const weeklyStats = getWeeklyStats();
  const cityStats = getCityStats();
  const activityBreakdown = getActivityBreakdown();
  const topVolunteers = getTopVolunteers();

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-600 via-green-700 to-green-800 py-20 text-white">
        <div className="container-max">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <h1 className="text-4xl font-bold leading-tight sm:text-5xl">Check-In to Your BWF Activity</h1>
              <p className="mt-4 text-lg text-green-100">
                Share your volunteer journey by uploading a photo and earn recognition badges that showcase your impact
              </p>
              <button
                onClick={() => document.getElementById('checkin-form').scrollIntoView({ behavior: 'smooth' })}
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-green-300 px-8 py-4 text-lg font-semibold text-green-900 transition hover:bg-green-200"
              >
                <CheckCircle size={24} />
                Check-In Now
              </button>
            </div>
            
            {/* Badges Display */}
            <div className="grid grid-cols-2 gap-6">
              {BADGES.map((badge) => (
                <div key={badge.name} className="text-center">
                  <div className="relative mx-auto mb-3 flex h-24 w-24 items-center justify-center">
                    {/* Hexagonal Shape Background */}
                    <div className={`absolute inset-0 ${badge.color} opacity-20`} style={{
                      clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'
                    }} />
                    <div className={`absolute inset-2 ${badge.color}`} style={{
                      clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'
                    }} />
                    <span className="relative z-10 text-4xl">{badge.icon}</span>
                  </div>
                  <p className="font-bold uppercase tracking-wide text-white">{badge.name}</p>
                  <p className="text-sm text-green-200">{badge.drives} {badge.drives === 1 ? 'Activity' : 'Activities'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Weekly Impact Stats */}
      <section className="bg-white dark:bg-slate-900 py-12">
        <div className="container-max">
          {selectedCity !== "all" && (
            <div className="mb-6 text-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-green-600">Showing data for</p>
              <h3 className="mt-1 text-2xl font-bold text-slate-900">{selectedCity}</h3>
            </div>
          )}
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-green-50 to-white border-l-4 border-green-600">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <Users className="text-green-600" size={32} />
                </div>
                <p className="text-4xl font-bold text-green-600">{weeklyStats.volunteers}</p>
                <p className="mt-1 text-sm font-medium text-slate-600">Volunteers Active</p>
                <p className="text-xs text-slate-400">Last 7 days</p>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-teal-50 to-white border-l-4 border-teal-600">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
                  <Heart className="text-teal-600" size={32} />
                </div>
                <p className="text-4xl font-bold text-teal-600">{weeklyStats.beneficiaries.toLocaleString()}</p>
                <p className="mt-1 text-sm font-medium text-slate-600">Lives Impacted</p>
                <p className="text-xs text-slate-400">Last 7 days</p>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-white border-l-4 border-amber-600">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                  <Award className="text-amber-600" size={32} />
                </div>
                <p className="text-4xl font-bold text-amber-600">{weeklyStats.activities}</p>
                <p className="mt-1 text-sm font-medium text-slate-600">Activities Completed</p>
                <p className="text-xs text-slate-400">Last 7 days</p>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-white border-l-4 border-purple-600">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                  <Clock className="text-purple-600" size={32} />
                </div>
                <p className="text-4xl font-bold text-purple-600">{weeklyStats.hours.toFixed(0)}</p>
                <p className="mt-1 text-sm font-medium text-slate-600">Hours Volunteered</p>
                <p className="text-xs text-slate-400">Last 7 days</p>
              </div>
            </Card>
          </div>

          {/* User Progress */}
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card className="border-2 border-green-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-green-100 p-3 text-green-600">
                    <Award size={28} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Your Activities</p>
                    <p className="text-3xl font-bold text-green-600">{userStats.totalDrives}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-600">Current Badge</p>
                  <p className="text-2xl font-bold text-primary">
                    {userStats.currentBadge ? `${userStats.currentBadge.icon} ${userStats.currentBadge.name}` : "🌟 Start Now"}
                  </p>
                </div>
              </div>
              
              {getNextBadge() && (
                <>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-slate-600">Progress to {getNextBadge().icon} {getNextBadge().name}</span>
                      <span className="font-bold text-green-600">{userStats.totalDrives}/{getNextBadge().drives}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                        style={{ width: `${getBadgeProgress()}%` }}
                      />
                    </div>
                  </div>
                </>
              )}

              {userStats.currentBadge && (
                <button
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
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/10 dark:border-primary/50 dark:bg-primary/10 dark:text-accent dark:hover:bg-primary/20"
                >
                  <Award size={16} /> View & Print Certificate
                </button>
              )}
            </Card>

            <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-white">
              <div className="text-center">
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">Join the Movement</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">Check-in to your next activity!</h3>
                <p className="mt-2 text-slate-600">And you may see yourself featured here</p>
                <button
                  onClick={() => document.getElementById('checkin-form').scrollIntoView({ behavior: 'smooth' })}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-500 px-6 py-3 text-white font-semibold transition hover:bg-green-600"
                >
                  <CheckCircle size={20} />
                  Check-In Now
                </button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Recent Check-Ins Section */}
      <section className="bg-slate-50 dark:bg-slate-800 py-16">
        <div className="container-max">
          <div className="mb-8">
            <div className="text-center mb-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-green-600">RECENT CHECK-INS</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                Volunteers Making Impact Across India
              </h2>
              <p className="mt-2 text-slate-600">Real-time updates from our volunteer community</p>
            </div>
            
            {/* City Selector */}
            <div className="flex justify-center items-center gap-4 mt-6">
              <div className="flex items-center gap-3 rounded-xl border-2 border-green-100 dark:border-green-900/50 bg-white dark:bg-slate-800 px-6 py-3 shadow-sm">
                <MapPin className="text-green-600" size={20} />
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Look up any city</p>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="mt-1 border-0 bg-transparent text-base font-semibold text-slate-900 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="all">All Cities</option>
                    {allCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {selectedCity !== "all" && (
                <button
                  onClick={() => setSelectedCity("all")}
                  className="text-sm font-medium text-green-600 hover:text-green-700 underline"
                >
                  Clear filter
                </button>
              )}
            </div>
          </div>

          {filteredCheckIns.length === 0 ? (
            <Card className="text-center py-12">
              <Camera size={64} className="mx-auto text-slate-300 mb-4" />
              <p className="text-xl font-semibold text-slate-600">No check-ins yet</p>
              <p className="text-slate-500 mt-2">
                {selectedCity === "all" 
                  ? "Be the first to share your volunteer activity!" 
                  : `No check-ins found in ${selectedCity}`}
              </p>
            </Card>
          ) : (
            <>
              {selectedCity !== "all" && (
                <div className="mb-6 text-center">
                  <p className="text-lg font-semibold text-slate-700">
                    <span className="text-green-600">{filteredCheckIns.length}</span> {filteredCheckIns.length === 1 ? 'check-in' : 'check-ins'} in <span className="text-green-600">{selectedCity}</span>
                  </p>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {filteredCheckIns.map((checkIn) => {
                  const hasPhoto = Boolean(checkIn.photo || (checkIn.photos && checkIn.photos.length > 0));
                  const displayPhoto = checkIn.photo || (checkIn.photos && checkIn.photos[0]);
                  const photoCount = checkIn.photos && checkIn.photos.length > 0 ? checkIn.photos.length : (checkIn.photo ? 1 : 0);
                  const photosList = checkIn.photos && checkIn.photos.length > 0 ? checkIn.photos : (checkIn.photo ? [checkIn.photo] : []);

                  return (
                    <div
                      key={checkIn.id}
                      onClick={() => hasPhoto && setModalImage({ ...checkIn, photos: photosList, activeIndex: 0 })}
                      className={`group relative aspect-square overflow-hidden rounded-xl shadow-md transition hover:shadow-xl ${
                        hasPhoto ? "cursor-pointer" : ""
                      }`}
                    >
                      {hasPhoto ? (
                        <>
                          <img 
                            src={displayPhoto} 
                            alt={checkIn.activity}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition group-hover:opacity-100">
                            <span className="rounded-full bg-black/60 p-2 text-white shadow-lg backdrop-blur-sm">
                              <Maximize2 size={18} />
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-green-400 to-green-600">
                          <Camera size={48} className="text-white opacity-50" />
                        </div>
                      )}

                      {/* Multiple Photos Badge */}
                      {photoCount > 1 && (
                        <div className="absolute top-2 left-2 pointer-events-none z-10">
                          <span className="inline-flex items-center gap-1 rounded-full bg-black/75 backdrop-blur-sm px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                            <Images size={11} /> {photoCount} photos
                          </span>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                      <div className="absolute bottom-0 left-0 right-0 p-3 text-white pointer-events-none">
                        <p className="font-bold text-sm">{checkIn.location}</p>
                        <p className="text-xs text-white/80 flex items-center gap-1 mt-1">
                          <Clock size={12} />
                          {formatTimeAgo(checkIn.timestamp)}
                        </p>
                      </div>
                      <div className="absolute top-2 right-2 pointer-events-none">
                        <div className="rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-green-700">
                          {checkIn.activity}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Analytics & Highlights */}
      <section className="bg-white dark:bg-slate-900 py-16">
        <div className="container-max">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-600">ACTIVITY HIGHLIGHTS</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              {selectedCity === "all" ? "Impact Across the Nation" : `Impact in ${selectedCity}`}
            </h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* City Leaderboard */}
            <Card className="p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-full bg-amber-100 p-3">
                  <MapPin className="text-amber-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Top Cities</h3>
                  <p className="text-sm text-slate-500">Most active locations in last 30 days</p>
                </div>
              </div>
              
              {cityStats.length > 0 ? (
                <div className="space-y-4">
                  {cityStats.map((city, index) => {
                    const maxCount = cityStats[0]?.count || 1;
                    const percentage = (city.count / maxCount) * 100;
                    
                    return (
                      <div key={city.city}>
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
                              {index + 1}
                            </span>
                            <span className="font-semibold text-slate-700">{city.city}</span>
                          </div>
                          <span className="text-lg font-bold text-green-600">{city.count}</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-600"
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

            {/* Activity Type Breakdown */}
            <Card className="p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-full bg-green-100 p-3">
                  <BarChart3 className="text-primary" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Activity Breakdown</h3>
                  <p className="text-sm text-slate-500">Popular volunteer activities</p>
                </div>
              </div>
              
              {activityBreakdown.length > 0 ? (
                <div className="space-y-4">
                  {activityBreakdown.map((activity, index) => {
                    const colors = [
                      'from-teal-400 to-teal-600',
                      'from-purple-400 to-purple-600',
                      'from-pink-400 to-pink-600',
                      'from-amber-400 to-amber-600',
                      'from-emerald-400 to-emerald-600'
                    ];
                    const maxCount = activityBreakdown[0]?.count || 1;
                    const percentage = (activity.count / maxCount) * 100;
                    
                    return (
                      <div key={activity.activity}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-slate-700">{activity.activity}</span>
                          <span className="text-lg font-bold text-primary">{activity.count}</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                          <div 
                            className={`h-full rounded-full bg-gradient-to-r ${colors[index % colors.length]}`}
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

      {/* Featured Volunteers */}
      {topVolunteers.length > 0 && (
        <section className="bg-gradient-to-br from-green-50 to-orange-50 py-16">
          <div className="container-max">
            <div className="mb-8 text-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-green-600">CHAMPIONS OF CHANGE</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">Most Active Volunteers</h2>
              <p className="mt-2 text-slate-600">Recognizing our dedicated community leaders</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              {topVolunteers.map((volunteer) => (
                <Card key={volunteer.id} className="relative overflow-hidden text-center transition hover:shadow-xl">
                  {volunteer.photo ? (
                    <div
                      className="group relative aspect-square cursor-pointer overflow-hidden"
                      onClick={() =>
                        setModalImage({
                          photo: volunteer.photo,
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
                    <div className="aspect-square flex items-center justify-center bg-gradient-to-br from-green-400 to-green-600">
                      <span className="text-6xl font-bold text-white">
                        {volunteer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  {/* Badge overlay */}
                  <div className="absolute top-2 right-2">
                    <div className="relative flex h-14 w-14 items-center justify-center">
                      <div className={`absolute inset-0 ${volunteer.badge.color}`} style={{
                        clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'
                      }} />
                      <span className="relative z-10 text-2xl">{volunteer.badge.icon}</span>
                    </div>
                  </div>

                  <div className="p-4">
                    <p className="font-bold text-slate-900">{volunteer.name}</p>
                    <p className="text-sm font-medium text-green-600">Latest {volunteer.badge.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{volunteer.count} {volunteer.count === 1 ? 'Activity' : 'Activities'}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Check-In Form */}
      <section className="bg-white dark:bg-slate-900 py-16">
        <div className="container-max">
          <div id="checkin-form" className="scroll-mt-20">
            <Card className="mx-auto max-w-3xl border-2 border-green-100 shadow-xl">
              <div className="mb-6 text-center">
                <h2 className="text-3xl font-bold text-green-600">Log Your Activity</h2>
                <p className="mt-2 text-slate-600">Upload a photo and details from your volunteer activity</p>
              </div>

              {success && (
                <div className="mb-6 rounded-xl border-2 border-green-200 bg-green-50 px-4 py-3 text-center text-green-700">
                  <p className="font-semibold">{success}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Photo Upload (Supports Multiple Images) */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      <Camera size={18} className="text-green-600" />
                      Activity Photos (Optional, max 6)
                    </label>
                    {previewImages.length > 0 && previewImages.length < 6 && (
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/40 px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-300 transition hover:bg-green-100 dark:hover:bg-green-900/60">
                        <Plus size={14} /> Add More Photos
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
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/50 p-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {previewImages.map((img, idx) => (
                          <div
                            key={idx}
                            className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm"
                          >
                            <img
                              src={img}
                              alt={`Upload ${idx + 1}`}
                              onClick={() =>
                                setModalImage({
                                  photo: img,
                                  photos: previewImages,
                                  activeIndex: idx,
                                  activity: checkInData.activity || "Uploaded Preview",
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
                                  activity: checkInData.activity || "Uploaded Preview",
                                  location: checkInData.location || "Preview",
                                  notes: checkInData.notes || "",
                                })
                              }
                              className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100 cursor-pointer"
                            >
                              <span className="rounded-full bg-black/60 p-2 text-white shadow-md">
                                <Maximize2 size={16} />
                              </span>
                            </div>

                            <div className="absolute top-2 left-2 pointer-events-none">
                              <span className="rounded-md bg-black/70 backdrop-blur-sm px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                                {idx === 0 ? "Cover Photo" : `#${idx + 1}`}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="absolute top-2 right-2 rounded-full bg-red-500 p-1.5 text-white shadow-lg transition hover:bg-red-600 hover:scale-110"
                              title="Remove photo"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))}

                        {previewImages.length < 6 && (
                          <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-green-300 dark:border-green-800 bg-white/70 dark:bg-slate-800/40 p-4 text-center transition hover:border-green-500 hover:bg-green-50/60 dark:hover:bg-green-950/20">
                            <div className="rounded-full bg-green-100 dark:bg-green-900/50 p-2 text-green-600 dark:text-green-400">
                              <Plus size={20} />
                            </div>
                            <span className="mt-2 text-xs font-bold text-green-700 dark:text-green-300">
                              Add Photo
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {6 - previewImages.length} slots left
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
                    <label className="flex h-72 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-green-300 bg-green-50/60 dark:bg-slate-800/50 dark:border-green-800 transition hover:border-green-400 hover:bg-green-100/60 dark:hover:bg-slate-800">
                      <div className="rounded-full bg-green-200/80 dark:bg-green-900/60 p-6 shadow-sm">
                        <Upload size={44} className="text-green-600 dark:text-green-300" />
                      </div>
                      <p className="mt-4 text-lg font-bold text-green-800 dark:text-green-300">
                        Click to upload activity photos
                      </p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Select one or multiple photos from your drive (up to 6)
                      </p>
                      <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/50 px-3.5 py-1 text-xs font-semibold text-green-800 dark:text-green-300 shadow-sm">
                        <Images size={13} /> Multiple selection enabled
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Activity Type *</label>
                    <select
                      name="activity"
                      value={checkInData.activity}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none ring-green-500 focus:ring-2"
                      required
                    >
                      <option value="">Select Activity</option>
                      <option value="Food Distribution">Food Distribution</option>
                      <option value="Healthcare Camp">Healthcare Camp</option>
                      <option value="Education Support">Education Support</option>
                      <option value="Skill Training">Skill Training</option>
                      <option value="Community Cleanup">Community Cleanup</option>
                      <option value="Awareness Drive">Awareness Drive</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Location *</label>
                    <input
                      type="text"
                      name="location"
                      value={checkInData.location}
                      onChange={handleChange}
                      placeholder="City/Village name"
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none ring-green-500 focus:ring-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Beneficiaries Served *</label>
                    <input
                      type="number"
                      name="beneficiaries"
                      value={checkInData.beneficiaries}
                      onChange={handleChange}
                      placeholder="Number of people"
                      min="1"
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none ring-green-500 focus:ring-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Hours Volunteered *</label>
                    <input
                      type="number"
                      name="hours"
                      value={checkInData.hours}
                      onChange={handleChange}
                      placeholder="Hours (e.g., 2.5)"
                      min="0.5"
                      step="0.5"
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none ring-green-500 focus:ring-2"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Notes (Optional)</label>
                  <textarea
                    name="notes"
                    value={checkInData.notes}
                    onChange={handleChange}
                    placeholder="Share your experience..."
                    rows={3}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none ring-green-500 focus:ring-2"
                  />
                </div>

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:from-green-600 hover:to-green-700"
                >
                  <Camera size={22} />
                  Submit Check-In
                </button>
              </form>
            </Card>
          </div>
        </div>
      </section>

      {/* Full Image Modal Lightbox with Multi-Image Carousel */}
      {modalImage && (() => {
        const photosList = (modalImage.photos && modalImage.photos.length > 0)
          ? modalImage.photos
          : (modalImage.photo ? [modalImage.photo] : (modalImage.url ? [modalImage.url] : []));
        const activeIdx = Math.min(Math.max(0, modalImage.activeIndex || 0), Math.max(0, photosList.length - 1));
        const currentPhoto = photosList[activeIdx] || modalImage.photo || modalImage.url;
        const hasMultiple = photosList.length > 1;

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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setModalImage(null)}
          >
            <div
              className="relative flex max-h-[92vh] max-w-5xl w-full flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setModalImage(null)}
                className="absolute -right-2 -top-2 sm:-right-4 sm:-top-4 z-20 rounded-full bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white shadow-2xl transition hover:bg-slate-100 dark:hover:bg-slate-700 hover:scale-105"
                aria-label="Close full image view"
              >
                <X size={20} />
              </button>

              <div className="relative overflow-hidden rounded-2xl bg-black/40 shadow-2xl max-w-full flex items-center justify-center min-h-[300px]">
                {currentPhoto && (
                  <img
                    src={currentPhoto}
                    alt={modalImage.activity || modalImage.location || `Photo ${activeIdx + 1}`}
                    className="max-h-[72vh] w-auto max-w-full rounded-2xl object-contain select-none transition-all duration-200"
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

              {/* Thumbnails row for multi-image checkins */}
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

              {(modalImage.activity || modalImage.location || modalImage.userName || modalImage.notes) && (
                <div className="mt-3 max-w-2xl text-center text-white">
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {modalImage.activity && (
                      <span className="rounded-full bg-green-500 px-3.5 py-1 text-xs font-bold text-white shadow-sm">
                        {modalImage.activity}
                      </span>
                    )}
                    {modalImage.location && (
                      <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-slate-200 backdrop-blur-sm">
                        📍 {modalImage.location}
                      </span>
                    )}
                    {modalImage.userName && (
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
                        By {modalImage.userName}
                      </span>
                    )}
                  </div>
                  {modalImage.notes && (
                    <p className="mt-2 text-xs italic text-slate-300">"{modalImage.notes}"</p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </>
  );
}

export default CheckInPage;
