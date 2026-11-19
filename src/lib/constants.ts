export const KENYAN_COUNTIES = [
  "Nairobi",
  "Kiambu",
  "Mombasa",
  "Nakuru",
  "Kisumu",
  "Uasin Gishu",
  "Machakos",
  "Kajiado",
  "Nyeri",
  "Meru",
  "Kakamega",
  "Kilifi",
  "Murang'a",
  "Kirinyaga",
  "Embu",
  "Laikipia",
  "Trans Nzoia",
  "Bungoma",
  "Kitui",
  "Garissa",
] as const;

export type ServiceCategorySeed = {
  name: string;
  slug: string;
  icon: string;
  specializations: string[];
};

export const SERVICE_CATEGORIES: ServiceCategorySeed[] = [
  {
    name: "Plumbing",
    slug: "plumbing",
    icon: "Wrench",
    specializations: ["Pipe Installation", "Leak Repair", "Drainage", "Water Heater Fitting"],
  },
  {
    name: "Electrical",
    slug: "electrical",
    icon: "Zap",
    specializations: ["Wiring", "Solar Installation", "Appliance Hookup", "Fault Diagnosis"],
  },
  {
    name: "Carpentry",
    slug: "carpentry",
    icon: "Hammer",
    specializations: ["Furniture Making", "Door & Window Fitting", "Roofing", "Cabinetry"],
  },
  {
    name: "Mechanics",
    slug: "mechanics",
    icon: "Car",
    specializations: ["Engine Repair", "Diagnostics", "Brake Service", "Mobile Mechanic"],
  },
  {
    name: "Masonry",
    slug: "masonry",
    icon: "ToyBrick",
    specializations: ["Wall Building", "Tiling", "Plastering", "Concrete Work"],
  },
  {
    name: "Painting",
    slug: "painting",
    icon: "PaintRoller",
    specializations: ["Interior Painting", "Exterior Painting", "Spray Painting", "Wallpapering"],
  },
  {
    name: "Cleaning",
    slug: "cleaning",
    icon: "Sparkles",
    specializations: ["House Cleaning", "Office Cleaning", "Fumigation", "Carpet Cleaning"],
  },
  {
    name: "Gardening & Landscaping",
    slug: "gardening-landscaping",
    icon: "Trees",
    specializations: ["Lawn Care", "Landscaping", "Tree Trimming", "Irrigation"],
  },
  {
    name: "Welding & Fabrication",
    slug: "welding-fabrication",
    icon: "Flame",
    specializations: ["Gate Fabrication", "Window Grills", "Steel Structures", "Metal Repair"],
  },
  {
    name: "Appliance Repair",
    slug: "appliance-repair",
    icon: "Refrigerator",
    specializations: ["Fridge Repair", "Washing Machine Repair", "Cooker Repair", "TV & Electronics"],
  },
  {
    name: "Moving & Transport",
    slug: "moving-transport",
    icon: "Truck",
    specializations: ["House Moving", "Office Relocation", "Furniture Delivery", "Courier"],
  },
  {
    name: "ICT & Computer Repair",
    slug: "ict-computer-repair",
    icon: "Monitor",
    specializations: ["Computer Repair", "Networking", "CCTV Installation", "Phone Repair"],
  },
];

// BUSINESS uses -1 to mean "unlimited, subject to fair-use controls" since the
// database column is an Int and cannot store Infinity.
export const PLAN_DETAILS = {
  FREE: { label: "Free", credits: 5, price: 0 },
  STANDARD: { label: "Standard", credits: 20, price: 1500 },
  PROFESSIONAL: { label: "Professional", credits: 30, price: 3000 },
  BUSINESS: { label: "Business", credits: -1, price: 6000 },
} as const;

// Soft ceiling applied to BUSINESS accounts so "unlimited" still has a
// fair-use backstop per billing period.
export const BUSINESS_FAIR_USE_LIMIT = 500;

export const BILLING_PERIOD_DAYS = 30;
