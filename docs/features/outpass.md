# Outpass and outing

Parked. This capture did not enable them.

`enableOutingsAndOutpasses` in `apps/uniz-portal/src/config/featureFlags.ts` is false because `OUTPASS_OUTING_ROUTES_MOUNTED` is false. `VITE_ENABLE_OUTPASS_OUTING` cannot turn the UI on while the routes stay commented out in `App.tsx`. `FEATURE_OUTPASS` in `@uniz/shared` is in the parked set and stays false even if the environment variable is `true`.

## What a signed-in user sees

- The student sidebar has no Outing and no Outpass item.
- `/student/outpass` and `/student/outing` render the portal 404.
- `/admin/approveoutpass` and `/admin/approveouting` render the 404. Those routes are commented out.
- Warden and caretaker shells (boys and girls) show Overview only. The approval groups are omitted by `filterOutpassOutingTabs`.
- The security terminal toasts “Outpass and outing are currently disabled by administration.”
- The public portal home and the sign-in marketing copy still mention hostel outpass. That copy is not a working route.

The outpass service was not started for this capture.

## Captured screens

1. Desktop. `00 home caretaker_female desktop`.

![00-home-caretaker_female-desktop](screenshots/outpass/00-home-caretaker_female-desktop.png)

2. Mobile. `00 home caretaker_female mobile`.

![00-home-caretaker_female-mobile](screenshots/outpass/00-home-caretaker_female-mobile.png)

3. Desktop. `00 home caretaker_male desktop`.

![00-home-caretaker_male-desktop](screenshots/outpass/00-home-caretaker_male-desktop.png)

4. Mobile. `00 home caretaker_male mobile`.

![00-home-caretaker_male-mobile](screenshots/outpass/00-home-caretaker_male-mobile.png)

5. Desktop. `00 home warden_female desktop`.

![00-home-warden_female-desktop](screenshots/outpass/00-home-warden_female-desktop.png)

6. Mobile. `00 home warden_female mobile`.

![00-home-warden_female-mobile](screenshots/outpass/00-home-warden_female-mobile.png)

7. Desktop. `00 home warden_male desktop`.

![00-home-warden_male-desktop](screenshots/outpass/00-home-warden_male-desktop.png)

8. Mobile. `00 home warden_male mobile`.

![00-home-warden_male-mobile](screenshots/outpass/00-home-warden_male-mobile.png)

9. Desktop. `01 overview caretaker_female desktop`.

![01-overview-caretaker_female-desktop](screenshots/outpass/01-overview-caretaker_female-desktop.png)

10. Mobile. `01 overview caretaker_female mobile`.

![01-overview-caretaker_female-mobile](screenshots/outpass/01-overview-caretaker_female-mobile.png)

11. Desktop. `01 overview caretaker_male desktop`.

![01-overview-caretaker_male-desktop](screenshots/outpass/01-overview-caretaker_male-desktop.png)

12. Mobile. `01 overview caretaker_male mobile`.

![01-overview-caretaker_male-mobile](screenshots/outpass/01-overview-caretaker_male-mobile.png)

13. Desktop. `01 overview warden_female desktop`.

![01-overview-warden_female-desktop](screenshots/outpass/01-overview-warden_female-desktop.png)

14. Mobile. `01 overview warden_female mobile`.

![01-overview-warden_female-mobile](screenshots/outpass/01-overview-warden_female-mobile.png)

15. Desktop. `01 overview warden_male desktop`.

![01-overview-warden_male-desktop](screenshots/outpass/01-overview-warden_male-desktop.png)

16. Mobile. `01 overview warden_male mobile`.

![01-overview-warden_male-mobile](screenshots/outpass/01-overview-warden_male-mobile.png)

17. Desktop. `01 student route parked empty desktop`.

![01-student-route-parked-empty-desktop](screenshots/outpass/01-student-route-parked-empty-desktop.png)

18. Mobile. `01 student route parked empty mobile`.

![01-student-route-parked-empty-mobile](screenshots/outpass/01-student-route-parked-empty-mobile.png)

19. Desktop. `01 student route parked populated desktop`.

![01-student-route-parked-populated-desktop](screenshots/outpass/01-student-route-parked-populated-desktop.png)

20. Mobile. `01 student route parked populated mobile`.

![01-student-route-parked-populated-mobile](screenshots/outpass/01-student-route-parked-populated-mobile.png)

21. Desktop. `02 outing route parked empty desktop`.

![02-outing-route-parked-empty-desktop](screenshots/outpass/02-outing-route-parked-empty-desktop.png)

22. Mobile. `02 outing route parked empty mobile`.

![02-outing-route-parked-empty-mobile](screenshots/outpass/02-outing-route-parked-empty-mobile.png)

23. Desktop. `02 outing route parked populated desktop`.

![02-outing-route-parked-populated-desktop](screenshots/outpass/02-outing-route-parked-populated-desktop.png)

24. Mobile. `02 outing route parked populated mobile`.

![02-outing-route-parked-populated-mobile](screenshots/outpass/02-outing-route-parked-populated-mobile.png)

25. Desktop. `02 status update caretaker_female desktop`.

![02-status-update-caretaker_female-desktop](screenshots/outpass/02-status-update-caretaker_female-desktop.png)

26. Mobile. `02 status update caretaker_female mobile`.

![02-status-update-caretaker_female-mobile](screenshots/outpass/02-status-update-caretaker_female-mobile.png)

27. Desktop. `02 status update caretaker_male desktop`.

![02-status-update-caretaker_male-desktop](screenshots/outpass/02-status-update-caretaker_male-desktop.png)

28. Mobile. `02 status update caretaker_male mobile`.

![02-status-update-caretaker_male-mobile](screenshots/outpass/02-status-update-caretaker_male-mobile.png)

29. Desktop. `03 admin route parked desktop`.

![03-admin-route-parked-desktop](screenshots/outpass/03-admin-route-parked-desktop.png)

30. Desktop. `04 admin outing parked desktop`.

![04-admin-outing-parked-desktop](screenshots/outpass/04-admin-outing-parked-desktop.png)

31. Mobile. `admin approveoutpass mobile`.

![admin-approveoutpass-mobile](screenshots/profile/admin-approveoutpass-mobile.png)
