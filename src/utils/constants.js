/**
 * Application Constants
 */

export const APP_INFO = {
  name: "Beacon Wings Foundation",
  shortName: "BWF",
  tagline: "Empowering Lives.",
  email: "beaconwings2026@gmail.com",
  phone: "+91 7275982849",
  address: "E-49/5 First Floor Okhla Industrial Area Phase Il New Delhi Near - Delhi 110020",
};

export const ROUTES = {
  HOME: "/",
  ABOUT: "/about",
  WHAT_WE_DO: "/what-we-do",
  PROGRAMS: "/programs",
  GALLERY: "/gallery",
  DONATE: "/donate",
  VOLUNTEER: "/volunteer",
  CONTACT: "/contact",
  CHECKIN: "/checkin",
  CERTIFICATE: "/certificate",
  LEGAL: "/legal",
  LOGIN: "/login",
  SIGNUP: "/signup",
  ADMIN: "/admin",
};

export const NAV_LINKS = [
  { name: "Home", path: ROUTES.HOME },
  { name: "About", path: ROUTES.ABOUT },
  { name: "What We Do", path: ROUTES.WHAT_WE_DO },
  { name: "Programs", path: ROUTES.PROGRAMS },
  { name: "Gallery", path: ROUTES.GALLERY },
  { name: "Donate", path: ROUTES.DONATE },
  { name: "Volunteer", path: ROUTES.VOLUNTEER },
  { name: "Contact", path: ROUTES.CONTACT },
  { name: "CheckIn", path: ROUTES.CHECKIN },
];

export const FOCUS_AREAS = [
  {
    id: "child-care",
    title: "Child Care",
    subtitle: "Education & Upliftment",
    description: "Scholarships, learning support, and holistic upliftment programs for underprivileged children.",
  },
  {
    id: "women-empowerment",
    title: "Women Empowerment",
    description: "Vocational training, self-help groups, and skill-building that help women achieve independence.",
  },
  {
    id: "old-age-care",
    title: "Old Age People Care",
    description: "Companionship, health support, and dignified care programs for the elderly in our communities.",
  },
  {
    id: "animal-welfare",
    title: "Animal Welfare",
    description: "Rescue, care, and welfare initiatives for stray and domestic animals in our neighborhoods.",
  },
];

export const USER_ROLES = {
  VOLUNTEER: "Volunteer",
  DONOR: "Donor",
  MEMBER: "Member",
  COORDINATOR: "Coordinator",
};

export const ADMIN_ROLES = [USER_ROLES.COORDINATOR, USER_ROLES.MEMBER];

export const DONATION_AMOUNTS = [500, 1000, 2500, 5000];

export const PROGRAMS = [
  "Rural Education Support",
  "Mobile Health Clinics",
  "Organic Farming Workshops",
  "Legal Rights Helpdesk",
  "Women Skill Development",
  "Youth Leadership Camps",
  "Nutrition Awareness Program",
  "Community Digital Literacy",
];
 