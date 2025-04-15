# Solar ERP Improvement Plan - Phase 1: Foundational Improvements

This document outlines the approved plan for Phase 1 improvements to the Solar ERP application, focusing on enhancing Task Management and implementing Referral Tracking.

## 1. Enhance Project Task Management

**Goal:** Upgrade the project task system to handle dependencies and basic scheduling, improving project planning and execution tracking.

**Actions:**

*   **Modify `project.model.js` (`tasks` sub-schema):**
    *   Add `dependsOn: [{ type: Schema.Types.ObjectId, ref: 'Project.tasks' }]` - Array to store IDs of prerequisite tasks within the same project.
    *   Add `startDate: Date` - Estimated or actual start date of the task.
    *   Add `duration: Number` - Estimated duration of the task (e.g., in days or hours).
*   **Implement Backend Logic (`project.controller.js` / Service):**
    *   Enforce task dependencies: Prevent updating a task's status to 'in_progress' if any task listed in its `dependsOn` array is not 'done'.
    *   Handle updates to `startDate` and `duration`.
*   **(Optional but Recommended) Implement Task Templates:**
    *   Create a new `TaskTemplate` model (fields: `name`, `stageTrigger` (e.g., 'permitting'), `tasks` array with description, default duration, etc.).
    *   Add logic (e.g., in `updateProjectStage` controller or a pre-save hook on Project) to check for matching `TaskTemplate`s when a project's `stage` changes and automatically add the defined tasks to the project's `tasks` array if they don't already exist.
*   **Update Frontend:**
    *   Modify task creation/editing forms to allow selecting prerequisite tasks (from other tasks in the same project).
    *   Allow setting `startDate` and `duration`.
    *   Visually indicate dependencies in the task list (e.g., indentation, icons, links).
    *   Consider adding a simple timeline or list view sorted by start date.

## 2. Implement Referral Tracking

**Goal:** Accurately capture and track the specific source of referrals (Dealers, Customers, Staff) for better business intelligence.

**Actions:**

*   **Create `Dealer` Model (`dealer.model.js`):**
    *   Define schema with fields like `name`, `companyName`, `contactPerson`, `email`, `phone`, `address`, `commissionRate` (optional), `isActive`, etc.
    *   Create basic CRUD API endpoints (`dealer.routes.js`, `dealer.controller.js`) for managing dealers.
*   **Modify `lead.model.js`:**
    *   Update `source` enum: Add specific values like `'dealer_referral'`, `'customer_referral'`, `'staff_referral'`, `'bni_referral'`, `'google_page'`, etc. (Ensure existing values like `'website'`, `'social_media'` are kept or mapped appropriately).
    *   Add new fields to store references:
        *   `referringDealer: { type: Schema.Types.ObjectId, ref: 'Dealer', optional: true }`
        *   `referringCustomer: { type: Schema.Types.ObjectId, ref: 'Customer', optional: true }`
        *   `referringUser: { type: Schema.Types.ObjectId, ref: 'User', optional: true }` (for staff referrals)
*   **Update Backend Logic (`lead.controller.js`):**
    *   Modify `createLead` and `updateLead` functions: Based on the selected `source`, validate and save the corresponding ID (`referringDealer`, `referringCustomer`, or `referringUser`) provided in the request body. Ensure only one referral type is saved per lead.
*   **Update Frontend:**
    *   Modify Lead creation/editing form:
        *   Update the 'Lead Source' dropdown/options with the new specific values.
        *   Dynamically display a search/select field based on the chosen source (e.g., if 'Dealer Referral' is selected, show a searchable dropdown populated from the Dealer API).
    *   Add reporting/filtering capabilities: Allow viewing/filtering leads based on the specific referring dealer, customer, or user.

---
*Plan approved on 2025-04-15.*