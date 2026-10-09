import { Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { UserDataService } from "../user-data.service";

@Component({
  selector: "app-user-summary",
  imports: [RouterLink],
  templateUrl: "./user-summary.html",
})
export class UserSummary {
  readonly user = inject(UserDataService).user;
}
