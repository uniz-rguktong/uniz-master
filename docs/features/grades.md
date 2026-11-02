# Grades and registration

## Results

1. Open `/student/gradehub`. Nothing is fetched until Get Results.
2. Pressing Get Results for `D210001`, E4 / Sem 1, shows Demo Computer Networks (3.0 credits, B, passed) and Demo Operating Systems (4.0 credits, A, passed). Semester GPA and cumulative GPA both read 8.57. Output PDF is on the card.
3. The button reads “Processing…” and the page says “getting your results!” while the request is held.
4. A failed grades request toasts “A server error occurred. Our engineers are notified.” If a transcript was already on screen, it stays.
5. `D210002` gets “No Results Available” for the same semester.

The fixture semester id is `E4-SEM-1`, which is the value the results page sends for E4 / Sem 1.

## Registration

`/student/registration` for `D210001` shows “Your current semester”, AY 2025-26 SEM-I, status Registration OPEN, and one confirmed subject: CS401 Demo Operating Systems, 4 credits. Download PDF is available. `/student/current-semester` is the current-semester route in the same academic area.

## Staff

Mapped admin tabs that do open:

- Grades Upload (`/admin/grades`) and the legacy `/admin/addgrades` page.
- Manage Subjects (`/admin/subjects`).
- Semester Registration (`/admin/semester-registration`).
- Semester Approvals for the dean and for `hod_cse`. In this capture the HOD queue says “Nothing pending right now” and lists AY 2025-26 SEM-I as Registration OPEN.

## Captured screens

1. Desktop. `01 results empty desktop`.

![01-results-empty-desktop](screenshots/grades/01-results-empty-desktop.png)

2. Mobile. `01 results empty mobile`.

![01-results-empty-mobile](screenshots/grades/01-results-empty-mobile.png)

3. Desktop. `01 results populated desktop`.

![01-results-populated-desktop](screenshots/grades/01-results-populated-desktop.png)

4. Mobile. `01 results populated mobile`.

![01-results-populated-mobile](screenshots/grades/01-results-populated-mobile.png)

5. Desktop. `02 registration empty desktop`.

![02-registration-empty-desktop](screenshots/grades/02-registration-empty-desktop.png)

6. Mobile. `02 registration empty mobile`.

![02-registration-empty-mobile](screenshots/grades/02-registration-empty-mobile.png)

7. Desktop. `02 registration populated desktop`.

![02-registration-populated-desktop](screenshots/grades/02-registration-populated-desktop.png)

8. Mobile. `02 registration populated mobile`.

![02-registration-populated-mobile](screenshots/grades/02-registration-populated-mobile.png)

9. Desktop. `03 current semester empty desktop`.

![03-current-semester-empty-desktop](screenshots/grades/03-current-semester-empty-desktop.png)

10. Mobile. `03 current semester empty mobile`.

![03-current-semester-empty-mobile](screenshots/grades/03-current-semester-empty-mobile.png)

11. Desktop. `03 current semester populated desktop`.

![03-current-semester-populated-desktop](screenshots/grades/03-current-semester-populated-desktop.png)

12. Mobile. `03 current semester populated mobile`.

![03-current-semester-populated-mobile](screenshots/grades/03-current-semester-populated-mobile.png)

13. Desktop. `03 loading desktop`.

![03-loading-desktop](screenshots/grades/03-loading-desktop.png)

14. Mobile. `03 loading mobile`.

![03-loading-mobile](screenshots/grades/03-loading-mobile.png)

15. Desktop. `04 error desktop`.

![04-error-desktop](screenshots/grades/04-error-desktop.png)

16. Mobile. `04 error mobile`.

![04-error-mobile](screenshots/grades/04-error-mobile.png)

17. Desktop. `05 legacy upload desktop`.

![05-legacy-upload-desktop](screenshots/grades/05-legacy-upload-desktop.png)

18. Desktop. `05 results loaded desktop`.

![05-results-loaded-desktop](screenshots/grades/05-results-loaded-desktop.png)

19. Mobile. `05 results loaded mobile`.

![05-results-loaded-mobile](screenshots/grades/05-results-loaded-mobile.png)

20. Desktop. `06 results loading desktop`.

![06-results-loading-desktop](screenshots/grades/06-results-loading-desktop.png)

21. Desktop. `07 results error desktop`.

![07-results-error-desktop](screenshots/grades/07-results-error-desktop.png)

22. Desktop. `08 results empty desktop`.

![08-results-empty-desktop](screenshots/grades/08-results-empty-desktop.png)

23. Desktop. `03 semester approvals hod_cse desktop`.

![03-semester-approvals-hod_cse-desktop](screenshots/profile/03-semester-approvals-hod_cse-desktop.png)

24. Mobile. `03 semester approvals hod_cse mobile`.

![03-semester-approvals-hod_cse-mobile](screenshots/profile/03-semester-approvals-hod_cse-mobile.png)

25. Desktop. `05 grades upload coe desktop`.

![05-grades-upload-coe-desktop](screenshots/profile/05-grades-upload-coe-desktop.png)

26. Mobile. `05 grades upload coe mobile`.

![05-grades-upload-coe-mobile](screenshots/profile/05-grades-upload-coe-mobile.png)

27. Desktop. `05 grades upload dean desktop`.

![05-grades-upload-dean-desktop](screenshots/profile/05-grades-upload-dean-desktop.png)

28. Mobile. `05 grades upload dean mobile`.

![05-grades-upload-dean-mobile](screenshots/profile/05-grades-upload-dean-mobile.png)

29. Desktop. `05 grades upload director desktop`.

![05-grades-upload-director-desktop](screenshots/profile/05-grades-upload-director-desktop.png)

30. Mobile. `05 grades upload director mobile`.

![05-grades-upload-director-mobile](screenshots/profile/05-grades-upload-director-mobile.png)

31. Desktop. `05 grades upload webadmin desktop`.

![05-grades-upload-webadmin-desktop](screenshots/profile/05-grades-upload-webadmin-desktop.png)

32. Mobile. `05 grades upload webadmin mobile`.

![05-grades-upload-webadmin-mobile](screenshots/profile/05-grades-upload-webadmin-mobile.png)

33. Desktop. `06 manage subjects coe desktop`.

![06-manage-subjects-coe-desktop](screenshots/profile/06-manage-subjects-coe-desktop.png)

34. Mobile. `06 manage subjects coe mobile`.

![06-manage-subjects-coe-mobile](screenshots/profile/06-manage-subjects-coe-mobile.png)

35. Desktop. `06 manage subjects dean desktop`.

![06-manage-subjects-dean-desktop](screenshots/profile/06-manage-subjects-dean-desktop.png)

36. Mobile. `06 manage subjects dean mobile`.

![06-manage-subjects-dean-mobile](screenshots/profile/06-manage-subjects-dean-mobile.png)

37. Desktop. `06 manage subjects director desktop`.

![06-manage-subjects-director-desktop](screenshots/profile/06-manage-subjects-director-desktop.png)

38. Mobile. `06 manage subjects director mobile`.

![06-manage-subjects-director-mobile](screenshots/profile/06-manage-subjects-director-mobile.png)

39. Desktop. `06 manage subjects webadmin desktop`.

![06-manage-subjects-webadmin-desktop](screenshots/profile/06-manage-subjects-webadmin-desktop.png)

40. Mobile. `06 manage subjects webadmin mobile`.

![06-manage-subjects-webadmin-mobile](screenshots/profile/06-manage-subjects-webadmin-mobile.png)

41. Desktop. `07 semester registration coe desktop`.

![07-semester-registration-coe-desktop](screenshots/profile/07-semester-registration-coe-desktop.png)

42. Mobile. `07 semester registration coe mobile`.

![07-semester-registration-coe-mobile](screenshots/profile/07-semester-registration-coe-mobile.png)

43. Desktop. `07 semester registration dean desktop`.

![07-semester-registration-dean-desktop](screenshots/profile/07-semester-registration-dean-desktop.png)

44. Mobile. `07 semester registration dean mobile`.

![07-semester-registration-dean-mobile](screenshots/profile/07-semester-registration-dean-mobile.png)

45. Desktop. `07 semester registration director desktop`.

![07-semester-registration-director-desktop](screenshots/profile/07-semester-registration-director-desktop.png)

46. Mobile. `07 semester registration director mobile`.

![07-semester-registration-director-mobile](screenshots/profile/07-semester-registration-director-mobile.png)

47. Desktop. `07 semester registration webadmin desktop`.

![07-semester-registration-webadmin-desktop](screenshots/profile/07-semester-registration-webadmin-desktop.png)

48. Mobile. `07 semester registration webadmin mobile`.

![07-semester-registration-webadmin-mobile](screenshots/profile/07-semester-registration-webadmin-mobile.png)

49. Desktop. `08 semester approvals dean desktop`.

![08-semester-approvals-dean-desktop](screenshots/profile/08-semester-approvals-dean-desktop.png)

50. Mobile. `08 semester approvals dean mobile`.

![08-semester-approvals-dean-mobile](screenshots/profile/08-semester-approvals-dean-mobile.png)
