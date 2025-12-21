"use client"

import React, { useState, useContext } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Users, Copy, Check, Share2, UserPlus, LogOut } from 'lucide-react'
import { RendererContext } from '@/app/room/[roomId]/page'

interface ShareButtonProps {
    roomId: string;
}

const ShareButton = ({ roomId }: ShareButtonProps) => {
    const [isJoined, setIsJoined] = useState(false);
    const [copied, setCopied] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const { renderer } = useContext(RendererContext);

    const handleJoin = () => {
        if (renderer) {
            const wsUrl = `ws://localhost:8080/api/join/${roomId}`;
            renderer.initializeSocket(wsUrl);
            setIsJoined(true);
        }
        setDropdownOpen(false);
    };

    const handleLeave = () => {
        // TODO: Add disconnect logic when available in renderer
        setIsJoined(false);
        setDropdownOpen(false);
    };

    const handleShare = () => {
        setDialogOpen(true);
        setDropdownOpen(false);
    };

    const handleCopy = () => {
        const url = `${window.location.origin}/room/${roomId}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/room/${roomId}`;

    return (
        <>
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="default"
                        size="icon"
                        className="absolute top-4 right-4 z-50 h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                        <Users className="h-5 w-5 text-white" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2 bg-zinc-900/95 backdrop-blur-sm border-zinc-800">
                    {!isJoined ? (
                        <DropdownMenuItem
                            onClick={handleJoin}
                            className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors"
                        >
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600/20">
                                <UserPlus className="h-4 w-4 text-green-500" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-medium text-zinc-100">Join Room</span>
                                <span className="text-xs text-zinc-500">Connect with collaborators</span>
                            </div>
                        </DropdownMenuItem>
                    ) : (
                        <>
                            <DropdownMenuItem
                                onClick={handleShare}
                                className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors"
                            >
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600/20">
                                    <Share2 className="h-4 w-4 text-blue-500" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-medium text-zinc-100">Share Room</span>
                                    <span className="text-xs text-zinc-500">Invite others to join</span>
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={handleLeave}
                                className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors mt-1"
                            >
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-600/20">
                                    <LogOut className="h-4 w-4 text-red-500" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-medium text-zinc-100">Leave Room</span>
                                    <span className="text-xs text-zinc-500">Disconnect from session</span>
                                </div>
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
                            <Share2 className="h-5 w-5 text-blue-500" />
                            Share Room
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Copy the link below to invite others to collaborate with you.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 pt-4">
                        <div className="flex items-center gap-2">
                            <div className="flex-1 px-4 py-3 bg-zinc-800/50 rounded-lg border border-zinc-700 text-sm text-zinc-300 truncate font-mono">
                                {shareUrl}
                            </div>
                            <Button
                                onClick={handleCopy}
                                variant="default"
                                className={`shrink-0 w-28 transition-all duration-200 ${copied
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                {copied ? (
                                    <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy
                                    </>
                                )}
                            </Button>
                        </div>
                        <p className="text-xs text-zinc-500 text-center">
                            Anyone with this link can join your room and collaborate in real-time.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default ShareButton