import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebhookService {
  constructor(private http: HttpClient) {}

  public send(url: string, files: File[]): Observable<any> {
    const formData: FormData = new FormData();
    for (const file of files) {
      formData.append(file.name, file, file.name);
    }
    return this.http.post(url, formData);
  }
}
