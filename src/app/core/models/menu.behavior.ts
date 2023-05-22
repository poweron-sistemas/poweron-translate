export interface POTMenuBehavior {
  type: 'disabled' | 'loading' | 'command' | 'trigger';
  value?: any;
  id: string | string[];
}
