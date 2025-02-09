export interface Therapist {
  id: string;
  name: string;
  state: string;
  specialties: string[];
  availability: string[];
  imageUrl: string;
  bio: string;
}

export const therapists: Therapist[] = [
  {
    id: "1",
    name: "Dr. Sarah Johnson",
    state: "California",
    specialties: ["ADHD", "Executive Functioning", "Anxiety"],
    availability: ["Monday", "Wednesday", "Friday"],
    imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300&h=300",
    bio: "Specializing in ADHD treatment with 10+ years of experience"
  },
  {
    id: "2",
    name: "Dr. Michael Chen",
    state: "New York",
    specialties: ["ADHD", "Depression", "Work-Life Balance"],
    availability: ["Tuesday", "Thursday", "Saturday"],
    imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300&h=300",
    bio: "Expert in adult ADHD and workplace challenges"
  },
  {
    id: "3",
    name: "Dr. Emily Rodriguez",
    state: "Texas",
    specialties: ["ADHD", "Stress Management", "Life Transitions"],
    availability: ["Monday", "Tuesday", "Thursday"],
    imageUrl: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=300&h=300",
    bio: "Focused on holistic ADHD management approaches"
  }
];