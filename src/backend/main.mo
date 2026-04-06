import Map "mo:core/Map";
import Array "mo:core/Array";
import List "mo:core/List";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Set "mo:core/Set";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // --- Types ---
  module UserRole {
    public type Type = { #admin; #user; #guest };
  };
  module UserProfile {
    public type Type = {
      name : Text;
      bio : Text;
      email : Text;
      registrationStatus : RegistrationStatus.Type;
      skills : Set.Set<Text>;
    };
    public type View = {
      principal : Principal;
      name : Text;
      bio : Text;
      email : Text;
      registrationStatus : RegistrationStatus.Type;
      skills : [Text];
    };
    public module Compare {
      public func compareByName(a : Type, b : Type) : Order.Order {
        Text.compare(a.name, b.name);
      };
    };
    public module ViewCompare {
      public func compareByName(a : View, b : View) : Order.Order {
        Text.compare(a.name, b.name);
      };
    };
    public func toView(profile : Type, principal : Principal) : View {
      {
        profile with
        principal;
        skills = profile.skills.toArray();
      };
    };
  };
  module ProjectStatus {
    public type Type = { #planning; #active; #completed };
  };
  module Project {
    public type Type = {
      id : Nat;
      title : Text;
      description : Text;
      startDate : Text;
      endDate : Text;
      status : ProjectStatus.Type;
      assignedInterns : Set.Set<Principal>;
    };
    public type View = {
      id : Nat;
      title : Text;
      description : Text;
      startDate : Text;
      endDate : Text;
      status : ProjectStatus.Type;
      assignedInterns : [Principal];
    };
    public func toView(project : Type) : View {
      {
        project with
        assignedInterns = project.assignedInterns.toArray();
      };
    };
  };
  module ActivityLog {
    public type Type = {
      id : Nat;
      internPrincipal : Principal;
      projectId : Nat;
      title : Text;
      description : Text;
      date : Text;
      hours : Nat;
      createdAt : Int;
    };
    public type View = {
      id : Nat;
      internPrincipal : Principal;
      projectId : Nat;
      title : Text;
      description : Text;
      date : Text;
      hours : Nat;
      createdAt : Int;
    };
  };
  module Message {
    public type Type = {
      id : Nat;
      sender : Principal;
      recipient : Principal;
      content : Text;
      timestamp : Int;
      isRead : Bool;
    };
    public type View = {
      id : Nat;
      sender : Principal;
      recipient : Principal;
      content : Text;
      timestamp : Int;
      isRead : Bool;
    };
  };
  module RegistrationStatus {
    public type Type = { #pending; #active; #rejected };
  };
  module MilestoneStatus {
    public type Type = { #pending; #inProgress; #completed };
  };
  module Milestone {
    public type Type = {
      id : Nat;
      internPrincipal : Principal;
      projectId : Nat;
      title : Text;
      description : Text;
      status : MilestoneStatus.Type;
      dueDate : Text;
      createdAt : Int;
    };
    public type View = {
      id : Nat;
      internPrincipal : Principal;
      projectId : Nat;
      title : Text;
      description : Text;
      status : MilestoneStatus.Type;
      dueDate : Text;
      createdAt : Int;
    };
  };
  module NotificationType {
    public type Type = {
      #newApprovalRequest;
      #projectAssigned;
      #milestoneUpdate;
      #messageReceived;
    };
  };
  module Notification {
    public type Type = {
      id : Nat;
      recipientPrincipal : Principal;
      notificationType : NotificationType.Type;
      message : Text;
      relatedId : Nat;
      isRead : Bool;
      timestamp : Int;
    };
    public type View = {
      id : Nat;
      recipientPrincipal : Principal;
      notificationType : NotificationType.Type;
      message : Text;
      relatedId : Nat;
      isRead : Bool;
      timestamp : Int;
    };
  };
  module AnalyticsSummary {
    public type Type = {
      totalHours : Nat;
      totalActivities : Nat;
      totalMilestones : Nat;
      completedMilestones : Nat;
      activeInternCount : Nat;
      projectCount : Nat;
      hoursByProject : [(Nat, Nat)];
      recentActivities : [ActivityLog.View];
    };
  };

  // --- Persistent State ---
  let accessControlState = AccessControl.initState();

  include MixinAuthorization(accessControlState);

  var nextProjectId = 1;
  var nextActivityId = 1;
  var nextMessageId = 1;
  var nextMilestoneId = 1;
  var nextNotificationId = 1;
  var lastActivityTime : ?Int = null;

  let userProfiles = Map.empty<Principal, UserProfile.Type>();
  let projects = Map.empty<Nat, Project.Type>();
  let activityLogs = Map.empty<Nat, ActivityLog.Type>();
  let messages = Map.empty<Nat, Message.Type>();
  let milestones = Map.empty<Nat, Milestone.Type>();
  let notifications = Map.empty<Nat, Notification.Type>();

  // --- Notification Helper ---
  func createNotificationInternal(recipient : Principal, notificationType : NotificationType.Type, message : Text, relatedId : Nat) {
    let newNotification : Notification.Type = {
      id = nextNotificationId;
      recipientPrincipal = recipient;
      notificationType;
      message;
      relatedId;
      isRead = false;
      timestamp = Time.now();
    };
    notifications.add(nextNotificationId, newNotification);
    nextNotificationId += 1;
  };

  // --- Project CRUD Functions ---
  func createProjectInternal(title : Text, description : Text, startDate : Text, endDate : Text) : Project.Type {
    let newProject : Project.Type = {
      id = nextProjectId;
      title;
      description;
      startDate;
      endDate;
      status = #planning;
      assignedInterns = Set.empty<Principal>();
    };
    projects.add(nextProjectId, newProject);
    nextProjectId += 1;
    newProject;
  };

  public shared ({ caller }) func createProject({ title : Text; description : Text; startDate : Text; endDate : Text }) : async Project.View {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can create projects");
    };
    Project.toView(createProjectInternal(title, description, startDate, endDate));
  };

  func getProjectById(id : Nat) : Project.Type {
    switch (projects.get(id)) {
      case (null) { Runtime.trap("Project not found") };
      case (?project) { project };
    };
  };

  func updateProjectInternal(project : Project.Type) {
    projects.add(project.id, project);
  };

  public shared ({ caller }) func updateProject(project : Project.View) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update projects");
    };
    let existingProject = getProjectById(project.id);
    updateProjectInternal({
      project with
      assignedInterns = Set.fromArray(project.assignedInterns);
    });
  };

  public shared ({ caller }) func removeProject(id : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can remove projects");
    };
    let existingProject = getProjectById(id);
    projects.remove(id);
  };

  // --- Project Assignment Functions ---
  public shared ({ caller }) func assignInternToProject({ projectId : Nat; internPrincipal : Principal }) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can assign interns to projects");
    };
    updateProjectWithIntern(projectId, internPrincipal, true);
    // Notify the intern
    let project = getProjectById(projectId);
    createNotificationInternal(
      internPrincipal,
      #projectAssigned,
      "You have been assigned to project: " # project.title,
      projectId
    );
  };

  public shared ({ caller }) func unassignInternFromProject({ projectId : Nat; internPrincipal : Principal }) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can unassign interns from projects");
    };
    updateProjectWithIntern(projectId, internPrincipal, false);
  };

  func updateProjectWithIntern(projectId : Nat, internPrincipal : Principal, assign : Bool) {
    let existingProject = getProjectById(projectId);
    let updatedAssignedInterns = Set.empty<Principal>();
    for (intern in existingProject.assignedInterns.values()) {
      if (intern != internPrincipal) { updatedAssignedInterns.add(intern) };
    };
    if (assign) {
      updatedAssignedInterns.add(internPrincipal);
    };
    let updatedProject : Project.Type = {
      existingProject with
      assignedInterns = updatedAssignedInterns;
    };
    updateProjectInternal(updatedProject);
  };

  // --- Activity Log Functions ---
  func createActivityLogInternal(caller : Principal, projectId : Nat, title : Text, description : Text, date : Text, hours : Nat) : ActivityLog.Type {
    let newLog : ActivityLog.Type = {
      id = nextActivityId;
      internPrincipal = caller;
      projectId;
      title;
      description;
      date;
      hours;
      createdAt = Time.now();
    };
    activityLogs.add(nextActivityId, newLog);
    nextActivityId += 1;
    newLog;
  };

  public shared ({ caller }) func logActivity(projectId : Nat, title : Text, description : Text, date : Text, hours : Nat) : async ActivityLog.View {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only interns can log activities");
    };
    createActivityLogInternal(caller, projectId, title, description, date, hours);
  };

  public query ({ caller }) func getActivitiesForIntern(intern : Principal) : async [ActivityLog.View] {
    if (caller != intern and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own activities");
    };
    let filteredResults = List.empty<ActivityLog.Type>();
    for (log in activityLogs.values()) {
      if (log.internPrincipal == intern) {
        filteredResults.add(log);
      };
    };
    filteredResults.toArray();
  };

  public query ({ caller }) func getActivitiesForProject(projectId : Nat) : async [ActivityLog.View] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can view project activities");
    };
    let project = getProjectById(projectId);
    if (not project.assignedInterns.contains(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: You are not assigned to this project");
    };
    let filteredResults = List.empty<ActivityLog.Type>();
    for (log in activityLogs.values()) {
      if (log.projectId == projectId) {
        filteredResults.add(log);
      };
    };
    filteredResults.toArray();
  };

  public query ({ caller }) func getAllActivities() : async [ActivityLog.View] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all activities");
    };
    activityLogs.values().toArray();
  };

  // --- Messaging Functions ---
  func createMessageInternal(caller : Principal, recipient : Principal, content : Text) : Message.Type {
    let newMessage : Message.Type = {
      id = nextMessageId;
      sender = caller;
      recipient;
      content;
      timestamp = Time.now();
      isRead = false;
    };
    messages.add(nextMessageId, newMessage);
    nextMessageId += 1;
    newMessage;
  };

  public shared ({ caller }) func sendMessage(recipient : Principal, content : Text) : async Message.View {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can send messages");
    };
    createMessageInternal(caller, recipient, content);
  };

  public query ({ caller }) func getMessagesForCaller() : async [Message.View] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can view messages");
    };
    let filteredResults = List.empty<Message.Type>();
    for (message in messages.values()) {
      if (message.sender == caller or message.recipient == caller) {
        filteredResults.add(message);
      };
    };
    filteredResults.toArray();
  };

  public query ({ caller }) func getConversation(otherUser : Principal) : async [Message.View] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can view conversations");
    };
    let filteredResults = List.empty<Message.Type>();
    for (message in messages.values()) {
      if ((message.sender == caller and message.recipient == otherUser) or (message.sender == otherUser and message.recipient == caller)) {
        filteredResults.add(message);
      };
    };
    filteredResults.toArray();
  };

  public shared ({ caller }) func markMessageRead(messageId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can mark messages as read");
    };
    switch (messages.get(messageId)) {
      case (null) { Runtime.trap("Message not found") };
      case (?message) {
        if (message.recipient != caller) {
          Runtime.trap("Unauthorized: Only the recipient can mark messages as read");
        };
        messages.add(messageId, { message with isRead = true });
      };
    };
  };

  public query ({ caller }) func getUnreadCount() : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can get unread count");
    };
    var count = 0;
    for (message in messages.values()) {
      if (message.recipient == caller and not message.isRead) {
        count += 1;
      };
    };
    count;
  };

  // --- Milestone Functions ---
  public shared ({ caller }) func createMilestone({ projectId : Nat; title : Text; description : Text; dueDate : Text }) : async Milestone.View {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only interns can create milestones");
    };
    let newMilestone : Milestone.Type = {
      id = nextMilestoneId;
      internPrincipal = caller;
      projectId;
      title;
      description;
      status = #pending;
      dueDate;
      createdAt = Time.now();
    };
    milestones.add(nextMilestoneId, newMilestone);
    nextMilestoneId += 1;
    newMilestone;
  };

  public shared ({ caller }) func updateMilestoneStatus(milestoneId : Nat, status : MilestoneStatus.Type) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can update milestones");
    };
    switch (milestones.get(milestoneId)) {
      case (null) { Runtime.trap("Milestone not found") };
      case (?milestone) {
        if (milestone.internPrincipal != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only update your own milestones");
        };
        milestones.add(milestoneId, { milestone with status });
        // If milestone completed, notify all admins
        if (status == #completed) {
          for ((principal, user) in userProfiles.entries()) {
            if (AccessControl.isAdmin(accessControlState, principal)) {
              createNotificationInternal(
                principal,
                #milestoneUpdate,
                "Milestone completed: " # milestone.title,
                milestoneId
              );
            };
          };
        };
      };
    };
  };

  public query ({ caller }) func getMilestonesForIntern(intern : Principal) : async [Milestone.View] {
    if (caller != intern and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own milestones");
    };
    let filteredResults = List.empty<Milestone.Type>();
    for (m in milestones.values()) {
      if (m.internPrincipal == intern) {
        filteredResults.add(m);
      };
    };
    filteredResults.toArray();
  };

  public query ({ caller }) func getMilestonesForProject(projectId : Nat) : async [Milestone.View] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can view milestones");
    };
    let project = getProjectById(projectId);
    if (not project.assignedInterns.contains(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: You are not assigned to this project");
    };
    let filteredResults = List.empty<Milestone.Type>();
    for (m in milestones.values()) {
      if (m.projectId == projectId) {
        filteredResults.add(m);
      };
    };
    filteredResults.toArray();
  };

  public query ({ caller }) func getAllMilestones() : async [Milestone.View] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all milestones");
    };
    milestones.values().toArray();
  };

  // --- Notification Functions ---
  public query ({ caller }) func getNotificationsForCaller() : async [Notification.View] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can view notifications");
    };
    let filteredResults = List.empty<Notification.Type>();
    for (n in notifications.values()) {
      if (n.recipientPrincipal == caller) {
        filteredResults.add(n);
      };
    };
    filteredResults.toArray().sort(func(a, b) { Int.compare(b.timestamp, a.timestamp) });
  };

  public query ({ caller }) func getUnreadNotificationCount() : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can get notification count");
    };
    var count = 0;
    for (n in notifications.values()) {
      if (n.recipientPrincipal == caller and not n.isRead) {
        count += 1;
      };
    };
    count;
  };

  public shared ({ caller }) func markNotificationRead(notificationId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can mark notifications as read");
    };
    switch (notifications.get(notificationId)) {
      case (null) { Runtime.trap("Notification not found") };
      case (?notification) {
        if (notification.recipientPrincipal != caller) {
          Runtime.trap("Unauthorized: Can only mark your own notifications as read");
        };
        notifications.add(notificationId, { notification with isRead = true });
      };
    };
  };

  public shared ({ caller }) func markAllNotificationsRead() : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can mark notifications as read");
    };
    for ((id, notification) in notifications.entries()) {
      if (notification.recipientPrincipal == caller and not notification.isRead) {
        notifications.add(id, { notification with isRead = true });
      };
    };
  };

  // --- Analytics Functions ---
  public query ({ caller }) func getAnalyticsSummary() : async AnalyticsSummary.Type {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view analytics");
    };
    var totalHours = 0;
    let hoursByProjectMap = Map.empty<Nat, Nat>();
    for (log in activityLogs.values()) {
      totalHours += log.hours;
      let existing = switch (hoursByProjectMap.get(log.projectId)) {
        case (null) { 0 };
        case (?h) { h };
      };
      hoursByProjectMap.add(log.projectId, existing + log.hours);
    };
    var completedMilestones = 0;
    for (m in milestones.values()) {
      if (m.status == #completed) { completedMilestones += 1 };
    };
    var activeInternCount = 0;
    for ((_, user) in userProfiles.entries()) {
      if (user.registrationStatus == #active) { activeInternCount += 1 };
    };
    let allActivities = activityLogs.values().toArray();
    let sortedActivities = allActivities.sort(func(a, b) { Int.compare(b.createdAt, a.createdAt) });
    let recentCount = if (sortedActivities.size() < 10) sortedActivities.size() else 10;
    let recentActivities = Array.tabulate(recentCount, func(i : Nat) : ActivityLog.Type { sortedActivities[i] });
    {
      totalHours;
      totalActivities = activityLogs.size();
      totalMilestones = milestones.size();
      completedMilestones;
      activeInternCount;
      projectCount = projects.size();
      hoursByProject = hoursByProjectMap.entries().toArray();
      recentActivities;
    };
  };

  // --- Intern Registration Functions ---
  public shared ({ caller }) func registerIntern({ name : Text; bio : Text; email : Text }) : async () {
    if (userProfiles.containsKey(caller)) {
      Runtime.trap("User profile already exists.");
    };
    let newState : UserProfile.Type = {
      name;
      bio;
      email;
      skills = Set.empty<Text>();
      registrationStatus = #pending;
    };
    userProfiles.add(caller, newState);
    // Notify all admins about new approval request
    for ((principal, _) in userProfiles.entries()) {
      if (AccessControl.isAdmin(accessControlState, principal)) {
        createNotificationInternal(
          principal,
          #newApprovalRequest,
          "New intern registration request from: " # name,
          0
        );
      };
    };
  };

  public shared ({ caller }) func updateProfile({ name : Text; bio : Text; email : Text; skills : [Text] }) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can update profiles");
    };
    let existingState = getUserProfileInternal(caller);
    let updatedState : UserProfile.Type = {
      existingState with
      name;
      bio;
      email;
      skills = Set.fromArray<Text>(skills);
    };
    userProfiles.add(caller, updatedState);
  };

  public shared ({ caller }) func approveInternRegistration(userPrincipal : Principal) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can approve registrations");
    };
    approveRegistration(userPrincipal);
  };

  public shared ({ caller }) func rejectInternRegistration(userPrincipal : Principal) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can reject registrations");
    };
    rejectRegistration(userPrincipal);
  };

  func approveRegistration(userPrincipal : Principal) {
    let existingState = getUserProfileInternal(userPrincipal);
    let updatedState : UserProfile.Type = {
      existingState with
      registrationStatus = #active;
    };
    userProfiles.add(userPrincipal, updatedState);
  };

  func rejectRegistration(userPrincipal : Principal) {
    let existingState = getUserProfileInternal(userPrincipal);
    let updatedState : UserProfile.Type = {
      existingState with
      registrationStatus = #rejected;
    };
    userProfiles.add(userPrincipal, updatedState);
  };

  func getUserProfileInternal(userPrincipal : Principal) : UserProfile.Type {
    switch (userProfiles.get(userPrincipal)) {
      case (null) { Runtime.trap("User does not exist") };
      case (?profile) { profile };
    };
  };

  // --- Admin Promotion Function
  public shared ({ caller }) func promoteToAdmin(user : Principal) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can promote to admin");
    };
    AccessControl.assignRole(accessControlState, caller, user, #admin);
  };

  // --- Miscellaneous Utility Functions ---
  func compareProjectsByTitle(projectA : Project.View, projectB : Project.View) : Order.Order {
    Text.compare(projectA.title, projectB.title);
  };

  func getAllUserProfilesInternal() : [UserProfile.View] {
    userProfiles.entries().toArray().map(
      func((p, u)) { UserProfile.toView(u, p) }
    ).sort(UserProfile.ViewCompare.compareByName);
  };

  func getUsersByRegistrationStatus(status : RegistrationStatus.Type) : [UserProfile.View] {
    let filteredResults = List.empty<(Principal, UserProfile.Type)>();
    for ((principal, user) in userProfiles.entries()) {
      if (user.registrationStatus == status) {
        filteredResults.add((principal, user));
      };
    };
    filteredResults.toArray().map(func((p, u)) { UserProfile.toView(u, p) }).sort(UserProfile.ViewCompare.compareByName);
  };

  public query ({ caller }) func getAllProjects() : async [Project.View] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can view projects");
    };
    projects.values().toArray().map(Project.toView).sort(compareProjectsByTitle);
  };

  public query ({ caller }) func getProjectsByStatus(status : ProjectStatus.Type) : async [Project.View] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can view projects");
    };
    let filteredResults = List.empty<Project.Type>();
    for (project in projects.values()) {
      if (project.status == status) {
        filteredResults.add(project);
      };
    };
    filteredResults.toArray().map(Project.toView);
  };

  public query ({ caller }) func getProjectsForIntern(intern : Principal) : async [Project.View] {
    if (caller != intern and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own assigned projects");
    };
    let filteredResults = List.empty<Project.Type>();
    for (project in projects.values()) {
      if (project.assignedInterns.contains(intern)) {
        filteredResults.add(project);
      };
    };
    filteredResults.toArray().map(Project.toView);
  };

  public query ({ caller }) func getProject(id : Nat) : async ?Project.View {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can view projects");
    };
    projects.get(id).map(Project.toView);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile.View {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can view profiles");
    };
    userProfiles.get(caller).map(func(p) { UserProfile.toView(p, caller) });
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile.View {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user).map(func(p) { UserProfile.toView(p, user) });
  };

  public query ({ caller }) func getUserRole(user : Principal) : async UserRole.Type {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own role");
    };
    AccessControl.getUserRole(accessControlState, user);
  };

  public query ({ caller }) func getAllUsers() : async [UserProfile.View] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all users");
    };
    getAllUserProfilesInternal();
  };

  public query ({ caller }) func getAllInterns() : async [UserProfile.View] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all interns");
    };
    let filteredResults = List.empty<(Principal, UserProfile.Type)>();
    for ((principal, user) in userProfiles.entries()) {
      if (user.registrationStatus == #active) {
        filteredResults.add((principal, user));
      };
    };
    filteredResults.toArray().map(func((p, u)) { UserProfile.toView(u, p) }).sort(UserProfile.ViewCompare.compareByName);
  };

  public query ({ caller }) func getAllPendingInterns() : async [UserProfile.View] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view pending interns");
    };
    getUsersByRegistrationStatus(#pending);
  };

  public query ({ caller }) func getAllRejectedInterns() : async [UserProfile.View] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view rejected interns");
    };
    getUsersByRegistrationStatus(#rejected);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile.View) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can save profiles");
    };
    userProfiles.add(
      caller,
      {
        profile with
        skills = Set.fromArray(profile.skills);
      },
    );
  };
};
