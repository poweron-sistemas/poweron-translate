import { Observable } from "rxjs";
import { POTTranslationProvider } from "../models/translation.provider";

export interface TranslationService {
  translate(request: any): Observable<any>;
  configure(translationProvider: POTTranslationProvider): void;
}
