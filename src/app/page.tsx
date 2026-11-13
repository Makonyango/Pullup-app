"use client";

import { useState, useEffect } from "react";
import { MapPin, Plus, Radio, User, ShieldCheck, Navigation, Compass, Sparkles, Flame, TrendingUp, Sun, Moon, Layers, List, Heart, LocateFixed } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { supabase } from "@/lib/supabase";

interface Drop {
  id: string;
  name: string;
  avatar: string;
  reliability: string;
  timeLeft: string;
  category: "Table & Pour" | "Cars & Bikes";
  badgeText: string;
  description: string;
  eta: string;
  slots: string;
  joined: boolean;
  isHost?: boolean;
  locationName: string;
  coordinates: { x: number; y: number };
}

export default function Home() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [bgStyle, setBgStyle] = useState<"mesh" | "emojis">("mesh");
  const [currentTab, setCurrentTab] = useState<"radar" | "active" | "profile">("radar");
  const [radarView, setRadarView] = useState<"feed" | "map">("feed");
  const [selectedVibe, setSelectedVibe] = useState<"all" | "Table & Pour" | "Cars & Bikes">("all");
  const [isOpen, setIsOpen] = useState(false);
  const [activePin, setActivePin] = useState<Drop | null>(null);

  // GPS State
  const [userLocationText, setUserLocationText] = useState("Nairobi (GPS Ready)");
  const [isLocating, setIsLocating] = useState(false);
  
  // Form state for new drop
  const [category, setCategory] = useState<"Table & Pour" | "Cars & Bikes">("Table & Pour");
  const [venue, setVenue] = useState("Mercury Lounge, Westlands");
  const [description, setDescription] = useState("Got drinks ready. Pull up for a quick vibe.");
  const [slots, setSlots] = useState("2/3 slots");

  const [drops, setDrops] = useState<Drop[]>([]);

  // Fetch drops from Supabase & listen to Realtime changes on mount
  useEffect(() => {
    fetchDrops();

    const channel = supabase
      .channel('public:drops')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drops' }, () => {
        fetchDrops();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDrops = async () => {
    const { data, error } = await supabase
      .from('drops')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching drops:', error);
    } else if (data) {
      const formattedDrops: Drop[] = data.map((d: any) => ({
        id: d.id,
        name: d.name,
        avatar: d.avatar || "https://i.pravatar.cc/150?u=default",
        reliability: d.reliability,
        timeLeft: d.time_left,
        category: d.category,
        badgeText: d.badge_text,
        description: d.description,
        eta: d.eta,
        slots: d.slots,
        joined: d.joined,
        isHost: d.is_host,
        locationName: d.location_name,
        coordinates: { x: Number(d.coordinates_x), y: Number(d.coordinates_y) }
      }));
      setDrops(formattedDrops);
    }
  };

  // Real GPS Geolocation Handler
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(4);
        const lng = position.coords.longitude.toFixed(4);
        setUserLocationText(`GPS Locked (${lat}, ${lng})`);
        setIsLocating(false);
      },
      () => {
        alert("Unable to retrieve your location. Please check permissions.");
        setIsLocating(false);
      }
    );
  };

  // WhatsApp Share Handler
  const handleWhatsAppShare = (drop: Drop) => {
    const text = `🚨 *PULLUP RADAR ALERT* 🚨\n\n*Vibe:* ${drop.category}\n*Location:* ${drop.locationName} (${drop.eta})\n*Details:* ${drop.description}\n*Slots Left:* ${drop.slots}\n\nPull up now via PullUp Nairobi!`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank");
  };

  // Broadcast new drop to Supabase
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    const newDropPayload = {
      name: "Brain Onyango",
      avatar: "https://i.pravatar.cc/150?u=current",
      reliability: "100% Reliability",
      time_left: "2h left",
      category: category,
      badge_text: "Active Drop",
      description: description,
      eta: `5 mins via ${venue}`,
      slots: slots,
      joined: true,
      is_host: true,
      location_name: venue.includes("Westlands") ? "Westlands" : "Kilimani",
      coordinates_x: 45,
      coordinates_y: 50,
    };

    const { error } = await supabase.from('drops').insert([newDropPayload]);

    if (error) {
      console.error('Error inserting drop:', error);
      alert('Failed to broadcast drop to database.');
    } else {
      setIsOpen(false);
      setCurrentTab("radar");
      setRadarView("feed");
    }
  };

  const handlePullUp = async (id: string, currentJoinedStatus: boolean) => {
    const newStatus = !currentJoinedStatus;
    const { error } = await supabase
      .from('drops')
      .update({ joined: newStatus })
      .eq('id', id);

    if (error) {
      console.error('Error updating RSVP:', error);
    } else {
      setDrops(drops.map(drop => drop.id === id ? { ...drop, joined: newStatus } : drop));
    }
  };

  const filteredDrops = drops.filter(drop => {
    if (selectedVibe === "all") return true;
    return drop.category === selectedVibe;
  });

  const myActiveDrops = drops.filter(drop => drop.joined || drop.isHost);
  const isDark = theme === "dark";

  return (
    <div className={`min-h-screen font-sans selection:bg-purple-500/30 relative overflow-x-hidden transition-colors duration-300 ${
      isDark ? "bg-[#0b0a10] text-[#f3f4f6]" : "bg-[#f4f4f6] text-[#111827]"
    }`}>

      {/* ================= BACKGROUND LAYERS ================= */}
      {bgStyle === "mesh" ? (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className={`absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[130px] transition-opacity duration-500 ${
            isDark ? "bg-purple-600/20" : "bg-purple-400/30"
          }`} />
          <div className={`absolute top-1/3 -right-32 w-96 h-96 rounded-full blur-[150px] transition-opacity duration-500 ${
            isDark ? "bg-indigo-600/15" : "bg-indigo-400/25"
          }`} />
          <div className={`absolute -bottom-32 left-1/4 w-96 h-96 rounded-full blur-[140px] transition-opacity duration-500 ${
            isDark ? "bg-fuchsia-600/15" : "bg-pink-400/20"
          }`} />
        </div>
      ) : (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 opacity-40 select-none">
          <div className="absolute top-[10%] left-[15%] text-2xl animate-bounce duration-1000">❤️</div>
          <div className="absolute top-[25%] right-[20%] text-3xl animate-pulse">✨</div>
          <div className="absolute top-[50%] left-[8%] text-3xl animate-bounce">🔥</div>
          <div className="absolute bottom-[20%] right-[15%] text-2xl animate-pulse">🥃</div>
          <div className="absolute top-[70%] left-[25%] text-3xl animate-bounce">🏎️</div>
          <div className="absolute top-[15%] right-[40%] text-2xl animate-pulse">💫</div>
          <div className="absolute bottom-[10%] left-[45%] text-3xl animate-bounce">💖</div>
        </div>
      )}

      {/* Main Responsive Layout Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[240px_1fr] lg:grid-cols-[260px_1fr_320px] min-h-screen relative z-10">
        
        {/* ================= LEFT SIDEBAR ================= */}
        <aside className={`hidden md:flex flex-col justify-between border-r p-5 sticky top-0 h-screen backdrop-blur-xl transition-colors duration-200 ${
          isDark 
            ? "border-white/[0.06] bg-[#0f0e17]/80 shadow-[4px_0_24px_rgba(0,0,0,0.3)]" 
            : "border-zinc-200 bg-white/80 shadow-[4px_0_24px_rgba(0,0,0,0.03)]"
        }`}>
          <div className="space-y-6">
            <div className="px-2 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="relative w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                  <div className="absolute w-6 h-6 rounded-full border border-purple-400/60 animate-ping pointer-events-none" />
                  <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </div>
                <div>
                  <h1 className={`text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-zinc-900"}`}>
                    PullUp
                  </h1>
                  <p className={`text-[11px] ${isDark ? "text-purple-300/60" : "text-purple-700/70"}`}>{userLocationText}</p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button 
                  onClick={() => setBgStyle(bgStyle === "mesh" ? "emojis" : "mesh")}
                  className={`p-2 rounded-xl transition-all ${
                    isDark ? "bg-white/[0.06] text-purple-400 hover:bg-white/[0.1]" : "bg-zinc-100 text-purple-600 hover:bg-zinc-200"
                  }`}
                  title="Toggle Background Style"
                >
                  <Heart className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setTheme(isDark ? "light" : "dark")}
                  className={`p-2 rounded-xl transition-all ${
                    isDark ? "bg-white/[0.06] text-amber-400 hover:bg-white/[0.1]" : "bg-zinc-100 text-purple-600 hover:bg-zinc-200"
                  }`}
                  title="Toggle Theme"
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* GPS Detection Button */}
            <button 
              onClick={handleDetectGPS}
              disabled={isLocating}
              className={`w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                isDark ? "bg-purple-950/40 border-purple-500/30 text-purple-300 hover:bg-purple-900/40" : "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
              }`}
            >
              <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? "animate-spin" : ""}`} />
              <span>{isLocating ? "Detecting GPS..." : "Detect My Live GPS"}</span>
            </button>

            <nav className="space-y-1.5">
              <button 
                onClick={() => setCurrentTab("radar")}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  currentTab === "radar" 
                    ? (isDark ? "bg-[#1f1b2e]/90 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] border border-white/[0.04]" : "bg-purple-50 text-purple-900 border border-purple-200 shadow-sm") 
                    : (isDark ? "text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900")
                }`}
              >
                <Radio className="w-4 h-4 text-purple-500" />
                <span>Radar Feed</span>
              </button>

              <button 
                onClick={() => setCurrentTab("active")}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  currentTab === "active" 
                    ? (isDark ? "bg-[#1f1b2e]/90 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] border border-white/[0.04]" : "bg-purple-50 text-purple-900 border border-purple-200 shadow-sm") 
                    : (isDark ? "text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900")
                }`}
              >
                <MapPin className="w-4 h-4 text-purple-500" />
                <span>Active PullUps</span>
              </button>

              <button 
                onClick={() => setCurrentTab("profile")}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  currentTab === "profile" 
                    ? (isDark ? "bg-[#1f1b2e]/90 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] border border-white/[0.04]" : "bg-purple-50 text-purple-900 border border-purple-200 shadow-sm") 
                    : (isDark ? "text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900")
                }`}
              >
                <User className="w-4 h-4 text-purple-500" />
                <span>My Profile</span>
              </button>
            </nav>
          </div>

          <div className="space-y-4">
            <Drawer open={isOpen} onOpenChange={setIsOpen}>
              <DrawerTrigger>
                <div className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium py-3 rounded-xl transition-all shadow-[0_4px_20px_rgba(147,51,234,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] active:scale-[0.98] flex items-center justify-center space-x-2 cursor-pointer">
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                  <span>Drop a Pin</span>
                </div>
              </DrawerTrigger>

              <DrawerContent className={`${isDark ? "bg-[#15131d]/95 backdrop-blur-xl border-white/10 text-white" : "bg-white/95 backdrop-blur-xl border-zinc-200 text-zinc-900"} rounded-t-2xl shadow-2xl max-h-[85vh] overflow-y-auto`}>
                <div className={`mx-auto w-10 h-1 rounded-full ${isDark ? "bg-white/20" : "bg-zinc-300"} mt-3 mb-1`} />
                <DrawerHeader className="text-left px-6 pt-2 max-w-md mx-auto w-full">
                  <DrawerTitle className={`text-xl font-semibold ${isDark ? "text-white" : "text-zinc-900"}`}>Drop a Pin</DrawerTitle>
                  <p className={`text-xs ${isDark ? "text-zinc-400" : "text-zinc-500"} mt-0.5`}>Rally a crew in Nairobi for the next 2 hours.</p>
                </DrawerHeader>
                
                <form onSubmit={handleBroadcast} className="px-6 py-4 space-y-4 max-w-md mx-auto w-full pb-8">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className={`text-xs font-medium ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>Vibe Category</label>
                      <select 
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className={`w-full ${isDark ? "bg-[#100e17] border-white/10 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"} border rounded-xl p-3 text-sm outline-none focus:border-purple-500`}
                      >
                        <option value="Table & Pour">🥃 Table & Pour</option>
                        <option value="Cars & Bikes">🏎️ Cars & Bikes</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className={`text-xs font-medium ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>Location / Landmark</label>
                      <input 
                        type="text" 
                        value={venue}
                        onChange={(e) => setVenue(e.target.value)}
                        placeholder="e.g. Kencom, Westlands"
                        className={`w-full ${isDark ? "bg-[#100e17] border-white/10 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"} border rounded-xl p-3 text-sm outline-none focus:border-purple-500`}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className={`text-xs font-medium ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>What&apos;s happening?</label>
                      <input 
                        type="text" 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Short description..."
                        className={`w-full ${isDark ? "bg-[#100e17] border-white/10 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"} border rounded-xl p-3 text-sm outline-none focus:border-purple-500`}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full mt-2 bg-purple-600 hover:bg-purple-500 text-white font-medium py-3 rounded-xl transition-all shadow-[0_4px_15px_rgba(147,51,234,0.3)]"
                  >
                    Broadcast to Database
                  </button>
                </form>
              </DrawerContent>
            </Drawer>

            <div className={`flex items-center space-x-3 p-3 rounded-xl border transition-colors backdrop-blur-md ${
              isDark ? "bg-[#15131d]/60 border-white/[0.06] shadow-[0_4px_12px_rgba(0,0,0,0.4)]" : "bg-zinc-50/80 border-zinc-200 shadow-sm"
            }`}>
              <Avatar className="w-9 h-9 ring-1 ring-purple-500/30">
                <AvatarImage src="https://i.pravatar.cc/150?u=current" />
                <AvatarFallback>BO</AvatarFallback>
              </Avatar>
              <div className="overflow-hidden">
                <p className={`text-xs font-medium truncate ${isDark ? "text-white" : "text-zinc-900"}`}>Brain Onyango</p>
                <p className="text-[11px] text-purple-600 dark:text-purple-400 flex items-center">
                  <ShieldCheck className="w-3 h-3 mr-1" /> Verified Host
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* ================= CENTER COLUMN ================= */}
        <main className={`flex flex-col min-h-screen border-r pb-24 md:pb-12 transition-colors duration-200 ${
          isDark ? "border-white/[0.06] bg-transparent" : "border-zinc-200 bg-transparent"
        }`}>
          
          <header className={`sticky top-0 backdrop-blur-xl z-20 px-4 md:px-6 pt-4 pb-3 border-b transition-colors duration-200 ${
            isDark ? "bg-[#0b0a10]/75 border-white/[0.06]" : "bg-white/75 border-zinc-200"
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 md:hidden">
                <div className="relative w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.4)]">
                  <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </div>
                <h1 className={`text-lg font-bold tracking-tight ${isDark ? "text-white" : "text-zinc-900"}`}>
                  PullUp
                </h1>
              </div>

              <div className="hidden md:block">
                <h1 className={`text-lg md:text-xl font-semibold tracking-tight ${isDark ? "text-white" : "text-zinc-900"}`}>
                  {currentTab === "radar" && "Live Radar (Supabase Synced)"}
                  {currentTab === "active" && "Your PullUps"}
                  {currentTab === "profile" && "User Profile"}
                </h1>
              </div>

              <div className="flex items-center space-x-2">
                {currentTab === "radar" && (
                  <div className={`flex p-1 rounded-xl border ${isDark ? "bg-[#161420] border-white/10" : "bg-zinc-100 border-zinc-200"}`}>
                    <button 
                      onClick={() => setRadarView("feed")}
                      className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        radarView === "feed" ? "bg-purple-600 text-white shadow-sm" : (isDark ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-zinc-900")
                      }`}
                    >
                      <List className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Feed</span>
                    </button>
                    <button 
                      onClick={() => setRadarView("map")}
                      className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        radarView === "map" ? "bg-purple-600 text-white shadow-sm" : (isDark ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-zinc-900")
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Live Map</span>
                    </button>
                  </div>
                )}

                <div className="md:hidden flex items-center space-x-1.5">
                  <button 
                    onClick={handleDetectGPS}
                    className={`p-2 rounded-xl transition-all ${
                      isDark ? "bg-white/[0.06] text-purple-400" : "bg-zinc-100 text-purple-600"
                    }`}
                    title="Detect GPS"
                  >
                    <LocateFixed className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setBgStyle(bgStyle === "mesh" ? "emojis" : "mesh")}
                    className={`p-2 rounded-xl transition-all ${
                      isDark ? "bg-white/[0.06] text-purple-400" : "bg-zinc-100 text-purple-600"
                    }`}
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setTheme(isDark ? "light" : "dark")}
                    className={`p-2 rounded-xl transition-all ${
                      isDark ? "bg-white/[0.06] text-amber-400" : "bg-zinc-100 text-purple-600"
                    }`}
                  >
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
                  <Avatar className="w-8 h-8 cursor-pointer ring-1 ring-purple-500/30" onClick={() => setCurrentTab("profile")}>
                    <AvatarImage src="https://i.pravatar.cc/150?u=current" />
                    <AvatarFallback className="bg-purple-950 text-xs text-white">BO</AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </div>

            {currentTab === "radar" && radarView === "feed" && (
              <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
                <button 
                  onClick={() => setSelectedVibe("all")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    selectedVibe === "all" 
                      ? (isDark ? "bg-white text-zinc-950 shadow-[0_2px_10px_rgba(255,255,255,0.2)] font-semibold" : "bg-zinc-900 text-white font-semibold shadow-sm") 
                      : (isDark ? "bg-[#161420]/80 text-zinc-400 hover:bg-[#201d2d] hover:text-white border border-white/[0.04]" : "bg-zinc-100/80 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 border border-zinc-200")
                  }`}
                >
                  All Vibes
                </button>
                <button 
                  onClick={() => setSelectedVibe("Table & Pour")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    selectedVibe === "Table & Pour" 
                      ? (isDark ? "bg-white text-zinc-950 shadow-[0_2px_10px_rgba(255,255,255,0.2)] font-semibold" : "bg-zinc-900 text-white font-semibold shadow-sm") 
                      : (isDark ? "bg-[#161420]/80 text-zinc-400 hover:bg-[#201d2d] hover:text-white border border-white/[0.04]" : "bg-zinc-100/80 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 border border-zinc-200")
                  }`}
                >
                  🥃 Table & Pour
                </button>
                <button 
                  onClick={() => setSelectedVibe("Cars & Bikes")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    selectedVibe === "Cars & Bikes" 
                      ? (isDark ? "bg-white text-zinc-950 shadow-[0_2px_10px_rgba(255,255,255,0.2)] font-semibold" : "bg-zinc-900 text-white font-semibold shadow-sm") 
                      : (isDark ? "bg-[#161420]/80 text-zinc-400 hover:bg-[#201d2d] hover:text-white border border-white/[0.04]" : "bg-zinc-100/80 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 border border-zinc-200")
                  }`}
                >
                  🏎️ Cars & Bikes
                </button>
              </div>
            )}
          </header>

          <div className="p-4 md:p-6 space-y-4 max-w-xl mx-auto w-full">
            
            {currentTab === "radar" && radarView === "feed" && (
              filteredDrops.length === 0 ? (
                <div className="text-center py-20 text-zinc-500 space-y-2">
                  <Compass className="w-8 h-8 mx-auto opacity-40" />
                  <p className="text-xs">No active drops in database right now.</p>
                </div>
              ) : (
                filteredDrops.map((drop) => (
                  <Card key={drop.id} className={`border rounded-2xl overflow-hidden backdrop-blur-md transition-colors duration-200 ${
                    isDark 
                      ? "bg-[#15131d]/85 border-white/[0.07] border-t-white/[0.14] shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] text-white" 
                      : "bg-white/85 border-zinc-200/80 border-t-white shadow-[0_6px_20px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,1)] text-zinc-900"
                  }`}>
                    <CardContent className="p-4 md:p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-3">
                          <Avatar className={`w-10 h-10 ring-1 ${isDark ? "ring-white/10" : "ring-zinc-200"}`}>
                            <AvatarImage src={drop.avatar} className="object-cover" />
                            <AvatarFallback>{drop.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center space-x-1">
                              <h3 className={`font-medium text-sm ${isDark ? "text-white" : "text-zinc-900"}`}>{drop.name}</h3>
                              <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                            </div>
                            <p className={`text-[11px] ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>{drop.reliability}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleWhatsAppShare(drop)}
                            className={`p-1.5 rounded-full transition-all flex items-center justify-center ${
                              isDark ? "bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900/60" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                            }`}
                            title="Share via WhatsApp"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                            </svg>
                          </button>
                          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                            isDark ? "text-purple-300 bg-purple-950/60 border border-purple-500/20" : "text-purple-700 bg-purple-50 border border-purple-200"
                          }`}>
                            {drop.timeLeft}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                            isDark ? "bg-[#1f1b2e] text-zinc-200 border border-white/[0.04]" : "bg-zinc-100 text-zinc-700 border border-zinc-200"
                          }`}>
                            {drop.category === "Table & Pour" ? "🥃" : "🏎️"} {drop.category}
                          </span>
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                            isDark ? "bg-[#1f1b2e] text-zinc-400 border border-white/[0.04]" : "bg-zinc-100 text-zinc-500 border border-zinc-200"
                          }`}>{drop.badgeText}</span>
                        </div>
                        <p className={`text-xs md:text-sm leading-relaxed font-light ${isDark ? "text-zinc-200" : "text-zinc-700"}`}>
                          {drop.description}
                        </p>
                      </div>

                      <div className={`flex items-center justify-between mb-4 text-xs border-t pt-3 ${
                        isDark ? "text-zinc-400 border-white/[0.06]" : "text-zinc-500 border-zinc-100"
                      }`}>
                        <div className="flex items-center space-x-1.5">
                          <Navigation className="w-3.5 h-3.5 text-purple-500" />
                          <span>{drop.eta}</span>
                        </div>
                        <span className={`font-medium ${isDark ? "text-white" : "text-zinc-900"}`}>{drop.slots}</span>
                      </div>

                      <button 
                        onClick={() => handlePullUp(drop.id, drop.joined)}
                        className={`w-full font-medium text-xs md:text-sm py-3 rounded-xl transition-all active:scale-[0.98] ${
                          drop.joined 
                            ? (isDark ? "bg-emerald-950/40 text-emerald-300 border border-emerald-500/30" : "bg-emerald-50 text-emerald-700 border border-emerald-200") 
                            : "bg-purple-600 hover:bg-purple-500 text-white shadow-[0_4px_15px_rgba(147,51,234,0.3)]"
                        }`}
                      >
                        {drop.joined ? "✓ Pulling Up (ETA Locked)" : "Pull Up"}
                      </button>
                    </CardContent>
                  </Card>
                ))
              )
            )}

            {currentTab === "radar" && radarView === "map" && (
              <div className="space-y-4">
                <div className={`relative w-full h-[420px] rounded-2xl border overflow-hidden backdrop-blur-xl transition-colors duration-200 ${
                  isDark ? "bg-[#121019]/90 border-white/10" : "bg-zinc-200/90 border-zinc-300"
                }`}>
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:24px_24px]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-72 h-72 rounded-full border border-purple-500/20 animate-ping absolute pointer-events-none" />
                    <div className="w-48 h-48 rounded-full border border-purple-500/30 absolute pointer-events-none" />
                    <span className={`text-[10px] uppercase tracking-widest ${isDark ? "text-purple-400/60" : "text-purple-700/60"} font-mono absolute top-4`}>
                      Nairobi Radar Grid — Live Database
                    </span>
                  </div>

                  {filteredDrops.map((drop) => (
                    <div 
                      key={drop.id}
                      onClick={() => setActivePin(drop)}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10"
                      style={{ left: `${drop.coordinates.x}%`, top: `${drop.coordinates.y}%` }}
                    >
                      <div className="relative flex items-center justify-center">
                        <span className="absolute w-8 h-8 rounded-full bg-purple-500/30 animate-pulse" />
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg border-2 transition-transform group-hover:scale-110 ${
                          activePin?.id === drop.id ? "border-white bg-purple-600 text-white" : "border-purple-400 bg-[#15131d] text-purple-300"
                        }`}>
                          {drop.category === "Table & Pour" ? "🥃" : "🏎️"}
                        </div>
                      </div>
                      <div className={`absolute top-10 left-1/2 transform -translate-x-1/2 px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap shadow ${
                        isDark ? "bg-black/80 text-white border border-white/10" : "bg-white text-zinc-900 border border-zinc-200"
                      }`}>
                        {drop.locationName}
                      </div>
                    </div>
                  ))}

                  <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-0">
                    <div className="w-4 h-4 rounded-full bg-blue-500 ring-4 ring-blue-500/30 animate-pulse" />
                  </div>
                </div>

                {activePin ? (
                  <Card className={`border rounded-2xl overflow-hidden backdrop-blur-md ${
                    isDark ? "bg-[#15131d] border-white/10 text-white" : "bg-white border-zinc-200 text-zinc-900 shadow-md"
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={activePin.avatar} />
                            <AvatarFallback>{activePin.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold text-xs">{activePin.name}</h4>
                            <p className="text-[10px] text-purple-400">{activePin.locationName}</p>
                          </div>
                        </div>
                        <button onClick={() => setActivePin(null)} className="text-xs text-zinc-400 hover:text-white">✕</button>
                      </div>
                      <p className="text-xs mb-3">{activePin.description}</p>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handlePullUp(activePin.id, activePin.joined)}
                          className="flex-1 py-2 rounded-xl bg-purple-600 text-white text-xs font-medium shadow"
                        >
                          {activePin.joined ? "✓ Pulling Up (ETA Locked)" : "Pull Up Now"}
                        </button>
                        <button 
                          onClick={() => handleWhatsAppShare(activePin)}
                          className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                          </svg>
                          <span>Share</span>
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <p className="text-center text-xs text-zinc-500">Tap any active radar pin on the map to inspect drop details.</p>
                )}
              </div>
            )}

            {currentTab === "active" && (
              <div className="space-y-3">
                {myActiveDrops.length === 0 ? (
                  <div className="text-center py-20 text-zinc-500 space-y-2">
                    <MapPin className="w-8 h-8 mx-auto opacity-40" />
                    <p className="text-xs">You haven&apos;t joined any drops yet.</p>
                    <button 
                      onClick={() => { setCurrentTab("radar"); setRadarView("feed"); }} 
                      className="text-xs text-purple-500 underline font-medium"
                    >
                      Browse active radar
                    </button>
                  </div>
                ) : (
                  myActiveDrops.map((drop) => (
                    <Card key={drop.id} className={`border rounded-2xl overflow-hidden backdrop-blur-md ${
                      isDark ? "bg-[#15131d]/85 border-white/[0.07] text-white" : "bg-white/85 border-zinc-200 text-zinc-900 shadow-sm"
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                            {drop.isHost ? "Hosting Drop" : "Confirmed ETA"}
                          </span>
                          <span className={`text-xs ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>{drop.timeLeft}</span>
                        </div>
                        <p className={`text-xs md:text-sm font-medium mb-2 ${isDark ? "text-white" : "text-zinc-900"}`}>{drop.description}</p>
                        <div className="flex justify-between items-center mt-3">
                          <p className={`text-xs flex items-center ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                            <Navigation className="w-3 h-3 mr-1 text-purple-500" /> {drop.eta}
                          </p>
                          <button 
                            onClick={() => handleWhatsAppShare(drop)}
                            className="text-[11px] px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1.5 shadow"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                            </svg>
                            <span>WhatsApp</span>
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {currentTab === "profile" && (
              <div className="space-y-4 pt-1">
                <div className={`flex flex-col items-center text-center space-y-2 border p-6 rounded-2xl backdrop-blur-md ${
                  isDark ? "bg-[#15131d]/85 border-white/[0.07] text-white" : "bg-white/85 border-zinc-200 text-zinc-900 shadow-sm"
                }`}>
                  <Avatar className="w-16 h-16 ring-2 ring-purple-500/40 shadow-md">
                    <AvatarImage src="https://i.pravatar.cc/150?u=current" className="object-cover" />
                    <AvatarFallback className="bg-purple-900 text-white">BO</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className={`text-base font-semibold ${isDark ? "text-white" : "text-zinc-900"}`}>Brain Onyango</h2>
                    <p className={`text-xs ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>Nairobi, Kenya</p>
                  </div>

                  <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                    <span>100% Reliability Score</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className={`border p-4 rounded-2xl text-center backdrop-blur-md ${
                    isDark ? "bg-[#15131d]/85 border-white/[0.07] text-white" : "bg-white/85 border-zinc-200 text-zinc-900 shadow-sm"
                  }`}>
                    <p className={`text-xl font-bold ${isDark ? "text-white" : "text-zinc-900"}`}>{drops.filter(d => d.isHost).length}</p>
                    <p className={`text-xs ${isDark ? "text-zinc-400" : "text-zinc-500"} mt-0.5`}>Drops Hosted</p>
                  </div>
                  <div className={`border p-4 rounded-2xl text-center backdrop-blur-md ${
                    isDark ? "bg-[#15131d]/85 border-white/[0.07] text-white" : "bg-white/85 border-zinc-200 text-zinc-900 shadow-sm"
                  }`}>
                    <p className={`text-xl font-bold ${isDark ? "text-white" : "text-zinc-900"}`}>{drops.filter(d => d.joined).length}</p>
                    <p className={`text-xs ${isDark ? "text-zinc-400" : "text-zinc-500"} mt-0.5`}>PullUps Joined</p>
                  </div>
                </div>

                <div className={`border p-4 rounded-2xl space-y-2 backdrop-blur-md ${
                  isDark ? "bg-[#15131d]/85 border-white/[0.07] text-white" : "bg-white/85 border-zinc-200 text-zinc-900 shadow-sm"
                }`}>
                  <h3 className={`text-xs font-semibold flex items-center ${isDark ? "text-white" : "text-zinc-900"}`}>
                    <Sparkles className="w-3.5 h-3.5 mr-1.5 text-purple-500" /> Vibe Pass Status
                  </h3>
                  <p className={`text-xs ${isDark ? "text-zinc-400" : "text-zinc-600"} leading-relaxed`}>
                    Account verified for instant drop broadcasting across Nairobi zones (Westlands, Kilimani, CBD).
                  </p>
                </div>
              </div>
            )}

          </div>
        </main>

        {/* ================= RIGHT SIDEBAR ================= */}
        <aside className={`hidden lg:flex flex-col p-5 space-y-5 sticky top-0 h-screen backdrop-blur-xl border-l overflow-y-auto transition-colors duration-200 ${
          isDark ? "bg-[#0f0e17]/80 border-white/[0.06]" : "bg-white/80 border-zinc-200"
        }`}>
          
          <div className={`border p-4 rounded-2xl space-y-3 backdrop-blur-md ${
            isDark ? "bg-[#15131d]/85 border-white/[0.07] text-white shadow-[0_8px_24px_rgba(0,0,0,0.5)]" : "bg-zinc-50/85 border-zinc-200 text-zinc-900 shadow-sm"
          }`}>
            <h3 className={`text-xs font-semibold flex items-center ${isDark ? "text-white" : "text-zinc-900"}`}>
              <Flame className="w-3.5 h-3.5 mr-1.5 text-purple-500" /> Active Hotspots
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className={`flex justify-between items-center pb-2 border-b ${isDark ? "border-white/[0.06] text-zinc-200" : "border-zinc-200 text-zinc-700"}`}>
                <span>Westlands</span>
                <span className="text-purple-600 dark:text-purple-300 font-medium px-2 py-0.5 rounded bg-purple-500/10">3 Drops</span>
              </div>
              <div className={`flex justify-between items-center pb-2 border-b ${isDark ? "border-white/[0.06] text-zinc-200" : "border-zinc-200 text-zinc-700"}`}>
                <span>CBD / Kencom</span>
                <span className="text-purple-600 dark:text-purple-300 font-medium px-2 py-0.5 rounded bg-purple-500/10">2 Meets</span>
              </div>
              <div className={`flex justify-between items-center ${isDark ? "text-zinc-200" : "text-zinc-700"}`}>
                <span>Kilimani</span>
                <span className="text-purple-600 dark:text-purple-300 font-medium px-2 py-0.5 rounded bg-purple-500/10">1 Drop</span>
              </div>
            </div>
          </div>

          <div className={`border p-4 rounded-2xl space-y-2 backdrop-blur-md ${
            isDark ? "bg-[#15131d]/85 border-white/[0.07] text-white shadow-[0_8px_24px_rgba(0,0,0,0.5)]" : "bg-zinc-50/85 border-zinc-200 text-zinc-900 shadow-sm"
          }`}>
            <h3 className={`text-xs font-semibold flex items-center ${isDark ? "text-white" : "text-zinc-900"}`}>
              <TrendingUp className="w-3.5 h-3.5 mr-1.5 text-purple-500" /> Network Pulse
            </h3>
            <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
              Spontaneous velocity in Nairobi is high. Average response time for a pull-up is <span className={`font-medium ${isDark ? "text-white" : "text-zinc-900"}`}>14 minutes</span>.
            </p>
          </div>

        </aside>

      </div>

      {/* ================= MOBILE BOTTOM NAVIGATION ================= */}
      <div className="fixed bottom-3 left-0 right-0 px-4 z-50 md:hidden">
        <nav className={`max-w-md mx-auto h-14 backdrop-blur-xl border rounded-full flex justify-between items-center px-5 shadow-lg transition-colors duration-200 ${
          isDark ? "bg-[#15131d]/85 border-white/[0.08]" : "bg-white/85 border-zinc-200"
        }`}>
          
          <button 
            onClick={() => { setCurrentTab("radar"); setRadarView("feed"); }}
            className={`flex flex-col items-center justify-center w-10 h-10 transition-colors ${currentTab === "radar" ? "text-purple-500" : "text-zinc-400"}`}
          >
            <Radio className="w-4 h-4" strokeWidth={currentTab === "radar" ? 2.5 : 2} />
          </button>
          
          <button 
            onClick={() => setCurrentTab("active")}
            className={`flex flex-col items-center justify-center w-10 h-10 transition-colors ${currentTab === "active" ? "text-purple-500" : "text-zinc-400"}`}
          >
            <MapPin className="w-4 h-4" strokeWidth={currentTab === "active" ? 2.5 : 2} />
          </button>
          
          <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger>
              <div className="flex flex-col items-center justify-center -mt-6 outline-none cursor-pointer">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-600 hover:bg-purple-500 text-white rounded-full shadow-lg transition-transform active:scale-95">
                  <Plus className="w-5 h-5" strokeWidth={2.5} />
                </div>
              </div>
            </DrawerTrigger>
            
            <DrawerContent className={`${isDark ? "bg-[#15131d]/95 backdrop-blur-xl border-white/10 text-white" : "bg-white/95 backdrop-blur-xl border-zinc-200 text-zinc-900"} rounded-t-2xl shadow-2xl max-h-[85vh] overflow-y-auto`}>
              <div className={`mx-auto w-10 h-1 rounded-full ${isDark ? "bg-white/20" : "bg-zinc-300"} mt-3 mb-1`} />
              <DrawerHeader className="text-left px-6 pt-2">
                <DrawerTitle className={`text-xl font-semibold ${isDark ? "text-white" : "text-zinc-900"}`}>Drop a Pin</DrawerTitle>
                <p className={`text-xs ${isDark ? "text-zinc-400" : "text-zinc-500"} mt-0.5`}>Rally a crew in Nairobi for the next 2 hours.</p>
              </DrawerHeader>
              
              <form onSubmit={handleBroadcast} className="px-6 py-4 space-y-4 pb-8">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className={`text-xs font-medium ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>Vibe Category</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className={`w-full ${isDark ? "bg-[#100e17] border-white/10 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"} border rounded-xl p-3 text-sm outline-none focus:border-purple-500`}
                    >
                      <option value="Table & Pour">🥃 Table & Pour</option>
                      <option value="Cars & Bikes">🏎️ Cars & Bikes</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className={`text-xs font-medium ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>Location / Landmark</label>
                    <input 
                      type="text" 
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      placeholder="e.g. Kencom, Westlands"
                      className={`w-full ${isDark ? "bg-[#100e17] border-white/10 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"} border rounded-xl p-3 text-sm outline-none focus:border-purple-500`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className={`text-xs font-medium ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>What&apos;s happening?</label>
                    <input 
                      type="text" 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Short description..."
                      className={`w-full ${isDark ? "bg-[#100e17] border-white/10 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"} border rounded-xl p-3 text-sm outline-none focus:border-purple-500`}
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full mt-2 bg-purple-600 hover:bg-purple-500 text-white font-medium py-3 rounded-xl transition-all shadow-[0_4px_15px_rgba(147,51,234,0.3)]"
                >
                  Broadcast to Database
                </button>
              </form>
            </DrawerContent>
          </Drawer>
          
          <button 
            onClick={() => setCurrentTab("active")}
            className={`flex flex-col items-center justify-center w-10 h-10 transition-colors ${currentTab === "active" ? "text-purple-500" : "text-zinc-400"}`}
          >
            <ShieldCheck className="w-4 h-4" strokeWidth={currentTab === "active" ? 2.5 : 2} />
          </button>

          <button 
            onClick={() => setCurrentTab("profile")}
            className={`flex flex-col items-center justify-center w-10 h-10 transition-colors ${currentTab === "profile" ? "text-purple-500" : "text-zinc-400"}`}
          >
            <User className="w-4 h-4" strokeWidth={currentTab === "profile" ? 2.5 : 2} />
          </button>
        </nav>
      </div>

    </div>
  );
}