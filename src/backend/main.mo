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
    public func toView(profile : Type) : View {
      {
        profile with
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
  module RegistrationStatus {
    public type Type = { #pending; #active; #rejected };
  };

  // --- Persistent State ---
  let accessControlState = AccessControl.initState(); // = initialization includes role-based access control, ready to use in actor

  include MixinAuthorization(accessControlState); // = includes authentication, protected by default for new users

  var nextProjectId = 1;
  var lastActivityTime : ?Int = null;

  let userProfiles = Map.empty<Principal, UserProfile.Type>();
  let projects = Map.empty<Nat, Project.Type>();

  // --- Project CRUD Functions ---
  // Immutable project creation in persistent state
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
    userProfiles.values().toArray().map(UserProfile.toView).sort(UserProfile.ViewCompare.compareByName);
  };

  func getUsersByRegistrationStatus(status : RegistrationStatus.Type) : [UserProfile.View] {
    let filteredResults = List.empty<UserProfile.Type>();
    for (user in userProfiles.values()) {
      if (user.registrationStatus == status) {
        filteredResults.add(user);
      };
    };
    filteredResults.toArray().map(UserProfile.toView);
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
    userProfiles.get(caller).map(UserProfile.toView);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile.View {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user).map(UserProfile.toView);
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
    let filteredResults = List.empty<UserProfile.Type>();
    for (user in userProfiles.values()) {
      if (user.registrationStatus == #active) {
        filteredResults.add(user);
      };
    };
    filteredResults.toArray().map(UserProfile.toView);
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
