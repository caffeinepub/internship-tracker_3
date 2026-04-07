import Map "mo:core/Map";
import Array "mo:core/Array";
import List "mo:core/List";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Set "mo:core/Set";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Migration "migration";

(with migration = Migration.run)
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
      photoUrl : ?Text;
      links : [Text];
    };
    public type View = {
      principal : Principal;
      name : Text;
      bio : Text;
      email : Text;
      registrationStatus : RegistrationStatus.Type;
      skills : [Text];
      photoUrl : ?Text;
      links : [Text];
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
  module Subtask {
    public type Type = {
      id : Text;
      title : Text;
      isCompleted : Bool;
      dueDate : ?Int;
    };
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
      tags : [Text];
      isPinned : Bool;
      subtasks : [Subtask.Type];
    };
    public type View = {
      id : Nat;
      title : Text;
      description : Text;
      startDate : Text;
      endDate : Text;
      status : ProjectStatus.Type;
      assignedInterns : [Principal];
      tags : [Text];
      isPinned : Bool;
      subtasks : [Subtask.Type];
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
  module MessageType {
    public type Type = { #text; #file; #image; #systemMsg };
  };
  module Message {
    public type Type = {
      id : Nat;
      sender : Principal;
      recipient : Principal;
      content : Text;
      timestamp : Int;
      isRead : Bool;
      messageType : MessageType.Type;
      fileUrl : ?Text;
      fileName : ?Text;
      fileSize : ?Nat;
    };
    public type View = {
      id : Nat;
      sender : Principal;
      recipient : Principal;
      content : Text;
      timestamp : Int;
      isRead : Bool;
      messageType : MessageType.Type;
      fileUrl : ?Text;
      fileName : ?Text;
      fileSize : ?Nat;
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
      #announcement;
      #commitPushed;
      #performanceScored;
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
  module ExtensionStatus {
    public type Type = { #pending; #approved; #rejected };
  };
  module ExtensionRequest {
    public type Type = {
      id : Nat;
      projectId : Nat;
      internPrincipal : Principal;
      reason : Text;
      requestedEndDate : Text;
      status : ExtensionStatus.Type;
      adminNote : ?Text;
      createdAt : Int;
    };
    public type View = {
      id : Nat;
      projectId : Nat;
      internPrincipal : Principal;
      reason : Text;
      requestedEndDate : Text;
      status : ExtensionStatus.Type;
      adminNote : ?Text;
      createdAt : Int;
    };
  };

  // --- Phase 6 Types ---

  module FileEntry {
    public type Type = {
      name : Text;
      content : Text;
      path : Text;
    };
  };

  module CommitRecord {
    public type Type = {
      id : Text;
      branchId : Text;
      authorId : Principal;
      message : Text;
      timestamp : Int;
      files : [FileEntry.Type];
      parentCommitId : ?Text;
    };
  };

  module BranchInfo {
    public type Type = {
      id : Text;
      name : Text;
      ownerId : Principal;
      projectId : Text;
      isLocked : Bool;
    };
  };

  module FileVersion {
    public type Type = {
      commitId : Text;
      fileName : Text;
      content : Text;
      timestamp : Int;
    };
  };

  module Announcement {
    public type Type = {
      id : Text;
      authorId : Principal;
      title : Text;
      content : Text;
      timestamp : Int;
      isActive : Bool;
    };
  };

  module PerformanceScore {
    public type Type = {
      internId : Principal;
      adminId : Principal;
      score : Nat;
      feedback : Text;
      timestamp : Int;
      category : Text;
    };
  };

  module OnboardingItem {
    public type Type = {
      id : Text;
      title : Text;
      isCompleted : Bool;
      completedAt : ?Int;
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
  var nextExtensionRequestId = 1;
  var idCounter = 0;

  let userProfiles = Map.empty<Principal, UserProfile.Type>();
  let projects = Map.empty<Nat, Project.Type>();
  let activityLogs = Map.empty<Nat, ActivityLog.Type>();
  let messages = Map.empty<Nat, Message.Type>();
  let milestones = Map.empty<Nat, Milestone.Type>();
  let notifications = Map.empty<Nat, Notification.Type>();
  let extensionRequests = Map.empty<Nat, ExtensionRequest.Type>();

  // Phase 6 state
  let branches = Map.empty<Text, BranchInfo.Type>();
  let commits = Map.empty<Text, CommitRecord.Type>();
  let announcements = Map.empty<Text, Announcement.Type>();
  let performanceScores = List.empty<PerformanceScore.Type>();
  let onboardingChecklists = Map.empty<Principal, List.List<OnboardingItem.Type>>();

  // --- ID Generation Helper ---
  func generateId() : Text {
    idCounter += 1;
    Time.now().toText() # "_" # idCounter.toText();
  };

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
      tags = [];
      isPinned = false;
      subtasks = [];
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
    let _ = getProjectById(id);
    projects.remove(id);
  };

  // --- Project Assignment Functions ---
  public shared ({ caller }) func assignInternToProject({ projectId : Nat; internPrincipal : Principal }) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can assign interns to projects");
    };
    updateProjectWithIntern(projectId, internPrincipal, true);
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

  // --- Project Enhancement Functions ---
  public shared ({ caller }) func addProjectTag(projectId : Nat, tag : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can add project tags");
    };
    let project = getProjectById(projectId);
    let existingTags = project.tags;
    // Only add if not already present
    let alreadyExists = existingTags.find(func(t : Text) : Bool { t == tag });
    switch (alreadyExists) {
      case (?_) {};
      case null {
        updateProjectInternal({ project with tags = existingTags.concat([tag]) });
      };
    };
  };

  public shared ({ caller }) func toggleProjectPin(projectId : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can pin/unpin projects");
    };
    let project = getProjectById(projectId);
    updateProjectInternal({ project with isPinned = not project.isPinned });
  };

  public shared ({ caller }) func addSubtask(projectId : Nat, title : Text, dueDate : ?Int) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can add subtasks");
    };
    let project = getProjectById(projectId);
    let newSubtask : Subtask.Type = {
      id = generateId();
      title;
      isCompleted = false;
      dueDate;
    };
    updateProjectInternal({ project with subtasks = project.subtasks.concat([newSubtask]) });
  };

  public shared ({ caller }) func toggleSubtask(projectId : Nat, subtaskId : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can toggle subtasks");
    };
    let project = getProjectById(projectId);
    let updatedSubtasks = project.subtasks.map(
      func(st : Subtask.Type) : Subtask.Type {
        if (st.id == subtaskId) { { st with isCompleted = not st.isCompleted } } else { st };
      }
    );
    updateProjectInternal({ project with subtasks = updatedSubtasks });
  };

  public query ({ caller }) func getPinnedProjects() : async [Project.View] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view pinned projects");
    };
    projects.values().toArray().filter(func(p : Project.Type) : Bool { p.isPinned }).map(Project.toView);
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
  func createMessageInternal(caller : Principal, recipient : Principal, content : Text, msgType : MessageType.Type, fileUrl : ?Text, fileName : ?Text, fileSize : ?Nat) : Message.Type {
    let newMessage : Message.Type = {
      id = nextMessageId;
      sender = caller;
      recipient;
      content;
      timestamp = Time.now();
      isRead = false;
      messageType = msgType;
      fileUrl;
      fileName;
      fileSize;
    };
    messages.add(nextMessageId, newMessage);
    nextMessageId += 1;
    newMessage;
  };

  public shared ({ caller }) func sendMessage(recipient : Principal, content : Text) : async Message.View {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can send messages");
    };
    createMessageInternal(caller, recipient, content, #text, null, null, null);
  };

  public shared ({ caller }) func sendFileMessage(recipient : Principal, fileUrl : Text, fileName : Text, fileSize : Nat, messageType : { #file; #image }) : async Message.View {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can send file messages");
    };
    let msgType : MessageType.Type = switch (messageType) {
      case (#file) { #file };
      case (#image) { #image };
    };
    createMessageInternal(caller, recipient, "", msgType, ?fileUrl, ?fileName, ?fileSize);
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
      if (
        (message.sender == caller and message.recipient == otherUser) or
        (message.sender == otherUser and message.recipient == caller)
      ) {
        filteredResults.add(message);
      };
    };
    filteredResults.toArray().sort(func(a : Message.Type, b : Message.Type) : Order.Order {
      Int.compare(a.timestamp, b.timestamp)
    });
  };

  public query ({ caller }) func getConversationMessages(withUser : Principal, limit : Nat, before : ?Int) : async [Message.View] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can view conversations");
    };
    let filteredResults = List.empty<Message.Type>();
    for (message in messages.values()) {
      let inConversation = (message.sender == caller and message.recipient == withUser) or
                           (message.sender == withUser and message.recipient == caller);
      let beforeFilter = switch (before) {
        case (null) { true };
        case (?ts) { message.timestamp < ts };
      };
      if (inConversation and beforeFilter) {
        filteredResults.add(message);
      };
    };
    let sorted = filteredResults.toArray().sort(func(a : Message.Type, b : Message.Type) : Order.Order {
      Int.compare(b.timestamp, a.timestamp)
    });
    let takeCount = if (sorted.size() < limit) sorted.size() else limit;
    Array.tabulate(takeCount, func(i : Nat) : Message.Type { sorted[i] }).sort(
      func(a : Message.Type, b : Message.Type) : Order.Order { Int.compare(a.timestamp, b.timestamp) }
    );
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
        if (status == #completed) {
          for ((principal, _) in userProfiles.entries()) {
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

  // --- Extension Request Functions ---
  public shared ({ caller }) func requestProjectExtension(projectId : Nat, reason : Text, requestedEndDate : Text) : async ExtensionRequest.View {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only interns can request extensions");
    };
    let project = getProjectById(projectId);
    if (not project.assignedInterns.contains(caller)) {
      Runtime.trap("Unauthorized: You are not assigned to this project");
    };
    for (req in extensionRequests.values()) {
      if (req.projectId == projectId and req.internPrincipal == caller and req.status == #pending) {
        Runtime.trap("A pending extension request already exists for this project");
      };
    };
    let newRequest : ExtensionRequest.Type = {
      id = nextExtensionRequestId;
      projectId;
      internPrincipal = caller;
      reason;
      requestedEndDate;
      status = #pending;
      adminNote = null;
      createdAt = Time.now();
    };
    extensionRequests.add(nextExtensionRequestId, newRequest);
    nextExtensionRequestId += 1;
    for ((principal, _) in userProfiles.entries()) {
      if (AccessControl.isAdmin(accessControlState, principal)) {
        createNotificationInternal(
          principal,
          #milestoneUpdate,
          "Extension request submitted for project: " # project.title,
          newRequest.id
        );
      };
    };
    newRequest;
  };

  public query ({ caller }) func getExtensionRequestsForIntern(intern : Principal) : async [ExtensionRequest.View] {
    if (caller != intern and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own extension requests");
    };
    let filteredResults = List.empty<ExtensionRequest.Type>();
    for (req in extensionRequests.values()) {
      if (req.internPrincipal == intern) {
        filteredResults.add(req);
      };
    };
    filteredResults.toArray().sort(func(a : ExtensionRequest.Type, b : ExtensionRequest.Type) : Order.Order {
      Int.compare(b.createdAt, a.createdAt)
    });
  };

  public query ({ caller }) func getAllExtensionRequests() : async [ExtensionRequest.View] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all extension requests");
    };
    extensionRequests.values().toArray().sort(func(a : ExtensionRequest.Type, b : ExtensionRequest.Type) : Order.Order {
      Int.compare(b.createdAt, a.createdAt)
    });
  };

  public shared ({ caller }) func respondToExtensionRequest(requestId : Nat, approved : Bool, adminNote : ?Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can respond to extension requests");
    };
    switch (extensionRequests.get(requestId)) {
      case (null) { Runtime.trap("Extension request not found") };
      case (?req) {
        if (req.status != #pending) {
          Runtime.trap("Extension request already processed");
        };
        let newStatus = if (approved) { #approved } else { #rejected };
        extensionRequests.add(requestId, { req with status = newStatus; adminNote });
        if (approved) {
          let project = getProjectById(req.projectId);
          updateProjectInternal({ project with endDate = req.requestedEndDate });
        };
        let statusText = if (approved) { "approved" } else { "rejected" };
        let project = getProjectById(req.projectId);
        createNotificationInternal(
          req.internPrincipal,
          #projectAssigned,
          "Your extension request for project \"" # project.title # "\" was " # statusText,
          requestId
        );
      };
    };
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
    filteredResults.toArray().sort(func(a : Notification.Type, b : Notification.Type) : Order.Order {
      Int.compare(b.timestamp, a.timestamp)
    });
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
    let sortedActivities = allActivities.sort(func(a : ActivityLog.Type, b : ActivityLog.Type) : Order.Order {
      Int.compare(b.createdAt, a.createdAt)
    });
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
      photoUrl = null;
      links = [];
    };
    userProfiles.add(caller, newState);
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
    // Initialize onboarding checklist for new intern
    initOnboardingForIntern(caller);
  };

  public shared ({ caller }) func updateProfile({ name : Text; bio : Text; email : Text; skills : [Text]; photoUrl : ?Text; links : [Text] }) : async () {
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
      photoUrl;
      links;
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
    userProfiles.add(userPrincipal, { existingState with registrationStatus = #active });
  };

  func rejectRegistration(userPrincipal : Principal) {
    let existingState = getUserProfileInternal(userPrincipal);
    userProfiles.add(userPrincipal, { existingState with registrationStatus = #rejected });
  };

  func getUserProfileInternal(userPrincipal : Principal) : UserProfile.Type {
    switch (userProfiles.get(userPrincipal)) {
      case (null) { Runtime.trap("User does not exist") };
      case (?profile) { profile };
    };
  };

  // --- Admin Promotion Function ---
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
      func((p, u) : (Principal, UserProfile.Type)) : UserProfile.View { UserProfile.toView(u, p) }
    ).sort(UserProfile.ViewCompare.compareByName);
  };

  func getUsersByRegistrationStatus(status : RegistrationStatus.Type) : [UserProfile.View] {
    let filteredResults = List.empty<(Principal, UserProfile.Type)>();
    for ((principal, user) in userProfiles.entries()) {
      if (user.registrationStatus == status) {
        filteredResults.add((principal, user));
      };
    };
    filteredResults.toArray().map(
      func((p, u) : (Principal, UserProfile.Type)) : UserProfile.View { UserProfile.toView(u, p) }
    ).sort(UserProfile.ViewCompare.compareByName);
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
    userProfiles.get(caller).map(func(p : UserProfile.Type) : UserProfile.View { UserProfile.toView(p, caller) });
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile.View {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user).map(func(p : UserProfile.Type) : UserProfile.View { UserProfile.toView(p, user) });
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
    filteredResults.toArray().map(
      func((p, u) : (Principal, UserProfile.Type)) : UserProfile.View { UserProfile.toView(u, p) }
    ).sort(UserProfile.ViewCompare.compareByName);
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
    let existing = userProfiles.get(caller);
    let photoUrl = switch (existing) {
      case (?p) { p.photoUrl };
      case null { null };
    };
    let links = switch (existing) {
      case (?p) { p.links };
      case null { [] };
    };
    userProfiles.add(
      caller,
      {
        profile with
        skills = Set.fromArray(profile.skills);
        photoUrl = switch (profile.photoUrl) { case (?u) { ?u }; case null { photoUrl } };
        links = if (profile.links.size() > 0) profile.links else links;
      },
    );
  };

  // --- Search Functions ---
  public query ({ caller }) func searchInterns(searchTerm : Text) : async [UserProfile.View] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can search interns");
    };
    let lowerQuery = searchTerm.toLower();
    let filteredResults = List.empty<(Principal, UserProfile.Type)>();
    for ((principal, user) in userProfiles.entries()) {
      if (
        user.name.toLower().contains(#text lowerQuery) or
        user.email.toLower().contains(#text lowerQuery)
      ) {
        filteredResults.add((principal, user));
      };
    };
    filteredResults.toArray().map(
      func((p, u) : (Principal, UserProfile.Type)) : UserProfile.View { UserProfile.toView(u, p) }
    );
  };

  public query ({ caller }) func searchProjects(searchTerm : Text) : async [Project.View] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can search projects");
    };
    let lowerQuery = searchTerm.toLower();
    let filteredResults = List.empty<Project.Type>();
    for (project in projects.values()) {
      if (
        project.title.toLower().contains(#text lowerQuery) or
        project.description.toLower().contains(#text lowerQuery)
      ) {
        filteredResults.add(project);
      };
    };
    filteredResults.toArray().map(Project.toView);
  };

  // ============================================================
  // --- Phase 6: Commit/Version System ---
  // ============================================================

  public shared ({ caller }) func createBranch(name : Text, projectId : Text, ownerId : Principal) : async BranchInfo.Type {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can create branches");
    };
    let branchId = generateId();
    let newBranch : BranchInfo.Type = {
      id = branchId;
      name;
      ownerId;
      projectId;
      isLocked = false;
    };
    branches.add(branchId, newBranch);
    newBranch;
  };

  public query ({ caller }) func getBranchForIntern(internId : Principal) : async ?BranchInfo.Type {
    if (caller != internId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own branch");
    };
    branches.values().toArray().find(func(b : BranchInfo.Type) : Bool { b.ownerId == internId });
  };

  public query ({ caller }) func getAllBranches() : async [BranchInfo.Type] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all branches");
    };
    branches.values().toArray();
  };

  public shared ({ caller }) func toggleBranchLock(branchId : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can lock/unlock branches");
    };
    switch (branches.get(branchId)) {
      case (null) { Runtime.trap("Branch not found") };
      case (?branch) {
        branches.add(branchId, { branch with isLocked = not branch.isLocked });
      };
    };
  };

  public shared ({ caller }) func pushCommit(branchId : Text, message : Text, files : [FileEntry.Type]) : async CommitRecord.Type {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can push commits");
    };
    let branch = switch (branches.get(branchId)) {
      case (null) { Runtime.trap("Branch not found") };
      case (?b) { b };
    };
    if (branch.isLocked) {
      Runtime.trap("Branch is locked. Contact your admin.");
    };
    if (branch.ownerId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: You do not own this branch");
    };
    // Find latest commit to set as parent
    let branchCommits = commits.values().toArray().filter(func(c : CommitRecord.Type) : Bool { c.branchId == branchId });
    let sortedCommits = branchCommits.sort(func(a : CommitRecord.Type, b : CommitRecord.Type) : Order.Order {
      Int.compare(b.timestamp, a.timestamp)
    });
    let parentCommitId = if (sortedCommits.size() > 0) { ?sortedCommits[0].id } else { null };
    let commitId = generateId();
    let newCommit : CommitRecord.Type = {
      id = commitId;
      branchId;
      authorId = caller;
      message;
      timestamp = Time.now();
      files;
      parentCommitId;
    };
    commits.add(commitId, newCommit);
    // Notify all admins about new commit
    for ((principal, _) in userProfiles.entries()) {
      if (AccessControl.isAdmin(accessControlState, principal)) {
        createNotificationInternal(
          principal,
          #commitPushed,
          "New commit pushed to branch: " # branch.name # " — " # message,
          0
        );
      };
    };
    newCommit;
  };

  public query ({ caller }) func getCommitsForBranch(branchId : Text) : async [CommitRecord.Type] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can view commits");
    };
    let branch = switch (branches.get(branchId)) {
      case (null) { Runtime.trap("Branch not found") };
      case (?b) { b };
    };
    if (branch.ownerId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: You do not have access to this branch");
    };
    commits.values().toArray().filter(func(c : CommitRecord.Type) : Bool { c.branchId == branchId }).sort(
      func(a : CommitRecord.Type, b : CommitRecord.Type) : Order.Order { Int.compare(b.timestamp, a.timestamp) }
    );
  };

  public query ({ caller }) func getAllCommits() : async [CommitRecord.Type] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all commits");
    };
    commits.values().toArray().sort(func(a : CommitRecord.Type, b : CommitRecord.Type) : Order.Order {
      Int.compare(b.timestamp, a.timestamp)
    });
  };

  public query ({ caller }) func getCommitById(commitId : Text) : async ?CommitRecord.Type {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can view commits");
    };
    commits.get(commitId);
  };

  public query ({ caller }) func getFileHistory(branchId : Text, fileName : Text) : async [FileVersion.Type] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can view file history");
    };
    let branch = switch (branches.get(branchId)) {
      case (null) { Runtime.trap("Branch not found") };
      case (?b) { b };
    };
    if (branch.ownerId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: You do not have access to this branch");
    };
    let versions = List.empty<FileVersion.Type>();
    let branchCommits = commits.values().toArray().filter(func(c : CommitRecord.Type) : Bool { c.branchId == branchId });
    let sortedCommits = branchCommits.sort(func(a : CommitRecord.Type, b : CommitRecord.Type) : Order.Order {
      Int.compare(b.timestamp, a.timestamp)
    });
    for (commit in sortedCommits.values()) {
      for (file in commit.files.values()) {
        if (file.name == fileName or file.path == fileName) {
          versions.add({
            commitId = commit.id;
            fileName = file.name;
            content = file.content;
            timestamp = commit.timestamp;
          });
        };
      };
    };
    versions.toArray();
  };

  public query ({ caller }) func getLatestFiles(branchId : Text) : async [FileEntry.Type] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can view files");
    };
    let branch = switch (branches.get(branchId)) {
      case (null) { Runtime.trap("Branch not found") };
      case (?b) { b };
    };
    if (branch.ownerId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: You do not have access to this branch");
    };
    let branchCommits = commits.values().toArray().filter(func(c : CommitRecord.Type) : Bool { c.branchId == branchId });
    let sortedCommits = branchCommits.sort(func(a : CommitRecord.Type, b : CommitRecord.Type) : Order.Order {
      Int.compare(b.timestamp, a.timestamp)
    });
    // Build latest version of each file (latest commit wins per path)
    let latestByPath = Map.empty<Text, FileEntry.Type>();
    // Process oldest to newest so newest overwrites
    let reversedCommits = sortedCommits.reverse();
    for (commit in reversedCommits.values()) {
      for (file in commit.files.values()) {
        latestByPath.add(file.path, file);
      };
    };
    latestByPath.values().toArray();
  };

  // ============================================================
  // --- Phase 6: Announcements ---
  // ============================================================

  public shared ({ caller }) func createAnnouncement(title : Text, content : Text) : async Announcement.Type {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can create announcements");
    };
    let announcementId = generateId();
    let newAnnouncement : Announcement.Type = {
      id = announcementId;
      authorId = caller;
      title;
      content;
      timestamp = Time.now();
      isActive = true;
    };
    announcements.add(announcementId, newAnnouncement);
    // Notify all active interns
    for ((principal, user) in userProfiles.entries()) {
      if (user.registrationStatus == #active) {
        createNotificationInternal(
          principal,
          #announcement,
          "New announcement: " # title,
          0
        );
      };
    };
    newAnnouncement;
  };

  public query ({ caller }) func getActiveAnnouncements() : async [Announcement.Type] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can view announcements");
    };
    announcements.values().toArray().filter(func(a : Announcement.Type) : Bool { a.isActive }).sort(
      func(a : Announcement.Type, b : Announcement.Type) : Order.Order { Int.compare(b.timestamp, a.timestamp) }
    );
  };

  public query ({ caller }) func getAllAnnouncements() : async [Announcement.Type] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all announcements");
    };
    announcements.values().toArray().sort(func(a : Announcement.Type, b : Announcement.Type) : Order.Order {
      Int.compare(b.timestamp, a.timestamp)
    });
  };

  public shared ({ caller }) func deactivateAnnouncement(id : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can deactivate announcements");
    };
    switch (announcements.get(id)) {
      case (null) { Runtime.trap("Announcement not found") };
      case (?announcement) {
        announcements.add(id, { announcement with isActive = false });
      };
    };
  };

  // ============================================================
  // --- Phase 6: Performance Scoring ---
  // ============================================================

  public shared ({ caller }) func addPerformanceScore(internId : Principal, score : Nat, feedback : Text, category : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can add performance scores");
    };
    if (score < 1 or score > 5) {
      Runtime.trap("Score must be between 1 and 5");
    };
    let newScore : PerformanceScore.Type = {
      internId;
      adminId = caller;
      score;
      feedback;
      timestamp = Time.now();
      category;
    };
    performanceScores.add(newScore);
    // Notify the intern
    createNotificationInternal(
      internId,
      #performanceScored,
      "You received a performance score of " # score.toText() # "/5 for " # category,
      0
    );
  };

  public query ({ caller }) func getScoresForIntern(internId : Principal) : async [PerformanceScore.Type] {
    if (caller != internId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own performance scores");
    };
    performanceScores.toArray().filter(func(s : PerformanceScore.Type) : Bool { s.internId == internId });
  };

  public query ({ caller }) func getAverageScore(internId : Principal) : async ?Float {
    if (caller != internId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own performance scores");
    };
    let internScores = performanceScores.toArray().filter(func(s : PerformanceScore.Type) : Bool { s.internId == internId });
    if (internScores.size() == 0) {
      return null;
    };
    var total = 0;
    for (s in internScores.values()) {
      total += s.score;
    };
    ?(total.toFloat() / internScores.size().toFloat());
  };

  // ============================================================
  // --- Phase 6: Onboarding Checklist ---
  // ============================================================

  let defaultOnboardingItems : [{ id : Text; title : Text }] = [
    { id = "profile"; title = "Complete your profile" },
    { id = "project"; title = "View your assigned project" },
    { id = "milestone"; title = "Create your first milestone" },
    { id = "activity"; title = "Log your first activity" },
    { id = "message"; title = "Send a message to your admin" },
    { id = "branch"; title = "Access your code branch" },
  ];

  func initOnboardingForIntern(internId : Principal) {
    let items = List.empty<OnboardingItem.Type>();
    for (item in defaultOnboardingItems.values()) {
      items.add({
        id = item.id;
        title = item.title;
        isCompleted = false;
        completedAt = null;
      });
    };
    onboardingChecklists.add(internId, items);
  };

  public query ({ caller }) func getOnboardingChecklist(internId : Principal) : async [OnboardingItem.Type] {
    if (caller != internId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own onboarding checklist");
    };
    switch (onboardingChecklists.get(internId)) {
      case (null) { [] };
      case (?list) { list.toArray() };
    };
  };

  public shared ({ caller }) func completeOnboardingItem(itemId : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can complete onboarding items");
    };
    switch (onboardingChecklists.get(caller)) {
      case (null) { Runtime.trap("No onboarding checklist found") };
      case (?list) {
        let now = Time.now();
        list.mapInPlace(func(item : OnboardingItem.Type) : OnboardingItem.Type {
          if (item.id == itemId and not item.isCompleted) {
            { item with isCompleted = true; completedAt = ?now }
          } else {
            item
          }
        });
      };
    };
  };

  public shared ({ caller }) func initializeOnboarding() : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can initialize onboarding");
    };
    if (not onboardingChecklists.containsKey(caller)) {
      initOnboardingForIntern(caller);
    };
  };
};
