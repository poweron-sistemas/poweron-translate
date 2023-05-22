import { POTSplitterSizes } from "./splitter.sizes";
import { POTTranslationProvider } from "./translation.provider";

export interface POTSettings {
  theme: 'dark' | 'light';
  translationProviders: POTTranslationProvider[] | undefined;
  splitters: POTSplitterSizes;
  webhook: string | undefined;
}
