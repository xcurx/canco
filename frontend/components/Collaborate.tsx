import { useContext, useEffect, useState, useRef } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator';
import { RendererContext } from '@/components/renderer-context'
import { Spinner } from '@/components/ui/spinner';
import { Users } from 'lucide-react';
import ShareDialog from './ShareDialog';

interface CollaborateProps {
    roomId: string;
    isAuthed: boolean;
    isOwner: boolean;
    signInAction: (formData: FormData) => Promise<void>;
    signOutAction: (formData: FormData) => Promise<void>;
    token: string | undefined;
}

const Collaborate = ({ roomId, isAuthed, isOwner, signInAction, signOutAction, token }: CollaborateProps) => {
    const [isJoined, setIsJoined] = useState(false);
    const [activeRoomId, setActiveRoomId] = useState<string>(roomId);
    const { renderer } = useContext(RendererContext);
    const [loading, setLoading] = useState(false);

    const handleJoin = () => {
        if (renderer) {
            let joinRoomId = roomId;
            if (!isAuthed && roomId === "local") {
                joinRoomId = window.crypto.randomUUID();
            }
            setActiveRoomId(joinRoomId);
            let wsUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/join/${joinRoomId}`;
            if (isAuthed && token) {
                wsUrl += `?token=${token}`;
            }
            setLoading(true);
            renderer.initializeSocket(wsUrl, setLoading);
            setIsJoined(true);
            
            if (!isAuthed && roomId === "local") {
                window.history.pushState({}, "", `/canvas/local/${joinRoomId}`);
            }
        }
    }

    const handleLeave = () => {
        if (renderer) {
            renderer.closeSocket(setLoading);
            setIsJoined(false);
        }
    }

    const hasJoined = useRef(false);

    useEffect(() => {
        console.log("Checking auto-join conditions:", { roomId, isAuthed, hasJoined: hasJoined.current, rendererExists: !!renderer });
        
        if (!renderer) return;

        if ((roomId !== "local" || isAuthed) && !hasJoined.current) {
            console.log("Auto-joining room:", roomId);
            hasJoined.current = true;
            handleJoin();
        }
    }, [roomId, isAuthed, renderer])

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
                        <div className='flex flex-col gap-2 items-center w-full'>
                            <ShareDialog roomId={activeRoomId} isLocal={!isAuthed && roomId === "local"} isOwner={isOwner} />
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
                                    <>
                                    <Button
                                        size='sm'
                                        className='w-full bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200'
                                        onClick={() => {
                                            handleJoin();
                                        }}
                                    >
                                        Collaborate
                                    </Button>
                                    </>
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