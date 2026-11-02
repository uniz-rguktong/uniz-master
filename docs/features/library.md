# Library

Fines are Rs 1 a day. Paying a fine online is coming soon; the desk copy says to collect at the counter and mark paid.

## Student

`/student/library` for `D210001` shows the loan of Demo Algorithms, barcode DEMO-BC-001, issued to that student. `D210002` has no loan.

## Librarian

The `librarian` role does not use the webadmin shell. `/admin` renders Library Desk: issue by copy barcode and borrower id, return by barcode, add a book, CSV import, search, the on-loan list, and unpaid fines. In this capture the on-loan row is D210001, issued 2026-10-30, due 2026-11-13, and unpaid fines say “None.”

## Webadmin shell

The Library item in the webadmin shell has no URL mapping, so the click returns to the overview. Use the librarian account for the desk.

Faculty also has a Library tab on `/faculty`. This demo faculty has no loan.

## Captured screens

1. Desktop. `00 home librarian desktop`.

![00-home-librarian-desktop](screenshots/library/00-home-librarian-desktop.png)

2. Mobile. `00 home librarian mobile`.

![00-home-librarian-mobile](screenshots/library/00-home-librarian-mobile.png)

3. Desktop. `01 my library empty desktop`.

![01-my-library-empty-desktop](screenshots/library/01-my-library-empty-desktop.png)

4. Mobile. `01 my library empty mobile`.

![01-my-library-empty-mobile](screenshots/library/01-my-library-empty-mobile.png)

5. Desktop. `01 my library populated desktop`.

![01-my-library-populated-desktop](screenshots/library/01-my-library-populated-desktop.png)

6. Mobile. `01 my library populated mobile`.

![01-my-library-populated-mobile](screenshots/library/01-my-library-populated-mobile.png)

7. Desktop. `02 loading desktop`.

![02-loading-desktop](screenshots/library/02-loading-desktop.png)

8. Mobile. `02 loading mobile`.

![02-loading-mobile](screenshots/library/02-loading-mobile.png)

9. Desktop. `03 error desktop`.

![03-error-desktop](screenshots/library/03-error-desktop.png)

10. Mobile. `03 error mobile`.

![03-error-mobile](screenshots/library/03-error-mobile.png)

11. Desktop. `04 faculty desktop`.

![04-faculty-desktop](screenshots/library/04-faculty-desktop.png)

12. Desktop. Clicking this item does not open its panel. `adminSectionRoutes.ts` has no path for this tab, so `setActiveTab` navigates to `/admin` and the overview stays on screen. The row is under the pointer, which is why it looks pressed. File `14 library coe desktop`.

![14-library-coe-desktop](screenshots/profile/14-library-coe-desktop.png)

13. Mobile. Clicking this item does not open its panel. `adminSectionRoutes.ts` has no path for this tab, so `setActiveTab` navigates to `/admin` and the overview stays on screen. The row is under the pointer, which is why it looks pressed. File `14 library coe mobile`.

![14-library-coe-mobile](screenshots/profile/14-library-coe-mobile.png)

14. Desktop. Clicking this item does not open its panel. `adminSectionRoutes.ts` has no path for this tab, so `setActiveTab` navigates to `/admin` and the overview stays on screen. The row is under the pointer, which is why it looks pressed. File `14 library webadmin desktop`.

![14-library-webadmin-desktop](screenshots/profile/14-library-webadmin-desktop.png)

15. Mobile. Clicking this item does not open its panel. `adminSectionRoutes.ts` has no path for this tab, so `setActiveTab` navigates to `/admin` and the overview stays on screen. The row is under the pointer, which is why it looks pressed. File `14 library webadmin mobile`.

![14-library-webadmin-mobile](screenshots/profile/14-library-webadmin-mobile.png)
