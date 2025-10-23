# Implementation Plan

- [x] 1. Create database schema and models for team invitations



  - Create migration for team_invitations table with proper indexes and constraints
  - Create TeamInvitation Sequelize model with associations and instance methods
  - Add invitation_status column to registrations table via migration
  - Update Registration model to include invitation-related methods
  - _Requirements: 1.1, 1.3, 4.1, 5.4_

- [x] 2. Implement core invitation service logic



  - [x] 2.1 Create InvitationService with token generation and validation


    - Implement secure token generation using crypto module
    - Add token validation and expiration checking methods
    - Create invitation creation logic with email validation
    - _Requirements: 1.1, 1.3, 2.4_

  - [x] 2.2 Implement invitation response processing


    - Add accept invitation logic that updates team membership
    - Add reject invitation logic with team leader notification
    - Handle duplicate response prevention and validation
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 2.3 Add invitation status tracking and cleanup


    - Implement invitation status dashboard data retrieval
    - Add expired invitation cleanup functionality
    - Create team leader notification system for status changes
    - _Requirements: 4.1, 4.2, 4.4, 5.3_

- [x] 3. Extend email service for invitation workflows



  - [x] 3.1 Create invitation email templates


    - Design HTML email template for team invitations with accept/reject buttons
    - Create plain text fallback template
    - Add team leader notification email templates
    - _Requirements: 2.1, 2.2, 4.2_

  - [x] 3.2 Implement invitation email sending logic


    - Extend EmailService to handle invitation emails
    - Add batch email sending for multiple invitations
    - Implement retry logic for failed email deliveries
    - _Requirements: 1.2, 2.1, 5.2_

- [-] 4. Create invitation controller and API endpoints

  - [-] 4.1 Implement InvitationController with core endpoints

    - Add sendInvitations endpoint for creating and sending invitations
    - Create respondToInvitation endpoint for handling accept/reject responses
    - Implement getInvitationStatus endpoint for dashboard data
    - _Requirements: 1.1, 1.2, 3.1, 3.2, 4.1_

  - [ ] 4.2 Add invitation management endpoints
    - Create resendInvitation endpoint for team leaders
    - Add cancelInvitation endpoint for pending invitations
    - Implement proper error handling and validation
    - _Requirements: 4.3, 4.4, 5.1_

- [ ] 5. Update registration workflow to support invitations
  - [ ] 5.1 Modify registration creation process
    - Update registrationController to handle team invitations during registration
    - Modify team registration flow to create invitations instead of direct member addition
    - Add validation for team size limits before sending invitations
    - _Requirements: 1.1, 1.4, 1.5, 5.1_

  - [ ] 5.2 Implement invitation-dependent registration completion
    - Update registration status logic to wait for invitation responses
    - Add automatic registration completion when all invitations are resolved
    - Handle registration conflicts when invited users are already registered
    - _Requirements: 1.4, 3.5, 4.5_

- [ ] 6. Create invitation response UI and routes
  - [ ] 6.1 Add invitation routes to Express router
    - Create /api/invitations route group with proper middleware
    - Add authentication and validation middleware for invitation endpoints
    - Implement rate limiting for invitation sending
    - _Requirements: 1.1, 3.1, 5.2_

  - [ ] 6.2 Create invitation response pages
    - Build invitation response page that displays invitation details
    - Add accept/reject form handling with proper validation
    - Create confirmation pages for successful responses
    - _Requirements: 2.3, 3.1, 3.4_

- [ ] 7. Add invitation management to existing registration dashboard
  - [ ] 7.1 Extend registration API to include invitation data
    - Update registration endpoints to return invitation status
    - Add invitation details to team registration responses
    - Implement invitation status filtering and sorting
    - _Requirements: 4.1, 4.5_

  - [ ] 7.2 Add invitation cleanup and maintenance tasks
    - Create scheduled job for cleaning up expired invitations
    - Add database maintenance for invitation audit logs
    - Implement invitation analytics and reporting
    - _Requirements: 5.3, 5.4_

- [ ]* 8. Write comprehensive tests for invitation system
  - [ ]* 8.1 Create unit tests for invitation models and services
    - Write tests for TeamInvitation model methods and validations
    - Test InvitationService business logic and edge cases
    - Add tests for token generation and validation
    - _Requirements: 1.1, 2.4, 3.3_

  - [ ]* 8.2 Write integration tests for invitation workflow
    - Test complete invitation send-respond-complete workflow
    - Add tests for email service integration
    - Test registration completion with invitation dependencies
    - _Requirements: 1.2, 3.1, 4.5_

  - [ ]* 8.3 Add API endpoint tests
    - Test all invitation controller endpoints with various scenarios
    - Add error handling and validation tests
    - Test authentication and authorization for invitation endpoints
    - _Requirements: 3.1, 4.1, 5.1_