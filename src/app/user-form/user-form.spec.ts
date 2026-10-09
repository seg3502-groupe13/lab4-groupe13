import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { routes } from "../app.routes";
import { UserDataService } from "../user-data.service";
import { UserInfo } from "../user-info";
import { UserForm } from "./user-form";

describe("User form and summary routes", () => {
  let harness: RouterTestingHarness;
  let component: UserForm;
  let router: Router;
  let userData: UserDataService;

  const validUser: UserInfo = {
    firstName: "Émilie",
    lastName: "O'Connor",
    phone: "6135550123",
    email: "emilie.oconnor@example.com",
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserForm],
      providers: [provideRouter(routes)],
    }).compileComponents();

    router = TestBed.inject(Router);
    userData = TestBed.inject(UserDataService);
    harness = await RouterTestingHarness.create();
    component = await harness.navigateByUrl("/form", UserForm);
  });

  async function submitForm(): Promise<void> {
    harness
      .routeNativeElement!.querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await harness.fixture.whenStable();
    harness.detectChanges();
  }

  function tableValues(): string[] {
    return Array.from(
      harness.routeNativeElement!.querySelectorAll("tbody td"),
    ).map((cell) => cell.textContent?.trim() ?? "");
  }

  it.each(["firstName", "lastName"] as const)(
    "requires a nonempty %s",
    (field) => {
      component.form.setValue(validUser);
      component.form.controls[field].setValue("");

      expect(component.form.controls[field].hasError("required")).toBe(true);
      expect(component.form.invalid).toBe(true);
    },
  );

  it.each(["firstName", "lastName"] as const)(
    "rejects a whitespace-only %s",
    (field) => {
      component.form.setValue(validUser);
      component.form.controls[field].setValue("   ");

      expect(component.form.controls[field].invalid).toBe(true);
      expect(component.form.invalid).toBe(true);
    },
  );

  it("accepts names containing accents, hyphens, spaces and apostrophes", () => {
    component.form.setValue({
      ...validUser,
      firstName: "Marie-Émilie",
      lastName: "De O'Connor",
    });

    expect(component.form.valid).toBe(true);
  });

  it.each(["6135550123", "1001000000", "9999999999"])(
    "accepts a valid phone number: %s",
    (phone) => {
      component.form.controls.phone.setValue(phone);

      expect(component.form.controls.phone.valid).toBe(true);
    },
  );

  it.each([
    ["zero first digit", "0135550123"],
    ["zero fourth digit", "6130550123"],
    ["nine digits", "613555012"],
    ["eleven digits", "61355501234"],
    ["letters", "613555012a"],
    ["separators", "613-555-0123"],
    ["spaces", "613 5550123"],
    ["leading space", " 6135550123"],
    ["trailing space", "6135550123 "],
  ])("rejects a phone number with %s", (_description, phone) => {
    component.form.controls.phone.setValue(phone);

    expect(component.form.controls.phone.hasError("pattern")).toBe(true);
  });

  it.each(["bad@", "no-at-sign", ".person@example.com", "person@example.com "])(
    "rejects an invalid email using the Angular email validator: %s",
    (email) => {
      component.form.controls.email.setValue(email);

      expect(component.form.controls.email.hasError("email")).toBe(true);
    },
  );

  it("accepts a valid email with a plus-addressed local part", () => {
    component.form.controls.email.setValue("emilie+lab4@example.com");

    expect(component.form.controls.email.valid).toBe(true);
  });

  it("allows empty optional phone and email fields and shows them as not provided", async () => {
    component.form.setValue({ ...validUser, phone: "", email: "" });
    expect(component.form.valid).toBe(true);

    await submitForm();

    expect(router.url).toBe("/summary");
    expect(tableValues()).toEqual([
      validUser.firstName,
      validUser.lastName,
      "Non fourni",
      "Non fourni",
    ]);
  });

  it("shows field errors after invalid submission and stays on the form", async () => {
    component.form.setValue({
      firstName: "",
      lastName: "   ",
      phone: "0135550123",
      email: "bad@",
    });
    harness.detectChanges();
    expect(
      harness.routeNativeElement!.querySelector("#firstName-error"),
    ).toBeNull();

    await submitForm();

    expect(router.url).toBe("/form");
    expect(userData.user()).toBeNull();
    for (const field of ["firstName", "lastName", "phone", "email"]) {
      const error = harness.routeNativeElement!.querySelector(
        `#${field}-error`,
      );
      expect(error?.textContent?.trim()).toBeTruthy();
      expect(
        harness
          .routeNativeElement!.querySelector(`#${field}`)
          ?.getAttribute("aria-invalid"),
      ).toBe("true");
    }
    expect(
      harness.routeNativeElement!.querySelector(".alert")?.textContent,
    ).toContain("corriger");
  });

  it("shows a phone error after interaction and removes it when corrected", () => {
    const phone = component.form.controls.phone;
    phone.setValue("6130550123");
    phone.markAsTouched();
    harness.detectChanges();

    expect(
      harness.routeNativeElement!.querySelector("#phone-error"),
    ).not.toBeNull();

    phone.setValue("6135550123");
    harness.detectChanges();

    expect(
      harness.routeNativeElement!.querySelector("#phone-error"),
    ).toBeNull();
  });

  it("navigates after valid submission and displays all submitted values in the table", async () => {
    component.form.setValue({
      ...validUser,
      firstName: " Émilie ",
      lastName: " O'Connor ",
    });

    await submitForm();

    expect(router.url).toBe("/summary");
    expect(harness.routeNativeElement!.querySelector("table")).not.toBeNull();
    expect(tableValues()).toEqual(Object.values(validUser));
  });

  it("redirects a direct summary visit to the form when no user was submitted", async () => {
    await harness.navigateByUrl("/summary", UserForm);

    expect(router.url).toBe("/form");
    expect(harness.routeNativeElement!.querySelector("form")).not.toBeNull();
    expect(harness.routeNativeElement!.querySelector("table")).toBeNull();
  });

  it("restores submitted data when returning to the form to edit it", async () => {
    component.form.setValue(validUser);
    await submitForm();

    const editForm = await harness.navigateByUrl("/form", UserForm);

    expect(editForm.form.getRawValue()).toEqual(validUser);
    expect(editForm.form.valid).toBe(true);
    expect(editForm.submitted).toBe(false);
    expect(
      (harness.routeNativeElement!.querySelector("#phone") as HTMLInputElement)
        .value,
    ).toBe(validUser.phone);
  });
});
