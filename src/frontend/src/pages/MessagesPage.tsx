import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { View__1, View__2 } from "../backend";
import { useActor } from "../hooks/useActor";
import { useAuth } from "../hooks/useAuth";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

type Contact = {
  principalStr: string;
  name: string;
};

function formatTimestamp(ts: bigint): string {
  return new Date(Number(ts) / 1_000_000).toLocaleString();
}

function ContactItem({
  contact,
  isSelected,
  onClick,
  unreadCount,
}: {
  contact: Contact;
  isSelected: boolean;
  onClick: () => void;
  unreadCount: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors",
        isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted",
      )}
      data-ocid="messages.button"
    >
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback
          className={cn(
            "text-xs font-semibold",
            isSelected
              ? "bg-primary-foreground/20 text-primary-foreground"
              : "bg-muted-foreground/20",
          )}
        >
          {contact.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium truncate",
            isSelected ? "text-primary-foreground" : "",
          )}
        >
          {contact.name}
        </p>
      </div>
      {unreadCount > 0 && (
        <Badge className="h-5 min-w-5 px-1 text-xs bg-destructive text-destructive-foreground">
          {unreadCount}
        </Badge>
      )}
    </button>
  );
}

export default function MessagesPage() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const { appRole } = useAuth();
  const isAdmin = appRole === "admin";

  const callerPrincipalStr = identity?.getPrincipal().toString() ?? "";

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<View__1[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const buildContacts = useCallback(
    async (allMessages: View__1[], allInterns?: View__2[]) => {
      const principalSet = new Set<string>();
      const contactMap = new Map<string, Contact>();

      for (const msg of allMessages) {
        const senderStr = msg.sender.toString();
        const recipientStr = msg.recipient.toString();
        const otherStr =
          senderStr === callerPrincipalStr ? recipientStr : senderStr;
        principalSet.add(otherStr);
      }

      // Admins can also see all active interns as potential contacts
      if (isAdmin && allInterns) {
        for (const intern of allInterns) {
          const p = intern.principal.toString();
          if (p !== callerPrincipalStr) {
            principalSet.add(p);
            contactMap.set(p, { principalStr: p, name: intern.name });
          }
        }
      }

      // For principals from messages without a known name, try to resolve
      for (const pStr of principalSet) {
        if (!contactMap.has(pStr)) {
          const internMatch = allInterns?.find(
            (i) => i.principal.toString() === pStr,
          );
          if (internMatch) {
            contactMap.set(pStr, {
              principalStr: pStr,
              name: internMatch.name,
            });
          } else {
            contactMap.set(pStr, {
              principalStr: pStr,
              name: `${pStr.slice(0, 8)}...`,
            });
          }
        }
      }

      return Array.from(contactMap.values());
    },
    [callerPrincipalStr, isAdmin],
  );

  const loadContacts = useCallback(async () => {
    if (!actor) return;
    setLoadingContacts(true);
    try {
      const allMessages = await actor.getMessagesForCaller();
      let allInterns: View__2[] | undefined;
      if (isAdmin) {
        allInterns = await actor.getAllInterns();
      }
      const list = await buildContacts(allMessages, allInterns);
      setContacts(list);
    } catch {
      toast.error("Failed to load contacts");
    } finally {
      setLoadingContacts(false);
    }
  }, [actor, isAdmin, buildContacts]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const loadConversation = useCallback(
    async (contact: Contact) => {
      if (!actor || !identity) return;
      setLoadingMessages(true);
      try {
        // Resolve the Principal object from messages or intern list
        const allMessages = await actor.getMessagesForCaller();
        const matchingMsg = allMessages.find(
          (m) =>
            m.sender.toString() === contact.principalStr ||
            m.recipient.toString() === contact.principalStr,
        );

        let otherPrincipal = matchingMsg
          ? matchingMsg.sender.toString() === contact.principalStr
            ? matchingMsg.sender
            : matchingMsg.recipient
          : null;

        if (!otherPrincipal && isAdmin) {
          const interns = await actor.getAllInterns();
          const intern = interns.find(
            (i) => i.principal.toString() === contact.principalStr,
          );
          if (intern) otherPrincipal = intern.principal;
        }

        if (!otherPrincipal) {
          toast.error("Could not find contact's principal");
          return;
        }

        const conversation = await actor.getConversation(otherPrincipal);
        const sorted = [...conversation].sort((a, b) => {
          return Number(a.timestamp - b.timestamp);
        });
        setMessages(sorted);

        // Mark unread messages as read
        const callerPrincipal = identity.getPrincipal();
        const unreadMsgs = sorted.filter(
          (m) =>
            !m.isRead && m.recipient.toString() === callerPrincipal.toString(),
        );
        if (unreadMsgs.length > 0) {
          await Promise.all(unreadMsgs.map((m) => actor.markMessageRead(m.id)));
        }
      } catch {
        toast.error("Failed to load conversation");
      } finally {
        setLoadingMessages(false);
      }
    },
    [actor, identity, isAdmin],
  );

  useEffect(() => {
    if (selectedContact) {
      loadConversation(selectedContact);
    }
  }, [selectedContact, loadConversation]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: messages change triggers scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!selectedContact) return;
    pollRef.current = setInterval(() => {
      loadConversation(selectedContact);
    }, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selectedContact, loadConversation]);

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor || !selectedContact || !newMessage.trim()) return;
    setSendingMessage(true);
    try {
      // Resolve recipient Principal
      const allMessages = await actor.getMessagesForCaller();
      const matchingMsg = allMessages.find(
        (m) =>
          m.sender.toString() === selectedContact.principalStr ||
          m.recipient.toString() === selectedContact.principalStr,
      );

      let recipientPrincipal = matchingMsg
        ? matchingMsg.sender.toString() === selectedContact.principalStr
          ? matchingMsg.sender
          : matchingMsg.recipient
        : null;

      if (!recipientPrincipal && isAdmin) {
        const interns = await actor.getAllInterns();
        const intern = interns.find(
          (i) => i.principal.toString() === selectedContact.principalStr,
        );
        if (intern) recipientPrincipal = intern.principal;
      }

      if (!recipientPrincipal) {
        toast.error("Cannot resolve recipient");
        return;
      }

      await actor.sendMessage(recipientPrincipal, newMessage.trim());
      setNewMessage("");
      await loadConversation(selectedContact);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send message",
      );
    } finally {
      setSendingMessage(false);
    }
  };

  const getUnreadCount = (contact: Contact) => {
    if (!identity) return 0;
    const callerPrincipal = identity.getPrincipal().toString();
    return messages.filter(
      (m) =>
        m.sender.toString() === contact.principalStr &&
        m.recipient.toString() === callerPrincipal &&
        !m.isRead,
    ).length;
  };

  return (
    <div className="flex h-full" data-ocid="messages.panel">
      {/* Contacts sidebar */}
      <div className="w-64 flex-shrink-0 border-r border-border flex flex-col bg-card">
        <div className="px-4 py-4 border-b border-border">
          <h2 className="font-display font-semibold text-sm">Messages</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isAdmin ? "All interns" : "Your conversations"}
          </p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {loadingContacts ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : contacts.length === 0 ? (
              <div
                className="p-4 text-center text-xs text-muted-foreground"
                data-ocid="messages.empty_state"
              >
                {isAdmin ? "No interns yet" : "No conversations yet"}
              </div>
            ) : (
              contacts.map((contact) => (
                <ContactItem
                  key={contact.principalStr}
                  contact={contact}
                  isSelected={
                    selectedContact?.principalStr === contact.principalStr
                  }
                  onClick={() => handleSelectContact(contact)}
                  unreadCount={getUnreadCount(contact)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Message thread */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedContact ? (
          <div className="flex-1 flex items-center justify-center text-center px-6">
            <div>
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="font-display font-semibold text-foreground">
                Select a conversation
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {isAdmin
                  ? "Choose an intern to start or continue a conversation"
                  : "Your message history will appear here"}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-border bg-card flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {selectedContact.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{selectedContact.name}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {truncate(selectedContact.principalStr)}
                </p>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-5 py-4">
              {loadingMessages ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-3/4" />
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8">
                  No messages yet. Say hello!
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg, idx) => {
                    const isFromMe =
                      msg.sender.toString() === callerPrincipalStr;
                    return (
                      <div
                        key={String(msg.id)}
                        className={cn(
                          "flex",
                          isFromMe ? "justify-end" : "justify-start",
                        )}
                        data-ocid={`messages.item.${idx + 1}`}
                      >
                        <div
                          className={cn(
                            "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm",
                            isFromMe
                              ? "bg-primary text-primary-foreground rounded-tr-sm"
                              : "bg-muted text-foreground rounded-tl-sm",
                          )}
                        >
                          <p>{msg.content}</p>
                          <p
                            className={cn(
                              "text-xs mt-1",
                              isFromMe
                                ? "text-primary-foreground/60"
                                : "text-muted-foreground",
                            )}
                          >
                            {formatTimestamp(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="px-5 py-4 border-t border-border bg-card">
              <form onSubmit={handleSend} className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  disabled={sendingMessage}
                  className="flex-1"
                  data-ocid="messages.input"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={sendingMessage || !newMessage.trim()}
                  data-ocid="messages.submit_button"
                >
                  {sendingMessage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function truncate(s: string) {
  if (s.length <= 14) return s;
  return `${s.slice(0, 7)}...${s.slice(-5)}`;
}
