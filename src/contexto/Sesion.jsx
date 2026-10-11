import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { obtenerPerfil } from '../lib/api.js';

const ContextoSesion = createContext({ sesion: null, perfil: null, cargando: true });

export function ProveedorSesion({ children }) {
  const [estado, setEstado] = useState({ sesion: null, perfil: null, cargando: true });

  useEffect(() => {
    async function actualizar(sesion) {
      if (!sesion) return setEstado({ sesion: null, perfil: null, cargando: false });
      try {
        const perfil = await obtenerPerfil(sesion.user.id);
        setEstado({ sesion, perfil, cargando: false });
      } catch {
        setEstado({ sesion, perfil: null, cargando: false });
      }
    }
    supabase.auth.getSession().then(({ data }) => actualizar(data.session));
    const { data } = supabase.auth.onAuthStateChange((_evento, sesion) => {
      setTimeout(() => actualizar(sesion), 0);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return <ContextoSesion.Provider value={estado}>{children}</ContextoSesion.Provider>;
}

export function useSesion() {
  return useContext(ContextoSesion);
}
