import type { backendInterface, UserRole } from "../backend";

export const mockBackend: backendInterface = {
  changePin: async (_phone: string, _currentHashedPin: string, _newHashedPin: string) => ({
    __kind__: "ok" as const,
    ok: null,
  }),
  getUserProfile: async (_phone: string) => ({
    financierName: "Rajan Finance",
    role: "admin" as unknown as UserRole,
    businessName: "Rajan Money Lending",
    phone: "9876543210",
  }),
  login: async (_phone: string, _hashedPin: string) => ({
    __kind__: "ok" as const,
    ok: {
      financierName: "Rajan Finance",
      role: "admin" as unknown as UserRole,
      businessName: "Rajan Money Lending",
      phone: "9876543210",
    },
  }),
  phoneExists: async (_phone: string) => false,
  register: async (_phone: string, _hashedPin: string, _financierName: string, _businessName: string, _role: UserRole) => ({
    __kind__: "ok" as const,
    ok: null,
  }),
  resetPin: async (_phone: string, _newHashedPin: string) => ({
    __kind__: "ok" as const,
    ok: null,
  }),
};
