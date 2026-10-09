import { Injectable, signal } from "@angular/core";
import { UserInfo } from "./user-info";

@Injectable({ providedIn: "root" })
export class UserDataService {
  // Share the submitted data between routed pages for this application session.
  readonly user = signal<UserInfo | null>(null);

  save(user: UserInfo): void {
    this.user.set({ ...user });
  }
}
