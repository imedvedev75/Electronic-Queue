import { Injectable } from '@angular/core';
import { SERVER_URL } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Constants{

  public static KEY_USERNAMEOREMAIL = "usernameOrEmail";
  public static KEY_USERNAME = "usernameOrEmail";
  public static KEY_EMAIL = "usernameOrEmail";
  public static KEY_PASSWORD = "password";

  public static url = SERVER_URL;

  constructor() { 
  
  }
}
