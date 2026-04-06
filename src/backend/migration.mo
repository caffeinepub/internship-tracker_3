import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Set "mo:core/Set";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";

module {
  type ProjectStatus = { #planning; #active; #completed };

  type OldActor = {
    accessControlState : AccessControl.AccessControlState;
    nextProjectId : Nat;
    nextActivityId : Nat;
    nextMessageId : Nat;
    lastActivityTime : ?Int;
    userProfiles : Map.Map<Principal, {
      name : Text;
      bio : Text;
      email : Text;
      registrationStatus : { #pending; #active; #rejected };
      skills : Set.Set<Text>;
    }>;
    projects : Map.Map<Nat, {
      id : Nat;
      title : Text;
      description : Text;
      startDate : Text;
      endDate : Text;
      status : ProjectStatus;
      assignedInterns : Set.Set<Principal>;
    }>;
    activityLogs : Map.Map<Nat, {
      id : Nat;
      internPrincipal : Principal;
      projectId : Nat;
      title : Text;
      description : Text;
      date : Text;
      hours : Nat;
      createdAt : Int;
    }>;
    messages : Map.Map<Nat, {
      id : Nat;
      sender : Principal;
      recipient : Principal;
      content : Text;
      timestamp : Int;
      isRead : Bool;
    }>;
  };

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    nextProjectId : Nat;
    nextActivityId : Nat;
    nextMessageId : Nat;
    nextMilestoneId : Nat;
    nextNotificationId : Nat;
    lastActivityTime : ?Int;
    userProfiles : Map.Map<Principal, {
      name : Text;
      bio : Text;
      email : Text;
      registrationStatus : { #pending; #active; #rejected };
      skills : Set.Set<Text>;
    }>;
    projects : Map.Map<Nat, {
      id : Nat;
      title : Text;
      description : Text;
      startDate : Text;
      endDate : Text;
      status : ProjectStatus;
      assignedInterns : Set.Set<Principal>;
    }>;
    activityLogs : Map.Map<Nat, {
      id : Nat;
      internPrincipal : Principal;
      projectId : Nat;
      title : Text;
      description : Text;
      date : Text;
      hours : Nat;
      createdAt : Int;
    }>;
    messages : Map.Map<Nat, {
      id : Nat;
      sender : Principal;
      recipient : Principal;
      content : Text;
      timestamp : Int;
      isRead : Bool;
    }>;
    milestones : Map.Map<Nat, {
      id : Nat;
      internPrincipal : Principal;
      projectId : Nat;
      title : Text;
      description : Text;
      status : { #pending; #inProgress; #completed };
      dueDate : Text;
      createdAt : Int;
    }>;
    notifications : Map.Map<Nat, {
      id : Nat;
      recipientPrincipal : Principal;
      notificationType : { #newApprovalRequest; #projectAssigned; #milestoneUpdate; #messageReceived };
      message : Text;
      relatedId : Nat;
      isRead : Bool;
      timestamp : Int;
    }>;
  };
  public func run(old : OldActor) : NewActor {
    {
      old with
      nextMilestoneId = 1;
      nextNotificationId = 1;
      milestones = Map.empty<Nat, {
        id : Nat;
        internPrincipal : Principal;
        projectId : Nat;
        title : Text;
        description : Text;
        status : { #pending; #inProgress; #completed };
        dueDate : Text;
        createdAt : Int;
      }>();
      notifications = Map.empty<Nat, {
        id : Nat;
        recipientPrincipal : Principal;
        notificationType : { #newApprovalRequest; #projectAssigned; #milestoneUpdate; #messageReceived };
        message : Text;
        relatedId : Nat;
        isRead : Bool;
        timestamp : Int;
      }>();
    };
  };
};
