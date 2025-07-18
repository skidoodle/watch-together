"use client"

import { useRef, useState } from "react"
import { useWebsocket } from "@/hooks/useWebsocket"
import { Screensaver } from "@/components/Screensaver"
import { type Video, sendWebsocketMessage } from "@/websocket"
import ReactPlayer from "react-player"

export function VideoPlayer() {
    const lastSeekRef = useRef<number>(0)
    const playerRef = useRef<HTMLVideoElement | null>(null)
    const [volume, setVolume] = useState<number>(0)
    const [queueLength, setQueueLength] = useState<number>(0)
    const [currentVideo, setCurrentVideo] = useState<Video | null>(null)

    useWebsocket({
        room: ({ room: { video, queue } }: { room: { video: Video, queue: Video[] } }) => {
            if (lastSeekRef.current !== video.timestamp && playerRef.current) {
                playerRef.current.currentTime = video.timestamp
            }
            setCurrentVideo(video)
            setQueueLength(queue.length)
        }
    })

    function handleUnpause() {
        sendWebsocketMessage("unpause")
    }

    function handlePause() {
        sendWebsocketMessage("pause")
    }

    function handleSeek() {
        const timestamp = Math.round(playerRef.current?.currentTime ?? 0)

        sendWebsocketMessage("seek", timestamp.toString())
        lastSeekRef.current = timestamp
    }

    function handleEnd() {
        sendWebsocketMessage("ended")

        if(queueLength > 0) sendWebsocketMessage("skip")
    }

    return(
        <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/40 rounded-xl overflow-hidden">
            <div className="relative aspect-video bg-black">
                {
                    currentVideo ? (
                        <ReactPlayer
                            ref={playerRef}
                            src={currentVideo?.url}
                            controls
                            style={{ width: "100%", height: "100%" }}
                            playing={currentVideo?.state === "playing"}
                            volume={volume}
                            onVolumeChange={() => setVolume(playerRef.current?.volume ?? 0)}
                            onPlay={handleUnpause}
                            onPause={handlePause}
                            onSeeked={handleSeek}
                            onEnded={handleEnd}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <Screensaver />
                    )
                }
            </div>
        </div>
    )
}
