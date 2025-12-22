import React, { useContext, useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { RendererContext } from '@/app/room/[roomId]/page'
import { Spinner } from '@/components/ui/spinner';

const Collaborate = ({ roomId }: { roomId: string }) => {
    const [isJoined, setIsJoined] = useState(false);
    const { renderer } = useContext(RendererContext);
    const [loading, setLoading] = useState(false);

    const handleJoin = () => {
        if (renderer) {
            const wsUrl = `ws://localhost:8080/api/join/${roomId}`;
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
        <Button className='absolute top-4 right-4 bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200'>
            Collaborate
        </Button>
      </PopoverTrigger>
      <PopoverContent className='px-1'>
        <div className='flex flex-col gap-2 p-1 items-center'>
            {
                (!loading && isJoined) ? (
                    <>
                        <div className='flex flex-col gap-2 items-center'>
                            <Button
                             size='sm' 
                             className='bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200'
                             onClick={() => {
                                navigator.clipboard.writeText(`http://localhost:3000/room/${roomId}`);
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
                                <Button
                                    size='sm'
                                    className='bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200'
                                    onClick={() => {
                                        handleJoin();
                                    }}
                                >
                                    Start session
                                </Button>
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