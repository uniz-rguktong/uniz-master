# Feedback

## Student

`/student/feedback` tells the student that answers are anonymous and that faculty see averages only after 5 or more replies. It links complaints to the grievance form.

The open form in this fixture is “Demo Operating Systems feedback” for `FACULTY_CSE`, closing 2026-12-02, with a Give feedback button. The API returns the question as an object (`id`, `text`, `scale`). The component renders each question with `{question}` as if it were a string. Opening Give feedback throws and the page goes blank. That is the behaviour this capture hit, so there is no successful submit screenshot.

## Faculty and admin

Faculty “My Feedback” is on `/faculty`. The admin shell lists Course Feedback for webadmin, CoE, and dean. That tab has no URL mapping, so the click returns to the overview.

## Captured screens

1. Desktop. `01 student empty desktop`.

![01-student-empty-desktop](screenshots/feedback/01-student-empty-desktop.png)

2. Mobile. `01 student empty mobile`.

![01-student-empty-mobile](screenshots/feedback/01-student-empty-mobile.png)

3. Desktop. `01 student populated desktop`.

![01-student-populated-desktop](screenshots/feedback/01-student-populated-desktop.png)

4. Mobile. `01 student populated mobile`.

![01-student-populated-mobile](screenshots/feedback/01-student-populated-mobile.png)

5. Desktop. `02 submit desktop`.

![02-submit-desktop](screenshots/feedback/02-submit-desktop.png)

6. Desktop. `03 error desktop`.

![03-error-desktop](screenshots/feedback/03-error-desktop.png)

7. Mobile. `03 error mobile`.

![03-error-mobile](screenshots/feedback/03-error-mobile.png)

8. Desktop. `04 faculty results desktop`.

![04-faculty-results-desktop](screenshots/feedback/04-faculty-results-desktop.png)

9. Desktop. Clicking this item does not open its panel. `adminSectionRoutes.ts` has no path for this tab, so `setActiveTab` navigates to `/admin` and the overview stays on screen. The row is under the pointer, which is why it looks pressed. File `09 course feedback coe desktop`.

![09-course-feedback-coe-desktop](screenshots/profile/09-course-feedback-coe-desktop.png)

10. Mobile. Clicking this item does not open its panel. `adminSectionRoutes.ts` has no path for this tab, so `setActiveTab` navigates to `/admin` and the overview stays on screen. The row is under the pointer, which is why it looks pressed. File `09 course feedback coe mobile`.

![09-course-feedback-coe-mobile](screenshots/profile/09-course-feedback-coe-mobile.png)

11. Desktop. Clicking this item does not open its panel. `adminSectionRoutes.ts` has no path for this tab, so `setActiveTab` navigates to `/admin` and the overview stays on screen. The row is under the pointer, which is why it looks pressed. File `09 course feedback webadmin desktop`.

![09-course-feedback-webadmin-desktop](screenshots/profile/09-course-feedback-webadmin-desktop.png)

12. Mobile. Clicking this item does not open its panel. `adminSectionRoutes.ts` has no path for this tab, so `setActiveTab` navigates to `/admin` and the overview stays on screen. The row is under the pointer, which is why it looks pressed. File `09 course feedback webadmin mobile`.

![09-course-feedback-webadmin-mobile](screenshots/profile/09-course-feedback-webadmin-mobile.png)

13. Desktop. Clicking this item does not open its panel. `adminSectionRoutes.ts` has no path for this tab, so `setActiveTab` navigates to `/admin` and the overview stays on screen. The row is under the pointer, which is why it looks pressed. File `10 course feedback dean desktop`.

![10-course-feedback-dean-desktop](screenshots/profile/10-course-feedback-dean-desktop.png)

14. Mobile. Clicking this item does not open its panel. `adminSectionRoutes.ts` has no path for this tab, so `setActiveTab` navigates to `/admin` and the overview stays on screen. The row is under the pointer, which is why it looks pressed. File `10 course feedback dean mobile`.

![10-course-feedback-dean-mobile](screenshots/profile/10-course-feedback-dean-mobile.png)
