import { useSyncExternalStore } from "react";

export type RegistrationData = {
  nome: string;
  cpf: string;
  nascimento: string;
  email: string;
  telefone: string;
  senha: string;
};

let state: RegistrationData = {
  nome: "",
  cpf: "",
  nascimento: "",
  email: "",
  telefone: "",
  senha: "",
};

const listeners = new Set<() => void>();

export const registrationStore = {
  get: () => state,
  set: (patch: Partial<RegistrationData>) => {
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
  },
  reset: () => {
    state = { nome: "", cpf: "", nascimento: "", email: "", telefone: "", senha: "" };
    listeners.forEach((l) => l());
  },
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useRegistration() {
  return useSyncExternalStore(
    registrationStore.subscribe,
    registrationStore.get,
    registrationStore.get,
  );
}
