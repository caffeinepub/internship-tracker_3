import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  CheckCheck,
  File,
  Loader2,
  MessageSquare,
  Paperclip,
  Search,
  Send,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Variant_file_image } from "../backend";
import type { Type__3, View__1, View__2 } from "../backend";
import { useActor } from "../hooks/useActor";
import { useAuth } from "../hooks/useAuth";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

// ─── Types ────────────────────────────────────────────────────────────────────

type Contact = {
  principalStr: string;
  name: string;
  lastMessage?: string;
  lastMessageTime?: bigint;
  unread: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(ts: bigint): string {
  const d = new Date(Number(ts) / 1_000_000);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(ts: bigint): string {
  const d = new Date(Number(ts) / 1_000_000);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatLastMessageTime(ts: bigint): string {
  const d = new Date(Number(ts) / 1_000_000);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatFileSize(bytes: bigint): string {
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── ContactItem ──────────────────────────────────────────────────────────────

function ContactItem({
  contact,
  isSelected,
  onClick,
}: {
  contact: Contact;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
        isSelected
          ? "bg-accent/15 border-l-2 border-accent"
          : "hover:bg-muted/60 border-l-2 border-transparent",
      )}
      data-ocid="messages.contact_item"
    >
      <Avatar className="h-11 w-11 flex-shrink-0">
        <AvatarFallback
          className={cn(
            "text-sm font-semibold",
            isSelected
              ? "bg-accent/20 text-accent"
              : "bg-muted-foreground/15 text-foreground",
          )}
        >
          {getInitials(contact.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold truncate text-foreground">
            {contact.name}
          </p>
          {contact.lastMessageTime && (
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {formatLastMessageTime(contact.lastMessageTime)}
            </span>
          )}
        </div>
        {contact.lastMessage && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {contact.lastMessage}
          </p>
        )}
      </div>
      {contact.unread > 0 && (
        <Badge className="h-5 min-w-5 px-1.5 text-xs rounded-full bg-accent text-accent-foreground flex-shrink-0 ml-1">
          {contact.unread > 99 ? "99+" : contact.unread}
        </Badge>
      )}
    </button>
  );
}

// ─── DateSeparator ────────────────────────────────────────────────────────────

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground bg-background px-2 rounded-full border border-border py-0.5">
        {label}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  isFromMe,
}: {
  msg: View__1;
  isFromMe: boolean;
}) {
  const isImage = msg.messageType === ("image" as Type__3);
  const isFile = msg.messageType === ("file" as Type__3);
  const hasFile = isImage || isFile;

  return (
    <div
      className={cn(
        "flex items-end gap-1.5 max-w-[85%] md:max-w-[65%]",
        isFromMe ? "ml-auto flex-row-reverse" : "",
      )}
      data-ocid="messages.bubble"
    >
      {/* Avatar — only for peer */}
      {!isFromMe && (
        <Avatar className="h-6 w-6 flex-shrink-0 mb-0.5">
          <AvatarFallback className="text-[9px] bg-muted-foreground/20 text-foreground">
            {msg.sender.toString().slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "relative px-3 py-2 rounded-2xl shadow-xs text-sm leading-relaxed break-words",
          isFromMe
            ? "chat-bubble-user rounded-tr-sm"
            : "chat-bubble-peer rounded-tl-sm border border-border/50",
        )}
      >
        {/* File/Image content */}
        {hasFile && (
          <div className="mb-1.5">
            {isImage && msg.fileUrl ? (
              <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={msg.fileUrl}
                  alt={msg.fileName ?? "image"}
                  className="rounded-lg max-w-full max-h-48 object-cover block"
                />
              </a>
            ) : (
              <a
                href={msg.fileUrl ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg",
                  isFromMe ? "bg-accent-foreground/10" : "bg-muted",
                )}
              >
                <File className="h-4 w-4 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate max-w-[160px]">
                    {msg.fileName ?? "File"}
                  </p>
                  {msg.fileSize !== undefined && msg.fileSize !== null && (
                    <p className="text-[10px] opacity-70">
                      {formatFileSize(msg.fileSize)}
                    </p>
                  )}
                </div>
              </a>
            )}
          </div>
        )}

        {/* Text content */}
        {msg.content && msg.messageType !== ("systemMsg" as Type__3) && (
          <p>{msg.content}</p>
        )}

        {/* System message */}
        {msg.messageType === ("systemMsg" as Type__3) && (
          <p className="text-xs italic opacity-70">{msg.content}</p>
        )}

        {/* Timestamp + seen */}
        <div
          className={cn(
            "flex items-center gap-1 mt-1",
            isFromMe ? "justify-end" : "justify-start",
          )}
        >
          <span
            className={cn(
              "text-[10px] opacity-60",
              isFromMe ? "text-accent-foreground" : "text-muted-foreground",
            )}
          >
            {formatTime(msg.timestamp)}
          </span>
          {isFromMe && (
            <CheckCheck
              className={cn(
                "h-3 w-3",
                msg.isRead ? "text-accent-foreground" : "opacity-50",
              )}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const { appRole } = useAuth();
  const isAdmin = appRole === "admin";

  const callerPrincipalStr = identity?.getPrincipal().toString() ?? "";

  // Panels state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<View__1[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [messageSearch, setMessageSearch] = useState("");

  // Mobile: show contacts or conversation
  const [mobilePanelMode, setMobilePanelMode] = useState<
    "contacts" | "conversation"
  >("contacts");

  // File attachment
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Intern principal cache for resolving principals
  const internCacheRef = useRef<View__2[]>([]);

  // ── Build contacts from messages + interns ──────────────────────────────────

  const buildContacts = useCallback(
    async (
      allMessages: View__1[],
      allInterns?: View__2[],
    ): Promise<Contact[]> => {
      if (allInterns) internCacheRef.current = allInterns;

      const contactMap = new Map<string, Contact>();

      // Seed from interns if admin
      if (isAdmin && allInterns) {
        for (const intern of allInterns) {
          const p = intern.principal.toString();
          if (p !== callerPrincipalStr) {
            contactMap.set(p, {
              principalStr: p,
              name: intern.name,
              unread: 0,
            });
          }
        }
      }

      // Process messages for last-message preview + unread counts
      const sorted = [...allMessages].sort((a, b) =>
        Number(b.timestamp - a.timestamp),
      );
      for (const msg of sorted) {
        const senderStr = msg.sender.toString();
        const recipientStr = msg.recipient.toString();
        const otherStr =
          senderStr === callerPrincipalStr ? recipientStr : senderStr;
        if (otherStr === callerPrincipalStr) continue;

        const internMatch =
          allInterns?.find((i) => i.principal.toString() === otherStr) ??
          internCacheRef.current.find(
            (i) => i.principal.toString() === otherStr,
          );

        const existing = contactMap.get(otherStr);
        const name =
          internMatch?.name ?? existing?.name ?? `${otherStr.slice(0, 6)}…`;

        const preview =
          msg.messageType === ("file" as Type__3)
            ? `📎 ${msg.fileName ?? "File"}`
            : msg.messageType === ("image" as Type__3)
              ? "🖼 Image"
              : msg.content;

        const isUnread = !msg.isRead && recipientStr === callerPrincipalStr;

        if (!existing) {
          contactMap.set(otherStr, {
            principalStr: otherStr,
            name,
            lastMessage: preview,
            lastMessageTime: msg.timestamp,
            unread: isUnread ? 1 : 0,
          });
        } else {
          // Update lastMessage only if this msg is newer
          if (
            !existing.lastMessageTime ||
            msg.timestamp > existing.lastMessageTime
          ) {
            existing.lastMessage = preview;
            existing.lastMessageTime = msg.timestamp;
          }
          if (isUnread) existing.unread += 1;
        }
      }

      return Array.from(contactMap.values()).sort((a, b) => {
        const ta = a.lastMessageTime ?? 0n;
        const tb = b.lastMessageTime ?? 0n;
        return Number(tb - ta);
      });
    },
    [callerPrincipalStr, isAdmin],
  );

  // ── Load contacts ───────────────────────────────────────────────────────────

  const loadContacts = useCallback(async () => {
    if (!actor) return;
    setLoadingContacts(true);
    try {
      const [allMessages, allInterns] = await Promise.all([
        actor.getMessagesForCaller(),
        isAdmin ? actor.getAllInterns() : actor.getAllUsers(),
      ]);
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

  // ── Resolve principal object ────────────────────────────────────────────────

  const resolvePrincipal = useCallback(
    async (principalStr: string) => {
      if (!actor) return null;
      // Check cached interns first
      const cached = internCacheRef.current.find(
        (i) => i.principal.toString() === principalStr,
      );
      if (cached) return cached.principal;
      // Fallback: fetch messages and look for the principal
      try {
        const msgs = await actor.getMessagesForCaller();
        const match = msgs.find(
          (m) =>
            m.sender.toString() === principalStr ||
            m.recipient.toString() === principalStr,
        );
        if (match) {
          return match.sender.toString() === principalStr
            ? match.sender
            : match.recipient;
        }
        // Last resort: fetch all interns/users
        const users = isAdmin
          ? await actor.getAllInterns()
          : await actor.getAllUsers();
        const user = users.find((u) => u.principal.toString() === principalStr);
        if (user) {
          internCacheRef.current = [...internCacheRef.current, user];
          return user.principal;
        }
      } catch {
        // ignore
      }
      return null;
    },
    [actor, isAdmin],
  );

  // ── Load conversation ───────────────────────────────────────────────────────

  const loadConversation = useCallback(
    async (contact: Contact, silent = false) => {
      if (!actor || !identity) return;
      if (!silent) setLoadingMessages(true);
      try {
        const principal = await resolvePrincipal(contact.principalStr);
        if (!principal) {
          if (!silent) toast.error("Could not resolve contact");
          return;
        }

        const conversation = await actor.getConversation(principal);
        const sorted = [...conversation].sort((a, b) =>
          Number(a.timestamp - b.timestamp),
        );
        setMessages(sorted);

        // Mark unread as read
        const callerP = identity.getPrincipal();
        const unread = sorted.filter(
          (m) => !m.isRead && m.recipient.toString() === callerP.toString(),
        );
        if (unread.length > 0) {
          await Promise.all(unread.map((m) => actor.markMessageRead(m.id)));
          // Reset unread badge
          setContacts((prev) =>
            prev.map((c) =>
              c.principalStr === contact.principalStr ? { ...c, unread: 0 } : c,
            ),
          );
        }
      } catch {
        if (!silent) toast.error("Failed to load conversation");
      } finally {
        if (!silent) setLoadingMessages(false);
      }
    },
    [actor, identity, resolvePrincipal],
  );

  useEffect(() => {
    if (selectedContact) {
      loadConversation(selectedContact);
    }
  }, [selectedContact, loadConversation]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Poll for updates every 5s
  useEffect(() => {
    if (!selectedContact) return;
    pollRef.current = setInterval(() => {
      loadConversation(selectedContact, true);
    }, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selectedContact, loadConversation]);

  // ── Select contact ──────────────────────────────────────────────────────────

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setMessageSearch("");
    setMobilePanelMode("conversation");
    // Focus input after a short delay
    setTimeout(() => messageInputRef.current?.focus(), 150);
  };

  // ── Send text ───────────────────────────────────────────────────────────────

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor || !selectedContact || !newMessage.trim()) return;
    setSendingMessage(true);
    const text = newMessage.trim();
    setNewMessage("");
    try {
      const principal = await resolvePrincipal(selectedContact.principalStr);
      if (!principal) {
        toast.error("Cannot resolve recipient");
        return;
      }
      const sent = await actor.sendMessage(principal, text);
      setMessages((prev) => [...prev, sent]);
      // Update last message in contact list
      setContacts((prev) =>
        prev.map((c) =>
          c.principalStr === selectedContact.principalStr
            ? { ...c, lastMessage: text, lastMessageTime: sent.timestamp }
            : c,
        ),
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send message",
      );
      setNewMessage(text); // restore
    } finally {
      setSendingMessage(false);
    }
  };

  // ── Send file ───────────────────────────────────────────────────────────────

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !actor || !selectedContact) return;
    setUploadingFile(true);
    try {
      const principal = await resolvePrincipal(selectedContact.principalStr);
      if (!principal) {
        toast.error("Cannot resolve recipient");
        return;
      }
      // Use object-storage URL pattern or base64 data URL for small files
      const isImage = file.type.startsWith("image/");
      const reader = new FileReader();
      const fileUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const messageType = isImage
        ? Variant_file_image.image
        : Variant_file_image.file;
      const sent = await actor.sendFileMessage(
        principal,
        fileUrl,
        file.name,
        BigInt(file.size),
        messageType,
      );
      setMessages((prev) => [...prev, sent]);
      setContacts((prev) =>
        prev.map((c) =>
          c.principalStr === selectedContact.principalStr
            ? {
                ...c,
                lastMessage: isImage ? "🖼 Image" : `📎 ${file.name}`,
                lastMessageTime: sent.timestamp,
              }
            : c,
        ),
      );
      toast.success(`${isImage ? "Image" : "File"} sent`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send file");
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Filtered data ───────────────────────────────────────────────────────────

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase()),
  );

  const filteredMessages = messageSearch.trim()
    ? messages.filter(
        (m) =>
          m.content.toLowerCase().includes(messageSearch.toLowerCase()) ||
          m.fileName?.toLowerCase().includes(messageSearch.toLowerCase()),
      )
    : messages;

  // ── Date groups ─────────────────────────────────────────────────────────────

  type MsgWithSeparator =
    | { type: "separator"; label: string; key: string }
    | { type: "message"; msg: View__1 };

  const messagesWithSeparators: MsgWithSeparator[] = [];
  let lastDateLabel = "";
  for (const msg of filteredMessages) {
    const label = formatDate(msg.timestamp);
    if (label !== lastDateLabel) {
      messagesWithSeparators.push({
        type: "separator",
        label,
        key: label + msg.id,
      });
      lastDateLabel = label;
    }
    messagesWithSeparators.push({ type: "message", msg });
  }

  // ── Layout ──────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex h-full overflow-hidden bg-background"
      data-ocid="messages.panel"
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,application/pdf,.doc,.docx,.txt,.zip,.rar"
        onChange={handleFileSelect}
      />

      {/* ── Contacts Panel ─────────────────────────────────────────────────── */}
      <div
        className={cn(
          "flex flex-col bg-card border-r border-border transition-transform duration-200",
          // Mobile: full width, hidden when conversation open
          "absolute inset-0 z-10 md:relative md:inset-auto md:z-auto",
          "md:w-72 md:flex-shrink-0 md:translate-x-0",
          mobilePanelMode === "conversation"
            ? "-translate-x-full"
            : "translate-x-0",
        )}
      >
        {/* Contacts header */}
        <div className="px-4 pt-5 pb-3 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-lg text-foreground">
              Messages
            </h2>
            <span className="text-xs text-muted-foreground font-medium">
              {isAdmin ? "All interns" : "Conversations"}
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              placeholder="Search contacts…"
              className="pl-9 h-9 text-sm bg-muted/50 border-border/50 focus-visible:ring-1"
              data-ocid="messages.search_contacts"
            />
          </div>
        </div>

        {/* Contacts list */}
        <div
          className="flex-1 overflow-y-auto"
          data-ocid="messages.contacts_list"
        >
          {loadingContacts ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-11 w-11 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredContacts.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center gap-2 p-8 text-center"
              data-ocid="messages.empty_contacts"
            >
              <MessageSquare className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm font-medium text-foreground">
                {contactSearch ? "No contacts found" : "No conversations yet"}
              </p>
              <p className="text-xs text-muted-foreground">
                {contactSearch
                  ? "Try a different name"
                  : isAdmin
                    ? "Interns will appear here once registered"
                    : "Your messages will appear here"}
              </p>
            </div>
          ) : (
            <div>
              {filteredContacts.map((contact) => (
                <ContactItem
                  key={contact.principalStr}
                  contact={contact}
                  isSelected={
                    selectedContact?.principalStr === contact.principalStr
                  }
                  onClick={() => handleSelectContact(contact)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Conversation Panel ──────────────────────────────────────────────── */}
      <div
        className={cn(
          "flex-1 flex flex-col overflow-hidden",
          // Mobile: full width, hidden when showing contacts
          "absolute inset-0 z-10 md:relative md:inset-auto md:z-auto",
          "md:translate-x-0",
          mobilePanelMode === "contacts" ? "translate-x-full" : "translate-x-0",
        )}
      >
        {!selectedContact ? (
          /* Empty state — desktop only (mobile always shows contacts first) */
          <div className="hidden md:flex flex-1 items-center justify-center text-center px-8">
            <div>
              <div className="h-20 w-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-9 w-9 text-accent" />
              </div>
              <p className="font-display font-bold text-xl text-foreground">
                Start a conversation
              </p>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                {isAdmin
                  ? "Select an intern from the list to view or start a conversation"
                  : "Select a contact from the left to view your messages"}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Conversation header */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-border bg-card flex items-center gap-3">
              {/* Back button (mobile) */}
              <button
                type="button"
                onClick={() => setMobilePanelMode("contacts")}
                className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-muted transition-colors"
                aria-label="Back to contacts"
                data-ocid="messages.back_button"
              >
                <ArrowLeft className="h-5 w-5 text-foreground" />
              </button>

              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarFallback className="text-sm font-semibold bg-accent/15 text-accent">
                  {getInitials(selectedContact.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">
                  {selectedContact.name}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-success flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">Online</span>
                </div>
              </div>

              {/* Message search */}
              <div className="hidden sm:flex items-center relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  value={messageSearch}
                  onChange={(e) => setMessageSearch(e.target.value)}
                  placeholder="Search messages…"
                  className="pl-8 h-8 text-xs w-40 bg-muted/50 border-border/50"
                  data-ocid="messages.search_messages"
                />
              </div>
            </div>

            {/* Messages area */}
            <div
              className="flex-1 overflow-y-auto px-4 py-4 space-y-2"
              style={{ overscrollBehavior: "contain" }}
              data-ocid="messages.thread"
            >
              {loadingMessages ? (
                <div className="space-y-4 pt-2">
                  <Skeleton className="h-12 w-2/3 rounded-2xl" />
                  <Skeleton className="h-10 w-1/2 rounded-2xl ml-auto" />
                  <Skeleton className="h-14 w-3/5 rounded-2xl" />
                  <Skeleton className="h-10 w-2/5 rounded-2xl ml-auto" />
                  <Skeleton className="h-12 w-1/2 rounded-2xl" />
                </div>
              ) : filteredMessages.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center gap-2 h-full text-center py-16"
                  data-ocid="messages.empty_conversation"
                >
                  <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-1">
                    <MessageSquare className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {messageSearch
                      ? "No messages match your search"
                      : "Start the conversation"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {messageSearch
                      ? "Try different keywords"
                      : `Say hello to ${selectedContact.name}!`}
                  </p>
                </div>
              ) : (
                <>
                  {messagesWithSeparators.map((item) =>
                    item.type === "separator" ? (
                      <DateSeparator key={item.key} label={item.label} />
                    ) : (
                      <MessageBubble
                        key={String(item.msg.id)}
                        msg={item.msg}
                        isFromMe={
                          item.msg.sender.toString() === callerPrincipalStr
                        }
                      />
                    ),
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input area */}
            <div className="flex-shrink-0 px-4 py-3 border-t border-border bg-card">
              <form onSubmit={handleSend} className="flex items-end gap-2">
                {/* File attach */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile || sendingMessage}
                  className="h-10 w-10 flex-shrink-0 rounded-full flex items-center justify-center bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50"
                  aria-label="Attach file"
                  data-ocid="messages.attach_button"
                >
                  {uploadingFile ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {/* Text input */}
                <div className="flex-1 relative">
                  <Input
                    ref={messageInputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (newMessage.trim()) {
                          handleSend(e as unknown as React.FormEvent);
                        }
                      }
                    }}
                    placeholder="Type a message…"
                    disabled={sendingMessage || uploadingFile}
                    className="pr-4 h-10 rounded-full bg-muted/60 border-border/50 focus-visible:ring-1"
                    data-ocid="messages.text_input"
                  />
                </div>

                {/* Send button */}
                <Button
                  type="submit"
                  size="icon"
                  disabled={
                    sendingMessage || uploadingFile || !newMessage.trim()
                  }
                  className="h-10 w-10 rounded-full flex-shrink-0 bg-accent hover:bg-accent/90 text-accent-foreground shadow-sm transition-all"
                  data-ocid="messages.send_button"
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
