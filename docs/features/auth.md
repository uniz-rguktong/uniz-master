# Authentication

Local demo only. Every seeded account uses the password `password123`. The accounts are fictional fixtures from `scripts/local/seed-local.ts`. No production credential was used.

Sign-in is one form with three portals.

| Portal | Path | Who |
| --- | --- | --- |
| Student | `/student/signin` | `student` |
| Faculty | `/faculty/signin` | `faculty` and `teacher`. The form posts to the admin login endpoint. |
| Administration | `/admin/signin` | `webadmin`, `coe`, `dean`, `director`, `hod`, `swo`, `security`, `librarian`, wardens, caretakers |

`ao` is a role in the shared enum, and a local `ao` account exists, but `useIsAuth` does not list `ao`. Signing in as `ao` shows “Access violation: Invalid Role” and returns to the sign-in form.

Cloudflare Turnstile is skipped when the portal is in Vite dev mode and `VITE_TURNSTILE_SITE_KEY` is the Cloudflare test site key. This capture used that test key.

## Steps

1. Open `/`. The public home lists examination results, registration, attendance, a hostel outpass card, and staff sign-in. The outpass card still links to student sign-in. The outpass routes themselves are not mounted. See [Outpass](outpass.md).
2. Open `/student/signin`. The form asks for a university id (`D210001` or an email) and a password of at least 6 characters.
3. An id that is neither a campus id nor an email is rejected in the form.
4. A password shorter than 6 characters is rejected in the form.
5. A wrong password returns “Incorrect username or password.”
6. While the login request is in flight the button reads “Signing in…”.
7. A successful student login lands on `/student`. Staff logins land on `/faculty` or `/admin`.
8. “Forgot password?” opens the OTP request step. This capture did not complete a reset, because outbound mail is not configured locally.
9. `/admin/security`, and the security role’s home, is the access-control terminal. It toasts “Outpass and outing are currently disabled by administration.”
10. An unknown path renders the 404 page.

## Captured screens

1. Desktop. `00 home security desktop`.

![00-home-security-desktop](screenshots/auth/00-home-security-desktop.png)

2. Mobile. `00 home security mobile`.

![00-home-security-mobile](screenshots/auth/00-home-security-mobile.png)

3. Desktop. `01 overview security desktop`.

![01-overview-security-desktop](screenshots/auth/01-overview-security-desktop.png)

4. Mobile. `01 overview security mobile`.

![01-overview-security-mobile](screenshots/auth/01-overview-security-mobile.png)

5. Desktop. `01 portal home desktop`.

![01-portal-home-desktop](screenshots/auth/01-portal-home-desktop.png)

6. Mobile. `01 portal home mobile`.

![01-portal-home-mobile](screenshots/auth/01-portal-home-mobile.png)

7. Desktop. `02 search directory security desktop`.

![02-search-directory-security-desktop](screenshots/auth/02-search-directory-security-desktop.png)

8. Mobile. `02 search directory security mobile`.

![02-search-directory-security-mobile](screenshots/auth/02-search-directory-security-mobile.png)

9. Desktop. `02 student signin desktop`.

![02-student-signin-desktop](screenshots/auth/02-student-signin-desktop.png)

10. Mobile. `02 student signin mobile`.

![02-student-signin-mobile](screenshots/auth/02-student-signin-mobile.png)

11. Desktop. `03 activity logs security desktop`.

![03-activity-logs-security-desktop](screenshots/auth/03-activity-logs-security-desktop.png)

12. Mobile. `03 activity logs security mobile`.

![03-activity-logs-security-mobile](screenshots/auth/03-activity-logs-security-mobile.png)

13. Desktop. `03 admin signin desktop`.

![03-admin-signin-desktop](screenshots/auth/03-admin-signin-desktop.png)

14. Mobile. `03 admin signin mobile`.

![03-admin-signin-mobile](screenshots/auth/03-admin-signin-mobile.png)

15. Desktop. `04 faculty signin desktop`.

![04-faculty-signin-desktop](screenshots/auth/04-faculty-signin-desktop.png)

16. Mobile. `04 faculty signin mobile`.

![04-faculty-signin-mobile](screenshots/auth/04-faculty-signin-mobile.png)

17. Desktop. `05 forgot password desktop`.

![05-forgot-password-desktop](screenshots/auth/05-forgot-password-desktop.png)

18. Mobile. `05 forgot password mobile`.

![05-forgot-password-mobile](screenshots/auth/05-forgot-password-mobile.png)

19. Desktop. `06 developers desktop`.

![06-developers-desktop](screenshots/auth/06-developers-desktop.png)

20. Mobile. `06 developers mobile`.

![06-developers-mobile](screenshots/auth/06-developers-mobile.png)

21. Desktop. `07 privacy desktop`.

![07-privacy-desktop](screenshots/auth/07-privacy-desktop.png)

22. Mobile. `07 privacy mobile`.

![07-privacy-mobile](screenshots/auth/07-privacy-mobile.png)

23. Desktop. `08 not found desktop`.

![08-not-found-desktop](screenshots/auth/08-not-found-desktop.png)

24. Mobile. `08 not found mobile`.

![08-not-found-mobile](screenshots/auth/08-not-found-mobile.png)

25. Desktop. `09 invalid id desktop`.

![09-invalid-id-desktop](screenshots/auth/09-invalid-id-desktop.png)

26. Mobile. `09 invalid id mobile`.

![09-invalid-id-mobile](screenshots/auth/09-invalid-id-mobile.png)

27. Desktop. `10 short password desktop`.

![10-short-password-desktop](screenshots/auth/10-short-password-desktop.png)

28. Mobile. `10 short password mobile`.

![10-short-password-mobile](screenshots/auth/10-short-password-mobile.png)

29. Desktop. `11 wrong password desktop`.

![11-wrong-password-desktop](screenshots/auth/11-wrong-password-desktop.png)

30. Mobile. `11 wrong password mobile`.

![11-wrong-password-mobile](screenshots/auth/11-wrong-password-mobile.png)

31. Desktop. `12 signing in desktop`.

![12-signing-in-desktop](screenshots/auth/12-signing-in-desktop.png)

32. Mobile. `12 signing in mobile`.

![12-signing-in-mobile](screenshots/auth/12-signing-in-mobile.png)

33. Desktop. `13 student home empty desktop`.

![13-student-home-empty-desktop](screenshots/auth/13-student-home-empty-desktop.png)

34. Mobile. `13 student home empty mobile`.

![13-student-home-empty-mobile](screenshots/auth/13-student-home-empty-mobile.png)

35. Desktop. `13 student home populated desktop`.

![13-student-home-populated-desktop](screenshots/auth/13-student-home-populated-desktop.png)

36. Mobile. `13 student home populated mobile`.

![13-student-home-populated-mobile](screenshots/auth/13-student-home-populated-mobile.png)

37. Desktop. `14 settings desktop`.

![14-settings-desktop](screenshots/auth/14-settings-desktop.png)

38. Desktop. `15 roles desktop`.

![15-roles-desktop](screenshots/auth/15-roles-desktop.png)

39. Desktop. `16 security page desktop`.

![16-security-page-desktop](screenshots/auth/16-security-page-desktop.png)

40. Desktop. `03 security swo_office desktop`.

![03-security-swo_office-desktop](screenshots/profile/03-security-swo_office-desktop.png)

41. Mobile. `03 security swo_office mobile`.

![03-security-swo_office-mobile](screenshots/profile/03-security-swo_office-mobile.png)

42. Desktop. `13 system logs director desktop`.

![13-system-logs-director-desktop](screenshots/profile/13-system-logs-director-desktop.png)

43. Mobile. `13 system logs director mobile`.

![13-system-logs-director-mobile](screenshots/profile/13-system-logs-director-mobile.png)

44. Desktop. `14 security director desktop`.

![14-security-director-desktop](screenshots/profile/14-security-director-desktop.png)

45. Mobile. `14 security director mobile`.

![14-security-director-mobile](screenshots/profile/14-security-director-mobile.png)

46. Desktop. `20 system logs coe desktop`.

![20-system-logs-coe-desktop](screenshots/profile/20-system-logs-coe-desktop.png)

47. Mobile. `20 system logs coe mobile`.

![20-system-logs-coe-mobile](screenshots/profile/20-system-logs-coe-mobile.png)

48. Desktop. `20 system logs webadmin desktop`.

![20-system-logs-webadmin-desktop](screenshots/profile/20-system-logs-webadmin-desktop.png)

49. Mobile. `20 system logs webadmin mobile`.

![20-system-logs-webadmin-mobile](screenshots/profile/20-system-logs-webadmin-mobile.png)

50. Desktop. `21 security coe desktop`.

![21-security-coe-desktop](screenshots/profile/21-security-coe-desktop.png)

51. Mobile. `21 security coe mobile`.

![21-security-coe-mobile](screenshots/profile/21-security-coe-mobile.png)

52. Desktop. `21 security webadmin desktop`.

![21-security-webadmin-desktop](screenshots/profile/21-security-webadmin-desktop.png)

53. Mobile. `21 security webadmin mobile`.

![21-security-webadmin-mobile](screenshots/profile/21-security-webadmin-mobile.png)

54. Desktop. `21 system logs dean desktop`.

![21-system-logs-dean-desktop](screenshots/profile/21-system-logs-dean-desktop.png)

55. Mobile. `21 system logs dean mobile`.

![21-system-logs-dean-mobile](screenshots/profile/21-system-logs-dean-mobile.png)

56. Desktop. `22 security dean desktop`.

![22-security-dean-desktop](screenshots/profile/22-security-dean-desktop.png)

57. Mobile. `22 security dean mobile`.

![22-security-dean-mobile](screenshots/profile/22-security-dean-mobile.png)

58. Mobile. `admin security mobile`.

![admin-security-mobile](screenshots/profile/admin-security-mobile.png)
