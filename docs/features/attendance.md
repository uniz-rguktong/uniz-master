# Attendance

## Student

1. Open `/student/attendance`. The page waits until you pick a year and semester and press Get Attendance. The idle copy is “Pick a semester”.
2. For `D210001`, E4 / Sem - 1 returns the fixture ledger: Demo Computer Networks 30/32 (93.75%) and Demo Operating Systems 36/40 (90%), aggregate 91.9%. Export PDF is on the page.
3. The same request for `D210002` has no rows. The empty capture is `attendance/06-ledger-empty-desktop.png`.
4. Holding the grades-style request is not how this page loads. It fetches when Get Attendance is pressed. The earlier `02-loading` and `03-error` files were taken on navigation, before that click, so they still show the idle picker.

## Staff

Webadmin, CoE, dean, and director open Attendance Upload from the admin shell. That tab is mapped to `/admin/attendance`. The screen is “Attendance Bulk Management”: branch, year, semester, batch, Download Template, and a drop zone for the Excel or CSV file. The legacy route `/admin/addattendance` is the same kind of upload page.

## Captured screens

1. Desktop. `01 ledger empty desktop`.

![01-ledger-empty-desktop](screenshots/attendance/01-ledger-empty-desktop.png)

2. Mobile. `01 ledger empty mobile`.

![01-ledger-empty-mobile](screenshots/attendance/01-ledger-empty-mobile.png)

3. Desktop. `01 ledger populated desktop`.

![01-ledger-populated-desktop](screenshots/attendance/01-ledger-populated-desktop.png)

4. Mobile. `01 ledger populated mobile`.

![01-ledger-populated-mobile](screenshots/attendance/01-ledger-populated-mobile.png)

5. Desktop. `02 loading desktop`.

![02-loading-desktop](screenshots/attendance/02-loading-desktop.png)

6. Mobile. `02 loading mobile`.

![02-loading-mobile](screenshots/attendance/02-loading-mobile.png)

7. Desktop. `03 error desktop`.

![03-error-desktop](screenshots/attendance/03-error-desktop.png)

8. Mobile. `03 error mobile`.

![03-error-mobile](screenshots/attendance/03-error-mobile.png)

9. Desktop. `04 legacy upload desktop`.

![04-legacy-upload-desktop](screenshots/attendance/04-legacy-upload-desktop.png)

10. Desktop. `05 ledger loaded desktop`.

![05-ledger-loaded-desktop](screenshots/attendance/05-ledger-loaded-desktop.png)

11. Mobile. `05 ledger loaded mobile`.

![05-ledger-loaded-mobile](screenshots/attendance/05-ledger-loaded-mobile.png)

12. Desktop. `06 ledger empty desktop`.

![06-ledger-empty-desktop](screenshots/attendance/06-ledger-empty-desktop.png)

13. Desktop. `04 attendance upload coe desktop`.

![04-attendance-upload-coe-desktop](screenshots/profile/04-attendance-upload-coe-desktop.png)

14. Mobile. `04 attendance upload coe mobile`.

![04-attendance-upload-coe-mobile](screenshots/profile/04-attendance-upload-coe-mobile.png)

15. Desktop. `04 attendance upload dean desktop`.

![04-attendance-upload-dean-desktop](screenshots/profile/04-attendance-upload-dean-desktop.png)

16. Mobile. `04 attendance upload dean mobile`.

![04-attendance-upload-dean-mobile](screenshots/profile/04-attendance-upload-dean-mobile.png)

17. Desktop. `04 attendance upload director desktop`.

![04-attendance-upload-director-desktop](screenshots/profile/04-attendance-upload-director-desktop.png)

18. Mobile. `04 attendance upload director mobile`.

![04-attendance-upload-director-mobile](screenshots/profile/04-attendance-upload-director-mobile.png)

19. Desktop. `04 attendance upload webadmin desktop`.

![04-attendance-upload-webadmin-desktop](screenshots/profile/04-attendance-upload-webadmin-desktop.png)

20. Mobile. `04 attendance upload webadmin mobile`.

![04-attendance-upload-webadmin-mobile](screenshots/profile/04-attendance-upload-webadmin-mobile.png)
