import { StateCreator } from 'zustand';
import { AppState, AppActions } from './index';
import { BuilderDefinition, BuilderId } from '../types';

export interface BuilderSlice {
  builders: Record<BuilderId, BuilderDefinition>;
  addBuilder: (builder: BuilderDefinition) => void;
  updateBuilder: (id: BuilderId, updates: Partial<BuilderDefinition>) => void;
  removeBuilder: (id: BuilderId) => void;
  updateBuilderStatus: (id: BuilderId, status: BuilderDefinition['status']) => void;
}

export const createBuilderSlice: StateCreator<
  AppState & AppActions,
  [['zustand/immer', never]],
  [],
  BuilderSlice
> = (set) => ({
  builders: {},
  addBuilder: (builder) => set((state) => {
    state.builders[builder.id] = builder;
  }),
  updateBuilder: (id, updates) => set((state) => {
    if (state.builders[id]) {
      Object.assign(state.builders[id], updates);
    }
  }),
  removeBuilder: (id) => set((state) => {
    delete state.builders[id];
  }),
  updateBuilderStatus: (id, status) => set((state) => {
    if (state.builders[id]) {
      state.builders[id].status = status;
    }
  }),
});