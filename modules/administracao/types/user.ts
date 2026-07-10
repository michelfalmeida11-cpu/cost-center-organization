export type UserStatusType =
  | "ATIVO"
  | "INATIVO"
  | "BLOQUEADO"
  | "FERIAS"
  | "AFASTADO";

export type UserListItem = {
  id: string;
  firstName: string;
  lastName: string;
  cpf: string;
  email: string;
  phone: string | null;
  roleTitle: string | null;
  department: string | null;
  costCenter: string | null;
  project: string | null;
  registration: string | null;
  photoUrl: string | null;
  status: UserStatusType;
  lastLoginAt: Date | null;
  createdAt: Date;
  notes: string | null;
  profile: {
    id: string;
    name: string;
  } | null;
};

export type AdminDashboardMetrics = {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  onlineUsers: number;
  backups: number;
  logs: number;
  audits: number;
};

export type UserAuditContext = {
  userId?: string;
  ipAddress?: string;
  device?: string;
};
