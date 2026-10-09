import { inject } from "@angular/core";
import { Router, Routes } from "@angular/router";
import { UserDataService } from "./user-data.service";
import { UserForm } from "./user-form/user-form";
import { UserSummary } from "./user-summary/user-summary";

export const routes: Routes = [
  { path: "form", component: UserForm, title: "Vos informations | Lab 4" },
  {
    path: "summary",
    component: UserSummary,
    title: "Confirmation | Lab 4",
    canActivate: [
      () =>
        inject(UserDataService).user() !== null ||
        inject(Router).createUrlTree(["/form"]),
    ],
  },
  { path: "", redirectTo: "form", pathMatch: "full" },
  { path: "**", redirectTo: "form" },
];
