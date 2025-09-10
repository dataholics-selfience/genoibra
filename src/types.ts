import { CropIcon as IconProps } from 'lucide-react';

export interface MessageType {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  challengeId?: string;
  hidden?: boolean;
  messageId?: string;
}

export interface ChallengeType {
  id: string;
  userId: string;
  userEmail: string;
  company: string;
  businessArea: string;
  title: string;
  description: string;
  sessionId: string;
  createdAt: string;
}

export interface UserType {
  uid: string;
  name: string;
  email: string;
  cpf: string;
  company: string;
  phone: string;
  plan?: string;
  createdAt: string;
}

export interface PlanType {
  id: string;
  name: string;
  description: string;
  tokens: number;
  price?: number;
}

export interface TokenUsageType {
  uid: string;
  email: string;
  plan: string;
  totalTokens: number;
  usedTokens: number;
  lastUpdated: string;
}

export interface StartupListType {
  id: string;
  userId: string;
  userEmail: string;
  challengeTitle: string;
  ratingExplanation: string;
  startups: StartupType[];
  projectPlanning: ProjectPhaseType[];
  expectedResults: string[];
  competitiveAdvantages: string[];
  createdAt: string;
}

export interface SocialLink {
  type: 'website' | 'email' | 'linkedin' | 'facebook' | 'twitter' | 'instagram';
  url: string;
  icon: (props: IconProps) => JSX.Element;
  label: string;
}

export interface StartupType {
  name: string;
  description: string;
  rating: number;
  website: string;
  category: string;
  vertical: string;
  foundedYear: string;
  teamSize: string;
  businessModel: string;
  email: string;
  ipoStatus: string;
  city: string;
  reasonForChoice: string;
  sequentialNumber?: number;
  websiteValidated?: boolean;
  state?: string;
  country?: string;
  telefone?: string;
  celular?: string;
  linkedin?: string;
  founderLinkedIn?: string;
  founder?: string;
  stage?: string;
  legalName?: string;
  employees?: string;
  technologies?: string;
  tags?: string;
  dataCompleteness?: number;
  keyStrengths?: string[];
  logoBase64?: string;
  solution?: {
    nome?: string;
    site?: string;
    sede?: string;
    fundadores?: string;
    porte?: string;
    investimentos?: string;
    recebeuAporte?: string;
    stage?: string;
    valuation?: string;
    principaisClientes?: string;
    numeroColaboradores?: string;
  };
  problemaSolve?: string;
  fundadores?: Array<{
    nome: string;
    formacao: string;
    experiencia: string;
    perfil: string;
  }>;
  parceiros?: any[];
  oportunidades?: any[];
  socialLinks?: {
    linkedin?: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
}

export interface ProjectPhaseType {
  phase: string;
  duration: string;
  description: string;
}