import React, { useContext, useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { RendererContext } from '@/components/renderer-context'
import { Spinner } from '@/components/ui/spinner';
import { Users } from 'lucide-react';

interface CollaborateProps {
    roomId: string;
    isAuthed: boolean;
    signInAction: (formData: FormData) => Promise<void>;
    signOutAction: (formData: FormData) => Promise<void>;
    token: string | undefined;
}

const Collaborate = ({ roomId, isAuthed, signInAction, signOutAction, token }: CollaborateProps) => {
    const [isJoined, setIsJoined] = useState(false);
    const { renderer } = useContext(RendererContext);
    const [loading, setLoading] = useState(false);

    const handleJoin = () => {
        if (renderer) {
            const wsUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/join/${roomId}?token=${token}`;
            setLoading(true);
            renderer.initializeSocket(wsUrl, setLoading);
            setIsJoined(true);
        }
    }

    const handleLeave = () => {
        if (renderer) {
            renderer.closeSocket(setLoading);
            setIsJoined(false);
        }
    }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
            size="icon"
            className='absolute top-4 right-4 z-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200'
            aria-label="Open collaboration menu"
        >
            <Users className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className='px-1'>
        <div className='flex flex-col gap-2 p-1 items-center'>
            {isAuthed && (
                <>
                    <form action={signOutAction} className="w-full">
                        <Button
                            type="submit"
                            size="sm"
                            variant="outline"
                            className="w-full"
                        >
                            Sign out
                        </Button>
                    </form>
                    <Separator/>
                </>
            )}
            {!isAuthed && (
                <>
                    <form action={signInAction} className="w-full">
                        <Button
                            type="submit"
                            size="sm"
                            className='w-full bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200'
                        >
                            Sign in with Google
                        </Button>
                    </form>
                    <Separator/>
                </>
            )}
            {
                (!loading && isJoined) ? (
                    <>
                        <div className='flex flex-col gap-2 items-center'>
                            <Button
                             size='sm' 
                             className='bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200'
                             onClick={() => {
                                navigator.clipboard.writeText(`http://localhost:3000/canvas/${roomId}?token=${token}`);
                                toast.success("Copied to clipboard", {
                                    className: "bg-gradient-to-br from-blue-600 to-purple-600 text-white border-none",
                                    description: "Share the link to invite others."
                                });
                             }}
                            >
                                Share
                            </Button>
                            <p className='text-xs text-center'>Share the link to invite others to join the session.</p>
                        </div>
                        <Separator/>
                        <Button
                         size='sm'
                         variant="destructive"
                         onClick={() => {
                             handleLeave();
                         }}
                        >
                            Leave Session
                        </Button>
                        <p className='text-xs text-center'>Leave the session to disconnect from the session.</p>
                    </>
                ) : (
                    <>
                        {
                            loading? (
                                <Spinner/>
                            ) : (
                                isAuthed ? (
                                    <Button
                                        size='sm'
                                        className='w-full bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200'
                                        onClick={() => {
                                            handleJoin();
                                        }}
                                    >
                                        Collaborate
                                    </Button>
                                ) : (
                                    <form action={signInAction} className="w-full">
                                        <Button
                                            type="submit"
                                            size='sm'
                                            className='w-full bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200'
                                        >
                                            Collaborate
                                        </Button>
                                    </form>
                                )
                            )
                        } 
                        <p className='text-xs text-center'>Start a session to invite others to collaborate with you.</p>
                    </>
                )
            }
            
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default Collaborate