import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";
import {
  AppConfig,
  DEFAULT_CONFIG,
  loadConfig,
  saveConfig,
} from "../lib/tauri";

export type ServerStatus = "stopped" | "loading" | "ready" | "reasoning" | "error";
type Tab = "load" | "chat" | "stats";

interface AppState {
  config: AppConfig;
  serverStatus: ServerStatus;
  activeTab: Tab;
  errorMsg: string | null;
}

type Action =
  | { type: "SET_CONFIG"; payload: AppConfig }
  | { type: "PATCH_CONFIG"; payload: Partial<AppConfig> }
  | { type: "SET_SERVER_STATUS"; payload: ServerStatus }
  | { type: "SET_TAB"; payload: Tab }
  | { type: "SET_ERROR"; payload: string | null };

const initialState: AppState = {
  config: DEFAULT_CONFIG,
  serverStatus: "stopped",
  activeTab: "load",
  errorMsg: null,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_CONFIG":
      return { ...state, config: action.payload };
    case "PATCH_CONFIG":
      return { ...state, config: { ...state.config, ...action.payload } };
    case "SET_SERVER_STATUS":
      return { ...state, serverStatus: action.payload };
    case "SET_TAB":
      return { ...state, activeTab: action.payload };
    case "SET_ERROR":
      return { ...state, errorMsg: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
}>({ state: initialState, dispatch: () => {} });

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoad = useRef(true);

  useEffect(() => {
    loadConfig().then((cfg) => dispatch({ type: "SET_CONFIG", payload: cfg }));
  }, []);

  useEffect(() => {
    if (initialLoad.current) {
      initialLoad.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveConfig(state.config).catch(console.error);
    }, 500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state.config]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
