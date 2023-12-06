import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseApi } from '../Interfaces/response-api';

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  private urlApi: string = environment.endpoint + "Menu/";

  constructor(private http: HttpClient) { }

  Lista(idUsuario: number): Observable<ResponseApi>{
    return this.http.get<ResponseApi>(`${this.urlApi}Lista/${idUsuario}`)
  }
}