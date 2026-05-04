import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Persona = "dm" | "exec";

interface PersonaCtx {
  persona: Persona;
  setPersona: (p: Persona) => void;
}

const Ctx = createContext<PersonaCtx>({ persona: "dm", setPersona: () => {} });

const KEY = "mmna.persona";

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [persona, setPersonaState] = useState<Persona>(() => {
    if (typeof window === "undefined") return "dm";
    return (localStorage.getItem(KEY) as Persona) || "dm";
  });
  useEffect(() => {
    try { localStorage.setItem(KEY, persona); } catch {}
  }, [persona]);
  return <Ctx.Provider value={{ persona, setPersona: setPersonaState }}>{children}</Ctx.Provider>;
}

export function usePersona() {
  return useContext(Ctx);
}
