import { createContext, useContext, useState } from "react";

const emptyMap = () => ({
  id: null,
  title: "",
  issue: "",
  position_a: "",
  position_b: "",
  concerns_a: "",
  needs_a: [],
  needs_b: [],
  solutions: [],
  reflection: { promising: "", unmet: "", improve: "", changed: "" },
});

const LabContext = createContext(null);

export function LabProvider({ children }) {
  const [map, setMap] = useState(emptyMap());
  const [step, setStep] = useState(0);

  const update = (patch) => setMap((m) => ({ ...m, ...patch }));
  const reset = () => {
    setMap(emptyMap());
    setStep(0);
  };
  const loadMap = (data) => {
    setMap({ ...emptyMap(), ...data });
    setStep(0);
  };

  return (
    <LabContext.Provider value={{ map, setMap, update, step, setStep, reset, loadMap }}>
      {children}
    </LabContext.Provider>
  );
}

export const useLab = () => useContext(LabContext);
