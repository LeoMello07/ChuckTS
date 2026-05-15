import { create } from 'zustand';
import { HttpRecord, FilterState } from '../types';

interface ChuckTSStore {
  records: HttpRecord[];
  isVisible: boolean;
  selectedId: string | null;
  filter: FilterState;

  addRecord: (record: HttpRecord) => void;
  updateRecord: (id: string, updates: Partial<HttpRecord>) => void;
  clearRecords: () => void;
  setVisible: (visible: boolean) => void;
  toggleVisible: () => void;
  selectRecord: (id: string | null) => void;
  setFilter: (filter: Partial<FilterState>) => void;
  resetFilter: () => void;
  setMaxRequests: (max: number) => void;

  _maxRequests: number;
}

const DEFAULT_FILTER: FilterState = {
  search: '',
  methods: [],
  statusCodes: [],
};

export const useChuckTSStore = create<ChuckTSStore>((set) => ({
  records: [],
  isVisible: false,
  selectedId: null,
  filter: { ...DEFAULT_FILTER },
  _maxRequests: 200,

  addRecord: (record) =>
    set((state) => {
      const next = [record, ...state.records];
      return { records: next.slice(0, state._maxRequests) };
    }),

  updateRecord: (id, updates) =>
    set((state) => ({
      records: state.records.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    })),

  clearRecords: () => set({ records: [], selectedId: null }),

  setVisible: (visible) => set({ isVisible: visible }),

  toggleVisible: () => set((state) => ({ isVisible: !state.isVisible })),

  selectRecord: (id) => set({ selectedId: id }),

  setFilter: (filter) =>
    set((state) => ({ filter: { ...state.filter, ...filter } })),

  resetFilter: () => set({ filter: { ...DEFAULT_FILTER } }),

  setMaxRequests: (max) => set({ _maxRequests: max }),
}));

export function getFilteredRecords(
  records: HttpRecord[],
  filter: FilterState
): HttpRecord[] {
  return records.filter((record) => {
    if (filter.search) {
      const lower = filter.search.toLowerCase();
      if (!record.url.toLowerCase().includes(lower)) return false;
    }

    if (filter.methods.length > 0) {
      if (!filter.methods.includes(record.method.toUpperCase())) return false;
    }

    if (filter.statusCodes.length > 0) {
      const codeGroup = record.statusCode ? String(Math.floor(record.statusCode / 100)) + 'xx' : 'xxx';
      const codeStr = record.statusCode ? String(record.statusCode) : '';
      if (!filter.statusCodes.includes(codeGroup) && !filter.statusCodes.includes(codeStr)) {
        return false;
      }
    }

    return true;
  });
}
