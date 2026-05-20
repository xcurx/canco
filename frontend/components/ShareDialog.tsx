"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Share2,
  Copy,
  Check,
  Globe,
  Lock,
  Search,
  X,
  UserPlus,
  Loader2,
} from "lucide-react";
import {
  getCanvasDetails,
  toggleVisibility,
  searchUsers,
  getSharedUsers,
  addShare,
  removeShare,
} from "@/actions/canvas";

interface SharedUser {
  shareId: string;
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface SearchResult {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface ShareDialogProps {
  roomId: string;
  isLocal: boolean;
  isOwner: boolean;
}

export default function ShareDialog({ roomId, isLocal, isOwner }: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [visibility, setVisibility] = useState<"PRIVATE" | "PUBLIC">("PRIVATE");
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingVisibility, setLoadingVisibility] = useState(false);
  const [addingUser, setAddingUser] = useState<string | null>(null);
  const [removingUser, setRemovingUser] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const shareLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/canvas/${isLocal ? "local/" : ""}${roomId}`
      : "";

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }, [shareLink]);

  // for local canvas just copy link, no dialog
  const handleLocalShare = useCallback(() => {
    copyLink();
  }, [copyLink]);

  useEffect(() => {
    if (!open || isLocal) return;

    const loadData = async () => {
      setInitialLoading(true);
      try {
        const [details, users] = await Promise.all([
          getCanvasDetails(roomId),
          getSharedUsers(roomId),
        ]);
        if (details) {
          setVisibility(details.visibility as "PRIVATE" | "PUBLIC");
        }
        setSharedUsers(users as SharedUser[]);
      } catch {
        toast.error("Failed to load sharing details");
      } finally {
        setInitialLoading(false);
      }
    };

    loadData();
  }, [open, roomId, isLocal]);

  // debounced search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchUsers(searchQuery, roomId);
        setSearchResults(results as SearchResult[]);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, roomId]);

  const handleToggleVisibility = async () => {
    const newVisibility = visibility === "PRIVATE" ? "PUBLIC" : "PRIVATE";
    setLoadingVisibility(true);
    try {
      const result = await toggleVisibility(roomId, newVisibility);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setVisibility(newVisibility);
      toast.success(
        `Canvas is now ${newVisibility === "PUBLIC" ? "public" : "private"}`
      );
    } catch {
      toast.error("Failed to update visibility");
    } finally {
      setLoadingVisibility(false);
    }
  };

  const handleAddUser = async (user: SearchResult) => {
    setAddingUser(user.id);
    try {
      const result = await addShare(roomId, user.id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      if (result.share) {
        setSharedUsers((prev) => [...prev, result.share as SharedUser]);
      }
      setSearchQuery("");
      setSearchResults([]);
      toast.success(`Shared with ${user.name || user.email}`);
    } catch {
      toast.error("Failed to add user");
    } finally {
      setAddingUser(null);
    }
  };

  const handleRemoveUser = async (shareId: string) => {
    setRemovingUser(shareId);
    try {
      const result = await removeShare(shareId, roomId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setSharedUsers((prev) => prev.filter((u) => u.shareId !== shareId));
      toast.success("User removed");
    } catch {
      toast.error("Failed to remove user");
    } finally {
      setRemovingUser(null);
    }
  };

  if (isLocal || !isOwner) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="w-full gap-2"
        onClick={handleLocalShare}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Share2 className="h-4 w-4" />
        )}
        {copied ? "Copied!" : "Share Link"}
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="w-full gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-background border-border overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Share Canvas
          </DialogTitle>
        </DialogHeader>

        {initialLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col gap-4 overflow-hidden">
            <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-muted/30">
              <div className="flex items-center gap-3">
                {visibility === "PUBLIC" ? (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
                    <Globe className="h-4 w-4 text-green-500" />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/10">
                    <Lock className="h-4 w-4 text-orange-500" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">
                    {visibility === "PUBLIC" ? "Public" : "Private"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {visibility === "PUBLIC"
                      ? "Anyone with the link can view"
                      : "Only shared users can access"}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleToggleVisibility}
                disabled={loadingVisibility}
                className="min-w-[90px]"
              >
                {loadingVisibility ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : visibility === "PUBLIC" ? (
                  "Make Private"
                ) : (
                  "Make Public"
                )}
              </Button>
            </div>

            {visibility === "PRIVATE" && (
              <>
                <Separator />
                <div className="space-y-3">
                  <label className="text-sm font-medium">Add people</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-9 w-full rounded-md border border-input bg-transparent px-9 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setSearchResults([]);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {(searching || searchResults.length > 0) && (
                    <div className="max-h-[160px] overflow-y-auto rounded-md border border-border">
                      {searching ? (
                        <div className="flex items-center justify-center py-3">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        searchResults.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {user.image ? (
                                <img
                                  src={user.image}
                                  alt=""
                                  className="h-7 w-7 rounded-full shrink-0"
                                />
                              ) : (
                                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium shrink-0">
                                  {(user.name?.[0] || user.email[0]).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {user.name || "Unnamed"}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 shrink-0"
                              onClick={() => handleAddUser(user)}
                              disabled={addingUser === user.id}
                            >
                              {addingUser === user.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <UserPlus className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        ))
                      )}
                      {!searching && searchResults.length === 0 && searchQuery.length >= 2 && (
                        <p className="text-xs text-muted-foreground text-center py-3">
                          No users found
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {sharedUsers.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Shared with ({sharedUsers.length})
                  </label>
                  <div className="max-h-[180px] overflow-y-auto space-y-1">
                    {sharedUsers.map((user) => (
                      <div
                        key={user.shareId}
                        className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {user.image ? (
                            <img
                              src={user.image}
                              alt=""
                              className="h-7 w-7 rounded-full shrink-0"
                            />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium shrink-0">
                              {(user.name?.[0] || user.email[0]).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {user.name || "Unnamed"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveUser(user.shareId)}
                          disabled={removingUser === user.shareId}
                        >
                          {removingUser === user.shareId ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <X className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex-1 min-w-0 rounded-md border border-input bg-muted/30 px-3 py-2 overflow-hidden">
                <p className="text-xs text-muted-foreground truncate">
                  {shareLink}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 shrink-0"
                onClick={copyLink}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
