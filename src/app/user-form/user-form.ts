import { Component, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { UserDataService } from "../user-data.service";
import { UserInfo } from "../user-info";

@Component({
  selector: "app-user-form",
  imports: [ReactiveFormsModule],
  templateUrl: "./user-form.html",
})
export class UserForm {
  private readonly builder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly userData = inject(UserDataService);
  private readonly previous = this.userData.user();

  readonly form = this.builder.nonNullable.group({
    firstName: [
      this.previous?.firstName ?? "",
      [Validators.required, Validators.pattern(/\S/)],
    ],
    lastName: [
      this.previous?.lastName ?? "",
      [Validators.required, Validators.pattern(/\S/)],
    ],
    // Exactly 10 digits: the first and fourth digits cannot be zero.
    phone: [
      this.previous?.phone ?? "",
      Validators.pattern(/^[1-9]\d{2}[1-9]\d{6}$/),
    ],
    email: [this.previous?.email ?? "", Validators.email],
  });

  submitted = false;

  showError(field: keyof UserInfo): boolean {
    const control = this.form.controls[field];
    return (
      control.invalid && (control.dirty || control.touched || this.submitted)
    );
  }

  async submit(): Promise<void> {
    this.submitted = true;
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const values = this.form.getRawValue();
    this.userData.save({
      ...values,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
    });
    await this.router.navigate(["/summary"]);
  }
}
