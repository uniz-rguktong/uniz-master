# Alumni

## Public and student

`/alumni` is the public directory. `/student/alumni` is the signed-in page.

The signed-in page has three parts:

1. “Claim your alumni profile.” Send code emails the address on the student profile. Local mail is not configured, so this capture did not complete a claim.
2. Jobs from alumni. The fixture post is “Junior engineer” at Demo Labs, Hyderabad, full-time, apply by 2026-12-12.
3. Directory. Kiran Demo, software engineer at Demo Labs, Hyderabad, CSE, batch D20, 2026. Kiran Demo is a fixture row, not a campus record.

## Admin shell

The Alumni item in the webadmin and dean shells has no URL mapping, so the click returns to the overview.

## Captured screens

1. Desktop. `01 public directory desktop`.

![01-public-directory-desktop](screenshots/alumni/01-public-directory-desktop.png)

2. Mobile. `01 public directory mobile`.

![01-public-directory-mobile](screenshots/alumni/01-public-directory-mobile.png)

3. Desktop. `02 student empty desktop`.

![02-student-empty-desktop](screenshots/alumni/02-student-empty-desktop.png)

4. Mobile. `02 student empty mobile`.

![02-student-empty-mobile](screenshots/alumni/02-student-empty-mobile.png)

5. Desktop. `02 student populated desktop`.

![02-student-populated-desktop](screenshots/alumni/02-student-populated-desktop.png)

6. Mobile. `02 student populated mobile`.

![02-student-populated-mobile](screenshots/alumni/02-student-populated-mobile.png)

7. Desktop. `03 error desktop`.

![03-error-desktop](screenshots/alumni/03-error-desktop.png)

8. Mobile. `03 error mobile`.

![03-error-mobile](screenshots/alumni/03-error-mobile.png)

9. Desktop. Clicking this item does not open its panel. `adminSectionRoutes.ts` has no path for this tab, so `setActiveTab` navigates to `/admin` and the overview stays on screen. The row is under the pointer, which is why it looks pressed. File `11 alumni coe desktop`.

![11-alumni-coe-desktop](screenshots/profile/11-alumni-coe-desktop.png)

10. Mobile. Clicking this item does not open its panel. `adminSectionRoutes.ts` has no path for this tab, so `setActiveTab` navigates to `/admin` and the overview stays on screen. The row is under the pointer, which is why it looks pressed. File `11 alumni coe mobile`.

![11-alumni-coe-mobile](screenshots/profile/11-alumni-coe-mobile.png)

11. Desktop. Clicking this item does not open its panel. `adminSectionRoutes.ts` has no path for this tab, so `setActiveTab` navigates to `/admin` and the overview stays on screen. The row is under the pointer, which is why it looks pressed. File `11 alumni dean desktop`.

![11-alumni-dean-desktop](screenshots/profile/11-alumni-dean-desktop.png)

12. Mobile. Clicking this item does not open its panel. `adminSectionRoutes.ts` has no path for this tab, so `setActiveTab` navigates to `/admin` and the overview stays on screen. The row is under the pointer, which is why it looks pressed. File `11 alumni dean mobile`.

![11-alumni-dean-mobile](screenshots/profile/11-alumni-dean-mobile.png)

13. Desktop. Clicking this item does not open its panel. `adminSectionRoutes.ts` has no path for this tab, so `setActiveTab` navigates to `/admin` and the overview stays on screen. The row is under the pointer, which is why it looks pressed. File `11 alumni webadmin desktop`.

![11-alumni-webadmin-desktop](screenshots/profile/11-alumni-webadmin-desktop.png)

14. Mobile. Clicking this item does not open its panel. `adminSectionRoutes.ts` has no path for this tab, so `setActiveTab` navigates to `/admin` and the overview stays on screen. The row is under the pointer, which is why it looks pressed. File `11 alumni webadmin mobile`.

![11-alumni-webadmin-mobile](screenshots/profile/11-alumni-webadmin-mobile.png)
