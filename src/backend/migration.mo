import Map "mo:core/Map";
import Set "mo:core/Set";
import List "mo:core/List";
import Principal "mo:core/Principal";

module {
  // ── Old types (copied from previous version) ────────────────────────────────

  type OldRegistrationStatus = { #pending; #active; #rejected };
  type OldProjectStatus = { #planning; #active; #completed };

  type OldUserProfile = {
    name : Text;
    bio : Text;
    email : Text;
    registrationStatus : OldRegistrationStatus;
    skills : Set.Set<Text>;
  };

  type OldProject = {
    id : Nat;
    title : Text;
    description : Text;
    startDate : Text;
    endDate : Text;
    status : OldProjectStatus;
    assignedInterns : Set.Set<Principal>;
  };

  type OldMessageType = { #text };
  type OldMessage = {
    id : Nat;
    sender : Principal;
    recipient : Principal;
    content : Text;
    timestamp : Int;
    isRead : Bool;
  };

  type OldNotificationType = {
    #newApprovalRequest;
    #projectAssigned;
    #milestoneUpdate;
    #messageReceived;
  };
  type OldNotification = {
    id : Nat;
    recipientPrincipal : Principal;
    notificationType : OldNotificationType;
    message : Text;
    relatedId : Nat;
    isRead : Bool;
    timestamp : Int;
  };

  // ── Old stable state ─────────────────────────────────────────────────────────

  type OldActor = {
    var nextProjectId : Nat;
    var nextActivityId : Nat;
    var nextMessageId : Nat;
    var nextMilestoneId : Nat;
    var nextNotificationId : Nat;
    var nextExtensionRequestId : Nat;
    var lastActivityTime : ?Int;           // dropped in new version
    userProfiles : Map.Map<Principal, OldUserProfile>;
    projects : Map.Map<Nat, OldProject>;
    messages : Map.Map<Nat, OldMessage>;
    notifications : Map.Map<Nat, OldNotification>;
  };

  // ── New types (matching new main.mo) ─────────────────────────────────────────

  type NewRegistrationStatus = { #pending; #active; #rejected };
  type NewProjectStatus = { #planning; #active; #completed };

  type NewUserProfile = {
    name : Text;
    bio : Text;
    email : Text;
    registrationStatus : NewRegistrationStatus;
    skills : Set.Set<Text>;
    photoUrl : ?Text;
    links : [Text];
  };

  type NewSubtask = {
    id : Text;
    title : Text;
    isCompleted : Bool;
    dueDate : ?Int;
  };

  type NewProject = {
    id : Nat;
    title : Text;
    description : Text;
    startDate : Text;
    endDate : Text;
    status : NewProjectStatus;
    assignedInterns : Set.Set<Principal>;
    tags : [Text];
    isPinned : Bool;
    subtasks : [NewSubtask];
  };

  type NewMessageType = { #text; #file; #image; #systemMsg };
  type NewMessage = {
    id : Nat;
    sender : Principal;
    recipient : Principal;
    content : Text;
    timestamp : Int;
    isRead : Bool;
    messageType : NewMessageType;
    fileUrl : ?Text;
    fileName : ?Text;
    fileSize : ?Nat;
  };

  type NewNotificationType = {
    #newApprovalRequest;
    #projectAssigned;
    #milestoneUpdate;
    #messageReceived;
    #announcement;
    #commitPushed;
    #performanceScored;
  };
  type NewNotification = {
    id : Nat;
    recipientPrincipal : Principal;
    notificationType : NewNotificationType;
    message : Text;
    relatedId : Nat;
    isRead : Bool;
    timestamp : Int;
  };

  // ── New stable state ──────────────────────────────────────────────────────────

  type NewActor = {
    var nextProjectId : Nat;
    var nextActivityId : Nat;
    var nextMessageId : Nat;
    var nextMilestoneId : Nat;
    var nextNotificationId : Nat;
    var nextExtensionRequestId : Nat;
    userProfiles : Map.Map<Principal, NewUserProfile>;
    projects : Map.Map<Nat, NewProject>;
    messages : Map.Map<Nat, NewMessage>;
    notifications : Map.Map<Nat, NewNotification>;
  };

  // ── Migration function ────────────────────────────────────────────────────────

  public func run(old : OldActor) : NewActor {
    // Migrate userProfiles: add photoUrl=null and links=[]
    let userProfiles = old.userProfiles.map<Principal, OldUserProfile, NewUserProfile>(
      func(_p, u) {
        { u with photoUrl = null; links = [] }
      }
    );

    // Migrate projects: add tags=[], isPinned=false, subtasks=[]
    let projects = old.projects.map<Nat, OldProject, NewProject>(
      func(_id, p) {
        { p with tags = []; isPinned = false; subtasks = [] }
      }
    );

    // Migrate messages: add messageType=#text, fileUrl=null, fileName=null, fileSize=null
    let messages = old.messages.map<Nat, OldMessage, NewMessage>(
      func(_id, m) {
        {
          m with
          messageType = #text;
          fileUrl = null;
          fileName = null;
          fileSize = null;
        }
      }
    );

    // Migrate notifications: cast notificationType — old tags are all present in new variant
    let notifications = old.notifications.map<Nat, OldNotification, NewNotification>(
      func(_id, n) {
        let newType : NewNotificationType = switch (n.notificationType) {
          case (#newApprovalRequest) { #newApprovalRequest };
          case (#projectAssigned) { #projectAssigned };
          case (#milestoneUpdate) { #milestoneUpdate };
          case (#messageReceived) { #messageReceived };
        };
        { n with notificationType = newType }
      }
    );

    {
      var nextProjectId = old.nextProjectId;
      var nextActivityId = old.nextActivityId;
      var nextMessageId = old.nextMessageId;
      var nextMilestoneId = old.nextMilestoneId;
      var nextNotificationId = old.nextNotificationId;
      var nextExtensionRequestId = old.nextExtensionRequestId;
      // lastActivityTime is intentionally dropped
      userProfiles;
      projects;
      messages;
      notifications;
    };
  };
};
